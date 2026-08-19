// Server-only presale payment verification + LTCME token delivery (Solana only).
import {
  Connection,
  Keypair,
  PublicKey,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
} from "@solana/web3.js";
import bs58 from "bs58";

/** SOL is sent here by buyers. */
export const SOL_DEV_WALLET = "Ew8mbrKwD6LGaSX28a6XGmXqeQSs2hykRibjXVhftTRC";
/** Treasury holding the minted LTCME supply (same wallet, signs deliveries). */
export const TREASURY_WALLET = "Ew8mbrKwD6LGaSX28a6XGmXqeQSs2hykRibjXVhftTRC";
export const PRICE_USD_PER_TOKEN = 0.00002;

const SOL_RPC = "https://api.mainnet-beta.solana.com";
const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey(
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL",
);
const SYSTEM_PROGRAM_ID = new PublicKey("11111111111111111111111111111111");
const RENT_SYSVAR_ID = new PublicKey("SysvarRent111111111111111111111111111111111");

export type VerifyResult = {
  ok: boolean;
  message: string;
  status?: string;
  tokens?: number;
  amountUsd?: number;
  deliveryTx?: string | null;
};

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

function isValidSolanaAddress(v: string) {
  try {
    new PublicKey(v);
    return true;
  } catch {
    return false;
  }
}

/** Confirms a SOL transfer landed in the presale wallet; returns SOL amount + payer. */
async function verifySolPayment(txHash: string) {
  const conn = new Connection(SOL_RPC, "confirmed");
  const tx = await conn.getTransaction(txHash, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx || !tx.meta || tx.meta.err) return { amount: 0, payer: null as string | null };

  const keys = tx.transaction.message
    .getAccountKeys({ accountKeysFromLookups: tx.meta.loadedAddresses })
    .keySegments()
    .flat()
    .map((k) => k.toBase58());

  const idx = keys.indexOf(SOL_DEV_WALLET);
  if (idx === -1) return { amount: 0, payer: null };
  const delta = (tx.meta.postBalances[idx] ?? 0) - (tx.meta.preBalances[idx] ?? 0);
  return { amount: delta / 1e9, payer: keys[0] ?? null };
}

function findAta(owner: PublicKey, mint: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID,
  )[0];
}

function createAtaIdempotentIx(payer: PublicKey, owner: PublicKey, mint: PublicKey) {
  return new TransactionInstruction({
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
    data: Buffer.from([1]), // CreateIdempotent
  });
}

function transferCheckedIx(
  source: PublicKey,
  mint: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: bigint,
  decimals: number,
) {
  const data = Buffer.alloc(10);
  data.writeUInt8(12, 0); // TransferChecked
  data.writeBigUInt64LE(amount, 1);
  data.writeUInt8(decimals, 9);
  return new TransactionInstruction({
    programId: TOKEN_PROGRAM_ID,
    keys: [
      { pubkey: source, isSigner: false, isWritable: true },
      { pubkey: mint, isSigner: false, isWritable: false },
      { pubkey: destination, isSigner: false, isWritable: true },
      { pubkey: owner, isSigner: true, isWritable: false },
    ],
    data,
  });
}

/** Sends LTCME SPL tokens from the treasury wallet to the buyer. */
async function deliverTokens(recipient: string, tokens: number): Promise<string> {
  const secret = process.env.SOLANA_TREASURY_PRIVATE_KEY;
  const mintStr = process.env.LTCME_TOKEN_MINT;
  if (!secret) throw new Error("Treasury wallet not configured");
  if (!mintStr) throw new Error("Token mint not configured");

  const raw = secret.trim();
  const bytes = raw.startsWith("[")
    ? Uint8Array.from(JSON.parse(raw) as number[])
    : bs58.decode(raw);
  const payer = Keypair.fromSecretKey(bytes);
  if (payer.publicKey.toBase58() !== TREASURY_WALLET) {
    throw new Error("Configured treasury key does not match the treasury wallet");
  }

  const conn = new Connection(SOL_RPC, "confirmed");
  const mint = new PublicKey(mintStr);
  const supply = await conn.getTokenSupply(mint);
  const decimals = supply.value.decimals;
  const owner = new PublicKey(recipient);

  const source = findAta(payer.publicKey, mint);
  const destination = findAta(owner, mint);
  const amount = BigInt(Math.floor(tokens)) * BigInt(10) ** BigInt(decimals);

  const tx = new Transaction()
    .add(createAtaIdempotentIx(payer.publicKey, owner, mint))
    .add(transferCheckedIx(source, mint, destination, payer.publicKey, amount, decimals));

  return await sendAndConfirmTransaction(conn, tx, [payer], {
    commitment: "confirmed",
  });
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
