# Skripsita AI 🎓

Platform berbasis AI untuk membantu mahasiswa menyusun skripsi end-to-end — mulai dari penentuan judul, proposal, BAB I–V, literature review, analisis data, hingga simulasi sidang. Keunggulan utama: sistem **RAG** yang membaca **buku pedoman penulisan skripsi kampus** sehingga seluruh hasil mengikuti format akademik yang berlaku.

> Status: **MVP 1.0** — monorepo NestJS + Next.js 15.

---

## ✨ Fitur

| # | Fitur | Keterangan |
|---|-------|-----------|
| 1 | Upload Pedoman Kampus | PDF/DOCX → ekstraksi aturan format + index RAG |
| 2 | Chat Pedoman Kampus | Tanya jawab berbasis pedoman (RAG) |
| 3 | Thesis Project Workspace | Create/Edit/Delete + version history |
| 4 | Generator Judul | 20 judul + tingkat kesulitan + saran metode/dataset |
| 5 | Generator BAB I–V | Mesin tulisan akademik panjang (mode Ringkas→Sangat Detail) |
| 6 | Upload & Analisis Jurnal | Ringkasan, metode, variabel, hasil |
| 7 | Literature Review | Research gap, state of the art, tabel penelitian terdahulu |
| 8 | Citation Manager | APA 7 & IEEE, in-text, bibliografi, deteksi sitasi hilang |
| 9 | Analisis Data | Validitas, reliabilitas, regresi; ML & sistem pakar (AI-assisted) |
| 10 | Generator Diagram | Flowchart, Use Case, Activity, Sequence, ERD (PNG/SVG) |
| 11 | Generator Kuesioner | Variabel → indikator → pertanyaan, export CSV |
| 12 | AI Pembimbing | Kritik proposal, metodologi, hasil |
| 13 | AI Penguji | Simulasi sidang (teori/metode/implementasi) |
| 14 | Export DOCX | Susun seluruh bab + daftar pustaka sesuai format pedoman |

---

## 🏗️ Arsitektur

```
skripsita-ai/                 (pnpm workspaces + Turborepo)
├── apps/
│   ├── api/                  NestJS 10 — REST API + RAG + AI + Prisma
│   └── web/                  Next.js 15 (App Router) — dashboard
├── packages/
│   └── shared/               Tipe & enum bersama (@skripsita/shared)
├── docker-compose.yml        PostgreSQL + pgvector
└── turbo.json
```

**Stack:** Next.js 15 · TypeScript · Tailwind + Shadcn-style UI · NestJS · PostgreSQL · Prisma · **pgvector** · Supabase Storage (opsional) · OpenAI GPT‑5 (primary) / Gemini 2.5 Pro (secondary).

**RAG:** dokumen (pedoman/jurnal) → ekstraksi teks (pdf-parse/mammoth) → chunking → embedding → disimpan di kolom `vector` pgvector → retrieval cosine similarity saat chat & generate bab.

---

## ✅ Prasyarat

- **Node.js ≥ 20** dan **pnpm ≥ 9** (`npm i -g pnpm`)
- **PostgreSQL 16 dengan ekstensi pgvector** (paling mudah lewat Docker)
- **psql** CLI (untuk menjalankan `init.sql`)
- API key minimal salah satu: **OpenAI** atau **Gemini**

---

## 🚀 Setup Cepat

### 1. Install dependency
```bash
pnpm install
```

### 2. Nyalakan database (Docker)
```bash
docker compose up -d
```
Ini menjalankan PostgreSQL + pgvector di `localhost:5432` (user/pass/db: `postgres`/`postgres`/`skripsita`).

### 3. Konfigurasi environment

**Backend** — salin `apps/api/.env.example` → `apps/api/.env` dan isi key Anda:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/skripsita?schema=public"

# AI (isi salah satu / keduanya)
OPENAI_API_KEY="sk-..."
OPENAI_CHAT_MODEL="gpt-5"
OPENAI_EMBEDDING_MODEL="text-embedding-3-large"
GEMINI_API_KEY=""
GEMINI_CHAT_MODEL="gemini-2.5-pro"
AI_PRIMARY_PROVIDER="openai"
EMBEDDING_DIM="3072"

# Storage: "local" (disk) atau "supabase"
STORAGE_DRIVER="local"
SUPABASE_URL=""
SUPABASE_SERVICE_ROLE_KEY=""
SUPABASE_STORAGE_BUCKET="skripsita"

