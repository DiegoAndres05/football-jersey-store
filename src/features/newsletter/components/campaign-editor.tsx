"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import {
  CAMPAIGN_BLOCK_LIMIT,
  appendCampaignBlock,
  campaignHref,
  clearBlockImage,
  documentProblems,
  emptyCampaignDocument,
  hasCampaignChanges,
  moveCampaignBlock,
  removeCampaignBlock,
  renderCampaignPreview,
  setBlockImage,
  type CampaignBlock,
  type CampaignDestinationOption,
  type CampaignDocument,
  type CampaignImage,
} from "../domain/campaign-document";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { sendDesignedNewsletterCampaign, type CampaignSendResult } from "../server/campaign-actions";

const fieldClass = "mt-1 h-10 w-full rounded-md border border-input bg-background px-3 text-sm";

function nextBlock(type: CampaignBlock["type"], id: string): CampaignBlock {
  if (type === "logo") return { id, type, visible: true };
  if (type === "image") return { id, type, image: null };
  if (type === "heading") return { id, type, text: "" };
  if (type === "text") return { id, type, text: "" };
  return { id, type: "button", label: "VER CAMISETAS", destination: { kind: "internal", path: "/productos" } };
}

export function CampaignEditor({
  origin,
  images,
  destinations,
  activeCount,
}: {
  origin: string;
  images: CampaignImage[];
  destinations: CampaignDestinationOption[];
  activeCount: number;
}) {
  const router = useRouter();
  const initialDocument = useRef(emptyCampaignDocument());
  const allowLeave = useRef(false);
  const [document, setDocument] = useState<CampaignDocument>(initialDocument.current);
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");
  const [libraryFor, setLibraryFor] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<CampaignSendResult | null>(null);
  const sequence = useRef(1);
  const dirty = hasCampaignChanges(document, initialDocument.current);
  const problems = useMemo(() => documentProblems(document, origin), [document, origin]);
  const previewHref = `${new URL(origin).origin}/newsletter/baja`;
  const preview = useMemo(
    () => renderCampaignPreview(document, origin, previewHref),
    [document, origin, previewHref],
  );
  const hasLogo = document.blocks.some((block) => block.type === "logo");
  const atLimit = document.blocks.length >= CAMPAIGN_BLOCK_LIMIT;

  useEffect(() => {
    if (!dirty) return;
    // App Router no ofrece un bloqueo de navegación. beforeunload cubre recarga,
    // cierre y salida del documento. Los clics en enlaces de la propia app se
    // confirman aquí. El botón atrás del navegador no se puede interceptar.
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (allowLeave.current) return;
      event.preventDefault();
      event.returnValue = "";
    };
    const confirmLeave = () => window.confirm("Hay cambios sin guardar. Si sales, se perderá esta campaña.");
    const onClick = (event: MouseEvent) => {
      if (allowLeave.current || event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const target = event.target;
      const anchor = target instanceof Element ? target.closest("a") : null;
      if (!anchor || anchor.target === "_blank" || anchor.hasAttribute("download")) return;
      const raw = anchor.getAttribute("href");
      if (!raw || raw.startsWith("#")) return;
      const url = new URL(anchor.href, window.location.href);
      if (url.href === window.location.href) return;
      event.preventDefault();
      event.stopPropagation();
      if (!confirmLeave()) return;
      allowLeave.current = true;
      if (url.origin === window.location.origin) router.push(`${url.pathname}${url.search}${url.hash}`);
      else window.location.assign(url.href);
    };
    const onSubmit = (event: SubmitEvent) => {
      if (allowLeave.current) return;
      event.preventDefault();
      event.stopPropagation();
      if (!confirmLeave()) return;
      allowLeave.current = true;
      const form = event.target;
      if (form instanceof HTMLFormElement) form.submit();
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    window.document.addEventListener("click", onClick, true);
    window.document.addEventListener("submit", onSubmit, true);
    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.document.removeEventListener("click", onClick, true);
      window.document.removeEventListener("submit", onSubmit, true);
    };
  }, [dirty, router]);

  function update(blockId: string, patch: (block: CampaignBlock) => CampaignBlock) {
    setDocument((current) => ({
      ...current,
      blocks: current.blocks.map((block) => (block.id === blockId ? patch(block) : block)),
    }));
  }

  async function sendCampaign() {
    if (problems.length > 0 || activeCount === 0 || sending) return;
    const label = activeCount === 1 ? "1 suscriptor activo" : `${activeCount} suscriptores activos`;
    if (!window.confirm(`¿Enviar esta campaña a ${label}?`)) return;
    setSending(true);
    setSendResult(null);
    const result = await sendDesignedNewsletterCampaign(document);
    setSendResult(result);
    setSending(false);
  }

  function add(type: CampaignBlock["type"]) {
    sequence.current += 1;
    const id = `block-${sequence.current}-${type}`;
    setDocument((current) => appendCampaignBlock(current, nextBlock(type, id)));
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(320px,440px)]">
      <div className="space-y-4">
        <section className="space-y-3 rounded-xl border border-border bg-card p-5">
          <h3 className="font-semibold">Información del correo</h3>
          <label className="block text-sm">
            Nombre interno
            <input
              value={document.name}
              maxLength={80}
              onChange={(event) => setDocument({ ...document, name: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            Asunto
            <input
              value={document.subject}
              maxLength={120}
              onChange={(event) => setDocument({ ...document, subject: event.target.value })}
              className={fieldClass}
            />
          </label>
          <label className="block text-sm">
            Texto de vista previa
            <input
              value={document.preheader}
              maxLength={140}
              onChange={(event) => setDocument({ ...document, preheader: event.target.value })}
              className={fieldClass}
            />
          </label>
        </section>

        {document.blocks.map((block, index) => (
          <section key={block.id} className="space-y-3 rounded-xl border border-border bg-card p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="font-semibold">
                {block.type === "logo" && "Logo"}
                {block.type === "image" && "Imagen"}
                {block.type === "heading" && "Título"}
                {block.type === "text" && "Texto"}
                {block.type === "button" && "Botón"}
              </h3>
              <div className="flex gap-2">
                <button type="button" className="text-xs text-muted-foreground" aria-label={`Subir bloque de ${blockName(block)}`} onClick={() => setDocument((current) => moveCampaignBlock(current, block.id, -1))} disabled={index === 0}>
                  Subir
                </button>
                <button type="button" className="text-xs text-muted-foreground" aria-label={`Bajar bloque de ${blockName(block)}`} onClick={() => setDocument((current) => moveCampaignBlock(current, block.id, 1))} disabled={index === document.blocks.length - 1}>
                  Bajar
                </button>
                <button type="button" className="text-xs text-destructive" aria-label={`Quitar bloque de ${blockName(block)}`} onClick={() => setDocument((current) => removeCampaignBlock(current, block.id))}>
                  Quitar
                </button>
              </div>
            </div>

            {block.type === "logo" && (
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={block.visible}
                  onChange={(event) => update(block.id, (item) => (item.type === "logo" ? { ...item, visible: event.target.checked } : item))}
                />
                Mostrar el logo oficial
              </label>
            )}

            {block.type === "image" && (
              <div className="space-y-3">
                {block.image ? (
                  <div className="flex items-center gap-3">
                    {/* La miniatura puede venir de un host que next/image no tiene configurado. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={block.image.url} alt={block.image.alt} className="h-16 w-16 rounded-md border border-border object-cover" />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{block.image.name}</p>
                      <p className="truncate text-xs text-muted-foreground">{block.image.alt}</p>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Sin imagen seleccionada.</p>
                )}
                <div className="flex gap-2">
                  <button type="button" className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground" aria-label={`${block.image ? "Cambiar" : "Elegir"} imagen del bloque de imagen`} onClick={() => setLibraryFor(block.id)}>
                    {block.image ? "Cambiar imagen" : "Elegir imagen"}
                  </button>
                  {block.image && (
                    <button type="button" className="rounded-md border border-border px-3 py-2 text-sm" aria-label="Quitar imagen del bloque de imagen" onClick={() => setDocument((current) => clearBlockImage(current, block.id))}>
                      Quitar imagen
                    </button>
                  )}
                </div>
              </div>
            )}

            {block.type === "heading" && (
              <label className="block text-sm">
                Título
                <input value={block.text} maxLength={120} onChange={(event) => update(block.id, (item) => (item.type === "heading" ? { ...item, text: event.target.value } : item))} className={fieldClass} />
              </label>
            )}

            {block.type === "text" && (
              <label className="block text-sm">
                Texto
                <textarea value={block.text} rows={5} maxLength={2000} onChange={(event) => update(block.id, (item) => (item.type === "text" ? { ...item, text: event.target.value } : item))} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
              </label>
            )}

            {block.type === "button" && (
              <ButtonFields
                label={block.label}
                destination={block.destination}
                destinations={destinations}
                origin={origin}
                onLabel={(label) => update(block.id, (item) => (item.type === "button" ? { ...item, label } : item))}
                onDestination={(destination) => update(block.id, (item) => (item.type === "button" ? { ...item, destination } : item))}
              />
            )}
          </section>
        ))}

        <div className="flex flex-wrap gap-2">
          {!hasLogo && <button type="button" className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60" onClick={() => add("logo")} disabled={atLimit}>Añadir logo</button>}
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60" onClick={() => add("image")} disabled={atLimit}>Añadir imagen</button>
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60" onClick={() => add("heading")} disabled={atLimit}>Añadir título</button>
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60" onClick={() => add("text")} disabled={atLimit}>Añadir texto</button>
          <button type="button" className="rounded-md border border-border px-3 py-2 text-sm disabled:opacity-60" onClick={() => add("button")} disabled={atLimit}>Añadir botón</button>
        </div>
        {atLimit && <p className="text-sm text-muted-foreground">Esta campaña ya tiene el máximo de 8 bloques.</p>}

        {problems.length > 0 && (
          <ul className="space-y-1 text-sm text-destructive">
            {problems.map((problem, index) => (
              <li key={`${index}-${problem}`}>{problem}</li>
            ))}
          </ul>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
            disabled={sending || problems.length > 0 || activeCount === 0}
            onClick={sendCampaign}
          >
            {sending ? "Enviando…" : "Enviar campaña"}
          </button>
          <p className="text-sm text-muted-foreground">
            Se envía a {activeCount} {activeCount === 1 ? "suscriptor activo" : "suscriptores activos"}. El diseño no se guarda.
          </p>
        </div>
        {sendResult?.ok && (
          <p className="text-sm text-green-700" role="status">
            Enviados: {sendResult.sent}. Fallidos: {sendResult.failed}. Omitidos por baja: {sendResult.skipped}.
          </p>
        )}
        {sendResult && !sendResult.ok && <p className="text-sm text-destructive" role="status">{sendResult.error}</p>}
        {dirty && (
          <p className="text-sm text-amber-700" role="status">
            Hay cambios sin guardar. Si sales o recargas, se perderán.
          </p>
        )}
      </div>

      <aside className="space-y-3 xl:sticky xl:top-4 xl:self-start">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-semibold">Vista previa</h3>
          <div className="flex rounded-md border border-border p-0.5 text-xs">
            <button type="button" className={`rounded px-2 py-1 ${viewport === "desktop" ? "bg-secondary" : ""}`} onClick={() => setViewport("desktop")}>Escritorio</button>
            <button type="button" className={`rounded px-2 py-1 ${viewport === "mobile" ? "bg-secondary" : ""}`} onClick={() => setViewport("mobile")}>Móvil</button>
          </div>
        </div>
        <div className={`mx-auto overflow-hidden rounded-xl border border-border bg-card ${viewport === "mobile" ? "max-w-[375px]" : "max-w-[640px]"}`}>
          <iframe title="Vista previa del correo" sandbox="" srcDoc={preview} className="h-[720px] w-full bg-white" />
        </div>
        <p className="text-xs text-muted-foreground">
          El enlace de baja de la vista previa no lleva token. En el envío, cada destinatario recibe el suyo.
        </p>
      </aside>

      <Dialog open={libraryFor !== null} onOpenChange={(open) => { if (!open) setLibraryFor(null); }}>
        <DialogContent className="max-h-[80vh] max-w-3xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Biblioteca de imágenes</DialogTitle>
            <DialogDescription>Fotos de productos activos de la tienda. Elige una para este bloque.</DialogDescription>
          </DialogHeader>
          {images.length === 0 ? (
            <p className="text-sm text-muted-foreground">No hay imágenes públicas disponibles.</p>
          ) : (
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {images.map((image) => (
                <li key={image.sourceId}>
                  <button
                    type="button"
                    className="w-full rounded-lg border border-border p-2 text-left hover:border-foreground"
                    onClick={() => {
                      if (!libraryFor) return;
                      setDocument((current) => setBlockImage(current, libraryFor, image));
                      setLibraryFor(null);
                    }}
                  >
                    {/* La miniatura puede venir de un host que next/image no tiene configurado. */}
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={image.url} alt={image.alt} className="aspect-square w-full rounded-md object-cover" />
                    <span className="mt-2 block truncate text-sm font-medium">{image.name}</span>
                    <span className="block truncate text-xs text-muted-foreground">{image.alt}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function blockName(block: CampaignBlock): string {
  if (block.type === "logo") return "logo";
  if (block.type === "image") return "imagen";
  if (block.type === "heading") return "título";
  if (block.type === "text") return "texto";
  return "botón";
}

function ButtonFields({
  label,
  destination,
  destinations,
  origin,
  onLabel,
  onDestination,
}: {
  label: string;
  destination: Extract<CampaignBlock, { type: "button" }>["destination"];
  destinations: CampaignDestinationOption[];
  origin: string;
  onLabel: (label: string) => void;
  onDestination: (destination: Extract<CampaignBlock, { type: "button" }>["destination"]) => void;
}) {
  const href = campaignHref(destination, origin);
  const selected = destination.kind === "url" ? "url" : destination.path;
  return (
    <div className="space-y-3">
      <label className="block text-sm">
        Texto del botón
        <input value={label} maxLength={40} onChange={(event) => onLabel(event.target.value)} className={fieldClass} />
      </label>
      <label className="block text-sm">
        Destino
        <select
          value={selected}
          onChange={(event) => {
            if (event.target.value === "url") onDestination({ kind: "url", url: "" });
            else onDestination({ kind: "internal", path: event.target.value });
          }}
          className={fieldClass}
        >
          {destinations.map((option) => (
            <option key={option.path} value={option.path}>{option.label}</option>
          ))}
          <option value="url">Enlace https de la tienda</option>
        </select>
      </label>
      {destination.kind === "url" && (
        <label className="block text-sm">
          URL
          <input
            value={destination.url}
            placeholder="https://www.flashsports.shop/productos"
            onChange={(event) => onDestination({ kind: "url", url: event.target.value })}
            className={fieldClass}
          />
        </label>
      )}
      <p className={`text-xs ${href ? "text-muted-foreground" : "text-destructive"}`}>
        {href ? href : "Este destino no está permitido."}
      </p>
    </div>
  );
}
