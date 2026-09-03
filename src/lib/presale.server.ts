// Server-only presale payment verification + LTCME token delivery (Solana only).
// Worker-safe: talks to Solana JSON-RPC over plain fetch and signs transactions
// with pure-JS ed25519 (no @solana/web3.js, which pulls in rpc-websockets and
// breaks the Cloudflare Worker build).
import { ed25519 } from "@noble/curves/ed25519";
import { sha256 } from "@noble/hashes/sha256";
import bs58 from "bs58";

/** SOL is sent here by buyers. */
export const SOL_DEV_WALLET = "Ew8mbrKwD6LGaSX28a6XGmXqeQSs2hykRibjXVhftTRC";
/** Treasury holding the minted LTCME supply (same wallet, signs deliveries). */
export const TREASURY_WALLET = "Ew8mbrKwD6LGaSX28a6XGmXqeQSs2hykRibjXVhftTRC";
export const PRICE_USD_PER_TOKEN = 0.00002;

const SOL_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
const ASSOCIATED_TOKEN_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL";
const SYSTEM_PROGRAM_ID = "11111111111111111111111111111111";
const RENT_SYSVAR_ID = "SysvarRent111111111111111111111111111111111";

export type VerifyResult = {
  ok: boolean;
  message: string;
  status?: string;
  tokens?: number;
  amountUsd?: number;
  deliveryTx?: string | null;
};

/* ------------------------------ RPC helper ------------------------------ */

async function rpc<T>(method: string, params: unknown[]): Promise<T> {
  const res = await fetch(SOL_RPC, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
  });
  const json = (await res.json()) as { result?: T; error?: { message: string } };
  if (json.error) throw new Error(`${method}: ${json.error.message}`);
  return json.result as T;
}

/* --------------------------- address utilities -------------------------- */

function decodeAddress(v: string): Uint8Array {
  const bytes = bs58.decode(v);
  if (bytes.length !== 32) throw new Error("Invalid Solana address");
  return bytes;
}

function isValidSolanaAddress(v: string) {
  try {
    decodeAddress(v);
    return true;
  } catch {
    return false;
  }
}

function concat(parts: Uint8Array[]): Uint8Array {
  const total = parts.reduce((n, p) => n + p.length, 0);
  const out = new Uint8Array(total);
  let o = 0;
  for (const p of parts) {
    out.set(p, o);
    o += p.length;
  }
  return out;
}

const PDA_MARKER = new TextEncoder().encode("ProgramDerivedAddress");

/** Associated token account address for (owner, mint). */
function findAta(owner: string, mint: string): string {
  const seeds = [decodeAddress(owner), decodeAddress(TOKEN_PROGRAM_ID), decodeAddress(mint)];
  const programId = decodeAddress(ASSOCIATED_TOKEN_PROGRAM_ID);
  for (let bump = 255; bump >= 0; bump--) {
    const hash = sha256(concat([...seeds, new Uint8Array([bump]), programId, PDA_MARKER]));
    // Off-curve check: a valid PDA must NOT be a point on the ed25519 curve.
    let onCurve = true;
    try {
      ed25519.Point.fromBytes(hash);
    } catch {
      onCurve = false;
    }
    if (!onCurve) return bs58.encode(hash);
  }
  throw new Error("Unable to derive associated token account");
}

/* ---------------------- legacy transaction assembly --------------------- */

type AccountMeta = { pubkey: string; isSigner: boolean; isWritable: boolean };
type Instruction = { programId: string; keys: AccountMeta[]; data: Uint8Array };

function compactU16(n: number): Uint8Array {
  const out: number[] = [];
  let v = n;
  for (;;) {
    if (v < 0x80) {
      out.push(v);
      break;
    }
    out.push((v & 0x7f) | 0x80);
    v >>= 7;
  }
  return new Uint8Array(out);
}

function buildMessage(
  feePayer: string,
  instructions: Instruction[],
  recentBlockhash: string,
): Uint8Array {
  const metas = new Map<string, AccountMeta>();
  const touch = (m: AccountMeta) => {
    const prev = metas.get(m.pubkey);
    if (prev) {
      prev.isSigner ||= m.isSigner;
      prev.isWritable ||= m.isWritable;
    } else {
      metas.set(m.pubkey, { ...m });
    }
  };
  touch({ pubkey: feePayer, isSigner: true, isWritable: true });
  for (const ix of instructions) {
    for (const k of ix.keys) touch(k);
    touch({ pubkey: ix.programId, isSigner: false, isWritable: false });
  }

  const all = [...metas.values()].filter((m) => m.pubkey !== feePayer);
  const signedWritable = all.filter((m) => m.isSigner && m.isWritable);
  const signedReadonly = all.filter((m) => m.isSigner && !m.isWritable);
  const unsignedWritable = all.filter((m) => !m.isSigner && m.isWritable);
  const unsignedReadonly = all.filter((m) => !m.isSigner && !m.isWritable);

  const ordered = [
    metas.get(feePayer)!,
    ...signedWritable,
    ...signedReadonly,
    ...unsignedWritable,
    ...unsignedReadonly,
  ];
  const index = new Map(ordered.map((m, i) => [m.pubkey, i]));

  const header = new Uint8Array([
    1 + signedWritable.length + signedReadonly.length,
    signedReadonly.length,
    unsignedReadonly.length,
  ]);

  const keyBytes = concat([
    compactU16(ordered.length),
    ...ordered.map((m) => decodeAddress(m.pubkey)),
  ]);

  const ixBytes = concat([
    compactU16(instructions.length),
    ...instructions.map((ix) =>
      concat([
        new Uint8Array([index.get(ix.programId)!]),
        compactU16(ix.keys.length),
        new Uint8Array(ix.keys.map((k) => index.get(k.pubkey)!)),
        compactU16(ix.data.length),
        ix.data,
      ]),
    ),
  ]);

  return concat([header, keyBytes, decodeAddress(recentBlockhash), ixBytes]);
}

