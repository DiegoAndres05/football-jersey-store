"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const CONSENT_COOKIE = "fs_cookie_consent";
const CONSENT_MAX_AGE = 60 * 60 * 24 * 180;

function readConsent(): "accepted" | "rejected" | null {
  const value = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${CONSENT_COOKIE}=`))
    ?.split("=")[1];

  return value === "accepted" || value === "rejected" ? value : null;
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setVisible(readConsent() === null);
  }, []);

  function saveConsent(value: "accepted" | "rejected") {
    document.cookie = `${CONSENT_COOKIE}=${value}; path=/; max-age=${CONSENT_MAX_AGE}; SameSite=Lax`;
    setVisible(false);
  }

  if (!visible) return null;

  return (
    <aside
      role="dialog"
      aria-label="Preferencias de cookies"
      className="fixed inset-x-3 bottom-3 z-50 rounded-xl border border-border bg-card p-4 shadow-lg sm:inset-x-auto sm:right-5 sm:max-w-md sm:p-5"
    >
      <h2 className="font-display text-lg font-bold uppercase tracking-tight">Usamos cookies</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        Usamos cookies esenciales para que la tienda funcione y cookies funcionales para recordar tu moneda.{" "}
        <Link href="/cookies" className="underline underline-offset-2">
          Conoce más
        </Link>
        .
      </p>
      <div className="mt-4 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <button
          type="button"
          onClick={() => saveConsent("rejected")}
          className="rounded-md border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
        >
          Rechazar no esenciales
        </button>
        <button
          type="button"
          onClick={() => saveConsent("accepted")}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        >
          Aceptar
        </button>
      </div>
    </aside>
  );
}
