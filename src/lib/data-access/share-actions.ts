"use server";

import { apiPost, isApiError, type ApiErrorCode } from "@/lib/api/client";
import { isLocale, type Locale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { absoluteUrl } from "@/lib/helpers/seo";
import type { CreatedShare } from "@/types/share";

export type CreateShareResult = { ok: true; url: string } | { ok: false; code: ApiErrorCode };

/**
 * Saves the answer the visitor agreed to share and returns its public link. Called only from the share dialog's
 * confirm button: nothing is stored without it.
 */
export async function createShare(answerId: string, locale: Locale, turnstileToken: string | null): Promise<CreateShareResult> {
  if (typeof answerId !== "string" || !/^[0-9a-f]{32}$/.test(answerId) || !isLocale(locale)) return { ok: false, code: "validation" };
  try {
    const share = await apiPost<CreatedShare>("/shares", { answerId, locale, turnstileToken: turnstileToken ?? "" });
    return { ok: true, url: absoluteUrl(routes.share(locale, share.id)) };
  } catch (error) {
    return { ok: false, code: isApiError(error) ? error.code : "unavailable" };
  }
}
