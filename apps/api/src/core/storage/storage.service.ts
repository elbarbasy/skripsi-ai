import { promises as fs } from 'node:fs';
import * as path from 'node:path';
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { v4 as uuid } from 'uuid';

export interface StoredFile {
  url: string;
  key: string;
}

@Injectable()
export class StorageService {
  private readonly logger = new Logger(StorageService.name);
  private readonly driver: 'local' | 'supabase';
  private supabase?: SupabaseClient;
  private readonly bucket: string;
  private readonly localDir = path.resolve(process.cwd(), 'uploads');

  constructor(private readonly config: ConfigService) {
    this.driver = (this.config.get<string>('STORAGE_DRIVER') as 'local' | 'supabase') ?? 'local';
    this.bucket = this.config.get<string>('SUPABASE_STORAGE_BUCKET', 'skripsita');

    if (this.driver === 'supabase') {
      const url = this.config.get<string>('SUPABASE_URL');
      const key = this.config.get<string>('SUPABASE_SERVICE_ROLE_KEY');
      if (url && key) {
        this.supabase = createClient(url, key);
      } else {
        this.logger.warn('STORAGE_DRIVER=supabase but SUPABASE_URL/KEY missing — using local disk.');
        this.driver = 'local';
      }
    }
  }

  async upload(buffer: Buffer, originalName: string, contentType: string): Promise<StoredFile> {
    const safeName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const key = `${uuid()}-${safeName}`;

    if (this.driver === 'supabase' && this.supabase) {
      const { error } = await this.supabase.storage
        .from(this.bucket)
        .upload(key, buffer, { contentType, upsert: false });
      if (error) throw error;
      const { data } = this.supabase.storage.from(this.bucket).getPublicUrl(key);
      return { url: data.publicUrl, key };
    }

    await fs.mkdir(this.localDir, { recursive: true });
    await fs.writeFile(path.join(this.localDir, key), buffer);
    return { url: `/api/files/${key}`, key };
  }

  async readLocal(key: string): Promise<Buffer> {
    return fs.readFile(path.join(this.localDir, key));
  }

  isLocal(): boolean {
    return this.driver === 'local';
  }
}
