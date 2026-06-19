import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { VectorStoreService, VectorSearchResult, VectorUpsertParams, VectorSearchFilter } from './vector-store.interface';

@Injectable()
export class PgVectorStoreService extends VectorStoreService {
  constructor(private dataSource: DataSource) {
    super();
  }

  async upsert({ id, embedding }: VectorUpsertParams): Promise<void> {
    await this.dataSource.query(
      `UPDATE kb_chunk SET embedding = $2::vector WHERE id = $1`,
      [id, `[${embedding.join(',')}]`],
    );
  }

  async search(embedding: number[], topK: number, filter: VectorSearchFilter = {}): Promise<VectorSearchResult[]> {
    const conditions: string[] = ['kc.embedding IS NOT NULL'];
    const params: any[] = [`[${embedding.join(',')}]`, topK];
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
      SELECT kc.id, 1 - (kc.embedding::vector <=> $1::vector) AS score
      FROM kb_chunk kc
      JOIN kb_document kd ON kd.id = kc.document_id
      WHERE ${conditions.join(' AND ')}
      ORDER BY kc.embedding::vector <=> $1::vector
      LIMIT $2
    `;

    const rows = await this.dataSource.query(sql, params);
    return rows.map((r: any) => ({ id: r.id, score: parseFloat(r.score) }));
  }

  async delete(id: string): Promise<void> {
    await this.dataSource.query(`DELETE FROM kb_chunk WHERE id = $1`, [id]);
  }
}
