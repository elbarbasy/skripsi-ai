import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';
import { StorageService } from '../../core/storage/storage.service';
import { DocumentParserService } from '../../core/documents/document-parser.service';
import { RagService } from '../../core/rag/rag.service';

@Injectable()
export class JournalsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
    private readonly parser: DocumentParserService,
    private readonly rag: RagService,
  ) {}

  list(projectId?: string) {
    return this.prisma.journal.findMany({
      where: projectId ? { projectId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  }

  async get(id: string) {
    const j = await this.prisma.journal.findUnique({ where: { id } });
    if (!j) throw new NotFoundException('Jurnal tidak ditemukan.');
    return j;
  }

  async upload(file: Express.Multer.File, projectId?: string) {
    const stored = await this.storage.upload(file.buffer, file.originalname, file.mimetype);
    const journal = await this.prisma.journal.create({
      data: {
        title: file.originalname,
        fileUrl: stored.url,
        projectId: projectId ?? null,
        status: 'PROCESSING',
        variables: [],
      },
    });

    try {
      const text = await this.parser.extractText(file.buffer, file.originalname);
      const analysis = await this.analyze(text);
      await this.rag.ingest({ text, source: 'journal', journalId: journal.id });
      return this.prisma.journal.update({
        where: { id: journal.id },
        data: {
          status: 'READY',
          title: analysis.title || file.originalname,
          summary: analysis.summary,
          method: analysis.method,
          variables: analysis.variables,
          results: analysis.results,
          rawText: text.slice(0, 100000),
        },
      });
    } catch (err) {
      await this.prisma.journal.update({ where: { id: journal.id }, data: { status: 'FAILED' } });
      throw err;
    }
  }

  private async analyze(text: string) {
    const sample = text.slice(0, 14000);
    const prompt = `Analisis jurnal ilmiah berikut. Jawab HANYA JSON valid:
{"title": string, "summary": string (ringkasan 1 paragraf), "method": string, "variables": string[], "results": string (temuan utama)}

JURNAL:
"""${sample}"""`;
    try {
      const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
        temperature: 0.2,
        maxTokens: 1500,
      });
      const json = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(json);
      return {
        title: parsed.title ?? '',
        summary: parsed.summary ?? '',
        method: parsed.method ?? '',
        variables: Array.isArray(parsed.variables) ? parsed.variables : [],
        results: parsed.results ?? '',
      };
    } catch {
      return { title: '', summary: '', method: '', variables: [] as string[], results: '' };
    }
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.journal.delete({ where: { id } });
    return { success: true };
  }
}
