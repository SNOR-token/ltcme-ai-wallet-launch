import { useEffect, useState } from "react";
import {
  Calculator, ShieldCheck, QrCode, Clock, Activity, TrendingUp,
  Wrench, Search, Cpu,
} from "lucide-react";

// Real mainnet Litecoin data via litecoinspace.org (mempool.space fork for LTC)
const LTC_API = "https://litecoinspace.org/api";
// CoinGecko free tier for price
const CG_API = "https://api.coingecko.com/api/v3";

const LTC_ADDR_RE = /^(L|M|3|ltc1|LTC1)[a-zA-HJ-NP-Z0-9]{25,87}$/;

async function j<T>(url: string): Promise<T> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.json() as Promise<T>;
}

async function txt(url: string): Promise<string> {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`${r.status}`);
  return r.text();
}

/* ------------------------------- FEE ESTIMATOR ------------------------------ */
function FeeEstimator() {
  const [d, setD] = useState<{ fastestFee: number; halfHourFee: number; hourFee: number; minimumFee: number } | null>(null);
  const [err, setErr] = useState<string>();
  const [vB, setVB] = useState(140);
  useEffect(() => {
    j<typeof d & object>(`${LTC_API}/v1/fees/recommended`).then((v) => setD(v as any)).catch((e) => setErr(String(e)));
  }, []);
  if (err) return <p className="text-xs text-destructive">Fee API unreachable ({err}).</p>;
  if (!d) return <p className="text-xs text-muted-foreground">Loading mainnet fees…</p>;
  const rows: [string, number][] = [
    ["High priority (~1 block)", d.fastestFee],
    ["Medium (~30 min)", d.halfHourFee],
    ["Low (~1 hour)", d.hourFee],
    ["Minimum relay", d.minimumFee],
  ];
  return (
    <div className="space-y-3 text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex justify-between font-mono">
          <span className="text-muted-foreground">{k}</span>
          <span className="text-primary">{v} sat/vB · {(v * vB / 1e8).toFixed(8)} LTC</span>
        </div>
      ))}
      <label className="block text-xs text-muted-foreground pt-2">Tx size (vBytes)
        <input type="number" value={vB} onChange={(e) => setVB(Number(e.target.value) || 0)}
          className="mt-1 w-full bg-background/60 border border-border rounded px-2 py-1 font-mono text-foreground" />
      </label>
    </div>
  );
}

/* ------------------------------ ADDR VALIDATOR ------------------------------ */
function AddressValidator() {
  const [a, setA] = useState("");
  const [res, setRes] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function check() {
    setBusy(true); setRes(undefined);
    const trimmed = a.trim();
    if (!LTC_ADDR_RE.test(trimmed)) { setRes("❌ Not a valid Litecoin address format."); setBusy(false); return; }
    try {
      const info = await j<{ chain_stats: { funded_txo_count: number; tx_count?: number; funded_txo_sum: number; spent_txo_sum: number } }>(`${LTC_API}/address/${trimmed}`);
      const bal = (info.chain_stats.funded_txo_sum - info.chain_stats.spent_txo_sum) / 1e8;
      const kind = trimmed.startsWith("ltc1") ? "Native SegWit (bech32)" : trimmed.startsWith("M") || trimmed.startsWith("3") ? "P2SH / SegWit-wrapped" : "Legacy P2PKH";
      setRes(`✅ Valid · ${kind}\nBalance: ${bal.toFixed(8)} LTC · ${info.chain_stats.funded_txo_count} received outputs`);
    } catch (e) { setRes(`⚠ Format valid but chain lookup failed (${e}).`); }
    setBusy(false);
  }
  return (
    <div className="space-y-2 text-sm">
      <input value={a} onChange={(e) => setA(e.target.value)} placeholder="ltc1q… or L… or M…"
        className="w-full bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
      <button onClick={check} disabled={busy || !a} className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded py-2 text-primary font-semibold text-xs disabled:opacity-50">
        {busy ? "Checking mainnet…" : "Validate on mainnet"}
      </button>
      {res && <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{res}</pre>}
    </div>
  );
}

/* -------------------------------- QR GENERATOR ------------------------------- */
function QRGenerator() {
  const [addr, setAddr] = useState("");
  const [amt, setAmt] = useState("");
  const [label, setLabel] = useState("");
  const uri = `litecoin:${addr}${amt || label ? "?" : ""}${amt ? `amount=${amt}` : ""}${amt && label ? "&" : ""}${label ? `label=${encodeURIComponent(label)}` : ""}`;
  const src = addr ? `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(uri)}` : "";
  return (
    <div className="space-y-2 text-sm">
      <input value={addr} onChange={(e) => setAddr(e.target.value)} placeholder="LTC address"
        className="w-full bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
      <div className="flex gap-2">
        <input value={amt} onChange={(e) => setAmt(e.target.value)} placeholder="Amount (LTC)"
          className="flex-1 bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
        <input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Memo"
          className="flex-1 bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
      </div>
      {src && (
        <div className="flex flex-col items-center gap-1 pt-2">
          <img src={src} alt="Litecoin payment QR" className="rounded bg-white p-1" width={200} height={200} />
          <code className="text-[10px] text-muted-foreground break-all">{uri}</code>
        </div>
      )}
    </div>
  );
}

