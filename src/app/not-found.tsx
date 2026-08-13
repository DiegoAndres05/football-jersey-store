import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="container-page py-20 text-center animate-fade-in">
      <p className="text-6xl font-bold text-primary">404</p>
      <h1 className="mt-4 text-2xl font-bold">No encontramos esa página</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        La camiseta que buscas se fue al entretiempo.
      </p>
      <Button asChild className="mt-6">
        <Link href="/">Volver al inicio</Link>
      </Button>
    </div>
  );
}
