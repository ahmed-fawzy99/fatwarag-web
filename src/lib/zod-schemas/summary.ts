import { z } from "zod";
import { LOCALES } from "@/lib/config/i18n";

/** Evidence as the summary stream sends it; checked again before the server renders it. */
const evidenceSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("quran"), surah: z.number().int().min(1).max(114), ayah: z.number().int().min(1).max(286), ayahEnd: z.number().int().nullable() }),
  z.object({
    type: z.literal("hadith"),
    quote: z.string().max(5_000),
    quoteEn: z.string().max(10_000).nullable(),
    fatwaId: z.string().max(100),
    ref: z.object({ collection: z.string().max(50), number: z.number().int() }).nullable(),
    gradingInFatwa: z.string().max(1_000).nullable(),
    gradingScope: z.enum(["this", "group"]).nullable(),
    gradingContext: z.string().max(2_000).nullable(),
  }),
]);

export const summaryEvidenceInputSchema = z.object({
  locale: z.enum(LOCALES),
  evidence: z.array(evidenceSchema).max(12),
});

export const summaryExtrasInputSchema = z.object({
  locale: z.enum(LOCALES),
  question: z.string().max(2_000),
  ids: z.array(z.string().max(100)).max(30),
  offset: z.number().int().min(0).max(200),
});
