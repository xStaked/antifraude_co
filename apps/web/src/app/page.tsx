"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";

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
        d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
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

function FlagIcon({ className }: { className?: string }) {
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
        d="M3 3v1.5M3 21v-6m0 0l2.77-.693a9 9 0 016.208.682l.108.054a9 9 0 006.086.71l3.114-.732a48.524 48.524 0 01-.005-10.499l-3.11.732a9 9 0 01-6.085-.711l-.108-.054a9 9 0 00-6.208-.682L3 4.5M3 15V4.5"
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

function DocumentIcon({ className }: { className?: string }) {
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

const stats = [
  { value: "12,847+", label: "Reportes registrados", sublabel: "en la comunidad" },
  { value: "98%", label: "Precisión", sublabel: "en detección" },
  { value: "24/7", label: "Disponible", sublabel: "siempre activo" },
  { value: "5 seg", label: "Tiempo de consulta", sublabel: "resultados inmediatos" },
];

function BrainIcon({ className }: { className?: string }) {
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
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  );
}

const features = [
  {
    icon: FlagIcon,
    title: "Reportar",
    description:
      "Registra comprobantes falsos y números sospechosos con cédula del estafador. Tu reporte ayuda a proteger a miles de comerciantes.",
    href: "/reportar",
    cta: "Hacer un reporte",
    highlight: true,
  },
  {
    icon: SearchIcon,
    title: "Consultar",
    description:
      "Verifica cualquier número antes de una transacción. Accede al historial de reportes de la comunidad.",
    href: "/consultar",
    cta: "Consultar ahora",
  },
  {
    icon: DocumentIcon,
    title: "Estadísticas",
    description:
      "Visualiza datos actualizados sobre fraudes en Colombia. Identifica patrones y mantente informado.",
    href: "/estadisticas",
    cta: "Ver estadísticas",
  },
];

export default function Home() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/consultar?phone=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <PageLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 pb-20 pt-16 md:pb-32 md:pt-24">
          <div className="mx-auto max-w-4xl text-center">
            {/* Badge */}
            <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
              <span className="flex h-2 w-2 rounded-full bg-accent" />
              <span className="text-sm text-muted-foreground">
                Protección comunitaria activa
              </span>
            </div>

            {/* Headline */}
            <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Protege tu negocio de{" "}
              <span className="text-accent">comprobantes falsos</span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-pretty text-lg text-muted-foreground md:text-xl">
              Consulta números reportados y alerta a la comunidad sobre estafas
              con comprobantes falsos de Nequi, Bancolombia y más en Colombia.
            </p>

            {/* Search Box */}
            <div className="mx-auto mt-10 max-w-xl">
              <form onSubmit={handleSearch}>
                <div className="relative">
                  <div className="absolute inset-0 -z-10 rounded-2xl bg-accent/10 blur-xl" />
                  <div className="relative flex items-center gap-2 rounded-2xl border border-border bg-card p-2">
                    <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-secondary">
                      <PhoneIcon className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <Input
                      type="tel"
                      placeholder="Ingresa un número de teléfono..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="h-12 flex-1 border-0 bg-transparent text-base focus-visible:ring-0 focus-visible:ring-offset-0"
                    />
                    <Button
                      type="submit"
                      size="lg"
                      className="h-12 gap-2 rounded-xl bg-foreground px-6 text-background hover:bg-foreground/90"
                    >
                      <SearchIcon className="h-4 w-4" />
                      <span className="hidden sm:inline">Consultar</span>
                    </Button>
                  </div>
                </div>
              </form>
              <p className="mt-3 text-center text-xs text-muted-foreground">
                Búsquedas ilimitadas. Sin registro requerido.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-card/50">
        <div className="mx-auto grid max-w-7xl grid-cols-2 divide-x divide-border md:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="px-6 py-8 md:px-8 md:py-12">
              <div className="text-2xl font-bold tracking-tight text-foreground md:text-3xl">
                {stat.value}
              </div>
              <div className="mt-1 text-sm font-medium text-foreground">
                {stat.label}
              </div>
              <div className="text-xs text-muted-foreground">
                {stat.sublabel}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="mb-16 max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
              Todo lo que necesitas para proteger tu negocio
            </h2>
            <p className="mt-4 text-lg text-muted-foreground">
              Herramientas diseñadas por y para comerciantes colombianos.
            </p>
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`group relative overflow-hidden rounded-2xl border p-8 transition-all hover:bg-surface-elevated ${
                  feature.highlight
                    ? "border-violet-500/40 bg-violet-500/5 hover:border-violet-500/60"
                    : "border-border bg-card hover:border-accent/40"
                }`}
              >
                {feature.highlight && (
                  <div className="absolute -right-12 -top-12 h-32 w-32 rounded-full bg-violet-500/20 blur-2xl" />
                )}
                <div className={`mb-6 flex h-12 w-12 items-center justify-center rounded-xl transition-colors ${
                  feature.highlight
                    ? "bg-violet-500/10 text-violet-400 group-hover:bg-violet-500 group-hover:text-white"
                    : "bg-secondary text-accent group-hover:bg-accent group-hover:text-background"
                }`}>
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="mt-2 text-muted-foreground">
                  {feature.description}
                </p>
                <div className="mt-6">
                  <Link
                    href={feature.href}
                    className={`inline-flex items-center text-sm font-medium transition-colors hover:opacity-80 ${
                      feature.highlight ? "text-violet-400" : "text-accent"
                    }`}
                  >
                    {feature.cta}
                    <ArrowRightIcon className="ml-1 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Cards */}
      <section className="border-t border-border py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-6 md:grid-cols-2">
            {/* Report Card */}
            <Link
              href="/reportar"
              className="group relative overflow-hidden rounded-3xl border border-destructive/30 bg-card p-8 transition-all hover:border-destructive/50 md:p-12"
            >
              <div className="absolute -right-20 -top-20 h-60 w-60 rounded-full bg-destructive/10 blur-3xl transition-all group-hover:bg-destructive/20" />
              <div className="relative">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-destructive/10 text-destructive transition-colors group-hover:bg-destructive group-hover:text-destructive-foreground">
                  <AlertIcon className="h-8 w-8" />
                </div>
                <h3 className="text-2xl font-bold text-foreground md:text-3xl">
                  Reportar un caso
                </h3>
                <p className="mt-3 max-w-md text-muted-foreground">
                  ¿Recibiste un comprobante falso? Regístralo y ayuda a
                  proteger a otros comerciantes de caer en la misma estafa.
                </p>
                <div className="mt-8 inline-flex items-center gap-2 text-sm font-medium text-destructive">
                  Reportar ahora
                  <ArrowRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                </div>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Trust Section */}
      <section className="border-t border-border bg-card/50 py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-6">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <ShieldIcon className="h-5 w-5 text-accent" />
              <span>Verificación comunitaria</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <DocumentIcon className="h-5 w-5 text-accent" />
              <span>Datos protegidos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <UsersIcon className="h-5 w-5 text-accent" />
              <span>+5,000 comerciantes activos</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-accent text-[10px] font-bold text-background">
                $0
              </span>
              <span>100% gratuito</span>
            </div>
          </div>
        </div>
      </section>

      {/* Pro Section */}
      <section className="border-t border-border py-20 md:py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="relative overflow-hidden rounded-3xl border border-accent/20 bg-gradient-to-br from-card to-secondary p-8 md:p-16">
            <div className="absolute -right-32 -top-32 h-96 w-96 rounded-full bg-accent/5 blur-3xl" />
            <div className="relative mx-auto max-w-2xl text-center">
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-accent/30 bg-accent/10 px-4 py-1.5 text-sm font-medium text-accent">
                Próximamente
              </div>
              <h2 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
                AntiFraude Pro para negocios
              </h2>
              <p className="mt-4 text-lg text-muted-foreground">
                API de verificación en tiempo real, alertas automáticas,
                integraciones con tu punto de venta y mucho más.
              </p>
              <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
                <Button
                  size="lg"
                  className="w-full bg-foreground text-background hover:bg-foreground/90 sm:w-auto"
                >
                  Unirse a la lista de espera
                </Button>
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full border-border sm:w-auto"
                >
                  Ver características
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
