import { Skeleton } from "@/components/ui/skeleton";

export default function ProductDetailLoading() {
  return (
    <div className="container-page py-8">
      <Skeleton variant="text" className="h-4 w-48 mb-6" />

      <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
        <div className="space-y-3">
          <Skeleton variant="rectangular" className="aspect-[3/4] rounded-xl" />
          <div className="flex gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} variant="rectangular" className="w-16 h-20 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <Skeleton variant="text" className="h-4 w-64" />
          <Skeleton variant="text" className="h-8 w-full" />
          <Skeleton variant="text" className="h-3 w-3/4" />
          <Skeleton variant="text" className="h-10 w-40" />
          <Skeleton variant="rectangular" className="h-32 w-full rounded-xl" />
          <Skeleton variant="rectangular" className="h-24 w-full rounded-xl" />
          <Skeleton variant="rectangular" className="h-14 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
