"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";
import { api } from "@/lib/api";

function setCookie(name: string, value: string, hours: number) {
  const expires = new Date(Date.now() + hours * 60 * 60 * 1000).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/; SameSite=Lax`;
}

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

export default function RegistroPage() {
  const router = useRouter();
  const [step, setStep] = useState<"form" | "otp">("form");
  const [phone, setPhone] = useState("");

  const [fullName, setFullName] = useState("");
  const [documentNumber, setDocumentNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [otpCode, setOtpCode] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ userId: string; phone: string; message: string; code?: string }>("/auth/register", {
        method: "POST",
        body: JSON.stringify({ fullName, documentNumber, phone, email, password }),
      });
      setPhone(data.phone);
      if (data.code) {
        setOtpCode(data.code);
      }
      setStep("otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data = await api<{ token: string; user: { id: string; fullName: string; documentNumber: string; phone: string; email: string; phoneVerified: boolean } }>("/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ phone, code: otpCode }),
      });
      setCookie("user_token", data.token, 8);
      localStorage.setItem("user_token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      router.push("/reportar");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error desconocido");
    } finally {
      setLoading(false);
    }
  }

  return (
    <PageLayout>
      <div className="mx-auto max-w-md px-6 py-10 md:py-16">
        <Link href="/" className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>

        <div className="mt-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {step === "form" ? "Crear cuenta" : "Verifica tu teléfono"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step === "form"
              ? "Regístrate para poder reportar casos y consultar números."
              : `Ingresa el código de 6 dígitos enviado a ${phone}`}
          </p>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm">
          {step === "form" ? (
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Nombre completo</label>
                <Input value={fullName} onChange={(e) => setFullName(e.target.value)} required className="mt-2 h-12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Documento (Cédula o NIT)</label>
                <Input value={documentNumber} onChange={(e) => setDocumentNumber(e.target.value)} required className="mt-2 h-12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Teléfono</label>
                <Input value={phone} onChange={(e) => setPhone(e.target.value)} required className="mt-2 h-12" placeholder="310 234 5678" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Correo electrónico</label>
                <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="mt-2 h-12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground">Contraseña</label>
                <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="mt-2 h-12" minLength={8} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="h-12 gap-2 bg-foreground text-background hover:bg-foreground/90">
                {loading ? <><Spinner className="h-5 w-5 animate-spin" /> Registrando...</> : "Registrarme"}
              </Button>
            </form>
          ) : (
            <form onSubmit={handleVerifyOtp} className="flex flex-col gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground">Código OTP</label>
                <Input value={otpCode} onChange={(e) => setOtpCode(e.target.value)} required className="mt-2 h-12" maxLength={6} />
              </div>

              {error && <p className="text-sm text-destructive">{error}</p>}

              <Button type="submit" disabled={loading} className="h-12 gap-2 bg-foreground text-background hover:bg-foreground/90">
                {loading ? <><Spinner className="h-5 w-5 animate-spin" /> Verificando...</> : "Verificar código"}
              </Button>
            </form>
          )}
        </div>

        {step === "form" && (
          <p className="mt-6 text-center text-sm text-muted-foreground">
            ¿Ya tienes cuenta?{" "}
            <Link href="/login" className="font-medium text-foreground hover:underline">
              Inicia sesión
            </Link>
          </p>
        )}
      </div>
    </PageLayout>
  );
}
