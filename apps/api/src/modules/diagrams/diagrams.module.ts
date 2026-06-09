import { Body, Controller, Injectable, Module, Post } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { DIAGRAM_TYPES, type DiagramResult, type DiagramType } from '@skripsita/shared';
import { AiService } from '../../core/ai/ai.service';

class GenerateDiagramDto {
  @IsIn(DIAGRAM_TYPES as unknown as string[]) type!: DiagramType;
  @IsString() description!: string;
}

const MERMAID_HINT: Record<DiagramType, string> = {
  flowchart: 'gunakan sintaks "flowchart TD"',
  use_case: 'gambarkan use case dengan flowchart/graph (aktor -> use case)',
  activity: 'gunakan "flowchart TD" untuk activity diagram (start, aksi, decision, end)',
  sequence: 'gunakan "sequenceDiagram"',
  erd: 'gunakan "erDiagram"',
};

@Injectable()
export class DiagramsService {
  constructor(private readonly ai: AiService) {}

  async generate(type: DiagramType, description: string): Promise<DiagramResult> {
    const prompt = `Hasilkan diagram Mermaid untuk: "${description}".
Jenis diagram: ${type} — ${MERMAID_HINT[type]}.
Jawab HANYA kode Mermaid valid tanpa penjelasan dan tanpa pembungkus markdown.`;
    const raw = await this.ai.chat([{ role: 'user', content: prompt }], {
      temperature: 0.4,
      maxTokens: 1200,
    });
    const mermaid = raw.replace(/```mermaid|```/g, '').trim();
    return { type, mermaid };
  }
}

@Controller('diagrams')
class DiagramsController {
  constructor(private readonly service: DiagramsService) {}

  @Post('generate')
  generate(@Body() dto: GenerateDiagramDto) {
    return this.service.generate(dto.type, dto.description);
  }
}

@Module({
  controllers: [DiagramsController],
  providers: [DiagramsService],
})
export class DiagramsModule {}
