const { v4: uuidv4 } = require("uuid");

// ─── Ledger ────────────────────────────────────────────────────────────────
const balances = new Map();   // userId → number
const txLog    = [];          // capped at 500

// ─── Rules ─────────────────────────────────────────────────────────────────
const rules = new Map();

// ─── Merchants ─────────────────────────────────────────────────────────────
const merchants = new Map();

// ─── Webhooks ──────────────────────────────────────────────────────────────
const webhooks    = new Map();  // id → { id, url, events[], createdAt }
const webhookLogs = [];         // capped at 200

// ─── API Keys ──────────────────────────────────────────────────────────────
const apiKeys = new Map();      // key string → { key, name, createdAt, active }

// ═══════════════════════════════════════════════════════════════════════════
// SEED DATA
// ═══════════════════════════════════════════════════════════════════════════

balances.set("user123", 250);
balances.set("alice",   1000);
balances.set("bob",     75);

rules.set("rule_daily_login", { id: "rule_daily_login", name: "Daily Login",     event: "daily_login",    reward: 5,  createdAt: new Date().toISOString() });
rules.set("rule_purchase",    { id: "rule_purchase",    name: "First Purchase",  event: "first_purchase", reward: 50, createdAt: new Date().toISOString() });

apiKeys.set("test_key",     { key: "test_key",     name: "Demo Key",   createdAt: new Date().toISOString(), active: true });
apiKeys.set("demo_key_123", { key: "demo_key_123", name: "Dev Key",    createdAt: new Date().toISOString(), active: true });

merchants.set("m_stylestore", {
  id: "m_stylestore", name: "StyleStore", category: "Fashion",
  description: "Earn SHRP on every fashion purchase.",
  rewardRate: "5 SHRP per ₹100 spent", perk: "10% off with 500 SHRP",
  url: "#", active: true, createdAt: new Date().toISOString(),
});
merchants.set("m_techhub", {
  id: "m_techhub", name: "TechHub", category: "Electronics",
  description: "Gadgets, laptops and accessories — earn while you shop.",
  rewardRate: "10 SHRP per ₹200 spent", perk: "Free shipping with 200 SHRP",
  url: "#", active: true, createdAt: new Date().toISOString(),
});
merchants.set("m_foodzone", {
  id: "m_foodzone", name: "FoodZone", category: "Food & Beverage",
  description: "Your favourite cloud kitchen. Earn on every order.",
  rewardRate: "2 SHRP per order", perk: "Free dessert with 100 SHRP",
  url: "#", active: true, createdAt: new Date().toISOString(),
});
merchants.set("m_learnhub", {
  id: "m_learnhub", name: "LearnHub", category: "Education",
  description: "Online courses and certifications powered by Web3.",
  rewardRate: "50 SHRP per course enrolled", perk: "Unlock premium content with 300 SHRP",
  url: "#", active: true, createdAt: new Date().toISOString(),
});

// ═══════════════════════════════════════════════════════════════════════════
// LEDGER
// ═══════════════════════════════════════════════════════════════════════════

function getBalance(userId) { return balances.get(userId) ?? 0; }

function credit(userId, amount) {
  balances.set(userId, getBalance(userId) + amount);
  return balances.get(userId);
}

function debit(userId, amount) {
  const prev = getBalance(userId);
  if (prev < amount) throw new Error("Insufficient balance");
  balances.set(userId, prev - amount);
  return balances.get(userId);
}

function addTx(tx) {
  txLog.unshift({ ...tx, timestamp: new Date().toISOString() });
  if (txLog.length > 500) txLog.pop();
}

function getTxLog(limit = 50) { return txLog.slice(0, limit); }
function getAllBalances()      { return Object.fromEntries(balances); }

// ═══════════════════════════════════════════════════════════════════════════
// RULES
// ═══════════════════════════════════════════════════════════════════════════

function getRules()       { return Array.from(rules.values()); }
function addRule(rule)    { rules.set(rule.id, rule); }
function deleteRule(id)   { return rules.delete(id); }

// ═══════════════════════════════════════════════════════════════════════════
// MERCHANTS
// ═══════════════════════════════════════════════════════════════════════════

function getMerchants()        { return Array.from(merchants.values()); }
function getMerchant(id)       { return merchants.get(id); }
function addMerchant(merchant) { merchants.set(merchant.id, merchant); }
function deleteMerchant(id)    { return merchants.delete(id); }

// ═══════════════════════════════════════════════════════════════════════════
// WEBHOOKS
// ═══════════════════════════════════════════════════════════════════════════

function getWebhooks()         { return Array.from(webhooks.values()); }
function addWebhook(hook)      { webhooks.set(hook.id, hook); }
function deleteWebhook(id)     { return webhooks.delete(id); }
function getWebhookLogs(n=50)  { return webhookLogs.slice(0, n); }

function logWebhookFire(entry) {
  webhookLogs.unshift({ ...entry, firedAt: new Date().toISOString() });
  if (webhookLogs.length > 200) webhookLogs.pop();
}

// Fire webhooks for a given event type — async, non-blocking
async function fireWebhooks(eventType, payload) {
  const targets = Array.from(webhooks.values()).filter(h => h.events.includes(eventType) || h.events.includes("*"));
  for (const hook of targets) {
    const body = JSON.stringify({ event: eventType, payload, timestamp: new Date().toISOString() });
    try {
      const ctrl = new AbortController();
      const timer = setTimeout(() => ctrl.abort(), 5000);
      const res = await fetch(hook.url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        signal: ctrl.signal,
      });
      clearTimeout(timer);
      logWebhookFire({ webhookId: hook.id, url: hook.url, event: eventType, status: res.status, success: res.ok });
    } catch (err) {
      logWebhookFire({ webhookId: hook.id, url: hook.url, event: eventType, status: 0, success: false, error: err.message });
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// API KEYS
// ═══════════════════════════════════════════════════════════════════════════

function getApiKeys()        { return Array.from(apiKeys.values()); }
function isValidKey(key)     { const k = apiKeys.get(key); return k && k.active; }
function addApiKey(name)     {
  const key = "sk_" + uuidv4().replace(/-/g, "").slice(0, 24);
  const record = { key, name, createdAt: new Date().toISOString(), active: true };
  apiKeys.set(key, record);
  return record;
}
function revokeApiKey(key)   {
  const k = apiKeys.get(key);
  if (k) { k.active = false; return true; }
  return false;
}

// ═══════════════════════════════════════════════════════════════════════════
// ANALYTICS
// ═══════════════════════════════════════════════════════════════════════════

function getAnalytics() {
  const byType = {};
  const byDay  = {};
  for (const tx of txLog) {
    byType[tx.type] = (byType[tx.type] || 0) + 1;
    const day = tx.timestamp ? tx.timestamp.slice(0, 10) : "unknown";
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const topUsers = Array.from(balances.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([userId, balance]) => ({ userId, balance }));
  const totalShrp = Array.from(balances.values()).reduce((a, b) => a + b, 0);
  return { byType, byDay, topUsers, totalUsers: balances.size, totalShrp, totalTxs: txLog.length };
}

module.exports = {
  // ledger
  getBalance, credit, debit, addTx, getTxLog, getAllBalances,
  // rules
  getRules, addRule, deleteRule,
  // merchants
  getMerchants, getMerchant, addMerchant, deleteMerchant,
  // webhooks
  getWebhooks, addWebhook, deleteWebhook, getWebhookLogs, logWebhookFire, fireWebhooks,
  // api keys
  getApiKeys, isValidKey, addApiKey, revokeApiKey,
  // analytics
  getAnalytics,
};
