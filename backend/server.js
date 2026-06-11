require("dotenv").config();
const express = require("express");
const cors    = require("cors");
const path    = require("path");
const { isValidKey, getAnalytics } = require("./store");

const app = express();
app.use(cors());
app.use(express.json());

// ─── Logger ────────────────────────────────────────────────────────────────
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () =>
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path} → ${res.statusCode} (${Date.now() - start}ms)`)
  );
  next();
});

// ─── Rate Limiting ─────────────────────────────────────────────────────────
const _rateCounts = new Map();
function makeRateLimiter(maxReqs, windowMs) {
  return (req, res, next) => {
    const ip = req.ip || "unknown";
    const key = `${ip}:${Math.floor(Date.now() / windowMs)}`;
    const count = (_rateCounts.get(key) || 0) + 1;
    _rateCounts.set(key, count);
    if (_rateCounts.size > 1000) {
      const cutoff = Math.floor(Date.now() / windowMs) - 2;
      for (const [k] of _rateCounts) {
        if (parseInt(k.split(":")[1]) < cutoff) _rateCounts.delete(k);
      }
    }
    if (count > maxReqs) return res.status(429).json({ error: "Rate limit exceeded. Retry later." });
    next();
  };
}
const globalLimiter = makeRateLimiter(100, 60_000);  // 100 req/min global
const strictLimiter = makeRateLimiter(20, 60_000);   // 20 req/min for earn/spend/buy
app.use(globalLimiter);

// ─── API Key Auth ──────────────────────────────────────────────────────────
function requireApiKey(req, res, next) {
  const key = req.headers["x-api-key"] || req.query.apiKey;
  if (!key || !isValidKey(key))
    return res.status(401).json({ error: "Invalid or missing API key" });
  next();
}

// ─── Routes ────────────────────────────────────────────────────────────────
app.use("/api/earn",      requireApiKey, strictLimiter, require("./routes/earn"));
app.use("/api/spend",     requireApiKey, strictLimiter, require("./routes/spend"));
app.use("/api/buy",       requireApiKey, strictLimiter, require("./routes/buy"));
app.use("/api/balance",   requireApiKey, require("./routes/balance"));
app.use("/api/merchants",               require("./routes/merchants"));   // public list
app.use("/api/keys",      requireApiKey, require("./routes/keys"));
app.use("/api/webhooks",  requireApiKey, require("./routes/webhooks"));

// ─── Analytics ─────────────────────────────────────────────────────────────
app.get("/api/analytics", requireApiKey, (req, res) => res.json(getAnalytics()));

// ─── Health ────────────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "ok", version: "2.0.0" }));

// ─── Static — SDK, widget, frontend ────────────────────────────────────────
app.use("/sdk",    express.static(path.join(__dirname, "../sdk")));
app.use("/widget", express.static(path.join(__dirname, "../widget")));
app.use(express.static(path.join(__dirname, "../frontend")));

// ─── Fallback ──────────────────────────────────────────────────────────────
app.get("*", (req, res) => res.sendFile(path.join(__dirname, "../frontend/index.html")));

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SharpKit v2 running → http://localhost:${PORT}`));
