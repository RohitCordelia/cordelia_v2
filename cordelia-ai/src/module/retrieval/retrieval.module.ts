import { Module } from '@nestjs/common';
import { KbService } from './kb.service';
import { EmbeddingsService } from './embeddings.service';
import { PgVectorStoreService } from './vector-store/pgvector-store.service';
import { PineconeStoreService } from './vector-store/pinecone-store.service';
import { ConfigService } from '../config/config.service';
import { DataSource } from 'typeorm';

@Module({
  providers: [
    EmbeddingsService,
    PgVectorStoreService,
    PineconeStoreService,
    {
      provide: 'VECTOR_STORE',
      useFactory: (config: ConfigService, pg: PgVectorStoreService, pinecone: PineconeStoreService) => {
        return config.vectorStore === 'pinecone' ? pinecone : pg;
      },
      inject: [ConfigService, PgVectorStoreService, PineconeStoreService],
    },
    KbService,
  ],
  exports: [KbService, EmbeddingsService],
})
export class RetrievalModule {}
