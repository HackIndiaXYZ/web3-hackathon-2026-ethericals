# ⚡ SharpKit — Plug-and-Play Sharp Token Integration Layer

> Like Stripe, but for a Web3 loyalty token. Add Earn / Spend / Buy Sharp Token to any app in under 5 minutes.

Built for **HackIndia Web3 2026** by team **Ethericals**.

---

## What is SharpKit?

SharpKit is a developer-first integration layer for **Sharp Token (SHRP)** — an ERC20 loyalty token on Ethereum Sepolia. It gives any app instant access to:

- **Earn** — reward users with SHRP tokens via a simple API call
- **Spend** — deduct tokens with automatic balance checks
- **Buy** — let users buy tokens via mock card payment or real MetaMask on Sepolia
- **SDK** — a 3-line JavaScript snippet to integrate everything above

---

## Architecture

```
web3-hackathon-2026-ethericals/
├── contracts/
│   └── SharpToken.sol         ERC20 SHRP token (OZ 5.x, mintable, burnable)
├── scripts/
│   └── deploy.js              Hardhat deploy → writes ABI to frontend/
├── backend/
│   ├── server.js              Express app (port 4000), API key auth, rate limiting, logger
│   ├── store.js               In-memory ledger (balances, txLog, rules, merchants, webhooks)
│   ├── contract.js            Ethers v6 singleton (provider, wallet, contract instance)
│   └── routes/
│       ├── earn.js            POST /api/earn  (+ fire-and-forget on-chain mint)
│       ├── spend.js           POST /api/spend
│       ├── buy.js             POST /api/buy/mock + /api/buy/verify-crypto (on-chain verified)
│       ├── balance.js         GET /api/balance/:userId + rules CRUD + txlog
│       ├── merchants.js       GET/POST/DELETE /api/merchants
│       ├── keys.js            GET/POST/DELETE /api/keys
│       └── webhooks.js        GET/POST/DELETE /api/webhooks
├── frontend/
│   ├── index.html             Dashboard UI (glassmorphism dark theme)
│   ├── portal.html            Developer portal (keys, webhooks, analytics)
│   ├── marketplace.html       Merchant marketplace
│   ├── demo.html              Interactive SDK examples
│   ├── style.css              Full CSS — no framework
│   └── app.js                 Vanilla JS — all API calls, MetaMask, rules
├── sdk/
│   └── sharpkit.js            Browser/CJS/AMD SDK — 5 methods
├── widget/
│   └── sharpkit-widget.js     Embeddable floating balance + earn/spend panel
├── hardhat.config.js
├── package.json
└── .env.example
```

### Request Flow

```
Browser / SDK / Widget
        │
        ▼
  Express (port 4000)
  ├── API key auth (x-api-key header)
  ├── Rate limiter (100 req/min global, 20 req/min earn/spend/buy)
        │
        ▼
  store.js (in-memory ledger)
  ├── credit / debit balances
  ├── append to txLog
  └── fire webhooks (async)
        │
        ▼ (async, non-blocking for earn)
  Sepolia (ethers v6)
  ├── earn  → SharpToken.mint() to treasury (fire-and-forget)
  └── buy   → provider.waitForTransaction() 30s poll + amount check
```

---

## Quick Start (Demo — No Crypto Needed)

```bash
# 1. Clone and install
git clone https://github.com/HackIndiaXYZ/web3-hackathon-2026-ethericals
cd web3-hackathon-2026-ethericals
npm install

# 2. Create .env
cp .env.example .env
# No changes needed for demo — defaults work out of the box

# 3. Start backend
node backend/server.js
# → Running at http://localhost:4000

# 4. Open dashboard
open http://localhost:4000
```

Demo API key: `test_key` (pre-seeded, works immediately).

---

## Full Setup with Real Blockchain (Sepolia)

### Prerequisites

| Tool | Version | Purpose |
|---|---|---|
| Node.js | 18+ | Runtime |
| MetaMask | Latest | Browser wallet for Buy with Crypto |
| Alchemy / Infura account | — | Sepolia RPC endpoint |
| Etherscan account | — | Contract verification (optional) |

### Step 1 — Get a Sepolia RPC URL

