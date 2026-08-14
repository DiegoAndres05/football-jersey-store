"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Lock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { loginAction } from "@/features/auth/server/actions";

export function AdminLoginForm() {
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError("");
    const formData = new FormData(e.currentTarget);
    const result = await loginAction(formData);
    if (result && "error" in result) {
      setError(result.error);
      setPending(false);
    } else {
      router.push("/admin");
    }
  }

  return (
    <form onSubmit={onSubmit} className="w-full max-w-sm space-y-4" noValidate>
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground">
        <Lock className="h-5 w-5" />
      </div>
      <div className="text-center">
        <h1 className="font-display text-2xl font-bold uppercase tracking-tight">Administración</h1>
        <p className="mt-1 text-sm text-muted-foreground">Ingresa con tu cuenta de administrador</p>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="admin-email">Correo</Label>
        <Input id="admin-email" name="email" type="email" autoComplete="username" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="admin-password">Contraseña</Label>
        <Input id="admin-password" name="password" type="password" autoComplete="current-password" required />
      </div>

      {error && <p className="text-sm text-destructive">{error}</p>}

      <Button type="submit" className="w-full" disabled={pending}>
        {pending ? "Ingresando…" : "Ingresar"}
      </Button>
    </form>
  );
}