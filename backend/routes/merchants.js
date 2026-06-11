const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getMerchants, getMerchant, addMerchant, deleteMerchant } = require("../store");

const router = express.Router();

// GET /api/merchants — list all active merchants (public, no auth)
router.get("/", (req, res) => {
  const list = getMerchants().filter(m => m.active);
  res.json({ merchants: list, count: list.length });
});

// GET /api/merchants/:id
router.get("/:id", (req, res) => {
  const m = getMerchant(req.params.id);
  if (!m) return res.status(404).json({ error: "Merchant not found" });
  res.json({ merchant: m });
});

// POST /api/merchants — register a merchant (auth required, handled by server)
router.post("/", (req, res) => {
  const { name, category, description, rewardRate, perk, url } = req.body;
  if (!name || !category) return res.status(400).json({ error: "name and category required" });
  const merchant = {
    id: "m_" + uuidv4().replace(/-/g, "").slice(0, 12),
    name, category,
    description: description || "",
    rewardRate:  rewardRate  || "",
    perk:        perk        || "",
    url:         url         || "#",
    active: true,
    createdAt: new Date().toISOString(),
  };
  addMerchant(merchant);
  res.status(201).json({ success: true, merchant });
});

// DELETE /api/merchants/:id
router.delete("/:id", (req, res) => {
  const ok = deleteMerchant(req.params.id);
  res.json({ success: ok });
});

module.exports = router;
