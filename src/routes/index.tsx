import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  Ghost, Sparkles, Shield, Zap, Brain, Wallet, ArrowRightLeft, LineChart,
  Lock, MessageCircle, Rocket, FileText, Coins, Users, CheckCircle2, Copy,
  Twitter, Send, Github, ExternalLink, TrendingUp, Cpu, Fingerprint, Bot,
} from "lucide-react";
import ghostMascot from "@/assets/ghost-mascot.png";
import heroGhost from "@/assets/hero-ghost.jpg";
import aiOrb from "@/assets/ai-orb.jpg";
import ghostCompanion from "@/assets/ghost-companion.jpg";

export const Route = createFileRoute("/")({
  component: Index,
});

const PRESALE_END = new Date(Date.now() + 1000 * 60 * 60 * 24 * 21).getTime();
const PRESALE_ALLOCATION = 400_000_000;
const SOLD = 247_500_000;
const RAISED_SOL = 3_847;
const TARGET_SOL = 6_500;
const PRESALE_WALLET = "LTCmeGhostPr3s4LeS0LAnA1234567890AbCdEfGhJKmN";

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

function Index() {
  const { d, h, m, s } = useCountdown(PRESALE_END);
  const [copied, setCopied] = useState(false);
  const soldPct = (SOLD / PRESALE_ALLOCATION) * 100;

  const copyWallet = () => {
    navigator.clipboard.writeText(PRESALE_WALLET);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen text-foreground overflow-x-hidden">
      {/* NAV */}
      <nav className="fixed top-0 inset-x-0 z-50 glass border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <a href="#" className="flex items-center gap-2 font-display font-bold text-lg">
            <img src={ghostMascot} alt="LTCme ghost" width={36} height={36} className="drop-shadow-[0_0_12px_oklch(0.75_0.18_240)]" />
            <span className="text-gradient">LTCme.click</span>
          </a>
          <div className="hidden md:flex items-center gap-7 text-sm text-muted-foreground">
            <a href="#about" className="hover:text-primary transition">About</a>
            <a href="#features" className="hover:text-primary transition">Features</a>
            <a href="#tokenomics" className="hover:text-primary transition">Tokenomics</a>
            <a href="#roadmap" className="hover:text-primary transition">Roadmap</a>
            <a href="#whitepaper" className="hover:text-primary transition">Whitepaper</a>
            <a href="#faq" className="hover:text-primary transition">FAQ</a>
          </div>
          <a href="#presale" className="px-4 py-2 rounded-full text-sm font-semibold text-primary-foreground bg-gradient-to-r from-primary to-secondary hover:opacity-90 transition shadow-[0_0_20px_oklch(0.75_0.18_240/0.5)]">
            Buy $LTCM
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
              Presale Live · Solana
            </div>
            <h1 className="text-5xl md:text-7xl font-display font-black leading-[1.02] mb-6">
              The AI-Powered<br />
              <span className="text-gradient">Litecoin Wallet</span><br />
              That Talks Back.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mb-8 leading-relaxed">
              LTCme.click is a next-gen Litecoin wallet with a built-in AI ghost companion
              guiding you end to end — from your first send to advanced DeFi moves.
              Own the future with <span className="text-primary font-semibold">$LTCM</span>, our presale token on Solana.
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
                { v: "12k+", l: "Waitlist" },
                { v: "SOL", l: "Presale chain" },
                { v: "24/7", l: "AI companion" },
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
            <img src={heroGhost} alt="LTCme AI Litecoin wallet ghost" width={1536} height={1024}
                 className="relative rounded-3xl glass p-1 shadow-[0_0_80px_oklch(0.55_0.24_295/0.4)]" />
            <img src={ghostMascot} alt="" aria-hidden width={140} height={140}
                 className="absolute -bottom-8 -left-8 animate-float drop-shadow-[0_0_30px_oklch(0.75_0.18_240)]" />
          </div>
        </div>
      </section>

      {/* PRESALE / COUNTDOWN */}
      <section id="presale" className="px-6 py-20">
        <div className="max-w-5xl mx-auto glass rounded-3xl p-8 md:p-12 relative overflow-hidden">
          <div className="absolute -top-32 -right-32 w-96 h-96 bg-secondary/30 blur-3xl rounded-full" />
          <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-primary/30 blur-3xl rounded-full" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-5 h-5 text-primary" />
              <span className="text-xs font-mono uppercase tracking-widest text-primary">Stage 2 · $LTCM Presale</span>
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-black mb-8">Ends in</h2>

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
                <span className="text-muted-foreground">Sold: <span className="text-primary font-semibold">{SOLD.toLocaleString()} LTCM</span></span>
                <span className="text-muted-foreground">Target: {PRESALE_ALLOCATION.toLocaleString()} LTCM</span>
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

            <div className="grid md:grid-cols-2 gap-4 mb-6">
              <div className="glass rounded-xl p-4">
                <div className="text-xs uppercase text-muted-foreground mb-1">Current price</div>
                <div className="text-2xl font-bold font-mono text-gradient">1 LTCM = 0.000018 SOL</div>
              </div>
              <div className="glass rounded-xl p-4">
                <div className="text-xs uppercase text-muted-foreground mb-1">Next stage</div>
                <div className="text-2xl font-bold font-mono">0.000024 SOL <span className="text-secondary text-sm">+33%</span></div>
              </div>
            </div>

            <div className="glass rounded-xl p-4 flex items-center gap-3 border border-primary/20">
              <Wallet className="w-5 h-5 text-primary shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-xs uppercase text-muted-foreground">Send SOL to presale wallet</div>
                <div className="font-mono text-sm truncate">{PRESALE_WALLET}</div>
              </div>
              <button onClick={copyWallet} className="px-3 py-2 rounded-lg bg-primary/20 hover:bg-primary/30 text-primary text-sm font-medium inline-flex items-center gap-2">
                <Copy className="w-4 h-4" /> {copied ? "Copied" : "Copy"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Only send SOL from a wallet you control (Phantom, Solflare, Backpack). LTCM tokens airdrop to the sending wallet within 24h of the presale close.
            </p>
          </div>
        </div>
      </section>

      {/* ABOUT */}
      <section id="about" className="px-6 py-24">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-16 items-center">
          <div>
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// About LTCme</div>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-6">A wallet that <span className="text-gradient">thinks with you.</span></h2>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Litecoin has always been fast, cheap, and battle-tested. But wallets have stayed stuck in 2017 —
              cold interfaces, cryptic transactions, and zero guidance. LTCme changes that.
            </p>
            <p className="text-muted-foreground leading-relaxed mb-4">
              Our wallet embeds a light-blue ghost AI companion that lives on your home screen. Ask it anything:
              "What are current LTC fees?", "Should I swap now?", "Show me my last 5 transactions." It replies
              instantly, in plain English, and executes on your behalf with your confirmation.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Non-custodial. Open-source clients. Audited smart contracts on Solana for the token layer,
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
            <p className="text-muted-foreground max-w-2xl mx-auto">All the essentials you expect — send, receive, swap, stake — supercharged by a companion that never leaves your side.</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              { i: Wallet, t: "Non-Custodial Vault", d: "Your keys, your coins. Seed phrases never leave your device. Hardware wallet support day one." },
              { i: ArrowRightLeft, t: "Instant Send & Receive", d: "Send LTC anywhere in seconds. QR, address book, ENS-style .ltc handles built in." },
              { i: LineChart, t: "Live Portfolio Analytics", d: "Real-time PnL, holdings breakdown, historical charts and AI-powered market insights." },
              { i: Brain, t: "Ghost AI Companion", d: "Your always-on crypto sidekick. Explains, warns, teaches, and executes with your consent." },
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
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="relative order-2 lg:order-1">
            <div className="absolute -inset-6 bg-gradient-to-tr from-primary/30 to-secondary/30 blur-3xl rounded-full" />
            <img src={ghostCompanion} alt="Ghost AI companion chatting" width={1024} height={1024} loading="lazy"
                 className="relative rounded-3xl glass p-1" />
          </div>
          <div className="order-1 lg:order-2">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// AI Companion</div>
            <h2 className="text-4xl md:text-5xl font-display font-black mb-6">Meet <span className="text-gradient">Ghost</span>. Your crypto co-pilot.</h2>
            <div className="space-y-4">
              {[
                { i: MessageCircle, t: "Natural conversation", d: "Ask questions the way you would ask a friend. Ghost speaks 12 languages." },
                { i: Sparkles, t: "Proactive nudges", d: "\"LTC fees are 40% lower than yesterday — good time to consolidate UTXOs.\"" },
                { i: Shield, t: "Safety net", d: "Before every signature, Ghost breaks down exactly what you're approving." },
                { i: TrendingUp, t: "Market intelligence", d: "Streams from 40+ sources: on-chain flows, news sentiment, whale movements." },
              ].map((x) => (
                <div key={x.t} className="flex gap-4">
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
        </div>
      </section>

      {/* TOKENOMICS */}
      <section id="tokenomics" className="px-6 py-24">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// Tokenomics</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">The <span className="text-gradient">$LTCM</span> economy</h2>
            <p className="text-muted-foreground mt-4 max-w-2xl mx-auto">A fixed supply, transparent allocation, and long-term vesting that align holders, users, and builders.</p>
          </div>

          <div className="grid lg:grid-cols-3 gap-6 mb-12">
            {[
              { l: "Total Supply", v: "1,000,000,000", s: "LTCM · Fixed forever" },
              { l: "Blockchain", v: "Solana", s: "SPL Token · Sub-cent fees" },
              { l: "Presale Price", v: "0.000018 SOL", s: "Stage 2 · Launch: 0.000030 SOL" },
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
                  { l: "Presale", p: 40 },
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
                  "Reduced swap fees inside the LTCme wallet (up to 60% off)",
                  "Priority AI compute — unlimited Ghost queries for holders",
                  "Governance votes on new wallet features and integrations",
                  "Staking rewards paid in LTC from wallet-fee revenue share",
                  "Access to premium tools: whale tracker, alpha alerts, tax exports",
                  "Liquidity locked for 24 months via a public Solana time-lock",
                  "Team tokens vest linearly over 24 months after a 6-month cliff",
                  "Contract audited by two independent firms pre-launch",
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
              { q: "Q4 2025", t: "Presale + Community", d: "Solana presale launch, whitepaper publication, 25k Telegram / X community, first CEX conversations.", done: true },
              { q: "Q1 2026", t: "Wallet Beta", d: "iOS + Android + Chrome extension beta. Core send/receive, portfolio, Ghost AI v1.", done: true },
              { q: "Q2 2026", t: "Token Generation Event", d: "$LTCM launches on Raydium & Jupiter. CEX listings. Liquidity locked. Staking live.", done: false },
              { q: "Q3 2026", t: "Full Wallet Launch", d: "Cross-chain swaps, hardware wallet support, .ltc handles, voice commands." },
              { q: "Q4 2026", t: "Ghost AI v2", d: "Proactive portfolio management, DeFi strategy engine, LTCme DAO governance goes live." },
              { q: "2027+", t: "Beyond Litecoin", d: "Native BTC + Solana support, LTCme debit card, merchant tools, in-wallet fiat ramps in 40+ countries." },
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
              { n: "02", t: "Solution", d: "LTCme combines a hardened non-custodial Litecoin wallet with an embedded AI companion trained on crypto operations, on-chain data, and user-education material. Ghost translates intent into safe actions." },
              { n: "03", t: "Architecture", d: "Client-side key management (BIP-39 + BIP-84 native SegWit). Ghost runs a hybrid model: on-device inference for privacy-sensitive queries, edge inference for market data. Zero telemetry by default." },
              { n: "04", t: "Solana Presale Layer", d: "$LTCM is an SPL token used for governance, fee discounts, and rewards. We chose Solana for sub-cent fees and instant finality, keeping presale friction near zero." },
              { n: "05", t: "Security Model", d: "Two independent audits, a $250k bug bounty at launch, and multi-sig treasury. Liquidity locked for 24 months. Team tokens vest linearly over 24 months with a 6-month cliff." },
              { n: "06", t: "Governance & Future", d: "Post-launch, holders vote on new features, supported chains, and fee routing. LTCme DAO controls a treasury dedicated to open-source client development and audits." },
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

      {/* HOW TO BUY */}
      <section className="px-6 py-24">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <div className="text-xs font-mono uppercase tracking-widest text-primary mb-3">// How to buy</div>
            <h2 className="text-4xl md:text-6xl font-display font-black">Join in <span className="text-gradient">4 steps</span></h2>
          </div>
          <div className="grid md:grid-cols-4 gap-4">
            {[
              { n: "1", t: "Get a SOL wallet", d: "Install Phantom, Solflare, or Backpack. Fund it with SOL from any exchange." },
              { n: "2", t: "Copy presale address", d: "Grab the presale Solana address from the top of this page." },
              { n: "3", t: "Send SOL", d: "Send any amount of SOL. Minimum 0.1 SOL. No maximum during Stage 2." },
              { n: "4", t: "Receive $LTCM", d: "Tokens airdrop to your sending wallet within 24h of presale close." },
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
              { i: Shield, t: "Audited", d: "Contract audits by two independent firms" },
              { i: Lock, t: "Liquidity Locked", d: "24-month on-chain time-lock, verifiable" },
              { i: Users, t: "Doxxed Team", d: "Core team KYC'd via a public verifier" },
              { i: Ghost, t: "Community First", d: "40% of supply to presale participants" },
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
              { q: "Why is the presale on Solana if this is a Litecoin wallet?", a: "Solana offers sub-cent fees, near-instant finality, and a mature SPL token ecosystem — perfect for a smooth presale. The wallet itself is Litecoin-native; $LTCM lives on Solana as the utility & governance layer." },
              { q: "When do I receive my $LTCM?", a: "Tokens airdrop automatically to the wallet you sent SOL from, within 24 hours after the presale closes. No claim step required." },
              { q: "Is the wallet custodial?", a: "No. LTCme is fully non-custodial. Your seed phrase is generated and stored on your device. We can never access your funds." },
              { q: "Does the AI companion see my private keys?", a: "Never. Ghost operates on public on-chain data and your explicit prompts. Signature-requiring actions always require your device-level biometric confirmation." },
              { q: "What if I miss the presale?", a: "$LTCM will list on Raydium and Jupiter (Solana DEXs) immediately after presale, followed by CEX listings. Presale price is the lowest guaranteed entry." },
              { q: "Is there a minimum or maximum buy?", a: "Minimum 0.1 SOL. No maximum during Stage 2. Anti-whale caps may apply in later stages — announced in advance on X and Telegram." },
              { q: "When does the wallet launch?", a: "Public beta is live for iOS, Android, and Chrome. Full public launch is Q3 2026 following the token generation event and full audit publication." },
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
          <img src={ghostMascot} alt="" aria-hidden width={120} height={120} className="mx-auto mb-6 animate-float relative" />
          <h2 className="relative text-4xl md:text-5xl font-display font-black mb-4">Ready to hold <span className="text-gradient">$LTCM</span>?</h2>
          <p className="relative text-muted-foreground mb-8 max-w-xl mx-auto">Join thousands of early holders shaping the first truly conversational Litecoin wallet.</p>
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
                <img src={ghostMascot} alt="" width={32} height={32} />
                <span className="text-gradient">LTCme.click</span>
              </div>
              <p className="text-sm text-muted-foreground">The AI-driven Litecoin wallet. Presale live on Solana.</p>
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
              <div className="font-semibold mb-3">Token</div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#tokenomics" className="hover:text-primary">Tokenomics</a></li>
                <li><a href="#presale" className="hover:text-primary">Presale</a></li>
                <li><a href="#faq" className="hover:text-primary">FAQ</a></li>
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
            <div>© 2026 LTCme.click · Not financial advice. Crypto is volatile — DYOR.</div>
            <div>Built with 👻 by the LTCme team</div>
          </div>
        </div>
      </footer>
    </div>
  );
}
