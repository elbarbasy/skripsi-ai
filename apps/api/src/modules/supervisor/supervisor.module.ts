import { Body, Controller, Injectable, Module, NotFoundException, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';

type ReviewTarget = 'proposal' | 'metodologi' | 'hasil';

class ReviewDto {
  @IsString() projectId!: string;
  @IsIn(['proposal', 'metodologi', 'hasil']) target!: ReviewTarget;
  @IsOptional() @IsString() extra?: string;
}

@Injectable()
export class SupervisorService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async review(projectId: string, target: ReviewTarget, extra?: string) {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { chapters: true },
    });
    if (!project) throw new NotFoundException('Project tidak ditemukan.');

    const chapterText = project.chapters
      .map((c) => `### ${c.key}\n${c.content.slice(0, 3000)}`)
      .join('\n\n');

    const focus: Record<ReviewTarget, string> = {
      proposal: 'kritisi kelayakan proposal: latar belakang, rumusan masalah, tujuan, dan kebaruan.',
      metodologi: 'evaluasi metodologi penelitian: ketepatan metode, instrumen, populasi/sampel, dan validitas.',
      hasil: 'evaluasi hasil penelitian dan pembahasan: kedalaman analisis, keterkaitan dengan teori, dan kesimpulan.',
    };

    const system = `Anda adalah dosen pembimbing skripsi yang tegas namun konstruktif. Berikan kritik tajam, tunjukkan kelemahan, dan beri saran perbaikan konkret. Gunakan bahasa Indonesia akademik.`;
    const prompt = `Project: ${project.title} (${project.studyProgram ?? '-'}; metode: ${project.researchMethod ?? '-'}).
Tugas review: ${focus[target]}
${extra ? `Catatan tambahan: ${extra}` : ''}

ISI SKRIPSI:
${chapterText || '(belum ada bab yang ditulis — beri arahan awal)'}

Berikan: (1) penilaian umum, (2) daftar kelemahan utama dengan penjelasan, (3) saran perbaikan konkret, (4) pertanyaan reflektif untuk mahasiswa.`;

    const feedback = await this.ai.chat([{ role: 'user', content: prompt }], {
      system,
      temperature: 0.6,
      maxTokens: 3000,
    });
    return { feedback };
  }
}

@Controller('supervisor')
class SupervisorController {
  constructor(private readonly service: SupervisorService) {}

  @Post('review')
  review(@Body() dto: ReviewDto) {
    return this.service.review(dto.projectId, dto.target, dto.extra);
  }
}

@Module({
  controllers: [SupervisorController],
  providers: [SupervisorService],
})
export class SupervisorModule {}
