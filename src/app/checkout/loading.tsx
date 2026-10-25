import { Skeleton } from "@/components/ui/skeleton";

export default function CheckoutLoading() {
  return (
    <div className="container-page py-6 sm:py-8" role="status" aria-label="Cargando el pago">
      <Skeleton variant="text" className="mb-3 h-4 w-36" />
      <Skeleton variant="text" className="mb-6 h-8 w-32" />
      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5">
          <Skeleton variant="text" className="h-5 w-28" />
          <Skeleton variant="rectangular" className="h-11 w-full rounded-md" />
          <div className="grid gap-3 sm:grid-cols-2">
            <Skeleton variant="rectangular" className="h-11 w-full rounded-md" />
            <Skeleton variant="rectangular" className="h-11 w-full rounded-md" />
          </div>
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="rectangular" className="h-11 w-full rounded-md" />
          <Skeleton variant="rectangular" className="h-11 w-full rounded-md" />
        </div>
        <div className="space-y-3 rounded-xl border border-border bg-card p-4 sm:p-5">
          <Skeleton variant="text" className="h-5 w-24" />
          <Skeleton variant="rectangular" className="h-16 w-full rounded-md" />
          <Skeleton variant="text" className="h-4 w-full" />
          <Skeleton variant="rectangular" className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}
