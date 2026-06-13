import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import {
  ArrowDownLeft,
  ArrowUpRight,
  CheckCircle,
  CreditCard,
  RefreshCw,
  Wallet,
  XCircle,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Reveal } from "@/components/site/Reveal";
import { useWallet } from "@/Hooks/useWallet";
import { sharpkit } from "@/Hooks/useSharpKit";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/api")({
  head: () => ({
    meta: [
      { title: "API Playground — SharpKit" },
      {
        name: "description",
        content:
          "Live Earn, Spend, and Buy SHRP tokens using the SharpKit API. Connect MetaMask for on-chain purchases.",
      },
    ],
  }),
  component: ApiPlayground,
});

// ─── Types ────────────────────────────────────────────────────────────────────
type Status = { ok: boolean; msg: string } | null;

// ─── Shared config ────────────────────────────────────────────────────────────
const DEFAULT_USER = "user123";
const API_KEY = "test_key";

// ─── Root component ───────────────────────────────────────────────────────────
function ApiPlayground() {
  const wallet = useWallet();
  const [userId, setUserId] = useState(DEFAULT_USER);
  const [txLog, setTxLog] = useState<TxRow[]>([]);
  const [loadingLog, setLoadingLog] = useState(false);

  async function refreshLog() {
    setLoadingLog(true);
    try {
      const { transactions } = await sharpkit.txLog(30, API_KEY);
      setTxLog(transactions);
    } catch {
      setTxLog([]);
    } finally {
      setLoadingLog(false);
    }
  }

  return (
    <div className="overflow-clip">
      {/* Header */}
      <section className="relative">
        <div className="pointer-events-none absolute inset-0 bg-hero" aria-hidden="true" />
        <div className="relative mx-auto max-w-7xl px-4 pb-8 pt-32 md:pt-40">
          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full glass px-4 py-1.5 text-sm font-medium text-foreground">
              <span className="h-2 w-2 rounded-full bg-reward animate-pulse" />
              Live API — connected to{" "}
              <code className="text-xs font-mono text-muted-foreground">
                localhost:4000
              </code>
            </span>
            <h1 className="mt-4 font-display text-4xl font-extrabold text-foreground sm:text-5xl">
              API <span className="text-gradient">Playground</span>
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              Earn, Spend, and Buy SHRP tokens in real-time. All actions hit the live
              SharpKit backend and optionally record on Ethereum Sepolia.
            </p>
          </Reveal>

          {/* Config bar */}
          <Reveal delay={100} className="mt-8 flex flex-wrap items-end gap-4">
            <div className="flex-1 min-w-[200px] max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                User ID
              </label>
              <Input
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                placeholder="user123"
                className="h-11 rounded-xl font-mono text-sm"
              />
            </div>
            <div className="flex-1 min-w-[200px] max-w-xs">
              <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                API Key
              </label>
              <Input
                value={API_KEY}
                readOnly
                className="h-11 rounded-xl font-mono text-sm text-muted-foreground"
              />
            </div>
            <WalletButton wallet={wallet} />
          </Reveal>
        </div>
      </section>

      {/* Cards grid */}
      <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:grid-cols-2 lg:grid-cols-3">
        <Reveal><BalanceCard userId={userId} /></Reveal>
        <Reveal delay={60}><EarnCard userId={userId} onDone={refreshLog} /></Reveal>
        <Reveal delay={120}><SpendCard userId={userId} onDone={refreshLog} /></Reveal>
        <Reveal delay={180} className="sm:col-span-2 lg:col-span-3">
          <BuyCard userId={userId} wallet={wallet} onDone={refreshLog} />
        </Reveal>
      </section>

      {/* Tx log */}
      <section className="mx-auto max-w-7xl px-4 pb-16">
        <Reveal className="rounded-3xl border border-border bg-card p-6">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-reward" />
              <h2 className="font-display text-lg font-bold text-foreground">
                Transaction Log
              </h2>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshLog}
              disabled={loadingLog}
              className="gap-2 rounded-xl"
            >
              <RefreshCw className={cn("size-4", loadingLog && "animate-spin")} />
              Refresh
            </Button>
          </div>
          {txLog.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              No transactions yet — click Refresh after an action above.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {txLog.map((t) => (
                <TxRow key={t.id} tx={t} />
              ))}
            </ul>
          )}
        </Reveal>
      </section>
    </div>
  );
}

