// Server-only purchase notification emails.
// Wired to Lovable Emails once the sender domain for ltcme.click is verified;
// until then it records the intent in the logs so no purchase is lost.
export type PurchaseEmailPayload = {
  email: string | null;
  recipient: string;
  tokens: number;
  amountUsd: number;
  amountNative: number;
  signature: string | null;
};

export async function sendPurchaseEmails(p: PurchaseEmailPayload): Promise<void> {
  const summary = `${p.tokens.toLocaleString()} LTCME · $${p.amountUsd.toFixed(2)} · ${p.amountNative.toFixed(4)} SOL → ${p.recipient}${
    p.signature ? ` · delivery ${p.signature}` : " · delivery pending"
  }`;
  console.log(`[presale] purchase notification: ${summary} (buyer: ${p.email ?? "no email"})`);
}
