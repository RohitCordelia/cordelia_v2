import { Injectable } from '@nestjs/common';
import { embed, embedMany } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Pinned — DO NOT change without re-embedding all kb_chunk rows (expensive)
// gemini-embedding-001 → 768 dimensions → vector(768) in Postgres / Pinecone index
const EMBEDDING_MODEL = createGoogleGenerativeAI().textEmbeddingModel('gemini-embedding-001');

@Injectable()
export class EmbeddingsService {
  async embedOne(text: string): Promise<number[]> {
    const { embedding } = await embed({
      model: EMBEDDING_MODEL,
      value: text,
    });
    return embedding;
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    const { embeddings } = await embedMany({
      model: EMBEDDING_MODEL,
      values: texts,
    });
    return embeddings;
  }
}
