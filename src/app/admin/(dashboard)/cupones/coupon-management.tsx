"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCoupon, toggleCoupon, updateCoupon } from "./actions";

type Coupon = {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  value: number;
  startsAt: string;
  endsAt: string | null;
  maxUses: number | null;
  isActive: boolean;
  confirmedUses: number;
};

type FormState = {
  code: string;
  discountType: Coupon["discountType"];
  value: string;
  startsAt: string;
  endsAt: string;
  maxUses: string;
  isActive: boolean;
};

const emptyForm: FormState = {
  code: "",
  discountType: "PERCENTAGE",
  value: "",
  startsAt: "",
  endsAt: "",
  maxUses: "",
  isActive: true,
};

function toLocalDateTime(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  const offset = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

function formFromCoupon(coupon: Coupon): FormState {
  return {
    code: coupon.code,
    discountType: coupon.discountType,
    value: String(coupon.value),
    startsAt: toLocalDateTime(coupon.startsAt),
    endsAt: toLocalDateTime(coupon.endsAt),
    maxUses: coupon.maxUses == null ? "" : String(coupon.maxUses),
    isActive: coupon.isActive,
  };
}

export function CouponManagement({ initialCoupons }: { initialCoupons: Coupon[] }) {
  const [coupons, setCoupons] = useState(initialCoupons);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [pending, setPending] = useState(false);

  function updateField<K extends keyof FormState>(field: K, value: FormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function resetForm() {
    setEditingId(null);
    setForm(emptyForm);
    setError("");
  }

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setNotice("");

    const input = {
      code: form.code,
      discountType: form.discountType,
      value: Number(form.value),
      startsAt: form.startsAt,
      endsAt: form.endsAt || null,
      maxUses: form.maxUses ? Number(form.maxUses) : null,
      isActive: form.isActive,
    };

    const result = editingId
      ? await updateCoupon(editingId, input)
      : await createCoupon(input);

    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }

    const saved = {
      ...result.coupon,
      startsAt: result.coupon.startsAt.toISOString(),
      endsAt: result.coupon.endsAt?.toISOString() ?? null,
      confirmedUses: editingId
        ? coupons.find((coupon) => coupon.id === editingId)?.confirmedUses ?? 0
        : 0,
    };
    setCoupons((current) =>
      editingId
        ? current.map((coupon) => (coupon.id === editingId ? saved : coupon))
        : [saved, ...current],
    );
    setNotice(editingId ? "Cupón actualizado." : "Cupón creado.");
    resetForm();
    setPending(false);
  }

  async function toggle(coupon: Coupon) {
    setPending(true);
    setError("");
    setNotice("");
    const result = await toggleCoupon(coupon.id, !coupon.isActive);
    if (!result.ok) {
      setError(result.message);
      setPending(false);
      return;
    }
    setCoupons((current) =>
      current.map((item) =>
        item.id === coupon.id ? { ...item, isActive: result.coupon.isActive } : item,
      ),
    );
    setNotice(result.coupon.isActive ? "Cupón activado." : "Cupón desactivado.");
    setPending(false);
  }

  return (
    <section className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Cupones</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Crea y administra promociones sin alterar el historial de pedidos.
        </p>
      </div>

      <form onSubmit={submit} className="rounded-lg border border-border bg-card p-5">
        <h3 className="text-lg font-semibold">
          {editingId ? "Editar cupón" : "Crear cupón"}
        </h3>
        <div className="mt-4 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <div className="space-y-1.5">
            <Label htmlFor="coupon-code">Código</Label>
            <Input id="coupon-code" value={form.code} onChange={(event) => updateField("code", event.target.value)} placeholder="BIENVENIDA10" required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-type">Tipo</Label>
            <select id="coupon-type" className="flex h-10 w-full rounded-xl border border-input bg-background px-3 text-sm" value={form.discountType} onChange={(event) => updateField("discountType", event.target.value as Coupon["discountType"])}>
              <option value="PERCENTAGE">Porcentaje</option>
              <option value="FIXED">Valor fijo (COP)</option>
            </select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-value">{form.discountType === "PERCENTAGE" ? "Porcentaje" : "Valor en COP"}</Label>
            <Input id="coupon-value" type="number" min="1" max={form.discountType === "PERCENTAGE" ? 100 : undefined} value={form.value} onChange={(event) => updateField("value", event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-starts">Inicio</Label>
            <Input id="coupon-starts" type="datetime-local" value={form.startsAt} onChange={(event) => updateField("startsAt", event.target.value)} required />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-ends">Vencimiento (opcional)</Label>
            <Input id="coupon-ends" type="datetime-local" value={form.endsAt} onChange={(event) => updateField("endsAt", event.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="coupon-max-uses">Máximo de usos (opcional)</Label>
            <Input id="coupon-max-uses" type="number" min="1" value={form.maxUses} onChange={(event) => updateField("maxUses", event.target.value)} />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(event) => updateField("isActive", event.target.checked)} />
          Cupón activo
        </label>
        {(error || notice) && <p className={`mt-3 text-sm ${error ? "text-destructive" : "text-emerald-600"}`}>{error || notice}</p>}
        <div className="mt-4 flex gap-2">
          <Button type="submit" loading={pending}>{editingId ? "Guardar cambios" : "Crear cupón"}</Button>
          {editingId && <Button type="button" variant="outline" onClick={resetForm}>Cancelar</Button>}
        </div>
      </form>

      <div className="overflow-x-auto rounded-lg border border-border bg-card">
        <table className="w-full text-sm">
          <thead><tr className="border-b text-left"><th className="p-3">Código</th><th className="p-3">Descuento</th><th className="p-3">Vigencia</th><th className="p-3">Estado</th><th className="p-3">Usos</th><th className="p-3">Acciones</th></tr></thead>
          <tbody>{coupons.map((coupon) => (
            <tr key={coupon.id} className="border-b last:border-0">
              <td className="p-3 font-medium">{coupon.code}</td>
              <td className="p-3">{coupon.discountType === "PERCENTAGE" ? `${coupon.value}%` : `${coupon.value.toLocaleString("es-CO")} COP`}</td>
              <td className="p-3">{new Date(coupon.startsAt).toLocaleDateString("es-CO")} — {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString("es-CO") : "Sin vencimiento"}</td>
              <td className="p-3">{coupon.isActive ? "Activo" : "Inactivo"}</td>
              <td className="p-3">{coupon.confirmedUses}{coupon.maxUses == null ? "" : ` / ${coupon.maxUses}`}</td>
              <td className="p-3">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => { setEditingId(coupon.id); setForm(formFromCoupon(coupon)); setError(""); setNotice(""); }}>Editar</Button>
                  <Button type="button" size="sm" variant={coupon.isActive ? "destructive" : "secondary"} onClick={() => toggle(coupon)} disabled={pending}>{coupon.isActive ? "Desactivar" : "Activar"}</Button>
                </div>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </section>
  );
}
