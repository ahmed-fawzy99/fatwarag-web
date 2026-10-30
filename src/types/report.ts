import type { REPORT_REASONS } from "@/lib/config/constants";
import type { Summary } from "@/types/answer";

export type ReportReason = (typeof REPORT_REASONS)[number];

export type ReportTarget =
  /** `summary` is the summary as shown, attached so the owner sees what the reader saw. */
  | { kind: "summary"; question: string; summary: Summary }
  | { kind: "fatwa"; fatwaId: string; question: string | null }
  /** On a source page opened from a fatwa's quote link: the quoted text and the fatwa it came from. */
  | { kind: "quran"; surah: number; ayah: number | null; quote?: string | null; referrerFatwaId?: string | null }
  | { kind: "hadith"; collection: string; number: number; quote?: string | null; referrerFatwaId?: string | null };

export type Report = {
  id: string;
  target: ReportTarget;
  reason: ReportReason;
  comment: string;
  locale: string;
  createdAt: string;
};
