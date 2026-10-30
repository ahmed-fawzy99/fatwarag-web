import { z } from "zod";
import { MAX_QUESTION_LENGTH, MIN_QUESTION_LENGTH } from "@/lib/config/constants";

export type QuestionMessages = { empty: string; tooShort: string };

export function createQuestionSchema(messages: QuestionMessages) {
  return z.object({
    question: z
      .string()
      .trim()
      .min(1, messages.empty)
      .min(MIN_QUESTION_LENGTH, messages.tooShort)
      .max(MAX_QUESTION_LENGTH),
  });
}

export type QuestionInput = z.infer<ReturnType<typeof createQuestionSchema>>;
