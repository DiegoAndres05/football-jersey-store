"use client";

import { useState } from "react";
import { Search, Loader2, Download, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { extractUrlAction, downloadUrlImagesAction, type ExtractUrlResponse } from "../server/url-import-actions";

type Product = {
  title: string;
  imageUrl: string;
  selected: boolean;
};

export function UrlImportForm() {
  const [url, setUrl] = useState("");
  const [keywords, setKeywords] = useState("");
  const [pending, setPending] = useState(false);
  const [result, setResult] = useState<ExtractUrlResponse | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [imageType, setImageType] = useState<"independent" | "associated">("independent");
  const [productId, setProductId] = useState("");
  const [teamId, setTeamId] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [downloading, setDownloading] = useState(false);
  const [downloadResult, setDownloadResult] = useState<string[] | null>(null);

  async function onExtract(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setResult(null);
    setProducts([]);
    setDownloadResult(null);
    try {
      const parsedKeywords = keywords
        .split(",")
        .map((k) => k.trim())
        .filter(Boolean);
      const res = await extractUrlAction({ url: url.trim(), keywords: parsedKeywords });
      setResult(res);
      if (res.ok) {
        setProducts(res.products.map((p) => ({ ...p, selected: false })));
      }
    } catch (err) {
      setResult({
        ok: false,
        error: err instanceof Error ? err.message : "No se pudo extraer datos.",
      });
    } finally {
      setPending(false);
    }
  }

  function toggleProduct(index: number) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, selected: !p.selected } : p)),
    );
  }

  function updateTitle(index: number, title: string) {
    setProducts((prev) =>
      prev.map((p, i) => (i === index ? { ...p, title } : p)),
    );
  }

  async function onDownload() {
    const selected = products.filter((p) => p.selected);
    if (selected.length === 0) return;
    setDownloading(true);
    setDownloadResult(null);
    try {
      const res = await downloadUrlImagesAction({
        products: selected,
        type: imageType,
        productId: imageType === "associated" ? productId || undefined : undefined,
        teamId: imageType === "associated" ? teamId || undefined : undefined,
        seasonId: imageType === "associated" ? seasonId || undefined : undefined,
      });
      if (res.ok) {
        setDownloadResult(res.urls);
      } else {
        setDownloadResult(null);
        alert(res.error);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al descargar.");
    } finally {
      setDownloading(false);
    }
  }

  const selectedCount = products.filter((p) => p.selected).length;

  return (
    <div className="space-y-6">
      <form
        onSubmit={onExtract}
        className="rounded-xl border border-border bg-card p-5 space-y-4"
      >
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Importar desde URL
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            Pega un link de cualquier página y extrae imágenes de productos.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url-import-link">URL de la página</Label>
          <Input
            id="url-import-link"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://www.ejemplo.com/productos"
            type="url"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="url-import-keywords">Palabras clave (separadas por coma)</Label>
          <Input
            id="url-import-keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="Real Madrid, 2026-27, Barcelona"
          />
          <p className="text-xs text-muted-foreground">
            Deja vacío para extraer todas las imágenes.
          </p>
        </div>

        <Button type="submit" disabled={pending || !url.trim()}>
          {pending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Search className="mr-2 h-4 w-4" />}
          {pending ? "Extrayendo…" : "Extraer"}
        </Button>
      </form>

      {result && !result.ok && (
        <div className="rounded-xl border border-destructive/50 bg-destructive/5 p-4 text-sm text-destructive">
          {result.error}
        </div>
      )}

      {result && result.ok && result.products.length === 0 && (
        <div className="rounded-xl border border-border bg-card p-4 text-sm text-muted-foreground">
          No se encontraron resultados.
        </div>
      )}

      {products.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">
              {selectedCount} de {products.length} seleccionadas
            </p>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={imageType === "independent"}
                  onChange={() => setImageType("independent")}
                  className="accent-primary"
                />
                Independiente
              </label>
              <label className="flex items-center gap-1.5 text-sm">
                <input
                  type="radio"
                  checked={imageType === "associated"}
                  onChange={() => setImageType("associated")}
                  className="accent-primary"
                />
                Asociada
              </label>
            </div>
          </div>

          {imageType === "associated" && (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="space-y-1.5">
                <Label htmlFor="url-import-product">Producto (obligatorio)</Label>
                <Input
                  id="url-import-product"
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  placeholder="ID del producto"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="url-import-team">Equipo (opcional)</Label>
                <Input
                  id="url-import-team"
                  value={teamId}
                  onChange={(e) => setTeamId(e.target.value)}
                  placeholder="ID del equipo"
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="url-import-season">Temporada (opcional)</Label>
                <Input
                  id="url-import-season"
                  value={seasonId}
                  onChange={(e) => setSeasonId(e.target.value)}
                  placeholder="ID de la temporada"
                />
              </div>
            </div>
          )}

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <div
                key={index}
                className={`rounded-xl border bg-card p-3 space-y-2 ${
                  product.selected ? "border-primary" : "border-border"
                }`}
              >
                <div className="relative aspect-square overflow-hidden rounded-lg bg-secondary">
                  <img
                    src={product.imageUrl}
                    alt={product.title}
                    className="h-full w-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => toggleProduct(index)}
                    className={`absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full ${
                      product.selected ? "bg-primary text-primary-foreground" : "bg-background/80"
                    }`}
                  >
                    {product.selected && <Check className="h-4 w-4" />}
                  </button>
                </div>
                <Input
                  value={product.title}
                  onChange={(e) => updateTitle(index, e.target.value)}
                  className="text-sm"
                />
              </div>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={onDownload}
              disabled={downloading || selectedCount === 0}
            >
              {downloading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              {downloading ? "Descargando…" : `Descargar seleccionadas (${selectedCount})`}
            </Button>
          </div>

          {downloadResult && downloadResult.length > 0 && (
            <div className="rounded-xl border border-primary/50 bg-primary/5 p-4 text-sm">
              <p className="font-medium text-primary">
                {downloadResult.length} imagen(es) descargada(s) exitosamente.
              </p>
              <ul className="mt-2 space-y-1 text-muted-foreground">
                {downloadResult.map((path, i) => (
                  <li key={i} className="truncate">{path}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
