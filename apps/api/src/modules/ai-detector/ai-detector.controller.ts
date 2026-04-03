import { Controller, Get, Post, Body, HttpCode, HttpStatus, UseGuards } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiDetectorService, GOOGLE_VISION_MODEL_CANDIDATES } from './ai-detector.service';
import { AnalyzeImageDto } from './ai-detector.dto';
import { ThrottlerGuard } from '@nestjs/throttler';

@Controller('ai-detector')
@UseGuards(ThrottlerGuard)
export class AiDetectorController {
  constructor(
    private readonly aiDetectorService: AiDetectorService,
    private readonly config: ConfigService,
  ) {}

  @Get('health')
  @HttpCode(HttpStatus.OK)
  health() {
    const apiKey = this.config.get<string>('googleApiKey');
    return {
      success: true,
      data: {
        apiKeyConfigured: !!apiKey,
        apiKeyPrefix: apiKey ? `${apiKey.substring(0, 10)}...` : null,
        apiKeyLength: apiKey?.length || 0,
      },
    };
  }

  @Get('models')
  @HttpCode(HttpStatus.OK)
  listModels() {
    return {
      success: true,
      data: GOOGLE_VISION_MODEL_CANDIDATES,
    };
  }

  @Post('analyze')
  @HttpCode(HttpStatus.OK)
  async analyze(@Body() dto: AnalyzeImageDto) {
    const result = await this.aiDetectorService.analyzeImage(
      dto.imageUrl,
      dto.mimeType,
      dto.base64Image,
    );
    return {
      success: true,
      data: result,
    };
  }
}
