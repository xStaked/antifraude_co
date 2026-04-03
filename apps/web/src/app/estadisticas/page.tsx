"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageLayout } from "@/components/layout";
import { api } from "@/lib/api";

// Icons
function ArrowLeftIcon({ className }: { className?: string }) {
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
        d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
      />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      ></circle>
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      ></path>
    </svg>
  );
}

function AlertIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function ChartBarIcon({ className }: { className?: string }) {
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
        d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
      />
    </svg>
  );
}

function ShieldIcon({ className }: { className?: string }) {
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
        d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
      />
    </svg>
  );
}

function UsersIcon({ className }: { className?: string }) {
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
        d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z"
      />
    </svg>
  );
}

function ExclamationIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
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

function PhoneIcon({ className }: { className?: string }) {
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
        d="M10.5 1.5H8.25A2.25 2.25 0 006 3.75v16.5a2.25 2.25 0 002.25 2.25h7.5A2.25 2.25 0 0018 20.25V3.75a2.25 2.25 0 00-2.25-2.25H13.5m-3 0V3h3V1.5m-3 0h3m-3 18.75h3"
      />
    </svg>
  );
}

// Types
interface StatsData {
  overview: {
    totalReports: number;
    approvedReports: number;
    pendingReports: number;
    totalTargets: number;
    highRiskTargets: number;
  };
  byFraudType: Array<{
    type: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  byChannel: Array<{
    channel: string;
    label: string;
    count: number;
    percentage: number;
  }>;
  timeline: Array<{
    date: string;
    count: number;
  }>;
  topTargets: Array<{
    id: string;
    displayPhone: string;
    totalReports: number;
    lastReportAt: string | null;
  }>;
}

// Components
function StatCard({
  title,
  value,
  description,
  icon: Icon,
  colorClass,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="mt-2 text-3xl font-bold tracking-tight text-foreground">
            {value}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        </div>
        <div
          className={`flex h-12 w-12 items-center justify-center rounded-xl ${colorClass}`}
        >
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
}

function ProgressBar({
  label,
  count,
  percentage,
  colorClass,
}: {
  label: string;
  count: number;
  percentage: number;
  colorClass: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between text-sm">
        <span className="font-medium text-foreground">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">{count}</span>
          <span className="w-10 text-right text-xs text-muted-foreground">
            {percentage}%
          </span>
        </div>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
        <div
          className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
}

function SimpleBarChart({
  data,
  maxValue,
  getLabel,
  getValue,
}: {
  data: Array<{ date: string; count: number }>;
  maxValue: number;
  getLabel: (item: { date: string; count: number }) => string;
  getValue: (item: { date: string; count: number }) => number;
}) {
  return (
    <div className="space-y-3">
      {data.map((item, index) => {
        const value = getValue(item);
        const height = maxValue > 0 ? (value / maxValue) * 100 : 0;
        return (
          <div key={index} className="flex items-center gap-3">
            <span className="w-12 text-xs text-muted-foreground">
              {getLabel(item)}
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <div
                  className="h-6 rounded-md bg-accent/80 transition-all duration-500 hover:bg-accent"
                  style={{ width: `${Math.max(height, 2)}%` }}
                />
                <span className="text-xs font-medium text-foreground">
                  {value}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function EstadisticasPage() {
  const [stats, setStats] = useState<StatsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchStats() {
      try {
        setLoading(true);
        const data = await api<StatsData>("/stats");
        setStats(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar estadísticas");
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  // Get last 7 days for timeline display
  const recentTimeline = stats?.timeline.slice(-7) || [];
  const maxTimelineValue = Math.max(...recentTimeline.map((t) => t.count), 1);

  return (
    <PageLayout>
      <div className="mx-auto max-w-6xl px-6 py-10 md:py-16">
        {/* Back Link */}
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>

        {/* Header */}
        <div className="mt-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <ChartBarIcon className="h-4 w-4 text-accent" />
            <span className="text-sm text-muted-foreground">
              Datos en tiempo real
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Estadísticas
          </h1>
          <p className="mt-2 text-muted-foreground">
            Conoce el impacto de la comunidad y las tendencias de fraude en
            Colombia.
          </p>
        </div>

        {/* Loading */}
        {loading && (
          <div className="mt-12 flex flex-col items-center justify-center py-20">
            <Spinner className="h-10 w-10 animate-spin text-accent" />
            <p className="mt-4 text-muted-foreground">
              Cargando estadísticas...
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertIcon className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Content */}
        {!loading && !error && stats && (
          <>
            {/* Overview Cards */}
            <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <StatCard
                title="Total Reportes"
                value={stats.overview.totalReports.toLocaleString("es-CO")}
                description="Reportes registrados"
                icon={ShieldIcon}
                colorClass="bg-accent/10 text-accent"
              />
              <StatCard
                title="Aprobados"
                value={stats.overview.approvedReports.toLocaleString("es-CO")}
                description="Reportes verificados"
                icon={ChartBarIcon}
                colorClass="bg-green-500/10 text-green-500"
              />
              <StatCard
                title="Números Reportados"
                value={stats.overview.totalTargets.toLocaleString("es-CO")}
                description="Números únicos"
                icon={PhoneIcon}
                colorClass="bg-blue-500/10 text-blue-500"
              />
              <StatCard
                title="Alto Riesgo"
                value={stats.overview.highRiskTargets.toLocaleString("es-CO")}
                description="Números peligrosos"
                icon={ExclamationIcon}
                colorClass="bg-red-500/10 text-red-500"
              />
            </div>

            {/* Charts Grid */}
            <div className="mt-8 grid gap-6 lg:grid-cols-2">
              {/* Fraud Types */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
                    <ExclamationIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Tipos de Fraude
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Distribución por categoría
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {stats.byFraudType.map((type, index) => (
                    <ProgressBar
                      key={type.type}
                      label={type.label}
                      count={type.count}
                      percentage={type.percentage}
                      colorClass={
                        index === 0
                          ? "bg-destructive"
                          : index === 1
                            ? "bg-orange-500"
                            : "bg-yellow-500"
                      }
                    />
                  ))}
                  {stats.byFraudType.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay datos disponibles
                    </p>
                  )}
                </div>
              </div>

              {/* Channels */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-500">
                    <UsersIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Canales de Contacto
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Dónde ocurrieron los fraudes
                    </p>
                  </div>
                </div>
                <div className="space-y-4">
                  {stats.byChannel.map((channel, index) => (
                    <ProgressBar
                      key={channel.channel}
                      label={channel.label}
                      count={channel.count}
                      percentage={channel.percentage}
                      colorClass={
                        index === 0
                          ? "bg-blue-500"
                          : index === 1
                            ? "bg-purple-500"
                            : index === 2
                              ? "bg-pink-500"
                              : "bg-gray-500"
                      }
                    />
                  ))}
                  {stats.byChannel.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay datos disponibles
                    </p>
                  )}
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <ClockIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Últimos 7 Días
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Reportes por día
                    </p>
                  </div>
                </div>
                {recentTimeline.length > 0 ? (
                  <SimpleBarChart
                    data={recentTimeline}
                    maxValue={maxTimelineValue}
                    getLabel={(item) => {
                      const date = new Date(item.date);
                      return date.toLocaleDateString("es-CO", {
                        weekday: "short",
                      });
                    }}
                    getValue={(item) => item.count}
                  />
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No hay datos disponibles
                  </p>
                )}
              </div>

              {/* Top Targets */}
              <div className="rounded-2xl border border-border bg-card p-6">
                <div className="mb-6 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-500">
                    <PhoneIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">
                      Números Más Reportados
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Top 10 números con más reportes
                    </p>
                  </div>
                </div>
                <div className="space-y-3">
                  {stats.topTargets.map((target, index) => (
                    <div
                      key={target.id}
                      className="flex items-center justify-between rounded-xl border border-border/50 bg-background/50 p-3"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold ${
                            index < 3
                              ? "bg-destructive text-white"
                              : "bg-secondary text-muted-foreground"
                          }`}
                        >
                          {index + 1}
                        </span>
                        <span className="font-mono text-sm font-medium text-foreground">
                          {target.displayPhone}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm">
                        <span className="text-muted-foreground">
                          {target.totalReports} reportes
                        </span>
                        {target.lastReportAt && (
                          <span className="hidden text-xs text-muted-foreground sm:inline">
                            {new Date(target.lastReportAt).toLocaleDateString(
                              "es-CO"
                            )}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                  {stats.topTargets.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No hay números reportados aún
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Disclaimer */}
            <div className="mt-8 rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
              <p>
                <strong>Nota:</strong> Las estadísticas se actualizan en tiempo
                real. Los datos mostrados provienen de reportes realizados por
                usuarios de la comunidad y están sujetos a verificación.
              </p>
            </div>
          </>
        )}
      </div>
    </PageLayout>
  );
}
