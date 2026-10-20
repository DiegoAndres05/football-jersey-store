"use client";

import { useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { confirmCashSaleAction } from "@/features/orders/server/cash-sale-actions";
import { filterCashCatalog, type CashCatalogFilter } from "@/features/orders/domain/cash-sale";
import { formatPrice } from "@/lib/utils";

export type CashCatalogOption = {
  id: string;
  productName: string;
  teamName: string;
  leagueName: string;
  seasonName: string;
  versionName: string;
  sizeName: string;
  price: number;
  stock: number;
};

type DraftLine = { variantId: string; quantity: number; label: string; price: number; stock: number };

const emptyFilter: CashCatalogFilter = {
  query: "",
  league: "",
  team: "",
  season: "",
  version: "",
  size: "",
};

const selectClass = "h-10 w-full rounded-md border border-border bg-background px-3 text-sm";

function uniqueNames(values: string[]): string[] {
  return [...new Set(values.filter(Boolean))].sort((a, b) => a.localeCompare(b, "es"));
}

export function CashSaleForm({ options }: { options: CashCatalogOption[] }) {
  const idempotencyKey = useRef(crypto.randomUUID());
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [filters, setFilters] = useState<CashCatalogFilter>(emptyFilter);
  const [lines, setLines] = useState<DraftLine[]>([]);
  const [message, setMessage] = useState("");
  const [pending, setPending] = useState(false);

  const visible = useMemo(() => filterCashCatalog(options, filters), [options, filters]);
  const leagues = useMemo(() => uniqueNames(options.map((item) => item.leagueName)), [options]);
  const teams = useMemo(
    () => uniqueNames(options.filter((item) => !filters.league || item.leagueName === filters.league).map((item) => item.teamName)),
    [options, filters.league],
  );
  const seasons = useMemo(() => uniqueNames(options.map((item) => item.seasonName)), [options]);
  const versions = useMemo(() => uniqueNames(options.map((item) => item.versionName)), [options]);
  const sizes = useMemo(() => uniqueNames(options.map((item) => item.sizeName)), [options]);

  function addItem(option: CashCatalogOption) {
    setLines((current) => {
      const existing = current.find((line) => line.variantId === option.id);
      if (existing) {
        if (existing.quantity >= option.stock) return current;
        return current.map((line) => line.variantId === option.id ? { ...line, quantity: line.quantity + 1 } : line);
      }
      return [...current, {
        variantId: option.id,
        quantity: 1,
        label: `${option.productName} · ${option.versionName} · ${option.sizeName}`,
        price: option.price,
        stock: option.stock,
      }];
    });
  }

  function setQuantity(variantId: string, quantity: number, stock: number) {
    const next = Math.min(stock, Math.max(1, quantity));
    setLines((current) => current.map((line) => line.variantId === variantId ? { ...line, quantity: next } : line));
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

      <section className="space-y-4 rounded-xl border border-border bg-card p-4">
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          <div className="space-y-1.5 md:col-span-2 xl:col-span-3">
            <Label htmlFor="cash-query">Buscar</Label>
            <Input
              id="cash-query"
              value={filters.query}
              placeholder="Nombre, equipo o liga"
              onChange={(event) => setFilters({ ...filters, query: event.target.value })}
            />
          </div>
          <FilterSelect label="Liga" value={filters.league} options={leagues} onChange={(league) => setFilters({ ...filters, league, team: "" })} />
          <FilterSelect label="Equipo" value={filters.team} options={teams} onChange={(team) => setFilters({ ...filters, team })} />
          <FilterSelect label="Temporada" value={filters.season} options={seasons} onChange={(season) => setFilters({ ...filters, season })} />
          <FilterSelect label="Versión" value={filters.version} options={versions} onChange={(version) => setFilters({ ...filters, version })} />
          <FilterSelect label="Talla" value={filters.size} options={sizes} onChange={(size) => setFilters({ ...filters, size })} />
        </div>

        {visible.mode === "prompt" ? (
          <p className="text-sm text-muted-foreground">Hay {options.length} prendas con stock. Filtra por liga, temporada o nombre para verlas.</p>
        ) : visible.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">Ninguna prenda con stock coincide con esos filtros.</p>
        ) : (
          <ul className="max-h-96 space-y-2 overflow-y-auto">
            {visible.items.map((option) => (
              <li key={option.id} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                <span className="min-w-0">
                  <span className="block truncate text-sm font-medium">{option.productName}</span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {option.teamName} · {option.leagueName} · {option.seasonName} · {option.versionName} · {option.sizeName} · {option.stock} disp.
                  </span>
                </span>
                <span className="flex shrink-0 items-center gap-3">
                  <span className="text-sm">{formatPrice(option.price)}</span>
                  <Button type="button" variant="outline" onClick={() => addItem(option)}>Agregar</Button>
                </span>
              </li>
            ))}
          </ul>
        )}
        {visible.matchCount > visible.items.length && (
          <p className="text-sm text-muted-foreground">Hay {visible.matchCount} coincidencias. Afina la búsqueda para ver el resto.</p>
        )}
      </section>

      {lines.length > 0 ? (
        <ul className="space-y-2 text-sm">
          {lines.map((line) => (
            <li key={line.variantId} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
              <span className="min-w-0 flex-1 truncate">{line.label}</span>
              <span className="flex items-center gap-2">
                <Input
                  aria-label={`Cantidad de ${line.label}`}
                  className="h-9 w-16"
                  type="number"
                  min={1}
                  max={line.stock}
                  value={line.quantity}
                  onChange={(event) => setQuantity(line.variantId, Number(event.target.value), line.stock)}
                />
                <span>{formatPrice(line.price * line.quantity)}</span>
                <Button type="button" variant="outline" onClick={() => setLines((current) => current.filter((item) => item.variantId !== line.variantId))}>Quitar</Button>
              </span>
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

function FilterSelect({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <select value={value} onChange={(event) => onChange(event.target.value)} className={selectClass} aria-label={label}>
        <option value="">Todas</option>
        {options.map((option) => (
          <option key={option} value={option}>{option}</option>
        ))}
      </select>
    </div>
  );
}
