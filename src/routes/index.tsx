import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Sparkles, Shield, Zap, Brain, Wallet, ArrowRightLeft, LineChart,
  Lock, MessageCircle, Rocket, FileText, Coins, Users, CheckCircle2, Copy,
  Twitter, Send, Github, ExternalLink, TrendingUp, Cpu, Fingerprint, Bot,
  Link2, Search, Bitcoin, Wrench, Calculator, QrCode, Clock, Activity, ShieldCheck,
} from "lucide-react";
import pacmanMascot from "@/assets/pacman-mascot.png";
import aiOrb from "@/assets/ai-orb.jpg";
import ghostCompanion from "@/assets/ghost-companion.jpg";
import { LTCTools } from "@/components/ltc-tools";
import { PaymentVerifier } from "@/components/payment-verifier";


export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "LTCme.Click Wallet — Agentic AI Litecoin Wallet & Presale" },
      { name: "description", content: "LTCme.Click is an AI-driven Litecoin wallet with live mainnet tools, a Pac-Man companion, and an active presale. Buy LTCme with SOL or LTC — pre-minted supply, instant token delivery on verified payment." },
      { property: "og:title", content: "LTCme.Click Wallet — Agentic AI Litecoin Wallet & Presale" },
      { property: "og:description", content: "AI-driven Litecoin wallet + presale on Solana & Litecoin. Live LTC mainnet tools built in: fee estimator, mempool, halving countdown, tx lookup, mining calc." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://ltcme.click/" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LTCme.Click Wallet — Agentic AI Litecoin Wallet" },
      { name: "twitter:description", content: "AI-driven Litecoin wallet with live mainnet tools and an active presale." },
    ],
    links: [{ rel: "canonical", href: "https://ltcme.click/" }],
    scripts: [{
      type: "application/ld+json",
      children: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebSite",
        name: "LTCme.Click Wallet",
        url: "https://ltcme.click/",
        description: "Agentic AI-powered Litecoin wallet with live mainnet tools and presale.",
      }),
    }],
  }),
});


// Presale closes at a fixed moment — countdown ticks down to the second.
const PRESALE_END = new Date("2026-09-15T00:00:00Z").getTime();
const TOTAL_SUPPLY = 1_000_000_000; // 1B LTCME minted on Solana
const PRESALE_ALLOCATION = 500_000_000; // 50% reserved in the presale wallet
const SOLD = 128_400_000;
const TOKEN_MINT = "99Cxx8YokdjqwxoWq3NPgViqLtn7Kmt4KVTaKyYFPe7p";
const SOL_DEV_WALLET = "Ew8mbrKwD6LGaSX28a6XGmXqeQSs2hykRibjXVhftTRC";

// Presale price is fixed in USD: LTCME received = USD paid ÷ 0.00010
const PRICE_USD_PER_TOKEN = 0.0001;
const SOL_USD = 150; // reference price for on-page conversion
const PRICE_SOL_PER_TOKEN = PRICE_USD_PER_TOKEN / SOL_USD;
const HARD_CAP_USD = PRESALE_ALLOCATION * PRICE_USD_PER_TOKEN; // $50,000
const FDV_USD = TOTAL_SUPPLY * PRICE_USD_PER_TOKEN; // $100,000 implied FDV
const RAISED_USD = SOLD * PRICE_USD_PER_TOKEN;

const PRICE_TIERS = [
  { usd: 1,   label: "Taster" },
  { usd: 5,   label: "Snack" },
  { usd: 10,  label: "Bite" },
  { usd: 25,  label: "Chomper" },
  { usd: 50,  label: "Whale-lite" },
  { usd: 100, label: "Big Chomp" },
];

function useCountdown(target: number) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target - now);
  return {
    d: Math.floor(diff / 86400000),
    h: Math.floor((diff % 86400000) / 3600000),
    m: Math.floor((diff % 3600000) / 60000),
    s: Math.floor((diff % 60000) / 1000),
  };
}

declare global {
  interface Window {
    solana?: {
      isPhantom?: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
    };
  }
}

