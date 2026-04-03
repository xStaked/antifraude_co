import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { appConfig } from './config';
import { SearchModule } from './modules/search/search.module';
import { ReportsModule } from './modules/reports/reports.module';
import { FilesModule } from './modules/files/files.module';
import { StatsModule } from './modules/stats/stats.module';
import { AiDetectorModule } from './modules/ai-detector/ai-detector.module';
import { AdminModule } from './modules/admin/admin.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['../../.env', '.env'],
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
    SearchModule,
    ReportsModule,
    FilesModule,
    StatsModule,
    AiDetectorModule,
    AdminModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
