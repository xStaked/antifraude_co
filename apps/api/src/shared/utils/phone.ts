import { BadRequestException } from '@nestjs/common';

export function normalizeColombianPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');

  // +57XXXXXXXXXX (12 dígitos numéricos sin el +)
  if (digits.length === 12 && digits.startsWith('57')) {
    const mobile = digits.slice(2);
    if (!mobile.startsWith('3') || mobile.length !== 10) {
      throw new BadRequestException('Número colombiano no válido.');
    }
    return `+${digits}`;
  }

  // 57XXXXXXXXXX (11 dígitos numéricos, sin el +)
  if (digits.length === 11 && digits.startsWith('57')) {
    const mobile = digits.slice(2);
    if (!mobile.startsWith('3') || mobile.length !== 9) {
      throw new BadRequestException('Número colombiano no válido.');
    }
    return `+${digits}`;
  }

  // XXXXXXXXXX (10 dígitos nacionales)
  if (digits.length === 10 && digits.startsWith('3')) {
    return `+57${digits}`;
  }

  throw new BadRequestException(
    'Número colombiano no válido. Usa un formato como 3102345678 o +573102345678.',
  );
}

export function maskColombianPhone(normalized: string): string {
  // +573102345678 -> +57 310***678
  const country = normalized.slice(0, 3);
  const prefix = normalized.slice(3, 6);
  const suffix = normalized.slice(-3);
  return `${country} ${prefix}***${suffix}`;
}
