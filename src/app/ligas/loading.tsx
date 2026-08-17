import { Skeleton } from "@/components/ui/skeleton";

export default function LigasLoading() {
  return (
    <div className="container-page py-8 md:py-12 max-w-5xl">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-3 w-24" />
        <Skeleton variant="text" className="h-12 w-44" />
        <Skeleton variant="text" className="h-4 w-96 max-w-full" />
      </div>

      <div className="mt-12 space-y-10">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-b border-border pb-10 last:border-b-0">
            <div className="flex items-baseline justify-between gap-4">
              <Skeleton variant="text" className="h-7 w-44" />
              <Skeleton variant="text" className="h-3 w-16" />
            </div>
            <Skeleton variant="text" className="mt-2 h-3 w-40" />
            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 4 }).map((_, j) => (
                <Skeleton key={j} variant="text" className="h-9 w-28" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}