function toBase64(bytes: Uint8Array): string {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s);
}

/* ------------------------------ price feed ----------------------------- */

async function getSolPrice(): Promise<number> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd",
    );
    const j = (await r.json()) as Record<string, { usd: number }>;
    return j.solana?.usd ?? 150;
  } catch {
    return 150;
  }
}

/* --------------------------- payment verification ---------------------- */

/** Confirms a SOL transfer landed in the presale wallet; returns SOL amount + payer. */
async function verifySolPayment(txHash: string) {
  const tx = await rpc<{
    meta: {
      err: unknown;
      preBalances: number[];
      postBalances: number[];
    } | null;
    transaction: { message: { accountKeys: { pubkey: string }[] } };
  } | null>("getTransaction", [
    txHash,
    { maxSupportedTransactionVersion: 0, commitment: "confirmed", encoding: "jsonParsed" },
  ]);

  if (!tx || !tx.meta || tx.meta.err) return { amount: 0, payer: null as string | null };

  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey);
  const idx = keys.indexOf(SOL_DEV_WALLET);
  if (idx === -1) return { amount: 0, payer: null };
  const delta = (tx.meta.postBalances[idx] ?? 0) - (tx.meta.preBalances[idx] ?? 0);
  return { amount: delta / 1e9, payer: keys[0] ?? null };
}

/* ------------------------------- delivery ------------------------------ */

function createAtaIdempotentIx(payer: string, owner: string, mint: string): Instruction {
  return {
    programId: ASSOCIATED_TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: payer, isSigner: true, isWritable: true },
      { pubkey: findAta(owner, mint), isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: false, isWritable: false },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: SYSTEM_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: TOKEN_PROGRAM_ID, isSigner: false, isWritable: false },
      { pubkey: RENT_SYSVAR_ID, isSigner: false, isWritable: false },
    ],
    data: new Uint8Array([1]), // CreateIdempotent
  };
}

function transferCheckedIx(
  source: string,
  mint: string,
  destination: string,
  owner: string,
  amount: bigint,
  decimals: number,
): Instruction {
  const data = new Uint8Array(10);
  const view = new DataView(data.buffer);
  view.setUint8(0, 12); // TransferChecked
  view.setBigUint64(1, amount, true);
  view.setUint8(9, decimals);
  return {
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  };
}

