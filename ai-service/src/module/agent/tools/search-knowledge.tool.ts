import { createTool } from '@mastra/core/tools';
import { z } from 'zod';
import { EmbeddingsService } from '../../retrieval/embeddings.service';
import { KbService, KbResult } from '../../retrieval/kb.service';

// Lazy singleton — model (~65MB) downloads once on first call, stays in memory
let rerankerPromise: Promise<any> | null = null;

function getReranker(): Promise<any> {
  if (!rerankerPromise) {
    rerankerPromise = import('@xenova/transformers').then(({ pipeline }) =>
      pipeline('text-classification', 'cross-encoder/ms-marco-MiniLM-L-6-v2'),
    );
  }
  return rerankerPromise;
}

async function rerank(query: string, chunks: KbResult[], topK = 5): Promise<KbResult[]> {
  if (!chunks.length) return chunks;
  try {
    const reranker = await getReranker();
    const scores: Array<{ label: string; score: number }> = await reranker(
      chunks.map(c => ({ text: query, text_pair: c.content })),
    );
    return chunks
      .map((chunk, i) => ({ ...chunk, score: scores[i]?.score ?? chunk.score }))
      .sort((a, b) => b.score - a.score)
      .slice(0, topK);
  } catch {
    // Fallback to hybrid search order if reranker fails
    return chunks.slice(0, topK);
  }
}

export function createSearchKnowledgeTool(
  kbService: KbService,
  embeddingsService: EmbeddingsService,
) {
  return createTool({
    id: 'search_knowledge',
    description:
      'Search the Cordelia Cruises knowledge base for policies, FAQs, inclusions, ship info, and cruise details. Use for questions about cancellation, what is included, embarkation, dining, activities, or any general cruise information.',
    inputSchema: z.object({
      query: z.string().describe('User question or search query'),
      route: z.string().optional().describe('Filter by route, e.g. Mumbai-Goa'),
      ship: z.string().optional().describe('Filter by ship name, e.g. Empress'),
      locale: z.enum(['en', 'hi', 'hinglish']).optional().default('en'),
    }),
    execute: async ({ context }) => {
      const embedding = await embeddingsService.embedOne(context.query);
      // Fetch 20 candidates, rerank to top 5
      const candidates = await kbService.hybridSearch(embedding, context.query, {
        route: context.route,
        ship: context.ship,
        locale: context.locale,
        topK: 20,
      });
      const results = await rerank(context.query, candidates, 5);
      return { results };
    },
  });
}
