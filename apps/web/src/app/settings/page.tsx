'use client';

import * as React from 'react';
import { CheckCircle2, XCircle } from 'lucide-react';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Spinner } from '@/components/ui/misc';
import { api } from '@/lib/api';

export default function SettingsPage() {
  const [health, setHealth] = React.useState<{ status: string; aiProviderConfigured: boolean } | null>(null);
  const [error, setError] = React.useState('');

  React.useEffect(() => {
    api.health().then(setHealth).catch((e) => setError((e as Error).message));
  }, []);

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Settings" description="Konfigurasi API key dan status koneksi backend." />

      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Status Sistem</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {error && <p className="text-destructive">Backend tidak terjangkau: {error}</p>}
          {!health && !error && <Spinner />}
          {health && (
            <>
              <Row ok label="Backend API" value={health.status} />
              <Row ok={health.aiProviderConfigured} label="AI Provider" value={health.aiProviderConfigured ? 'Terkonfigurasi' : 'Belum diset'} />
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Cara Menambahkan API Key</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm text-muted-foreground">
          <p>
            Edit file <code className="rounded bg-muted px-1">apps/api/.env</code> lalu isi salah satu
            (atau keduanya):
          </p>
          <pre className="overflow-x-auto rounded-md bg-muted p-3 text-xs text-foreground">{`OPENAI_API_KEY="sk-..."        # GPT-5 (primary)
OPENAI_EMBEDDING_MODEL="text-embedding-3-large"
GEMINI_API_KEY="..."            # Gemini 2.5 Pro (secondary)
AI_PRIMARY_PROVIDER="openai"    # openai | gemini`}</pre>
          <p>
            Untuk penyimpanan file, default <code className="rounded bg-muted px-1">STORAGE_DRIVER=local</code>.
            Untuk Supabase Storage, set ke <code className="rounded bg-muted px-1">supabase</code> dan isi
            <code className="rounded bg-muted px-1">SUPABASE_URL</code> +{' '}
            <code className="rounded bg-muted px-1">SUPABASE_SERVICE_ROLE_KEY</code>.
          </p>
          <p>Restart server API setelah mengubah .env.</p>
        </CardContent>
      </Card>
    </div>
  );
}

function Row({ ok, label, value }: { ok: boolean; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-md border p-3">
      <span className="font-medium">{label}</span>
      <span className={`flex items-center gap-1.5 ${ok ? 'text-green-600' : 'text-amber-600'}`}>
        {ok ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />} {value}
      </span>
    </div>
  );
}
