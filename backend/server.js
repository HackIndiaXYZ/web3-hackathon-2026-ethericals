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

// ─── Static — SDK, widget, frontend client assets ──────────────────────────
app.use("/sdk",    express.static(path.join(__dirname, "../sdk")));
app.use("/widget", express.static(path.join(__dirname, "../widget")));
app.use(express.static(path.join(__dirname, "../frontend/dist/client")));

// ─── SSR Fallback — forwards non-API requests to TanStack Start SSR handler ─
let _ssrHandler = null;
async function getSSRHandler() {
  if (_ssrHandler) return _ssrHandler;
  try {
    const mod = await import(path.join(__dirname, "../frontend/dist/server/server.js"));
    _ssrHandler = mod.default;
    return _ssrHandler;
  } catch {
    return null;
  }
}

app.get("*", async (req, res) => {
  const handler = await getSSRHandler();
  if (!handler) {
    return res.status(503).send(
      "Frontend not built. Run: cd frontend && npm run build"
    );
  }
  try {
    const protocol = req.protocol || "http";
    const host     = req.headers.host || `localhost:${process.env.PORT || 4000}`;
    const webReq   = new Request(`${protocol}://${host}${req.url}`, {
      method: req.method,
      headers: Object.fromEntries(
        Object.entries(req.headers).filter(([, v]) => v != null)
      ),
    });
    const webRes = await handler.fetch(webReq);
    res.status(webRes.status);
    for (const [key, value] of webRes.headers.entries()) {
      res.setHeader(key, value);
    }
    res.send(Buffer.from(await webRes.arrayBuffer()));
  } catch (err) {
    console.error("[SSR]", err.message);
    res.status(500).send("SSR error — check server logs");
  }
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`SharpKit v2 running → http://localhost:${PORT}`));
