'use client';

import * as React from 'react';
import { Upload, Trash2, Send, FileText } from 'lucide-react';
import type { CampusGuideline } from '@skripsita/shared';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge, Spinner, EmptyState } from '@/components/ui/misc';
import { api } from '@/lib/api';
import type { ChatMessage } from '@skripsita/shared';

export default function GuidelinesPage() {
  const [guidelines, setGuidelines] = React.useState<CampusGuideline[]>([]);
  const [uploading, setUploading] = React.useState(false);
  const [active, setActive] = React.useState<CampusGuideline | null>(null);
  const [messages, setMessages] = React.useState<ChatMessage[]>([]);
  const [input, setInput] = React.useState('');
  const [sending, setSending] = React.useState(false);
  const [err, setErr] = React.useState('');
  const fileRef = React.useRef<HTMLInputElement>(null);

  const load = React.useCallback(async () => {
    const data = await api.listGuidelines();
    setGuidelines(data);
    if (!active && data.length) setActive(data[0]);
  }, [active]);

  React.useEffect(() => {
    load();
  }, [load]);

  const onUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const g = await api.uploadGuideline(file);
      await load();
      setActive(g);
    } catch (e2) {
      setErr((e2 as Error).message);
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const send = async () => {
    if (!active || !input.trim()) return;
    const userMsg: ChatMessage = { role: 'user', content: input };
    setMessages((m) => [...m, userMsg]);
    setInput('');
    setSending(true);
    try {
      const res = await api.chatGuideline(active.id, userMsg.content, messages);
      setMessages((m) => [
        ...m,
        { role: 'assistant', content: res.answer, citations: res.citations },
      ]);
    } catch (e2) {
      setMessages((m) => [...m, { role: 'assistant', content: `Error: ${(e2 as Error).message}` }]);
    } finally {
      setSending(false);
    }
  };

  const remove = async (id: string) => {
    if (!confirm('Hapus pedoman ini?')) return;
    await api.deleteGuideline(id);
    if (active?.id === id) {
      setActive(null);
      setMessages([]);
    }
    await load();
  };

  return (
    <div className="mx-auto max-w-6xl">
      <PageHeader
        title="Pedoman Kampus"
        description="Unggah buku pedoman (PDF/DOCX). Sistem mengekstrak aturan format & menyiapkan chat berbasis RAG."
        action={
          <>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.docx"
              className="hidden"
              onChange={onUpload}
              disabled={uploading}
            />
            <Button disabled={uploading} onClick={() => fileRef.current?.click()}>
              {uploading ? <Spinner /> : <Upload className="h-4 w-4" />} Unggah Pedoman
            </Button>
          </>
        }
      />
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
        <div className="space-y-3">
          {guidelines.length === 0 ? (
            <EmptyState title="Belum ada pedoman" hint="Unggah file PDF/DOCX pedoman skripsi." />
          ) : (
            guidelines.map((g) => (
              <Card
                key={g.id}
                className={`cursor-pointer ${active?.id === g.id ? 'border-primary' : ''}`}
                onClick={() => {
                  setActive(g);
                  setMessages([]);
                }}
              >
                <CardContent className="flex items-start justify-between gap-2 py-3">
                  <div className="min-w-0">
                    <p className="flex items-center gap-1.5 truncate text-sm font-medium">
                      <FileText className="h-4 w-4 shrink-0" /> {g.name}
                    </p>
                    <StatusBadge status={g.status} />
                  </div>
                  <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); remove(g.id); }}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </CardContent>
              </Card>
            ))
          )}

          {active?.rules && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Aturan Format Terdeteksi</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1 text-xs text-muted-foreground">
                {active.rules.margins && (
                  <p>Margin: {JSON.stringify(active.rules.margins)}</p>
                )}
                {active.rules.font && <p>Font: {JSON.stringify(active.rules.font)}</p>}
                {active.rules.citationStyle && <p>Sitasi: {active.rules.citationStyle}</p>}
              </CardContent>
            </Card>
          )}
        </div>

        <Card className="flex h-[70vh] flex-col">
          <CardHeader className="border-b py-3">
            <CardTitle className="text-base">
              {active ? `Chat: ${active.name}` : 'Pilih pedoman untuk memulai chat'}
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 space-y-4 overflow-y-auto py-4">
            {messages.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Contoh: “Berapa margin kiri skripsi?”, “Bagaimana format daftar pustaka?”
              </p>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                  m.role === 'user'
                    ? 'ml-auto bg-primary text-primary-foreground'
                    : 'bg-muted'
                }`}
              >
                <p className="whitespace-pre-wrap">{m.content}</p>
                {m.citations && m.citations.length > 0 && (
                  <p className="mt-1 text-[10px] opacity-70">
                    {m.citations.length} kutipan dari pedoman
                  </p>
                )}
              </div>
            ))}
            {sending && <Spinner />}
          </CardContent>
          <div className="flex gap-2 border-t p-3">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && send()}
              placeholder="Tanya tentang pedoman…"
              disabled={!active || sending}
            />
            <Button onClick={send} disabled={!active || sending} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, 'success' | 'warning' | 'muted' | 'default'> = {
    READY: 'success',
    PROCESSING: 'warning',
    PENDING: 'muted',
    FAILED: 'default',
  };
  return <Badge variant={map[status] ?? 'muted'}>{status}</Badge>;
}
