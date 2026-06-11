const express = require("express");
const { getApiKeys, addApiKey, revokeApiKey } = require("../store");

const router = express.Router();

// GET /api/keys — list all API keys (masked)
router.get("/", (req, res) => {
  const keys = getApiKeys().map(k => ({
    ...k,
    key: k.key.slice(0, 8) + "••••••••••••••••",
    fullKey: k.key,   // include full key for portal display
  }));
  res.json({ keys });
});

// POST /api/keys — generate a new key
router.post("/", (req, res) => {
  const { name } = req.body;
  if (!name) return res.status(400).json({ error: "name required" });
  const record = addApiKey(name);
  res.status(201).json({ success: true, key: record });
});

// DELETE /api/keys/:key — revoke a key
router.delete("/:key", (req, res) => {
  const ok = revokeApiKey(req.params.key);
  res.json({ success: ok });
});

module.exports = router;
