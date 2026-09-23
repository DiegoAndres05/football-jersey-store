import type { ReactNode } from "react";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

export function LegalDocumentPage({
  eyebrow = "Información legal",
  title,
  updatedAt = "23 de septiembre de 2026",
  children,
}: {
  eyebrow?: string;
  title: string;
  updatedAt?: string;
  children: ReactNode;
}) {
  return (
    <article className="container-page max-w-4xl py-8 md:py-12">
      <div className="mb-8 flex items-center gap-2 text-sm text-muted-foreground">
        <Link href="/" className="transition-colors hover:text-foreground">Inicio</Link>
        <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        <span className="font-medium text-foreground">{title}</span>
      </div>
      <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">{eyebrow}</p>
      <h1 className="mt-2 font-display text-4xl font-bold uppercase tracking-tight md:text-6xl">{title}</h1>
      <p className="mt-4 text-sm text-muted-foreground">Última actualización: {updatedAt}</p>
      <div className="mt-10 space-y-8 text-sm leading-7 text-muted-foreground [&_h2]:font-display [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:uppercase [&_h2]:tracking-tight [&_h2]:text-foreground [&_p]:max-w-3xl [&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 [&_a]:text-foreground [&_a]:underline [&_a]:underline-offset-4">
        {children}
      </div>
    </article>
  );
}
