import { Body, Controller, Module, Post } from '@nestjs/common';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Injectable } from '@nestjs/common';
import type { TitleSuggestion } from '@skripsita/shared';
import { AiService } from '../../core/ai/ai.service';

class GenerateTitlesDto {
  @IsString() studyProgram!: string;
  @IsString() interest!: string;
  @IsOptional() @IsString() method?: string;
  @IsOptional() @IsInt() @Min(1) @Max(30) count?: number;
}

@Injectable()
export class TitlesService {
  constructor(private readonly ai: AiService) {}

  async generate(dto: GenerateTitlesDto): Promise<TitleSuggestion[]> {
    const count = dto.count ?? 20;
    const prompt = `Buatkan ${count} ide judul skripsi yang spesifik, realistis, dan dapat diteliti.
Program Studi: ${dto.studyProgram}
Bidang Minat: ${dto.interest}
${dto.method ? `Preferensi Metode: ${dto.method}` : ''}

Jawab HANYA dengan array JSON valid, tiap elemen:
{"title": string, "difficulty": "mudah"|"sedang"|"sulit", "suggestedMethod": string, "suggestedDataset": string}`;

    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.8,
      maxTokens: 3000,
    });
    try {
      const json = raw.replace(/```json|```/g, '').trim();
      return JSON.parse(json) as TitleSuggestion[];
    } catch {
      return [];
    }
  }
}

@Controller('titles')
class TitlesController {
  constructor(private readonly titles: TitlesService) {}

  @Post('generate')
  generate(@Body() dto: GenerateTitlesDto) {
    return this.titles.generate(dto);
  }
}

@Module({
  controllers: [TitlesController],
  providers: [TitlesService],
})
export class TitlesModule {}
