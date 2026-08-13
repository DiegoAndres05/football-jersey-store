import { Skeleton } from "@/components/ui/skeleton";

export default function ProductosLoading() {
  return (
    <div className="container-page py-8">
      <Skeleton variant="text" className="h-4 w-32 mb-6" />

      <div className="flex gap-8">
        <aside className="hidden lg:block w-64 shrink-0 space-y-4">
          <Skeleton variant="text" className="h-5 w-20" />
          <Skeleton variant="text" className="h-9 w-full" />
          <Skeleton variant="text" className="h-9 w-full" />
          <Skeleton variant="text" className="h-20 w-full" />
          <Skeleton variant="text" className="h-16 w-full" />
        </aside>

        <div className="flex-1">
          <Skeleton variant="text" className="h-8 w-40 mb-4" />
          <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="rounded-xl border border-border overflow-hidden">
                <Skeleton variant="rectangular" className="aspect-[3/4]" />
                <div className="p-3 space-y-2">
                  <Skeleton variant="text" className="h-3 w-3/4" />
                  <Skeleton variant="text" className="h-4 w-full" />
                  <Skeleton variant="text" className="h-3 w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
