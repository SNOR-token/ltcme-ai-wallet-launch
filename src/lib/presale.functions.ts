import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const verifySchema = z.object({
  txHash: z.string().min(16).max(200),
  recipient: z.string().min(32).max(64),
  email: z.string().email().max(200).optional(),
});

export const verifyPayment = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const { verifyAndDeliver } = await import("./presale.server");
    return await verifyAndDeliver(data);
  });

export const presaleTotals = createServerFn({ method: "GET" }).handler(async () => {
  const { getPresaleTotals } = await import("./presale.server");
  return await getPresaleTotals();
});
