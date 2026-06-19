import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KbService } from '../retrieval/kb.service';
import { EmbeddingsService } from '../retrieval/embeddings.service';
import { Logger } from '../../common/logging/logger';

export const KB_INGESTION_QUEUE = 'kb-ingestion';

export interface IngestJobData {
  source: string;           // faq | policy | cms | call_mined
  title: string;
  locale: string;
  content: string;          // full raw content
  metadata: Record<string, any>;
}

@Processor(KB_INGESTION_QUEUE)
export class IngestProcessor extends WorkerHost {
  constructor(
    private kbService: KbService,
    private embeddingsService: EmbeddingsService,
  ) {
    super();
  }

  async process(job: Job<IngestJobData>): Promise<void> {
    const { source, title, locale, content, metadata } = job.data;
    Logger.info(`Ingesting: ${title}`, { source });

    // 1. Create document record
    const documentId = await this.kbService.upsertDocument({ source, title, locale, metadata });
    if (!documentId) throw new Error(`Failed to create document for: ${title}`);

    // 2. Chunk content (~400 tokens, with overlap)
    const chunks = this.chunkText(content, 400, 50);
    Logger.info(`Split into ${chunks.length} chunks`, { documentId });

    // 3. Embed in batches of 20
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embeddings = await this.embeddingsService.embedBatch(batch);

      for (let j = 0; j < batch.length; j++) {
        await this.kbService.upsertChunk({
          documentId,
          chunkIndex: i + j,
          content: batch[j],
          embedding: embeddings[j],
          metadata,
        });
      }
      Logger.info(`Ingested chunks ${i}–${i + batch.length - 1}`, { documentId });
    }

    Logger.info(`Ingestion complete: ${title}`, { documentId, chunks: chunks.length });
  }

  // Splits text into overlapping chunks by approximate token count (1 token ≈ 4 chars)
  private chunkText(text: string, maxTokens: number, overlapTokens: number): string[] {
    const maxChars = maxTokens * 4;
    const overlapChars = overlapTokens * 4;
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + maxChars, text.length);
      chunks.push(text.slice(start, end).trim());
      start += maxChars - overlapChars;
    }

    return chunks.filter((c) => c.length > 0);
  }
}