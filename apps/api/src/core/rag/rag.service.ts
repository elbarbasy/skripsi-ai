import { Injectable, Logger } from '@nestjs/common';
import { v4 as uuid } from 'uuid';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../ai/ai.service';
import { chunkText } from '../documents/chunker';

export interface RetrievedChunk {
  source: string;
  content: string;
  score: number;
}

interface IngestParams {
  text: string;
  source: 'guideline' | 'journal';
  guidelineId?: string;
  journalId?: string;
}

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  private toVectorLiteral(embedding: number[]): string {
    return `[${embedding.join(',')}]`;
  }

  /** Chunk text, embed each chunk, and persist with its vector. */
  async ingest({ text, source, guidelineId, journalId }: IngestParams): Promise<number> {
    const chunks = chunkText(text);
    if (!chunks.length) return 0;

    const embeddings = await this.ai.embedBatch(chunks);

    for (let i = 0; i < chunks.length; i++) {
      const id = uuid();
      const vector = this.toVectorLiteral(embeddings[i]);
      await this.prisma.$executeRawUnsafe(
        `INSERT INTO "DocumentChunk"
           ("id","source","guidelineId","journalId","content","chunkIndex","embedding","createdAt")
         VALUES ($1,$2,$3,$4,$5,$6,$7::vector,now())`,
        id,
        source,
        guidelineId ?? null,
        journalId ?? null,
        chunks[i],
        i,
        vector,
      );
    }
    this.logger.log(`Ingested ${chunks.length} chunks for ${source} (${guidelineId ?? journalId}).`);
    return chunks.length;
  }

  /** Retrieve the top-k most similar chunks (cosine). Optionally scope by ids. */
  async retrieve(
    query: string,
    opts: { guidelineId?: string; journalId?: string; k?: number } = {},
  ): Promise<RetrievedChunk[]> {
    const k = opts.k ?? 6;
    const embedding = await this.ai.embed(query);
    const vector = this.toVectorLiteral(embedding);

    const where: string[] = [];
    const params: unknown[] = [vector];
    let p = 2;
    if (opts.guidelineId) {
      where.push(`"guidelineId" = $${p++}`);
      params.push(opts.guidelineId);
    }
    if (opts.journalId) {
      where.push(`"journalId" = $${p++}`);
      params.push(opts.journalId);
    }
    const whereClause = where.length ? `WHERE ${where.join(' AND ')}` : '';
    params.push(k);

    const rows = await this.prisma.$queryRawUnsafe<
      { source: string; content: string; score: number }[]
    >(
      `SELECT "source", "content", 1 - (embedding <=> $1::vector) AS score
         FROM "DocumentChunk"
         ${whereClause}
         ORDER BY embedding <=> $1::vector
         LIMIT $${p}`,
      ...params,
    );
    return rows.map((r) => ({ ...r, score: Number(r.score) }));
  }
}
