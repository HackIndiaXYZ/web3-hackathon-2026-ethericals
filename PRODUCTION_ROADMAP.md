# SharpKit — Production Roadmap
### From Hackathon to Industry-Grade

---

## The Honest Gap

| What we have | What production needs |
|---|---|
| In-memory store (resets on restart) | Persistent database |
| Hardcoded API keys in `.env` | Proper key management + rotation |
| No user login/signup | Auth system with JWTs |
| `localhost:4000` hardcoded | Environment-aware config |
| No tests | Test suite (unit + integration + e2e) |
| Single server process | Load-balanced, auto-scaling deployment |
| No error tracking | Monitoring + alerting |
| No logs beyond console.log | Structured logging + log aggregation |
| Fire-and-forget blockchain | Reliable job queue for on-chain ops |
| No email/notifications | Transactional email system |
| Manual deploys | CI/CD pipeline |

---

## Phase 1 — Foundation (Week 1–2)
*Get the basics production-ready before adding features.*

---

### Step 1 — Replace In-Memory Store with PostgreSQL

**Why PostgreSQL?**
Your current `store.js` is a JavaScript Map. When the server restarts (which happens on every deploy, crash, or cloud instance restart), all user balances, transactions, and rules are wiped. PostgreSQL is a battle-tested relational database that persists data to disk.

**Install:**
```bash
npm install pg drizzle-orm drizzle-kit
# pg = PostgreSQL client
# drizzle-orm = type-safe query builder (modern alternative to Sequelize)
# drizzle-kit = migrations tool
```

**Schema — create `backend/db/schema.js`:**
```js
import { pgTable, uuid, varchar, numeric, timestamp, boolean, text } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id:        uuid('id').defaultRandom().primaryKey(),
  externalId: varchar('external_id', { length: 255 }).unique().notNull(), // your "userId" string
  balance:   numeric('balance', { precision: 18, scale: 6 }).default('0').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const transactions = pgTable('transactions', {
  id:        uuid('id').defaultRandom().primaryKey(),
  userId:    uuid('user_id').references(() => users.id).notNull(),
  type:      varchar('type', { length: 50 }).notNull(),   // earn | spend | buy_fiat | buy_crypto
  amount:    numeric('amount', { precision: 18, scale: 6 }).notNull(),
  reason:    varchar('reason', { length: 255 }),
  txHash:    varchar('tx_hash', { length: 66 }),
  blockNumber: numeric('block_number'),
  verified:  boolean('verified').default(false),
  newBalance: numeric('new_balance').notNull(),
  createdAt: timestamp('created_at').defaultNow(),
});

export const apiKeys = pgTable('api_keys', {
  id:        uuid('id').defaultRandom().primaryKey(),
  name:      varchar('name', { length: 255 }).notNull(),
  keyHash:   varchar('key_hash', { length: 64 }).unique().notNull(), // SHA-256 of actual key
  prefix:    varchar('prefix', { length: 12 }).notNull(),            // "sk_live_abc1" visible part
  merchantId: uuid('merchant_id').notNull(),
  active:    boolean('active').default(true),
  lastUsedAt: timestamp('last_used_at'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const rules = pgTable('rules', {
  id:        uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  name:      varchar('name', { length: 255 }).notNull(),
  event:     varchar('event', { length: 255 }).notNull(),
  reward:    numeric('reward').notNull(),
  active:    boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});

export const webhooks = pgTable('webhooks', {
  id:        uuid('id').defaultRandom().primaryKey(),
  merchantId: uuid('merchant_id').notNull(),
  url:       text('url').notNull(),
  events:    text('events').array().notNull(),   // ['earn', 'spend']
  secret:    varchar('secret', { length: 64 }), // for HMAC signature
  active:    boolean('active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
});
```

**Key change:** Replace `store.js` functions one by one. The API routes stay identical — only the data layer changes.

```js
// OLD store.js:
function credit(userId, amount) {
  const bal = balances.get(userId) || 0;
  balances.set(userId, bal + amount);
  return bal + amount;
}

// NEW db equivalent:
async function credit(externalUserId, amount) {
  // Upsert user, atomically increment balance
  const result = await db.execute(sql`
    INSERT INTO users (external_id, balance)
    VALUES (${externalUserId}, ${amount})
    ON CONFLICT (external_id)
    DO UPDATE SET balance = users.balance + ${amount}
    RETURNING balance
  `);
  return result.rows[0].balance;
}
```