API_PORT="3001"
API_PREFIX="api"
CORS_ORIGIN="http://localhost:3000"
```

**Frontend** — salin `apps/web/.env.local.example` → `apps/web/.env.local`:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api"
```

### 4. Siapkan skema database
```bash
# buat tabel dari Prisma
pnpm db:push

# generate Prisma Client
pnpm db:generate

# aktifkan pgvector + tambah kolom embedding + index (WAJIB, sekali saja)
psql "postgresql://postgres:postgres@localhost:5432/skripsita" -f apps/api/prisma/sql/init.sql
```

> ℹ️ Kolom `embedding vector(3072)` & index HNSW dibuat lewat `init.sql` karena Prisma belum mendukung tipe `vector` secara native. Jika mengubah `EMBEDDING_DIM`, sesuaikan juga angka di `init.sql`.

### 5. Jalankan
```bash
pnpm dev
```
- Web: <http://localhost:3000>
- API: <http://localhost:3001/api> (cek `GET /api/health`)

---

## 🔑 Daftar API Key yang Diperlukan

| Variabel | Wajib? | Untuk apa | Cara dapat |
|----------|--------|-----------|------------|
| `OPENAI_API_KEY` | ya* | Chat (GPT‑5) + embedding RAG | platform.openai.com |
| `GEMINI_API_KEY` | ya* | Provider sekunder/fallback | aistudio.google.com |
| `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` | opsional | Storage cloud (jika `STORAGE_DRIVER=supabase`) | dashboard Supabase → Project Settings → API |

\* minimal salah satu dari OpenAI / Gemini. **Embedding berkualitas memakai OpenAI**; tanpa OpenAI key sistem memakai *embedding fallback lokal* (hanya untuk dev, kualitas RAG menurun).

Setelah mengubah `.env`, **restart API**. Status koneksi bisa dilihat di halaman **Settings** pada aplikasi.

---

## 📂 Penyimpanan File

- `STORAGE_DRIVER=local` (default): file disimpan di `apps/api/uploads/` dan disajikan via `GET /api/files/:key`.
- `STORAGE_DRIVER=supabase`: buat bucket (mis. `skripsita`) di Supabase Storage, set bucket public bila ingin URL langsung dapat diunduh.

---

## 🧭 Alur Pemakaian

1. **Projects** → buat project skripsi.
2. **Pedoman Kampus** → unggah PDF/DOCX (tunggu status `READY`).
3. **Jurnal** → unggah referensi; **Generator Judul** untuk ide judul.
4. **BAB I–V** → pilih mode penulisan lalu Generate (mengikuti pedoman + jurnal).
5. **Analisis Data / Diagram / Kuesioner / Sitasi** sesuai kebutuhan.
6. **AI Pembimbing & AI Penguji** untuk evaluasi & latihan sidang.
7. **Export** → unduh DOCX sesuai format kampus.

---

## 🛠️ Script Berguna

| Perintah | Fungsi |
|----------|--------|
| `pnpm dev` | Jalankan web + api (Turborepo) |
| `pnpm build` | Build semua paket |
| `pnpm db:push` | Sinkronkan skema Prisma ke DB |
| `pnpm db:generate` | Generate Prisma Client |
| `pnpm --filter @skripsita/api seed` | Seed contoh project |

---

## ⚠️ Catatan & Batasan MVP

- Pemrosesan dokumen (upload pedoman/jurnal) berjalan sinkron pada request upload — untuk dokumen besar pertimbangkan job queue.
- Analisis **statistik** (validitas, reliabilitas/Cronbach's α, regresi linear & berganda) dihitung nyata di server. Metode **ML & sistem pakar** menghasilkan interpretasi berbantuan AI berdasarkan profil dataset (bukan pelatihan model penuh).
- Export **PDF** belum diaktifkan di MVP (tersedia **DOCX**). DOCX menerapkan margin & font dari pedoman bila terdeteksi.
- pgvector: untuk `EMBEDDING_DIM > 2000` digunakan index **HNSW** (ivfflat dibatasi 2000 dim). Alternatif: pakai `text-embedding-3-small` (1536) dan ubah `EMBEDDING_DIM`.

---

## 📜 Lisensi

Proprietary — internal project. Sesuaikan sebelum distribusi.