async function confirmSignature(signature: string) {
  for (let i = 0; i < 30; i++) {
    const res = await rpc<{
      value: ({ err: unknown; confirmationStatus: string } | null)[];
    }>("getSignatureStatuses", [[signature], { searchTransactionHistory: false }]);
    const status = res.value[0];
    if (status) {
      if (status.err) throw new Error("Delivery transaction failed on-chain");
      if (status.confirmationStatus === "confirmed" || status.confirmationStatus === "finalized")
        return;
    }
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("Delivery transaction was not confirmed in time");
}

/** Sends LTCME SPL tokens from the treasury wallet to the buyer. */
async function deliverTokens(recipient: string, tokens: number): Promise<string> {
  const secret = process.env['SOLANA_TREASURY_PRIVATE_KEY'];
  const mint = process.env['LTCME_TOKEN_MINT'];
  if (!secret) throw new Error("Treasury wallet not configured");
  if (!mint) throw new Error("Token mint not configured");

  const raw = secret.trim();
  const bytes = raw.startsWith("[")
    ? Uint8Array.from(JSON.parse(raw) as number[])
    : bs58.decode(raw);
  const seed = bytes.slice(0, 32);
  const publicKey = ed25519.getPublicKey(seed);
  const payer = bs58.encode(publicKey);
  if (payer !== TREASURY_WALLET) {
    throw new Error("Configured treasury key does not match the treasury wallet");
  }

  const supply = await rpc<{ value: { decimals: number } }>("getTokenSupply", [mint]);
  const decimals = supply.value.decimals;

  const source = findAta(payer, mint);
  const destination = findAta(recipient, mint);
  const amount = BigInt(Math.floor(tokens)) * BigInt(10) ** BigInt(decimals);

  const { value } = await rpc<{ value: { blockhash: string } }>("getLatestBlockhash", [
    { commitment: "confirmed" },
  ]);

  const message = buildMessage(
    payer,
    [
      createAtaIdempotentIx(payer, recipient, mint),
      transferCheckedIx(source, mint, destination, payer, amount, decimals),
    ],
    value.blockhash,
  );

  const signature = ed25519.sign(message, seed);
  const wire = concat([compactU16(1), signature, message]);

  const sig = await rpc<string>("sendTransaction", [
    toBase64(wire),
    { encoding: "base64", preflightCommitment: "confirmed", maxRetries: 3 },
  ]);
  await confirmSignature(sig);
  return sig;
}

export async function verifyAndDeliver(input: {
  txHash: string;
  recipient: string;
  email?: string;
}): Promise<VerifyResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const txHash = input.txHash.trim();
  const recipient = input.recipient.trim();
  const email = input.email?.trim() || null;

  if (!txHash || txHash.length < 32) {
    return { ok: false, message: "Enter a valid Solana transaction signature." };
  }
  if (!isValidSolanaAddress(recipient)) {
    return {
      ok: false,
      message: "Enter a valid Solana address to receive your LTCME tokens.",
    };
  }

  // Already processed? Return the recorded outcome instead of double-paying.
  const { data: existing } = await supabaseAdmin
    .from("presale_purchases")
    .select("*")
    .eq("chain", "SOL")
    .eq("tx_hash", txHash)
    .maybeSingle();

  if (existing && existing.status === "delivered") {
    return {
      ok: true,
      message: "This payment was already verified and your tokens were delivered.",
      status: "delivered",
      tokens: Number(existing.tokens),
      amountUsd: Number(existing.amount_usd),
      deliveryTx: existing.delivery_tx,
    };
  }

  const res = await verifySolPayment(txHash);
  const amountNative = res.amount;
  const payerAddress = res.payer;
  if (amountNative <= 0) {
    return {
      ok: false,
      message:
        "No confirmed SOL payment to the presale wallet was found for that signature. Wait for confirmation and try again.",
    };
  }

  const solUsd = await getSolPrice();
  const amountUsd = amountNative * solUsd;
  const tokens = Math.floor(amountUsd / PRICE_USD_PER_TOKEN);
  if (tokens <= 0) {
    return { ok: false, message: "Payment amount is too small to allocate tokens." };
  }

  const { data: row, error: upsertError } = await supabaseAdmin
    .from("presale_purchases")
    .upsert(
      {
        chain: "SOL",
        tx_hash: txHash,
        payer_address: payerAddress,
        recipient_solana_address: recipient,
        buyer_email: email,
        amount_native: amountNative,
        amount_usd: amountUsd,
        tokens,
        status: "verified",
        updated_at: new Date().toISOString(),
      },
      { onConflict: "chain,tx_hash" },
    )
    .select()
    .single();

  if (upsertError || !row) {
    return { ok: false, message: "Could not record your purchase. Please try again." };
  }

  try {
    const signature = await deliverTokens(recipient, tokens);
    await supabaseAdmin
      .from("presale_purchases")
      .update({
        status: "delivered",
        delivery_tx: signature,
        error: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    await notifyPurchase({ email, recipient, tokens, amountUsd, amountNative, signature });

    return {
      ok: true,
      message: `Payment verified. ${tokens.toLocaleString()} LTCME sent to your wallet.`,
      status: "delivered",
      tokens,
      amountUsd,
      deliveryTx: signature,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Delivery failed";
    console.error("[presale] delivery failed", msg);
    await supabaseAdmin
      .from("presale_purchases")
      .update({
        status: "delivery_failed",
        error: msg,
        updated_at: new Date().toISOString(),
      })
      .eq("id", row.id);

    await notifyPurchase({
      email,
      recipient,
      tokens,
      amountUsd,
      amountNative,
      signature: null,
    });

    return {
      ok: true,
      message: `Payment verified for ${tokens.toLocaleString()} LTCME, but automatic delivery could not complete (${msg}). Your allocation is recorded and will be sent shortly.`,
      status: "delivery_failed",
      tokens,
      amountUsd,
      deliveryTx: null,
    };
  }
}

/** Buyer + owner purchase emails. No-ops until the sender domain is configured. */
async function notifyPurchase(p: {
  email: string | null;
  recipient: string;
  tokens: number;
  amountUsd: number;
  amountNative: number;
  signature: string | null;
}) {
  try {
    const mod = await import("./presale-email.server");
    await mod.sendPurchaseEmails(p);
  } catch (e) {
    console.error("[presale] email notification skipped", e);
  }
}

export async function getPresaleTotals() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("presale_purchases")
    .select("tokens, amount_usd, status");
  const rows = data ?? [];
  return {
    buyers: rows.length,
    tokensSold: rows.reduce((s, r) => s + Number(r.tokens || 0), 0),
    usdRaised: rows.reduce((s, r) => s + Number(r.amount_usd || 0), 0),
    delivered: rows.filter((r) => r.status === "delivered").length,
  };
}
