"use client";

import { useState } from "react";

const NAME = /^[A-Za-zÀ-ÿ0-9 .'-]{0,15}$/;

export function NameNumberPreview() {
  const [name, setName] = useState("");
  const [number, setNumber] = useState("");
  const previewName = name.trim().replace(/\s+/g, " ").toUpperCase() || "Tu nombre aquí";
  const previewNumber = number || "10";

  return (
    <div className="rounded-[22px] bg-[#12141a] px-5 py-5 text-white">
      <p className="text-center text-[10px] font-semibold uppercase tracking-[0.2em] text-[#9aa0aa]">
        Vista previa de estampado
      </p>
      <div className="mt-4 rounded-2xl border border-dashed border-[#3a3f4a] px-4 py-8 text-center">
        <p className="text-[22px] font-extrabold uppercase tracking-[0.08em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
          {previewName}
        </p>
        <p className="mt-1 text-[84px] font-extrabold leading-none tracking-[-0.04em] [font-family:var(--font-ui-heavy),var(--font-sans)]">
          {previewNumber}
        </p>
        <p className="mt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-[#9aa0aa]">
          Parche oficial incluido
        </p>
      </div>
      <div className="mt-4 grid grid-cols-2 gap-2">
        <label className="sr-only" htmlFor="preview-name">
          Nombre
        </label>
        <input
          id="preview-name"
          value={name}
          maxLength={15}
          autoComplete="off"
          placeholder="Ej. RODRÍGUEZ"
          onChange={(event) => {
            const next = event.target.value;
            if (NAME.test(next)) setName(next);
          }}
          className="w-full rounded-xl bg-[#2a2e36] px-3 py-2.5 text-center text-[13px] text-[#d5d7dc] outline-none placeholder:text-[#8d9199] focus-visible:ring-2 focus-visible:ring-white/40"
        />
        <label className="sr-only" htmlFor="preview-number">
          Dorsal
        </label>
        <input
          id="preview-number"
          value={number}
          inputMode="numeric"
          maxLength={2}
          autoComplete="off"
          placeholder="Dorsal (10)"
          onChange={(event) => setNumber(event.target.value.replace(/\D/g, "").slice(0, 2))}
          className="w-full rounded-xl bg-[#2a2e36] px-3 py-2.5 text-center text-[13px] text-[#d5d7dc] outline-none placeholder:text-[#8d9199] focus-visible:ring-2 focus-visible:ring-white/40"
        />
      </div>
    </div>
  );
}
