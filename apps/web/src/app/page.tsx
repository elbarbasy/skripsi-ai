'use client';

import Link from 'next/link';
import * as React from 'react';
import { BookOpen, FileText, Sparkles, Quote, FlaskConical, GraduationCap } from 'lucide-react';
import { useProjects } from '@/components/project-context';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/misc';
import { api } from '@/lib/api';

const QUICK_LINKS = [
  { href: '/guidelines', label: 'Unggah Pedoman Kampus', icon: BookOpen },
  { href: '/titles', label: 'Generate Judul', icon: Sparkles },
  { href: '/chapters/BAB_I', label: 'Tulis BAB I', icon: FileText },
  { href: '/citations', label: 'Kelola Sitasi', icon: Quote },
  { href: '/data-analysis', label: 'Analisis Data', icon: FlaskConical },
  { href: '/export', label: 'Export Skripsi', icon: GraduationCap },
];

export default function DashboardPage() {
  const { projects, selected } = useProjects();
  const [aiOk, setAiOk] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    api
      .health()
      .then((h) => setAiOk(h.aiProviderConfigured))
      .catch(() => setAiOk(false));
  }, []);

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Selamat datang di Skripsita AI 🎓</h1>
        <p className="mt-2 text-muted-foreground">
          Asisten AI untuk menyusun skripsi end-to-end mengikuti pedoman kampus Anda.
        </p>
      </div>

      {aiOk === false && (
        <Card className="mb-6 border-amber-300 bg-amber-50">
          <CardContent className="py-4 text-sm text-amber-800">
            ⚠️ AI provider belum dikonfigurasi. Tambahkan <code>OPENAI_API_KEY</code> atau{' '}
            <code>GEMINI_API_KEY</code> di <code>apps/api/.env</code> lalu restart API. Lihat halaman{' '}
            <Link href="/settings" className="font-medium underline">
              Settings
            </Link>
            .
          </CardContent>
        </Card>
      )}

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <StatCard label="Total Project" value={projects.length} />
        <StatCard label="Project Aktif" value={selected?.title ?? '—'} small />
        <StatCard
          label="Status AI"
          value={aiOk == null ? '...' : aiOk ? 'Terhubung' : 'Belum diset'}
          small
        />
      </div>

      <h2 className="mb-3 text-lg font-semibold">Aksi Cepat</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map((q) => {
          const Icon = q.icon;
          return (
            <Link key={q.href} href={q.href}>
              <Card className="transition-colors hover:border-primary/50 hover:bg-accent/40">
                <CardContent className="flex items-center gap-3 py-5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium">{q.label}</span>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>

      <h2 className="mb-3 mt-8 text-lg font-semibold">Alur Pengerjaan</h2>
      <Card>
        <CardContent className="py-5">
          <ol className="space-y-2 text-sm text-muted-foreground">
            <li>1. Buat <Link className="text-primary underline" href="/projects">Project</Link> skripsi baru.</li>
            <li>2. Unggah <Link className="text-primary underline" href="/guidelines">Pedoman Kampus</Link> (PDF/DOCX) agar hasil mengikuti format.</li>
            <li>3. Cari <Link className="text-primary underline" href="/titles">Judul</Link> & unggah <Link className="text-primary underline" href="/journals">Jurnal</Link> referensi.</li>
            <li>4. Generate <Link className="text-primary underline" href="/chapters/BAB_I">BAB I–V</Link>, analisis data, dan kelola sitasi.</li>
            <li>5. Latihan dengan <Link className="text-primary underline" href="/examiner">AI Penguji</Link> lalu <Link className="text-primary underline" href="/export">Export</Link> ke DOCX.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ label, value, small }: { label: string; value: React.ReactNode; small?: boolean }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <p className={small ? 'truncate text-lg font-semibold' : 'text-3xl font-bold'}>{value}</p>
      </CardContent>
    </Card>
  );
}
