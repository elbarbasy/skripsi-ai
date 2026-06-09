// Shared enums & string-literal unions for Skripsita AI.

export const WRITING_MODES = [
  'ringkas',
  'normal',
  'detail',
  'skripsi',
  'sangat_detail',
] as const;
export type WritingMode = (typeof WRITING_MODES)[number];

export const DEFAULT_WRITING_MODE: WritingMode = 'skripsi';

/** Target word-count guidance per writing mode (used to steer the LLM). */
export const WRITING_MODE_TARGETS: Record<
  WritingMode,
  { label: string; minParagraphsPerSub: number; wordsPerParagraph: [number, number] }
> = {
  ringkas: { label: 'Ringkas', minParagraphsPerSub: 2, wordsPerParagraph: [120, 200] },
  normal: { label: 'Normal', minParagraphsPerSub: 3, wordsPerParagraph: [180, 280] },
  detail: { label: 'Detail', minParagraphsPerSub: 4, wordsPerParagraph: [200, 350] },
  skripsi: { label: 'Skripsi', minParagraphsPerSub: 5, wordsPerParagraph: [200, 400] },
  sangat_detail: {
    label: 'Sangat Detail',
    minParagraphsPerSub: 6,
    wordsPerParagraph: [250, 400],
  },
};

export const CHAPTERS = ['BAB_I', 'BAB_II', 'BAB_III', 'BAB_IV', 'BAB_V'] as const;
export type ChapterKey = (typeof CHAPTERS)[number];

export const CHAPTER_LABELS: Record<ChapterKey, string> = {
  BAB_I: 'BAB I — Pendahuluan',
  BAB_II: 'BAB II — Tinjauan Pustaka',
  BAB_III: 'BAB III — Metodologi Penelitian',
  BAB_IV: 'BAB IV — Hasil dan Pembahasan',
  BAB_V: 'BAB V — Penutup',
};

export const CITATION_STYLES = ['APA7', 'IEEE'] as const;
export type CitationStyle = (typeof CITATION_STYLES)[number];

export const STAT_METHODS = [
  'validitas',
  'reliabilitas',
  'regresi_linear',
  'regresi_berganda',
] as const;
export type StatMethod = (typeof STAT_METHODS)[number];

export const ML_METHODS = [
  'naive_bayes',
  'knn',
  'svm',
  'decision_tree',
  'random_forest',
] as const;
export type MlMethod = (typeof ML_METHODS)[number];

export const EXPERT_METHODS = ['forward_chaining', 'backward_chaining', 'certainty_factor'] as const;
export type ExpertMethod = (typeof EXPERT_METHODS)[number];

export const DIAGRAM_TYPES = [
  'flowchart',
  'use_case',
  'activity',
  'sequence',
  'erd',
] as const;
export type DiagramType = (typeof DIAGRAM_TYPES)[number];

export const EXAMINER_MODES = ['teori', 'metode', 'implementasi'] as const;
export type ExaminerMode = (typeof EXAMINER_MODES)[number];

export const EXPORT_FORMATS = ['DOCX', 'PDF'] as const;
export type ExportFormat = (typeof EXPORT_FORMATS)[number];

export const DOC_STATUS = ['PENDING', 'PROCESSING', 'READY', 'FAILED'] as const;
export type DocStatus = (typeof DOC_STATUS)[number];
