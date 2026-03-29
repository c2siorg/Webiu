import { Module } from '@nestjs/common';
import { CommonModule } from '../common/common.module';
import { AnalyzerController } from './analyzer.controller';
import { AnalyzerService } from './analyzer.service';
import { AnalyzerStoreService } from './analyzer.store.service';

@Module({
  imports: [CommonModule],
  controllers: [AnalyzerController],
  providers: [AnalyzerService, AnalyzerStoreService],
  exports: [AnalyzerService],
})
export class AnalyzerModule {}
