'use client';

import * as React from 'react';
import {
  STAT_METHODS,
  ML_METHODS,
  EXPERT_METHODS,
  type DataAnalysisResult,
} from '@skripsita/shared';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Label, Spinner } from '@/components/ui/misc';
import { api } from '@/lib/api';

const KINDS = [
  { value: 'statistic', label: 'Statistik', methods: STAT_METHODS },
  { value: 'ml', label: 'Machine Learning', methods: ML_METHODS },
  { value: 'expert', label: 'Sistem Pakar', methods: EXPERT_METHODS },
] as const;

export default function DataAnalysisPage() {
  const [file, setFile] = React.useState<File | null>(null);
  const [kind, setKind] = React.useState<'statistic' | 'ml' | 'expert'>('statistic');
  const [method, setMethod] = React.useState<string>(STAT_METHODS[0]);
  const [target, setTarget] = React.useState('');
  const [features, setFeatures] = React.useState('');
  const [result, setResult] = React.useState<DataAnalysisResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [err, setErr] = React.useState('');

  const methods = KINDS.find((k) => k.value === kind)!.methods;

  const run = async () => {
    if (!file) {
      setErr('Pilih file dataset (CSV/XLSX) terlebih dahulu.');
      return;
    }
    setLoading(true);
    setErr('');
    try {
      const r = await api.analyzeData(file, kind, method, target || undefined, features || undefined);
      setResult(r);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader title="Analisis Data" description="Unggah dataset CSV/XLSX lalu jalankan analisis statistik, ML, atau sistem pakar." />

      <Card className="mb-6">
        <CardContent className="grid gap-4 py-5 md:grid-cols-2">
          <div>
            <Label>Dataset (CSV / XLSX)</Label>
            <Input type="file" accept=".csv,.xlsx,.xls" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          <div>
            <Label>Kategori</Label>
            <Select
              value={kind}
              onChange={(e) => {
                const k = e.target.value as typeof kind;
                setKind(k);
                setMethod(KINDS.find((x) => x.value === k)!.methods[0]);
              }}
            >
              {KINDS.map((k) => (
                <option key={k.value} value={k.value}>
                  {k.label}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Metode</Label>
            <Select value={method} onChange={(e) => setMethod(e.target.value)}>
              {methods.map((m) => (
                <option key={m} value={m}>
                  {m.replace(/_/g, ' ')}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Target / Variabel Dependen (opsional)</Label>
            <Input value={target} onChange={(e) => setTarget(e.target.value)} placeholder="nama kolom target" />
          </div>
          <div className="md:col-span-2">
            <Label>Fitur / Variabel Independen (opsional, pisahkan dengan koma)</Label>
            <Input value={features} onChange={(e) => setFeatures(e.target.value)} placeholder="kol1, kol2, kol3" />
          </div>
          <div className="md:col-span-2">
            <Button onClick={run} disabled={loading}>
              {loading ? <Spinner /> : 'Jalankan Analisis'}
            </Button>
          </div>
        </CardContent>
      </Card>
      {err && <p className="mb-4 text-sm text-destructive">{err}</p>}

      {result && (
        <div className="space-y-5">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Ringkasan — {result.method.replace(/_/g, ' ')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <p className="text-muted-foreground">{result.summary}</p>
              {Object.keys(result.metrics).length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {Object.entries(result.metrics).map(([k, v]) => (
                    <span key={k} className="rounded-md bg-muted px-2.5 py-1 text-xs">
                      <span className="font-medium">{k}:</span> {String(v)}
                    </span>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {result.tables.map((t, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">{t.title}</CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full border-collapse text-sm">
                  <thead>
                    <tr className="border-b">
                      {t.columns.map((c) => (
                        <th key={c} className="px-2 py-1.5 text-left font-medium">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {t.rows.map((row, ri) => (
                      <tr key={ri} className="border-b last:border-0">
                        {row.map((cell, ci) => (
                          <td key={ci} className="px-2 py-1.5">
                            {String(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          ))}

          {result.interpretation && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Interpretasi</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm leading-relaxed text-muted-foreground">{result.interpretation}</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
