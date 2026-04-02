'use client';

import { useState, useRef } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import dynamic from 'next/dynamic';
import { api } from '@/lib/api';

const MAX_FILE_SIZE = 2 * 1024 * 1024; // 2 MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png'];

const evidenceItemSchema = z.object({
  fileName: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(100),
  checksum: z.string().length(64),
});

const reportSchema = z.object({
  phone: z.string().min(10, 'Mínimo 10 caracteres').max(20, 'Máximo 20 caracteres'),
  reportedName: z.string().max(100, 'Máximo 100 caracteres').optional(),
  amount: z.coerce.number().min(0).max(1_000_000_000).optional(),
  incidentDate: z.string().min(1, 'Selecciona una fecha'),
  fraudType: z.enum(['fake_voucher', 'not_reflected', 'attempt']),
  channel: z.enum(['whatsapp', 'facebook_marketplace', 'instagram', 'other']),
  description: z.string().min(10, 'Mínimo 10 caracteres').max(500, 'Máximo 500 caracteres'),
  evidence: z.array(evidenceItemSchema).max(2, 'Máximo 2 archivos').optional(),
  captchaToken: z.string().min(1, 'Completa el captcha'),
});

type ReportForm = z.infer<typeof reportSchema>;

type FilePreview = {
  file: File;
  previewUrl: string;
  checksum: string;
};

const fraudTypeLabels: Record<string, string> = {
  fake_voucher: 'Comprobante falso',
  not_reflected: 'Dinero no reflejado',
  attempt: 'Intento de estafa',
};

const channelLabels: Record<string, string> = {
  whatsapp: 'WhatsApp',
  facebook_marketplace: 'Facebook Marketplace',
  instagram: 'Instagram',
  other: 'Otro',
};

async function sha256File(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest('SHA-256', buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

const Turnstile = dynamic(
  () => import('@marsidev/react-turnstile').then((mod) => mod.Turnstile),
  { ssr: false }
);

// Icons
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

function ExclamationIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
    </svg>
  );
}

function CameraIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0zM18.75 10.5h.008v.008h-.008V10.5z" />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0V1.917A1.917 1.917 0 0011.25 0h-1.5A1.917 1.917 0 008.25 1.917v.833m7.5 0a48.668 48.668 0 00-7.5 0" />
    </svg>
  );
}

