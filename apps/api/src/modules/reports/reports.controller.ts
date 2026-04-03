import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseInterceptors, UploadedFile, BadRequestException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
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

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  @HttpCode(HttpStatus.OK)
  async uploadFile(@UploadedFile() file: Express.Multer.File) {
    if (!file) {
      throw new BadRequestException('No se recibió ningún archivo');
    }
    
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException('Solo se permiten imágenes JPEG o PNG');
    }
    
    if (file.size > 2 * 1024 * 1024) {
      throw new BadRequestException('El archivo debe ser menor a 2 MB');
    }

    return this.reportsService.uploadFile(file);
  }
}
