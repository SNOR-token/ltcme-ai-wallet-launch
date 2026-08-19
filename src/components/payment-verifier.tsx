import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, Loader2, ShieldCheck, ExternalLink } from "lucide-react";
import { verifyPayment } from "@/lib/presale.functions";

export function PaymentVerifier({
  defaultRecipient = "",
  compact = false,
}: {
  defaultRecipient?: string;
  compact?: boolean;
}) {
  const verify = useServerFn(verifyPayment);
  const [txHash, setTxHash] = useState("");
  const [recipient, setRecipient] = useState(defaultRecipient);
  const [email, setEmail] = useState("");
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
        data: {
          txHash: txHash.trim(),
          recipient: recipient.trim(),
          ...(email.trim() ? { email: email.trim() } : {}),
        },
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
        <div className="text-sm font-semibold">Verify payment · get LTCME instantly</div>
      </div>
      {!compact && (
        <p className="text-[11px] text-muted-foreground leading-relaxed">
          Paste the Solana signature of your SOL payment and the Solana address that should
          receive LTCME. Once the payment is confirmed on-chain, the treasury sends your tokens
          immediately — no waiting for launch. Add your email and we&apos;ll send your receipt.
        </p>
      )}

      <input
        value={txHash}
        onChange={(e) => setTxHash(e.target.value)}
        placeholder="Solana transaction signature"
        className="w-full rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-xs font-mono outline-none focus:border-primary"
      />
      <input
        value={recipient}
        onChange={(e) => setRecipient(e.target.value)}
        placeholder="Your Solana address (receives LTCME)"
        className="w-full rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-xs font-mono outline-none focus:border-primary"
      />
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        type="email"
        placeholder="Email for your receipt (optional)"
        className="w-full rounded-lg bg-background/60 border border-border/60 px-3 py-2 text-xs outline-none focus:border-primary"
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
