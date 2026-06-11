// ===== CONFIG =====
const BASE = "http://localhost:4000";

function apiKey() {
  return document.getElementById("apiKeyInput").value.trim() || "test_key";
}

function headers() {
  return { "Content-Type": "application/json", "x-api-key": apiKey() };
}

// ===== TOAST =====
function toast(msg, isError = false) {
  const el = document.getElementById("toast");
  el.textContent = msg;
  el.style.background = isError ? "#dc2626" : "#000";
  el.style.color = "#fff";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ===== SHOW RESULT =====
function showResult(id, data, isError = false) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.remove("hidden");

  // Error state
  if (isError || data?.error) {
    el.innerHTML = `<div class="result-card error">
      <div class="result-label">Error</div>
      <div class="result-row" style="color:var(--error)">${data?.error || "Something went wrong"}</div>
    </div>`;
    return;
  }

  // Balance check: {userId, balance}
  if (data.balance !== undefined) {
    el.innerHTML = `<div class="result-card success">
      <div class="result-amount">${Number(data.balance).toLocaleString()} SHRP</div>
      <div class="result-label">Balance · ${data.userId}</div>
    </div>`;
    return;
  }

  // Transaction response: {success, tx}
  const tx = data.tx || {};
  const isSpend = tx.type === "spend";
  const lines = [];

  if (tx.newBalance !== undefined)
    lines.push(`<div class="result-amount">${Number(tx.newBalance).toLocaleString()} SHRP</div>
      <div class="result-label">New Balance</div>`);

  if (tx.amount !== undefined)
    lines.push(`<div class="result-row" style="color:${isSpend ? 'var(--spend)' : 'var(--earn)'};font-weight:700;font-size:0.95rem">
      ${isSpend ? '−' : '+'}${tx.amount} SHRP</div>`);

  if (tx.txHash)
    lines.push(`<div class="result-row result-label">Tx: <span style="font-family:var(--mono)">${tx.txHash.slice(0,14)}…</span>
      ${data.sepoliaLink ? `<a href="${data.sepoliaLink}" target="_blank" style="color:var(--balance);margin-left:8px;text-decoration:none">↗ Etherscan</a>` : ''}</div>`);

  if (tx.blockNumber)
    lines.push(`<div class="result-row result-label">Block #${tx.blockNumber}${tx.verified ? ' · <span style="color:var(--success)">✓ verified</span>' : ''}</div>`);

  if (data.warning)
    lines.push(`<div class="result-row" style="color:var(--warning);font-size:0.75rem">${data.warning}</div>`);

  el.innerHTML = `<div class="result-card success">${lines.join('') || '<div style="color:var(--success)">Success</div>'}</div>`;
}

// ===== LOADING HELPER =====
function setLoading(btn, loading) {
  if (!btn) return;
  if (loading) { btn.disabled = true; btn.classList.add("loading"); }
  else         { btn.disabled = false; btn.classList.remove("loading"); }
}

// ===== EARN =====
async function doEarn() {
  const userId = document.getElementById("earnUserId").value.trim();
  const amount = Number(document.getElementById("earnAmount").value);
  const reason = document.getElementById("earnReason").value.trim();
  const btn = document.querySelector(".earn-btn");
  setLoading(btn, true);
  try {
    const r = await fetch(`${BASE}/api/earn`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, reason }) });
    const data = await r.json();
    showResult("earnResult", data, !r.ok);
    if (r.ok) { toast(`✅ Rewarded ${amount} SHRP to ${userId}`); loadStats(); loadTxLog(); }
    else toast(data.error, true);
  } catch (e) { showResult("earnResult", { error: e.message }, true); }
  finally { setLoading(btn, false); }
}

// ===== SPEND =====
async function doSpend() {
  const userId = document.getElementById("spendUserId").value.trim();
  const amount = Number(document.getElementById("spendAmount").value);
  const reason = document.getElementById("spendReason").value.trim();
  const btn = document.querySelector(".spend-btn");
  setLoading(btn, true);
  try {
    const r = await fetch(`${BASE}/api/spend`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, reason }) });
    const data = await r.json();
    showResult("spendResult", data, !r.ok);
    if (r.ok) { toast(`💸 Spent ${amount} SHRP from ${userId}`); loadStats(); loadTxLog(); }
    else toast(data.error || "Insufficient balance", true);
  } catch (e) { showResult("spendResult", { error: e.message }, true); }
  finally { setLoading(btn, false); }
}

// ===== BALANCE =====
async function doBalance() {
  const userId = document.getElementById("balUserId").value.trim();
  const btn = document.querySelector(".balance-btn");
  setLoading(btn, true);
  try {
    const r = await fetch(`${BASE}/api/balance/${userId}`, { headers: headers() });
    const data = await r.json();
    showResult("balResult", data, !r.ok);
  } catch (e) { showResult("balResult", { error: e.message }, true); }
  finally { setLoading(btn, false); }
}

