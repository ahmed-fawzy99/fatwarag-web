import { z } from "zod";
import { MAX_REPORT_COMMENT_LENGTH, REPORT_REASONS } from "@/lib/config/constants";

export type ReportMessages = { reasonRequired: string; commentTooLong: string };

export function createReportSchema(messages: ReportMessages) {
  return z.object({
    reason: z.enum(REPORT_REASONS, { error: messages.reasonRequired }),
    comment: z.string().trim().max(MAX_REPORT_COMMENT_LENGTH, messages.commentTooLong),
  });
}

export type ReportInput = z.infer<ReturnType<typeof createReportSchema>>;
