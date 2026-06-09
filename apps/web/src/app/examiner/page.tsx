'use client';

import * as React from 'react';
import { EXAMINER_MODES, type ExaminerMode, type ExaminerQuestion } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Label, Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

const MODE_LABELS: Record<ExaminerMode, string> = {
  teori: 'Penguji Teori',
  metode: 'Penguji Metode',
  implementasi: 'Penguji Implementasi',
};

export default function ExaminerPage() {
  return (
    <RequireProject>
      <ExaminerInner />
    </RequireProject>
  );
}

function ExaminerInner() {
  const { selectedId } = useProjects();
  const [mode, setMode] = React.useState<ExaminerMode>('teori');
  const [questions, setQuestions] = React.useState<ExaminerQuestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const [open, setOpen] = React.useState<number | null>(null);

  const examine = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErr('');
    try {
      setQuestions(await api.examine(selectedId, mode, 5));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="AI Penguji" description="Simulasi sidang skripsi: pertanyaan, kritik, dan jawaban ideal." />

      <Card className="mb-6">
        <CardContent className="flex flex-wrap items-end gap-4 py-5">
          <div className="w-60">
            <Label>Mode Penguji</Label>
            <Select value={mode} onChange={(e) => setMode(e.target.value as ExaminerMode)}>
              {EXAMINER_MODES.map((m) => (
                <option key={m} value={m}>
                  {MODE_LABELS[m]}
                </option>
              ))}
            </Select>
          </div>
          <Button onClick={examine} disabled={loading}>
            {loading ? <Spinner /> : 'Mulai Sidang'}
          </Button>
        </CardContent>
      </Card>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {questions.length === 0 ? (
        <EmptyState title="Belum ada pertanyaan" hint="Pilih mode lalu klik Mulai Sidang." />
      ) : (
        <div className="space-y-3">
          {questions.map((q, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-3">
                  <CardTitle className="text-base">
                    {i + 1}. {q.question}
                  </CardTitle>
                  <Badge variant="muted">{MODE_LABELS[q.mode] ?? q.mode}</Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {q.critique && (
                  <p className="text-muted-foreground">
                    <span className="font-medium text-foreground">Kritik:</span> {q.critique}
                  </p>
                )}
                <Button size="sm" variant="ghost" onClick={() => setOpen(open === i ? null : i)}>
                  {open === i ? 'Sembunyikan jawaban ideal' : 'Lihat jawaban ideal'}
                </Button>
                {open === i && (
                  <p className="rounded-md bg-muted p-3 leading-relaxed">{q.idealAnswer}</p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
