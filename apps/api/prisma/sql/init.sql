-- Run this once AFTER `pnpm db:push` (or after the first prisma migrate).
-- It enables pgvector and adds the embedding column + ANN index that Prisma
-- cannot express natively.
--
--   psql "$DATABASE_URL" -f prisma/sql/init.sql
--
-- NOTE: keep vector(3072) in sync with EMBEDDING_DIM in your .env.
-- ivfflat supports up to 2000 dims; for 3072-dim embeddings use hnsw (pgvector >= 0.5)
-- or reduce EMBEDDING_DIM to <= 2000 (e.g. text-embedding-3-small = 1536).

CREATE EXTENSION IF NOT EXISTS vector;

ALTER TABLE "DocumentChunk"
  ADD COLUMN IF NOT EXISTS embedding vector(3072);

-- HNSW index (works for high-dim vectors). Cosine distance.
CREATE INDEX IF NOT EXISTS document_chunk_embedding_hnsw
  ON "DocumentChunk"
  USING hnsw (embedding vector_cosine_ops);
