import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { IsString } from 'class-validator';
import type { LiteratureReview } from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';

class GenerateLitReviewDto {
  @IsString() projectId!: string;
}

@Injectable()
export class LiteratureService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async generate(projectId: string): Promise<LiteratureReview> {
    const project = await this.prisma.project.findUnique({ where: { id: projectId } });
    const journals = await this.prisma.journal.findMany({ where: { projectId } });

    const journalDigest = journals
      .map(
        (j, i) =>
          `[${i + 1}] Judul: ${j.title}\nMetode: ${j.method ?? '-'}\nVariabel: ${(j.variables ?? []).join(', ')}\nHasil: ${j.results ?? '-'}\nRingkasan: ${j.summary ?? '-'}`,
      )
      .join('\n\n');

    const prompt = `Anda menyusun tinjauan pustaka untuk skripsi berjudul/ bertopik: "${project?.title ?? ''} ${project?.topic ?? ''}".
Berdasarkan kumpulan jurnal terdahulu berikut, hasilkan JSON valid:
{
 "researchGap": string (narasi celah penelitian),
 "stateOfTheArt": string (narasi state of the art),
 "summaries": [{"title": string, "summary": string}],
 "comparisonTable": [{"author": string, "year": string, "method": string, "result": string}]
}

JURNAL TERDAHULU:
${journalDigest || '(belum ada jurnal diunggah — buat kerangka umum berbasis topik)'}`;

    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.4,
      maxTokens: 3500,
    });
    try {
      const json = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(json) as LiteratureReview;
    } catch {
      return {
        researchGap: raw,
        stateOfTheArt: '',
        summaries: [],
        comparisonTable: [],
      };
    }
  }
}

@Controller('literature-review')
class LiteratureController {
  constructor(private readonly service: LiteratureService) {}

  @Post('generate')
  generate(@Body() dto: GenerateLitReviewDto) {
    return this.service.generate(dto.projectId);
  }
}

@Module({
  controllers: [LiteratureController],
  providers: [LiteratureService],
})
export class LiteratureModule {}
