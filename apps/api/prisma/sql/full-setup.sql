-- =====================================================================
-- Skripsita AI — Full database setup for Supabase (paste into SQL Editor)
-- =====================================================================
-- Cara pakai (tanpa komputer / langsung dari dashboard):
--   1. Buka Supabase -> SQL Editor -> New query
--   2. Copy seluruh isi file ini, paste, klik RUN
--   3. Selesai. Semua tabel + enum + pgvector + index dibuat.
--
-- Ini setara hasil `prisma db push` + `init.sql`, jadi Anda TIDAK perlu
-- menjalankan prisma dari komputer. Aplikasi (Prisma client) langsung jalan
-- di atas skema ini.
--
-- Embedding default = 1536 dim (OpenAI text-embedding-3-small) agar bisa
-- di-index pgvector (limit index = 2000 dim).
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS vector;

-- Enum status dokumen
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'DocStatus') THEN
    CREATE TYPE "DocStatus" AS ENUM ('PENDING', 'PROCESSING', 'READY', 'FAILED');
  END IF;
END$$;

-- ---------------------------------------------------------------------
-- Tabel
-- ---------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS "CampusGuideline" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "name"      TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "status"    "DocStatus" NOT NULL DEFAULT 'PENDING',
  "rules"     JSONB,
  "rawText"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS "Project" (
  "id"             TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "title"          TEXT NOT NULL,
  "topic"          TEXT,
  "studyProgram"   TEXT,
  "researchMethod" TEXT,
  "guidelineId"    TEXT,
  "createdAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt"      TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Project_guidelineId_fkey" FOREIGN KEY ("guidelineId")
    REFERENCES "CampusGuideline"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ProjectVersion" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "snapshot"  JSONB NOT NULL,
  "note"      TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ProjectVersion_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Journal" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT,
  "title"     TEXT NOT NULL,
  "fileUrl"   TEXT NOT NULL,
  "status"    "DocStatus" NOT NULL DEFAULT 'PENDING',
  "summary"   TEXT,
  "method"    TEXT,
  "variables" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  "results"   TEXT,
  "rawText"   TEXT,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Journal_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "DocumentChunk" (
  "id"          TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "source"      TEXT NOT NULL,
  "guidelineId" TEXT,
  "journalId"   TEXT,
  "content"     TEXT NOT NULL,
  "chunkIndex"  INTEGER NOT NULL,
  "embedding"   vector(1536),
  "createdAt"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "DocumentChunk_guidelineId_fkey" FOREIGN KEY ("guidelineId")
    REFERENCES "CampusGuideline"("id") ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT "DocumentChunk_journalId_fkey" FOREIGN KEY ("journalId")
    REFERENCES "Journal"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Chapter" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "key"       TEXT NOT NULL,
  "content"   TEXT NOT NULL,
  "version"   INTEGER NOT NULL DEFAULT 1,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Chapter_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Citation" (
  "id"           TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId"    TEXT NOT NULL,
  "style"        TEXT NOT NULL,
  "authors"      TEXT NOT NULL,
  "year"         TEXT NOT NULL,
  "title"        TEXT NOT NULL,
  "source"       TEXT NOT NULL,
  "inText"       TEXT NOT NULL,
  "bibliography" TEXT NOT NULL,
  "createdAt"    TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Citation_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "ExportJob" (
  "id"        TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  "projectId" TEXT NOT NULL,
  "format"    TEXT NOT NULL,
  "url"       TEXT,
  "status"    "DocStatus" NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "ExportJob_projectId_fkey" FOREIGN KEY ("projectId")
    REFERENCES "Project"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- ---------------------------------------------------------------------
-- Index & unique constraints
-- ---------------------------------------------------------------------
CREATE UNIQUE INDEX IF NOT EXISTS "Chapter_projectId_key_key"
  ON "Chapter" ("projectId", "key");
CREATE INDEX IF NOT EXISTS "DocumentChunk_guidelineId_idx"
  ON "DocumentChunk" ("guidelineId");
CREATE INDEX IF NOT EXISTS "DocumentChunk_journalId_idx"
  ON "DocumentChunk" ("journalId");

-- pgvector ANN index (cosine)
CREATE INDEX IF NOT EXISTS "document_chunk_embedding_hnsw"
  ON "DocumentChunk" USING hnsw ("embedding" vector_cosine_ops);

-- Selesai. Pastikan EMBEDDING_DIM=1536 dan OPENAI_EMBEDDING_MODEL=text-embedding-3-small.
