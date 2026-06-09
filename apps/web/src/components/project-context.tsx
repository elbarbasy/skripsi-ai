'use client';

import * as React from 'react';
import type { Project } from '@skripsita/shared';
import { api } from '@/lib/api';

interface ProjectContextValue {
  projects: Project[];
  selectedId: string | null;
  selected: Project | null;
  setSelectedId: (id: string | null) => void;
  refresh: () => Promise<void>;
  loading: boolean;
}

const ProjectContext = React.createContext<ProjectContextValue | null>(null);

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [projects, setProjects] = React.useState<Project[]>([]);
  const [selectedId, setSelectedIdState] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const data = await api.listProjects();
      setProjects(data);
      setSelectedIdState((cur) => {
        if (cur && data.some((p) => p.id === cur)) return cur;
        return data[0]?.id ?? null;
      });
    } catch {
      setProjects([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('skripsita.projectId') : null;
    if (stored) setSelectedIdState(stored);
    refresh();
  }, [refresh]);

  const setSelectedId = (id: string | null) => {
    setSelectedIdState(id);
    if (typeof window !== 'undefined') {
      if (id) localStorage.setItem('skripsita.projectId', id);
      else localStorage.removeItem('skripsita.projectId');
    }
  };

  const selected = projects.find((p) => p.id === selectedId) ?? null;

  return (
    <ProjectContext.Provider
      value={{ projects, selectedId, selected, setSelectedId, refresh, loading }}
    >
      {children}
    </ProjectContext.Provider>
  );
}

export function useProjects() {
  const ctx = React.useContext(ProjectContext);
  if (!ctx) throw new Error('useProjects must be used within ProjectProvider');
  return ctx;
}
