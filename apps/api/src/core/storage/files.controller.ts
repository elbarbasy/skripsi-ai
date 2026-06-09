import { Controller, Get, Param, Res, NotFoundException } from '@nestjs/common';
import type { Response } from 'express';
import { StorageService } from './storage.service';

@Controller('files')
export class FilesController {
  constructor(private readonly storage: StorageService) {}

  @Get(':key')
  async getFile(@Param('key') key: string, @Res() res: Response) {
    if (!this.storage.isLocal()) {
      throw new NotFoundException('File serving aktif hanya untuk STORAGE_DRIVER=local.');
    }
    try {
      const buf = await this.storage.readLocal(key);
      res.send(buf);
    } catch {
      throw new NotFoundException('File tidak ditemukan.');
    }
  }
}
