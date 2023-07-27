import { z } from "zod";

const sellOrBuySchema = z.enum(["sell", "buy"]);

export const PublishEventSchema = z.object({
  psbt: z.string(),
  currentPrice: z.number(),
  output: z.string(),
  inscriptionId: z.string(),
  type: sellOrBuySchema.optional().default("sell"),
});
