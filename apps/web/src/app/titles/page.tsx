'use client';

import * as React from 'react';
import type { TitleSuggestion } from '@skripsita/shared';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function TitlesPage() {
  const [form, setForm] = React.useState({ studyProgram: '', interest: '', method: '', count: 20 });
  const [results, setResults] = React.useState<TitleSuggestion[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const generate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErr('');
    try {
      const r = await api.generateTitles({
        studyProgram: form.studyProgram,
        interest: form.interest,
        method: form.method || undefined,
        count: Number(form.count),
      });
      setResults(r);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const diffColor: Record<string, 'success' | 'warning' | 'default'> = {
    mudah: 'success',
    sedang: 'warning',
    sulit: 'default',
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Generator Judul" description="Hasilkan ide judul skripsi lengkap dengan tingkat kesulitan, metode, dan dataset." />

      <Card className="mb-6">
        <CardContent className="py-5">
          <form onSubmit={generate} className="grid gap-4 md:grid-cols-4">
            <div className="md:col-span-1">
              <Label>Program Studi</Label>
              <Input
                value={form.studyProgram}
                onChange={(e) => setForm({ ...form, studyProgram: e.target.value })}
                placeholder="Teknik Informatika"
                required
              />
            </div>
            <div className="md:col-span-1">
              <Label>Bidang Minat</Label>
              <Input
                value={form.interest}
                onChange={(e) => setForm({ ...form, interest: e.target.value })}
                placeholder="NLP, IoT, dll"
                required
              />
            </div>
            <div className="md:col-span-1">
              <Label>Metode (opsional)</Label>
              <Input
                value={form.method}
                onChange={(e) => setForm({ ...form, method: e.target.value })}
                placeholder="mis. SVM"
              />
            </div>
            <div className="md:col-span-1">
              <Label>Jumlah</Label>
              <Input
                type="number"
                min={1}
                max={30}
                value={form.count}
                onChange={(e) => setForm({ ...form, count: Number(e.target.value) })}
              />
            </div>
            <div className="md:col-span-4">
              <Button type="submit" disabled={loading}>
                {loading ? <Spinner /> : 'Generate Judul'}
              </Button>
            </div>
          </form>
          {err && <p className="mt-3 text-sm text-destructive">{err}</p>}
        </CardContent>
      </Card>

      {results.length === 0 ? (
        <EmptyState title="Belum ada judul" hint="Isi form lalu klik Generate." />
      ) : (
        <div className="space-y-3">
          {results.map((t, i) => (
            <Card key={i}>
              <CardContent className="py-4">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-medium">{t.title}</p>
                  <Badge variant={diffColor[t.difficulty] ?? 'muted'}>{t.difficulty}</Badge>
                </div>
                <div className="mt-2 flex flex-wrap gap-3 text-xs text-muted-foreground">
                  <span>📐 Metode: {t.suggestedMethod}</span>
                  <span>🗂️ Dataset: {t.suggestedDataset}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
