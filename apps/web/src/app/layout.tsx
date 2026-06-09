import type { Metadata } from 'next';
import './globals.css';
import { ProjectProvider } from '@/components/project-context';
import { Sidebar } from '@/components/sidebar';
import { Topbar } from '@/components/topbar';

export const metadata: Metadata = {
  title: 'Skripsita AI — Asisten Skripsi Berbasis AI',
  description:
    'Platform AI untuk menyusun skripsi end-to-end mengikuti pedoman kampus: judul, BAB I–V, literature review, analisis data, hingga sidang.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body>
        <ProjectProvider>
          <div className="flex h-screen overflow-hidden">
            <Sidebar />
            <div className="flex flex-1 flex-col overflow-hidden">
              <Topbar />
              <main className="flex-1 overflow-y-auto bg-muted/30 p-6">{children}</main>
            </div>
          </div>
        </ProjectProvider>
      </body>
    </html>
  );
}
