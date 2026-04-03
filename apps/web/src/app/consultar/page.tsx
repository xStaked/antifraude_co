"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";
import { api } from "@/lib/api";

type SearchResult = {
  targetId: string;
  displayPhone: string;
  riskLevel: string;
  riskScore: number;
  totalApprovedReports: number;
  lastReportAt: string | null;
  recentReports: Array<{
    id: string;
    incidentDate: string;
    fraudType: string;
    channel: string;
    amountCents: string | null;
  }>;
  disclaimer: string;
};

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

function SearchIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      aria-hidden="true"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
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



function ShieldCheckIcon({ className }: { className?: string }) {
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

function SearchContent() {
  const searchParams = useSearchParams();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<SearchResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const performSearch = useCallback(async (phoneNumber: string) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await api<SearchResult>("/search", {
        method: "POST",
        body: JSON.stringify({ phone: phoneNumber }),
      });
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-search if phone param is provided in URL
  useEffect(() => {
    const phoneParam = searchParams.get("phone");
    if (phoneParam && !hasSearched) {
      setPhone(phoneParam);
      setHasSearched(true);
      performSearch(phoneParam);
    }
  }, [searchParams, hasSearched, performSearch]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setHasSearched(true);
    await performSearch(phone);
  }

  const riskStyles: Record<string, string> = {
    none: "bg-green-500/10 text-green-400 border-green-500/20",
    low: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
    medium: "bg-orange-500/10 text-orange-400 border-orange-500/20",
    high: "bg-red-500/10 text-red-400 border-red-500/20",
  };

  const riskIconColor: Record<string, string> = {
    none: "text-green-400",
    low: "text-yellow-400",
    medium: "text-orange-400",
    high: "text-red-400",
  };

  const riskLabel: Record<string, string> = {
    none: "Sin reportes",
    low: "Riesgo bajo",
    medium: "Riesgo medio",
    high: "Riesgo alto",
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
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
            <span className="flex h-2 w-2 rounded-full bg-accent" />
            <span className="text-sm text-muted-foreground">
              Verificación en tiempo real
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Consultar número
          </h1>
          <p className="mt-2 text-muted-foreground">
            Verifica si un número de celular ha sido reportado por la comunidad.
          </p>
        </div>

        {/* Search Form */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label
                htmlFor="phone"
                className="block text-sm font-medium text-foreground"
              >
                Número de celular
              </label>
              <div className="mt-3 flex gap-3">
                <div className="relative flex-1">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-4">
                    <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="310 234 5678"
                    className="h-12 pl-11 text-base"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  disabled={loading}
                  size="lg"
                  className="h-12 gap-2 bg-foreground px-5 text-background hover:bg-foreground/90"
                >
                  {loading ? (
                    <>
                      <Spinner className="h-5 w-5 animate-spin" />
                      <span className="hidden sm:inline">Consultando...</span>
                    </>
                  ) : (
                    <>
                      <SearchIcon className="h-5 w-5" />
                      <span className="hidden sm:inline">Consultar</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </form>
        </div>

        {/* Error */}
        {error && (
          <div className="mt-6 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
            <div className="flex items-start gap-3">
              <AlertIcon className="h-5 w-5 shrink-0 text-destructive" />
              <p className="text-destructive">{error}</p>
            </div>
          </div>
        )}

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-4">
            {/* Risk Card */}
            <div
              className={`rounded-2xl border p-5 md:p-6 ${
                riskStyles[result.riskLevel] ??
                "bg-card text-foreground border-border"
              }`}
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xl font-semibold md:text-2xl">
                    {riskLabel[result.riskLevel] ?? result.riskLevel}
                  </p>
                  <p className="mt-1 text-lg opacity-90">
                    {result.displayPhone}
                  </p>
                </div>
                <div
                  className={`shrink-0 rounded-full border border-current/20 p-3 ${
                    riskIconColor[result.riskLevel] ?? "text-muted-foreground"
                  }`}
                >
                  {result.riskLevel === "none" || result.riskLevel === "low" ? (
                    <ShieldCheckIcon className="h-7 w-7" />
                  ) : (
                    <ExclamationIcon className="h-7 w-7" />
                  )}
                </div>
              </div>

              {result.totalApprovedReports > 0 && (
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm opacity-90">
                  <span className="rounded-full border border-current/20 px-3 py-1">
                    Reportes aprobados:{" "}
                    <span className="font-semibold">
                      {result.totalApprovedReports}
                    </span>
                  </span>
                  {result.lastReportAt && (
                    <span className="rounded-full border border-current/20 px-3 py-1">
                      Último:{" "}
                      {new Date(result.lastReportAt).toLocaleDateString(
                        "es-CO"
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            {/* Recent Reports */}
            {result.recentReports.length > 0 && (
              <div className="rounded-2xl border border-border bg-card p-5 md:p-6">
                <h2 className="mb-4 text-lg font-semibold text-foreground">
                  Incidentes recientes
                </h2>
                <ul className="space-y-3">
                  {result.recentReports.map((r) => (
                    <li
                      key={r.id}
                      className="flex flex-col gap-1 rounded-xl border border-border/60 bg-background/50 p-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-medium text-foreground">
                          {r.fraudType}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {r.channel}
                        </p>
                        {r.amountCents && (
                          <p className="text-sm text-accent">
                            ${" "}
                            {(
                              Number(r.amountCents) / 100
                            ).toLocaleString("es-CO")}{" "}
                            COP
                          </p>
                        )}
                      </div>
                      <div className="text-sm text-muted-foreground sm:text-right">
                        {new Date(r.incidentDate).toLocaleDateString("es-CO")}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Disclaimer */}
            <div className="rounded-xl border border-border bg-card/60 p-4 text-xs text-muted-foreground">
              {result.disclaimer}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}

export default function ConsultarPage() {
  return (
    <Suspense fallback={
      <PageLayout>
        <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
          <div className="flex items-center justify-center py-20">
            <Spinner className="h-8 w-8 animate-spin text-accent" />
          </div>
        </div>
      </PageLayout>
    }>
      <SearchContent />
    </Suspense>
  );
}
