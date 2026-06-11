const express = require("express");
const { v4: uuidv4 } = require("uuid");
const { ethers } = require("ethers");
const { credit, addTx } = require("../store");
const { getProvider } = require("../contract");

const router = express.Router();

// POST /api/buy/mock  — simulated fiat (Razorpay mock)
// Body: { userId, amount, currency?, paymentMethod? }
router.post("/mock", (req, res) => {
  const { userId, amount, currency = "INR", paymentMethod = "card" } = req.body;

  if (!userId || !amount || Number(amount) <= 0) {
    return res.status(400).json({ success: false, error: "userId and amount required" });
  }

  const shrpAmount = Math.floor(Number(amount)); // 1 INR = 1 SHRP for demo
  // Simulate 500ms payment gateway delay
  setTimeout(() => {
    const newBalance = credit(userId, shrpAmount);
    const tx = {
      id: uuidv4(),
      type: "buy_fiat",
      userId,
      amount: shrpAmount,
      fiatAmount: Number(amount),
      currency,
      paymentMethod,
      mockPaymentId: "pay_mock_" + uuidv4().split("-")[0],
      newBalance,
    };
    addTx(tx);
    res.json({ success: true, tx });
  }, 500);
});

// POST /api/buy/verify-crypto  — called after MetaMask tx to credit off-chain ledger
// Body: { userId, txHash, amount }
// On-chain verification: polls Sepolia up to 30s for receipt, checks amount matches
router.post("/verify-crypto", async (req, res) => {
  const { userId, txHash, amount } = req.body;

  if (!userId || !txHash || !amount) {
    return res.status(400).json({ success: false, error: "userId, txHash, amount required" });
  }

  if (!/^0x[0-9a-fA-F]{64}$/.test(txHash)) {
    return res.status(400).json({ success: false, error: "Invalid txHash format" });
  }

  const shrpAmount = Number(amount);
  if (!shrpAmount || shrpAmount <= 0) {
    return res.status(400).json({ success: false, error: "Invalid amount" });
  }

  // Graceful degradation — if RPC not configured, fall back to demo mode (unverified)
  if (!process.env.SEPOLIA_RPC_URL) {
    const newBalance = credit(userId, shrpAmount);
    const tx = { id: uuidv4(), type: "buy_crypto", userId, amount: shrpAmount, txHash, network: "sepolia", verified: false, newBalance };
    addTx(tx);
    return res.json({ success: true, tx, warning: "Unverified: SEPOLIA_RPC_URL not set" });
  }

  let receipt;
  try {
    // waitForTransaction polls until mined OR 30s timeout (returns null on timeout)
    receipt = await getProvider().waitForTransaction(txHash, 1, 30_000);
  } catch (err) {
    return res.status(500).json({ success: false, error: "RPC error: " + err.message });
  }

  // Not mined within 30s — caller should retry
  if (!receipt) {
    return res.status(202).json({ success: false, status: "pending", message: "Transaction not yet confirmed. Retry in 15s." });
  }

  // Transaction reverted on-chain
  if (receipt.status !== 1) {
    return res.status(400).json({ success: false, error: "Transaction failed on-chain (reverted)" });
  }

  // Verify ETH value matches claimed SHRP amount (rate: 1000 SHRP = 1 ETH, ±1% tolerance)
  const onChainTx = await getProvider().getTransaction(txHash);
  const sentEth = parseFloat(ethers.formatEther(onChainTx.value));
  const expectedEth = shrpAmount / 1000;
  if (Math.abs(sentEth - expectedEth) > expectedEth * 0.01) {
    return res.status(400).json({
      success: false,
      error: `Amount mismatch: tx sent ${sentEth} ETH, expected ~${expectedEth} ETH for ${shrpAmount} SHRP`,
    });
  }

  const newBalance = credit(userId, shrpAmount);
  const tx = {
    id: uuidv4(),
    type: "buy_crypto",
    userId,
    amount: shrpAmount,
    txHash,
    network: "sepolia",
    blockNumber: receipt.blockNumber,
    verified: true,
    newBalance,
  };
  addTx(tx);
  res.json({ success: true, tx });
});

module.exports = router;
