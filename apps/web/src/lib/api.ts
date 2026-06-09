import type {
  CampusGuideline,
  Chapter,
  ChapterKey,
  Citation,
  CitationStyle,
  DataAnalysisResult,
  DiagramResult,
  DiagramType,
  ExaminerMode,
  ExaminerQuestion,
  ExportJob,
  Journal,
  LiteratureReview,
  Project,
  TitleSuggestion,
  WritingMode,
} from '@skripsita/shared';

const BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api';

/** Resolve a possibly-relative file URL returned by the API to an absolute URL. */
export function resolveFileUrl(url: string): string {
  if (!url) return url;
  if (url.startsWith('http')) return url;
  // API returns e.g. "/api/files/xxx"; BASE already ends with "/api".
  const origin = BASE.replace(/\/api$/, '');
  return `${origin}${url}`;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      ...(options.body && !(options.body instanceof FormData)
        ? { 'Content-Type': 'application/json' }
        : {}),
      ...options.headers,
    },
    cache: 'no-store',
  });
  if (!res.ok) {
    let detail = res.statusText;
    try {
      const data = await res.json();
      detail = data.message ?? detail;
    } catch {
      /* ignore */
    }
    throw new Error(typeof detail === 'string' ? detail : JSON.stringify(detail));
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

const json = (body: unknown) => ({ method: 'POST', body: JSON.stringify(body) });

export const api = {
  health: () => request<{ status: string; aiProviderConfigured: boolean }>('/health'),

  // Projects
  listProjects: () => request<Project[]>('/projects'),
  getProject: (id: string) => request<Project & { chapters: Chapter[] }>(`/projects/${id}`),
  createProject: (data: Partial<Project>) => request<Project>('/projects', json(data)),
  updateProject: (id: string, data: Partial<Project>) =>
    request<Project>(`/projects/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  deleteProject: (id: string) => request<void>(`/projects/${id}`, { method: 'DELETE' }),
  listVersions: (id: string) => request<any[]>(`/projects/${id}/versions`),
  snapshot: (id: string, note?: string) => request<any>(`/projects/${id}/versions`, json({ note })),

  // Guidelines
  listGuidelines: () => request<CampusGuideline[]>('/guidelines'),
  getGuideline: (id: string) => request<CampusGuideline>(`/guidelines/${id}`),
  uploadGuideline: (file: File) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<CampusGuideline>('/guidelines/upload', { method: 'POST', body: fd });
  },
  chatGuideline: (id: string, message: string, history: any[] = []) =>
    request<{ answer: string; citations: { source: string; snippet: string }[] }>(
      `/guidelines/${id}/chat`,
      json({ message, history }),
    ),
  deleteGuideline: (id: string) => request<void>(`/guidelines/${id}`, { method: 'DELETE' }),

  // Titles
  generateTitles: (data: {
    studyProgram: string;
    interest: string;
    method?: string;
    count?: number;
  }) => request<TitleSuggestion[]>('/titles/generate', json(data)),

  // Journals
  listJournals: (projectId?: string) =>
    request<Journal[]>(`/journals${projectId ? `?projectId=${projectId}` : ''}`),
  uploadJournal: (file: File, projectId?: string) => {
    const fd = new FormData();
    fd.append('file', file);
    return request<Journal>(`/journals/upload${projectId ? `?projectId=${projectId}` : ''}`, {
      method: 'POST',
      body: fd,
    });
  },
  deleteJournal: (id: string) => request<void>(`/journals/${id}`, { method: 'DELETE' }),

  // Literature review
  generateLitReview: (projectId: string) =>
    request<LiteratureReview>('/literature-review/generate', json({ projectId })),

  // Citations
  listCitations: (projectId: string) => request<Citation[]>(`/citations?projectId=${projectId}`),
  createCitation: (data: Partial<Citation> & { projectId: string; style: CitationStyle }) =>
    request<Citation>('/citations', json(data)),
  formatCitation: (style: CitationStyle, reference: string) =>
    request<{ inText: string; bibliography: string }>('/citations/format', json({ style, reference })),
  detectMissing: (projectId: string, text: string) =>
    request<{ sentence: string; reason: string }[]>('/citations/detect-missing', json({ projectId, text })),
  deleteCitation: (id: string) => request<void>(`/citations/${id}`, { method: 'DELETE' }),

  // Chapters
  listChapters: (projectId: string) => request<Chapter[]>(`/chapters?projectId=${projectId}`),
  getChapter: (projectId: string, key: ChapterKey) =>
    request<Chapter | null>(`/chapters/${projectId}/${key}`),
  generateChapter: (data: {
    projectId: string;
    chapter: ChapterKey;
    writingMode?: WritingMode;
    extraInstructions?: string;
  }) => request<Chapter>('/chapters/generate', json(data)),
  saveChapter: (projectId: string, key: ChapterKey, content: string) =>
    request<Chapter>(`/chapters/${projectId}/${key}`, { method: 'PUT', body: JSON.stringify({ content }) }),

  // Data analysis
  analyzeData: (
    file: File,
    kind: 'statistic' | 'ml' | 'expert',
    method: string,
    target?: string,
    features?: string,
  ) => {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('kind', kind);
    fd.append('method', method);
    if (target) fd.append('target', target);
    if (features) fd.append('features', features);
    return request<DataAnalysisResult>('/data-analysis/analyze', { method: 'POST', body: fd });
  },

  // Diagrams
  generateDiagram: (type: DiagramType, description: string) =>
    request<DiagramResult>('/diagrams/generate', json({ type, description })),

  // Questionnaire
  generateQuestionnaire: (topic: string, variables?: string) =>
    request<{ variables: any[] }>('/questionnaire/generate', json({ topic, variables })),

  // Supervisor / Examiner
  supervisorReview: (projectId: string, target: string, extra?: string) =>
    request<{ feedback: string }>('/supervisor/review', json({ projectId, target, extra })),
  examine: (projectId: string, mode: ExaminerMode, count?: number) =>
    request<ExaminerQuestion[]>('/examiner/examine', json({ projectId, mode, count })),

  // Export
  exportDocx: (projectId: string) => request<ExportJob>('/export/docx', json({ projectId })),
  listExports: (projectId: string) => request<ExportJob[]>(`/export?projectId=${projectId}`),
};
