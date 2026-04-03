import { IsOptional, IsString, ValidateIf } from 'class-validator';

export class AnalyzeImageDto {
  @ValidateIf((dto: AnalyzeImageDto) => !dto.base64Image)
  @IsString()
  @IsOptional()
  imageUrl?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;

  @ValidateIf((dto: AnalyzeImageDto) => !dto.imageUrl)
  @IsString()
  @IsOptional()
  base64Image?: string;
}

export interface AnalysisResult {
  isEdited: boolean;
  confidence: number;
  analysis: string;
  redFlags: string[];
  recommendation: string;
  forensic?: {
    score: number;
    summary: string;
    signals: Array<{
      name: string;
      score: number;
      detail: string;
    }>;
  };
}
