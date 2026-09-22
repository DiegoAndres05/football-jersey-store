import type { Metadata } from "next";
import { FkaImportForm } from "@/features/import/components/fka-import-form";
import { FKA_IMPORTER_DISABLED_MESSAGE, isFkaImporterEnabled } from "@/features/import/fka/browser-provider";

export const metadata: Metadata = {
  title: "Importar · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default function AdminImportPage() {
  if (!isFkaImporterEnabled()) {
    return (
      <div className="space-y-3">
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Importar</h2>
        <p className="text-sm text-muted-foreground">{FKA_IMPORTER_DISABLED_MESSAGE}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-display text-lg font-bold uppercase tracking-tight">Importar</h2>
        <p className="text-sm text-muted-foreground">
          Previsualización desde Football Kit Archive (FKA). Ninguna búsqueda escribe en la
          base de datos; los resultados muestran el estado de correspondencia y deduplicación.
        </p>
      </div>
      <FkaImportForm />
    </div>
  );
}
