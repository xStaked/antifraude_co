import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { google } from '@ai-sdk/google';
import { generateText, Output } from 'ai';
import { z } from 'zod';
import { AnalysisResult } from './ai-detector.dto';
import { analyzeImageForensics, ForensicAnalysisResult } from './forensic-image-analyzer';

const analysisResultSchema = z.object({
  isEdited: z.boolean(),
  confidence: z.number(),
  analysis: z.string(),
  redFlags: z.array(z.string()),
  recommendation: z.string(),
});
type AnalysisModelOutput = z.infer<typeof analysisResultSchema>;

export const GOOGLE_VISION_MODEL_CANDIDATES = [
  'gemini-2.5-flash',
  'gemini-2.5-flash-lite',
  'gemini-2.0-flash',
  'gemini-2.0-flash-lite',
  'gemini-1.5-flash',
  'gemini-1.5-pro',
] as const;

@Injectable()
export class AiDetectorService {
  private readonly logger = new Logger(AiDetectorService.name);
  private readonly apiKey: string;
  private readonly appTimezone: string;

  constructor(private readonly config: ConfigService) {
    this.apiKey = this.config.get<string>('googleApiKey') ?? '';
    this.appTimezone = this.config.get<string>('appTimezone') ?? 'America/Bogota';
    if (!this.apiKey) {
      this.logger.error('GOOGLE_API_KEY no está configurada. El servicio de detección de IA no funcionará.');
    } else {
      this.logger.log('GOOGLE_API_KEY configurada correctamente');
    }
  }

