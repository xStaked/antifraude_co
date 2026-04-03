import { Module } from '@nestjs/common';
import { ReportsController } from './reports.controller';
import { ReportsService } from './reports.service';
import { FilesModule } from '../files/files.module';
import { SharedModule } from '../../shared/shared.module';

@Module({
  imports: [FilesModule, SharedModule],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