/* ------------------------------ HALVING COUNTDOWN --------------------------- */
function HalvingCountdown() {
  const [h, setH] = useState<number | null>(null);
  const [err, setErr] = useState<string>();
  useEffect(() => {
    txt(`${LTC_API}/blocks/tip/height`).then((v) => setH(Number(v))).catch((e) => setErr(String(e)));
  }, []);
  if (err) return <p className="text-xs text-destructive">Chain tip unreachable.</p>;
  if (h === null) return <p className="text-xs text-muted-foreground">Loading tip height…</p>;
  // Litecoin halves every 840,000 blocks. Next halving at ceil(h/840000)*840000.
  const next = Math.ceil((h + 1) / 840000) * 840000;
  const blocksLeft = next - h;
  const secondsLeft = blocksLeft * 150; // ~2.5 min blocks
  const eta = new Date(Date.now() + secondsLeft * 1000);
  const days = Math.floor(secondsLeft / 86400);
  return (
    <div className="space-y-2 text-sm font-mono">
      <div className="flex justify-between"><span className="text-muted-foreground">Current height</span><span className="text-primary">{h.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Next halving</span><span className="text-primary">#{next.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Blocks left</span><span className="text-primary">{blocksLeft.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">ETA (~150s/blk)</span><span className="text-primary">{days.toLocaleString()} days</span></div>
      <div className="text-[10px] text-muted-foreground">≈ {eta.toUTCString()}</div>
    </div>
  );
}

/* ------------------------------- MEMPOOL MONITOR ---------------------------- */
function MempoolMonitor() {
  const [m, setM] = useState<{ count: number; vsize: number; total_fee: number } | null>(null);
  const [err, setErr] = useState<string>();
  useEffect(() => {
    const load = () => j<typeof m & object>(`${LTC_API}/mempool`).then((v) => setM(v as any)).catch((e) => setErr(String(e)));
    load(); const id = setInterval(load, 15000); return () => clearInterval(id);
  }, []);
  if (err) return <p className="text-xs text-destructive">Mempool API unreachable.</p>;
  if (!m) return <p className="text-xs text-muted-foreground">Loading mempool…</p>;
  return (
    <div className="space-y-2 text-sm font-mono">
      <div className="flex justify-between"><span className="text-muted-foreground">Pending tx</span><span className="text-primary">{m.count.toLocaleString()}</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Total vSize</span><span className="text-primary">{(m.vsize / 1e6).toFixed(2)} MvB</span></div>
      <div className="flex justify-between"><span className="text-muted-foreground">Total fees</span><span className="text-primary">{(m.total_fee / 1e8).toFixed(4)} LTC</span></div>
    </div>
  );
}

/* -------------------------------- PRICE TICKER ------------------------------ */
function PriceTicker() {
  const [p, setP] = useState<{ usd: number; usd_24h_change: number; usd_market_cap: number } | null>(null);
  const [err, setErr] = useState<string>();
  useEffect(() => {
    const load = () => j<{ litecoin: any }>(`${CG_API}/simple/price?ids=litecoin&vs_currencies=usd&include_24hr_change=true&include_market_cap=true`)
      .then((v) => setP(v.litecoin)).catch((e) => setErr(String(e)));
    load(); const id = setInterval(load, 30000); return () => clearInterval(id);
  }, []);
  if (err) return <p className="text-xs text-destructive">Price feed unreachable.</p>;
  if (!p) return <p className="text-xs text-muted-foreground">Loading LTC/USD…</p>;
  return (
    <div className="space-y-2 text-sm font-mono">
      <div className="text-3xl text-primary">${p.usd.toLocaleString(undefined, { maximumFractionDigits: 2 })}</div>
      <div className={p.usd_24h_change >= 0 ? "text-green-400" : "text-red-400"}>
        {p.usd_24h_change >= 0 ? "▲" : "▼"} {p.usd_24h_change.toFixed(2)}% (24h)
      </div>
      <div className="text-xs text-muted-foreground">Market cap ${(p.usd_market_cap / 1e9).toFixed(2)}B</div>
      <div className="text-[10px] text-muted-foreground">Source: CoinGecko</div>
    </div>
  );
}

/* ------------------------------ UTXO CONSOLIDATOR --------------------------- */
function UTXOConsolidator() {
  const [a, setA] = useState("");
  const [res, setRes] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function scan() {
    if (!LTC_ADDR_RE.test(a.trim())) { setRes("❌ Invalid LTC address."); return; }
    setBusy(true); setRes(undefined);
    try {
      const utxos = await j<Array<{ value: number; status: { confirmed: boolean } }>>(`${LTC_API}/address/${a.trim()}/utxo`);
      const fees = await j<{ hourFee: number }>(`${LTC_API}/v1/fees/recommended`);
      const dust = utxos.filter((u) => u.value < 100000); // < 0.001 LTC
      const total = utxos.reduce((s, u) => s + u.value, 0) / 1e8;
      const estVBytes = 10 + utxos.length * 68 + 31; // consolidating into 1 output
      const cost = (estVBytes * fees.hourFee) / 1e8;
      setRes(`UTXOs: ${utxos.length} · Dust (<0.001 LTC): ${dust.length}\nTotal: ${total.toFixed(8)} LTC\nConsolidation cost @ ${fees.hourFee} sat/vB ≈ ${cost.toFixed(8)} LTC\n${dust.length > 5 ? "→ Recommended: consolidate now." : "→ Not urgent."}`);
    } catch (e) { setRes(`⚠ Lookup failed (${e}).`); }
    setBusy(false);
  }
  return (
    <div className="space-y-2 text-sm">
      <input value={a} onChange={(e) => setA(e.target.value)} placeholder="Your LTC address"
        className="w-full bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
      <button onClick={scan} disabled={busy || !a} className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded py-2 text-primary font-semibold text-xs disabled:opacity-50">
        {busy ? "Scanning UTXOs…" : "Analyze UTXOs"}
      </button>
      {res && <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{res}</pre>}
    </div>
  );
}

/* --------------------------------- TX LOOKUP -------------------------------- */
function TxLookup() {
  const [id, setId] = useState("");
  const [res, setRes] = useState<string>();
  const [busy, setBusy] = useState(false);
  async function look() {
    if (!/^[a-fA-F0-9]{64}$/.test(id.trim())) { setRes("❌ txid must be 64 hex chars."); return; }
    setBusy(true); setRes(undefined);
    try {
      const tx = await j<{ status: { confirmed: boolean; block_height?: number }; fee: number; size: number; weight: number; vin: any[]; vout: any[] }>(`${LTC_API}/tx/${id.trim()}`);
      const tip = Number(await txt(`${LTC_API}/blocks/tip/height`));
      const conf = tx.status.confirmed && tx.status.block_height ? tip - tx.status.block_height + 1 : 0;
      const totalOut = tx.vout.reduce((s, o: any) => s + o.value, 0) / 1e8;
      setRes(`Status: ${tx.status.confirmed ? `✅ Confirmed (${conf} confirmations)` : "⏳ Unconfirmed"}\nFee: ${(tx.fee / 1e8).toFixed(8)} LTC (${(tx.fee / (tx.weight / 4)).toFixed(2)} sat/vB)\nInputs: ${tx.vin.length} · Outputs: ${tx.vout.length}\nTotal output: ${totalOut.toFixed(8)} LTC`);
    } catch (e) { setRes(`⚠ Not found (${e}).`); }
    setBusy(false);
  }
  return (
    <div className="space-y-2 text-sm">
      <input value={id} onChange={(e) => setId(e.target.value)} placeholder="64-char txid"
        className="w-full bg-background/60 border border-border rounded px-2 py-2 font-mono text-xs" />
      <button onClick={look} disabled={busy || !id} className="w-full bg-primary/20 hover:bg-primary/30 border border-primary/40 rounded py-2 text-primary font-semibold text-xs disabled:opacity-50">
        {busy ? "Fetching…" : "Look up on mainnet"}
      </button>
      {res && <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">{res}</pre>}
      {id && <a href={`https://litecoinspace.org/tx/${id.trim()}`} target="_blank" rel="noreferrer" className="text-xs text-primary hover:underline">Open in explorer →</a>}
    </div>
  );
}

/* ----------------------------- MINING CALCULATOR ---------------------------- */
function MiningCalc() {
  const [hash, setHash] = useState(1000); // MH/s
  const [power, setPower] = useState(1500); // watts
  const [cost, setCost] = useState(0.12); // $/kWh
  const [poolFee, setPoolFee] = useState(1); // %
  const [price, setPrice] = useState<number | null>(null);
  const [diff, setDiff] = useState<number | null>(null);
  useEffect(() => {
    j<{ litecoin: { usd: number } }>(`${CG_API}/simple/price?ids=litecoin&vs_currencies=usd`).then((v) => setPrice(v.litecoin.usd)).catch(() => {});
    j<{ difficulty: number }>(`${LTC_API}/v1/mining/hashrate/1d`).then((v) => setDiff(v.difficulty)).catch(() => {
      // fallback: fetch latest block
      j<Array<{ difficulty: number }>>(`${LTC_API}/blocks`).then((b) => setDiff(b[0].difficulty)).catch(() => {});
    });
  }, []);
  // Expected LTC/day = (hashrate * 86400 * blockReward) / (difficulty * 2^32)
  // hash in MH/s → *1e6
  const blockReward = 6.25;
  const ltcDay = diff ? (hash * 1e6 * 86400 * blockReward) / (diff * 2 ** 32) : 0;
  const netLtc = ltcDay * (1 - poolFee / 100);
  const revUsd = price ? netLtc * price : 0;
  const powerCostDay = (power / 1000) * 24 * cost;
  const profitDay = revUsd - powerCostDay;
  return (
    <div className="space-y-2 text-xs font-mono">
      <label className="block">Hashrate (MH/s)
        <input type="number" value={hash} onChange={(e) => setHash(+e.target.value)} className="mt-1 w-full bg-background/60 border border-border rounded px-2 py-1" />
      </label>
      <div className="grid grid-cols-2 gap-2">
        <label>Power (W)<input type="number" value={power} onChange={(e) => setPower(+e.target.value)} className="mt-1 w-full bg-background/60 border border-border rounded px-2 py-1" /></label>
        <label>$/kWh<input type="number" step="0.01" value={cost} onChange={(e) => setCost(+e.target.value)} className="mt-1 w-full bg-background/60 border border-border rounded px-2 py-1" /></label>
      </div>
      <label className="block">Pool fee (%)
        <input type="number" step="0.1" value={poolFee} onChange={(e) => setPoolFee(+e.target.value)} className="mt-1 w-full bg-background/60 border border-border rounded px-2 py-1" />
      </label>
      <div className="pt-2 space-y-1">
        <div className="flex justify-between"><span className="text-muted-foreground">LTC / day</span><span className="text-primary">{netLtc.toFixed(6)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Revenue / day</span><span className="text-primary">${revUsd.toFixed(2)}</span></div>
        <div className="flex justify-between"><span className="text-muted-foreground">Power / day</span><span className="text-primary">${powerCostDay.toFixed(2)}</span></div>
        <div className="flex justify-between font-bold"><span>Profit / day</span><span className={profitDay >= 0 ? "text-green-400" : "text-red-400"}>${profitDay.toFixed(2)}</span></div>
      </div>
      {(!price || !diff) && <p className="text-[10px] text-muted-foreground">Loading live network data…</p>}
    </div>
  );
}

/* -------------------------------- TOOL CARD --------------------------------- */
const TOOLS = [
  { i: Calculator, t: "LTC Fee Estimator", d: "Live sat/vB fee bands from mainnet mempool with LTC cost per tx size.", C: FeeEstimator },
  { i: ShieldCheck, t: "Address Validator", d: "Format check + live mainnet balance & tx count via Litecoin Space API.", C: AddressValidator },
  { i: QrCode, t: "QR Generator", d: "Build a BIP-21 litecoin: URI and scannable payment QR.", C: QRGenerator },
  { i: Clock, t: "Halving Countdown", d: "Real-time countdown to block 5,040,000 (next Litecoin halving).", C: HalvingCountdown },
  { i: Activity, t: "Mempool Monitor", d: "Pending tx count, vSize and total fee pressure on mainnet.", C: MempoolMonitor },
  { i: TrendingUp, t: "LTC Price Ticker", d: "Live LTC/USD, 24h change and market cap from CoinGecko.", C: PriceTicker },
  { i: Wrench, t: "UTXO Consolidator", d: "Scan any address for UTXO fragmentation and estimate merge cost.", C: UTXOConsolidator },
  { i: Search, t: "Tx Lookup", d: "Fetch confirmations, fee and I/O breakdown for any mainnet txid.", C: TxLookup },
  { i: Cpu, t: "Mining Calculator", d: "Estimate LTC/day and profit from live difficulty + LTC price.", C: MiningCalc },
];

export function LTCTools() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      {TOOLS.map((tool) => {
        const isOpen = open === tool.t;
        return (
          <div key={tool.t} className="glass rounded-2xl p-6 hover:border-primary/50 transition group flex flex-col">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/30 to-secondary/30 flex items-center justify-center mb-4 group-hover:animate-pulse-glow">
              <tool.i className="w-6 h-6 text-primary" />
            </div>
            <h3 className="font-display font-bold text-lg mb-2">{tool.t}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed mb-4">{tool.d}</p>
            <button
              onClick={() => setOpen(isOpen ? null : tool.t)}
              className="mt-auto text-xs font-mono uppercase tracking-widest text-primary hover:text-primary/80 self-start"
            >
              {isOpen ? "− Hide tool" : "→ Launch tool"}
            </button>
            {isOpen && (
              <div className="mt-4 pt-4 border-t border-border/50">
                <tool.C />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
