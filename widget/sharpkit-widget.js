(function () {
  "use strict";

  // ─── Config ──────────────────────────────────────────────────────────────
  const script  = document.currentScript;
  const W       = window.SharpKitConfig || {};
  const API_KEY = script?.dataset?.key      || W.apiKey  || "test_key";
  const USER_ID = script?.dataset?.userId   || W.userId  || "guest";
  const BASE    = script?.dataset?.baseUrl  || W.baseUrl || "http://localhost:4000";

  // ─── Inject styles ───────────────────────────────────────────────────────
  const CSS = `
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap');
    #sk-btn {
      position: fixed; bottom: 24px; right: 24px; z-index: 99999;
      width: 52px; height: 52px; border-radius: 50%;
      background: #fff; border: none; cursor: pointer;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      display: flex; align-items: center; justify-content: center;
      font-size: 20px; transition: transform 0.2s;
      font-family: 'Inter', sans-serif;
    }
    #sk-btn:hover { transform: scale(1.08); }
    #sk-btn .sk-dot {
      width: 10px; height: 10px; background: #000; border-radius: 50%;
    }
    #sk-panel {
      position: fixed; bottom: 88px; right: 24px; z-index: 99998;
      width: 320px; background: #0c0c0c; border: 1px solid rgba(255,255,255,0.1);
      border-radius: 14px; overflow: hidden;
      box-shadow: 0 16px 48px rgba(0,0,0,0.7);
      font-family: 'Inter', sans-serif;
      transform: translateY(16px) scale(0.97); opacity: 0;
      transition: all 0.2s cubic-bezier(0.16,1,0.3,1);
      pointer-events: none;
    }
    #sk-panel.sk-open {
      transform: translateY(0) scale(1); opacity: 1; pointer-events: all;
    }
    .sk-head {
      display: flex; align-items: center; justify-content: space-between;
      padding: 14px 16px; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .sk-head-left { display: flex; align-items: center; gap: 8px; }
    .sk-head-dot { width: 8px; height: 8px; background: #fff; border-radius: 50%; animation: sk-pulse 2s infinite; }
    @keyframes sk-pulse { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:.4;transform:scale(.7)} }
    .sk-head-title { font-size: 13px; font-weight: 700; color: #fff; letter-spacing: -0.2px; }
    .sk-close {
      background: none; border: none; color: rgba(255,255,255,0.4);
      cursor: pointer; font-size: 16px; line-height: 1; padding: 2px 6px;
      border-radius: 4px; transition: color 0.15s;
    }
    .sk-close:hover { color: #fff; }
    .sk-balance-block {
      padding: 20px 16px 16px; text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .sk-user-id { font-size: 11px; color: rgba(255,255,255,0.3); margin-bottom: 6px; font-family: monospace; }
    .sk-balance-num { font-size: 36px; font-weight: 800; color: #fff; letter-spacing: -2px; line-height: 1; }
    .sk-balance-label { font-size: 11px; color: rgba(255,255,255,0.35); margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .sk-tabs {
      display: flex; border-bottom: 1px solid rgba(255,255,255,0.07);
    }
    .sk-tab {
      flex: 1; padding: 9px 4px; font-size: 11px; font-weight: 600; text-align: center;
      color: rgba(255,255,255,0.35); cursor: pointer; transition: all 0.15s;
      background: none; border: none; font-family: 'Inter', sans-serif;
      text-transform: uppercase; letter-spacing: 0.5px;
    }
    .sk-tab.sk-active { color: #fff; background: rgba(255,255,255,0.05); }
    .sk-tab-pane { padding: 14px 16px; display: none; }
    .sk-tab-pane.sk-active { display: block; }
    .sk-label { font-size: 10px; color: rgba(255,255,255,0.3); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 4px; }
    .sk-input {
      width: 100%; background: #1a1a1a; border: 1px solid rgba(255,255,255,0.1);
      color: #fff; padding: 8px 10px; border-radius: 7px; font-size: 13px;
      outline: none; margin-bottom: 10px; font-family: 'Inter', sans-serif;
      transition: border-color 0.15s;
    }
    .sk-input:focus { border-color: rgba(255,255,255,0.3); }
    .sk-btn-primary {
      width: 100%; padding: 9px; background: #fff; color: #000;
      border: none; border-radius: 7px; font-size: 13px; font-weight: 600;
      cursor: pointer; font-family: 'Inter', sans-serif; transition: background 0.15s;
    }
    .sk-btn-primary:hover { background: #e5e5e5; }
    .sk-btn-secondary {
      width: 100%; padding: 9px; background: transparent; color: #fff;
      border: 1px solid rgba(255,255,255,0.15); border-radius: 7px; font-size: 13px;
      font-weight: 600; cursor: pointer; font-family: 'Inter', sans-serif;
      margin-top: 6px; transition: border-color 0.15s;
    }
    .sk-btn-secondary:hover { border-color: rgba(255,255,255,0.35); }
    .sk-msg { font-size: 12px; margin-top: 8px; padding: 6px 10px; border-radius: 6px; }
    .sk-msg.ok  { background: rgba(255,255,255,0.08); color: #aaa; }
    .sk-msg.err { background: rgba(255,80,80,0.1); color: #ff8080; }
    .sk-tx-list { max-height: 180px; overflow-y: auto; margin-top: 4px; }
    .sk-tx-row {
      display: flex; justify-content: space-between; align-items: center;
      padding: 7px 0; border-bottom: 1px solid rgba(255,255,255,0.05); font-size: 12px;
    }
    .sk-tx-row:last-child { border-bottom: none; }
    .sk-tx-type { color: rgba(255,255,255,0.4); font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px; }
    .sk-tx-amt { font-weight: 700; color: #fff; }
    .sk-tx-amt.neg { color: #ff8080; }
    .sk-powered { text-align: center; font-size: 10px; color: rgba(255,255,255,0.2); padding: 10px; }
    .sk-powered a { color: rgba(255,255,255,0.35); text-decoration: none; }
    .sk-powered a:hover { color: rgba(255,255,255,0.6); }
  `;
  const styleEl = document.createElement("style");
  styleEl.textContent = CSS;
  document.head.appendChild(styleEl);

  // ─── Build DOM ───────────────────────────────────────────────────────────
  const btn = document.createElement("button");
  btn.id = "sk-btn";
  btn.innerHTML = `<span class="sk-dot"></span>`;
  btn.title = "SharpKit — SHRP Wallet";

  const panel = document.createElement("div");
  panel.id = "sk-panel";
  panel.innerHTML = `
    <div class="sk-head">
      <div class="sk-head-left">
        <span class="sk-head-dot"></span>
        <span class="sk-head-title">SharpKit</span>
      </div>
      <button class="sk-close" id="sk-close-btn">✕</button>
    </div>
    <div class="sk-balance-block">
      <div class="sk-user-id">${USER_ID}</div>
      <div class="sk-balance-num" id="sk-bal-num">—</div>
      <div class="sk-balance-label">SHRP Balance</div>
    </div>
    <div class="sk-tabs">
      <button class="sk-tab sk-active" data-tab="activity">Activity</button>
      <button class="sk-tab" data-tab="earn">Earn</button>
      <button class="sk-tab" data-tab="redeem">Redeem</button>
      <button class="sk-tab" data-tab="buy">Buy</button>
    </div>
    <div id="sk-pane-activity" class="sk-tab-pane sk-active">
      <div class="sk-tx-list" id="sk-tx-list"><p style="color:rgba(255,255,255,.3);font-size:12px">Loading…</p></div>
    </div>
    <div id="sk-pane-earn" class="sk-tab-pane">
      <div class="sk-label">Reason / Event</div>
      <input class="sk-input" id="sk-earn-reason" type="text" value="daily_login" placeholder="daily_login"/>
      <div class="sk-label">Amount (SHRP)</div>
      <input class="sk-input" id="sk-earn-amount" type="number" value="10" min="1"/>
      <button class="sk-btn-primary" id="sk-earn-btn">Earn Tokens</button>
      <div id="sk-earn-msg" class="sk-msg" style="display:none"></div>
    </div>
    <div id="sk-pane-redeem" class="sk-tab-pane">
      <div class="sk-label">Redeem for</div>
      <input class="sk-input" id="sk-spend-reason" type="text" value="discount" placeholder="discount"/>
      <div class="sk-label">Amount (SHRP)</div>
      <input class="sk-input" id="sk-spend-amount" type="number" value="20" min="1"/>
      <button class="sk-btn-primary" id="sk-spend-btn">Redeem Tokens</button>
      <div id="sk-spend-msg" class="sk-msg" style="display:none"></div>
    </div>
    <div id="sk-pane-buy" class="sk-tab-pane">
      <div class="sk-label">Amount (SHRP)</div>
      <input class="sk-input" id="sk-buy-amount" type="number" value="100" min="1"/>
      <button class="sk-btn-primary" id="sk-buy-fiat-btn">Buy with Card (Mock)</button>
      <button class="sk-btn-secondary" id="sk-buy-crypto-btn">Buy with MetaMask</button>
      <div id="sk-buy-msg" class="sk-msg" style="display:none"></div>
    </div>
    <div class="sk-powered">Powered by <a href="http://localhost:4000" target="_blank">SharpKit</a></div>
  `;

  document.body.appendChild(btn);
  document.body.appendChild(panel);

  // ─── Helpers ─────────────────────────────────────────────────────────────
  function h() { return { "Content-Type": "application/json", "x-api-key": API_KEY }; }

  async function apiPost(path, body) {
    const r = await fetch(`${BASE}${path}`, { method: "POST", headers: h(), body: JSON.stringify(body) });
    return [r.ok, await r.json()];
  }

  function showMsg(id, text, isErr) {
    const el = document.getElementById(id);
    el.textContent = text; el.style.display = "block";
    el.className = "sk-msg " + (isErr ? "err" : "ok");
    setTimeout(() => { el.style.display = "none"; }, 3000);
  }

  // ─── Balance & Activity ──────────────────────────────────────────────────
  async function refreshBalance() {
    try {
      const r = await fetch(`${BASE}/api/balance/${USER_ID}`, { headers: h() });
      const { balance } = await r.json();
      document.getElementById("sk-bal-num").textContent = (balance || 0).toLocaleString();
    } catch { document.getElementById("sk-bal-num").textContent = "—"; }
  }

  async function loadActivity() {
    try {
      const r = await fetch(`${BASE}/api/balance/txlog/all?limit=10`, { headers: h() });
      const { transactions } = await r.json();
      const userTxs = transactions.filter(t => t.userId === USER_ID).slice(0, 8);
      const list = document.getElementById("sk-tx-list");
      if (!userTxs.length) { list.innerHTML = '<p style="color:rgba(255,255,255,.3);font-size:12px">No activity yet.</p>'; return; }
      list.innerHTML = userTxs.map(tx => `
        <div class="sk-tx-row">
          <div>
            <div style="color:#fff;font-size:12px">${tx.reason || tx.paymentMethod || tx.type}</div>
            <div class="sk-tx-type">${tx.type} · ${new Date(tx.timestamp).toLocaleTimeString()}</div>
          </div>
          <div class="sk-tx-amt ${tx.type === 'spend' ? 'neg' : ''}">
            ${tx.type === 'spend' ? '-' : '+'}${tx.amount} SHRP
          </div>
        </div>
      `).join("");
    } catch {}
  }

  // ─── Tab switching ────────────────────────────────────────────────────────
  panel.querySelectorAll(".sk-tab").forEach(tab => {
    tab.addEventListener("click", () => {
      panel.querySelectorAll(".sk-tab").forEach(t => t.classList.remove("sk-active"));
      panel.querySelectorAll(".sk-tab-pane").forEach(p => p.classList.remove("sk-active"));
      tab.classList.add("sk-active");
      document.getElementById("sk-pane-" + tab.dataset.tab).classList.add("sk-active");
      if (tab.dataset.tab === "activity") loadActivity();
    });
  });

  // ─── Toggle panel ─────────────────────────────────────────────────────────
  let open = false;
  function openPanel() {
    open = true; panel.classList.add("sk-open");
    refreshBalance(); loadActivity();
  }
  function closePanel() { open = false; panel.classList.remove("sk-open"); }

  btn.addEventListener("click", () => open ? closePanel() : openPanel());
  document.getElementById("sk-close-btn").addEventListener("click", closePanel);
  document.addEventListener("click", e => {
    if (open && !panel.contains(e.target) && e.target !== btn) closePanel();
  });

  // ─── Earn ─────────────────────────────────────────────────────────────────
  document.getElementById("sk-earn-btn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("sk-earn-amount").value);
    const reason = document.getElementById("sk-earn-reason").value.trim() || "reward";
    const [ok, data] = await apiPost("/api/earn", { userId: USER_ID, amount, reason });
    if (ok) { showMsg("sk-earn-msg", `+${amount} SHRP earned!`, false); refreshBalance(); loadActivity(); }
    else     showMsg("sk-earn-msg", data.error || "Error", true);
  });

  // ─── Redeem ───────────────────────────────────────────────────────────────
  document.getElementById("sk-spend-btn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("sk-spend-amount").value);
    const reason = document.getElementById("sk-spend-reason").value.trim() || "redeem";
    const [ok, data] = await apiPost("/api/spend", { userId: USER_ID, amount, reason });
    if (ok) { showMsg("sk-spend-msg", `-${amount} SHRP redeemed!`, false); refreshBalance(); loadActivity(); }
    else     showMsg("sk-spend-msg", data.error || "Insufficient balance", true);
  });

  // ─── Buy fiat ─────────────────────────────────────────────────────────────
  document.getElementById("sk-buy-fiat-btn").addEventListener("click", async () => {
    const amount = Number(document.getElementById("sk-buy-amount").value);
    showMsg("sk-buy-msg", "Processing payment…", false);
    const [ok, data] = await apiPost("/api/buy/mock", { userId: USER_ID, amount, paymentMethod: "card" });
    if (ok) { showMsg("sk-buy-msg", `+${amount} SHRP purchased!`, false); refreshBalance(); loadActivity(); }
    else     showMsg("sk-buy-msg", data.error || "Payment failed", true);
  });

  // ─── Buy crypto ───────────────────────────────────────────────────────────
  document.getElementById("sk-buy-crypto-btn").addEventListener("click", async () => {
    if (!window.ethereum) { showMsg("sk-buy-msg", "MetaMask not found", true); return; }
    try {
      const accounts = await window.ethereum.request({ method: "eth_requestAccounts" });
      const chainId  = await window.ethereum.request({ method: "eth_chainId" });
      if (chainId !== "0xaa36a7") { showMsg("sk-buy-msg", "Switch to Sepolia", true); return; }
      const amount  = Number(document.getElementById("sk-buy-amount").value);
      const val     = "0x" + BigInt(Math.floor(amount * 1e15)).toString(16);
      showMsg("sk-buy-msg", "Waiting for MetaMask…", false);
      const txHash  = await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: accounts[0], to: accounts[0], value: val, gas: "0x5208" }],
      });
      const [ok, data] = await apiPost("/api/buy/verify-crypto", { userId: USER_ID, txHash, amount });
      if (ok) { showMsg("sk-buy-msg", `+${amount} SHRP on-chain!`, false); refreshBalance(); loadActivity(); }
      else     showMsg("sk-buy-msg", data.error || "Error", true);
    } catch (e) {
      if (e.code === 4001) showMsg("sk-buy-msg", "Rejected by user", true);
      else showMsg("sk-buy-msg", e.message, true);
    }
  });

})();
