'use client';

import * as React from 'react';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Markdown } from '@/components/markdown';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

const TARGETS = [
  { value: 'proposal', label: 'Kritik Proposal' },
  { value: 'metodologi', label: 'Evaluasi Metodologi' },
  { value: 'hasil', label: 'Evaluasi Hasil Penelitian' },
];

export default function SupervisorPage() {
  return (
    <RequireProject>
      <SupervisorInner />
    </RequireProject>
  );
}

function SupervisorInner() {
  const { selectedId } = useProjects();
  const [target, setTarget] = React.useState('proposal');
  const [extra, setExtra] = React.useState('');
  const [feedback, setFeedback] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const review = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErr('');
    try {
      const r = await api.supervisorReview(selectedId, target, extra || undefined);
      setFeedback(r.feedback);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="AI Pembimbing" description="Simulasi dosen pembimbing: kritik proposal, metodologi, dan hasil penelitian." />

      <Card className="mb-6">
        <CardContent className="grid gap-4 py-5 md:grid-cols-[240px_1fr_auto] md:items-end">
          <div>
            <Label>Fokus Review</Label>
            <Select value={target} onChange={(e) => setTarget(e.target.value)}>
              {TARGETS.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Catatan Tambahan (opsional)</Label>
            <Textarea value={extra} onChange={(e) => setExtra(e.target.value)} className="min-h-[40px]" />
          </div>
          <Button onClick={review} disabled={loading}>
            {loading ? <Spinner /> : 'Minta Review'}
          </Button>
        </CardContent>
      </Card>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {feedback ? (
        <Card>
          <CardContent className="py-6">
            <Markdown content={feedback} />
          </CardContent>
        </Card>
      ) : (
        <EmptyState title="Belum ada masukan" hint="Pilih fokus review lalu klik Minta Review." />
      )}
    </div>
  );
}
