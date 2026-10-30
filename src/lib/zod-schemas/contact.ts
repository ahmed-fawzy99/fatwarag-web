import { z } from "zod";
import { MAX_CONTACT_MESSAGE_LENGTH, MIN_CONTACT_MESSAGE_LENGTH } from "@/lib/config/constants";

export type ContactMessages = {
  messageRequired: string;
  messageTooShort: string;
  messageTooLong: string;
  emailRequired: string;
  emailInvalid: string;
};

export function createContactSchema(messages: ContactMessages) {
  return z.object({
    name: z.string().trim().max(120),
    email: z.string().trim().min(1, messages.emailRequired).pipe(z.email(messages.emailInvalid)),
    message: z
      .string()
      .trim()
      .min(1, messages.messageRequired)
      .min(MIN_CONTACT_MESSAGE_LENGTH, messages.messageTooShort)
      .max(MAX_CONTACT_MESSAGE_LENGTH, messages.messageTooLong),
  });
}

export type ContactInput = z.infer<ReturnType<typeof createContactSchema>>;
