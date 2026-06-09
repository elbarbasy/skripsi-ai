import { Body, Controller, Get, Module, Post, Query } from '@nestjs/common';
import { IsString } from 'class-validator';
import { ExportService } from './export.service';

class ExportDto {
  @IsString() projectId!: string;
}

@Controller('export')
class ExportController {
  constructor(private readonly service: ExportService) {}

  @Post('docx')
  docx(@Body() dto: ExportDto) {
    return this.service.exportDocx(dto.projectId);
  }

  @Get()
  list(@Query('projectId') projectId: string) {
    return this.service.list(projectId);
  }
}

@Module({
  controllers: [ExportController],
  providers: [ExportService],
})
export class ExportModule {}
