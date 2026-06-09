import { Injectable, NotFoundException } from '@nestjs/common';
import {
  DEFAULT_WRITING_MODE,
  type ChapterKey,
  type ChatMessage,
  type WritingMode,
} from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';
import { RagService } from '../../core/rag/rag.service';
import {
  ACADEMIC_SYSTEM_PROMPT,
  ragContextBlock,
  writingModeDirective,
} from '../../core/ai/prompts';
import { CHAPTER_OUTLINES } from './chapter-prompts';

export interface GenerateChapterParams {
  projectId: string;
  chapter: ChapterKey;
  writingMode?: WritingMode;
  extraInstructions?: string;
}

@Injectable()
export class ChaptersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
    private readonly rag: RagService,
  ) {}

  list(projectId: string) {
    return this.prisma.chapter.findMany({ where: { projectId }, orderBy: { key: 'asc' } });
  }

  async get(projectId: string, key: ChapterKey) {
    return this.prisma.chapter.findUnique({ where: { projectId_key: { projectId, key } } });
  }

  async generate(params: GenerateChapterParams) {
    const { projectId, chapter } = params;
    const mode = params.writingMode ?? DEFAULT_WRITING_MODE;

    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { guideline: true, journals: true, citations: true },
    });
    if (!project) throw new NotFoundException('Project tidak ditemukan.');

    // Retrieve relevant guideline context (format rules) + journal context.
    const query = `${project.title} ${project.topic ?? ''} ${chapter}`;
    const guidelineChunks = project.guidelineId
      ? await this.rag.retrieve(query, { guidelineId: project.guidelineId, k: 4 })
      : [];

    const guidelineRules = project.guideline?.rules
      ? `Aturan format pedoman kampus: ${JSON.stringify(project.guideline.rules)}`
      : '';

    const journalContext = project.journals
      .filter((j) => j.summary)
      .map((j) => `- ${j.title}: ${j.summary} (Metode: ${j.method}; Hasil: ${j.results})`)
      .join('\n');

    // For BAB IV pull in prior chapters for coherence.
    let priorChapters = '';
    if (chapter === 'BAB_IV' || chapter === 'BAB_V') {
      const existing = await this.prisma.chapter.findMany({ where: { projectId } });
      priorChapters = existing
        .map((c) => `### ${c.key}\n${c.content.slice(0, 1500)}`)
        .join('\n\n');
    }

    const system = `${ACADEMIC_SYSTEM_PROMPT}\n\n${writingModeDirective(mode)}`;

    const userPrompt = `Tulis ${chapter} untuk skripsi berikut.

DATA PROJECT:
- Judul: ${project.title}
- Topik: ${project.topic ?? '-'}
- Program Studi: ${project.studyProgram ?? '-'}
- Metode Penelitian: ${project.researchMethod ?? '-'}

${guidelineRules}

STRUKTUR YANG HARUS DIIKUTI:
${CHAPTER_OUTLINES[chapter]}

${journalContext ? `REFERENSI JURNAL (gunakan untuk sitasi):\n${journalContext}` : ''}
${priorChapters ? `\nRINGKASAN BAB SEBELUMNYA (untuk konsistensi):\n${priorChapters}` : ''}
${params.extraInstructions ? `\nINSTRUKSI TAMBAHAN: ${params.extraInstructions}` : ''}
${ragContextBlock(guidelineChunks)}

Tulis lengkap dalam format Markdown dengan heading subbab. Patuhi semua aturan mode penulisan.`;

    const messages: ChatMessage[] = [{ role: 'user', content: userPrompt }];
    const content = await this.ai.chat(messages, { system, temperature: 0.7, maxTokens: 8000 });

    return this.save(projectId, chapter, content);
  }

  async save(projectId: string, key: ChapterKey, content: string) {
    const existing = await this.prisma.chapter.findUnique({
      where: { projectId_key: { projectId, key } },
    });
    if (existing) {
      return this.prisma.chapter.update({
        where: { projectId_key: { projectId, key } },
        data: { content, version: existing.version + 1 },
      });
    }
    return this.prisma.chapter.create({ data: { projectId, key, content } });
  }
}
