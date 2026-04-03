"use client";

import { AdminHeader } from "@/components/admin/AdminHeader";

export default function ApprovedPage() {
  return (
    <>
      <AdminHeader title="Reportes Aprobados" />
      
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <p className="text-muted-foreground">
          Historial de reportes aprobados - En construcción
        </p>
      </div>
    </>
  );
}
