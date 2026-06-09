import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { IsArray, IsOptional, IsString } from 'class-validator';
import type { ChatMessage } from '@skripsita/shared';
import { GuidelinesService } from './guidelines.service';

class ChatDto {
  @IsString() message!: string;
  @IsOptional() @IsArray() history?: ChatMessage[];
}

@Controller('guidelines')
export class GuidelinesController {
  constructor(private readonly guidelines: GuidelinesService) {}

  @Get()
  list() {
    return this.guidelines.list();
  }

  @Get(':id')
  get(@Param('id') id: string) {
    return this.guidelines.get(id);
  }

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(@UploadedFile() file: Express.Multer.File) {
    if (!file) throw new BadRequestException('File wajib diunggah (field "file").');
    return this.guidelines.upload(file);
  }

  @Post(':id/chat')
  chat(@Param('id') id: string, @Body() dto: ChatDto) {
    return this.guidelines.chat(id, dto.message, dto.history ?? []);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.guidelines.remove(id);
  }
}
