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

## 2) Deploy — Opsi 2 (REKOMENDASI): Backend di Railway + Frontend di Vercel

Opsi ini lebih andal karena backend berjalan sebagai **proses terus-menerus** (bukan serverless function), tanpa batas timeout. Cocok untuk generate bab panjang.

### A. Backend di Railway

1. Buat akun di [railway.app](https://railway.app) → **New Project** → **Deploy from GitHub repo** → pilih `elbarbasy/skripsi-ai`.
2. Railway akan mendeteksi monorepo. Set:
   - **Root Directory**: `apps/api`
   - (Atau Railway membaca `railway.toml` otomatis jika file terdeteksi)
3. Tambahkan **Environment Variables** (Settings → Variables):
   ```
   DATABASE_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1
   DIRECT_URL=postgresql://postgres.<ref>:<password>@aws-0-<region>.pooler.supabase.com:5432/postgres
   OPENAI_API_KEY=sk-...
   OPENAI_CHAT_MODEL=gpt-5
   OPENAI_EMBEDDING_MODEL=text-embedding-3-small
   EMBEDDING_DIM=1536
   AI_PRIMARY_PROVIDER=openai
   GEMINI_API_KEY=      (opsional)
   STORAGE_DRIVER=supabase
   SUPABASE_URL=https://<ref>.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=eyJ...
   SUPABASE_STORAGE_BUCKET=skripsita
   API_PORT=3001
   API_PREFIX=api
   CORS_ORIGIN=https://<nama-web>.vercel.app
   NODE_ENV=production
   ```
4. Railway build & deploy otomatis. Buka **Settings → Networking → Generate Domain** → Anda mendapat URL seperti `https://skripsi-api-production.up.railway.app`.
5. Test: `GET https://<railway-url>/api/health` → harus `{ "status": "ok", "aiProviderConfigured": true }`.

> 💡 File `railway.toml` sudah disediakan di `apps/api/railway.toml`. Railway membacanya otomatis.
> Alternatif: gunakan `Dockerfile` yang juga sudah tersedia di `apps/api/Dockerfile`.

### B. Frontend di Vercel (sama seperti sebelumnya)

1. **New Project** di Vercel → import repo → **Root Directory** = `apps/web`
2. Framework: **Next.js** (otomatis terdeteksi)
3. Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://<railway-url>/api
   ```
4. Deploy.
5. **Penting:** setelah tahu URL web (mis. `https://skripsi-ai.vercel.app`), update `CORS_ORIGIN` di Railway lalu redeploy.

### Alternatif: Render

Render juga bisa:
1. **New Web Service** → connect repo → Root = `apps/api`
2. Build Command: `pnpm install --filter @skripsita/api... && pnpm --filter @skripsita/api prisma:generate && pnpm --filter @skripsita/api build`
3. Start Command: `node dist/main.js`
4. Env vars sama.
5. Free tier punya cold starts; Starter ($7/mo) lebih andal.

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
