'use client';

import * as React from 'react';
import { DIAGRAM_TYPES, type DiagramType } from '@skripsita/shared';
import { PageHeader } from '@/components/page-header';
import { Mermaid, downloadDiagram } from '@/components/mermaid';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label, Spinner } from '@/components/ui/misc';
import { api } from '@/lib/api';

const TYPE_LABELS: Record<DiagramType, string> = {
  flowchart: 'Flowchart',
  use_case: 'UML Use Case',
  activity: 'Activity Diagram',
  sequence: 'Sequence Diagram',
  erd: 'ERD',
};

export default function DiagramsPage() {
  const [type, setType] = React.useState<DiagramType>('flowchart');
  const [desc, setDesc] = React.useState('');
  const [mermaid, setMermaid] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');
  const containerRef = React.useRef<HTMLDivElement>(null);

  const generate = async () => {
    if (!desc.trim()) return;
    setLoading(true);
    setErr('');
    try {
      const r = await api.generateDiagram(type, desc);
      setMermaid(r.mermaid);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Generator Diagram" description="Hasilkan flowchart, use case, activity, sequence, atau ERD. Ekspor ke PNG/SVG." />

      <Card className="mb-6">
        <CardContent className="space-y-4 py-5">
          <div className="grid gap-4 md:grid-cols-[220px_1fr]">
            <div>
              <Label>Jenis Diagram</Label>
              <Select value={type} onChange={(e) => setType(e.target.value as DiagramType)}>
                {DIAGRAM_TYPES.map((t) => (
                  <option key={t} value={t}>
                    {TYPE_LABELS[t]}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Deskripsi</Label>
              <Textarea
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                placeholder="Jelaskan proses/entitas yang ingin digambarkan…"
              />
            </div>
          </div>
          <Button onClick={generate} disabled={loading}>
            {loading ? <Spinner /> : 'Generate Diagram'}
          </Button>
          {err && <p className="text-sm text-destructive">{err}</p>}
        </CardContent>
      </Card>

      {mermaid && (
        <Card>
          <CardContent className="space-y-4 py-5">
            <div className="flex justify-end gap-2">
              <Button size="sm" variant="outline" onClick={() => downloadDiagram(containerRef.current, `diagram-${type}`, 'svg')}>
                Unduh SVG
              </Button>
              <Button size="sm" variant="outline" onClick={() => downloadDiagram(containerRef.current, `diagram-${type}`, 'png')}>
                Unduh PNG
              </Button>
            </div>
            <div ref={containerRef}>
              <Mermaid chart={mermaid} />
            </div>
            <details className="text-xs text-muted-foreground">
              <summary className="cursor-pointer">Lihat kode Mermaid</summary>
              <pre className="mt-2 overflow-auto rounded-md bg-muted p-3">{mermaid}</pre>
            </details>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
