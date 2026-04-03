import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { StatsService, FullStats } from './stats.service';

@Controller('stats')
export class StatsController {
  constructor(private readonly statsService: StatsService) {}

  @Get()
  @HttpCode(HttpStatus.OK)
  async getStats(): Promise<FullStats> {
    return this.statsService.getFullStats();
  }
}
