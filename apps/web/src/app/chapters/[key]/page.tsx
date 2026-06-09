'use client';

import * as React from 'react';
import { useParams } from 'next/navigation';
import { Save, Wand2 } from 'lucide-react';
import {
  CHAPTERS,
  CHAPTER_LABELS,
  WRITING_MODES,
  WRITING_MODE_TARGETS,
  DEFAULT_WRITING_MODE,
  type ChapterKey,
  type WritingMode,
} from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Markdown } from '@/components/markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label, Badge, Spinner } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function ChapterPage() {
  return (
    <RequireProject>
      <ChapterInner />
    </RequireProject>
  );
}

function ChapterInner() {
  const params = useParams();
  const key = String(params.key) as ChapterKey;
  const valid = (CHAPTERS as readonly string[]).includes(key);
  const { selectedId } = useProjects();

  const [content, setContent] = React.useState('');
  const [mode, setMode] = React.useState<WritingMode>(DEFAULT_WRITING_MODE);
  const [extra, setExtra] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [version, setVersion] = React.useState<number | null>(null);
  const [tab, setTab] = React.useState<'preview' | 'edit'>('preview');
  const [err, setErr] = React.useState('');

  const load = React.useCallback(async () => {
    if (!selectedId || !valid) return;
    const ch = await api.getChapter(selectedId, key);
    setContent(ch?.content ?? '');
    setVersion(ch?.version ?? null);
  }, [selectedId, key, valid]);

  React.useEffect(() => {
    load();
  }, [load]);

  if (!valid) return <p className="text-destructive">Bab tidak valid: {key}</p>;

  const generate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErr('');
    try {
      const ch = await api.generateChapter({ projectId: selectedId, chapter: key, writingMode: mode, extraInstructions: extra });
      setContent(ch.content);
      setVersion(ch.version);
      setTab('preview');
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!selectedId) return;
    setSaving(true);
    try {
      const ch = await api.saveChapter(selectedId, key, content);
      setVersion(ch.version);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title={CHAPTER_LABELS[key]}
        description="Generator tulisan akademik panjang berbasis pedoman & referensi (RAG)."
        action={version != null ? <Badge variant="muted">Versi {version}</Badge> : undefined}
      />

      <Card className="mb-6">
        <CardContent className="grid gap-4 py-5 md:grid-cols-[200px_1fr_auto] md:items-end">
          <div>
            <Label>Mode Penulisan</Label>
            <Select value={mode} onChange={(e) => setMode(e.target.value as WritingMode)}>
              {WRITING_MODES.map((m) => (
                <option key={m} value={m}>
                  {WRITING_MODE_TARGETS[m].label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Instruksi Tambahan (opsional)</Label>
            <input
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={extra}
              onChange={(e) => setExtra(e.target.value)}
              placeholder="mis. fokuskan pada studi kasus UMKM"
            />
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Spinner /> : <Wand2 className="h-4 w-4" />} Generate
          </Button>
        </CardContent>
      </Card>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      <div className="mb-3 flex items-center justify-between">
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {(['preview', 'edit'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`rounded-md px-3 py-1 text-sm capitalize ${tab === t ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              {t === 'preview' ? 'Pratinjau' : 'Edit'}
            </button>
          ))}
        </div>
        {content && (
          <Button variant="outline" size="sm" onClick={save} disabled={saving}>
            {saving ? <Spinner /> : <Save className="h-4 w-4" />} Simpan
          </Button>
        )}
      </div>

      <Card>
        <CardContent className="py-6">
          {!content ? (
            <p className="text-sm text-muted-foreground">
              Belum ada konten. Klik <span className="font-medium">Generate</span> untuk membuat {CHAPTER_LABELS[key]}.
            </p>
          ) : tab === 'preview' ? (
            <Markdown content={content} />
          ) : (
            <Textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              className="min-h-[60vh] font-mono text-sm"
            />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
