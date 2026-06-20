import { Injectable } from '@nestjs/common';
import { Pinecone } from '@pinecone-database/pinecone';
import { ConfigService } from '../../config/config.service';
import { VectorStoreService, VectorSearchResult, VectorUpsertParams, VectorSearchFilter } from './vector-store.interface';

@Injectable()
export class PineconeStoreService extends VectorStoreService {
  // Lazy-initialized — only connects when actually used (not when pgvector is active)
  private client: Pinecone | null = null;

  constructor(private configService: ConfigService) {
    super();
  }

  private getIndex() {
    if (!this.client) {
      this.client = new Pinecone({ apiKey: this.configService.pineconeApiKey });
    }
    return this.client.index({ name: this.configService.pineconeIndex });
  }

  async upsert({ id, embedding, metadata }: VectorUpsertParams): Promise<void> {
    await this.getIndex().upsert({ records: [{ id, values: embedding, metadata: metadata ?? {} }] });
  }

  async search(embedding: number[], topK: number, filter: VectorSearchFilter = {}): Promise<VectorSearchResult[]> {
    const pineconeFilter: Record<string, any> = {};
    if (filter.route) pineconeFilter.route = { $eq: filter.route };
    if (filter.ship) pineconeFilter.ship = { $eq: filter.ship };
    if (filter.locale) pineconeFilter.locale = { $in: [filter.locale, 'en'] };

    const result = await this.getIndex().query({
      vector: embedding,
      topK,
      filter: Object.keys(pineconeFilter).length ? pineconeFilter : undefined,
      includeValues: false,
    });

    return (result.matches ?? []).map(m => ({ id: m.id, score: m.score ?? 0 }));
  }

  async delete(id: string): Promise<void> {
    await this.getIndex().deleteOne({ id });
  }
}
