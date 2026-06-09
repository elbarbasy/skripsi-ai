import {
  BookOpen,
  Files,
  FlaskConical,
  GraduationCap,
  LayoutDashboard,
  Library,
  ListChecks,
  type LucideIcon,
  MessagesSquare,
  Network,
  NotebookPen,
  Quote,
  ScrollText,
  Settings,
  Sparkles,
  UserCheck,
} from 'lucide-react';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  group: string;
}

export const NAV_ITEMS: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard, group: 'Umum' },
  { href: '/projects', label: 'Projects', icon: Files, group: 'Umum' },
  { href: '/guidelines', label: 'Pedoman Kampus', icon: BookOpen, group: 'Sumber' },
  { href: '/journals', label: 'Jurnal', icon: Library, group: 'Sumber' },
  { href: '/titles', label: 'Generator Judul', icon: Sparkles, group: 'Penyusunan' },
  { href: '/literature-review', label: 'Literature Review', icon: ScrollText, group: 'Penyusunan' },
  { href: '/chapters/BAB_I', label: 'BAB I', icon: NotebookPen, group: 'Bab Skripsi' },
  { href: '/chapters/BAB_II', label: 'BAB II', icon: NotebookPen, group: 'Bab Skripsi' },
  { href: '/chapters/BAB_III', label: 'BAB III', icon: NotebookPen, group: 'Bab Skripsi' },
  { href: '/chapters/BAB_IV', label: 'BAB IV', icon: NotebookPen, group: 'Bab Skripsi' },
  { href: '/chapters/BAB_V', label: 'BAB V', icon: NotebookPen, group: 'Bab Skripsi' },
  { href: '/data-analysis', label: 'Analisis Data', icon: FlaskConical, group: 'Analisis' },
  { href: '/diagrams', label: 'Diagram', icon: Network, group: 'Analisis' },
  { href: '/questionnaire', label: 'Kuesioner', icon: ListChecks, group: 'Analisis' },
  { href: '/citations', label: 'Sitasi', icon: Quote, group: 'Referensi' },
  { href: '/supervisor', label: 'AI Pembimbing', icon: UserCheck, group: 'Simulasi' },
  { href: '/examiner', label: 'AI Penguji', icon: MessagesSquare, group: 'Simulasi' },
  { href: '/export', label: 'Export', icon: GraduationCap, group: 'Output' },
  { href: '/settings', label: 'Settings', icon: Settings, group: 'Output' },
];
