// Shared domain & API types for Skripsita AI.
import type {
  ChapterKey,
  CitationStyle,
  DiagramType,
  DocStatus,
  ExaminerMode,
  ExportFormat,
  WritingMode,
} from './enums';

export interface Project {
  id: string;
  title: string;
  topic: string | null;
  studyProgram: string | null;
  researchMethod: string | null;
  guidelineId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CampusGuideline {
  id: string;
  name: string;
  fileUrl: string;
  status: DocStatus;
  /** Extracted formatting rules (margins, font, headings, citation, etc.) */
  rules: GuidelineRules | null;
  createdAt: string;
}

export interface GuidelineRules {
  margins?: { top?: string; bottom?: string; left?: string; right?: string };
  font?: { family?: string; size?: string; lineSpacing?: string };
  headingFormat?: string;
  citationStyle?: string;
  chapterNumbering?: string;
  bibliographyFormat?: string;
  structure?: string[];
  raw?: string;
}

export interface Journal {
  id: string;
  projectId: string | null;
  title: string;
  fileUrl: string;
  status: DocStatus;
  summary: string | null;
  method: string | null;
  variables: string[];
  results: string | null;
  createdAt: string;
}

export interface Citation {
  id: string;
  projectId: string;
  style: CitationStyle;
  authors: string;
  year: string;
  title: string;
  source: string;
  inText: string;
  bibliography: string;
  createdAt: string;
}

export interface Chapter {
  id: string;
  projectId: string;
  key: ChapterKey;
  content: string;
  version: number;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  citations?: { source: string; snippet: string }[];
}

export interface TitleSuggestion {
  title: string;
  difficulty: 'mudah' | 'sedang' | 'sulit';
  suggestedMethod: string;
  suggestedDataset: string;
}

export interface LiteratureReview {
  researchGap: string;
  stateOfTheArt: string;
  summaries: { title: string; summary: string }[];
  comparisonTable: { author: string; year: string; method: string; result: string }[];
}

export interface DataAnalysisResult {
  kind: 'statistic' | 'ml' | 'expert';
  method: string;
  summary: string;
  metrics: Record<string, number | string>;
  tables: { title: string; columns: string[]; rows: (string | number)[][] }[];
  interpretation: string;
}

export interface DiagramResult {
  type: DiagramType;
  mermaid: string;
  png?: string;
  svg?: string;
}

export interface ExaminerQuestion {
  mode: ExaminerMode;
  question: string;
  critique: string;
  idealAnswer: string;
}

export interface ExportJob {
  id: string;
  projectId: string;
  format: ExportFormat;
  url: string | null;
  status: DocStatus;
  createdAt: string;
}

// --- Request DTOs (kept minimal; runtime validation lives in NestJS) ---

export interface CreateProjectInput {
  title: string;
  topic?: string;
  studyProgram?: string;
  researchMethod?: string;
  guidelineId?: string;
}

export interface GenerateTitlesInput {
  studyProgram: string;
  interest: string;
  method?: string;
  count?: number;
}

export interface GenerateChapterInput {
  projectId: string;
  chapter: ChapterKey;
  writingMode?: WritingMode;
  extraInstructions?: string;
}

export interface GuidelineChatInput {
  guidelineId: string;
  message: string;
  history?: ChatMessage[];
}
