import { TriangleAlertIcon } from "lucide-react";

/** Sits above the header on every page while the service is under review; pinned with it (see PinnedTop). */
export function ReviewBanner({ text }: { text: string }) {
  return (
    <div role="note" className="bg-saffron text-saffron-foreground">
      <p className="mx-auto flex max-w-[860px] items-center justify-center gap-2 px-4 py-1.5 text-center text-sm font-medium">
        {text}
        <TriangleAlertIcon className="size-4 shrink-0" />
      </p>
    </div>
  );
}
