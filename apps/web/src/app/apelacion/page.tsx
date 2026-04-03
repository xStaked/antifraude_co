"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";
import { api } from "@/lib/api";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function Spinner({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" aria-hidden="true">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
  );
}

function CheckCircleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );
}

export default function ApelacionPage() {
  const [phone, setPhone] = useState("");
  const [applicantName, setApplicantName] = useState("");
  const [contactEmail, setContactEmail] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await api("/review-request", {
        method: "POST",
        body: JSON.stringify({ phone, applicantName, contactEmail, reason }),
      });
      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-2xl px-6 py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-6">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">Apelar reporte</h1>
          <p className="mt-2 text-muted-foreground">
            Si crees que un número fue reportado injustamente, envíanos una solicitud de revisión.
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {success ? (
            <div className="text-center">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400">
                <CheckCircleIcon className="h-7 w-7" />
              </div>
              <h2 className="mt-4 text-lg font-semibold text-green-100">Solicitud enviada</h2>
              <p className="mt-1 text-green-200">Te contactaremos por correo con el resultado de la revisión.</p>
              <div className="mt-6">
                <Link href="/">
                  <Button className="h-12 bg-foreground text-background hover:bg-foreground/90">Volver al inicio</Button>
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-medium text-foreground">Número de teléfono a apelar</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-2 h-12" placeholder="310 234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Nombre completo</label>
                <Input value={applicantName} onChange={(e) => setApplicantName(e.target.value)} required className="mt-2 h-12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Correo de contacto</label>
                <Input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} required className="mt-2 h-12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Motivo de la apelación</label>
                <textarea
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  required
                  rows={4}
                  className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-1 focus:ring-ring/50"
                  placeholder="Explica por qué consideras que el reporte es inexacto..."
                />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="h-12 gap-2 bg-foreground text-background hover:bg-foreground/90">
                {loading ? <><Spinner className="h-5 w-5 animate-spin" /> Enviando...</> : "Enviar apelación"}
              </Button>
            </form>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
