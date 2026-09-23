import type { Metadata } from "next";
import { MysteryBoxPicker } from "@/features/products/components/mystery-box-picker";
import { getMysteryBoxPage } from "@/features/products/repositories/product-repository";
import { getCurrencyContext } from "@/shared/money/server-helpers";

export const metadata: Metadata = {
  title: "Caja misteriosa",
  description:
    "Elige una caja Básica, Estándar o Premium y tu talla. Dentro llega una camiseta sorpresa de esa calidad.",
};

export default async function CajaMisteriosaPage() {
  const [box, currency] = await Promise.all([getMysteryBoxPage(), getCurrencyContext()]);
  if (!box || box.variants.length === 0) {
    return (
      <section className="container-page py-16">
        <h1 className="text-3xl font-bold">Caja misteriosa</h1>
        <p className="mt-3 text-muted-foreground">Esta caja no está disponible por ahora.</p>
      </section>
    );
  }
  return <MysteryBoxPicker box={box} currency={currency} />;
}
