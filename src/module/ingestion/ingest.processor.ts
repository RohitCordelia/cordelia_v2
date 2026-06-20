import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { KbService } from '../retrieval/kb.service';
import { EmbeddingsService } from '../retrieval/embeddings.service';
import { Logger } from '../../common/logging/logger';
import { chunkDocument } from './chunk-document';
import { EMBEDDING_VERSION, CHUNKING_VERSION, computeContentHash } from './versions';

export const KB_INGESTION_QUEUE = 'kb-ingestion';

export interface IngestJobData {
  sourceKey: string;        // stable logical id — the idempotent upsert key
  source: string;           // faq | policy | cms | call_mined
  title: string;
  locale: string;
  content: string;          // full raw content (Markdown with #/## headings)
  metadata: Record<string, any>;  // topic, ship, entityType, priority, tags
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
    const { sourceKey, source, title, locale, content, metadata } = job.data;
    Logger.info(`Ingesting: ${title}`, { source, sourceKey });

    const contentHash = computeContentHash(content);

    // 1. Idempotent, version-aware document upsert
    const { documentId, status } = await this.kbService.syncDocument({
      sourceKey,
      source,
      title,
      locale,
      metadata,
      contentHash,
      embeddingVersion: EMBEDDING_VERSION,
      chunkingVersion: CHUNKING_VERSION,
    });
    if (!documentId) throw new Error(`Failed to sync document for: ${title}`);

    // 2. Skip unchanged docs — unless a prior run left them with zero chunks (self-heal)
    let needsIngest = status !== 'unchanged';
    if (!needsIngest && (await this.kbService.countChunks(documentId)) === 0) {
      needsIngest = true;
    }
    if (!needsIngest) {
      Logger.info(`Unchanged, skipping: ${title}`, { documentId });
      return;
    }

    // 3. Section-aware chunking
    const chunks = chunkDocument(content, {
      title,
      ship: metadata.ship,
      topic: metadata.topic,
    });
    if (chunks.length === 0) {
      Logger.warn(`No chunks produced, leaving existing chunks intact: ${title}`, { documentId });
      return;
    }
    Logger.info(`Split into ${chunks.length} chunks`, { documentId, status });

    // 4. Embed ALL chunks before any DB write — a failure here leaves the old
    //    chunks and hash untouched, so the next run safely retries.
    const embeddings: number[][] = [];
    const batchSize = 20;
    for (let i = 0; i < chunks.length; i += batchSize) {
      const batch = chunks.slice(i, i + batchSize);
      const embedded = await this.embeddingsService.embedBatch(batch.map((c) => c.content));
      embeddings.push(...embedded);
    }

    // 5. Atomically replace chunks + stamp the commit marker
    await this.kbService.replaceChunks(
      documentId,
      contentHash,
      chunks.map((c) => ({
        chunkIndex: c.chunkIndex,
        content: c.content,
        metadata: { ...metadata, ...c.metadata },
      })),
      embeddings,
    );

    Logger.info(`Ingestion complete: ${title}`, { documentId, chunks: chunks.length });
  }
}
