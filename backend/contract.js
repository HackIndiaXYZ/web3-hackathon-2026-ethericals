require("dotenv").config();
const { ethers } = require("ethers");
const { abi } = require("../frontend/SharpToken.json");

// Singleton instances — lazily initialized on first use.
// Reusing one JsonRpcProvider avoids opening a new HTTP connection per request
// and prevents Alchemy rate-limit errors.
let _provider, _wallet, _contract;

function getProvider() {
  if (!_provider) _provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
  return _provider;
}

function getWallet() {
  if (!_wallet) _wallet = new ethers.Wallet(process.env.TREASURY_PRIVATE_KEY, getProvider());
  return _wallet;
}

function getContract() {
  if (!_contract)
    _contract = new ethers.Contract(process.env.SHARP_TOKEN_ADDRESS, abi, getWallet());
  return _contract;
}

module.exports = { getProvider, getWallet, getContract };
