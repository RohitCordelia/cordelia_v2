-- Run this in pgAdmin on your existing PostgreSQL database
-- Requires pgvector 0.6.0+ for HNSW with 3072 dims
-- Verified working with pgvector 0.8.0

-- Step 1: Enable pgvector extension (run once, requires superuser)
CREATE EXTENSION IF NOT EXISTS vector;

-- Step 2: Drop existing tables if re-running after a failed migration
-- (safe to run — tables are empty at this stage)
DROP TABLE IF EXISTS kb_chunk CASCADE;
DROP TABLE IF EXISTS kb_document CASCADE;

-- Step 3: Knowledge base document table
CREATE TABLE kb_document (
  id          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  source      text        NOT NULL,           -- faq | policy | cms | call_mined
  title       text,
  locale      text        NOT NULL DEFAULT 'en',
  metadata    jsonb       NOT NULL DEFAULT '{}',
  updated_at  timestamptz NOT NULL DEFAULT now(),
  created_at  timestamptz NOT NULL DEFAULT now()
);

-- Step 4: Chunk table
-- embedding column is nullable — NULL when VECTOR_STORE=pinecone (vectors live in Pinecone)
-- gemini-embedding-001 produces 3072 dimensions
CREATE TABLE kb_chunk (
  id            uuid  PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id   uuid  NOT NULL REFERENCES kb_document(id) ON DELETE CASCADE,
  chunk_index   int   NOT NULL,
  content       text  NOT NULL,
  embedding     vector(3072),   -- null when using Pinecone as vector store
  metadata      jsonb NOT NULL DEFAULT '{}',
  UNIQUE (document_id, chunk_index)
);

-- Step 5: Indexes
-- NOTE: HNSW on regular vector type is limited to 2000 dims even in pgvector 0.8.
-- gemini-embedding-001 produces 3072 dims so no HNSW index is possible.
-- For a small KB (< 500 chunks) sequential scan is fast enough.
-- To enable HNSW later: change column type to halfvec(3072) which supports up to 16000 dims.
SET maintenance_work_mem = '512MB';

-- Keyword search index (GIN — always used, even in Pinecone mode)
CREATE INDEX kb_chunk_content_gin
  ON kb_chunk USING gin (to_tsvector('simple', content));

-- Metadata filter index
CREATE INDEX kb_chunk_metadata_gin
  ON kb_chunk USING gin (metadata);

-- Step 6: Verify
SELECT extname, extversion FROM pg_extension WHERE extname = 'vector';
SELECT COUNT(*) FROM kb_document;
SELECT COUNT(*) FROM kb_chunk;
