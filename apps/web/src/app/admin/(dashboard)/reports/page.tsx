"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";

export default function ReportsPage() {
  return (
    <>
      <AdminHeader title="Reportes" />
      
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Lista de reportes pendientes - En construcción
        </p>
      </div>
    </>
  );
}
