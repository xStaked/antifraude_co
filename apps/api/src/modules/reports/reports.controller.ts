import { Controller, Post, Body, HttpCode, HttpStatus, Req } from '@nestjs/common';
import { Request } from 'express';
import { ReportsService } from './reports.service';
import { CreateReportDto, PresignedUrlDto } from './reports.dto';

@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateReportDto, @Req() req: Request) {
    return this.reportsService.createReport(dto, req);
  }

  @Post('presigned-url')
  @HttpCode(HttpStatus.OK)
  async presignedUrl(@Body() dto: PresignedUrlDto) {
    return this.reportsService.getPresignedUrl(dto);
  }
}