1. Go to [alchemy.com](https://alchemy.com) → Create account → **Create App**
2. Select **Ethereum → Sepolia**
3. Copy the **HTTPS** endpoint URL
   ```
   https://eth-sepolia.g.alchemy.com/v2/YOUR_API_KEY
   ```

### Step 2 — Get a Deployer Wallet Private Key

> **Never use your main wallet.** Create a dedicated deployer wallet.

1. Open MetaMask → Create a new account
2. Go to **Account Details → Export Private Key**
3. Copy the key (64-char hex, no `0x` prefix needed)
4. Fund it with Sepolia ETH from [sepoliafaucet.com](https://sepoliafaucet.com)

### Step 3 — Get an Etherscan API Key (optional, for verification)

1. Go to [etherscan.io](https://etherscan.io) → Sign up → **API Keys** → Create
2. Copy the key

### Step 4 — Configure `.env`

```bash
cp .env.example .env
```

Edit `.env`:
```env
# Blockchain
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY_HERE
PRIVATE_KEY=your64chardeployerprivatekeyhere
ETHERSCAN_API_KEY=youretherscanapikeyhere

# Backend
PORT=4000
SHARP_TOKEN_ADDRESS=                    # fill after deploying contract
TREASURY_PRIVATE_KEY=                   # same as PRIVATE_KEY for demo

# API Keys (comma-separated — add your own keys here)
API_KEYS=test_key,demo_key_123,your_custom_key
```

### Step 5 — Compile and Deploy the Contract

```bash
# Compile
npm run compile

# Deploy to Sepolia
npm run deploy:sepolia
```

Output:
```
Deploying with: 0xYourWalletAddress
SharpToken deployed to: 0xAbC123...
ABI written to frontend/SharpToken.json
Update .env: SHARP_TOKEN_ADDRESS=0xAbC123...
```

Copy the deployed address into `.env`:
```env
SHARP_TOKEN_ADDRESS=0xAbC123...
```

### Step 6 — Verify on Etherscan (optional)

```bash
npx hardhat verify --network sepolia 0xAbC123... "0xYourWalletAddress"
```

### Step 7 — Start Backend

```bash
node backend/server.js
# → SharpKit backend running on http://localhost:4000
```

### Step 8 — Open Dashboard

```
http://localhost:4000
```

Enter your API key in the header bar. Start rewarding users.

---

## API Reference

All endpoints require the header:
```
x-api-key: your_api_key
```

Or query param: `?apiKey=your_api_key`

---

### POST `/api/earn`
Reward a user with SHRP tokens.

**Request:**
```json
{ "userId": "user123", "amount": 50, "reason": "daily_login" }
```

**Response:**
```json
{
  "success": true,
  "tx": {
    "id": "uuid",
    "type": "earn",
    "userId": "user123",
    "amount": 50,
    "reason": "daily_login",
    "newBalance": 300,
    "timestamp": "2026-05-27T..."
  }
}
```

---

### POST `/api/spend`
Deduct SHRP from a user. Returns 402 if balance insufficient.

**Request:**
```json
{ "userId": "user123", "amount": 20, "reason": "redeem_discount" }
```

**Response:**
```json
{
  "success": true,
  "tx": { "type": "spend", "amount": 20, "newBalance": 280, ... }
}
```

**Insufficient balance:**
```json
{ "success": false, "error": "Insufficient balance", "balance": 10, "required": 20 }
```

---

### GET `/api/balance/:userId`
Get a user's current balance.

**Response:**
```json
{ "userId": "user123", "balance": 280 }
```

---

### POST `/api/buy/mock`
Simulated fiat purchase (Razorpay/card mock). 500ms delay simulates gateway.

**Request:**
```json
{ "userId": "user123", "amount": 100, "currency": "INR", "paymentMethod": "card" }
```

**Response:**
```json
{
  "success": true,
  "tx": { "type": "buy_fiat", "amount": 100, "mockPaymentId": "pay_mock_abc123", ... }
}
```

---

### POST `/api/buy/verify-crypto`
Credits tokens after a real Sepolia MetaMask transaction. Verifies the txHash on-chain — polls up to 30s for confirmation and checks ETH value matches claimed SHRP (rate: 1000 SHRP = 1 ETH).

**Request:**
```json
{ "userId": "user123", "txHash": "0xabc...64chars", "amount": 1000 }
```

**Response (confirmed):**
```json
{
  "success": true,
  "tx": { "type": "buy_crypto", "txHash": "0xabc...", "network": "sepolia", "blockNumber": 7654321, "verified": true, ... }
}
```

**Response (not yet mined — retry in 15s):**
```
HTTP 202
{ "success": false, "status": "pending", "message": "Transaction not yet confirmed. Retry in 15s." }
```

**Response (amount mismatch / fraud):**
```
HTTP 400
{ "success": false, "error": "Amount mismatch: tx sent 0.001 ETH, expected ~1 ETH for 1000 SHRP" }
```

---

### GET `/api/balance/txlog/all?limit=50`
Recent transaction log (max 500).

---

### GET `/api/balance/admin/all`
All user balances (admin view).

**Response:**
```json
{ "balances": { "user123": 300, "alice": 1000, "bob": 75 } }
```

---

### GET `/api/balance/rules/all`
List all reward rules.

---

### POST `/api/balance/rules/create`
Create a new reward rule.

**Request:**
```json
{ "name": "Daily Login", "event": "daily_login", "reward": 5 }
```

---

### DELETE `/api/balance/rules/:id`
Delete a rule by ID.

---

### GET `/api/merchants`
List all registered merchants (public — no auth).

**Response:**
```json
{
  "merchants": [
    { "id": "m_abc", "name": "StyleStore", "category": "Fashion", "rewardRate": 2, "perk": "2x SHRP on every purchase" }
  ],
  "count": 4
}
```

---

### POST `/api/merchants`
Register a new merchant (auth required).

**Request:**
```json
{ "name": "MyStore", "category": "Tech", "description": "...", "rewardRate": 1, "perk": "Earn 1 SHRP per ₹1", "url": "https://mystore.com" }
```

---

### DELETE `/api/merchants/:id`
Remove a merchant (auth required).

---

### GET `/api/keys`
List all API keys (masked). Auth required.

**Response:**
```json
{ "keys": [{ "key": "sk_••••••••••••••••", "name": "Production", "active": true }] }
```

---

### POST `/api/keys`
Generate a new API key. Auth required.

**Request:**
```json
{ "name": "Production" }
```

**Response:**
```json
{ "success": true, "key": { "key": "sk_abc123...", "name": "Production", "active": true } }
```

---

### DELETE `/api/keys/:key`
Revoke an API key. Auth required.

---

### GET `/api/webhooks`
List registered webhooks. Auth required.

---

### POST `/api/webhooks`
Register a webhook callback. Fired on earn/spend/buy events. Auth required.

**Request:**
```json
{ "url": "https://your-server.com/webhook", "events": ["earn", "spend"] }
```

Allowed events: `"earn"`, `"spend"`, `"buy_fiat"`, `"buy_crypto"`, `"*"` (all).

---

### DELETE `/api/webhooks/:id`
Remove a webhook. Auth required.

---

### GET `/api/analytics`
Usage statistics. Auth required.

**Response:**
```json
{
  "totalUsers": 3,
  "totalShrp": 1325,
  "totalTxs": 12,
  "byType": { "earn": 8, "spend": 3, "buy_fiat": 1 },
  "byDay": { "2026-05-27": 12 },
  "topUsers": [["alice", 1000], ["user123", 250], ["bob", 75]]
}
```

---

### GET `/api/health`
```json
{ "status": "ok", "version": "2.0.0" }
```

---

## SDK Usage

```html
<!-- Include in any HTML page -->
<script src="http://localhost:4000/sdk/sharpkit.js"></script>
<script>
  // Initialize once
  SharpKit.init({ apiKey: "test_key", baseUrl: "http://localhost:4000" });

  // Reward a user
  const result = await SharpKit.reward("user123", 50, "daily_login");

  // Deduct tokens
  await SharpKit.spend("user123", 20, "redeem_discount");

  // Check balance
  const { balance } = await SharpKit.getBalance("user123");

  // Mock card purchase
  await SharpKit.buyWithFiat("user123", 100, "upi");

  // After MetaMask tx — credit off-chain
  await SharpKit.verifyCryptoPurchase("user123", txHash, 100);
</script>
```

**Node.js / CommonJS:**
```js
const SharpKit = require("./sdk/sharpkit");
SharpKit.init({ apiKey: "test_key", baseUrl: "http://localhost:4000" });
const { tx } = await SharpKit.reward("user123", 50);
```

---

## Widget Embed

Add a floating SharpKit panel to any webpage in one line:

```html
<script
  src="http://localhost:4000/widget/sharpkit-widget.js"
  data-api-key="test_key"
  data-user-id="user123"
  data-base-url="http://localhost:4000">
</script>
```

The widget auto-injects a purple floating button (bottom-right). Clicking it opens a panel with 4 tabs: **Activity**, **Earn**, **Redeem**, and **Buy** (fiat + MetaMask).

Or configure via `window.SharpKitConfig` before the script tag:
```html
<script>
  window.SharpKitConfig = { apiKey: "test_key", userId: "user123", baseUrl: "http://localhost:4000" };
</script>
<script src="http://localhost:4000/widget/sharpkit-widget.js"></script>
```

---

## On-Chain Behavior

### Earn → fire-and-forget mint

When `/api/earn` is called, the off-chain ledger is updated instantly (< 5ms). Then, asynchronously and without blocking the response, `SharpToken.mint(treasuryAddress, amount, reason)` is submitted to Sepolia. Watch for the mint hash in server logs:

```
[earn] On-chain mint submitted: 0xabc123... (50 SHRP, reason: daily_login)
```

The mint goes to the **treasury address** (the wallet that owns the contract). The off-chain ledger tracks per-user balances; the on-chain mint provides a tamper-proof audit trail.

### Buy with Crypto → blocking 30s poll

When `/api/buy/verify-crypto` is called with a txHash, the backend:
1. Calls `provider.waitForTransaction(txHash, 1, 30_000)` — polls Sepolia until the tx mines (up to 30s)
2. Checks receipt status (rejects reverted txs)
3. Fetches the tx and verifies ETH value matches claimed SHRP at rate **1000 SHRP = 1 ETH** (±1% tolerance)
4. Credits off-chain ledger only if all checks pass

If the tx is still pending after 30s, returns `HTTP 202` — the frontend should retry.

---

## npm Scripts

```bash
npm run backend          # Start Express server (port 4000)
npm run compile          # Hardhat compile contracts
npm run deploy:sepolia   # Deploy SharpToken to Sepolia
npm run deploy:local     # Deploy to local Hardhat node
npm run node             # Start local Hardhat node
```

---

## Env Variables Reference

| Variable | Default | Required | Purpose |
|---|---|---|---|
| `PORT` | `4000` | No | Backend port |
| `API_KEYS` | `test_key,demo_key_123` | No | Comma-separated valid API keys |
| `SEPOLIA_RPC_URL` | — | For deploy | Alchemy/Infura Sepolia HTTPS URL |
| `PRIVATE_KEY` | — | For deploy | Deployer wallet private key |
| `ETHERSCAN_API_KEY` | — | Optional | For `hardhat verify` |
| `SHARP_TOKEN_ADDRESS` | — | After deploy | Deployed contract address |
| `TREASURY_PRIVATE_KEY` | — | For on-chain mint | Wallet that owns the contract |

---

## Pre-seeded Demo Data

The in-memory store starts with:

| User | Balance |
|---|---|
| `user123` | 250 SHRP |
| `alice` | 1000 SHRP |
| `bob` | 75 SHRP |

Rules pre-loaded: **Daily Login (+5 SHRP)**, **First Purchase (+50 SHRP)**.

---

## Common Errors

| Error | Cause | Fix |
|---|---|---|
| `Invalid or missing API key` | Wrong/missing `x-api-key` header | Use `test_key` for demo |
| `Insufficient balance` | User has less than requested | Earn tokens first |
| `MetaMask not found` | No browser wallet | Install MetaMask extension |
| `Switch to Sepolia` | Wrong MetaMask network | Settings → Networks → Sepolia |
| `ECONNREFUSED` | Backend not running | `node backend/server.js` |
| `Cannot find module` | `npm install` not run | `npm install` |

---

## Team

**Ethericals** — HackIndia Web3 2026
