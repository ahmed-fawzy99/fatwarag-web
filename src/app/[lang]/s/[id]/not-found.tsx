import { FileQuestionIcon } from "lucide-react";
import { headers } from "next/headers";
import Link from "next/link";
import { Suspense } from "react";
import { StatusMessage } from "@/components/common/status-message";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { buttonVariants } from "@/components/ui/button";
import { DEFAULT_LOCALE, isLocale } from "@/lib/config/i18n";
import { routes } from "@/lib/config/routes";
import { getDictionary } from "@/lib/i18n/get-dictionary";
import { LOCALE_HEADER } from "@/proxy";

/** An unknown or deleted share. Not-found pages get no route params, so the language comes from the proxy's header. */
async function SharedAnswerNotFound() {
  const value = (await headers()).get(LOCALE_HEADER);
  const locale = value && isLocale(value) ? value : DEFAULT_LOCALE;
  const dict = await getDictionary(locale);
  return (
    <>
      <Breadcrumbs locale={locale} strings={dict.nav} items={[{ label: dict.nav.shared }]} />
      <StatusMessage icon={FileQuestionIcon} title={dict.sharedPage.notFoundTitle} body={dict.sharedPage.notFoundBody}>
        <Link href={routes.home(locale)} className={buttonVariants({ variant: "outline" })}>
          {dict.notFound.home}
        </Link>
      </StatusMessage>
    </>
  );
}

export default function NotFound() {
  return (
    <Suspense>
      <SharedAnswerNotFound />
    </Suspense>
  );
}
