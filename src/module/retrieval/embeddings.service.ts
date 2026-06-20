import { Injectable } from '@nestjs/common';
import { embed, embedMany } from 'ai';
import { createGoogleGenerativeAI } from '@ai-sdk/google';

// Pinned — DO NOT change without bumping EMBEDDING_VERSION (forces a controlled
// re-embed of all kb_chunk rows). gemini-embedding-001 returns its default 3072
// dimensions → matches vector(3072) in Postgres.
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
