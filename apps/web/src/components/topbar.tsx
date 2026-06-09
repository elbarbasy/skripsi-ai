'use client';

import { useProjects } from './project-context';
import { Select } from './ui/select';

export function Topbar() {
  const { projects, selectedId, setSelectedId } = useProjects();

  return (
    <header className="flex h-16 items-center justify-between gap-4 border-b bg-background px-6">
      <div>
        <h1 className="text-sm font-semibold md:hidden">Skripsita AI</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="hidden text-xs text-muted-foreground sm:inline">Project aktif:</span>
        <Select
          value={selectedId ?? ''}
          onChange={(e) => setSelectedId(e.target.value || null)}
          className="w-56"
        >
          {projects.length === 0 && <option value="">Belum ada project</option>}
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </Select>
      </div>
    </header>
  );
}
