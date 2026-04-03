"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";

interface ReportDetail {
  id: string;
  reportedPhone: string;
  normalizedPhone: string;
  fraudType: string;
  fraudTypeLabel: string;
  channel: string;
  channelLabel: string;
  description: string;
  reportedName: string | null;
  amountCents: number | null;
  incidentDate: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  target: {
    id: string;
    riskScore: number;
    riskLevel: string;
    totalApprovedReports: number;
  };
  evidence: Array<{
    id: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
  }>;
  actions: Array<{
    id: string;
    actionType: string;
    note: string;
    createdAt: string;
    adminEmail: string;
  }>;
}

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M17 10a.75.75 0 01-.75.75H5.612l4.158 3.96a.75.75 0 11-1.04 1.08l-5.5-5.25a.75.75 0 010-1.08l5.5-5.25a.75.75 0 111.04 1.08L5.612 9.25H16.25A.75.75 0 0117 10z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function formatDate(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(date);
}

function formatDateTime(dateString: string) {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat("es-CO", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function formatCurrency(cents: number | null) {
  if (!cents) return "No especificado";
  const pesos = cents / 100;
  return new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    maximumFractionDigits: 0,
  }).format(pesos);
}

function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getRiskLevelColor(level: string) {
  switch (level) {
    case "high":
      return "text-destructive bg-destructive/10";
    case "medium":
      return "text-amber-500 bg-amber-500/10";
    case "low":
      return "text-emerald-500 bg-emerald-500/10";
    default:
      return "text-muted-foreground bg-muted";
  }
}

function getRiskLevelLabel(level: string) {
  switch (level) {
    case "high":
      return "Alto";
    case "medium":
      return "Medio";
    case "low":
      return "Bajo";
    default:
      return "Ninguno";
  }
}

