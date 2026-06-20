import { Inject, Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { Logger } from '../../common/logging/logger';
import { VectorStoreService, VectorSearchFilter } from './vector-store/vector-store.interface';

export interface KbResult {
  id: string;
  content: string;
  source: string;
  metadata: Record<string, any>;
  score: number;
}

@Injectable()
export class KbService {
  constructor(
    private dataSource: DataSource,
    @Inject('VECTOR_STORE') private vectorStore: VectorStoreService,
  ) {}

  async hybridSearch(
    queryEmbedding: number[],
    query: string,
    options: VectorSearchFilter & { topK?: number } = {},
  ): Promise<KbResult[]> {
    const { route, ship, locale = 'en', topK = 20 } = options;
    const filter: VectorSearchFilter = { route, ship, locale };

    // Semantic + keyword search run in parallel
    const [semanticResults, keywordResults] = await Promise.all([
      this.vectorStore.search(queryEmbedding, topK * 2, filter),
      this.keywordSearch(query, topK * 2, filter),
    ]);

    // Reciprocal Rank Fusion (semantic 70%, keyword 30%)
    const scoreMap = new Map<string, number>();
    for (const r of semanticResults) {
      scoreMap.set(r.id, (scoreMap.get(r.id) ?? 0) + r.score * 0.7);
    }
    for (const r of keywordResults) {
      scoreMap.set(r.id, (scoreMap.get(r.id) ?? 0) + r.score * 0.3);
    }

    const topIds = [...scoreMap.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, topK)
      .map(([id]) => id);

    if (!topIds.length) return [];

    // Fetch chunk content and source metadata from postgres
    const rows = await this.dataSource.query(
      `SELECT kc.id, kc.content, kd.source, kd.title, kc.metadata
       FROM kb_chunk kc
       JOIN kb_document kd ON kd.id = kc.document_id
       WHERE kc.id = ANY($1::uuid[])`,
      [topIds],
    );

    const rowMap = new Map(rows.map((r: any) => [r.id, r]));
    return topIds
      .filter(id => rowMap.has(id))
      .map(id => {
        const r: any = rowMap.get(id);
        return {
          id: r.id,
          content: r.content,
          source: `${r.source}${r.title ? ` — ${r.title}` : ''}`,
          metadata: r.metadata ?? {},
          score: scoreMap.get(id) ?? 0,
        };
      });
  }

  private async keywordSearch(
    query: string,
    limit: number,
    filter: VectorSearchFilter,
  ): Promise<Array<{ id: string; score: number }>> {
    const conditions: string[] = [
      `to_tsvector('simple', kc.content) @@ plainto_tsquery('simple', $1)`,
    ];
    const params: any[] = [query, limit];
    let i = 3;

    if (filter.locale) {
      conditions.push(`(kd.locale = $${i} OR kd.locale = 'en')`);
      params.push(filter.locale); i++;
    }
    if (filter.route) {
      conditions.push(`kc.metadata->>'route' = $${i}`);
      params.push(filter.route); i++;
    }
    if (filter.ship) {
      conditions.push(`kc.metadata->>'ship' = $${i}`);
      params.push(filter.ship); i++;
    }

    const sql = `
      SELECT kc.id,
        ts_rank(to_tsvector('simple', kc.content), plainto_tsquery('simple', $1)) AS score
      FROM kb_chunk kc
      JOIN kb_document kd ON kd.id = kc.document_id
      WHERE ${conditions.join(' AND ')}
      LIMIT $2
    `;

    try {
      const rows = await this.dataSource.query(sql, params);
      return rows.map((r: any) => ({ id: r.id, score: parseFloat(r.score) }));
    } catch (err) {
      Logger.error('KbService.keywordSearch failed', { err });
      return [];
    }
  }

  /**
   * Idempotent, version-aware document upsert keyed on the stable `sourceKey`.
   *
   * Upserts the document's metadata and returns a status the caller uses to decide
   * whether to (re)ingest chunks. The `content_hash` commit marker is intentionally
   * NOT written here — it is set only by replaceChunks once chunks are durably in
   * place, so a crash between this call and chunk-writing leaves the old hash and
   * the document still reports as needing ingestion on the next run.
   *
   *   created             — brand-new document
   *   reingest_required   — existing document whose content/version hash changed
   *   unchanged           — hash matches; caller can skip embedding entirely
   */
  async syncDocument(params: {
    sourceKey: string;
    source: string;
    title: string;
    locale: string;
    metadata: Record<string, any>;
    contentHash: string;
    embeddingVersion: number;
    chunkingVersion: number;
  }): Promise<{ documentId: string; status: 'created' | 'reingest_required' | 'unchanged' }> {
    const rows = await this.dataSource.query(
      `INSERT INTO kb_document
         (source_key, source, title, locale, metadata, embedding_version, chunking_version)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6, $7)
       ON CONFLICT (source_key) DO UPDATE SET
         source            = EXCLUDED.source,
         title             = EXCLUDED.title,
         locale            = EXCLUDED.locale,
         metadata          = EXCLUDED.metadata,
         embedding_version = EXCLUDED.embedding_version,
         chunking_version  = EXCLUDED.chunking_version,
         updated_at        = now()
       WHERE kb_document.content_hash IS DISTINCT FROM $8
       RETURNING id, (xmax = 0) AS inserted`,
      [
        params.sourceKey,
        params.source,
        params.title,
        params.locale,
        JSON.stringify(params.metadata),
        params.embeddingVersion,
        params.chunkingVersion,
        params.contentHash,
      ],
    );

    if (rows.length) {
      const { id, inserted } = rows[0];
      return { documentId: id, status: inserted ? 'created' : 'reingest_required' };
    }

    // No row returned ⇒ ON CONFLICT matched but the hash was identical ⇒ unchanged.
    const existing = await this.dataSource.query(
      `SELECT id FROM kb_document WHERE source_key = $1`,
      [params.sourceKey],
    );
    return { documentId: existing[0]?.id, status: 'unchanged' };
  }

  /** Number of chunks currently stored for a document (used for self-heal checks). */
  async countChunks(documentId: string): Promise<number> {
    const rows = await this.dataSource.query(
      `SELECT count(*)::int AS n FROM kb_chunk WHERE document_id = $1`,
      [documentId],
    );
    return rows[0]?.n ?? 0;
  }

  /**
   * Atomically replace all chunks for a document and stamp the commit marker.
   *
   * Embeddings MUST already be computed before calling this — the whole replace
   * (delete old → insert new with embeddings → set content_hash + last_ingested_at)
   * runs in one transaction, so a document is never left half-rewritten or with
   * zero chunks. The content_hash is written last, inside the same commit, so it
   * only flips to "done" when the new chunks are durable.
   *
   * pgvector-only: the embedding is written inline into kb_chunk. If Pinecone is
   * re-enabled, push vectors to it here instead.
   */
  async replaceChunks(
    documentId: string,
    contentHash: string,
    chunks: Array<{ chunkIndex: number; content: string; metadata: Record<string, any> }>,
    embeddings: number[][],
  ): Promise<void> {
    const runner = this.dataSource.createQueryRunner();
    await runner.connect();
    await runner.startTransaction();
    try {
      // Serialize concurrent writers for this document.
      await runner.query(`SELECT id FROM kb_document WHERE id = $1 FOR UPDATE`, [documentId]);
      await runner.query(`DELETE FROM kb_chunk WHERE document_id = $1`, [documentId]);

      for (let i = 0; i < chunks.length; i++) {
        const c = chunks[i];
        await runner.query(
          `INSERT INTO kb_chunk (document_id, chunk_index, content, embedding, metadata)
           VALUES ($1, $2, $3, $4::vector, $5::jsonb)`,
          [documentId, c.chunkIndex, c.content, `[${embeddings[i].join(',')}]`, JSON.stringify(c.metadata)],
        );
      }

      // Commit marker — set last so the hash only reflects durably-written chunks.
      await runner.query(
        `UPDATE kb_document SET content_hash = $2, last_ingested_at = now() WHERE id = $1`,
        [documentId, contentHash],
      );

      await runner.commitTransaction();
    } catch (err) {
      await runner.rollbackTransaction();
      throw err;
    } finally {
      await runner.release();
    }
  }
}