// ─── Wallet button ────────────────────────────────────────────────────────────
function WalletButton({ wallet }: { wallet: ReturnType<typeof useWallet> }) {
  if (wallet.address) {
    return (
      <div className="flex flex-col gap-1">
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
          Wallet
        </label>
        <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5">
          <span
            className={cn(
              "h-2 w-2 rounded-full",
              wallet.isSepolia ? "bg-reward" : "bg-destructive",
            )}
          />
          <span className="font-mono text-sm text-foreground">
            {wallet.shortAddress}
          </span>
          {!wallet.isSepolia && (
            <span className="text-xs text-destructive font-semibold">
              Switch to Sepolia
            </span>
          )}
          <button
            onClick={wallet.disconnect}
            className="ml-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          >
            Disconnect
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-1">
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
        Wallet
      </label>
      <Button
        variant="glass"
        className="h-11 gap-2 rounded-xl"
        onClick={wallet.connect}
        disabled={wallet.connecting}
      >
        <Wallet className="size-4" />
        {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
      </Button>
      {wallet.error && (
        <p className="text-xs text-destructive mt-1">{wallet.error}</p>
      )}
    </div>
  );
}

// ─── Balance card ─────────────────────────────────────────────────────────────
function BalanceCard({ userId }: { userId: string }) {
  const [balance, setBalance] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function check() {
    if (!userId.trim()) return;
    setLoading(true);
    setStatus(null);
    try {
      const data = await sharpkit.balance(userId.trim(), API_KEY);
      setBalance(data.balance);
      setStatus({ ok: true, msg: `Balance loaded for "${userId}"` });
    } catch (e: unknown) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-lift h-full rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-balance/12 text-balance">
          <Wallet className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Balance</h3>
          <p className="text-xs text-muted-foreground">GET /api/balance/:userId</p>
        </div>
      </div>

      {balance !== null && (
        <div className="mb-5 rounded-2xl bg-balance/8 border border-balance/20 p-4 text-center">
          <p className="font-display text-4xl font-extrabold text-balance">
            {balance.toLocaleString()}
          </p>
          <p className="text-xs text-muted-foreground mt-1">SHRP</p>
        </div>
      )}

      <Button
        variant="hero"
        className="w-full btn-shine"
        onClick={check}
        disabled={loading || !userId.trim()}
      >
        {loading ? (
          <RefreshCw className="size-4 animate-spin" />
        ) : (
          <RefreshCw className="size-4" />
        )}
        {loading ? "Loading…" : "Check Balance"}
      </Button>
      <StatusBadge status={status} />
    </div>
  );
}

// ─── Earn card ────────────────────────────────────────────────────────────────
function EarnCard({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("50");
  const [reason, setReason] = useState("daily_login");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function earn() {
    setLoading(true);
    setStatus(null);
    try {
      const data = await sharpkit.earn(userId.trim(), Number(amount), reason, API_KEY);
      setStatus({
        ok: true,
        msg: `+${amount} SHRP earned → new balance: ${data.tx.newBalance}`,
      });
      onDone();
    } catch (e: unknown) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-lift h-full rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-reward/12 text-reward">
          <ArrowDownLeft className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Earn</h3>
          <p className="text-xs text-muted-foreground">POST /api/earn</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Amount (SHRP)
          </label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Reason
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="daily_login"
            className="h-10 rounded-xl font-mono text-sm"
          />
        </div>
      </div>

      <Button
        variant="hero"
        className="w-full btn-shine"
        onClick={earn}
        disabled={loading || !userId.trim() || Number(amount) <= 0}
      >
        <Zap className="size-4" />
        {loading ? "Earning…" : `Earn ${amount} SHRP`}
      </Button>
      <StatusBadge status={status} />
    </div>
  );
}

// ─── Spend card ───────────────────────────────────────────────────────────────
function SpendCard({ userId, onDone }: { userId: string; onDone: () => void }) {
  const [amount, setAmount] = useState("20");
  const [reason, setReason] = useState("redeem_discount");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<Status>(null);

  async function spend() {
    setLoading(true);
    setStatus(null);
    try {
      const data = await sharpkit.spend(userId.trim(), Number(amount), reason, API_KEY);
      setStatus({
        ok: true,
        msg: `-${amount} SHRP redeemed → new balance: ${data.tx.newBalance}`,
      });
      onDone();
    } catch (e: unknown) {
      setStatus({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card-lift h-full rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-5">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-primary/12 text-primary">
          <ArrowUpRight className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Spend</h3>
          <p className="text-xs text-muted-foreground">POST /api/spend</p>
        </div>
      </div>

      <div className="space-y-3 mb-5">
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Amount (SHRP)
          </label>
          <Input
            type="number"
            min="1"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="h-10 rounded-xl"
          />
        </div>
        <div>
          <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Reason
          </label>
          <Input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="redeem_discount"
            className="h-10 rounded-xl font-mono text-sm"
          />
        </div>
      </div>

      <Button
        variant="glass"
        className="w-full"
        onClick={spend}
        disabled={loading || !userId.trim() || Number(amount) <= 0}
      >
        <ArrowUpRight className="size-4" />
        {loading ? "Spending…" : `Spend ${amount} SHRP`}
      </Button>
      <StatusBadge status={status} />
    </div>
  );
}

// ─── Buy card ─────────────────────────────────────────────────────────────────
function BuyCard({
  userId,
  wallet,
  onDone,
}: {
  userId: string;
  wallet: ReturnType<typeof useWallet>;
  onDone: () => void;
}) {
  const [amount, setAmount] = useState("100");
  const [fiatLoading, setFiatLoading] = useState(false);
  const [cryptoLoading, setCryptoLoading] = useState(false);
  const [fiatStatus, setFiatStatus] = useState<Status>(null);
  const [cryptoStatus, setCryptoStatus] = useState<Status>(null);

  async function buyFiat() {
    setFiatLoading(true);
    setFiatStatus(null);
    try {
      const data = await sharpkit.buyFiat(userId.trim(), Number(amount), API_KEY);
      setFiatStatus({
        ok: true,
        msg: `+${amount} SHRP purchased (fiat) → balance: ${data.tx.newBalance}`,
      });
      onDone();
    } catch (e: unknown) {
      setFiatStatus({ ok: false, msg: e instanceof Error ? e.message : "Error" });
    } finally {
      setFiatLoading(false);
    }
  }

  async function buyCrypto() {
    if (!window.ethereum) {
      setCryptoStatus({ ok: false, msg: "MetaMask not found — install the extension." });
      return;
    }
    if (!wallet.address) {
      setCryptoStatus({ ok: false, msg: "Connect MetaMask first." });
      return;
    }
    if (!wallet.isSepolia) {
      setCryptoStatus({ ok: false, msg: "Switch MetaMask to Sepolia network." });
      return;
    }
    setCryptoLoading(true);
    setCryptoStatus(null);
    try {
      // 1000 SHRP = 1 ETH → amount SHRP = (amount/1000) ETH
      const ethWei = BigInt(Math.floor((Number(amount) / 1000) * 1e18));
      const val = "0x" + ethWei.toString(16);

      setCryptoStatus({ ok: true, msg: "Waiting for MetaMask signature…" });
      const txHash = (await window.ethereum.request({
        method: "eth_sendTransaction",
        params: [{ from: wallet.address, to: wallet.address, value: val, gas: "0x5208" }],
      })) as string;

      setCryptoStatus({ ok: true, msg: "Transaction submitted — verifying on Sepolia…" });
      const data = await sharpkit.verifyCrypto(userId.trim(), txHash, Number(amount), API_KEY);
      setCryptoStatus({
        ok: true,
        msg: `+${amount} SHRP verified on-chain (block #${data.tx.blockNumber}) → balance: ${data.tx.newBalance}`,
      });
      onDone();
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Error";
      setCryptoStatus({ ok: false, msg });
    } finally {
      setCryptoLoading(false);
    }
  }

  const ethCost = (Number(amount) / 1000).toFixed(4);

  return (
    <div className="card-lift rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-3 mb-6">
        <span className="grid h-11 w-11 place-items-center rounded-2xl bg-shrp/12 text-shrp">
          <CreditCard className="size-5" />
        </span>
        <div>
          <h3 className="font-display text-lg font-bold text-foreground">Buy SHRP</h3>
          <p className="text-xs text-muted-foreground">
            POST /api/buy/mock &nbsp;·&nbsp; POST /api/buy/verify-crypto
          </p>
        </div>
        <span className="ml-auto rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
          1000 SHRP = 1 ETH
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Fiat */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">
            Mock card payment (instant)
          </p>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amount (SHRP)
            </label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 rounded-xl"
            />
          </div>
          <Button
            variant="hero"
            className="w-full btn-shine"
            onClick={buyFiat}
            disabled={fiatLoading || !userId.trim() || Number(amount) <= 0}
          >
            <CreditCard className="size-4" />
            {fiatLoading ? "Processing…" : `Buy ${amount} SHRP with Card`}
          </Button>
          <StatusBadge status={fiatStatus} />
        </div>

        {/* Crypto */}
        <div className="rounded-2xl border border-border bg-secondary/30 p-5">
          <p className="mb-4 text-sm font-semibold text-foreground">
            MetaMask — Ethereum Sepolia
          </p>
          <div className="mb-4">
            <label className="mb-1 block text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Amount (SHRP)
            </label>
            <Input
              type="number"
              min="1"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="h-10 rounded-xl"
            />
            <p className="mt-1 text-xs text-muted-foreground">
              ≈ {ethCost} ETH on Sepolia
            </p>
          </div>
          {wallet.address ? (
            <div className="mb-3 flex items-center gap-2 rounded-xl bg-card px-3 py-2">
              <span
                className={cn(
                  "h-2 w-2 rounded-full",
                  wallet.isSepolia ? "bg-reward" : "bg-destructive",
                )}
              />
              <span className="font-mono text-xs text-foreground">
                {wallet.shortAddress}
              </span>
              {!wallet.isSepolia && (
                <span className="text-xs font-semibold text-destructive">
                  Switch to Sepolia
                </span>
              )}
            </div>
          ) : (
            <Button
              variant="glass"
              className="w-full mb-3 rounded-xl"
              onClick={wallet.connect}
              disabled={wallet.connecting}
            >
              <Wallet className="size-4" />
              {wallet.connecting ? "Connecting…" : "Connect MetaMask first"}
            </Button>
          )}
          <Button
            variant="glass"
            className="w-full"
            onClick={buyCrypto}
            disabled={
              cryptoLoading ||
              !wallet.address ||
              !wallet.isSepolia ||
              !userId.trim() ||
              Number(amount) <= 0
            }
          >
            <Wallet className="size-4" />
            {cryptoLoading ? "Verifying on-chain…" : `Buy ${amount} SHRP with MetaMask`}
          </Button>
          <StatusBadge status={cryptoStatus} />
        </div>
      </div>
    </div>
  );
}

// ─── Transaction row ──────────────────────────────────────────────────────────
type TxRow = {
  id: string;
  type: string;
  userId: string;
  amount: number;
  reason?: string;
  newBalance: number;
  timestamp: string;
};

function TxRow({ tx }: { tx: TxRow }) {
  const isCredit = tx.type === "earn" || tx.type.startsWith("buy");
  return (
    <li className="flex items-center justify-between gap-3 py-3">
      <div className="flex min-w-0 items-center gap-3">
        <span
          className={cn(
            "grid h-9 w-9 shrink-0 place-items-center rounded-xl text-xs",
            isCredit ? "bg-reward/12 text-reward" : "bg-primary/12 text-primary",
          )}
        >
          {isCredit ? <ArrowDownLeft className="size-4" /> : <ArrowUpRight className="size-4" />}
        </span>
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-foreground">
            {tx.reason || tx.type} · <span className="font-mono text-xs text-muted-foreground">{tx.userId}</span>
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {new Date(tx.timestamp).toLocaleString()} · balance after: {tx.newBalance}
          </p>
        </div>
      </div>
      <span
        className={cn(
          "shrink-0 font-display font-bold",
          isCredit ? "text-reward" : "text-primary",
        )}
      >
        {isCredit ? "+" : "-"}
        {tx.amount} SHRP
      </span>
    </li>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: Status }) {
  if (!status) return null;
  return (
    <div
      className={cn(
        "mt-3 flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm",
        status.ok
          ? "bg-reward/8 border border-reward/20 text-reward"
          : "bg-destructive/8 border border-destructive/20 text-destructive",
      )}
    >
      {status.ok ? (
        <CheckCircle className="mt-0.5 size-4 shrink-0" />
      ) : (
        <XCircle className="mt-0.5 size-4 shrink-0" />
      )}
      <span className="text-xs leading-snug">{status.msg}</span>
    </div>
  );
}
