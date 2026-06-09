import { Injectable, NotFoundException } from '@nestjs/common';
import type { ChatMessage, GuidelineRules } from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';
import { StorageService } from '../../core/storage/storage.service';
import { DocumentParserService } from '../../core/documents/document-parser.service';
import { RagService } from '../../core/rag/rag.service';
import { ragContextBlock } from '../../core/ai/prompts';

@Injectable()
export class GuidelinesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly storage: StorageService,
    private readonly parser: DocumentParserService,
    private readonly rag: RagService,
  ) {}

  list() {
    return this.prisma.campusGuideline.findMany({ orderBy: { createdAt: 'desc' } });
  }

  async get(id: string) {
    const g = await this.prisma.campusGuideline.findUnique({ where: { id } });
    if (!g) throw new NotFoundException('Pedoman tidak ditemukan.');
    return g;
  }

  async upload(file: Express.Multer.File) {
    const stored = await this.storage.upload(file.buffer, file.originalname, file.mimetype);
    const guideline = await this.prisma.campusGuideline.create({
      data: { name: file.originalname, fileUrl: stored.url, status: 'PROCESSING' },
    });

    // Process asynchronously but await here for MVP simplicity.
    try {
      const text = await this.parser.extractText(file.buffer, file.originalname);
      const rules = await this.extractRules(text);
      await this.rag.ingest({ text, source: 'guideline', guidelineId: guideline.id });
      return this.prisma.campusGuideline.update({
        where: { id: guideline.id },
        data: { status: 'READY', rules: rules as object, rawText: text.slice(0, 100000) },
      });
    } catch (err) {
      await this.prisma.campusGuideline.update({
        where: { id: guideline.id },
        data: { status: 'FAILED' },
      });
      throw err;
    }
  }

  /** Ask the LLM to extract structured formatting rules from the guideline text. */
  private async extractRules(text: string): Promise<GuidelineRules> {
    const sample = text.slice(0, 12000);
    const prompt = `Berikut potongan buku pedoman penulisan skripsi sebuah kampus. Ekstrak aturan format ke dalam JSON valid dengan field:
{
 "margins": {"top","bottom","left","right"},
 "font": {"family","size","lineSpacing"},
 "headingFormat": string,
 "citationStyle": string,
 "chapterNumbering": string,
 "bibliographyFormat": string,
 "structure": string[]
}
Jika sebuah informasi tidak ditemukan, isi null/empty. Jawab HANYA dengan JSON tanpa penjelasan.

PEDOMAN:
"""${sample}"""`;

    try {
      const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
        temperature: 0.1,
        maxTokens: 1500,
      });
      const json = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(json) as GuidelineRules;
      parsed.raw = sample.slice(0, 2000);
      return parsed;
    } catch {
      return { raw: sample.slice(0, 2000) };
    }
  }

  /** RAG chat over a specific guideline. */
  async chat(guidelineId: string, message: string, history: ChatMessage[] = []) {
    await this.get(guidelineId);
    const chunks = await this.rag.retrieve(message, { guidelineId, k: 6 });
    const context = ragContextBlock(chunks);

    const system = `Anda adalah asisten yang menjawab pertanyaan mahasiswa tentang pedoman penulisan skripsi kampusnya.
Jawab ringkas, akurat, dan SELALU berbasis konteks pedoman yang diberikan. Bila informasi tidak ada di konteks, katakan dengan jujur bahwa tidak ditemukan dalam pedoman.${context}`;

    const messages: ChatMessage[] = [...history, { role: 'user', content: message }];
    const answer = await this.ai.chat(messages, { system, temperature: 0.3 });

    return {
      answer,
      citations: chunks.map((c) => ({ source: c.source, snippet: c.content.slice(0, 200) })),
    };
  }

  async remove(id: string) {
    await this.get(id);
    await this.prisma.campusGuideline.delete({ where: { id } });
    return { success: true };
  }
}
