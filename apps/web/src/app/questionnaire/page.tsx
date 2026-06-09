'use client';

import * as React from 'react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

interface QVar {
  name: string;
  indicators: { indicator: string; questions: string[] }[];
}

export default function QuestionnairePage() {
  const [topic, setTopic] = React.useState('');
  const [variables, setVariables] = React.useState('');
  const [result, setResult] = React.useState<QVar[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const generate = async () => {
    if (!topic.trim()) return;
    setLoading(true);
    setErr('');
    try {
      const r = await api.generateQuestionnaire(topic, variables || undefined);
      setResult((r.variables as QVar[]) ?? []);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const exportCsv = () => {
    const rows: string[] = ['Variabel,Indikator,Pertanyaan'];
    result.forEach((v) =>
      v.indicators.forEach((ind) =>
        ind.questions.forEach((q) => rows.push(`"${v.name}","${ind.indicator}","${q}"`)),
      ),
    );
    const blob = new Blob([rows.join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'kuesioner.csv';
    a.click();
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader title="Generator Kuesioner" description="Hasilkan variabel, indikator, dan butir pertanyaan. Ekspor ke CSV (Excel/Google Form)." />

      <Card className="mb-6">
        <CardContent className="space-y-4 py-5">
          <div>
            <Label>Topik Penelitian</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="mis. Pengaruh kualitas layanan terhadap kepuasan" />
          </div>
          <div>
            <Label>Variabel (opsional, pisahkan koma)</Label>
            <Input value={variables} onChange={(e) => setVariables(e.target.value)} placeholder="Kualitas Layanan, Kepuasan" />
          </div>
          <div className="flex gap-2">
            <Button onClick={generate} disabled={loading}>
              {loading ? <Spinner /> : 'Generate Kuesioner'}
            </Button>
            {result.length > 0 && (
              <Button variant="outline" onClick={exportCsv}>
                Export CSV
              </Button>
            )}
          </div>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </CardContent>
      </Card>

      {result.length === 0 ? (
        <EmptyState title="Belum ada kuesioner" />
      ) : (
        <div className="space-y-4">
          {result.map((v, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{v.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {v.indicators.map((ind, j) => (
                  <div key={j}>
                    <p className="text-sm font-medium">{ind.indicator}</p>
                    <ol className="ml-5 list-decimal text-sm text-muted-foreground">
                      {ind.questions.map((q, k) => (
                        <li key={k}>{q}</li>
                      ))}
                    </ol>
                  </div>
                ))}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