**Where to host PostgreSQL:**
- **Development:** `brew install postgresql` or Docker `docker run -p 5432:5432 postgres`
- **Production:** Neon (free tier, serverless Postgres), Supabase, or Railway Postgres

---

### Step 2 — Proper Auth System (Merchants + End Users)

Right now anyone who knows `test_key` has full access. Production needs two separate auth layers.

**Layer 1 — Merchant Authentication (who is calling the API)**

Use [Clerk](https://clerk.com) or [Auth0](https://auth0.com) for merchant sign-up/login, then issue API keys from your portal.

```
Merchant signs up at sharpkit.io
  → Gets a dashboard account (managed by Clerk)
  → Generates API keys in the portal
  → Uses those keys to call POST /api/earn etc.
```

**API Key best practices:**
```js
import crypto from 'crypto';

function generateApiKey() {
  const raw = crypto.randomBytes(32).toString('hex');
  const prefix = 'sk_live_';
  const key = prefix + raw;          // shown to user ONCE
  const hash = crypto
    .createHash('sha256')
    .update(key)
    .digest('hex');                  // stored in DB (never the raw key)
  return { key, hash, prefix: key.slice(0, 16) };
}

// Validation on each request:
function validateApiKey(rawKey) {
  const hash = crypto.createHash('sha256').update(rawKey).digest('hex');
  return db.query('SELECT * FROM api_keys WHERE key_hash = $1 AND active = true', [hash]);
}
```

**Why hash the key?** If your database is ever leaked, attackers get hashes — useless without the originals. The real key is only ever shown once at generation time (like GitHub personal access tokens).

**Layer 2 — End User Identity**

Your current API takes `userId` as a plain string — any caller can pass any userId and modify that user's balance. In production, the SDK should attach a signed token proving the end user's identity.

```
Option A (simple): Merchant backend signs userId claims
  → Merchant backend: jwt.sign({ userId: "user123" }, MERCHANT_SECRET)
  → SDK sends this JWT
  → SharpKit backend verifies JWT signature

Option B (Privy/Magic): Wallet-based identity
  → User signs in with their wallet or email
  → SharpKit verifies on-chain ownership
```

---

### Step 3 — Environment Configuration

**Install:**
```bash
npm install @t3-oss/env-core zod
```

**Create `backend/env.js`:**
```js
import { createEnv } from '@t3-oss/env-core';
import { z } from 'zod';

export const env = createEnv({
  server: {
    NODE_ENV:             z.enum(['development', 'production', 'test']),
    PORT:                 z.coerce.number().default(4000),
    DATABASE_URL:         z.string().url(),
    SEPOLIA_RPC_URL:      z.string().url(),
    TREASURY_PRIVATE_KEY: z.string().startsWith('0x').length(66),
    SHARP_TOKEN_ADDRESS:  z.string().startsWith('0x').length(42),
    JWT_SECRET:           z.string().min(32),
    REDIS_URL:            z.string().url().optional(),
  },
  runtimeEnv: process.env,
});
```

**Why?** If `DATABASE_URL` is missing or malformed, the app crashes at startup with a clear error — not silently failing after your first database call in production at 2am.

---

## Phase 2 — Reliability (Week 2–3)

---

### Step 4 — Job Queue for Blockchain Operations

Right now `earn.js` does a fire-and-forget mint. If it fails (RPC down, gas spike), it's silently lost. Production needs a **job queue** with automatic retries.

**Install:**
```bash
npm install bullmq ioredis
# BullMQ = job queue backed by Redis
# ioredis = Redis client
```

**Create `backend/queues/mintQueue.js`:**
```js
import { Queue, Worker } from 'bullmq';
import { getContract, getWallet } from '../contract.js';

export const mintQueue = new Queue('mint', {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 5,                        // retry up to 5 times
    backoff: { type: 'exponential', delay: 2000 }, // 2s, 4s, 8s, 16s, 32s
  }
});

// Worker processes jobs in the background
export const mintWorker = new Worker('mint', async (job) => {
  const { userId, amount, reason } = job.data;
  const contract = getContract();
  const treasury = await getWallet().getAddress();
  const tx = await contract.mint(
    treasury,
    BigInt(Math.round(amount)) * BigInt('1000000000000000000'),
    reason
  );
  await tx.wait(2); // wait for 2 confirmations
  // Update DB with on-chain proof
  await db.execute(
    'UPDATE transactions SET tx_hash = $1, block_number = $2, verified = true WHERE id = $3',
    [tx.hash, (await tx.getReceipt()).blockNumber, job.data.transactionId]
  );
}, { connection: { url: env.REDIS_URL } });
```

**Usage in earn.js:**
```js
// Instead of fire-and-forget IIFE:
await mintQueue.add('mint', { userId, amount, reason, transactionId: tx.id });
// Returns immediately. BullMQ handles retries, failures, logging.
```

**Why Redis?** Jobs survive server restarts. If your server crashes mid-processing, the job goes back to the queue and gets retried. Without Redis, a crashed server means lost blockchain operations.

---

### Step 5 — Webhook Reliability

Current webhooks are fire-and-forget HTTP calls. If the merchant's server is down, the webhook is lost forever.

**With BullMQ:**
```js
export const webhookQueue = new Queue('webhooks', {
  connection: { url: env.REDIS_URL },
  defaultJobOptions: {
    attempts: 8,
    backoff: { type: 'exponential', delay: 1000 },
  }
});

// Worker
new Worker('webhooks', async (job) => {
  const { url, event, payload, secret } = job.data;

  // HMAC signature (merchant verifies this to confirm it came from SharpKit)
  const sig = crypto
    .createHmac('sha256', secret)
    .update(JSON.stringify(payload))
    .digest('hex');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-SharpKit-Signature': `sha256=${sig}`,
      'X-SharpKit-Event': event,
    },
    body: JSON.stringify(payload),
    signal: AbortSignal.timeout(10_000),
  });

  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  // Failure throws → BullMQ retries automatically
});
```

---

### Step 6 — Structured Logging

`console.log` is not searchable, filterable, or alertable. Replace with a proper logger.

**Install:**
```bash
npm install pino pino-pretty
```

**Create `backend/logger.js`:**
```js
import pino from 'pino';

export const logger = pino({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  transport: process.env.NODE_ENV !== 'production'
    ? { target: 'pino-pretty' }  // pretty in dev
    : undefined,                 // JSON in production (for log aggregators)
});
```

**Usage:**
```js
// Instead of:
console.log(`[earn] On-chain mint submitted: ${tx.hash}`);

// Use:
logger.info({ txHash: tx.hash, userId, amount }, 'on-chain mint submitted');
logger.error({ err, userId, amount }, 'on-chain mint failed');
```

JSON logs in production get ingested by **Datadog**, **Grafana Loki**, or **Logtail** — you can search, filter, set alerts, and build dashboards.

---

## Phase 3 — Observability & Testing (Week 3–4)

---

### Step 7 — Error Tracking

When something breaks in production, you need to know immediately.

**Install:**
```bash
npm install @sentry/node
```

**In `server.js`:**
```js
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: env.SENTRY_DSN,
  environment: env.NODE_ENV,
  tracesSampleRate: 0.1,  // 10% of requests get performance traces
});

// Add BEFORE routes:
app.use(Sentry.Handlers.requestHandler());

// Add AFTER routes, BEFORE error handler:
app.use(Sentry.Handlers.errorHandler());
```

Now every unhandled error in production sends an alert to Sentry with:
- Full stack trace
- Request headers/body
- User context
- Breadcrumbs (what happened before the error)

**Free tier:** 5,000 errors/month — more than enough to start.

---

### Step 8 — Health Checks & Uptime Monitoring

Upgrade the `/api/health` endpoint to actually check all dependencies:

```js
app.get('/api/health', async (req, res) => {
  const checks = {};

  // Check database
  try {
    await db.execute('SELECT 1');
    checks.database = 'ok';
  } catch (e) {
    checks.database = 'error';
  }

  // Check Redis
  try {
    await redis.ping();
    checks.redis = 'ok';
  } catch (e) {
    checks.redis = 'error';
  }

  // Check Ethereum RPC
  try {
    await getProvider().getBlockNumber();
    checks.ethereum = 'ok';
  } catch (e) {
    checks.ethereum = 'error';
  }

  const allOk = Object.values(checks).every(v => v === 'ok');
  res.status(allOk ? 200 : 503).json({
    status: allOk ? 'ok' : 'degraded',
    version: '3.0.0',
    checks,
    uptime: process.uptime(),
  });
});
```

Point **UptimeRobot** (free) at `/api/health` — it pings every 5 minutes and emails you if the site goes down.

---

### Step 9 — Testing

No tests = you can't confidently change anything.

**Install:**
```bash
npm install --save-dev vitest supertest @faker-js/faker
```

**Test structure:**
```
tests/
  unit/
    store.test.js          Pure logic tests
    contract.test.js       Mock ethers.js
  integration/
    earn.test.js           Full HTTP request → response
    spend.test.js
    buy.test.js
  e2e/
    full-flow.test.js      Earn → check balance → spend → verify
```

**Example integration test (`tests/integration/earn.test.js`):**
```js
import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../backend/server.js';

describe('POST /api/earn', () => {
  it('credits SHRP to a user', async () => {
    const res = await request(app)
      .post('/api/earn')
      .set('x-api-key', 'test_key')
      .send({ userId: 'testUser', amount: 100, reason: 'signup' });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tx.amount).toBe(100);
    expect(res.body.tx.newBalance).toBe(100);
  });

  it('rejects invalid amount', async () => {
    const res = await request(app)
      .post('/api/earn')
      .set('x-api-key', 'test_key')
      .send({ userId: 'testUser', amount: -50 });

    expect(res.status).toBe(400);
  });

  it('rejects missing API key', async () => {
    const res = await request(app)
      .post('/api/earn')
      .send({ userId: 'testUser', amount: 50 });

    expect(res.status).toBe(401);
  });
});
```

**Add to `package.json`:**
```json
"scripts": {
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage"
}
```

**Target:** 80%+ coverage on routes and store logic before deploying.

---

## Phase 4 — Deployment (Week 4)

---

### Step 10 — Containerize with Docker

Docker ensures your app runs identically on every machine and cloud provider.

**Create `Dockerfile`:**
```dockerfile
FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM base AS runner
COPY backend/ ./backend/
COPY frontend/ ./frontend/
COPY sdk/ ./sdk/
COPY widget/ ./widget/
EXPOSE 4000
CMD ["node", "backend/server.js"]
```

**Create `docker-compose.yml` (for local dev):**
```yaml
version: '3.9'
services:
  app:
    build: .
    ports:
      - "4000:4000"
    environment:
      - DATABASE_URL=postgresql://postgres:password@db:5432/sharpkit
      - REDIS_URL=redis://redis:6379
    depends_on: [db, redis]

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: sharpkit
      POSTGRES_PASSWORD: password
    volumes:
      - pgdata:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    volumes:
      - redisdata:/data

volumes:
  pgdata:
  redisdata:
```

**Run everything locally:**
```bash
docker-compose up
```

---

### Step 11 — CI/CD with GitHub Actions

Every push to `main` should automatically run tests and deploy.

**Create `.github/workflows/deploy.yml`:**
```yaml
name: Test & Deploy

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test:
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_PASSWORD: test
          POSTGRES_DB: sharpkit_test
        options: --health-cmd pg_isready
      redis:
        image: redis:7
        options: --health-cmd "redis-cli ping"

    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: npm
      - run: npm ci
      - run: npm test
        env:
          DATABASE_URL: postgresql://postgres:test@localhost:5432/sharpkit_test
          REDIS_URL: redis://localhost:6379

  deploy:
    needs: test              # only deploy if tests pass
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Deploy to Render
        run: curl -X POST ${{ secrets.RENDER_DEPLOY_HOOK }}
```

**Workflow:** Push code → GitHub runs tests → if green, deploys automatically → if red, deployment blocked.

---

### Step 12 — Production Hosting

**Recommended stack (all have free tiers):**

| Service | What it runs | Cost |
|---|---|---|
| **Render** | Node.js app (Docker) | Free / $7/mo |
| **Neon** | PostgreSQL | Free / $19/mo |
| **Upstash** | Redis (serverless) | Free / pay-per-use |
| **Cloudflare** | CDN + DDoS protection | Free |
| **Sentry** | Error tracking | Free (5k errors/mo) |
| **UptimeRobot** | Uptime monitoring | Free |

**Total cost to start: $0/month.**

**Environment variables in Render:**
Set these in the Render dashboard (never in code):
```
DATABASE_URL          → From Neon dashboard
REDIS_URL             → From Upstash dashboard
TREASURY_PRIVATE_KEY  → Your wallet key
SEPOLIA_RPC_URL       → From Alchemy
JWT_SECRET            → openssl rand -hex 32
SENTRY_DSN            → From Sentry dashboard
```

---

## Phase 5 — Scale & Features (Month 2+)

---

### Step 13 — Rate Limiting with Redis

Your current rate limiter is in-memory — it doesn't work across multiple server instances. Replace with Redis-backed limiting.

```bash
npm install @upstash/ratelimit @upstash/redis
```

```js
import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(20, '1m'),
});

async function rateLimitMiddleware(req, res, next) {
  const { success, remaining } = await ratelimit.limit(req.ip);
  res.setHeader('X-RateLimit-Remaining', remaining);
  if (!success) return res.status(429).json({ error: 'Rate limit exceeded' });
  next();
}
```

Now rate limiting works correctly across 10 server instances.

---

### Step 14 — Frontend: Move from Vanilla JS to Next.js

For a real product, the frontend needs:
- Server-side rendering (SEO, fast initial load)
- Real auth (login pages, protected routes)
- Type safety

```bash
npx create-next-app@latest sharpkit-frontend --typescript --tailwind --app
```

**Structure:**
```
app/
  (marketing)/
    page.tsx           Landing page
  (dashboard)/
    dashboard/
      page.tsx         The current index.html
    portal/
      page.tsx         The current portal.html
  api/                 Next.js API routes (proxy to backend)
components/
  EarnCard.tsx
  SpendCard.tsx
  TxLog.tsx
lib/
  api.ts               API client (replaces app.js fetch calls)
```

---

### Step 15 — API Versioning

Before you have real customers, add versioning so you can change the API without breaking integrations.

```js
// Mount routes under /v1/
app.use('/v1/earn',    requireApiKey, strictLimiter, earnRoutes);
app.use('/v1/spend',   requireApiKey, strictLimiter, spendRoutes);
app.use('/v1/buy',     requireApiKey, strictLimiter, buyRoutes);
app.use('/v1/balance', requireApiKey, balanceRoutes);

// Old /api/ path redirects for backwards compat
app.use('/api/', (req, res) => res.redirect(301, '/v1' + req.path));
```

When you release breaking changes, deploy `/v2/` and give customers 6 months to migrate.

---

### Step 16 — HTTPS + Custom Domain

Never run production over plain HTTP.

1. Buy a domain (e.g. `sharpkit.io`) on Namecheap — ~$10/year
2. Point DNS to Render
3. Render auto-provisions a Let's Encrypt SSL certificate (free)
4. Force HTTPS redirect:
   ```js
   app.use((req, res, next) => {
     if (req.header('x-forwarded-proto') !== 'https' && env.NODE_ENV === 'production') {
       return res.redirect(301, `https://${req.header('host')}${req.url}`);
     }
     next();
   });
   ```

---

## Complete Production Stack (Summary)

```
┌─────────────────────────────────────────────────────────┐
│                    USERS / MERCHANTS                    │
└───────────────┬─────────────────────────────────────────┘
                │ HTTPS
                ▼
