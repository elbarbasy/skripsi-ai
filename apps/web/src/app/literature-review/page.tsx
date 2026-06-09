'use client';

import * as React from 'react';
import type { LiteratureReview } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function LiteratureReviewPage() {
  return (
    <RequireProject>
      <LitInner />
    </RequireProject>
  );
}

function LitInner() {
  const { selectedId } = useProjects();
  const [data, setData] = React.useState<LiteratureReview | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const generate = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErr('');
    try {
      setData(await api.generateLitReview(selectedId));
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        title="Literature Review"
        description="Hasilkan research gap, state of the art, dan tabel penelitian terdahulu dari jurnal yang diunggah."
        action={
          <Button onClick={generate} disabled={loading}>
            {loading ? <Spinner /> : 'Generate Tinjauan'}
          </Button>
        }
      />
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {!data ? (
        <EmptyState title="Belum ada tinjauan pustaka" hint="Unggah jurnal lalu klik Generate." />
      ) : (
        <div className="space-y-5">
          <Section title="Research Gap" text={data.researchGap} />
          <Section title="State of The Art" text={data.stateOfTheArt} />

          {data.summaries?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Ringkasan Jurnal</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {data.summaries.map((s, i) => (
                  <div key={i}>
                    <p className="text-sm font-medium">{s.title}</p>
                    <p className="text-sm text-muted-foreground">{s.summary}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {data.comparisonTable?.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Tabel Penelitian Terdahulu</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {['Penulis', 'Tahun', 'Metode', 'Hasil'].map((h) => (
                        <th key={h} className="px-2 py-1.5 text-left font-medium">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.comparisonTable.map((r, i) => (
                      <tr key={i} className="border-b last:border-0 align-top">
                        <td className="px-2 py-1.5">{r.author}</td>
                        <td className="px-2 py-1.5">{r.year}</td>
                        <td className="px-2 py-1.5">{r.method}</td>
                        <td className="px-2 py-1.5">{r.result}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, text }: { title: string; text: string }) {
  if (!text) return null;
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
      </CardContent>
    </Card>
  );
}
