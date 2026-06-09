import {
  Body,
  Controller,
  Delete,
  Get,
  Injectable,
  Module,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import type { CitationStyle } from '@skripsita/shared';
import { CITATION_STYLES } from '@skripsita/shared';
import { PrismaService } from '../../prisma/prisma.service';
import { AiService } from '../../core/ai/ai.service';

class CreateCitationDto {
  @IsString() projectId!: string;
  @IsIn(CITATION_STYLES as unknown as string[]) style!: CitationStyle;
  @IsString() authors!: string;
  @IsString() year!: string;
  @IsString() title!: string;
  @IsString() source!: string;
}

class FormatCitationDto {
  @IsIn(CITATION_STYLES as unknown as string[]) style!: CitationStyle;
  @IsString() reference!: string; // free text reference to be formatted
}

class DetectMissingDto {
  @IsString() projectId!: string;
  @IsString() text!: string;
}

@Injectable()
export class CitationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly ai: AiService,
  ) {}

  list(projectId: string) {
    return this.prisma.citation.findMany({ where: { projectId }, orderBy: { createdAt: 'desc' } });
  }

  async create(dto: CreateCitationDto) {
    const { inText, bibliography } = await this.format(dto.style, dto);
    return this.prisma.citation.create({ data: { ...dto, inText, bibliography } });
  }

  async remove(id: string) {
    await this.prisma.citation.delete({ where: { id } });
    return { success: true };
  }

  /** Format an in-text citation + bibliography entry in the requested style. */
  async format(
    style: CitationStyle,
    ref: { authors?: string; year?: string; title?: string; source?: string; reference?: string },
  ): Promise<{ inText: string; bibliography: string }> {
    const desc = ref.reference
      ? ref.reference
      : `Penulis: ${ref.authors}; Tahun: ${ref.year}; Judul: ${ref.title}; Sumber: ${ref.source}`;
    const prompt = `Format referensi berikut dalam gaya ${style}.
Jawab HANYA JSON: {"inText": string, "bibliography": string}
Referensi: ${desc}`;
    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.1,
      maxTokens: 500,
    });
    try {
      const json = raw.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(json);
      return { inText: parsed.inText ?? '', bibliography: parsed.bibliography ?? '' };
    } catch {
      return { inText: '', bibliography: raw };
    }
  }

  /** Detect statements in the text that likely need a citation. */
  async detectMissing(projectId: string, text: string) {
    const citations = await this.prisma.citation.findMany({ where: { projectId } });
    const known = citations.map((c) => c.inText).join('; ');
    const prompt = `Berikut naskah skripsi. Identifikasi kalimat/klaim yang membutuhkan sitasi namun belum memilikinya.
Sitasi yang sudah ada: ${known || '(belum ada)'}
Jawab JSON array: [{"sentence": string, "reason": string}]

NASKAH:
"""${text.slice(0, 12000)}"""`;
    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.2,
      maxTokens: 1500,
    });
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return [];
    }
  }
}

@Controller('citations')
class CitationsController {
  constructor(private readonly service: CitationsService) {}

  @Get()
  list(@Query('projectId') projectId: string) {
    return this.service.list(projectId);
  }

  @Post()
  create(@Body() dto: CreateCitationDto) {
    return this.service.create(dto);
  }

  @Post('format')
  format(@Body() dto: FormatCitationDto) {
    return this.service.format(dto.style, { reference: dto.reference });
  }

  @Post('detect-missing')
  detect(@Body() dto: DetectMissingDto) {
    return this.service.detectMissing(dto.projectId, dto.text);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}

@Module({
  controllers: [CitationsController],
  providers: [CitationsService],
  exports: [CitationsService],
})
export class CitationsModule {}
