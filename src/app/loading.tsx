import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container-page py-8" role="status" aria-label="Cargando la tienda">
      <div className="grid items-center gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <Skeleton variant="text" className="h-4 w-28" />
          <Skeleton variant="text" className="h-12 w-full max-w-md" />
          <Skeleton variant="text" className="h-12 w-4/5 max-w-sm" />
          <Skeleton variant="text" className="h-4 w-full max-w-lg" />
          <Skeleton variant="rectangular" className="h-11 w-40 rounded-xl" />
        </div>
        <Skeleton variant="rectangular" className="aspect-[4/5] w-full rounded-2xl" />
      </div>
      <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="overflow-hidden rounded-xl border border-border">
            <Skeleton variant="rectangular" className="aspect-[3/4]" />
            <div className="space-y-2 p-3">
              <Skeleton variant="text" className="h-3 w-2/3" />
              <Skeleton variant="text" className="h-4 w-full" />
              <Skeleton variant="text" className="h-4 w-1/2" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
