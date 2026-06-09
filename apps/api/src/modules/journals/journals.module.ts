import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  Module,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JournalsService } from './journals.service';

@Controller('journals')
class JournalsController {
  constructor(private readonly journals: JournalsService) {}

  @Get()
  list(@Query('projectId') projectId?: string) {
    return this.journals.list(projectId);
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.journals.get(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File, @Query('projectId') projectId?: string) {
    if (!file) throw new BadRequestException('File wajib diunggah (field "file").');
    return this.journals.upload(file, projectId);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.journals.remove(id);
  }
}

@Module({
  controllers: [JournalsController],
  providers: [JournalsService],
  exports: [JournalsService],
})
export class JournalsModule {}
