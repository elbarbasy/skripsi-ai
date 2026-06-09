import { Body, Controller, Injectable, Module, NotFoundException, Post } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { EXAMINER_MODES, type ExaminerMode, type ExaminerQuestion } from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';

class ExamineDto {
  @IsString() projectId!: string;
  @IsIn(EXAMINER_MODES as unknown as string[]) mode!: ExaminerMode;
  @IsOptional() count?: number;
}

@Injectable()
export class ExaminerService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  async examine(projectId: string, mode: ExaminerMode, count = 5): Promise<ExaminerQuestion[]> {
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
      include: { chapters: true },
    });
    if (!project) throw new NotFoundException('Project tidak ditemukan.');

    const chapterText = project.chapters
      .map((c) => `### ${c.key}\n${c.content.slice(0, 2000)}`)
      .join('\n\n');

    const focus: Record<ExaminerMode, string> = {
      teori: 'fokus menguji penguasaan teori dan landasan konseptual',
      metode: 'fokus menguji ketepatan dan pemahaman metodologi penelitian',
      implementasi: 'fokus menguji implementasi, hasil, dan kemampuan analisis',
    };

    const prompt = `Anda adalah dosen penguji sidang skripsi. ${focus[mode]}.
Buat ${count} pertanyaan sidang yang menantang untuk skripsi berikut.
Untuk tiap pertanyaan sertakan kritik singkat dan jawaban ideal.
Jawab HANYA JSON array:
[{"mode": "${mode}", "question": string, "critique": string, "idealAnswer": string}]

JUDUL: ${project.title} (${project.studyProgram ?? '-'})
ISI SKRIPSI:
${chapterText || '(belum ada bab)'}`;

    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.6,
      maxTokens: 3000,
    });
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim()) as ExaminerQuestion[];
    } catch {
      return [];
    }
  }
}

@Controller('examiner')
class ExaminerController {
  constructor(private readonly service: ExaminerService) {}

  @Post('examine')
  examine(@Body() dto: ExamineDto) {
    return this.service.examine(dto.projectId, dto.mode, dto.count);
  }
}

@Module({
  controllers: [ExaminerController],
  providers: [ExaminerService],
})
export class ExaminerModule {}
