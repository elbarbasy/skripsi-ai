import { Body, Controller, Get, Module, Param, Post, Put, Query } from '@nestjs/common';
import { IsIn, IsOptional, IsString } from 'class-validator';
import { CHAPTERS, WRITING_MODES, type ChapterKey, type WritingMode } from '@skripsita/shared';
import { ChaptersService } from './chapters.service';

class GenerateChapterDto {
  @IsString() projectId!: string;
  @IsIn(CHAPTERS as unknown as string[]) chapter!: ChapterKey;
  @IsOptional() @IsIn(WRITING_MODES as unknown as string[]) writingMode?: WritingMode;
  @IsOptional() @IsString() extraInstructions?: string;
}

class SaveChapterDto {
  @IsString() content!: string;
}

@Controller('chapters')
class ChaptersController {
  constructor(private readonly chapters: ChaptersService) {}

  @Get()
  list(@Query('projectId') projectId: string) {
    return this.chapters.list(projectId);
  }

  @Get(':projectId/:key')
  get(@Param('projectId') projectId: string, @Param('key') key: ChapterKey) {
    return this.chapters.get(projectId, key);
  }

  @Post('generate')
  generate(@Body() dto: GenerateChapterDto) {
    return this.chapters.generate(dto);
  }

  @Put(':projectId/:key')
  save(
    @Param('projectId') projectId: string,
    @Param('key') key: ChapterKey,
    @Body() dto: SaveChapterDto,
  ) {
    return this.chapters.save(projectId, key, dto.content);
  }
}

@Module({
  controllers: [ChaptersController],
  providers: [ChaptersService],
  exports: [ChaptersService],
})
export class ChaptersModule {}