// ===== BUY FIAT =====
async function doBuyFiat() {
  const userId = document.getElementById("buyUserId").value.trim();
  const amount = Number(document.getElementById("buyAmount").value);
  const btn = document.querySelector(".buy-fiat-btn");
  document.getElementById("buyResult").classList.add("hidden");
  toast("⏳ Processing payment…");
  setLoading(btn, true);
  try {
    const r = await fetch(`${BASE}/api/buy/mock`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, paymentMethod: "card" }) });
    const data = await r.json();
    showResult("buyResult", data, !r.ok);
    if (r.ok) { toast(`✅ Purchased ${amount} SHRP via card`); loadStats(); loadTxLog(); }
    else toast(data.error, true);
  } catch (e) { showResult("buyResult", { error: e.message }, true); }
  finally { setLoading(btn, false); }
}

// ===== BUY CRYPTO (MetaMask) =====
async function doBuyCrypto() {
  const userId = document.getElementById("buyUserId").value.trim();
  const amount = Number(document.getElementById("buyAmount").value);
  const walletEl = document.getElementById("walletAddress");
  const btn = document.querySelector(".buy-crypto-btn");

  if (!window.ethereum) {
    toast("MetaMask not found. Install MetaMask first.", true);
    return;
  }

  setLoading(btn, true);
  try {
    // Request account
    const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
    const account = accounts[0];
    walletEl.textContent = "🦊 " + account;
    walletEl.classList.remove("hidden");

    // Check Sepolia (11155111 = 0xaa36a7)
    const chainId = await window.ethereum.request({ method: "eth_chainId" });
    if (chainId !== "0xaa36a7") {
      toast("Switch MetaMask to Sepolia Testnet", true);
      return;
    }

    // Send tiny ETH as simulation of "buying" (0.001 ETH = amount SHRP for demo)
    const valueHex = "0x" + (BigInt(Math.floor(amount * 1e15))).toString(16); // amount * 0.001 ETH
    const txHash = await window.ethereum.request({
      method: "eth_sendTransaction",
      params: [{
        from: account,
        to: account, // send to self for demo (replace with treasury address in prod)
        value: valueHex,
        gas: "0x5208",
      }],
    });

    toast("⏳ Verifying transaction…");

    // Credit off-chain after tx submitted
    const r = await fetch(`${BASE}/api/buy/verify-crypto`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ userId, txHash, amount }),
    });
    const data = await r.json();
    showResult("buyResult", { ...data, txHash, sepoliaLink: `https://sepolia.etherscan.io/tx/${txHash}` }, !r.ok);
    if (r.ok) { toast(`✅ Purchased ${amount} SHRP on-chain`); loadStats(); loadTxLog(); }
    else toast(data.error, true);

  } catch (e) {
    if (e.code === 4001) toast("Transaction rejected by user", true);
    else showResult("buyResult", { error: e.message }, true);
  } finally { setLoading(btn, false); }
}

// ===== RULES =====
async function loadRules() {
  try {
    const r = await fetch(`${BASE}/api/balance/rules/all`, { headers: headers() });
    const { rules } = await r.json();
    const list = document.getElementById("rulesList");
    list.innerHTML = rules.map(rule => `
      <div style="display:flex;align-items:center;gap:12px;background:#f9fafb;border:1px solid #e5e7eb;border-radius:12px;padding:10px 14px;font-size:0.85rem">
        <span style="font-weight:600;color:#111827;flex:1">${rule.name}</span>
        <span style="color:#9ca3af;font-family:monospace;font-size:0.75rem">${rule.event}</span>
        <span style="font-weight:700;color:#111827;font-family:monospace">+${rule.reward} SHRP</span>
        <button onclick="deleteRule('${rule.id}')" style="font-size:0.72rem;color:#dc2626;border:1px solid #fecaca;border-radius:999px;padding:2px 10px;cursor:pointer;background:transparent;font-family:inherit;transition:background 0.15s" onmouseover="this.style.background='#fef2f2'" onmouseout="this.style.background='transparent'">Remove</button>
      </div>
    `).join("") || '<p style="color:#9ca3af;font-size:0.875rem">No rules yet.</p>';
    document.getElementById("statRules").textContent = rules.length;
  } catch (e) { console.error(e); }
}

