import { Skeleton } from "@/components/ui/skeleton";

/** Generic page skeleton: a title and a list. Appears only if loading passes a second. */
export function ListSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="delayed-loading flex flex-col gap-4" aria-busy="true">
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-4 w-1/2" />
      <div className="flex flex-col gap-2">
        {Array.from({ length: rows }, (_, i) => (
          <Skeleton key={i} className="h-14 w-full rounded-xl" />
        ))}
      </div>
    </div>
  );
}
