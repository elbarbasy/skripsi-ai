# Deploy Skripsita AI — Supabase + Vercel

Panduan deploy menggunakan **Supabase** (Postgres + pgvector + Storage) dan **Vercel** (frontend, dan opsional backend).

> ⚠️ **Baca dulu — soal timeout.** Fitur generate bab bisa berjalan lama (BAB IV target <90 dtk). Function serverless Vercel dibatasi **60 dtk (Hobby)** / **s.d. 300 dtk (Pro, via `maxDuration`)**. Jika sering timeout, pakai **Opsi 2** (backend di Railway/Render) — Supabase tetap sama.

---

## 1) Setup Supabase

1. Buat project di [supabase.com](https://supabase.com) → catat **Project Ref** & **Database password**.
2. **Aktifkan pgvector**: Dashboard → *Database* → *Extensions* → cari `vector` → Enable.
   (atau jalankan `create extension if not exists vector;` di SQL Editor)
3. **Buat Storage bucket**: Dashboard → *Storage* → *New bucket* → nama `skripsita` → set **Public** (agar file DOCX/PDF bisa diunduh lewat URL).
4. Ambil kredensial:
   - *Project Settings → API*: **Project URL** (`SUPABASE_URL`) & **service_role key** (`SUPABASE_SERVICE_ROLE_KEY`).
   - *Project Settings → Database → Connection string*:
     - **Transaction (port 6543)** → `DATABASE_URL` (tambahkan `?pgbouncer=true&connection_limit=1`)
     - **Session (port 5432)** → `DIRECT_URL`

### Siapkan skema (sekali saja)
Dari komputer Anda (butuh kredensial di `apps/api/.env`):
```bash
pnpm install
pnpm --filter @skripsita/api prisma:generate
# buat semua tabel di Supabase (pakai DIRECT_URL):
pnpm --filter @skripsita/api exec prisma db push
```
Lalu buka **Supabase → SQL Editor**, tempel & jalankan isi file
[`apps/api/prisma/sql/init.sql`](apps/api/prisma/sql/init.sql) untuk menambah kolom `embedding` + index pgvector.

> Default embedding = **1536 dim** (`text-embedding-3-small`), agar bisa di-index pgvector
> (limit index = 2000 dim). Untuk `text-embedding-3-large` (3072), pakai blok **halfvec** di `init.sql`
> dan set `EMBEDDING_DIM=3072`.

---

## 2) Deploy — Opsi 1: Semua di Vercel

Buat **dua project Vercel** dari repo `elbarbasy/skripsi-ai` yang sama.

### A. Backend API
- **New Project** → import repo → **Root Directory** = `apps/api`
- Framework Preset: **Other**
- Environment Variables (Production):
  ```
  DATABASE_URL, DIRECT_URL,
  OPENAI_API_KEY, OPENAI_CHAT_MODEL, OPENAI_EMBEDDING_MODEL, EMBEDDING_DIM=1536,
  GEMINI_API_KEY (opsional), AI_PRIMARY_PROVIDER=openai,
  STORAGE_DRIVER=supabase, SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, SUPABASE_STORAGE_BUCKET=skripsita,
  API_PREFIX=api,
  CORS_ORIGIN=https://<nama-web>.vercel.app
  ```
- Deploy. Konfigurasi `apps/api/vercel.json` me-route semua request ke fungsi `api/index.ts`.
- Cek: `https://<nama-api>.vercel.app/api/health`
- (Pro) untuk durasi lebih panjang, ubah `maxDuration` di `apps/api/vercel.json` menjadi `300`.

### B. Frontend Web
- **New Project** → import repo → **Root Directory** = `apps/web`
- Framework Preset: **Next.js** (otomatis)
- Environment Variable:
  ```
  NEXT_PUBLIC_API_URL=https://<nama-api>.vercel.app/api
  ```
- Deploy → buka URL web. Setelah tahu URL web, pastikan `CORS_ORIGIN` di project API sudah sesuai, lalu redeploy API.

---

## 2) Deploy — Opsi 2 (lebih andal untuk proses panjang): Backend di Railway/Render

- **Frontend** tetap di Vercel (langkah B di atas).
- **Backend** ke [Railway](https://railway.app) / [Render](https://render.com):
  - Root: `apps/api`
  - Build: `pnpm install && pnpm --filter @skripsita/api build`
  - Start: `node dist/main.js`
  - Env vars sama seperti di atas; `PORT` diisi otomatis oleh platform (kode membaca `API_PORT`, sesuaikan bila perlu).
- Supabase (DB + Storage) sama persis — tidak ada perubahan.

Kelebihan: tidak ada batas timeout serverless, cocok untuk generate skripsi panjang.

---

## 3) Checklist Pasca-Deploy
- [ ] `GET /api/health` → `{ status: "ok", aiProviderConfigured: true }`
- [ ] Upload pedoman (PDF/DOCX) → status `READY` (cek tabel `DocumentChunk` terisi)
- [ ] Chat pedoman menjawab dengan kutipan
- [ ] Generate BAB I berhasil & tersimpan
- [ ] Export DOCX menghasilkan file yang bisa diunduh (bucket public)
- [ ] Halaman **Settings** di web menampilkan status hijau

## Catatan
- Embedding fallback lokal hanya untuk dev tanpa OpenAI key — kualitas RAG rendah. Set `OPENAI_API_KEY` untuk produksi.
- Serverless + Prisma: koneksi **pooled (pgbouncer)** wajib agar tidak kehabisan koneksi. `postinstall` menjalankan `prisma generate` saat build Vercel.
- Bila import `@skripsita/shared` bermasalah di build serverless, jalankan `pnpm --filter @skripsita/api build` lokal untuk memastikan tidak ada error tipe sebelum deploy.