  async analyzeImage(
    imageUrl?: string,
    mimeType?: string,
    base64Image?: string,
  ): Promise<AnalysisResult> {
    try {
      if (!base64Image && !imageUrl) {
        throw new Error('Debes enviar base64Image o imageUrl para analizar la imagen.');
      }

      let imageData: string;
      let imageBuffer: Buffer;
      let detectedMimeType: string;

      if (base64Image) {
        imageData = this.normalizeBase64(base64Image);
        imageBuffer = Buffer.from(imageData, 'base64');
        detectedMimeType = mimeType || 'image/jpeg';
      } else {
        const imageResponse = await fetch(imageUrl as string);
        if (!imageResponse.ok) {
          throw new Error(`No se pudo descargar la imagen: ${imageResponse.statusText}`);
        }

        imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
        imageData = imageBuffer.toString('base64');
        detectedMimeType = mimeType || this.detectMimeType(imageUrl as string) || 'image/jpeg';
      }

      const todayContext = this.getTodayContext();
      const forensicAnalysis = await analyzeImageForensics(imageBuffer);
      const forensicContext = forensicAnalysis
        ? this.buildForensicPromptContext(forensicAnalysis)
        : 'No se pudieron calcular métricas forenses numéricas para esta imagen.';
      const prompt = `Analiza esta imagen de un comprobante de pago/transferencia bancaria y determina si ha sido editada o manipulada con inteligencia artificial o herramientas de edición.

Fecha de referencia del backend: ${todayContext.isoDate}
Fecha local del backend: ${todayContext.spanishDate}
Zona horaria de referencia: ${this.appTimezone}
Contexto forense numérico:
${forensicContext}

Por favor, analiza:
1. **Inconsistencias visuales**: fuentes, colores, alineaciones, sombras, bordes
2. **Artefactos de edición**: áreas borrosas, píxeles inconsistentes, bordes recortados
3. **Metadatos y formato**: firmas digitales, códigos QR/barras, estructura del documento
4. **Anomalías de IA**: patrones repetitivos, textura artificial, inconsistencias de iluminación
5. **Consistencia temporal**: compara cualquier fecha visible en la imagen contra la fecha de referencia del backend

Marca "isEdited" en true si detectas señales plausibles de manipulación. Si no encuentras evidencia suficiente, responde false.
La "confidence" debe ser un porcentaje entre 0 y 100.
Las "redFlags" deben ser concretas y breves.

Reglas temporales obligatorias:
- Usa exclusivamente la fecha de referencia del backend para decidir si una fecha es pasada, actual o futura.
- Si la fecha visible en la imagen es exactamente igual a ${todayContext.isoDate}, NO la describas como futura.
- Solo considera "fecha futura" si la fecha visible es estrictamente posterior a ${todayContext.isoDate}.
- Si la imagen usa formato largo en español, por ejemplo "02 de abril de 2026", interprétala correctamente antes de compararla.
- Si no puedes leer la fecha con claridad, dilo explícitamente y no inventes una inconsistencia temporal.
- No uses conocimiento implícito del modelo sobre la fecha actual; usa únicamente la referencia temporal anterior.

Reglas de calibración obligatorias:
- Un comprobante real capturado desde una app móvil puede verse extremadamente limpio, con texto nítido, bordes duros, colores uniformes y compresión normal. Eso NO es evidencia de manipulación.
- No marques "isEdited" en true por una sola anomalía débil o ambigua.
- Para marcar "isEdited" en true debes encontrar al menos dos evidencias independientes y concretas, o una inconsistencia lógica fuerte y verificable.
- Si solo hay sospechas leves, dudas subjetivas o artefactos normales de captura de pantalla, responde "isEdited": false.
- Si la evidencia es insuficiente, mantén la confidence en 45 o menos.`;

      let lastError: Error | null = null;
      for (const modelId of GOOGLE_VISION_MODEL_CANDIDATES) {
        for (let attempt = 1; attempt <= 2; attempt += 1) {
          try {
            this.logger.log(`Intentando con modelo: ${modelId} (intento ${attempt})`);

            const { output } = await generateText({
              model: google(modelId),
              temperature: 0.1,
              output: Output.object({
                schema: analysisResultSchema,
              }),
              messages: [
                {
                  role: 'user',
                  content: [
                    {
                      type: 'text',
                      text: prompt,
                    },
                    {
                      type: 'image',
                      image: imageData,
                      mimeType: detectedMimeType,
                    },
                  ],
                },
              ],
            });
            const parsedOutput = output as AnalysisModelOutput;

            this.logger.log(`Análisis exitoso con modelo: ${modelId}`);

            const fusedResult = this.fuseAnalysis(parsedOutput, forensicAnalysis);

            return {
              ...fusedResult,
              forensic: forensicAnalysis
                ? {
                    score: forensicAnalysis.score,
                    summary: forensicAnalysis.summary,
                    signals: forensicAnalysis.signals,
                  }
                : undefined,
            };
          } catch (error) {
            const errorMessage = this.getErrorMessage(error);
            this.logger.warn(`Error con modelo ${modelId}: ${errorMessage}`);

            lastError = error instanceof Error ? error : new Error(errorMessage);

            if (!this.isRetryableCapacityError(error) || attempt === 2) {
              break;
            }

            await this.wait(1200 * attempt);
          }
        }
      }

      throw new Error(`Ningún modelo de IA disponible. Último error: ${lastError?.message || 'Desconocido'}`);
    } catch (error) {
      this.logger.error('Error al analizar imagen:', error);
      throw error;
    }
  }

  private detectMimeType(url: string): string | null {
    const extension = url.split('.').pop()?.toLowerCase();
    const mimeTypes: Record<string, string> = {
      jpg: 'image/jpeg',
      jpeg: 'image/jpeg',
      png: 'image/png',
      gif: 'image/gif',
      webp: 'image/webp',
      bmp: 'image/bmp',
    };
    return mimeTypes[extension || ''] || null;
  }

  private normalizeBase64(value: string): string {
    const [, rawBase64] = value.split(',', 2);
    return rawBase64 || value;
  }

  private buildForensicPromptContext(result: ForensicAnalysisResult): string {
    const signalLines = result.signals
      .map((signal) => `- ${signal.name}: ${signal.score.toFixed(2)} (${signal.detail})`)
      .join('\n');

    return `forensicScore=${result.score}/100
summary=${result.summary}
signals:
${signalLines}`;
  }

