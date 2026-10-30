import { InfoIcon } from "lucide-react";

type DisclaimerProps = {
  title: string;
  body: string;
};

/** «العهدة على المصدر» — shown with every answer. A neutral note, not a warning. */
export function Disclaimer({ title, body }: DisclaimerProps) {
  return (
    <div role="note" className="flex items-start gap-3 rounded-xl border border-notice-border bg-notice px-4 py-3 text-sm text-ink-soft">
      <InfoIcon className="mt-1 size-4 shrink-0 text-muted-foreground" />
      <div>
        <strong className="block text-base text-foreground">{title}</strong>
        {body}
      </div>
    </div>
  );
}
