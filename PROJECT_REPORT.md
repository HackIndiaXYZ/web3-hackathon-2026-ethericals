# SharpKit — Complete Project Report
### HackIndia Web3 2026 | Team Ethericals

---

## Table of Contents

1. [The Big Picture — What Problem Does This Solve?](#1-the-big-picture)
2. [Real-Life Analogy — Think of It Like a Loyalty Card](#2-real-life-analogy)
3. [What is a Token? What is Blockchain?](#3-what-is-a-token-what-is-blockchain)
4. [SharpKit's Architecture — How All Pieces Fit](#4-sharpkits-architecture)
5. [The Sharp Token (SHRP) — The Smart Contract](#5-the-sharp-token-shrp)
6. [The Backend — The Brain of SharpKit](#6-the-backend)
7. [The Three Core Flows — Earn, Spend, Buy](#7-the-three-core-flows)
8. [Security — How We Protect Everything](#8-security)
9. [The SDK — Plug-and-Play Integration](#9-the-sdk)
10. [The Widget — Drop-in UI Component](#10-the-widget)
11. [The Dashboard — Control Center](#11-the-dashboard)
12. [The Developer Portal — Power User Tools](#12-the-developer-portal)
13. [The Merchant Marketplace — Ecosystem](#13-the-merchant-marketplace)
14. [Real-World Use Cases](#14-real-world-use-cases)
15. [How Blockchain Makes This Different from Points](#15-how-blockchain-makes-this-different-from-points)
16. [Technical Stack — Every Tool Explained](#16-technical-stack)
17. [API Reference — Every Endpoint](#17-api-reference)
18. [How to Run SharpKit Yourself](#18-how-to-run-sharpkit-yourself)
19. [What Makes This Hackathon-Ready](#19-what-makes-this-hackathon-ready)

---

## 1. The Big Picture

### What problem does SharpKit solve?

Imagine you run an online clothing store. You want to reward your customers when they buy something — give them points, discounts, or loyalty rewards. Today, if you want to do this you have two options:

**Option A — Build it yourself:**
You write a database to store user points, build a UI to show their balance, write an API to add/subtract points, handle security, handle fraud, and then repeat this for every app you build. This takes 3–6 months and a dedicated engineering team.

**Option B — Use a third-party loyalty platform:**
Services like Yotpo, Loyalty Lion, or Smile.io charge ₹20,000–₹2,00,000/month, lock you into their platform, and your users' points are siloed — points from your store cannot be used at another store.

**SharpKit is Option C:**

> A plug-and-play API and SDK that any developer can drop into their app in under 10 minutes, giving their users a real blockchain-backed token (SHRP) that works across every app that integrates SharpKit — not just one store.

In one sentence: **SharpKit is to loyalty tokens what Stripe is to payments** — you don't build the payment infrastructure yourself, you call Stripe's API. Similarly, you don't build a token system yourself, you call SharpKit's API.

---

## 2. Real-Life Analogy

### Think of it like a Mall Loyalty Card

Picture a large shopping mall. The mall has its own currency called "Mall Coins."

- You buy shoes at **Nike** inside the mall → earn 50 Mall Coins
- You buy a book at **Crossword** inside the mall → earn 30 Mall Coins
- You go to the food court and spend 40 Mall Coins for a discount on your meal

Notice: the coins work **across all shops in the mall**, not just one. Nike doesn't manage its own coin system. Crossword doesn't manage its own coin system. The **mall manages it centrally**, and every shop just plugs into it.

**SharpKit is the mall's coin system. Your app is one of the shops.**

| Mall Analogy | SharpKit Reality |
|---|---|
| Mall Coin | SHRP (Sharp Token) |
| Mall's central database | SharpKit backend + Ethereum blockchain |
| Nike integrating with Mall system | Developer adding SharpKit SDK to their app |
| Customer's Mall Coin balance | User's SHRP balance |
| Mall's management console | SharpKit Developer Portal |
| Different shops using the same coin | Merchant Marketplace ecosystem |

But there's one critical upgrade: **Mall Coins are fake** — they live on a paper card or a private database controlled by the mall. If the mall closes, your coins vanish.

**SHRP tokens are real** — they live on the Ethereum blockchain, a public computer network that nobody owns. Even if SharpKit the company shuts down tomorrow, your SHRP tokens still exist on-chain and can still be used.

---

## 3. What is a Token? What is Blockchain?

### Understanding Blockchain in Plain English

Imagine a notebook that thousands of people have identical copies of simultaneously. When you write something in that notebook, everyone's copy gets updated in real-time, and once written, **nothing can be erased**.

That notebook is the **blockchain**. It's a shared, permanent record of who owns what.

**Ethereum** is the most popular such notebook for building programmable applications. It doesn't just store balances — it runs programs called **Smart Contracts**.

### What is a Smart Contract?

A smart contract is a computer program that lives on the blockchain. Once deployed, it runs exactly as written — no human can change it, pause it, or cheat it.

**Real-life analogy:** A vending machine.

When you insert ₹20 and press the button for chips, the vending machine automatically:
1. Checks you inserted the right amount
2. Dispenses the chips
3. Gives change if needed

No shop owner involvement. No possibility of the machine "deciding" to keep your money. It follows the rules it was programmed with.

A smart contract is like a vending machine, but for financial agreements.

### What is a Token?

A token is a unit of value that lives on the blockchain. It's created by a smart contract that keeps track of who owns how many units.

**SHRP (Sharp Token) is SharpKit's token.** The smart contract for SHRP:
- Records every address's balance
- Controls who can create (mint) new tokens
- Controls who can destroy (burn) tokens
- Ensures the total supply never exceeds 1 billion SHRP

### ERC-20 — The Universal Token Standard

ERC-20 is a standard (a set of rules) that all tokens on Ethereum follow. Because SHRP follows ERC-20, it automatically works with:
- Every crypto wallet (MetaMask, Coinbase Wallet, etc.)
- Every decentralized exchange
- Every blockchain explorer (Etherscan)
- Any other app that understands ERC-20

It's like how all USB devices follow the USB standard — you don't need a different charger for every phone.

---

## 4. SharpKit's Architecture

### How All Pieces Fit Together

```
┌─────────────────────────────────────────────────────────────┐
│                        YOUR APP                             │
│   (e-commerce store, game, fintech app, anything)           │
│                                                             │
│   ┌──────────────┐    ┌────────────────────────────────┐   │
│   │  SharpKit    │    │     SharpKit Widget             │   │
│   │    SDK       │    │  (floating UI, user sees SHRP)  │   │
│   │ (1 JS file)  │    │                                 │   │
│   └──────┬───────┘    └────────────────────────────────┘   │
└──────────┼──────────────────────────────────────────────────┘
           │  HTTPS API calls (x-api-key header)
           ▼
┌─────────────────────────────────────────────────────────────┐
│                  SHARPKIT BACKEND (Express.js)              │
│                                                             │
│   ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐  │
│   │  /earn   │  │  /spend  │  │  /buy    │  │ /balance │  │
│   └──────────┘  └──────────┘  └──────────┘  └──────────┘  │
│                                                             │
│   ┌──────────────────────┐  ┌───────────────────────────┐  │
│   │     store.js         │  │      contract.js          │  │
│   │  (in-memory ledger)  │  │  (ethers.js → blockchain) │  │
│   └──────────────────────┘  └───────────┬───────────────┘  │
└─────────────────────────────────────────┼───────────────────┘
                                          │  RPC (HTTPS)
                                          ▼
┌─────────────────────────────────────────────────────────────┐
│            ETHEREUM SEPOLIA BLOCKCHAIN                      │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐  │
│   │              SharpToken.sol                         │  │
│   │  (ERC-20 Smart Contract at 0x264F12a1...)           │  │
│   │                                                     │  │
│   │  mint(address, amount, reason)  ← only owner        │  │
│   │  burn(amount)                   ← any holder        │  │
│   │  transfer(to, amount)           ← standard ERC-20   │  │
│   └─────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### The Two-Layer Design

SharpKit uses a **two-layer architecture**:

**Layer 1 — Off-chain (the backend):**
Instant, free, scalable. Every earn/spend operation updates an in-memory ledger in milliseconds. This is what most users interact with day-to-day. No transaction fees, no waiting.

**Layer 2 — On-chain (the blockchain):**
Permanent, verifiable, trustless. Important events (minting new tokens, verifying purchases) are recorded on Ethereum. This is the source of truth and proof that the system is honest.

**Why both?** If every loyalty point operation cost a blockchain transaction fee (gas fee) of ₹50–₹500 and took 12 seconds, nobody would use it. By keeping daily operations off-chain and settling important events on-chain, SharpKit is both practical AND trustworthy.

---

## 5. The Sharp Token (SHRP) — The Smart Contract

**File:** `contracts/SharpToken.sol`

### What the Contract Does

```solidity
// Simplified mental model of SharpToken.sol

contract SharpToken is ERC20, Ownable {
    
    uint256 public constant MAX_SUPPLY = 1_000_000_000 * 1e18; // 1 billion tokens
    
    // Called once when deployed. Creates initial supply for the treasury.
    constructor(address treasury) {
        _mint(treasury, 10_000_000 * 1e18); // 10 million initial tokens
    }
    
    // Only the owner (SharpKit treasury) can mint new tokens
    function mint(address to, uint256 amount, string reason) external onlyOwner {
        require(totalSupply() + amount <= MAX_SUPPLY, "Max supply exceeded");
        _mint(to, amount);
        emit TokensMinted(to, amount, reason);
    }
    
    // Any holder can burn their own tokens
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
    }
}
```

### Real-Life Analogy for Each Function

| Function | Real-Life Equivalent |
|---|---|
| `constructor` | The Reserve Bank of India printing the initial currency |
| `mint()` | RBI printing more currency when economy needs it |
| `burn()` | Destroying old/damaged banknotes |
| `transfer()` | Handing cash to someone |
| `balanceOf()` | Checking your bank account balance |
| `totalSupply()` | Total rupees in circulation |
| `MAX_SUPPLY` | Constitutional limit on money printing |

### Why Ownable?

The `onlyOwner` modifier on `mint()` means **only the SharpKit treasury wallet can create new tokens**. This prevents anyone from fraudulently minting tokens for themselves.

It's like how only the RBI can print rupees — not any random person with a printer.

### The `reason` Parameter

The `mint()` function takes a `reason` string (e.g., "daily_login", "purchase"). This reason is permanently recorded on the blockchain as an event log. Anyone can audit why every token was ever created.

---

## 6. The Backend — The Brain of SharpKit

**File:** `backend/server.js` + `backend/store.js` + `backend/contract.js`

### server.js — The Entry Point

This is an Express.js HTTP server running on port 4000. Think of it as the reception desk of a bank — it receives requests, checks your ID (API key), routes you to the right department (route handler), and sends back a response.

**What it does:**
1. **Starts up** on port 4000
2. **Authenticates** every request via `x-api-key` header
3. **Rate limits** to prevent abuse (100 requests/minute global, 20/minute for sensitive operations)
4. **Routes** requests to the right handler
5. **Serves** the frontend and SDK as static files

### store.js — The In-Memory Ledger

This is SharpKit's current database. It's intentionally simple — just JavaScript Maps (like Excel spreadsheets in memory).

```
Balances Map:
  "user123"  → 250 SHRP
  "alice"    → 1000 SHRP
  "bob"      → 75 SHRP

Transaction Log (array, capped at 500 entries):
  { id, type: "earn", userId: "user123", amount: 50, reason: "daily_login", timestamp, newBalance: 300 }
  { id, type: "spend", userId: "alice", amount: 100, reason: "redeem", timestamp, newBalance: 900 }

Rules Map:
  "rule_01" → { name: "Daily Login", event: "daily_login", reward: 50 }
  "rule_02" → { name: "Purchase", event: "purchase", reward: 5 }
```

**Real-life analogy:** A cashier's notepad at a small shop. Fast to update, easy to read, but if the shop burns down (server restarts), the notepad is gone. For production, this would be replaced with MongoDB or PostgreSQL — the function signatures stay identical, only the storage changes.

### contract.js — The Blockchain Bridge

This is the module that connects the backend to the Ethereum blockchain. It uses `ethers.js` (a JavaScript library for Ethereum) to talk to the smart contract.

```javascript
// How contract.js works in plain English:
// 1. Connect to Ethereum's Sepolia test network via Alchemy (a node provider)
// 2. Load the treasury wallet using a private key from .env
// 3. Get a reference to the SharpToken contract at its address
// 4. Allow other files to call contract.mint(), contract.burn(), etc.
```

**Singleton pattern:** The connection is created once and reused across all requests. Why? Creating a new connection for every API request would be like calling the bank and hanging up after each question, then calling again for the next question. A persistent connection is much faster.

---

## 7. The Three Core Flows

### Flow 1 — EARN

**Scenario:** User logs in to an app daily. App rewards them with SHRP.

```
Developer's App Code:
  SharpKit.reward("user123", 50, "daily_login")
          ↓
  POST /api/earn
  Headers: { x-api-key: "test_key" }
  Body: { userId: "user123", amount: 50, reason: "daily_login" }
          ↓
  Backend validates API key ✓
  Backend checks amount > 0 ✓
  Backend credits store: user123's balance += 50
  Backend records transaction in log
  Backend immediately responds: { success: true, tx: { newBalance: 300 } }
          ↓
  (Asynchronously, after responding — does NOT block the user):
  contract.mint(treasuryAddress, 50 * 1e18, "daily_login")
  → Transaction submitted to Ethereum Sepolia
  → Console logs: "[earn] On-chain mint submitted: 0xabc123..."
```

**Why respond before the blockchain confirms?**
A blockchain transaction takes 12–30 seconds to confirm. If the API waited for confirmation before responding, every earn operation would freeze the user's app for half a minute. Instead:
1. The user gets an instant response (off-chain)
2. The blockchain confirms in the background (on-chain)

This is called **fire-and-forget** — shoot the transaction and don't wait for confirmation.

**Real-life analogy:** When you buy something with a credit card, the merchant accepts the payment instantly. The actual bank settlement happens overnight in batches. The customer doesn't wait 24 hours for the payment to "confirm."

---

### Flow 2 — SPEND

**Scenario:** User redeems SHRP for a 10% discount.

```
POST /api/spend
Body: { userId: "user123", amount: 100, reason: "redeem_discount" }
        ↓
Backend checks: user123's balance = 300 ≥ 100 ✓
Backend debits: user123's balance = 200
Backend records transaction
Response: { success: true, tx: { newBalance: 200 } }

If insufficient balance:
Response: HTTP 402 { error: "Insufficient balance" }
```

**HTTP 402** (Payment Required) is a rarely-used status code that's semantically perfect here — the user literally doesn't have enough to pay.

---

### Flow 3 — BUY (Two Methods)

#### Method A: Buy with Card (Mock Fiat)

```
POST /api/buy/mock
Body: { userId: "user123", amount: 100, paymentMethod: "card" }
        ↓
Backend simulates a 500ms payment processing delay (realistic demo)
Backend credits 100 SHRP to user123
Response: { success: true, tx: { ... } }
```

In production, this would integrate with Razorpay or Stripe — receive a payment webhook, then credit SHRP.

#### Method B: Buy with MetaMask (Real Crypto)

This is the most technically interesting flow:

```
Step 1 — User clicks "Buy with MetaMask" on the dashboard
Step 2 — Browser asks MetaMask to request user's wallet address
Step 3 — Dashboard checks the user is on Sepolia (chainId 0xaa36a7)
Step 4 — MetaMask sends ETH transaction (e.g., 0.1 ETH for 100 SHRP)
Step 5 — MetaMask returns a txHash (transaction ID)
Step 6 — Dashboard calls: POST /api/buy/verify-crypto
          Body: { userId, txHash: "0xabc...", amount: 100 }
                ↓
Step 7 — Backend calls: provider.waitForTransaction(txHash, 1, 30_000)
          → Polls Ethereum until the transaction is mined (max 30 seconds)
          → If mined: receipt.status === 1 (success) or 0 (reverted)
Step 8 — Backend fetches the transaction to check ETH value
          → Verifies: sentETH ≈ expectedETH (1000 SHRP = 1 ETH, ±1% tolerance)
Step 9 — If verified: credit 100 SHRP to user123
          Response: { success: true, tx: { verified: true, blockNumber: 7341892 } }

If txHash is fake/malicious:
          → waitForTransaction returns null after 30s timeout
          → Response: HTTP 202 { status: "pending" } (try again later)
          
If ETH amount doesn't match:
          → Response: HTTP 400 { error: "Amount mismatch: sent 0.05 ETH, expected 0.1 ETH" }
```

**Why is this important?** Without on-chain verification, anyone could make up a fake txHash like "0xfaketrx123" and claim they sent ETH to buy SHRP. The backend would have no way to check. With `waitForTransaction`, the backend **cryptographically proves** the payment happened before crediting tokens.

**Real-life analogy:** Imagine someone calls a store and says "I sent you ₹1000, please ship my order." An honest store checks their bank account before shipping. SharpKit checks the blockchain before crediting tokens.

---

## 8. Security — How We Protect Everything

### Layer 1 — API Key Authentication

Every request to SharpKit's sensitive routes must include an `x-api-key` header. Without it, the server returns HTTP 401 (Unauthorized).

```
Valid: curl -H "x-api-key: test_key" http://localhost:4000/api/balance/user123
Invalid: curl http://localhost:4000/api/balance/user123  → 401 Unauthorized
```

**Real-life analogy:** Like a building's security badge. You can't access the office without swiping your card at the door.

### Layer 2 — Rate Limiting

Implemented in `server.js` without any npm package — pure JavaScript using a Map:

```
Global limit:  100 requests per minute per IP
Strict limit:  20 requests per minute per IP (for earn/spend/buy)

If exceeded: HTTP 429 { error: "Rate limit exceeded. Retry later." }
```

**Why rate limiting?** Without it, an attacker could send 10,000 earn requests per second and flood the system with fake SHRP. Rate limiting makes brute-force attacks economically infeasible.

**Real-life analogy:** An ATM that locks you out after 3 wrong PIN attempts. It prevents someone from guessing your PIN by trying all 10,000 combinations in a second.

### Layer 3 — On-Chain Verification

As described in Flow 3, crypto purchases are verified against the actual Ethereum blockchain before being credited. A fake txHash has zero chance of passing verification.

### Layer 4 — Smart Contract Ownership

The `onlyOwner` modifier in SharpToken.sol ensures only the treasury wallet can mint tokens. Even if the backend is compromised, an attacker cannot mint SHRP without the treasury's private key.

### Layer 5 — Input Validation

Every route validates its inputs:
- `amount` must be a positive number
- `userId` must be a non-empty string
- `txHash` must match the Ethereum hash format (0x + 64 hex chars)

### What's NOT secured (intentionally, for hackathon simplicity)

- The in-memory store resets on restart (production: use MongoDB)
- API keys are hardcoded in `.env` (production: use a key management service)
- No JWT auth for the dashboard UI (production: add Clerk/Auth0)

---

## 9. The SDK — Plug-and-Play Integration

**File:** `sdk/sharpkit.js`

The SDK is a single JavaScript file (~100 lines) that any developer includes in their website with one `<script>` tag. After that, they have access to the entire SharpKit API in 2 lines of JavaScript.

### UMD Pattern — Works Everywhere

The SDK uses the UMD (Universal Module Definition) pattern, which means it works in:
- **Browser** `<script>` tags (sets `window.SharpKit`)
- **Node.js** `require()` (CommonJS)
- **ES modules** `import` (AMD)

```javascript
// In a browser (e-commerce store)
<script src="http://localhost:4000/sdk/sharpkit.js"></script>
<script>
  SharpKit.init({ apiKey: "your_key", baseUrl: "https://your-sharpkit.com" });
  
  // On purchase:
  await SharpKit.reward("user123", 50, "purchase");
  
  // On redemption:
  await SharpKit.spend("user123", 100, "discount");
  
  // Check balance:
  const { balance } = await SharpKit.getBalance("user123");
</script>

// In a Node.js backend
const SharpKit = require('./sharpkit.js');
SharpKit.init({ apiKey: "your_key", baseUrl: "https://your-sharpkit.com" });
await SharpKit.reward("user123", 50, "daily_login");
```

### How the SDK Works Internally

```javascript
// Simplified internals of sharpkit.js

let _config = {};

function init(config) {
    _config = config;  // Store apiKey and baseUrl
}

async function reward(userId, amount, reason) {
    return _post("/api/earn", { userId, amount, reason });
}

async function _post(path, body) {
    const response = await fetch(_config.baseUrl + path, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": _config.apiKey   // Automatically adds auth header
        },
        body: JSON.stringify(body)
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
}
```

**Real-life analogy:** The SDK is like a TV remote. You don't need to understand how infrared signals work or how the TV's internal circuit processes commands. You just press the button and it works. The SDK hides all the HTTP, authentication, and error handling complexity.

---

## 10. The Widget — Drop-in UI Component

**File:** `widget/sharpkit-widget.js`

The widget is a self-contained, floating UI that shows up on any website with a single `<script>` tag. No React, no Vue, no build step — pure vanilla JavaScript that injects itself into the page.

```html
<!-- Any merchant adds this ONE line to their website -->
<script
  src="http://localhost:4000/widget/sharpkit-widget.js"
  data-key="merchant_api_key"
  data-user-id="current_user_id"
  data-base-url="http://localhost:4000">
</script>
```

**What the user sees:** A small floating button (bottom right corner). When clicked, it opens a panel with 4 tabs:
1. **Activity** — Recent transactions
2. **Earn** — Ways to earn SHRP
3. **Redeem** — How to spend SHRP
4. **Buy** — Purchase more SHRP

**How it works:**
The widget JavaScript reads the `data-*` attributes from the script tag, uses them as configuration, and injects a floating `<div>` into the page's `<body>`. All styles are scoped inside the div using inline CSS — it won't conflict with the host page's CSS.

**Real-life analogy:** Like a WhatsApp chat bubble that appears on websites for customer support. The website owner just adds one line; the chat widget appears automatically.

---

## 11. The Dashboard — Control Center

**File:** `frontend/index.html` + `frontend/app.js`

The dashboard is SharpKit's management UI — a single-page web application for testing and demonstrating the API.

### The 7 Panels

| Panel | Purpose | API Route |
|---|---|---|
| **Earn Tokens** | Credit SHRP to a user | POST /api/earn |
| **Spend Tokens** | Debit SHRP from a user | POST /api/spend |
| **Check Balance** | Look up any user's balance | GET /api/balance/:userId |
| **Buy Tokens** | Purchase SHRP via card or MetaMask | POST /api/buy/mock or /verify-crypto |
| **Reward Rules** | Create/delete automatic reward triggers | POST/DELETE /api/balance/rules |
| **Transaction Log** | See recent activity | GET /api/balance/txlog/all |
| **SDK Snippet** | Copy-paste integration code | — |

### app.js — Pure Vanilla JavaScript

No React, no Angular, no Vue. Just JavaScript that runs in the browser.

Key design patterns:
- **`apiKey()`** — reads the API key from the input field, so every action uses the currently displayed key
- **`headers()`** — adds Content-Type and x-api-key headers to every fetch call
- **`showResult(id, data)`** — renders a human-readable card instead of raw JSON
- **`setLoading(btn, loading)`** — disables button and shows spinner during API calls
- **Auto-refresh** — `setInterval` calls `loadStats()` and `loadTxLog()` every 15 seconds

---

## 12. The Developer Portal — Power User Tools

**File:** `frontend/portal.html`

The portal is for developers who have integrated SharpKit into their app and need to monitor it.

### Analytics Dashboard

Shows live statistics fetched from `/api/analytics`:
- Total users
- Total SHRP issued
- Total transactions
- Number of active API keys

**Bar chart:** Shows transaction volume per day for the last 7 days, rendered without any chart library — pure div heights calculated as percentages of the maximum value.

### API Key Management

Developers can:
1. **Generate new keys** — POST /api/keys with a name
2. **View all keys** — GET /api/keys
3. **Revoke keys** — DELETE /api/keys/:key

**Why multiple keys?** Best practice is to use different keys for different environments (production, staging, development) and different team members. If a key is compromised, you revoke just that key without affecting others.

### Webhook Configuration

Webhooks let SharpKit notify your backend whenever something happens.

```
Developer configures: POST https://myapp.com/sharpkit-webhook for "earn" events

When user123 earns 50 SHRP:
  SharpKit backend → POST https://myapp.com/sharpkit-webhook
                      Body: { event: "earn", userId: "user123", amount: 50, timestamp: "..." }
```

**Real-life analogy:** Like a UPS delivery notification. UPS doesn't make you check their website every minute. When your package ships, they proactively notify you (push), rather than you asking them repeatedly (poll).

### Live API Playground

A mini HTTP client built into the portal. Developers can try any SharpKit API endpoint, see the raw response, and prototype integrations — without leaving the browser.

---

## 13. The Merchant Marketplace — Ecosystem

**File:** `frontend/marketplace.html` + `backend/routes/merchants.js`

The marketplace is a directory of all apps/stores that have integrated SharpKit. It shows users where they can earn and spend SHRP.

### How a Merchant Gets Listed

```
POST /api/merchants
Body: {
  name: "StyleStore",
  category: "Fashion",
  description: "Trendy clothes for everyone",
  rewardRate: "5 SHRP per ₹100",
  perk: "10% discount with 500 SHRP",
  url: "https://stylestore.com"
}
```

### Why This Matters for Users

Without a marketplace, SHRP tokens from StyleStore are worthless outside StyleStore. With the marketplace:
- A user earns SHRP at StyleStore
- The same SHRP can be spent at TechGadgets or FoodieApp

This creates **network effects** — the more merchants join, the more valuable SHRP becomes to users, which attracts more users, which attracts more merchants. It's a flywheel.

---

## 14. Real-World Use Cases

### Use Case 1: E-Commerce Store (Like the Demo)

**Problem:** Online store wants to reward loyal customers and reduce churn.

**Integration:**
```javascript
// In the checkout handler:
await SharpKit.reward(userId, purchaseAmount * 0.05, "purchase");

// In the discount redemption handler:
await SharpKit.spend(userId, 100, "10_percent_discount");
```

**Value:** Customers earn SHRP on every purchase, can redeem for discounts. Unlike credit card points, SHRP can be used at partner stores — making rewards more valuable and encouraging cross-store discovery.

---

### Use Case 2: Mobile Game

**Problem:** Game wants to reward daily logins, achievements, and in-app purchases.

**Integration:**
```javascript
// Daily login event:
await SharpKit.reward(userId, 10, "daily_login");

// Achievement unlocked:
await SharpKit.reward(userId, 50, "first_level_complete");

// Unlock premium skin:
await SharpKit.spend(userId, 200, "unlock_dragon_skin");
```

**Value:** Players have real, transferable tokens — not just "gold coins" that disappear when the game server closes. Players can sell or transfer SHRP to other players. Premium features feel more fair when paid with earned tokens.

---

### Use Case 3: EdTech Platform

**Problem:** Online learning platform wants to increase course completion rates.

**Integration:**
```javascript
// Lesson completed:
await SharpKit.reward(studentId, 5, "lesson_complete");

// Course finished:
await SharpKit.reward(studentId, 100, "course_complete");

// Unlock advanced content:
await SharpKit.spend(studentId, 50, "unlock_advanced_module");
```

**Value:** Students are financially motivated to complete courses. SHRP earned in one course platform can be spent on another platform's courses. Creates an educational token economy.

---

### Use Case 4: Food Delivery App

**Problem:** Food delivery app wants to compete with Zomato Gold and Swiggy One without a subscription model.

**Integration:**
```javascript
// After each delivery:
await SharpKit.reward(userId, Math.floor(orderValue * 0.03), "delivery_complete");

// Apply free delivery:
if (await SharpKit.getBalance(userId).balance >= 100) {
    await SharpKit.spend(userId, 100, "free_delivery");
    applyFreeDelivery();
}
```

**Value:** No subscription fees. Rewards are proportional to spending. Tokens can be used at partner restaurants — creating cross-merchant value.

---

### Use Case 5: Corporate HR — Employee Recognition

**Problem:** Large company wants to recognize employee achievements in a transparent, trackable way.

**Integration:**
```javascript
// Manager awards recognition:
await SharpKit.reward(employeeId, 500, "q4_performance_award");

// Employee redeems for benefits:
await SharpKit.spend(employeeId, 200, "extra_holiday_day");
await SharpKit.spend(employeeId, 500, "training_course_reimbursement");
```

**Value:** Recognition is verifiable on blockchain — cannot be tampered with by managers or HR. Token balances create a transparent record of contributions.

---

## 15. How Blockchain Makes This Different from Points

| Feature | Traditional Points (e.g., Flipkart SuperCoins) | SharpKit SHRP |
|---|---|---|
| **Who controls it** | Flipkart's private database | Ethereum blockchain (no owner) |
| **Expire?** | Yes, usually after 12 months | Never — blockchain data is permanent |
| **Transferable?** | No — you can't send SuperCoins to a friend | Yes — standard ERC-20 transfer |
| **Cross-merchant?** | No — only on Flipkart | Yes — any SharpKit merchant |
| **Auditable?** | No — Flipkart can change rules silently | Yes — all minting/burning is public on-chain |
| **If company closes?** | Points vanish | Tokens still exist on blockchain |
| **Counterfeit risk?** | Database can be hacked and points added | Cryptographically impossible to fake |
| **Build time** | 6+ months in-house | 10 minutes with SharpKit SDK |

---

## 16. Technical Stack — Every Tool Explained

### Solidity 0.8.24

The programming language for Ethereum smart contracts. Like JavaScript but specifically designed for blockchain programs. Version 0.8.x introduced automatic overflow protection (numbers can't secretly become negative), which is critical for financial applications.

### OpenZeppelin 5.x

A library of battle-tested smart contract components. Rather than writing token logic from scratch (and potentially introducing bugs), we inherit from OpenZeppelin's audited ERC20 implementation.

**Analogy:** Using React instead of writing browser DOM manipulation code yourself. Why reinvent the wheel when experts have already built and security-audited a better wheel?

### Hardhat 2.x

A development framework for Ethereum. It:
- Compiles Solidity code to bytecode
- Runs a local Ethereum node for testing
- Deploys contracts to Sepolia or mainnet
- Manages a project's development workflow

**Analogy:** Webpack for smart contracts — it handles all the build and deployment tooling.

### ethers.js 6.x

A JavaScript library for interacting with Ethereum from Node.js or browsers. Used in:
- `contract.js` — to call `mint()` on the smart contract from the backend
- `frontend/app.js` (via MetaMask's injected provider) — to send ETH transactions from the browser

**The ethers.js v6 pattern used:**
```javascript
// Provider: a read-only connection to Ethereum
const provider = new ethers.JsonRpcProvider(SEPOLIA_RPC_URL);

// Wallet: a provider + private key (can sign transactions)
const wallet = new ethers.Wallet(PRIVATE_KEY, provider);

// Contract: a wallet + contract address + ABI
const contract = new ethers.Contract(CONTRACT_ADDRESS, abi, wallet);

// Call a function
await contract.mint(address, amount, reason);
```

### Express.js 4.x

A minimal Node.js web framework. Handles HTTP routing, middleware, and request/response. The entire backend is Express.

### Node.js 22

The JavaScript runtime for the backend. Allows JavaScript to run outside the browser (on a server).

### Tailwind CSS (CDN)

A utility-first CSS framework. Instead of writing custom CSS like `.card { border-radius: 24px }`, you add classes directly in HTML like `class="rounded-3xl"`. The CDN version scans your HTML and generates only the CSS classes you actually use.

---

## 17. API Reference — Every Endpoint

### Authentication
All routes (except `/api/health` and `/api/merchants` GET) require:
```
Header: x-api-key: your_api_key
```

Default valid keys: `test_key`, `demo_key_123`

---

### POST /api/earn
Credit SHRP to a user.

**Request:**
```json
{
  "userId": "user123",
  "amount": 50,
  "reason": "daily_login"
}
```

**Response (200):**
```json
{
  "success": true,
  "tx": {
    "id": "uuid",
    "type": "earn",
    "userId": "user123",
    "amount": 50,
    "reason": "daily_login",
    "timestamp": "2026-06-11T10:30:00Z",
    "newBalance": 300
  }
}
```

**Side effect:** Triggers a fire-and-forget `mint()` on the Sepolia blockchain.

---

### POST /api/spend
Debit SHRP from a user.

**Request:**
```json
{
  "userId": "user123",
  "amount": 100,
  "reason": "redeem_discount"
}
```

**Response (200):**
```json
{ "success": true, "tx": { "newBalance": 200, ... } }
```

**Response (402) — Insufficient balance:**
```json
{ "error": "Insufficient balance" }
```

---

### GET /api/balance/:userId
Get a user's current SHRP balance.

**Example:** `GET /api/balance/user123`

**Response:**
```json
{ "userId": "user123", "balance": 300 }
```

---

### POST /api/buy/mock
Simulate a fiat (card) purchase of SHRP.

**Request:**
```json
{
  "userId": "user123",
  "amount": 100,
  "paymentMethod": "card"
}
```

**Response (200):**
```json
{ "success": true, "tx": { "type": "buy_fiat", "amount": 100, "newBalance": 400, ... } }
```

---

### POST /api/buy/verify-crypto
Verify an Ethereum transaction and credit SHRP.

**Request:**
```json
{
  "userId": "user123",
  "txHash": "0xabc123...",
  "amount": 100
}
```

**Response (200) — Verified:**
```json
{ "success": true, "tx": { "verified": true, "blockNumber": 7341892, ... } }
```

**Response (202) — Still pending:**
```json
{ "status": "pending", "message": "Not yet confirmed. Retry in 15s." }
```

**Response (400) — Amount mismatch:**
```json
{ "error": "Amount mismatch: sent 0.05 ETH, expected 0.1 ETH for 100 SHRP" }
```

---

### GET /api/balance/txlog/all
Get recent transactions.

**Query params:** `?limit=20`

**Response:**
```json
{ "transactions": [ { "type": "earn", "userId": "user123", "amount": 50, ... } ] }
```

---

### GET /api/balance/admin/all
Get all users and their balances (admin only).

**Response:**
```json
{ "balances": { "user123": 300, "alice": 1000, "bob": 75 } }
```

---

### POST /api/balance/rules/create
Create a reward rule (automatic trigger definition).

**Request:**
```json
{
  "name": "Daily Login",
  "event": "daily_login",
  "reward": 50
}
```

---

### GET /api/merchants
List all registered merchants (public, no auth required).

### POST /api/merchants
Register a new merchant.

### GET /api/analytics
Get usage analytics (total users, SHRP, transactions by day).

### POST/GET/DELETE /api/keys
Manage API keys.

### POST/GET/DELETE /api/webhooks
Manage webhook subscriptions.

---

## 18. How to Run SharpKit Yourself

### Prerequisites
- Node.js 18+ installed
- MetaMask browser extension (for crypto buy demo)
- Alchemy account (for Sepolia RPC)

### Step 1 — Get the Code
```bash
git clone https://github.com/HackIndiaXYZ/web3-hackathon-2026-ethericals sharpkit
cd sharpkit
```

> **Important:** Keep the project in `~/Downloads/` or similar. Do NOT put it inside an iCloud-synced folder (Desktop, Documents on macOS) — iCloud interferes with Node.js module loading.

### Step 2 — Install Dependencies
```bash
npm install
```

### Step 3 — Configure Environment
```bash
cp .env.example .env
```

Edit `.env`:
```env
# For blockchain features (optional — works in demo mode without these)
SEPOLIA_RPC_URL=https://eth-sepolia.g.alchemy.com/v2/YOUR_KEY
TREASURY_PRIVATE_KEY=0xYOUR_WALLET_PRIVATE_KEY
SHARP_TOKEN_ADDRESS=0x264F12a1d8e671673D2A71198D212482aAFc9dBa

# Server config
PORT=4000
API_KEYS=test_key,demo_key_123
```

### Step 4 — Start the Backend
```bash
node backend/server.js
```

You'll see:
```
SharpKit v2 running → http://localhost:4000
```

### Step 5 — Open the Dashboard
Navigate to `http://localhost:4000` in your browser.

Try these:
1. Set User ID to `user123`, Amount to `50`, click "Reward Tokens" → green success card appears
2. Check Balance for `user123` → shows 300 SHRP (250 seeded + 50 just earned)
3. Open `http://localhost:4000/demo.html` → click "Add to Cart" on products → green toast appears
4. Open `http://localhost:4000/marketplace.html` → see merchant directory

### Step 6 — Test with curl (Optional)
```bash
# Earn tokens
curl -X POST http://localhost:4000/api/earn \
  -H "x-api-key: test_key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"alice","amount":100,"reason":"signup_bonus"}'

# Check balance
curl http://localhost:4000/api/balance/alice \
  -H "x-api-key: test_key"

# Spend tokens
curl -X POST http://localhost:4000/api/spend \
  -H "x-api-key: test_key" \
  -H "Content-Type: application/json" \
  -d '{"userId":"alice","amount":50,"reason":"redeem_discount"}'
```

---

## 19. What Makes This Hackathon-Ready

### The Five Pillars

**1. Instant Demo-ability**
Zero setup for judges — clone, `npm install`, `node backend/server.js`, open browser. No Docker, no database setup, no complex config. Pre-seeded data (`user123`, `alice`, `bob`) means something works immediately.

**2. Real Blockchain Integration (Not Fake)**
The contract is actually deployed on Ethereum Sepolia at `0x264F12a1d8e671673D2A71198D212482aAFc9dBa`. The `mint()` function actually gets called on-chain during earn operations. The buy-with-MetaMask flow actually submits Ethereum transactions. These are real interactions on a real (test) blockchain.

**3. Production Architecture**
The two-layer design (off-chain for speed + on-chain for trust) is how real Web3 applications are built (similar to how Optimism Layer 2 works). The fire-and-forget mint pattern, singleton provider, rate limiting, and API key auth are all production patterns.

**4. Complete Ecosystem**
Most hackathon projects are a single demo. SharpKit has:
- Smart contract (blockchain layer)
- Backend API (14 routes)
- SDK (for integration)
- Widget (drop-in UI)
- Dashboard (management)
- Portal (developer tools)
- Marketplace (ecosystem)
- Demo store (real-world example)

**5. The "Why" is Clear**
The problem (loyalty systems are expensive to build and siloed) is relatable. The solution (plug-and-play API + cross-merchant token) is immediately understandable. The blockchain component (permanence, transferability, cross-merchant trust) adds genuine value over a traditional database solution.

---

## Summary

SharpKit demonstrates that Web3 technology doesn't have to be complicated or inaccessible. By abstracting all blockchain complexity behind a simple REST API, it lets any developer — even those with zero blockchain knowledge — give their users the benefits of a real on-chain token economy: permanent records, cross-merchant rewards, and cryptographic proof of every transaction.

The technical architecture shows maturity: two-layer design for performance + trust, real on-chain verification that prevents fraud, rate limiting that prevents abuse, and a singleton contract connection that handles scale. The UI demonstrates the concept end-to-end from a user's perspective.

Most importantly, the use case is real. Loyalty programs are a multi-billion dollar industry, and the current solutions are either expensive, siloed, or both. SharpKit addresses all of these problems with a developer experience that mirrors the best API products in the industry.

---

*Built for HackIndia Web3 2026 — Team Ethericals*
*Stack: Solidity · Hardhat · ethers.js v6 · Express.js · Vanilla JS · Tailwind CSS · Ethereum Sepolia*
