'use client';

import * as React from 'react';
import { Download, FileText } from 'lucide-react';
import type { ExportJob } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api, resolveFileUrl } from '@/lib/api';
import { formatDate } from '@/lib/utils';

export default function ExportPage() {
  return (
    <RequireProject>
      <ExportInner />
    </RequireProject>
  );
}

function ExportInner() {
  const { selectedId, selected } = useProjects();
  const [jobs, setJobs] = React.useState<ExportJob[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const load = React.useCallback(() => {
    if (selectedId) api.listExports(selectedId).then(setJobs).catch(() => undefined);
  }, [selectedId]);

  React.useEffect(() => load(), [load]);

  const exportDocx = async () => {
    if (!selectedId) return;
    setLoading(true);
    setErr('');
    try {
      await api.exportDocx(selectedId);
      load();
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="Export"
        description="Susun seluruh BAB + daftar pustaka menjadi dokumen DOCX sesuai format pedoman kampus."
        action={
          <Button onClick={exportDocx} disabled={loading}>
            {loading ? <Spinner /> : <FileText className="h-4 w-4" />} Export DOCX
          </Button>
        }
      />
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      <Card className="mb-6">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Project: <span className="font-medium text-foreground">{selected?.title}</span>. Pastikan
          BAB I–V telah di-generate dan pedoman kampus terhubung agar format (margin, font, daftar
          pustaka) sesuai.
        </CardContent>
      </Card>

      {jobs.length === 0 ? (
        <EmptyState title="Belum ada file export" hint="Klik Export DOCX untuk membuat dokumen." />
      ) : (
        <div className="space-y-3">
          {jobs.map((j) => (
            <Card key={j.id}>
              <CardContent className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{j.format}</p>
                  <p className="text-xs text-muted-foreground">{formatDate(j.createdAt)}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={j.status === 'READY' ? 'success' : 'warning'}>{j.status}</Badge>
                  {j.url && (
                    <a href={resolveFileUrl(j.url)} target="_blank" rel="noreferrer" download>
                      <Button size="sm" variant="outline">
                        <Download className="h-4 w-4" /> Unduh
                      </Button>
                    </a>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