  private fuseAnalysis(
    modelOutput: AnalysisModelOutput,
    forensicAnalysis: ForensicAnalysisResult | null,
  ): AnalysisResult {
    const modelConfidence = Math.min(100, Math.max(0, Math.round(modelOutput.confidence ?? 0)));
    const forensicScore = forensicAnalysis?.score ?? 0;
    const normalizedFlags = Array.isArray(modelOutput.redFlags)
      ? modelOutput.redFlags.filter(
          (flag: string) => typeof flag === 'string' && flag.trim().length > 0,
        )
      : [];
    const strongForensicSignals =
      forensicAnalysis?.signals.filter((signal) => signal.score >= 0.8).length ?? 0;
    const moderateForensicSignals =
      forensicAnalysis?.signals.filter((signal) => signal.score >= 0.65).length ?? 0;
    const baseSuspicion = Math.round(
      modelConfidence * 0.6 +
        forensicScore * 0.15 +
        moderateForensicSignals * 8 +
        strongForensicSignals * 10,
    );

    const forensicFlags =
      forensicAnalysis && forensicAnalysis.score >= 60
        ? forensicAnalysis.signals
            .filter((signal) => signal.score >= 0.65)
            .map(
              (signal) =>
                `Métrica forense ${signal.name}: ${Math.round(signal.score * 100)}% (${signal.detail})`,
            )
        : [];

    const strongModelSuspicion = modelOutput.isEdited && modelConfidence >= 72;
    const corroboratedSuspicion =
      modelConfidence >= 68 && forensicScore >= 72 && moderateForensicSignals >= 2;
    const extremeForensicSuspicion =
      forensicScore >= 92 && strongForensicSignals >= 2 && modelConfidence >= 55;
    const isEdited =
      strongModelSuspicion || corroboratedSuspicion || extremeForensicSuspicion;
    const confidence = isEdited
      ? Math.min(100, Math.max(baseSuspicion, corroboratedSuspicion ? 78 : 72))
      : Math.min(
          modelOutput.isEdited ? 59 : 45,
          Math.round(modelConfidence * 0.45 + forensicScore * 0.1 + moderateForensicSignals * 4),
        );

    const analysisParts = [
      modelOutput.analysis?.trim() || 'Sin análisis detallado',
      forensicAnalysis
        ? `Análisis forense numérico: ${forensicAnalysis.summary} Puntaje forense: ${forensicAnalysis.score}%.`
        : null,
    ].filter((value): value is string => Boolean(value));

    const recommendation = isEdited
      ? 'No confíes en este comprobante sin validarlo directamente en la app o entidad emisora.'
      : 'No se detectó evidencia suficiente de manipulación. Aun así, valida la transacción en la app oficial antes de entregar.';

    return {
      isEdited,
      confidence,
      analysis: analysisParts.join(' '),
      redFlags: [...new Set([...normalizedFlags, ...forensicFlags])].slice(0, 8),
      recommendation,
    };
  }

  private getTodayContext(): { isoDate: string; spanishDate: string } {
    const now = new Date();
    const formatter = new Intl.DateTimeFormat('en-CA', {
      timeZone: this.appTimezone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
    const parts = formatter.formatToParts(now);
    const year = parts.find((part) => part.type === 'year')?.value ?? '0000';
    const month = parts.find((part) => part.type === 'month')?.value ?? '00';
    const day = parts.find((part) => part.type === 'day')?.value ?? '00';

    return {
      isoDate: `${year}-${month}-${day}`,
      spanishDate: new Intl.DateTimeFormat('es-CO', {
        timeZone: this.appTimezone,
        year: 'numeric',
        month: 'long',
        day: '2-digit',
      }).format(now),
    };
  }

  private getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
      return error.message;
    }

    if (typeof error === 'string') {
      return error;
    }

    return JSON.stringify(error);
  }

  private isRetryableCapacityError(error: unknown): boolean {
    const message = this.getErrorMessage(error).toLowerCase();

    return (
      message.includes('high demand') ||
      message.includes('try again later') ||
      message.includes('overloaded') ||
      message.includes('rate limit') ||
      message.includes('too many requests') ||
      message.includes('status code: 429') ||
      message.includes('status code: 503') ||
      message.includes('status: 429') ||
      message.includes('status: 503')
    );
  }

  private wait(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
