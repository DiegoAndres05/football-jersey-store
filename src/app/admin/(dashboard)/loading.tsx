import { Skeleton } from "@/components/ui/skeleton";

export default function AdminLoading() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton variant="text" className="h-7 w-52" />
        <Skeleton variant="text" className="h-4 w-80 max-w-full" />
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <Skeleton variant="text" className="h-4 w-40" />
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} variant="rectangular" className="h-9" />
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <Skeleton variant="text" className="h-5 w-32" />
          <Skeleton variant="text" className="h-3 w-24" />
        </div>
        <div className="mt-4 space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} variant="text" className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}