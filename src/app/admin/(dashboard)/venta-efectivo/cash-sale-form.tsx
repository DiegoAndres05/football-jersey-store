"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmCashSaleAction } from "@/features/orders/server/cash-sale-actions";
import { formatPrice } from "@/lib/utils";

export type CashCatalogOption = {
  id: string;
  label: string;
  price: number;
  stock: number;
};

type DraftLine = { variantId: string; quantity: number; label: string; price: number };

export function CashSaleForm({ options }: { options: CashCatalogOption[] }) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [variantId, setVariantId] = useState(options[0]?.id ?? "");
  const [quantity, setQuantity] = useState(1);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  function addLine() {
    const option = options.find((item) => item.id === variantId);
    if (!option) return;
    setLines((current) => {
      const existing = current.find((line) => line.variantId === option.id);
      if (existing) {
        return current.map((line) => line.variantId === option.id
          ? { ...line, quantity: line.quantity + quantity }
          : line);
      }
      return [...current, { variantId: option.id, quantity, label: option.label, price: option.price }];
    });
  }

  async function confirm() {
    setPending(true);
    setMessage("");
    const result = await confirmCashSaleAction({
      customerName: name,
      customerPhone: phone,
      idempotencyKey: idempotencyKey.current,
      lines: lines.map((line) => ({ variantId: line.variantId, quantity: line.quantity })),
    });
    if ("error" in result) {
      setMessage(result.error);
      setPending(false);
      return;
    }
    setMessage(`Venta registrada: ${result.code}`);
    setLines([]);
    setName("");
    setPhone("");
    idempotencyKey.current = crypto.randomUUID();
    setPending(false);
  }

  const total = lines.reduce((sum, line) => sum + line.price * line.quantity, 0);

  return (
    <div className="space-y-6">
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="cash-name">Nombre del cliente</Label>
          <Input id="cash-name" value={name} onChange={(event) => setName(event.target.value)} required maxLength={120} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cash-phone">Teléfono (opcional)</Label>
          <Input id="cash-phone" value={phone} onChange={(event) => setPhone(event.target.value)} maxLength={30} />
        </div>
      </div>
      <div className="grid gap-3 rounded-xl border border-border bg-card p-4 md:grid-cols-[1fr_8rem_auto]">
        <div className="space-y-1.5">
          <Label htmlFor="cash-variant">Prenda con stock</Label>
          <select id="cash-variant" value={variantId} onChange={(event) => setVariantId(event.target.value)} className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm">
            {options.map((option) => (
              <option key={option.id} value={option.id}>{option.label} · {formatPrice(option.price)} · {option.stock} disp.</option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cash-qty">Cantidad</Label>
          <Input id="cash-qty" type="number" min={1} max={20} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
        </div>
        <div className="flex items-end">
          <Button type="button" variant="outline" onClick={addLine} disabled={options.length === 0}>Agregar</Button>
        </div>
      </div>
      {lines.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.variantId} className="flex items-center justify-between rounded-md border border-border px-3 py-2">
              <span>{line.label} × {line.quantity}</span>
              <span>{formatPrice(line.price * line.quantity)}</span>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-muted-foreground">Todavía no agregas prendas.</p>}
      <div className="flex items-center justify-between">
        <p className="text-sm">Total {formatPrice(total)} · sin envío</p>
        <Button type="button" onClick={confirm} disabled={pending || lines.length === 0 || name.trim().length < 2}>Confirmar venta</Button>
      </div>
      {message ? <p className="text-sm">{message}</p> : null}
    </div>
  );
}
