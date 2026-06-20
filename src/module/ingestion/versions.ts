/**
 * KB ingestion version markers.
 *
 * These feed the per-document `content_hash` (see KbService.syncDocument) so a
 * change here invalidates every stored hash and triggers a controlled re-index
 * on the next seed/ingest run — without touching the source content itself.
 *
 * - Bump EMBEDDING_VERSION when the embedding model or its output dimension changes
 *   (currently gemini-embedding-001 → 3072 dims). A bump forces full re-embedding.
 * - Bump CHUNKING_VERSION when the chunkDocument algorithm changes (boundaries,
 *   budget, prefix format). A bump forces re-chunking + re-embedding.
 */
export const EMBEDDING_VERSION = 1;
export const CHUNKING_VERSION = 1;

import { createHash } from 'crypto';

/**
 * Content hash used as the re-ingestion decision key. Mixes in the version markers
 * so bumping either forces every document's hash to differ → controlled re-index,
 * even when the source bytes are unchanged.
 */
export function computeContentHash(content: string): string {
  return createHash('sha256')
    .update(`${content}\0${EMBEDDING_VERSION}\0${CHUNKING_VERSION}`)
    .digest('hex');
}
