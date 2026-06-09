import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { IsOptional, IsString } from 'class-validator';
import { AiService } from '../../core/ai/ai.service';

class GenerateQuestionnaireDto {
  @IsString() topic!: string;
  @IsOptional() @IsString() variables?: string; // comma separated
}

export interface QuestionnaireResult {
  variables: {
    name: string;
    indicators: { indicator: string; questions: string[] }[];
  }[];
}

@Injectable()
export class QuestionnaireService {
  constructor(private readonly ai: AiService) {}

  async generate(topic: string, variables?: string): Promise<QuestionnaireResult> {
    const prompt = `Buat kuesioner penelitian untuk topik "${topic}".
${variables ? `Gunakan variabel: ${variables}.` : 'Tentukan variabel yang relevan.'}
Untuk setiap variabel, buat 2-4 indikator, dan untuk setiap indikator buat 2-3 pertanyaan skala Likert.
Jawab HANYA JSON valid:
{"variables":[{"name": string,"indicators":[{"indicator": string,"questions": string[]}]}]}`;
    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.5,
      maxTokens: 2500,
    });
    try {
      return JSON.parse(raw.replace(/```json|```/g, '').trim());
    } catch {
      return { variables: [] };
    }
  }
}

@Controller('questionnaire')
class QuestionnaireController {
  constructor(private readonly service: QuestionnaireService) {}

  @Post('generate')
  generate(@Body() dto: GenerateQuestionnaireDto) {
    return this.service.generate(dto.topic, dto.variables);
  }
}

@Module({
  controllers: [QuestionnaireController],
  providers: [QuestionnaireService],
})
export class QuestionnaireModule {}
