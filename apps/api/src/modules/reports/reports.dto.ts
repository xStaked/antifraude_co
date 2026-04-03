import {
  IsString,
  IsOptional,
  IsEnum,
  IsDateString,
  IsInt,
  Min,
  Max,
  IsArray,
  ValidateNested,
  Length,
  MaxLength,
  MinLength,
  ArrayMaxSize,
} from 'class-validator';
import { Type } from 'class-transformer';
import { FraudType, Channel } from '@sn8/database';

export class EvidenceItemDto {
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @IsString()
  @Length(1, 100)
  mimeType!: string;

  @IsString()
  @Length(64, 64)
  checksum!: string;

  @IsString()
  @Length(1, 2048)
  fileUrl!: string;

  @IsInt()
  @Min(1)
  @Max(2_097_152) // 2 MB
  @Type(() => Number)
  fileSize!: number;
}

class ReporterDto {
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  businessName!: string;

  @IsString()
  @MinLength(6)
  @MaxLength(20)
  documentId!: string;

  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  email?: string;
}

export class CreateReportDto {
  // Datos del reportante
  @ValidateNested()
  @Type(() => ReporterDto)
  reporter!: ReporterDto;

  // Datos del caso
  @IsString()
  @MinLength(10)
  @MaxLength(20)
  phone!: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  reportedName?: string;

  @IsInt()
  @Min(0)
  @Max(1_000_000_000)
  @IsOptional()
  @Type(() => Number)
  amount?: number;

  @IsDateString()
  incidentDate!: string;

  @IsEnum(FraudType)
  fraudType!: FraudType;

  @IsEnum(Channel)
  channel!: Channel;

  @IsString()
  @MinLength(10)
  @MaxLength(500)
  description!: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => EvidenceItemDto)
  @ArrayMaxSize(2)
  @IsOptional()
  evidence?: EvidenceItemDto[];

  @IsString()
  @Length(1, 2048)
  @IsOptional()
  captchaToken?: string;
}

export class PresignedUrlDto {
  @IsString()
  @Length(1, 255)
  fileName!: string;

  @IsString()
  @Length(1, 100)
  mimeType!: string;

  @IsInt()
  @Min(1)
  @Max(2_097_152) // 2 MB
  @Type(() => Number)
  size!: number;
}
