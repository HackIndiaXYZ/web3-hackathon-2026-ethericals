const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { getBalance, debit, addTx, fireWebhooks } = require("../store");

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, amount, reason = "spend" } = req.body;
  if (!userId || typeof userId !== "string")
    return res.status(400).json({ success: false, error: "userId required" });
  const amt = Number(amount);
  if (!amt || amt <= 0 || !Number.isFinite(amt))
    return res.status(400).json({ success: false, error: "Invalid amount" });

  const current = getBalance(userId);
  if (current < amt)
    return res.status(402).json({ success: false, error: "Insufficient balance", balance: current, required: amt });

  const newBalance = debit(userId, amt);
  const tx = { id: uuidv4(), type: "spend", userId, amount: amt, reason, newBalance };
  addTx(tx);

  fireWebhooks("spend", tx).catch(() => {});

  return res.json({ success: true, tx });
});

module.exports = router;
