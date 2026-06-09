'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import type { Journal } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { UploadButton } from '@/components/upload-button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function JournalsPage() {
  return (
    <RequireProject>
      <JournalsInner />
    </RequireProject>
  );
}

function JournalsInner() {
  const { selectedId } = useProjects();
  const [journals, setJournals] = React.useState<Journal[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    if (selectedId) api.listJournals(selectedId).then(setJournals).catch(() => undefined);
  }, [selectedId]);

  React.useEffect(() => load(), [load]);

  const upload = async (file: File) => {
    setLoading(true);
    setErr('');
    try {
      await api.uploadJournal(file, selectedId ?? undefined);
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus jurnal ini?')) return;
    await api.deleteJournal(id);
    load();
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        title="Jurnal"
        description="Unggah jurnal (PDF/DOCX). AI mengekstrak ringkasan, metode, variabel, dan hasil."
        action={<UploadButton accept=".pdf,.docx" onFile={upload} loading={loading} label="Unggah Jurnal" />}
      />
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {journals.length === 0 ? (
        <EmptyState title="Belum ada jurnal" hint="Unggah jurnal referensi untuk project ini." />
      ) : (
        <div className="space-y-4">
          {journals.map((j) => (
            <Card key={j.id}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">{j.title}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={j.status === 'READY' ? 'success' : 'warning'}>{j.status}</Badge>
                    <Button size="icon" variant="ghost" onClick={() => remove(j.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {j.summary && <p className="text-muted-foreground">{j.summary}</p>}
                <div className="flex flex-wrap gap-2">
                  {j.method && <Badge variant="muted">Metode: {j.method}</Badge>}
                  {(j.variables ?? []).map((v) => (
                    <Badge key={v} variant="default">
                      {v}
                    </Badge>
                  ))}
                </div>
                {j.results && (
                  <p className="text-xs text-muted-foreground">
                    <span className="font-medium">Hasil:</span> {j.results}
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
