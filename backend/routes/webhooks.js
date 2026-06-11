const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getWebhooks, addWebhook, deleteWebhook, getWebhookLogs } = require("../store");

const ALLOWED_EVENTS = ["earn", "spend", "buy_fiat", "buy_crypto", "*"];

const router = express.Router();

// GET /api/webhooks — list registered webhooks
router.get("/", (req, res) => {
  res.json({ webhooks: getWebhooks() });
});

// GET /api/webhooks/logs — recent fire logs
router.get("/logs", (req, res) => {
  const limit = Math.min(Number(req.query.limit) || 50, 200);
  res.json({ logs: getWebhookLogs(limit) });
});

// POST /api/webhooks — register a webhook
router.post("/", (req, res) => {
  const { url, events } = req.body;
  if (!url || !url.startsWith("http")) return res.status(400).json({ error: "Valid url required" });
  const evts = Array.isArray(events) ? events.filter(e => ALLOWED_EVENTS.includes(e)) : ["*"];
  if (!evts.length) return res.status(400).json({ error: "No valid events. Allowed: " + ALLOWED_EVENTS.join(", ") });
  const hook = { id: "wh_" + uuidv4().replace(/-/g, "").slice(0, 16), url, events: evts, createdAt: new Date().toISOString() };
  addWebhook(hook);
  res.status(201).json({ success: true, webhook: hook });
});

// DELETE /api/webhooks/:id
router.delete("/:id", (req, res) => {
  const ok = deleteWebhook(req.params.id);
  res.json({ success: ok });
});

module.exports = router;
