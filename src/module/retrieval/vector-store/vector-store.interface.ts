export interface VectorSearchResult {
  id: string;
  score: number;
}

export interface VectorUpsertParams {
  id: string;
  embedding: number[];
  metadata?: Record<string, any>;
}

export interface VectorSearchFilter {
  route?: string;
  ship?: string;
  locale?: string;
}

export abstract class VectorStoreService {
  abstract upsert(params: VectorUpsertParams): Promise<void>;
  abstract search(embedding: number[], topK: number, filter?: VectorSearchFilter): Promise<VectorSearchResult[]>;
  abstract delete(id: string): Promise<void>;
}
