"use client";

import { useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PageLayout } from "@/components/layout";
import { api } from "@/lib/api";

interface AnalysisResult {
  isEdited: boolean;
  confidence: number;
  analysis: string;
  redFlags: string[];
  recommendation: string;
}

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

function ShieldExclamationIcon({ className }: { className?: string }) {
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
        d="M12 9v3.75m0-9.036a11.959 11.959 0 013.598 6.11A11.99 11.99 0 013.598 6.11a11.959 11.959 0 019-3.75zm-9 9.75a11.959 11.959 0 013.598 6.11A11.99 11.99 0 0121 15.75m-9 2.25h.008v.008H12v-.008z"
      />
    </svg>
  );
}

function UploadIcon({ className }: { className?: string }) {
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
        d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5m-13.5-9L12 3m0 0l4.5 4.5M12 3v13.5"
      />
    </svg>
  );
}

function TrashIcon({ className }: { className?: string }) {
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
        d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0V1.917A1.917 1.917 0 0011.25 0h-1.5A1.917 1.917 0 008.25 1.917v.833m7.5 0a48.668 48.668 0 00-7.5 0"
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

function CheckIcon({ className }: { className?: string }) {
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
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  );
}

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

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];

export default function VerificarPage() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [urlInput, setUrlInput] = useState("");
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((selectedFile: File) => {
    setError(null);
    setResult(null);

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      setError("Solo se permiten imágenes (JPEG, PNG, WebP, GIF).");
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE) {
      setError("La imagen debe ser menor a 10 MB.");
      return;
    }

    setFile(selectedFile);
    setPreviewUrl(URL.createObjectURL(selectedFile));
    setUrlInput("");
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = e.target.files?.[0];
    if (selected) handleFile(selected);
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) handleFile(droppedFile);
    },
    [handleFile]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => {
    setDragOver(false);
  };

  const handleUrlSubmit = async () => {
    if (!urlInput.trim()) return;
    setFile(null);
    setPreviewUrl(urlInput);
    setResult(null);
    setError(null);
  };

  const clearFile = () => {
    setFile(null);
    setPreviewUrl(null);
    setResult(null);
    setError(null);
    setUrlInput("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const analyze = async () => {
    if (!previewUrl) return;

    setAnalyzing(true);
    setError(null);
    setResult(null);

    try {
      let requestBody: { imageUrl: string; mimeType?: string; base64Image?: string };
      
      // Si es un archivo local, convertimos a base64
      if (file) {
        const reader = new FileReader();
        const base64Promise = new Promise<string>((resolve) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(file);
        });
        const base64 = await base64Promise;
        
        // Extraer solo el base64 sin el prefijo data:image/...
        const base64Data = base64.split(',')[1];
        
        requestBody = {
          imageUrl: "local", // placeholder, se usará base64Image
          mimeType: file.type,
          base64Image: base64Data,
        };
      } else {
        // Es una URL pública
        requestBody = {
          imageUrl: previewUrl,
        };
      }

      const data = await api<{ success: boolean; data: AnalysisResult }>(
        "/ai-detector/analyze",
        {
          method: "POST",
          body: JSON.stringify(requestBody),
        }
      );
      setResult(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error al analizar la imagen");
    } finally {
      setAnalyzing(false);
    }
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return "text-red-400";
    if (confidence >= 50) return "text-yellow-400";
    return "text-green-400";
  };

  const getConfidenceBg = (confidence: number) => {
    if (confidence >= 80) return "bg-red-500/20";
    if (confidence >= 50) return "bg-yellow-500/20";
    return "bg-green-500/20";
  };

  return (
    <PageLayout>
      <div className="mx-auto max-w-3xl px-6 py-10 md:py-16">
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
            <BrainIcon className="h-4 w-4 text-violet-400" />
            <span className="text-sm text-muted-foreground">
              Detección con IA
            </span>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            Verificar comprobante
          </h1>
          <p className="mt-2 text-muted-foreground">
            Sube una imagen de un comprobante de pago y nuestro sistema de IA
            detectará si ha sido editado o manipulado.
          </p>
        </div>

        {/* Upload Area */}
        <div className="mt-8 rounded-2xl border border-border bg-card p-6 shadow-sm md:p-8">
          {/* File Upload */}
          {!previewUrl && (
            <>
              <div
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onClick={() => fileInputRef.current?.click()}
                className={`cursor-pointer rounded-xl border-2 border-dashed p-8 text-center transition-colors ${
                  dragOver
                    ? "border-violet-500/50 bg-violet-500/5"
                    : "border-border hover:border-accent/40 hover:bg-secondary"
                }`}
              >
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-violet-500/10 text-violet-400">
                  <UploadIcon className="h-7 w-7" />
                </div>
                <p className="mt-4 text-sm font-medium text-foreground">
                  Arrastra una imagen aquí o haz clic para seleccionar
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  JPG, PNG, WebP o GIF · Máx. 10 MB
                </p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/webp,image/gif"
                onChange={handleFileChange}
                className="sr-only"
              />

              {/* URL Input */}
              <div className="mt-6">
                <p className="mb-3 text-center text-sm text-muted-foreground">
                  o ingresa una URL
                </p>
                <div className="flex gap-3">
                  <Input
                    type="url"
                    placeholder="https://ejemplo.com/comprobante.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                    className="h-12"
                  />
                  <Button
                    type="button"
                    onClick={handleUrlSubmit}
                    disabled={!urlInput.trim()}
                    className="h-12 px-6"
                  >
                    Cargar
                  </Button>
                </div>
              </div>
            </>
          )}

          {/* Preview */}
          {previewUrl && (
            <div className="relative">
              <div className="overflow-hidden rounded-xl border border-border">
                <img
                  src={previewUrl}
                  alt="Vista previa"
                  className="max-h-[400px] w-full object-contain"
                />
              </div>
              <button
                onClick={clearFile}
                className="absolute right-3 top-3 flex h-10 w-10 items-center justify-center rounded-lg bg-destructive text-white shadow-lg transition-colors hover:bg-destructive/80"
                aria-label="Eliminar imagen"
              >
                <TrashIcon className="h-5 w-5" />
              </button>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 rounded-xl border border-destructive/20 bg-destructive/10 p-4">
              <div className="flex items-start gap-3">
                <AlertIcon className="h-5 w-5 shrink-0 text-destructive" />
                <p className="text-destructive">{error}</p>
              </div>
            </div>
          )}

          {/* Analyze Button */}
          {previewUrl && !result && (
            <Button
              onClick={analyze}
              disabled={analyzing}
              size="lg"
              className="mt-6 h-12 w-full gap-2 bg-violet-600 text-white hover:bg-violet-700"
            >
              {analyzing ? (
                <>
                  <Spinner className="h-5 w-5 animate-spin" />
                  Analizando con IA...
                </>
              ) : (
                <>
                  <BrainIcon className="h-5 w-5" />
                  Analizar comprobante
                </>
              )}
            </Button>
          )}
        </div>

        {/* Results */}
        {result && (
          <div className="mt-6 space-y-6">
            {/* Verdict */}
            <div
              className={`rounded-2xl border p-6 ${
                result.isEdited
                  ? "border-red-500/20 bg-red-500/10"
                  : "border-green-500/20 bg-green-500/10"
              }`}
            >
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full ${
                    result.isEdited
                      ? "bg-red-500/20 text-red-400"
                      : "bg-green-500/20 text-green-400"
                  }`}
                >
                  {result.isEdited ? (
                    <ShieldExclamationIcon className="h-7 w-7" />
                  ) : (
                    <ShieldCheckIcon className="h-7 w-7" />
                  )}
                </div>
                <div className="flex-1">
                  <h2
                    className={`text-xl font-bold ${
                      result.isEdited ? "text-red-100" : "text-green-100"
                    }`}
                  >
                    {result.isEdited
                      ? "⚠️ Comprobante sospechoso"
                      : "✅ Comprobante verificado"}
                  </h2>
                  <p
                    className={`mt-1 ${
                      result.isEdited ? "text-red-200" : "text-green-200"
                    }`}
                  >
                    {result.recommendation}
                  </p>
                </div>
              </div>

              {/* Confidence Bar */}
              <div className="mt-6">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">
                    Confianza del análisis
                  </span>
                  <span
                    className={`text-lg font-bold ${getConfidenceColor(
                      result.confidence
                    )}`}
                  >
                    {result.confidence}%
                  </span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-background">
                  <div
                    className={`h-full rounded-full transition-all duration-1000 ${
                      result.isEdited ? "bg-red-500" : "bg-green-500"
                    }`}
                    style={{ width: `${result.confidence}%` }}
                  />
                </div>
              </div>
            </div>

            {/* Analysis Details */}
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="text-lg font-semibold text-foreground">
                Análisis detallado
              </h3>
              <p className="mt-2 text-muted-foreground">{result.analysis}</p>
            </div>

            {/* Red Flags */}
            {result.redFlags.length > 0 && (
              <div className="rounded-2xl border border-destructive/20 bg-destructive/5 p-6">
                <h3 className="flex items-center gap-2 text-lg font-semibold text-destructive">
                  <AlertIcon className="h-5 w-5" />
                  Señales de alerta detectadas
                </h3>
                <ul className="mt-4 space-y-2">
                  {result.redFlags.map((flag, idx) => (
                    <li
                      key={idx}
                      className="flex items-start gap-3 rounded-lg bg-background/50 p-3"
                    >
                      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-destructive/20 text-xs text-destructive">
                        {idx + 1}
                      </span>
                      <span className="text-foreground">{flag}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                onClick={clearFile}
                variant="outline"
                className="h-12 flex-1"
              >
                Analizar otra imagen
              </Button>
              {result.isEdited && (
                <Link href="/reportar" className="flex-1">
                  <Button className="h-12 w-full gap-2 bg-destructive text-white hover:bg-destructive/90">
                    <AlertIcon className="h-5 w-5" />
                    Reportar estafa
                  </Button>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </PageLayout>
  );
}
