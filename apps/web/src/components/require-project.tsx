'use client';

import Link from 'next/link';
import { useProjects } from './project-context';
import { EmptyState } from './ui/misc';
import { Button } from './ui/button';

export function RequireProject({ children }: { children: React.ReactNode }) {
  const { selected, loading } = useProjects();
  if (loading) return <p className="text-sm text-muted-foreground">Memuat…</p>;
  if (!selected)
    return (
      <div className="mx-auto max-w-md py-10">
        <EmptyState
          title="Belum ada project aktif"
          hint="Pilih atau buat project terlebih dahulu untuk menggunakan fitur ini."
        />
        <div className="mt-4 flex justify-center">
          <Link href="/projects">
            <Button>Ke halaman Projects</Button>
          </Link>
        </div>
      </div>
    );
  return <>{children}</>;
}
