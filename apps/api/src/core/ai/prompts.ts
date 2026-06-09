import { WRITING_MODE_TARGETS, type WritingMode } from '@skripsita/shared';

export const ACADEMIC_SYSTEM_PROMPT = `Anda adalah asisten penulisan skripsi akademik berbahasa Indonesia yang sangat berpengalaman.
Tugas Anda menghasilkan tulisan ilmiah yang panjang, mengalir, dan natural sesuai kaidah akademik Indonesia.

ATURAN MUTLAK:
- Tulis dalam bentuk NARASI/PARAGRAF akademik. DILARANG menggunakan bullet list atau penomoran kecuali secara eksplisit diminta (mis. rumusan masalah).
- DILARANG menghasilkan paragraf pendek. Setiap paragraf harus utuh dan substantif.
- Gunakan bahasa Indonesia baku, formal, dan objektif (hindari kata "saya"/"kita").
- Gunakan transisi antar paragraf agar tulisan koheren.
- Jika konteks pedoman kampus diberikan, IKUTI struktur, gaya sitasi, dan format yang tertera.
- Jika referensi/jurnal diberikan, integrasikan sebagai sitasi dalam teks dengan gaya yang diminta.
- Jangan mengarang data statistik spesifik bila tidak disediakan; nyatakan asumsi bila perlu.`;

export function writingModeDirective(mode: WritingMode): string {
  const t = WRITING_MODE_TARGETS[mode];
  return `MODE PENULISAN: ${t.label}.
- Setiap subbab minimal ${t.minParagraphsPerSub} paragraf.
- Setiap paragraf ${t.wordsPerParagraph[0]}–${t.wordsPerParagraph[1]} kata.
- Pertahankan kedalaman dan kelengkapan argumen sesuai mode ini.`;
}

export function ragContextBlock(chunks: { source: string; content: string }[]): string {
  if (!chunks.length) return '';
  const joined = chunks
    .map((c, i) => `[#${i + 1} | sumber: ${c.source}]\n${c.content}`)
    .join('\n\n---\n\n');
  return `\n\nKONTEKS REFERENSI (gunakan bila relevan, jangan menyalin mentah):\n${joined}\n`;
}