export default function ReportarPage() {
  const [files, setFiles] = useState<FilePreview[]>([]);
  const [fileError, setFileError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ reportId: string; status: string; message: string } | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const turnstileRef = useRef<any>(null);

  const {
    register,
    handleSubmit,
    setValue,
    reset,
    setError,
    clearErrors,
    formState: { errors },
  } = useForm<ReportForm>({
    defaultValues: {
      phone: '',
      reportedName: '',
      amount: undefined as any,
      incidentDate: '',
      fraudType: undefined as any,
      channel: undefined as any,
      description: '',
      evidence: [],
      captchaToken: '',
    },
  });

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    setFileError(null);
    const selected = Array.from(e.target.files || []);
    if (selected.length + files.length > 2) {
      setFileError('Máximo 2 archivos permitidos.');
      return;
    }

    const newFiles: FilePreview[] = [];
    for (const file of selected) {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setFileError('Solo se permiten imágenes JPEG o PNG.');
        return;
      }
      if (file.size > MAX_FILE_SIZE) {
        setFileError('Cada archivo debe ser menor a 2 MB.');
        return;
      }
      const checksum = await sha256File(file);
      newFiles.push({
        file,
        previewUrl: URL.createObjectURL(file),
        checksum,
      });
    }

    const updated = [...files, ...newFiles];
    setFiles(updated);
    setValue(
      'evidence',
      updated.map((f) => ({
        fileName: f.file.name,
        mimeType: f.file.type,
        checksum: f.checksum,
      })),
      { shouldValidate: true },
    );
  }

  function removeFile(index: number) {
    const updated = files.filter((_, i) => i !== index);
    setFiles(updated);
    setValue(
      'evidence',
      updated.map((f) => ({
        fileName: f.file.name,
        mimeType: f.file.type,
        checksum: f.checksum,
      })),
      { shouldValidate: true },
    );
  }

  async function onSubmit(raw: ReportForm) {
    clearErrors();
    setSubmitError(null);

    const parsed = reportSchema.safeParse(raw);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as keyof ReportForm;
        setError(path, { message: issue.message });
      });
      return;
    }

    const data = parsed.data;
    setSubmitting(true);
    setSuccess(null);

    try {
      // 1. Upload files to S3 if any
      if (files.length > 0) {
        for (const f of files) {
          const presigned = await api<{ uploadUrl: string; publicUrl: string; key: string }>(
            '/reports/presigned-url',
            {
              method: 'POST',
              body: JSON.stringify({
                fileName: f.file.name,
                mimeType: f.file.type,
                size: f.file.size,
              }),
            },
          );

          const uploadRes = await fetch(presigned.uploadUrl, {
            method: 'PUT',
            headers: {
              'Content-Type': f.file.type,
            },
            body: f.file,
          });

          if (!uploadRes.ok) {
            throw new Error(`Error subiendo archivo ${f.file.name}`);
          }
        }
      }

      // 2. Submit report
      const payload = {
        phone: data.phone,
        reportedName: data.reportedName || undefined,
        amount: data.amount,
        incidentDate: data.incidentDate,
        fraudType: data.fraudType,
        channel: data.channel,
        description: data.description,
        evidence: data.evidence,
        captchaToken: data.captchaToken,
      };

      const result = await api<{ reportId: string; status: string; message: string }>('/reports', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      setSuccess(result);
      reset();
      setFiles([]);
      turnstileRef.current?.reset();
      setValue('captchaToken', '');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Error desconocido');
      turnstileRef.current?.reset();
      setValue('captchaToken', '');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="relative min-h-screen">
      {/* Background accents */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-24 -left-24 h-96 w-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-0 right-0 h-80 w-80 rounded-full bg-cta/10 blur-3xl" />
      </div>

      <main className="relative z-10 mx-auto max-w-3xl px-6 py-10 md:py-16">
        <Link
          href="/"
          className="inline-flex items-center gap-1 text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeftIcon className="h-4 w-4" />
          Volver al inicio
        </Link>

        <h1 className="mt-4 text-3xl font-bold tracking-tight md:text-4xl">Reportar caso</h1>
        <p className="mt-2 text-muted">
          Ayuda a proteger a otros compartiendo tu experiencia. Toda la información es revisada antes de publicarse.
        </p>

        <div className="mt-8 rounded-2xl border border-border bg-surface p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-6">
            {/* Section: Victim info */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Información del caso</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label htmlFor="phone" className="block text-sm font-medium text-foreground">
                    Número del estafador <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="phone"
                    type="tel"
                    {...register('phone')}
                    placeholder="310 234 5678"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {errors.phone && <p className="mt-1.5 text-sm text-red-400">{errors.phone.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="reportedName" className="block text-sm font-medium text-foreground">
                    Nombre del estafador <span className="text-muted">(opcional)</span>
                  </label>
                  <input
                    id="reportedName"
                    type="text"
                    {...register('reportedName')}
                    placeholder="Como aparece en la conversación"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {errors.reportedName && <p className="mt-1.5 text-sm text-red-400">{errors.reportedName.message}</p>}
                </div>

                <div>
                  <label htmlFor="amount" className="block text-sm font-medium text-foreground">
                    Monto <span className="text-muted">(COP, opcional)</span>
                  </label>
                  <input
                    id="amount"
                    type="number"
                    {...register('amount')}
                    placeholder="150000"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {errors.amount && <p className="mt-1.5 text-sm text-red-400">{errors.amount.message}</p>}
                </div>

                <div>
                  <label htmlFor="incidentDate" className="block text-sm font-medium text-foreground">
                    Fecha del incidente <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="incidentDate"
                    type="date"
                    {...register('incidentDate')}
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {errors.incidentDate && <p className="mt-1.5 text-sm text-red-400">{errors.incidentDate.message}</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Section: Fraud details */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Detalles del fraude</h2>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <div>
                  <label htmlFor="fraudType" className="block text-sm font-medium text-foreground">
                    Tipo de fraude <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="fraudType"
                      {...register('fraudType')}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Selecciona...</option>
                      <option value="fake_voucher">{fraudTypeLabels.fake_voucher}</option>
                      <option value="not_reflected">{fraudTypeLabels.not_reflected}</option>
                      <option value="attempt">{fraudTypeLabels.attempt}</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  {errors.fraudType && <p className="mt-1.5 text-sm text-red-400">{errors.fraudType.message}</p>}
                </div>

                <div>
                  <label htmlFor="channel" className="block text-sm font-medium text-foreground">
                    Canal <span className="text-red-400">*</span>
                  </label>
                  <div className="relative mt-2">
                    <select
                      id="channel"
                      {...register('channel')}
                      className="w-full appearance-none rounded-xl border border-border bg-background px-4 py-3 pr-10 text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                    >
                      <option value="">Selecciona...</option>
                      <option value="whatsapp">{channelLabels.whatsapp}</option>
                      <option value="facebook_marketplace">{channelLabels.facebook_marketplace}</option>
                      <option value="instagram">{channelLabels.instagram}</option>
                      <option value="other">{channelLabels.other}</option>
                    </select>
                    <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                        <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
                      </svg>
                    </span>
                  </div>
                  {errors.channel && <p className="mt-1.5 text-sm text-red-400">{errors.channel.message}</p>}
                </div>

                <div className="sm:col-span-2">
                  <label htmlFor="description" className="block text-sm font-medium text-foreground">
                    Descripción <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    id="description"
                    {...register('description')}
                    rows={4}
                    placeholder="Describe lo que pasó con el mayor detalle posible"
                    className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground placeholder:text-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/50"
                  />
                  {errors.description && <p className="mt-1.5 text-sm text-red-400">{errors.description.message}</p>}
                </div>
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Section: Evidence */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Evidencias</h2>
              <label htmlFor="evidence" className="block text-sm font-medium text-foreground">
                Imágenes <span className="text-muted">(máx. 2 imágenes, 2 MB c/u)</span>
              </label>
              <div className="mt-2">
                <label
                  htmlFor="evidence"
                  className={`flex cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-background px-4 py-6 text-sm text-muted transition-colors hover:border-primary/40 hover:bg-surface-elevated ${files.length >= 2 ? 'opacity-50 cursor-not-allowed' : ''}`}
                >
                  <CameraIcon className="h-5 w-5" />
                  {files.length >= 2 ? 'Máximo de archivos alcanzado' : 'Haz clic para subir imágenes'}
                </label>
                <input
                  id="evidence"
                  type="file"
                  accept="image/jpeg,image/png"
                  multiple
                  onChange={handleFileChange}
                  disabled={files.length >= 2}
                  className="sr-only"
                />
                {fileError && <p className="mt-2 text-sm text-red-400">{fileError}</p>}
                {errors.evidence && <p className="mt-2 text-sm text-red-400">{errors.evidence.message}</p>}

                {files.length > 0 && (
                  <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-3">
                    {files.map((f, idx) => (
                      <div key={idx} className="group relative overflow-hidden rounded-xl border border-border bg-background">
                        <img src={f.previewUrl} alt={`Evidencia ${idx + 1}`} className="h-28 w-full object-cover" />
                        <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-black/70 to-transparent p-3 opacity-0 transition-opacity group-hover:opacity-100">
                          <p className="max-w-[70%] truncate text-xs text-white">{f.file.name}</p>
                          <button
                            type="button"
                            onClick={() => removeFile(idx)}
                            className="flex h-8 w-8 items-center justify-center rounded-lg bg-red-600 text-white transition-colors hover:bg-red-700"
                            aria-label="Eliminar imagen"
                          >
                            <TrashIcon className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="h-px bg-border" />

            {/* Captcha */}
            <div>
              <h2 className="mb-3 text-sm font-semibold uppercase tracking-wider text-muted">Verificación</h2>
              <Turnstile
                ref={turnstileRef}
                siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''}
                onSuccess={(token) => setValue('captchaToken', token, { shouldValidate: true })}
                onError={() => setValue('captchaToken', '', { shouldValidate: true })}
                onExpire={() => setValue('captchaToken', '', { shouldValidate: true })}
              />
              {errors.captchaToken && <p className="mt-2 text-sm text-red-400">{errors.captchaToken.message}</p>}
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3.5 font-semibold text-white shadow-glow transition-all hover:bg-primary-hover hover:shadow-glow-lg disabled:opacity-50 focus-ring"
            >
              {submitting ? (
                <>
                  <Spinner className="h-5 w-5 animate-spin" />
                  Enviando reporte...
                </>
              ) : (
                'Enviar reporte'
              )}
            </button>
          </form>
        </div>

        {submitError && (
          <div className="mt-6 animate-fade-in rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-red-300">
            <div className="flex items-start gap-3">
              <ExclamationIcon className="h-5 w-5 shrink-0 text-red-400" />
              <p>{submitError}</p>
            </div>
          </div>
        )}

        {success && (
          <div className="mt-6 animate-slide-up rounded-2xl border border-green-500/20 bg-green-500/10 p-6 text-center text-green-100">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-green-500/20 text-green-400">
              <CheckCircleIcon className="h-7 w-7" />
            </div>
            <p className="mt-4 text-lg font-semibold">{success.message}</p>
            <div className="mt-2 inline-flex flex-col gap-1 text-sm text-green-200 sm:flex-row sm:gap-4">
              <span>ID del reporte: <span className="font-medium">{success.reportId}</span></span>
              <span className="hidden sm:inline">·</span>
              <span>Estado: <span className="font-medium">{success.status}</span></span>
            </div>
            <div className="mt-5">
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-xl bg-green-600 px-5 py-2.5 font-medium text-white transition-colors hover:bg-green-700"
              >
                Volver al inicio
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
