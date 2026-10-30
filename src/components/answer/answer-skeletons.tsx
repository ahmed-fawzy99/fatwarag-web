import { Skeleton } from "@/components/ui/skeleton";

/** Shown while the search runs. */
export function ResultsSkeleton() {
  return (
    <div className="delayed-loading flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="h-48 w-full rounded-2xl" />
      <Skeleton className="h-14 w-full rounded-xl" />
      {Array.from({ length: 4 }, (_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-xl" />
      ))}
    </div>
  );
}
