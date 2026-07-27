// Server-only presale payment verification + token delivery.
import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
  getMint,
  getOrCreateAssociatedTokenAccount,
  transfer,
} from "@solana/spl-token";
import bs58 from "bs58";

export const SOL_DEV_WALLET = "Hfc3YbDXNGmJCiLtoUizraZH46WonVpET7i25ioaZZgy";
export const LTC_DEV_WALLET = "ltc1qr9nuxcphqdhrjheqh8c8yh9254wfncd6j9zrk4";
export const PRICE_USD_PER_TOKEN = 0.00002;

const SOL_RPC = "https://api.mainnet-beta.solana.com";
const LTC_API = "https://litecoinspace.org/api";

export type VerifyResult = {
  ok: boolean;
  message: string;
  status?: string;
  tokens?: number;
  amountUsd?: number;
  deliveryTx?: string | null;
};

async function getPrices(): Promise<{ sol: number; ltc: number }> {
  try {
    const r = await fetch(
      "https://api.coingecko.com/api/v3/simple/price?ids=solana,litecoin&vs_currencies=usd",
    );
    const j = (await r.json()) as Record<string, { usd: number }>;
    return { sol: j.solana?.usd ?? 150, ltc: j.litecoin?.usd ?? 90 };
  } catch {
    return { sol: 150, ltc: 90 };
  }
}

function isValidSolanaAddress(v: string) {
  try {
    // eslint-disable-next-line no-new
    new PublicKey(v);
    return true;
  } catch {
    return false;
  }
}

/** Confirms a Solana transfer landed in the dev wallet; returns SOL amount + payer. */
async function verifySolPayment(txHash: string) {
  const conn = new Connection(SOL_RPC, "confirmed");
  const tx = await conn.getTransaction(txHash, {
    maxSupportedTransactionVersion: 0,
    commitment: "confirmed",
  });
  if (!tx || !tx.meta) return { amount: 0, payer: null as string | null };
  if (tx.meta.err) return { amount: 0, payer: null };

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

/** Confirms a Litecoin transfer landed in the dev wallet; returns LTC amount + payer. */
async function verifyLtcPayment(txHash: string) {
  const r = await fetch(`${LTC_API}/tx/${txHash}`);
  if (!r.ok) return { amount: 0, payer: null as string | null, confirmed: false };
  const tx = (await r.json()) as {
    vin: { prevout?: { scriptpubkey_address?: string } }[];
    vout: { scriptpubkey_address?: string; value: number }[];
    status: { confirmed: boolean };
  };
  const litoshis = tx.vout
    .filter((o) => o.scriptpubkey_address === LTC_DEV_WALLET)
    .reduce((s, o) => s + o.value, 0);
  return {
    amount: litoshis / 1e8,
    payer: tx.vin?.[0]?.prevout?.scriptpubkey_address ?? null,
    confirmed: !!tx.status?.confirmed,
  };
}

/** Sends LTCme SPL tokens from the dev wallet to the buyer. */
async function deliverTokens(recipient: string, tokens: number): Promise<string> {
  const secret = process.env.SOLANA_DEV_WALLET_PRIVATE_KEY;
  const mintStr = process.env.LTCME_TOKEN_MINT;
  if (!secret) throw new Error("Delivery wallet not configured");
  if (!mintStr) throw new Error("Token mint not configured");

  const raw = secret.trim();
  const bytes = raw.startsWith("[")
    ? Uint8Array.from(JSON.parse(raw) as number[])
    : bs58.decode(raw);
  const payer = Keypair.fromSecretKey(bytes);
  if (payer.publicKey.toBase58() !== SOL_DEV_WALLET) {
    throw new Error("Configured delivery key does not match the dev wallet");
  }

  const conn = new Connection(SOL_RPC, "confirmed");
  const mint = new PublicKey(mintStr);
  const mintInfo = await getMint(conn, mint);
  const from = await getOrCreateAssociatedTokenAccount(conn, payer, mint, payer.publicKey);
  const to = await getOrCreateAssociatedTokenAccount(
    conn,
    payer,
    mint,
    new PublicKey(recipient),
  );
  const amount = BigInt(Math.floor(tokens)) * BigInt(10) ** BigInt(mintInfo.decimals);
  return await transfer(conn, payer, from.address, to.address, payer, amount);
}

export async function verifyAndDeliver(input: {
  chain: "SOL" | "LTC";
  txHash: string;
  recipient: string;
}): Promise<VerifyResult> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const txHash = input.txHash.trim();
  const recipient = input.recipient.trim();

  if (!txHash || txHash.length < 32) {
    return { ok: false, message: "Enter a valid transaction hash." };
  }
  if (!isValidSolanaAddress(recipient)) {
    return {
      ok: false,
      message: "Enter a valid Solana address to receive your LTCme tokens.",
    };
  }

  // Already processed? Return the recorded outcome instead of double-paying.
  const { data: existing } = await supabaseAdmin
    .from("presale_purchases")
    .select("*")
    .eq("chain", input.chain)
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

  const prices = await getPrices();
  let amountNative = 0;
  let payerAddress: string | null = null;

  if (input.chain === "SOL") {
    const res = await verifySolPayment(txHash);
    amountNative = res.amount;
    payerAddress = res.payer;
    if (amountNative <= 0) {
      return {
        ok: false,
        message:
          "No confirmed SOL payment to the presale wallet was found for that signature. Wait for confirmation and try again.",
      };
    }
  } else {
    const res = await verifyLtcPayment(txHash);
    amountNative = res.amount;
    payerAddress = res.payer;
    if (amountNative <= 0) {
      return {
        ok: false,
        message:
          "No Litecoin payment to the presale wallet was found in that transaction.",
      };
    }
    if (!res.confirmed) {
      return {
        ok: false,
        message:
          "That Litecoin payment is still unconfirmed. Try again once it has at least one confirmation.",
      };
    }
  }

  const amountUsd = amountNative * (input.chain === "SOL" ? prices.sol : prices.ltc);
  const tokens = Math.floor(amountUsd / PRICE_USD_PER_TOKEN);
  if (tokens <= 0) {
    return { ok: false, message: "Payment amount is too small to allocate tokens." };
  }

  const { data: row, error: upsertError } = await supabaseAdmin
    .from("presale_purchases")
    .upsert(
      {
        chain: input.chain,
        tx_hash: txHash,
        payer_address: payerAddress,
        recipient_solana_address: recipient,
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

    return {
      ok: true,
      message: `Payment verified. ${tokens.toLocaleString()} LTCme sent to your wallet.`,
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

    return {
      ok: true,
      message: `Payment verified for ${tokens.toLocaleString()} LTCme, but automatic delivery could not complete (${msg}). Your allocation is recorded and will be sent shortly.`,
      status: "delivery_failed",
      tokens,
      amountUsd,
      deliveryTx: null,
    };
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
