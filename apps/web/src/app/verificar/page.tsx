"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { PageLayout } from "@/components/layout";

function ArrowLeftIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
    </svg>
  );
}

function ShieldCheckIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
    </svg>
  );
}

const checklistItems = [
  {
    title: "Origen del mensaje",
    description:
      "Verifica que el número o perfil coincida con el del supuesto comprador/vendedor. Desconfía de cuentas recién creadas.",
  },
  {
    title: "Datos del comprobante",
    description:
      "Revisa que el monto, la fecha, el número de referencia y los últimos dígitos de la cuenta coincidan con la transacción real.",
  },
  {
    title: "Notificaciones oficiales",
    description:
      "No te guíes solo por la imagen. Confirma que el dinero esté en tu cuenta revisando la app de tu banco o Nequi directamente.",
  },
  {
    title: "Señales de edición",
    description:
      "Pixeles borrosos, fuentes inconsistentes, bordes recortados o fechas que no cuadran son señales de alerta.",
  },
  {
    title: "Comportamiento sospechoso",
    description:
      "Si te presionan para enviar el producto rápido, te piden capturas de pantalla o cambian de número constantemente, detente.",
  },
];

export default function VerificarPage() {
  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-6">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2">
            <ShieldCheckIcon className="h-4 w-4 text-emerald-400" />
            <span className="text-sm text-muted-foreground">Guía preventiva</span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Guía de verificación de comprobantes
          </h1>
          <p className="mt-2 text-muted-foreground">
            Antes de entregar un producto o aceptar un pago, revisa estos puntos para evitar comprobantes falsos y estafas.
          </p>
        </div>

        <div className="mt-8 space-y-4">
          {checklistItems.map((item, idx) => (
            <div key={idx} className="rounded-2xl border border-border bg-card p-6 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-400">
                  <CheckIcon className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">{item.title}</h3>
                  <p className="mt-1 text-muted-foreground">{item.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
          <h3 className="text-lg font-semibold text-destructive">¿Detectaste algo sospechoso?</h3>
          <p className="mt-1 text-muted-foreground">Ayuda a la comunidad reportando el número o perfil del estafador.</p>
          <div className="mt-4 flex gap-3">
            <Link href="/reportar" className="flex-1">
              <Button className="h-12 w-full gap-2 bg-destructive text-white hover:bg-destructive/90">Reportar estafa</Button>
            </Link>
            <Link href="/consultar" className="flex-1">
              <Button variant="outline" className="h-12 w-full">Consultar número</Button>
            </Link>
          </div>
        </div>
      </div>
    </PageLayout>
  );
}
