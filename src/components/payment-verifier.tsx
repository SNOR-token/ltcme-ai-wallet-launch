import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { verifyPayment } from "@/lib/presale.functions";

type Chain = "SOL" | "LTC";

export function PaymentVerifier({
  chain,
  defaultRecipient = "",
  compact = false,
}: {
  chain: Chain;
  defaultRecipient?: string;
  compact?: boolean;
}) {
  const verify = useServerFn(verifyPayment);
  const [txHash, setTxHash] = useState("");
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    ok: boolean;
    message: string;
    tokens?: number;
    deliveryTx?: string | null;
  } | null>(null);

  async function submit() {
    setLoading(true);
    setResult(null);
    try {
      const res = await verify({
        data: { chain, txHash: txHash.trim(), recipient: recipient.trim() },
      });
      setResult(res);
    } catch {
      setResult({
        ok: false,
        message: "Verification service is unavailable right now. Please try again shortly.",
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="glass rounded-xl p-4 space-y-3">
      <div className="flex items-center gap-2">
        <ShieldCheck className="w-4 h-4 text-primary" />
        <div className="text-sm font-semibold">Verify payment · get LTCme instantly</div>
      </div>
      {!compact && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Paste the {chain === "SOL" ? "Solana signature" : "Litecoin txid"} of your payment and the
          Solana address that should receive LTCme. Once the payment is confirmed on-chain, the
          treasury sends your tokens immediately — no waiting for launch.
        </p>
      )}

      <input
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        placeholder={chain === "SOL" ? "Transaction signature" : "Litecoin txid"}
        className="w-full rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-xs font-mono outline-none focus:border-primary"
      />
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Your Solana address (receives LTCme)"
        className="w-full rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-xs font-mono outline-none focus:border-primary"
      />

      <button
        onClick={submit}
        disabled={loading || !txHash.trim() || !recipient.trim()}
        className="w-full px-5 py-2.5 rounded-xl font-semibold text-sm bg-gradient-to-r from-primary to-secondary text-primary-foreground disabled:opacity-50 inline-flex items-center justify-center gap-2"
      >
        {loading ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Verifying on-chain…
          </>
        ) : (
          <>
            <CheckCircle2 className="w-4 h-4" /> Verify &amp; claim tokens
          </>
        )}
      </button>

      {result && (
        <div
          className={`text-xs rounded-lg p-3 border leading-relaxed ${
            result.ok
              ? "text-primary bg-primary/10 border-primary/30"
              : "text-destructive bg-destructive/10 border-destructive/30"
          }`}
        >
          {result.message}
          {result.deliveryTx && (
            <a
              href={`https://solscan.io/tx/${result.deliveryTx}`}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-flex items-center gap-1 underline"
            >
              View delivery transaction <ExternalLink className="w-3 h-3" />
            </a>
          )}
        </div>
      )}
    </div>
  );
}
