import { Injectable, BadRequestException } from '@nestjs/common';
import * as mammoth from 'mammoth';
// pdf-parse is CommonJS; require avoids ESM interop issues.
// eslint-disable-next-line @typescript-eslint/no-var-requires
const pdfParse = require('pdf-parse');

@Injectable()
export class DocumentParserService {
  /** Extract plain text from a PDF or DOCX buffer. */
  async extractText(buffer: Buffer, filename: string): Promise<string> {
    const ext = filename.toLowerCase().split('.').pop();
    if (ext === 'pdf') {
      const data = await pdfParse(buffer);
      return (data.text ?? '').trim();
    }
    if (ext === 'docx' || ext === 'doc') {
      const { value } = await mammoth.extractRawText({ buffer });
      return (value ?? '').trim();
    }
    throw new BadRequestException(`Format file tidak didukung: .${ext} (gunakan PDF atau DOCX).`);
  }
}
