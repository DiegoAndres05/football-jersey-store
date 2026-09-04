/**
 * Resultado estándar de una acción administrativa de persistir (guardar o crear).
 * Se usa como retorno de server actions del panel para comunicar éxito o fallo
 * al wrapper que muestra el toast.
 */

export type AdminSaveResult =
  | { ok: true }
  | { ok: false; error: string };

export function saveSuccess(): AdminSaveResult {
  return { ok: true };
}

export function saveError(error: string): AdminSaveResult {
  return { ok: false, error };
}
