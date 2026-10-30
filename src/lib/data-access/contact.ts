"use server";

import { apiPost, isApiError } from "@/lib/api/client";
import type { Locale } from "@/lib/config/i18n";
import type { FormResult } from "@/lib/data-access/reports";

export type ContactInput = {
  name: string;
  email: string;
  message: string;
  locale: Locale;
  turnstileToken: string | null;
};

/** Sends a contact message to the API (it goes to the admin and the owner's Telegram). */
export async function sendContactMessage({ name, email, message, locale, turnstileToken }: ContactInput): Promise<FormResult> {
  try {
    await apiPost("/contact", { name: name || null, email, message, locale, turnstileToken: turnstileToken ?? "" });
    return { ok: true };
  } catch (error) {
    return { ok: false, code: isApiError(error) ? error.code : "unavailable" };
  }
}