┌───────────────────────────────┐
│   Cloudflare (CDN + DDoS)     │
└───────────────┬───────────────┘
                │
                ▼
┌───────────────────────────────┐
│   Render (Node.js + Docker)   │
│   Express API  — /v1/*        │
│   Next.js UI   — /            │
└────┬──────────┬───────────────┘
     │          │
     ▼          ▼
┌─────────┐  ┌──────────────┐
│  Neon   │  │  Upstash     │
│  (PG)   │  │  (Redis)     │
└─────────┘  └──────┬───────┘
                    │ BullMQ jobs
                    ▼
             ┌────────────────┐
             │  Ethereum      │
             │  Sepolia/Main  │
             └────────────────┘

Monitoring layer (all async, never in request path):
  Sentry        → errors
  Pino + Logtail → logs
  UptimeRobot   → uptime
  GitHub Actions → CI/CD
```

---

## Execution Order

```
Week 1:   Step 1  (PostgreSQL) + Step 3 (env config)
Week 2:   Step 2  (Auth) + Step 6 (logging)
Week 3:   Step 4  (job queue) + Step 5 (webhooks) + Step 7 (Sentry)
Week 4:   Step 8  (health checks) + Step 9 (tests) + Step 10 (Docker)
Week 5:   Step 11 (CI/CD) + Step 12 (deploy to Render)
Month 2:  Steps 13–16 (scale, Next.js, versioning, domain)
```

---

## What changes vs what stays the same

**Stays identical:**
- All 14 API routes (`/api/earn`, `/api/spend`, etc.)
- The SharpToken smart contract
- The SDK interface (`SharpKit.reward()`, `SharpKit.spend()`, etc.)
- The widget
- Rate limiting logic
- On-chain verification logic

**What changes:**
- `store.js` functions get new bodies (DB queries instead of Map operations)
- `server.js` adds Sentry, structured logging, Redis rate limiter
- Blockchain calls go through BullMQ queue instead of fire-and-forget
- Deployment is Docker + Render instead of `node backend/server.js` on your laptop

The beauty of the current architecture is that the swap is surgical — the route handlers don't need to change at all, only the underlying data functions.
