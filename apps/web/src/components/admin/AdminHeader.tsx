"use client";

import { useEffect, useState } from "react";

interface AdminUser {
  email: string;
  role: "admin" | "moderator";
}

export function AdminHeader({ title }: { title: string }) {
  const [user, setUser] = useState<AdminUser | null>(null);

  useEffect(() => {
    const userData = localStorage.getItem("admin_user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  return (
    <header className="mb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Bienvenido de vuelta, {user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/20 bg-accent/10 px-3 py-1 text-xs font-medium text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent animate-pulse" />
            {user?.role === "admin" ? "Administrador" : "Moderador"}
          </span>
        </div>
      </div>
    </header>
  );
}