export default function ReportDetailPage() {
  const params = useParams();
  const [report, setReport] = useState<ReportDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionNote, setActionNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      try {
        setLoading(true);
        const data = await api<ReportDetail>(`/admin/reports/${params.id}`);
        setReport(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Error al cargar el reporte");
      } finally {
        setLoading(false);
      }
    };

    if (params.id) {
      fetchReport();
    }
  }, [params.id]);

  const handleAction = async (actionType: "approve" | "reject" | "hide") => {
    if (!actionNote.trim() || actionNote.length < 10) {
      alert("La nota debe tener al menos 10 caracteres");
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await api<{
        success: boolean;
        action: { id: string; actionType: string; note: string; createdAt: string };
        report: { id: string; status: string };
      }>(`/admin/reports/${params.id}/actions`, {
        method: "POST",
        body: JSON.stringify({
          actionType,
          note: actionNote,
        }),
      });

      if (result.success) {
        alert(`Reporte ${actionType === "approve" ? "aprobado" : actionType === "reject" ? "rechazado" : "ocultado"} correctamente`);
        setActionNote("");
        // Recargar el reporte para mostrar el nuevo estado
        const updatedReport = await api<ReportDetail>(`/admin/reports/${params.id}`);
        setReport(updatedReport);
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : "Error al registrar la acción");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-96 items-center justify-center">
        <div className="flex items-center gap-2 text-muted-foreground">
          <svg className="h-5 w-5 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
          Cargando reporte...
        </div>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="rounded-xl border border-destructive/20 bg-destructive/10 p-8 text-center">
        <p className="text-destructive">{error || "Reporte no encontrado"}</p>
        <Link href="/admin/dashboard">
          <Button variant="outline" className="mt-4">
            Volver al dashboard
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/admin/dashboard">
          <Button variant="outline" size="sm">
            <ArrowLeftIcon className="mr-1 h-4 w-4" />
            Volver
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Reporte #{report.id.slice(0, 8)}
          </h1>
          <p className="text-sm text-muted-foreground">
            Creado el {formatDateTime(report.createdAt)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Report info card */}
          <div className="rounded-xl border border-border bg-card p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">
                Información del reporte
              </h2>
              <span
                className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                  report.status === "pending"
                    ? "bg-amber-500/10 text-amber-500"
                    : report.status === "approved"
                    ? "bg-emerald-500/10 text-emerald-500"
                    : "bg-muted text-muted-foreground"
                }`}
              >
                {report.status === "pending" ? "Pendiente" : report.status}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <p className="text-sm text-muted-foreground">Número reportado</p>
                <p className="text-lg font-medium text-foreground">
                  {report.reportedPhone}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Nombre del reportado</p>
                <p className="font-medium text-foreground">
                  {report.reportedName || "No especificado"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Tipo de fraude</p>
                <p className="font-medium text-foreground">
                  {report.fraudTypeLabel}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Canal</p>
                <p className="font-medium text-foreground">
                  {report.channelLabel}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Monto</p>
                <p className="font-medium text-foreground">
                  {formatCurrency(report.amountCents)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Fecha del incidente</p>
                <p className="font-medium text-foreground">
                  {formatDate(report.incidentDate)}
                </p>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground">Descripción</p>
              <p className="mt-1 whitespace-pre-wrap text-foreground">
                {report.description}
              </p>
            </div>
          </div>

          {/* Evidence */}
          {report.evidence.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Evidencia ({report.evidence.length})
              </h2>
              <div className="grid gap-4 sm:grid-cols-2">
                {report.evidence.map((item) => (
                  <a
                    key={item.id}
                    href={item.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative overflow-hidden rounded-lg border border-border bg-muted/50 p-4 transition-colors hover:border-accent/40"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary">
                        <svg
                          className="h-5 w-5 text-muted-foreground"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="currentColor"
                          strokeWidth="1.5"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H3.75A2.25 2.25 0 001.5 6v12a2.25 2.25 0 002.25 2.25z"
                          />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="truncate text-sm font-medium text-foreground">
                          Evidencia
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(item.fileSize)} • {item.fileType}
                        </p>
                      </div>
                      <svg
                        className="h-4 w-4 text-muted-foreground group-hover:text-foreground"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M4.25 5.5a.75.75 0 00-.75.75v8.5c0 .414.336.75.75.75h8.5a.75.75 0 00.75-.75v-4a.75.75 0 011.5 0v4A2.25 2.25 0 0112.75 17h-8.5A2.25 2.25 0 012 14.75v-8.5A2.25 2.25 0 014.25 4h5a.75.75 0 010 1.5h-5z"
                          clipRule="evenodd"
                        />
                        <path
                          fillRule="evenodd"
                          d="M6.194 12.753a.75.75 0 001.06.053L16.5 4.44v2.81a.75.75 0 001.5 0v-4.5a.75.75 0 00-.75-.75h-4.5a.75.75 0 000 1.5h2.553l-9.056 10.22a.75.75 0 00-.053 1.06z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* History */}
          {report.actions.length > 0 && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Historial de acciones
              </h2>
              <div className="space-y-4">
                {report.actions.map((action) => (
                  <div
                    key={action.id}
                    className="flex gap-4 rounded-lg border border-border bg-muted/30 p-4"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-foreground">
                          {action.actionType === "approve" && "Aprobado"}
                          {action.actionType === "reject" && "Rechazado"}
                          {action.actionType === "hide" && "Ocultado"}
                          {action.actionType === "flag_duplicate" && "Marcado como duplicado"}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          por {action.adminEmail}
                        </span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {action.note}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDateTime(action.createdAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Risk info */}
          <div className="rounded-xl border border-border bg-card p-6">
            <h2 className="mb-4 text-lg font-semibold text-foreground">
              Información de riesgo
            </h2>
            <div className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Nivel de riesgo</p>
                <span
                  className={`mt-1 inline-flex items-center rounded-full px-2.5 py-1 text-sm font-medium ${getRiskLevelColor(
                    report.target.riskLevel
                  )}`}
                >
                  {getRiskLevelLabel(report.target.riskLevel)}
                </span>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Score de riesgo</p>
                <p className="text-2xl font-bold text-foreground">
                  {report.target.riskScore}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  Reportes aprobados previos
                </p>
                <p className="text-lg font-medium text-foreground">
                  {report.target.totalApprovedReports}
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          {report.status === "pending" && (
            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="mb-4 text-lg font-semibold text-foreground">
                Acciones
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-sm text-muted-foreground">
                    Nota de moderación *
                  </label>
                  <textarea
                    value={actionNote}
                    onChange={(e) => setActionNote(e.target.value)}
                    placeholder="Mínimo 10 caracteres..."
                    className="mt-1 min-h-[100px] w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/50"
                  />
                </div>
                <div className="grid gap-2">
                  <Button
                    onClick={() => handleAction("approve")}
                    disabled={isSubmitting}
                    className="w-full bg-emerald-500 hover:bg-emerald-600"
                  >
                    Aprobar reporte
                  </Button>
                  <Button
                    onClick={() => handleAction("reject")}
                    disabled={isSubmitting}
                    variant="outline"
                    className="w-full border-destructive text-destructive hover:bg-destructive/10"
                  >
                    Rechazar
                  </Button>
                  <Button
                    onClick={() => handleAction("hide")}
                    disabled={isSubmitting}
                    variant="ghost"
                    className="w-full"
                  >
                    Ocultar
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
