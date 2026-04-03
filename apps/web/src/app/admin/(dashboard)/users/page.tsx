"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminHeader } from "@/components/admin/AdminHeader";

interface AdminUser {
  email: string;
  role: "admin" | "moderator";
}

export default function UsersPage() {
  const router = useRouter();
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const userData = localStorage.getItem("admin_user");
    if (userData) {
      const parsed = JSON.parse(userData);
      if (parsed.role !== "admin") {
        router.push("/admin/dashboard");
        return;
      }
      setUser(parsed);
    }
    setIsLoading(false);
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-muted-foreground">Cargando...</p>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return null;
  }

  return (
    <>
      <AdminHeader title="Gestión de Usuarios" />
      
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Gestión de usuarios administradores - En construcción
        </p>
      </div>
    </>
  );
}