function WalletConnect() {
  const [open, setOpen] = useState(false);
  const [address, setAddress] = useState<string | null>(null);
  const [usd, setUsd] = useState(10);
  const [status, setStatus] = useState<string | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const solAmount = usd / SOL_USD;
  const tokensOut = Math.floor(usd / PRICE_USD_PER_TOKEN);

  const connectPhantom = async () => {
    if (typeof window === "undefined" || !window.solana?.isPhantom) {
      setStatus("Phantom not detected — install Phantom, Solflare or Backpack to continue.");
      return;
    }
    try {
      const r = await window.solana.connect();
      setAddress(r.publicKey.toString());
      setStatus("Wallet connected. Send your SOL payment, then confirm it below — once the transaction is confirmed on Solana mainnet, your LTCME is sent automatically.");
    } catch {
      setStatus("Connection cancelled.");
    }
  };

  const copy = (v: string, k: string) => {
    navigator.clipboard.writeText(v);
    setCopied(k);
    setTimeout(() => setCopied(null), 1500);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="w-full px-6 py-4 rounded-2xl font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_40px_oklch(0.65_0.25_295/0.6)] hover:scale-[1.02] transition inline-flex items-center justify-center gap-2 text-lg"
      >
        <Link2 className="w-5 h-5" /> Connect Wallet & Buy LTCME
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-md flex items-center justify-center px-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="glass rounded-3xl p-6 md:p-8 max-w-lg w-full relative"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
              onClick={() => setOpen(false)}
            >
              ✕
            </button>
            <h3 className="font-display font-black text-2xl mb-1">Buy LTCME</h3>
            <p className="text-xs text-muted-foreground mb-5">
              Pay in SOL on Solana mainnet, then confirm your transaction. The app checks it
              on-chain and, once confirmed, the presale wallet sends your LTCME
              <span className="text-primary font-semibold"> automatically</span> — no waiting for launch.
            </p>

            <div className="mb-4">
              <div className="text-xs uppercase text-muted-foreground tracking-wider mb-2">Pick your bag (USD)</div>
              <div className="grid grid-cols-3 gap-2">
                {PRICE_TIERS.map((t) => (
                  <button
                    key={t.usd}
                    onClick={() => setUsd(t.usd)}
                    className={`p-2 rounded-xl text-left transition border ${
                      usd === t.usd
                        ? "border-primary bg-gradient-to-br from-primary/25 to-secondary/25 shadow-[0_0_20px_oklch(0.75_0.18_240/0.4)]"
                        : "border-border/60 hover:border-primary/50 glass"
                    }`}
                  >
                    <div className="font-display font-black text-lg">${t.usd}</div>
                    <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                    <div className="text-[11px] font-mono text-primary mt-1">
                      {Math.floor(t.usd / PRICE_USD_PER_TOKEN).toLocaleString()} LTCME
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3 mb-4">
              <div className="glass rounded-xl p-3 flex justify-between items-center">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">You pay</div>
                  <div className="font-mono font-bold text-lg">{solAmount.toFixed(4)} SOL</div>
                  <div className="text-[11px] text-muted-foreground">≈ ${usd.toFixed(2)} USD</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground text-right">You receive</div>
                  <div className="font-mono font-bold text-xl text-gradient text-right">
                    {tokensOut.toLocaleString()} LTCME
                  </div>
                </div>
              </div>
              <div className="text-[11px] text-muted-foreground text-center font-mono">
                Presale price: 1 LTCME = ${PRICE_USD_PER_TOKEN.toFixed(5)} · 1 SOL ≈ {Math.floor(1 / PRICE_SOL_PER_TOKEN).toLocaleString()} LTCME
              </div>
            </div>

            <button
              onClick={connectPhantom}
              className="w-full px-5 py-3 rounded-xl font-semibold bg-gradient-to-r from-primary to-secondary text-primary-foreground mb-3 inline-flex items-center justify-center gap-2"
            >
              <Wallet className="w-4 h-4" />
              {address ? `Connected: ${address.slice(0, 4)}…${address.slice(-4)}` : "Connect Phantom"}
            </button>

            <div className="glass rounded-xl p-3 mb-3">
              <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">
                Solana presale receive address
              </div>
              <div className="flex items-center gap-2">
                <div className="font-mono text-xs truncate flex-1">{SOL_DEV_WALLET}</div>
                <button
                  onClick={() => copy(SOL_DEV_WALLET, "recv")}
                  className="px-2 py-1 rounded-md bg-primary/20 text-primary text-xs inline-flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" /> {copied === "recv" ? "Copied" : "Copy"}
                </button>
              </div>
            </div>

            {status && (
              <div className="text-xs text-primary/90 bg-primary/10 border border-primary/30 rounded-lg p-2 mb-3">
                {status}
              </div>
            )}

            <div className="mb-1">
              <PaymentVerifier defaultRecipient={address ?? ""} compact />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Index() {
  const { d, h, m, s } = useCountdown(PRESALE_END);
  const soldPct = (SOLD / PRESALE_ALLOCATION) * 100;

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden relative">
      {/* Animated pacman perimeter */}
      <div className="pac-border" aria-hidden>
        <div className="pac-runner" />
      </div>

      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 font-display font-bold text-lg">
            <img src={pacmanMascot} alt="LTCme pacman" width={36} height={36} className="drop-shadow-[0_0_12px_oklch(0.75_0.18_240)]" />
            <span className="text-gradient">LTCme.Click</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-primary transition">About</a>
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#tokenomics" className="hover:text-primary transition">Tokenomics</a>
            <a href="#tools" className="hover:text-primary transition">Tools</a>
            <a href="#roadmap" className="hover:text-primary transition">Roadmap</a>
            <a href="#whitepaper" className="hover:text-primary transition">Whitepaper</a>
            <a href="#ecosystem" className="hover:text-primary transition">Ecosystem</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </div>
          <a href="#presale" className="px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition shadow-[0_0_20px_oklch(0.75_0.18_240/0.5)]">
            Buy LTCme
          </a>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-24 px-6">
        <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center relative">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full glass text-xs font-mono uppercase tracking-widest text-primary mb-6">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Presale Live · Solana Mainnet · SOL accepted
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.02] mb-6">
              <span className="text-gradient">LTCme.Click</span><br />
              Wallet
            </h1>
            <p className="text-2xl md:text-3xl font-display font-bold text-foreground/90 mb-6">
              The future of <span className="text-gradient">Agentic Crypto Management</span>.
            </p>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              An AI-driven Litecoin wallet with a light-blue pacman AI companion guiding every move.
              1,000,000,000 <span className="text-primary font-semibold">LTCME</span> minted on Solana, with
              500,000,000 (50%) held in a dedicated presale wallet. Pay in SOL, your transaction is confirmed
              on Solana mainnet, and your tokens are sent automatically — no waiting for launch.
            </p>
            <div className="flex flex-wrap gap-4">
              <a href="#presale" className="px-6 py-3.5 rounded-full font-semibold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_40px_oklch(0.65_0.25_295/0.5)] hover:scale-105 transition">
                Join Presale
              </a>
              <a href="#whitepaper" className="px-6 py-3.5 rounded-full font-semibold glass hover:border-primary/50 transition inline-flex items-center gap-2">
                <FileText className="w-4 h-4" /> Read Whitepaper
              </a>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-6 max-w-md">
              {[
                { v: "1B", l: "Total supply" },
                { v: "500M", l: "Presale reserved" },
                { v: "$0.00010", l: "Presale price" },
              ].map((x) => (
                <div key={x.l}>
                  <div className="text-2xl font-display font-bold text-gradient">{x.v}</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-wider">{x.l}</div>
                </div>
              ))}
            </div>
          </div>
          <div className="relative">
            <div className="absolute -inset-8 bg-gradient-to-tr from-primary/30 to-secondary/30 blur-3xl rounded-full" />
            <img src={ghostCompanion} alt="LTCme AI pacman companion" width={1024} height={1024}
                 className="relative rounded-3xl glass p-1 shadow-[0_0_80px_oklch(0.55_0.24_295/0.4)]" />
            <img src={pacmanMascot} alt="" aria-hidden width={140} height={140}
                 className="absolute -bottom-8 -left-8 animate-float drop-shadow-[0_0_30px_oklch(0.75_0.18_240)]" />
          </div>
        </div>
      </section>

      {/* PRESALE */}
      <section id="presale" className="px-6 py-20">
        <div className="max-w-5xl mx-auto glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary/30 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/30 blur-3xl rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">Live · LTCme Presale · Instant Delivery</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black mb-2">Ends in</h2>
            <p className="text-sm text-muted-foreground mb-8">Tokens are already minted and held in the treasury wallet. Verify your payment and LTCme lands in your wallet within seconds — no waiting for launch.</p>

            <div className="grid grid-cols-4 gap-3 md:gap-6 mb-10">
              {[
                { v: d, l: "Days" }, { v: h, l: "Hours" },
                { v: m, l: "Minutes" }, { v: s, l: "Seconds" },
              ].map((t) => (
                <div key={t.l} className="glass rounded-2xl p-4 md:p-6 text-center border-primary/20">
                  <div className="text-3xl md:text-5xl font-mono font-bold text-gradient tabular-nums">
                    {String(t.v).padStart(2, "0")}
                  </div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground mt-1">{t.l}</div>
                </div>
              ))}
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2 font-mono">
                <span className="text-muted-foreground">Sold: <span className="text-primary font-semibold">{SOLD.toLocaleString()} LTCme</span></span>
                <span className="text-muted-foreground">Supply: {PRESALE_ALLOCATION.toLocaleString()} LTCme</span>
              </div>
              <div className="h-4 rounded-full bg-muted/50 overflow-hidden relative">
                <div className="h-full bg-gradient-to-r from-primary via-accent to-secondary relative"
                     style={{ width: `${soldPct}%` }}>
                  <div className="absolute inset-0 animate-shimmer" />
                </div>
              </div>
              <div className="flex justify-between text-xs mt-2 text-muted-foreground">
                <span>{soldPct.toFixed(1)}% filled</span>
                <span>{RAISED_SOL.toLocaleString()} / {TARGET_SOL.toLocaleString()} SOL raised</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="text-xs uppercase text-muted-foreground tracking-widest mb-3 text-center">Presale price tiers · pay in SOL or LTC</div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {PRICE_TIERS.map((t) => {
                  const tokens = Math.floor(t.usd / PRICE_USD_PER_TOKEN);
                  return (
                    <a href="#presale-buy" key={t.usd}
                       className="glass rounded-xl p-3 text-center hover:border-primary/60 transition group">
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{t.label}</div>
                      <div className="font-display font-black text-2xl text-gradient">${t.usd}</div>
                      <div className="text-xs font-mono text-primary mt-1">{(tokens / 1000).toLocaleString()}K LTCme</div>
                      <div className="text-[10px] text-muted-foreground mt-1 font-mono">
                        {(t.usd / SOL_USD).toFixed(4)} SOL · {(t.usd / LTC_USD).toFixed(4)} LTC
                      </div>
                    </a>
                  );
                })}
              </div>
              <div className="text-center text-xs text-muted-foreground mt-3 font-mono">
                Fixed rate: 1 LTCme = ${PRICE_USD_PER_TOKEN.toFixed(5)} USD · every dollar always maps to the same token count
              </div>
            </div>

            <div id="presale-buy"><WalletConnect /></div>

            <div className="mt-4">
              <PaymentVerifier />
            </div>

            <div className="grid md:grid-cols-2 gap-3 mt-4">
              <div className="glass rounded-xl p-3 text-xs">
                <div className="uppercase text-muted-foreground tracking-widest mb-1">SOL presale receive wallet</div>
                <div className="font-mono truncate">{SOL_DEV_WALLET}</div>
              </div>
              <div className="glass rounded-xl p-3 text-xs">
                <div className="uppercase text-muted-foreground tracking-widest mb-1">LTC receive wallet</div>
                <div className="font-mono truncate">{LTC_DEV_WALLET}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              ⚠️ Delivery is automated but not atomic: you pay, our backend verifier confirms the transaction on-chain, then the treasury wallet transfers your LTCme to the Solana address you provide. Keep your tx hash — it is your proof of payment and can be re-verified at any time. Only participate with funds you can afford to lose.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// About LTCme.Click</div>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-6">A wallet that <span className="text-gradient">thinks with you.</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Litecoin has always been fast, cheap, and battle-tested. But wallets have stayed stuck in 2017.
              LTCme.Click Wallet changes that with a chomping light-blue pacman AI companion that lives on your home screen.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Ask it anything: "What are current LTC fees?", "Should I swap now?", "Show me my last 5 transactions."
              It replies instantly, in plain English, and executes on your behalf with your confirmation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Non-custodial. Open-source clients. Audited SPL contract on Solana for the token layer,
              native Litecoin for holdings. This is the wallet your parents can actually use.
            </p>
          </div>
          <div className="relative">
            <img src={aiOrb} alt="AI neural orb" width={1024} height={1024} loading="lazy"
                 className="rounded-3xl animate-pulse-glow" />
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="features" className="px-6 py-24 relative">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Features</div>
            <h2 className="text-4xl md:text-6xl font-display font-black mb-4">Everything a wallet should be.<br /><span className="text-gradient">Plus AI.</span></h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">All the essentials — send, receive, swap, stake — supercharged by a pacman companion that never leaves your side.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { i: Wallet, t: "Non-Custodial Vault", d: "Your keys, your coins. Seed phrases never leave your device. Hardware wallet support day one." },
              { i: ArrowRightLeft, t: "Instant Send & Receive", d: "Send LTC anywhere in seconds. QR, address book, ENS-style .ltc handles built in." },
              { i: LineChart, t: "Live Portfolio Analytics", d: "Real-time PnL, holdings breakdown, historical charts and AI-powered market insights." },
              { i: Brain, t: "Pacman AI Companion", d: "Your always-on crypto sidekick. Explains, warns, teaches, and executes with your consent." },
              { i: Zap, t: "One-Click Swaps", d: "Cross-chain swaps LTC ↔ SOL ↔ ETH ↔ BTC via aggregated best-route pricing." },
              { i: Shield, t: "Scam Shield", d: "AI screens every incoming address and contract. Get flagged before you sign." },
              { i: Cpu, t: "Smart Auto-Stake", d: "Idle LTC? The AI suggests optimal staking / yield strategies with clear risk labels." },
              { i: Fingerprint, t: "Biometric Lock", d: "Face ID, fingerprint, and PIN. Session tokens rotate every 15 minutes." },
              { i: Bot, t: "Voice Commands", d: "\"Send 0.5 LTC to mom.\" Confirmed with biometric. That's the whole flow." },
            ].map((f) => (
              <div key={f.t} className="glass rounded-2xl p-6 hover:border-primary/50 transition group">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
                  <f.i className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-display font-bold text-xl mb-2">{f.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI COMPANION */}
      <section className="px-6 py-24">
        <div className="max-w-3xl mx-auto text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// AI Companion</div>
          <h2 className="text-4xl md:text-5xl font-display font-black mb-8">Meet <span className="text-gradient">Chomp</span>. Your crypto co-pilot.</h2>
          <div className="grid sm:grid-cols-2 gap-4 text-left">
            {[
              { i: MessageCircle, t: "Natural conversation", d: "Ask questions the way you would ask a friend. Chomp speaks 12 languages." },
              { i: Sparkles, t: "Proactive nudges", d: "\"LTC fees are 40% lower than yesterday — good time to consolidate UTXOs.\"" },
              { i: Shield, t: "Safety net", d: "Before every signature, Chomp breaks down exactly what you're approving." },
              { i: TrendingUp, t: "Market intelligence", d: "Streams from 40+ sources: on-chain flows, news sentiment, whale movements." },
            ].map((x) => (
              <div key={x.t} className="glass rounded-2xl p-5 flex gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
                  <x.i className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h4 className="font-semibold mb-1">{x.t}</h4>
                  <p className="text-sm text-muted-foreground">{x.d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TOKENOMICS */}
      <section id="tokenomics" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Tokenomics</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">LTCme</span> economy</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">A fixed supply of 1 billion tokens — already minted on Solana. Transparent allocation, long-term vesting, and instant delivery from a public dev wallet.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {[
              { l: "Total Supply", v: "1,000,000,000", s: "LTCme · Pre-minted · Fixed forever" },
              { l: "Blockchain", v: "Solana (SPL)", s: "Buy with SOL or LTC · Sub-cent fees" },
              { l: "Presale Price", v: "$0.00002", s: "USD per LTCme · $1 = 50,000 tokens" },
            ].map((x) => (
              <div key={x.l} className="glass rounded-2xl p-6 text-center">
                <div className="text-xs uppercase text-muted-foreground tracking-widest">{x.l}</div>
                <div className="text-3xl font-display font-black text-gradient my-2">{x.v}</div>
                <div className="text-sm text-muted-foreground">{x.s}</div>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            <div className="glass rounded-2xl p-8">
              <h3 className="font-display font-bold text-2xl mb-6 flex items-center gap-2"><Coins className="w-5 h-5 text-primary" /> Distribution</h3>
              <div className="space-y-4">
                {[
                  { l: "Presale (instant delivery)", p: 40 },
                  { l: "Liquidity Pool (locked 2y)", p: 20 },
                  { l: "Ecosystem & Rewards", p: 15 },
                  { l: "Team (24mo vest, 6mo cliff)", p: 12 },
                  { l: "Marketing & Partnerships", p: 8 },
                  { l: "Treasury / Reserve", p: 5 },
                ].map((x) => (
                  <div key={x.l}>
                    <div className="flex justify-between text-sm mb-1.5">
                      <span>{x.l}</span>
                      <span className="font-mono font-semibold text-primary">{x.p}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-primary to-secondary" style={{ width: `${x.p * 2.5}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-2xl p-8">
              <h3 className="font-display font-bold text-2xl mb-6 flex items-center gap-2"><Lock className="w-5 h-5 text-primary" /> Utility & Security</h3>
              <ul className="space-y-4 text-sm">
                {[
                  "Reduced swap fees inside the LTCme.Click Wallet (up to 60% off)",
                  "Priority AI compute — unlimited Chomp queries for holders",
                  "Governance votes on new wallet features and integrations",
                  "Staking rewards paid in LTC from wallet-fee revenue share",
                  "Access to premium tools: whale tracker, alpha alerts, tax exports",
                  "Liquidity locked for 24 months via a public Solana time-lock",
                  "Team tokens vest linearly over 24 months after a 6-month cliff",
                  "Contract pre-audited; 1B tokens minted and viewable on-chain",
                ].map((u) => (
                  <li key={u} className="flex gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
                    <span className="text-muted-foreground">{u}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ROADMAP */}
      <section id="roadmap" className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Roadmap</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">path forward</span></h2>
          </div>
          <div className="relative">
            <div className="absolute left-4 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-primary via-secondary to-transparent" />
            {[
              { q: "Q2 2026", t: "Token Mint + Wallet Beta", d: "1B LTCme SPL minted on Solana. iOS + Android + Chrome extension beta live with Chomp AI v1.", done: true },
              { q: "Q3 2026", t: "Presale (Instant Delivery)", d: "Public presale opens — buy with SOL or LTC. Every payment is verified on-chain and LTCme is transferred from the treasury wallet immediately. Community push to 25k across X + Telegram.", done: true },
              { q: "Q4 2026", t: "DEX Launch + CEX Listings", d: "LTCme lists on Raydium & Jupiter. Liquidity locked for 24 months. Tier-2 CEX listings. Staking goes live.", done: false },
              { q: "Q1 2027", t: "Full Wallet Launch", d: "Cross-chain swaps, hardware wallet support, .ltc handles, voice commands, biometric flows." },
              { q: "Q2 2027", t: "Chomp AI v2 + DAO", d: "Proactive portfolio management, DeFi strategy engine, LTCme DAO governance goes live." },
              { q: "2028+", t: "Beyond Litecoin", d: "Native BTC + full Solana support, LTCme debit card, merchant tools, in-wallet fiat ramps in 40+ countries." },
            ].map((r, i) => (
              <div key={r.q} className={`relative flex flex-col md:flex-row gap-6 mb-10 ${i % 2 === 0 ? "" : "md:flex-row-reverse"}`}>
                <div className="md:w-1/2 pl-12 md:pl-0 md:px-8">
                  <div className={`glass rounded-2xl p-6 ${r.done ? "border-primary/60" : ""}`}>
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-xs font-mono text-primary font-bold">{r.q}</span>
                      {r.done && <span className="text-[10px] uppercase px-2 py-0.5 rounded-full bg-primary/20 text-primary font-bold">Complete</span>}
                    </div>
                    <h3 className="font-display font-bold text-xl mb-2">{r.t}</h3>
                    <p className="text-sm text-muted-foreground">{r.d}</p>
                  </div>
                </div>
                <div className="absolute left-4 md:left-1/2 -translate-x-1/2 top-6 w-4 h-4 rounded-full bg-gradient-to-br from-primary to-secondary shadow-[0_0_20px_oklch(0.75_0.18_240)]" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* WHITEPAPER */}
      <section id="whitepaper" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Whitepaper</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">technical vision</span></h2>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            {[
              { n: "01", t: "Problem", d: "Crypto wallets remain hostile to newcomers. Interfaces are technical, mistakes are permanent, and users have no trusted guide. Meanwhile, mobile-first users demand conversational, intelligent software." },
              { n: "02", t: "Solution", d: "LTCme.Click combines a hardened non-custodial Litecoin wallet with an embedded pacman AI companion trained on crypto operations, on-chain data, and user-education material. Chomp translates intent into safe actions." },
              { n: "03", t: "Architecture", d: "Client-side key management (BIP-39 + BIP-84 native SegWit). Chomp runs a hybrid model: on-device inference for privacy-sensitive queries, edge inference for market data. Zero telemetry by default." },
              { n: "04", t: "Solana Presale Layer", d: "LTCme is an SPL token used for governance, fee discounts, and rewards. 1B tokens are minted on Solana and held in a public team wallet. Presale delivery is automated: incoming SOL/LTC payments are verified on-chain and LTCme is transferred to the buyer instantly." },
              { n: "05", t: "Dual-Chain Payments", d: "Pay with SOL (Phantom / Solflare / Backpack) or LTC (any Litecoin wallet). Payments are verified on-chain against the treasury wallet and matched to your submitted Solana receive address, which then receives LTCme automatically. Delivery is automatic but not atomic — always keep your tx hash." },
              { n: "06", t: "Security & Governance", d: "Two independent audits, a $250k bug bounty at launch, and multi-sig treasury. Liquidity locked 24 months. Team tokens vest linearly over 24 months with a 6-month cliff. Post-launch DAO governs new features, chains, and fee routing." },
            ].map((s) => (
              <div key={s.n} className="glass rounded-2xl p-6 hover:border-primary/50 transition">
                <div className="text-4xl font-display font-black text-gradient mb-2">{s.n}</div>
                <h3 className="font-display font-bold text-xl mb-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.d}</p>
              </div>
            ))}
          </div>
          <div className="text-center mt-10">
            <a href="#" className="inline-flex items-center gap-2 px-6 py-3.5 rounded-full font-semibold glass hover:border-primary/50 transition">
              <FileText className="w-4 h-4" /> Download Full Whitepaper (PDF) <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>
      </section>

      {/* ECOSYSTEM / LINKS */}
      <section id="ecosystem" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Ecosystem</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">.Click family</span></h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">Sister projects and on-chain tools — explore the Litecoin network and our AI wallet suite.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                href: "https://BTCme.click",
                icon: Bitcoin,
                title: "BTCme.Click",
                desc: "The Bitcoin sibling of LTCme — same agentic AI wallet experience, built natively for BTC.",
                cta: "Visit BTCme.Click",
                accent: "from-orange-400/40 to-yellow-500/40",
              },
              {
                href: "https://bnbBlockchain.com",
                icon: Coins,
                title: "bnbBlockchain.com",
                desc: "Our BNB Chain expansion hub — DeFi tools, cross-chain bridges, and BNB-native LTCme utility.",
                cta: "Visit bnbBlockchain",
                accent: "from-yellow-300/40 to-amber-500/40",
              },
              {
                href: "https://blockchair.com/litecoin",
                icon: Search,
                title: "Litecoin Explorer",
                desc: "Verify our LTC dev wallet, track incoming presale payments, and audit every transaction in real time.",
                cta: "Open Blockchair",
                accent: "from-primary/40 to-secondary/40",
              },
            ].map((l) => (
              <a
                key={l.title}
                href={l.href}
                target="_blank"
                rel="noopener noreferrer"
                className="glass rounded-2xl p-6 hover:border-primary/60 transition group relative overflow-hidden"
              >
                <div className={`absolute -top-16 -right-16 w-40 h-40 rounded-full bg-gradient-to-br ${l.accent} blur-2xl opacity-70 group-hover:opacity-100 transition`} />
                <div className="relative">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-4">
                    <l.icon className="w-7 h-7 text-primary" />
                  </div>
                  <h3 className="font-display font-bold text-2xl mb-2">{l.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 leading-relaxed">{l.desc}</p>
                  <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                    {l.cta} <ExternalLink className="w-4 h-4" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* LTC TOOLS */}
      <section id="tools" className="px-6 py-24">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Handy Tools</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">LTC toolkit</span></h2>
            <p className="text-muted-foreground mt-3 max-w-2xl mx-auto">Free on-chain utilities built into LTCme.Click. No signup, no tracking — every tool is one tap away inside the wallet.</p>
          </div>
          <LTCTools />

        </div>
      </section>

      {/* HOW TO BUY */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// How to buy</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">Buy in <span className="text-gradient">3 steps</span></h2>
            <p className="text-muted-foreground mt-3">Verification triggers delivery instantly — tokens hit your wallet in seconds.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {[
              { n: "1", t: "Connect a wallet", d: "Click Connect Wallet. Choose Solana (Phantom / Solflare / Backpack) or pay with Litecoin from any LTC wallet." },
              { n: "2", t: "Choose amount & send", d: "Pick a tier, send SOL to the presale Solana address or LTC to the LTC address. Save your transaction hash — it's your proof of payment." },
              { n: "3", t: "Verify & receive instantly", d: "Paste your tx hash and Solana address into the verifier. Once the payment is confirmed on-chain, the treasury sends your LTCme immediately — no waiting for launch." },
            ].map((s) => (
              <div key={s.n} className="glass rounded-2xl p-6 relative">
                <div className="absolute -top-4 -left-4 w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center font-display font-black text-primary-foreground shadow-[0_0_20px_oklch(0.75_0.18_240)]">
                  {s.n}
                </div>
                <h3 className="font-display font-bold text-lg mb-2 mt-2">{s.t}</h3>
                <p className="text-sm text-muted-foreground">{s.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* TRUST */}
      <section className="px-6 py-20">
        <div className="max-w-6xl mx-auto glass rounded-3xl p-8 md:p-12">
          <div className="grid md:grid-cols-4 gap-8 text-center">
            {[
              { i: Shield, t: "Audited", d: "SPL contract audits by two independent firms" },
              { i: Lock, t: "Liquidity Locked", d: "24-month on-chain time-lock, verifiable" },
              { i: Users, t: "Doxxed Team", d: "Core team KYC'd via a public verifier" },
              { i: Zap, t: "Instant Delivery", d: "Verified payments trigger an immediate on-chain LTCme transfer" },
            ].map((x) => (
              <div key={x.t}>
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mx-auto mb-3">
                  <x.i className="w-7 h-7 text-primary" />
                </div>
                <div className="font-display font-bold text-lg">{x.t}</div>
                <div className="text-sm text-muted-foreground">{x.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="px-6 py-24">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// FAQ</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">Questions?</h2>
          </div>
          <div className="space-y-3">
            {[
              { q: "How and when are tokens delivered?", a: "Immediately. All 1,000,000,000 LTCme SPL tokens are already minted on Solana and held in the treasury wallet Hfc3YbDXNGmJCiLtoUizraZH46WonVpET7i25ioaZZgy — verifiable on any Solana explorer. After you pay, paste your transaction hash into the verifier. Our backend confirms the payment landed in the treasury wallet, calculates your allocation at the live rate, and transfers LTCme to your Solana address within seconds. Delivery is automatic but not atomic, so always keep your tx hash — a payment can be re-verified at any time." },
              { q: "Can I really pay with Litecoin?", a: "Yes. Send LTC to our LTC receive address (visible in the Buy modal and on the presale card). Once it has one confirmation, submit the tx hash plus the Solana address you want LTCme sent to — delivery happens right away." },
              { q: "Why is the token on Solana if this is a Litecoin wallet?", a: "Solana offers sub-cent fees, near-instant finality, and a mature SPL ecosystem — perfect for a smooth presale and DEX launch. The wallet itself is Litecoin-native; LTCme lives on Solana as the utility & governance layer." },
              { q: "Is the wallet custodial?", a: "No. LTCme.Click Wallet is fully non-custodial. Your seed phrase is generated and stored on your device. We can never access your funds." },
              { q: "Does the AI companion see my private keys?", a: "Never. Chomp operates on public on-chain data and your explicit prompts. Signature-requiring actions always require your device-level biometric confirmation." },
              { q: "What if I miss the presale?", a: "LTCme will list on Raydium and Jupiter immediately after presale, followed by CEX listings. Presale price is the lowest guaranteed entry." },
              { q: "Is there a minimum buy?", a: "Minimum is 0.05 SOL or 0.01 LTC. No maximum during the presale." },
              { q: "How do I verify the dev wallet holds the supply?", a: "Look up our Solana dev wallet on any Solana explorer (Solscan, Solana.fm). The pre-minted LTCme balance is publicly visible. For LTC payments, our Litecoin receive wallet is auditable on the Litecoin Explorer linked in the Ecosystem section." },
            ].map((f, i) => (
              <details key={i} className="glass rounded-2xl p-6 group">
                <summary className="font-semibold cursor-pointer list-none flex justify-between items-center">
                  <span>{f.q}</span>
                  <span className="text-primary text-2xl group-open:rotate-45 transition-transform">+</span>
                </summary>
                <p className="text-sm text-muted-foreground mt-4 leading-relaxed">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 py-24">
        <div className="max-w-4xl mx-auto text-center glass rounded-3xl p-12 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-transparent to-secondary/20" />
          <img src={pacmanMascot} alt="" aria-hidden width={120} height={120} className="mx-auto mb-6 animate-float relative" />
          <h2 className="relative text-4xl md:text-5xl font-display font-black mb-4">Ready to hold <span className="text-gradient">LTCme</span>?</h2>
          <p className="relative text-muted-foreground mb-8 max-w-xl mx-auto">Chomp your way into the future of Agentic Crypto Management. Dual-chain payments, instant verified token delivery, one iconic pacman.</p>
          <a href="#presale" className="relative inline-block px-8 py-4 rounded-full font-bold bg-gradient-to-r from-primary to-secondary text-primary-foreground shadow-[0_0_60px_oklch(0.65_0.25_295/0.6)] hover:scale-105 transition">
            Join the Presale
          </a>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="px-6 pt-16 pb-8 border-t border-border/50">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="flex items-center gap-2 font-display font-bold text-lg mb-3">
                <img src={pacmanMascot} alt="" width={32} height={32} />
                <span className="text-gradient">LTCme.Click</span>
              </div>
              <p className="text-sm text-muted-foreground">The future of Agentic Crypto Management. Presale live on Solana + Litecoin.</p>
            </div>
            <div>
              <div className="font-semibold mb-3">Product</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-primary">Features</a></li>
                <li><a href="#roadmap" className="hover:text-primary">Roadmap</a></li>
                <li><a href="#whitepaper" className="hover:text-primary">Whitepaper</a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">Ecosystem</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="https://BTCme.click" target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">BTCme.Click <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://bnbBlockchain.com" target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">bnbBlockchain <ExternalLink className="w-3 h-3" /></a></li>
                <li><a href="https://blockchair.com/litecoin" target="_blank" rel="noopener noreferrer" className="hover:text-primary inline-flex items-center gap-1">LTC Explorer <ExternalLink className="w-3 h-3" /></a></li>
              </ul>
            </div>
            <div>
              <div className="font-semibold mb-3">Community</div>
              <div className="flex gap-3">
                {[Twitter, Send, Github].map((I, i) => (
                  <a key={i} href="#" className="w-10 h-10 rounded-lg glass flex items-center justify-center hover:border-primary/50 hover:text-primary transition">
                    <I className="w-4 h-4" />
                  </a>
                ))}
              </div>
            </div>
          </div>
          <div className="pt-8 border-t border-border/50 flex flex-col md:flex-row justify-between gap-4 text-xs text-muted-foreground">
            <div>© 2026 LTCme.Click Wallet · Not financial advice. Crypto is volatile — DYOR.</div>
            <div>Built with 🟦 by the LTCme team</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
