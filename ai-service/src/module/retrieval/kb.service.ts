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

  async upsertDocument(params: {
    source: string;
    title: string;
    locale: string;
    metadata: Record<string, any>;
  }): Promise<string> {
    const rows = await this.dataSource.query(
      `INSERT INTO kb_document (source, title, locale, metadata)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [params.source, params.title, params.locale, JSON.stringify(params.metadata)],
    );
    return rows[0]?.id;
  }

  async upsertChunk(params: {
    documentId: string;
    chunkIndex: number;
    content: string;
    embedding: number[];
    metadata: Record<string, any>;
  }): Promise<void> {
    // Always store content in postgres for keyword search
    const rows = await this.dataSource.query(
      `INSERT INTO kb_chunk (document_id, chunk_index, content, metadata)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (document_id, chunk_index)
       DO UPDATE SET content = EXCLUDED.content, metadata = EXCLUDED.metadata
       RETURNING id`,
      [params.documentId, params.chunkIndex, params.content, JSON.stringify(params.metadata)],
    );
    const chunkId: string = rows[0]?.id;
    if (!chunkId) return;

    // Store embedding in the active vector store (pgvector or Pinecone)
    await this.vectorStore.upsert({
      id: chunkId,
      embedding: params.embedding,
      metadata: { ...params.metadata, documentId: params.documentId },
    });
  }
}