async function createRule() {
  const name   = document.getElementById("ruleName").value.trim();
  const event  = document.getElementById("ruleEvent").value.trim();
  const reward = Number(document.getElementById("ruleReward").value);
  if (!name || !event || !reward) { toast("Fill all rule fields", true); return; }
  try {
    const r = await fetch(`${BASE}/api/balance/rules/create`, { method: "POST", headers: headers(), body: JSON.stringify({ name, event, reward }) });
    const data = await r.json();
    if (r.ok) { toast(`Rule "${name}" created`); loadRules(); document.getElementById("ruleName").value = ""; document.getElementById("ruleEvent").value = ""; document.getElementById("ruleReward").value = ""; }
    else toast(data.error, true);
  } catch (e) { toast(e.message, true); }
}

async function deleteRule(id) {
  try {
    await fetch(`${BASE}/api/balance/rules/${id}`, { method: "DELETE", headers: headers() });
    loadRules();
  } catch (e) { toast(e.message, true); }
}

// ===== TX LOG =====
async function loadTxLog() {
  try {
    const r = await fetch(`${BASE}/api/balance/txlog/all?limit=20`, { headers: headers() });
    const { transactions } = await r.json();
    const wrap = document.getElementById("txTable");
    if (!transactions.length) { wrap.innerHTML = '<p class="muted">No transactions yet.</p>'; return; }
    wrap.innerHTML = `
      <table style="width:100%;border-collapse:collapse;font-size:0.82rem">
        <thead>
          <tr>
            <th style="text-align:left;padding:0 12px 10px 0;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">Time</th>
            <th style="text-align:left;padding:0 12px 10px 0;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">Type</th>
            <th style="text-align:left;padding:0 12px 10px 0;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">User</th>
            <th style="text-align:left;padding:0 12px 10px 0;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">Amount</th>
            <th style="text-align:left;padding:0 12px 10px 0;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">Reason</th>
            <th style="text-align:left;padding:0 0 10px;color:#9ca3af;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.08em;font-weight:500">Balance</th>
          </tr>
        </thead>
        <tbody>
          ${transactions.map(tx => `
            <tr style="border-top:1px solid #f3f4f6">
              <td style="padding:10px 12px 10px 0;color:#9ca3af;font-size:0.75rem">${new Date(tx.timestamp).toLocaleTimeString()}</td>
              <td style="padding:10px 12px 10px 0"><span class="type-pill type-${tx.type}">${tx.type}</span></td>
              <td style="padding:10px 12px 10px 0;font-family:monospace;font-size:0.75rem;color:#374151">${tx.userId}</td>
              <td style="padding:10px 12px 10px 0;font-weight:700;color:${tx.type === 'spend' ? '#dc2626' : '#16a34a'}">
                ${tx.type === 'spend' ? '−' : '+'}${tx.amount} SHRP
              </td>
              <td style="padding:10px 12px 10px 0;color:#9ca3af;font-size:0.75rem">${tx.reason || tx.paymentMethod || '—'}</td>
              <td style="padding:10px 0;color:#111827;font-weight:600">${tx.newBalance} SHRP</td>
            </tr>
          `).join("")}
        </tbody>
      </table>`;
    document.getElementById("statTxCount").textContent = transactions.length;
  } catch (e) { document.getElementById("txTable").innerHTML = '<p class="muted">Backend offline — run: node backend/server.js</p>'; }
}

// ===== STATS =====
async function loadStats() {
  try {
    const r = await fetch(`${BASE}/api/balance/admin/all`, { headers: headers() });
    const { balances } = await r.json();
    document.getElementById("statUsers").textContent = Object.keys(balances).length;
    const total = Object.values(balances).reduce((a, b) => a + b, 0);
    document.getElementById("statTotal").textContent = total.toLocaleString() + " SHRP";
  } catch {}
}

// ===== SDK SNIPPET =====
function renderSnippet() {
  const key = apiKey();
  document.getElementById("sdkSnippet").textContent =
`// 1. Include SDK
<script src="http://localhost:4000/sdk/sharpkit.js"><\/script>

// 2. Initialize
SharpKit.init({ apiKey: "${key}", baseUrl: "http://localhost:4000" });

// 3. Use anywhere
await SharpKit.reward("user123", 50, "daily_login");
await SharpKit.spend("user123", 20, "redeem");
const bal = await SharpKit.getBalance("user123");
console.log(bal); // { userId: "user123", balance: 280 }`;
}

function copySnippet() {
  navigator.clipboard.writeText(document.getElementById("sdkSnippet").textContent).then(() => {
    const el = document.getElementById("copyMsg");
    el.classList.remove("hidden");
    setTimeout(() => el.classList.add("hidden"), 2000);
  });
}

// ===== INIT =====
document.getElementById("apiKeyInput").addEventListener("input", renderSnippet);

async function init() {
  await Promise.all([loadStats(), loadTxLog(), loadRules()]);
  renderSnippet();
}

init();
setInterval(() => { loadStats(); loadTxLog(); }, 15000);
