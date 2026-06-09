'use client';

import * as React from 'react';
import { Trash2, Plus, History } from 'lucide-react';
import type { CampusGuideline } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label, Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ProjectsPage() {
  const { projects, refresh, selectedId, setSelectedId } = useProjects();
  const [guidelines, setGuidelines] = React.useState<CampusGuideline[]>([]);
  const [form, setForm] = React.useState({
    title: '',
    topic: '',
    studyProgram: '',
    researchMethod: '',
    guidelineId: '',
  });
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.listGuidelines().then(setGuidelines).catch(() => undefined);
  }, []);

  const create = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title.trim()) return;
    setSaving(true);
    setError('');
    try {
      const created = await api.createProject({
        ...form,
        guidelineId: form.guidelineId || undefined,
      });
      await refresh();
      setSelectedId(created.id);
      setForm({ title: '', topic: '', studyProgram: '', researchMethod: '', guidelineId: '' });
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus project ini beserta seluruh bab dan sitasinya?')) return;
    await api.deleteProject(id);
    await refresh();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Projects" description="Kelola project skripsi Anda." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {projects.length === 0 ? (
            <EmptyState title="Belum ada project" hint="Buat project pertama Anda di sebelah kanan." />
          ) : (
            projects.map((p) => (
              <Card key={p.id} className={selectedId === p.id ? 'border-primary' : ''}>
                <CardContent className="flex items-start justify-between gap-4 py-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="truncate font-semibold">{p.title}</h3>
                      {selectedId === p.id && <Badge>Aktif</Badge>}
                    </div>
                    <p className="mt-0.5 truncate text-sm text-muted-foreground">
                      {p.studyProgram || '—'} · {p.researchMethod || 'metode belum diset'}
                    </p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Diperbarui {formatDate(p.updatedAt)}
                    </p>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {selectedId !== p.id && (
                      <Button size="sm" variant="outline" onClick={() => setSelectedId(p.id)}>
                        Pilih
                      </Button>
                    )}
                    <Button size="icon" variant="ghost" onClick={() => remove(p.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Plus className="h-4 w-4" /> Project Baru
            </CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={create} className="space-y-3">
              <div>
                <Label>Judul / Topik *</Label>
                <Input
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Judul skripsi"
                  required
                />
              </div>
              <div>
                <Label>Program Studi</Label>
                <Input
                  value={form.studyProgram}
                  onChange={(e) => setForm({ ...form, studyProgram: e.target.value })}
                  placeholder="mis. Teknik Informatika"
                />
              </div>
              <div>
                <Label>Metode Penelitian</Label>
                <Input
                  value={form.researchMethod}
                  onChange={(e) => setForm({ ...form, researchMethod: e.target.value })}
                  placeholder="mis. Kuantitatif / ML"
                />
              </div>
              <div>
                <Label>Topik / Bidang</Label>
                <Input
                  value={form.topic}
                  onChange={(e) => setForm({ ...form, topic: e.target.value })}
                  placeholder="ringkasan topik"
                />
              </div>
              <div>
                <Label>Pedoman Kampus</Label>
                <Select
                  value={form.guidelineId}
                  onChange={(e) => setForm({ ...form, guidelineId: e.target.value })}
                >
                  <option value="">— tanpa pedoman —</option>
                  {guidelines.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </Select>
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Spinner /> : 'Buat Project'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
