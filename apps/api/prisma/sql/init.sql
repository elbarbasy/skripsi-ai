-- Run this ONCE after the tables exist (`pnpm db:push`).
-- On Supabase: paste this into the SQL Editor and run it.
-- Locally:  psql "$DIRECT_URL" -f prisma/sql/init.sql
--
-- Enables pgvector and adds the embedding column + ANN index that Prisma
-- cannot express natively.
--
-- IMPORTANT: pgvector ANN indexes (hnsw/ivfflat) support at most 2000 dims.
--   -> Default uses 1536 dims = OpenAI "text-embedding-3-small" (indexable).
--   -> Keep vector(1536) in sync with EMBEDDING_DIM=1536 in your env.
--   -> If you want 3072 dims ("text-embedding-3-large"), use the halfvec
--      variant at the bottom (pgvector >= 0.7, available on Supabase).

CREATE EXTENSION IF NOT EXISTS vector;

-- ---- Default: 1536 dims (recommended) ----
ALTER TABLE "DocumentChunk"
  ADD COLUMN IF NOT EXISTS embedding vector(1536);

CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw
  ON "DocumentChunk"
  USING hnsw (embedding vector_cosine_ops);

-- ---- Optional: 3072 dims via halfvec (uncomment, and remove the block above) ----
-- ALTER TABLE "DocumentChunk"
--   ADD COLUMN IF NOT EXISTS embedding halfvec(3072);
-- CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw
--   ON "DocumentChunk"
--   USING hnsw ((embedding::halfvec(3072)) halfvec_cosine_ops);
