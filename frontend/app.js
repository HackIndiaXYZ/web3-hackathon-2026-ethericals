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
  el.style.background = isError ? "#3a1a1a" : "#fff";
  el.style.color = isError ? "#ff8080" : "#000";
  el.classList.remove("hidden");
  setTimeout(() => el.classList.add("hidden"), 3000);
}

// ===== SHOW RESULT =====
function showResult(id, data, isError = false) {
  const el = document.getElementById(id);
  el.classList.remove("hidden", "success", "error");
  el.classList.add(isError ? "error" : "success");
  el.textContent = JSON.stringify(data, null, 2);
}

// ===== EARN =====
async function doEarn() {
  const userId = document.getElementById("earnUserId").value.trim();
  const amount = Number(document.getElementById("earnAmount").value);
  const reason = document.getElementById("earnReason").value.trim();
  try {
    const r = await fetch(`${BASE}/api/earn`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, reason }) });
    const data = await r.json();
    showResult("earnResult", data, !r.ok);
    if (r.ok) { toast(`✅ Rewarded ${amount} SHRP to ${userId}`); loadStats(); loadTxLog(); }
    else toast(data.error, true);
  } catch (e) { showResult("earnResult", { error: e.message }, true); }
}

// ===== SPEND =====
async function doSpend() {
  const userId = document.getElementById("spendUserId").value.trim();
  const amount = Number(document.getElementById("spendAmount").value);
  const reason = document.getElementById("spendReason").value.trim();
  try {
    const r = await fetch(`${BASE}/api/spend`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, reason }) });
    const data = await r.json();
    showResult("spendResult", data, !r.ok);
    if (r.ok) { toast(`💸 Spent ${amount} SHRP from ${userId}`); loadStats(); loadTxLog(); }
    else toast(data.error || "Insufficient balance", true);
  } catch (e) { showResult("spendResult", { error: e.message }, true); }
}

// ===== BALANCE =====
async function doBalance() {
  const userId = document.getElementById("balUserId").value.trim();
  try {
    const r = await fetch(`${BASE}/api/balance/${userId}`, { headers: headers() });
    const data = await r.json();
    showResult("balResult", data, !r.ok);
  } catch (e) { showResult("balResult", { error: e.message }, true); }
}

// ===== BUY FIAT =====
async function doBuyFiat() {
  const userId = document.getElementById("buyUserId").value.trim();
  const amount = Number(document.getElementById("buyAmount").value);
  const resultEl = document.getElementById("buyResult");
  resultEl.classList.add("hidden");
  toast("⏳ Processing payment…");
  try {
    const r = await fetch(`${BASE}/api/buy/mock`, { method: "POST", headers: headers(), body: JSON.stringify({ userId, amount, paymentMethod: "card" }) });
    const data = await r.json();
    showResult("buyResult", data, !r.ok);
    if (r.ok) { toast(`✅ Purchased ${amount} SHRP via card`); loadStats(); loadTxLog(); }
    else toast(data.error, true);
  } catch (e) { showResult("buyResult", { error: e.message }, true); }
}

// ===== BUY CRYPTO (MetaMask) =====
async function doBuyCrypto() {
  const userId = document.getElementById("buyUserId").value.trim();
  const amount = Number(document.getElementById("buyAmount").value);
  const walletEl = document.getElementById("walletAddress");

  if (!window.ethereum) {
    toast("MetaMask not found. Install MetaMask first.", true);
    return;
  }

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
  }
}

// ===== RULES =====
async function loadRules() {
  try {
    const r = await fetch(`${BASE}/api/balance/rules/all`, { headers: headers() });
    const { rules } = await r.json();
    const list = document.getElementById("rulesList");
    list.innerHTML = rules.map(rule => `
      <div class="rule-row">
        <span class="rule-name">${rule.name}</span>
        <span class="rule-event">${rule.event}</span>
        <span class="rule-reward">+${rule.reward} SHRP</span>
        <button class="rule-del" onclick="deleteRule('${rule.id}')">✕ Remove</button>
      </div>
    `).join("") || '<p class="muted">No rules yet.</p>';
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
      <table>
        <thead><tr><th>Time</th><th>Type</th><th>User</th><th>Amount</th><th>Reason</th><th>New Balance</th></tr></thead>
        <tbody>
          ${transactions.map(tx => `
            <tr>
              <td>${new Date(tx.timestamp).toLocaleTimeString()}</td>
              <td><span class="type-pill type-${tx.type}">${tx.type}</span></td>
              <td>${tx.userId}</td>
              <td style="color:${tx.type === 'spend' ? 'var(--spend)' : 'var(--earn)'};font-weight:700">
                ${tx.type === 'spend' ? '-' : '+'}${tx.amount} SHRP
              </td>
              <td class="muted">${tx.reason || tx.paymentMethod || '—'}</td>
              <td>${tx.newBalance} SHRP</td>
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
