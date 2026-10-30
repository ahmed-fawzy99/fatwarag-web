import { LoaderIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

/** Where the fatwa text goes while its first-time translation is made. */
export function TranslationSkeleton({ label }: { label: string }) {
  return (
    <div className="flex flex-col gap-3" aria-busy="true">
      <p className="flex items-center gap-2 text-sm text-muted-foreground">
        <LoaderIcon className="size-4 animate-spin" />
        {label}
      </p>
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-11/12" />
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}
