import sharp from 'sharp';

export interface ForensicSignal {
  name: string;
  score: number;
  detail: string;
}

export interface ForensicAnalysisResult {
  score: number;
  signals: ForensicSignal[];
  summary: string;
}

interface GrayImage {
  width: number;
  height: number;
  data: Uint8Array;
}

const TARGET_SIZE = 256;

export async function analyzeImageForensics(
  imageBuffer: Buffer,
): Promise<ForensicAnalysisResult | null> {
  try {
    const normalized = await toGrayscale(imageBuffer);
    const recompressed = await toGrayscale(
      await sharp(imageBuffer).jpeg({ quality: 82, mozjpeg: true }).toBuffer(),
    );

    const recompressionDiff = calculateMeanAbsoluteDifference(normalized.data, recompressed.data);
    const blockVarianceSpread = calculateBlockVarianceSpread(normalized);
    const edgeNoiseMismatch = calculateEdgeNoiseMismatch(normalized);

    const signals: ForensicSignal[] = [
      {
        name: 'recompression-diff',
        score: normalizeClamped(recompressionDiff / 24),
        detail: `Diferencia media tras recompresión: ${recompressionDiff.toFixed(2)}`,
      },
      {
        name: 'block-variance-spread',
        score: normalizeClamped(blockVarianceSpread / 65),
        detail: `Dispersión de varianza por bloques: ${blockVarianceSpread.toFixed(2)}`,
      },
      {
        name: 'edge-noise-mismatch',
        score: normalizeClamped(edgeNoiseMismatch / 48),
        detail: `Desajuste entre bordes y ruido local: ${edgeNoiseMismatch.toFixed(2)}`,
      },
    ];

    const recompressionSignal = signals[0] ?? { score: 0 };
    const blockSignal = signals[1] ?? { score: 0 };
    const edgeSignal = signals[2] ?? { score: 0 };
    const weightedScore =
      recompressionSignal.score * 0.45 + blockSignal.score * 0.25 + edgeSignal.score * 0.3;

    return {
      score: Math.round(weightedScore * 100),
      signals,
      summary: buildSummary(weightedScore, signals),
    };
  } catch {
    return null;
  }
}

async function toGrayscale(imageBuffer: Buffer): Promise<GrayImage> {
  const { data, info } = await sharp(imageBuffer)
    .rotate()
    .resize(TARGET_SIZE, TARGET_SIZE, {
      fit: 'inside',
      withoutEnlargement: true,
    })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  return {
    width: info.width,
    height: info.height,
    data,
  };
}

function calculateMeanAbsoluteDifference(a: Uint8Array, b: Uint8Array): number {
  const length = Math.min(a.length, b.length);
  let total = 0;
  for (let i = 0; i < length; i += 1) {
    total += Math.abs(readPixel(a, i) - readPixel(b, i));
  }
  return length > 0 ? total / length : 0;
}

function calculateBlockVarianceSpread(image: GrayImage): number {
  const blockSize = 16;
  const variances: number[] = [];

  for (let top = 0; top + blockSize <= image.height; top += blockSize) {
    for (let left = 0; left + blockSize <= image.width; left += blockSize) {
      variances.push(calculateBlockVariance(image, left, top, blockSize));
    }
  }

  if (variances.length === 0) {
    return 0;
  }

  const mean = variances.reduce((sum, value) => sum + value, 0) / variances.length;
  const variance =
    variances.reduce((sum, value) => sum + (value - mean) ** 2, 0) / variances.length;

  return Math.sqrt(variance);
}

function calculateBlockVariance(
  image: GrayImage,
  left: number,
  top: number,
  blockSize: number,
): number {
  let sum = 0;
  let sumSquares = 0;
  let count = 0;

  for (let y = top; y < top + blockSize; y += 1) {
    for (let x = left; x < left + blockSize; x += 1) {
      const value = image.data[y * image.width + x];
      const safeValue = value ?? 0;
      sum += safeValue;
      sumSquares += safeValue * safeValue;
      count += 1;
    }
  }

  if (count === 0) {
    return 0;
  }

  const mean = sum / count;
  return sumSquares / count - mean * mean;
}

function calculateEdgeNoiseMismatch(image: GrayImage): number {
  const gradients: number[] = [];
  const residuals: number[] = [];

  for (let y = 1; y < image.height - 1; y += 1) {
    for (let x = 1; x < image.width - 1; x += 1) {
      const idx = y * image.width + x;
      const center = readPixel(image.data, idx);
      const gx = readPixel(image.data, idx + 1) - readPixel(image.data, idx - 1);
      const gy =
        readPixel(image.data, idx + image.width) - readPixel(image.data, idx - image.width);
      const gradient = Math.sqrt(gx * gx + gy * gy);

      const neighborhoodAverage =
        (readPixel(image.data, idx - image.width - 1) +
          readPixel(image.data, idx - image.width) +
          readPixel(image.data, idx - image.width + 1) +
          readPixel(image.data, idx - 1) +
          readPixel(image.data, idx + 1) +
          readPixel(image.data, idx + image.width - 1) +
          readPixel(image.data, idx + image.width) +
          readPixel(image.data, idx + image.width + 1)) /
        8;

      gradients.push(gradient);
      residuals.push(Math.abs(center - neighborhoodAverage));
    }
  }

  if (gradients.length === 0) {
    return 0;
  }

  const threshold = percentile(gradients, 0.85);
  let edgeResidual = 0;
  let edgeCount = 0;
  let flatResidual = 0;
  let flatCount = 0;

  for (let i = 0; i < gradients.length; i += 1) {
    const gradient = gradients[i] ?? 0;
    const residual = residuals[i] ?? 0;

    if (gradient >= threshold) {
      edgeResidual += residual;
      edgeCount += 1;
    } else {
      flatResidual += residual;
      flatCount += 1;
    }
  }

  const edgeMean = edgeCount > 0 ? edgeResidual / edgeCount : 0;
  const flatMean = flatCount > 0 ? flatResidual / flatCount : 0;
  return Math.abs(edgeMean - flatMean);
}

function percentile(values: number[], quantile: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.max(0, Math.floor(sorted.length * quantile)));
  return sorted[index] ?? 0;
}

function normalizeClamped(value: number): number {
  return Math.min(1, Math.max(0, value));
}

function buildSummary(weightedScore: number, signals: ForensicSignal[]): string {
  const strongestSignal = [...signals].sort((a, b) => b.score - a.score)[0];
  const strongestSignalName = strongestSignal?.name ?? 'la señal dominante';

  if (weightedScore >= 0.7) {
    return `Las métricas forenses muestran alta anomalía, liderada por ${strongestSignalName}.`;
  }

  if (weightedScore >= 0.5) {
    return `Las métricas forenses muestran anomalías moderadas, principalmente en ${strongestSignalName}.`;
  }

  return 'Las métricas forenses no muestran anomalías fuertes a nivel de compresión, bloques y bordes.';
}

function readPixel(data: Uint8Array, index: number): number {
  return data[index] ?? 0;
}
