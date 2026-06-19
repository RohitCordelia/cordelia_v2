import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { IngestProcessor, KB_INGESTION_QUEUE } from './ingest.processor';
import { RetrievalModule } from '../retrieval/retrieval.module';

@Module({
  imports: [
    BullModule.registerQueue({ name: KB_INGESTION_QUEUE }),
    RetrievalModule,
  ],
  providers: [IngestProcessor],
  exports: [BullModule],
})
export class IngestionModule {}
