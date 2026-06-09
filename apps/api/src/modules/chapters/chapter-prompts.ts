import type { ChapterKey } from '@skripsita/shared';

/** Per-chapter structural instructions (Indonesian thesis convention). */
export const CHAPTER_OUTLINES: Record<ChapterKey, string> = {
  BAB_I: `BAB I PENDAHULUAN. Tulis subbab berurutan sebagai narasi:
1.1 Latar Belakang (paling panjang, bangun argumentasi dari fenomena umum ke masalah spesifik, sertakan data/penelitian terdahulu).
1.2 Rumusan Masalah (boleh berupa kalimat tanya bernomor, ini pengecualian dari larangan list).
1.3 Batasan Masalah.
1.4 Tujuan Penelitian.
1.5 Manfaat Penelitian (teoritis dan praktis).`,
  BAB_II: `BAB II TINJAUAN PUSTAKA. Tulis sebagai narasi:
2.1 Landasan Teori (uraikan teori-teori relevan secara mendalam, gunakan sitasi).
2.2 Penelitian Terdahulu (bahas beberapa penelitian, bandingkan dengan penelitian ini).
2.3 Kerangka Berpikir (narasikan alur logika penelitian).`,
  BAB_III: `BAB III METODOLOGI PENELITIAN. Tulis sebagai narasi:
3.1 Jenis dan Pendekatan Penelitian.
3.2 Metode Penelitian (sesuaikan dengan metode pada data project).
3.3 Instrumen Penelitian.
3.4 Tahapan/Prosedur Penelitian (uraikan langkah demi langkah dalam paragraf).
3.5 Teknik Analisis Data.`,
  BAB_IV: `BAB IV HASIL DAN PEMBAHASAN. Tulis sebagai narasi:
4.1 Hasil Penelitian (paparkan temuan; rujuk tabel/grafik bila ada).
4.2 Pembahasan (interpretasikan hasil, kaitkan dengan teori dan penelitian terdahulu pada BAB II).
Sertakan interpretasi mendalam, bukan sekadar mendeskripsikan angka.`,
  BAB_V: `BAB V PENUTUP. Tulis sebagai narasi:
5.1 Kesimpulan (jawab rumusan masalah berdasarkan temuan, dalam bentuk paragraf naratif).
5.2 Saran (saran praktis dan saran untuk penelitian selanjutnya, berdasarkan temuan).`,
};
