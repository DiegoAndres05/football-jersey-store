import { readUnsubscribeToken } from "@/features/newsletter/domain/unsubscribe-token";
import { UnsubscribeForm } from "./unsubscribe-form";

export default async function NewsletterUnsubscribePage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const token = (await searchParams).token ?? "";
  const email = token ? readUnsubscribeToken(token) : null;

  return (
    <main className="mx-auto max-w-lg px-4 py-16">
      <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Dejar de recibir ofertas</h1>
      {email ? (
        <>
          <p className="mt-3 text-sm text-muted-foreground">
            Confirmas la baja de {email}. Tus pedidos y correos de compra no cambian.
          </p>
          <div className="mt-6">
            <UnsubscribeForm token={token} />
          </div>
        </>
      ) : (
        <p className="mt-3 text-sm text-destructive">El enlace no es válido.</p>
      )}
    </main>
  );
}
