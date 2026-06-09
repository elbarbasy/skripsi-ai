import {
  BadRequestException,
  Body,
  Controller,
  Module,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { DataAnalysisService } from './data-analysis.service';

@Controller('data-analysis')
class DataAnalysisController {
  constructor(private readonly service: DataAnalysisService) {}

  @Post('analyze')
  @UseInterceptors(FileInterceptor('file'))
  analyze(
    @UploadedFile() file: Express.Multer.File,
    @Body('kind') kind: 'statistic' | 'ml' | 'expert',
    @Body('method') method: string,
    @Body('target') target?: string,
    @Body('features') features?: string,
  ) {
    if (!file) throw new BadRequestException('Dataset wajib diunggah (field "file": CSV/XLSX).');
    const feats = features ? features.split(',').map((f) => f.trim()).filter(Boolean) : undefined;
    return this.service.analyze(file, kind ?? 'statistic', method, { target, features: feats });
  }
}

@Module({
  controllers: [DataAnalysisController],
  providers: [DataAnalysisService],
  exports: [DataAnalysisService],
})
export class DataAnalysisModule {}
