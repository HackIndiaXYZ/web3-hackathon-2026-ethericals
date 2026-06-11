const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { credit, addTx, fireWebhooks } = require("../store");
const { getContract, getWallet } = require("../contract");

const router = express.Router();

router.post("/", async (req, res) => {
  const { userId, amount, reason = "reward" } = req.body;
  if (!userId || typeof userId !== "string")
    return res.status(400).json({ success: false, error: "userId required" });
  const amt = Number(amount);
  if (!amt || amt <= 0 || !Number.isFinite(amt))
    return res.status(400).json({ success: false, error: "Invalid amount" });

  const newBalance = credit(userId, amt);
  const tx = { id: uuidv4(), type: "earn", userId, amount: amt, reason, newBalance };
  addTx(tx);

  // Fire webhooks async — don't await, don't block response
  fireWebhooks("earn", tx).catch(() => {});

  res.json({ success: true, tx });

  // Fire-and-forget on-chain mint — does NOT block the response
  // Mints to treasury address as an on-chain audit trail of earn activity
  if (process.env.TREASURY_PRIVATE_KEY && process.env.SHARP_TOKEN_ADDRESS) {
    (async () => {
      try {
        const contract = getContract();
        const treasuryAddress = await getWallet().getAddress();
        const mintTx = await contract.mint(
          treasuryAddress,
          BigInt(Math.round(amt)) * BigInt("1000000000000000000"), // amt * 1e18 (wei)
          reason
        );
        console.log(`[earn] On-chain mint submitted: ${mintTx.hash} (${amt} SHRP, reason: ${reason})`);
      } catch (err) {
        console.error(`[earn] On-chain mint failed (non-fatal): ${err.message}`);
      }
    })();
  }
});

module.exports = router;
