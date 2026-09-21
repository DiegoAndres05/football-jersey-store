import { listCoupons } from "./actions";
import { CouponManagement } from "./coupon-management";

export default async function CouponsPage() {
  const result = await listCoupons();
  if (!result.ok) return <p className="text-destructive">{result.message}</p>;

  const coupons = result.coupons.map((coupon) => ({
    id: coupon.id,
    code: coupon.code,
    discountType: coupon.discountType,
    value: coupon.value,
    startsAt: coupon.startsAt.toISOString(),
    endsAt: coupon.endsAt?.toISOString() ?? null,
    maxUses: coupon.maxUses,
    isActive: coupon.isActive,
    confirmedUses: coupon.usages.filter((usage) => usage.state === "CONFIRMED").length,
  }));

  return (
    <>
      <p className="sr-only">Código, Descuento, Estado y Usos de cada cupón. Activo o Inactivo.</p>
      <CouponManagement initialCoupons={coupons} />
    </>
  );
}
