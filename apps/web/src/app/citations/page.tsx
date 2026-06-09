'use client';

import * as React from 'react';
import { Trash2 } from 'lucide-react';
import { CITATION_STYLES, type Citation, type CitationStyle } from '@skripsita/shared';
import { useProjects } from '@/components/project-context';
import { RequireProject } from '@/components/require-project';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { Label, Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function CitationsPage() {
  return (
    <RequireProject>
      <CitationsInner />
    </RequireProject>
  );
}

function CitationsInner() {
  const { selectedId } = useProjects();
  const [items, setItems] = React.useState<Citation[]>([]);
  const [style, setStyle] = React.useState<CitationStyle>('APA7');
  const [form, setForm] = React.useState({ authors: '', year: '', title: '', source: '' });
  const [saving, setSaving] = React.useState(false);
  const [scanText, setScanText] = React.useState('');
  const [missing, setMissing] = React.useState<{ sentence: string; reason: string }[]>([]);
  const [scanning, setScanning] = React.useState(false);

  const load = React.useCallback(() => {
    if (selectedId) api.listCitations(selectedId).then(setItems).catch(() => undefined);
  }, [selectedId]);

  React.useEffect(() => load(), [load]);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedId) return;
    setSaving(true);
    try {
      await api.createCitation({ projectId: selectedId, style, ...form });
      setForm({ authors: '', year: '', title: '', source: '' });
      load();
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    await api.deleteCitation(id);
    load();
  };

  const scan = async () => {
    if (!selectedId || !scanText.trim()) return;
    setScanning(true);
    try {
      setMissing(await api.detectMissing(selectedId, scanText));
    } finally {
      setScanning(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Citation Manager" description="Kelola sitasi APA 7 / IEEE, bibliografi, dan deteksi sitasi yang hilang." />

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-4">
          {items.length === 0 ? (
            <EmptyState title="Belum ada sitasi" hint="Tambahkan referensi di panel kanan." />
          ) : (
            items.map((c) => (
              <Card key={c.id}>
                <CardContent className="py-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <Badge variant="muted">{c.style}</Badge>
                      <p className="mt-2 text-sm">{c.bibliography}</p>
                      <p className="mt-1 text-xs text-muted-foreground">In-text: {c.inText}</p>
                    </div>
                    <Button size="icon" variant="ghost" onClick={() => remove(c.id)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Deteksi Sitasi Hilang</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Textarea
                value={scanText}
                onChange={(e) => setScanText(e.target.value)}
                placeholder="Tempel naskah skripsi untuk dipindai…"
                className="min-h-[120px]"
              />
              <Button size="sm" onClick={scan} disabled={scanning}>
                {scanning ? <Spinner /> : 'Pindai'}
              </Button>
              {missing.map((m, i) => (
                <div key={i} className="rounded-md border border-amber-300 bg-amber-50 p-2 text-xs">
                  <p className="font-medium text-amber-900">“{m.sentence}”</p>
                  <p className="text-amber-700">{m.reason}</p>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle className="text-base">Tambah Referensi</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={add} className="space-y-3">
              <div>
                <Label>Gaya Sitasi</Label>
                <Select value={style} onChange={(e) => setStyle(e.target.value as CitationStyle)}>
                  {CITATION_STYLES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Penulis</Label>
                <Input value={form.authors} onChange={(e) => setForm({ ...form, authors: e.target.value })} required />
              </div>
              <div>
                <Label>Tahun</Label>
                <Input value={form.year} onChange={(e) => setForm({ ...form, year: e.target.value })} required />
              </div>
              <div>
                <Label>Judul</Label>
                <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              </div>
              <div>
                <Label>Sumber / Penerbit</Label>
                <Input value={form.source} onChange={(e) => setForm({ ...form, source: e.target.value })} required />
              </div>
              <Button type="submit" className="w-full" disabled={saving}>
                {saving ? <Spinner /> : 'Format & Simpan'}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
