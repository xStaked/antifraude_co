"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface DashboardStats {
  pendingReports: number;
  approvedToday: number;
  totalReports: number;
  openReviewRequests: number;
}

interface PendingReport {
  id: string;
  reportedPhone: string;
  fraudType: string;
  fraudTypeLabel: string;
  channel: string;
  channelLabel: string;
  date: string;
  status: string;
  description: string;
}

function InboxIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338A18.922 18.922 0 0112 3.493 18.922 18.922 0 0121.75 13.838v5.362a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25v-5.362z"
      />
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function DocumentTextIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
      />
    </svg>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  );
}

function ArrowRightIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M3 10a.75.75 0 01.75-.75h10.638l-3.478-3.479a.75.75 0 111.06-1.061l4.83 4.83a.75.75 0 010 1.06l-4.83 4.83a.75.75 0 11-1.06-1.06l3.478-3.479H3.75A.75.75 0 013 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentReports, setRecentReports] = useState<PendingReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [statsData, reportsData] = await Promise.all([
          api<DashboardStats>('/admin/dashboard-stats'),
          api<PendingReport[]>('/admin/pending-reports'),
        ]);
        setStats(statsData);
        setRecentReports(reportsData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error al cargar datos');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) {
    return (
      <>
        <AdminHeader title="Dashboard" />
        <div className="flex h-64 items-center justify-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
            </svg>
            Cargando...
          </div>
        </div>
      </>
    );
  }

  if (error) {
    return (
      <>
        <AdminHeader title="Dashboard" />
        <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center">
          <p className="text-destructive">{error}</p>
          <Button 
            variant="outline" 
            className="mt-4" 
            onClick={() => window.location.reload()}
          >
            Reintentar
          </Button>
        </div>
      </>
    );
  }

  return (
    <>
      <AdminHeader title="Dashboard" />

      {/* Stats Grid */}
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-amber-500/10">
              <InboxIcon className="h-5 w-5 text-amber-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Pendientes</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.pendingReports ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-500/10">
              <CheckCircleIcon className="h-5 w-5 text-emerald-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aprobados hoy</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.approvedToday ?? 0}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
              <DocumentTextIcon className="h-5 w-5 text-blue-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total reportes</p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.totalReports ?? 0}
              </p>
              <p className="text-xs text-muted-foreground">
                {stats ? stats.pendingReports + ' pendientes' : ''}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-violet-500/10">
              <ClockIcon className="h-5 w-5 text-violet-500" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">
                Solicitudes revisión
              </p>
              <p className="text-2xl font-bold text-foreground">
                {stats?.openReviewRequests ?? 0}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Reports */}
      <div className="rounded-xl border border-border bg-card">
        <div className="flex items-center justify-between border-b border-border p-5">
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Reportes pendientes recientes
            </h2>
            <p className="text-sm text-muted-foreground">
              Mostrando {recentReports.length} de {stats?.pendingReports ?? 0} pendientes
            </p>
          </div>
          <Link href="/admin/reports">
            <Button variant="outline" size="sm" className="gap-1">
              Ver todos
              <ArrowRightIcon className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        <div className="divide-y divide-border">
          {recentReports.map((report) => (
            <div
              key={report.id}
              className="flex items-center justify-between p-5 hover:bg-muted/50"
            >
              <div className="flex items-center gap-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-destructive/10">
                  <span className="text-sm font-medium text-destructive">
                    {report.reportedPhone.slice(-3)}
                  </span>
                </div>
                <div>
                  <p className="font-medium text-foreground">
                    {report.reportedPhone}
                  </p>
                  <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                    <span>{report.fraudTypeLabel}</span>
                    <span>•</span>
                    <span>{report.channelLabel}</span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-sm text-muted-foreground">
                  {formatDate(report.date)}
                </span>
                <span className="inline-flex items-center rounded-full bg-amber-500/10 px-2.5 py-1 text-xs font-medium text-amber-500">
                  Pendiente
                </span>
                <Link href={`/admin/reports/${report.id}`}>
                  <Button size="sm" variant="outline">
                    Revisar
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {recentReports.length === 0 && (
          <div className="p-8 text-center">
            <InboxIcon className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <p className="mt-4 text-muted-foreground">
              No hay reportes pendientes
            </p>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/reports"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                Moderar reportes
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Revisa y aprueba los reportes de la comunidad
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRightIcon className="h-5 w-5" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin/approved"
          className="group rounded-xl border border-border bg-card p-6 transition-colors hover:border-accent/40"
        >
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-semibold text-foreground">
                Ver aprobados
              </h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Consulta el historial de reportes aprobados
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent/10 text-accent transition-colors group-hover:bg-accent group-hover:text-accent-foreground">
              <ArrowRightIcon className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </div>
    </>
  );
}
