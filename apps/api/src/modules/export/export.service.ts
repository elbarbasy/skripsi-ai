import { Injectable, NotFoundException } from '@nestjs/common';
import {
  AlignmentType,
  Document,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  convertMillimetersToTwip,
} from 'docx';
import { CHAPTER_LABELS, type ChapterKey, type GuidelineRules } from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../core/storage/storage.service';

@Injectable()
export class ExportService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async exportDocx(projectId: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { chapters: true, guideline: true, citations: true },
    });
    if (!project) throw new NotFoundException('Project tidak ditemukan.');

    const rules = (project.guideline?.rules as GuidelineRules | null) ?? {};
    const fontFamily = rules.font?.family ?? 'Times New Roman';
    const fontSizePt = parseInt(rules.font?.size ?? '12', 10) || 12;
    const margins = {
      top: this.cmToTwip(rules.margins?.top, 3),
      bottom: this.cmToTwip(rules.margins?.bottom, 3),
      left: this.cmToTwip(rules.margins?.left, 4),
      right: this.cmToTwip(rules.margins?.right, 3),
    };

    const order: ChapterKey[] = ['BAB_I', 'BAB_II', 'BAB_III', 'BAB_IV', 'BAB_V'];
    const sorted = [...project.chapters].sort(
      (a, b) => order.indexOf(a.key as ChapterKey) - order.indexOf(b.key as ChapterKey),
    );

    const children: Paragraph[] = [];

    // Title page
    children.push(
      new Paragraph({
        alignment: AlignmentType.CENTER,
        spacing: { before: 2000, after: 400 },
        children: [new TextRun({ text: project.title.toUpperCase(), bold: true, size: 28 })],
      }),
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [new TextRun({ text: project.studyProgram ?? '', size: fontSizePt * 2 })],
      }),
      new Paragraph({ text: '', pageBreakBefore: false }),
    );

    // Chapters
    for (const ch of sorted) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          children: [new TextRun({ text: CHAPTER_LABELS[ch.key as ChapterKey], bold: true })],
        }),
      );
      for (const block of this.markdownToParagraphs(ch.content, fontFamily, fontSizePt)) {
        children.push(block);
      }
    }

    // Bibliography
    if (project.citations.length) {
      children.push(
        new Paragraph({
          heading: HeadingLevel.HEADING_1,
          pageBreakBefore: true,
          children: [new TextRun({ text: 'DAFTAR PUSTAKA', bold: true })],
        }),
      );
      for (const c of project.citations) {
        children.push(
          new Paragraph({
            spacing: { after: 120 },
            indent: { hanging: convertMillimetersToTwip(10) },
            children: [new TextRun({ text: c.bibliography, font: fontFamily, size: fontSizePt * 2 })],
          }),
        );
      }
    }

    const doc = new Document({
      styles: {
        default: {
          document: { run: { font: fontFamily, size: fontSizePt * 2 } },
        },
      },
      sections: [{ properties: { page: { margin: margins } }, children }],
    });

    const buffer = await Packer.toBuffer(doc);
    const fileName = `${project.title.replace(/[^a-zA-Z0-9]/g, '_')}.docx`;
    const stored = await this.storage.upload(
      buffer,
      fileName,
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    );

    return this.prisma.exportJob.create({
      data: { projectId, format: 'DOCX', url: stored.url, status: 'READY' },
    });
  }

  private cmToTwip(value: string | undefined, fallbackCm: number): number {
    const cm = value ? parseFloat(value) : fallbackCm;
    return convertMillimetersToTwip((Number.isFinite(cm) ? cm : fallbackCm) * 10);
  }

  /** Convert simple Markdown (headings + paragraphs) into docx paragraphs. */
  private markdownToParagraphs(md: string, font: string, sizePt: number): Paragraph[] {
    const lines = md.split('\n');
    const out: Paragraph[] = [];
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;
      const headingMatch = trimmed.match(/^(#{2,4})\s+(.*)$/);
      if (headingMatch) {
        out.push(
          new Paragraph({
            heading: HeadingLevel.HEADING_2,
            children: [new TextRun({ text: headingMatch[2], bold: true, font })],
          }),
        );
      } else {
        out.push(
          new Paragraph({
            alignment: AlignmentType.JUSTIFIED,
            spacing: { line: 360, after: 120 },
            indent: { firstLine: convertMillimetersToTwip(12.7) },
            children: [new TextRun({ text: trimmed.replace(/[*_`#]/g, ''), font, size: sizePt * 2 })],
          }),
        );
      }
    }
    return out;
  }

  list(projectId: string) {
    return this.prisma.exportJob.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }
}
