import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getStaffUser } from "@/features/auth/server/session";
import { AdminLoginForm } from "@/features/auth/components/admin-login-form";

export const metadata: Metadata = {
  title: "Acceso · Flashsport Admin",
  robots: { index: false, follow: false },
};

export default async function AdminLoginPage() {
  const user = await getStaffUser();
  if (user) redirect("/admin");

  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <AdminLoginForm />
    </div>
  );
}