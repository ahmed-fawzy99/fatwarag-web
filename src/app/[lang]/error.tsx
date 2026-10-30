"use client";

import { RotateCwIcon, TriangleAlertIcon } from "lucide-react";
import { useParams } from "next/navigation";
import { StatusMessage } from "@/components/common/status-message";
import { Button } from "@/components/ui/button";
import ar from "@/lib/i18n/dictionaries/ar.json";
import en from "@/lib/i18n/dictionaries/en.json";

const STRINGS = { ar: ar.errorPage, en: en.errorPage };

/** When the content can't be loaded (e.g. the API is down): a calm message and a retry, never a raw error. */
export default function PageError({ retry }: { retry: () => void }) {
  const { lang } = useParams<{ lang: string }>();
  const strings = lang === "en" ? STRINGS.en : STRINGS.ar;
  return (
    <StatusMessage icon={TriangleAlertIcon} title={strings.title} body={strings.body} tone="error">
      <Button variant="outline" onClick={() => retry()}>
        <RotateCwIcon />
        {strings.retry}
      </Button>
    </StatusMessage>
  );
}
