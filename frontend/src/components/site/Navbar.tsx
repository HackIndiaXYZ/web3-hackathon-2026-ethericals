import { useEffect, useState } from "react";
import { Link } from "@tanstack/react-router";
import { Menu, Moon, Sun, Wallet, X } from "lucide-react";
import { Logo } from "./Logo";
import { useTheme } from "./theme";
import { Button } from "@/components/ui/button";
import { useWallet } from "@/Hooks/useWallet";
import { cn } from "@/lib/utils";

const links = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/store", label: "Demo Store" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/api", label: "API" },
] as const;

export function Navbar() {
  const { theme, toggle } = useTheme();
  const wallet = useWallet();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "fixed inset-x-0 top-0 z-50 transition-all duration-300",
        scrolled ? "py-2" : "py-4",
      )}
    >
      <div className="mx-auto max-w-7xl px-4">
        <nav
          className={cn(
            "flex items-center justify-between rounded-2xl px-4 py-2.5 transition-all duration-300",
            scrolled ? "glass shadow-elegant" : "border border-transparent",
          )}
        >
          <Link to="/" aria-label="SharpKit home">
            <Logo />
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                className="rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                activeProps={{ className: "text-foreground" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={toggle}
              aria-label="Toggle color theme"
              className="min-h-11 min-w-11 rounded-xl"
            >
              {theme === "dark" ? <Sun className="size-5" /> : <Moon className="size-5" />}
            </Button>

            {/* Wallet connect button */}
            {wallet.address ? (
              <button
                onClick={wallet.disconnect}
                title="Click to disconnect"
                className={cn(
                  "hidden sm:flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2 text-sm font-medium transition-colors hover:bg-secondary",
                  !wallet.isSepolia && "border-destructive/50",
                )}
              >
                <span
                  className={cn(
                    "h-2 w-2 rounded-full",
                    wallet.isSepolia ? "bg-reward" : "bg-destructive",
                  )}
                />
                <span className="font-mono text-xs">{wallet.shortAddress}</span>
              </button>
            ) : (
              <Button
                variant="glass"
                size="sm"
                className="hidden sm:inline-flex gap-1.5 rounded-xl"
                onClick={wallet.connect}
                disabled={wallet.connecting}
              >
                <Wallet className="size-4" />
                {wallet.connecting ? "…" : "Connect"}
              </Button>
            )}

            <Button asChild variant="hero" className="hidden btn-shine sm:inline-flex">
              <Link to="/api">Try API</Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="min-h-11 min-w-11 rounded-xl md:hidden"
              onClick={() => setOpen((v) => !v)}
              aria-label={open ? "Close menu" : "Open menu"}
            >
              {open ? <X className="size-5" /> : <Menu className="size-5" />}
            </Button>
          </div>
        </nav>

        {open && (
          <div className="glass mt-2 flex flex-col gap-1 rounded-2xl p-3 shadow-elegant md:hidden">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                activeProps={{ className: "text-foreground bg-secondary" }}
                activeOptions={{ exact: l.to === "/" }}
              >
                {l.label}
              </Link>
            ))}
            {wallet.address ? (
              <button
                onClick={() => { wallet.disconnect(); setOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <span className={cn("h-2 w-2 rounded-full", wallet.isSepolia ? "bg-reward" : "bg-destructive")} />
                <span className="font-mono">{wallet.shortAddress}</span>
                <span className="ml-auto text-xs">Disconnect</span>
              </button>
            ) : (
              <button
                onClick={() => { wallet.connect(); setOpen(false); }}
                className="flex items-center gap-2 rounded-xl px-4 py-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              >
                <Wallet className="size-4" />
                {wallet.connecting ? "Connecting…" : "Connect MetaMask"}
              </button>
            )}
            <Button asChild variant="hero" className="mt-1">
              <Link to="/api" onClick={() => setOpen(false)}>Try API</Link>
            </Button>
          </div>
        )}
      </div>
    </header>
  );
}