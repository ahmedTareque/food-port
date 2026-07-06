# Food Port — Deployment Guide

> **Stack**: Next.js 16 (frontend) · NestJS + Prisma (backend) · PostgreSQL 16 (Docker)  
> **Requirements**: Node ≥ 18, npm ≥ 9, Docker ≥ 24

---

## Step 1 — Clone the repository

```bash
git clone <your-repo-url> Food_Port
cd Food_Port
```

---

## Step 2 — Install all dependencies

```bash
npm run install:all
```

This runs `npm install` in both `backend/` and `frontend/` directories.

---

## Step 3 — Start PostgreSQL via Docker

```bash
docker run -d \
  --name fv-postgres \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=foodvillage \
  -p 5432:5432 \
  postgres:16-alpine
```

> If the container already exists from a prior run: `docker start fv-postgres`

---

## Step 4 — Configure backend environment

Copy the example and fill in secrets:

```bash
cp backend/.env.example backend/.env
```

Minimum required values:

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/foodvillage"
DIRECT_URL="postgresql://postgres:postgres@localhost:5432/foodvillage"
JWT_SECRET="change-me-to-a-long-random-string"
PORT=3001
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
SUPABASE_URL=http://localhost:54321
SUPABASE_SERVICE_ROLE_KEY=local-dev-placeholder
SUPABASE_STORAGE_BUCKET=menu-images
```

> `SUPABASE_*` values are only needed for production Supabase auth. Local dev uses bcrypt-based login automatically.

---

## Step 5 — Configure frontend environment

```bash
cp frontend/.env.example frontend/.env.local   # or create manually
```

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

> `NEXT_PUBLIC_SUPABASE_*` only needed for production. Local dev skips Supabase.

---

## Step 6 — Push database schema

```bash
cd backend
npx prisma db push
cd ..
```

This syncs `prisma/schema.prisma` to the running Postgres instance. Use `db push` (not `migrate dev`) — this project was initialised with `db push`.

---

## Step 7 — Seed the database

```bash
cd backend
npx ts-node src/database/seed.ts
cd ..
```

Creates:
- 10 vendor booths with full menus
- 20 dining tables
- Super admin: `admin@foodvillage.com` / `admin123`
- Vendor managers: `booth1–10@foodvillage.com` / `vendor123`
- Kitchen PIN (Burger Barn): `1234`

---

## Step 8 — Run the full project (development)

From the **root** directory:

```bash
npm run dev
```

This starts both backend (port 3001) and frontend (port 3000) concurrently with color-coded output.

| Service  | URL                        |
|----------|----------------------------|
| Frontend | http://localhost:3000      |
| Backend  | http://localhost:3001/api  |

---

## Step 9 — Verify the backend is healthy

```bash
curl http://localhost:3001/api
# Expected: 404 (no root route) — means server is running
```

Test authentication:

```bash
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"booth1@foodvillage.com","password":"vendor123"}'
```

---

## Step 10 — Access the application

| Role          | URL                                    | Credentials                         |
|---------------|----------------------------------------|--------------------------------------|
| Vendor login  | http://localhost:3000/vendor/login     | `booth1@foodvillage.com` / `vendor123` |
| Admin login   | http://localhost:3000/admin/login      | `admin@foodvillage.com` / `admin123` |
| Kitchen PIN   | http://localhost:3000/vendor/kitchen   | PIN `1234` (Burger Barn)             |

---

## Step 11 — Production: build both services

```bash
npm run build
```

This compiles TypeScript (backend) and exports Next.js static/SSR (frontend).

---

## Step 12 — Production: set environment variables

Set these on your hosting platform (Railway, Render, Vercel, etc.):

**Backend:**
```
DATABASE_URL         postgresql://user:pass@host:5432/foodvillage
JWT_SECRET           <long random string, min 32 chars>
NODE_ENV             production
PORT                 3001
FRONTEND_URL         https://your-frontend-domain.com
SUPABASE_URL         https://xxxx.supabase.co
SUPABASE_SERVICE_ROLE_KEY  <from Supabase dashboard>
```

**Frontend:**
```
NEXT_PUBLIC_API_URL              https://your-backend-domain.com/api
NEXT_PUBLIC_SUPABASE_URL         https://xxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY    <from Supabase dashboard>
```

---

## Step 13 — Production: run database migration

```bash
cd backend
npx prisma db push --accept-data-loss
```

> Use `--accept-data-loss` only on first deploy. On subsequent deploys omit it and review diffs manually.

---

## Step 14 — Production: seed initial data

```bash
cd backend
npx ts-node src/database/seed.ts
```

Only run once. Re-running is safe — all upserts, no duplicates.

---

## Step 15 — Production: start the backend

```bash
cd backend
node dist/src/main.js
```

Or with PM2 for process management:

```bash
pm2 start dist/src/main.js --name food-port-api
```

---

## Step 16 — Production: start the frontend

```bash
cd frontend
npm start
# Or: next start -p 3000
```

With PM2:

```bash
pm2 start npm --name food-port-web -- start
```

---

## Step 17 — Deploy backend to Railway (optional)

1. Push repo to GitHub
2. Create new Railway project → Add Service → GitHub Repo → select `backend/`
3. Set root directory to `backend`
4. Add a PostgreSQL plugin to the project
5. Set all backend env vars (Step 12)
6. Railway auto-builds `npm run build` and starts `node dist/src/main.js`

---

## Step 18 — Deploy frontend to Vercel (optional)

```bash
cd frontend
npx vercel --prod
```

Or connect GitHub repo in Vercel dashboard:
- Framework: Next.js (auto-detected)
- Root directory: `frontend`
- Add all `NEXT_PUBLIC_*` env vars in Vercel dashboard

---

## Step 19 — CORS configuration

Backend CORS is set via `FRONTEND_URL`. For production update it to your frontend domain:

```env
FRONTEND_URL=https://your-frontend-domain.com
```

If deploying to multiple domains, edit `backend/src/main.ts` and extend the `origin` array.

---

## Step 20 — Maintenance commands

| Task | Command |
|------|---------|
| Restart Docker Postgres | `docker restart fv-postgres` |
| Reset database (dev only) | `cd backend && npx prisma db push --force-reset` then re-seed |
| View DB with Prisma Studio | `cd backend && npx prisma studio` |
| Backend logs (PM2) | `pm2 logs food-port-api` |
| View all routes | `curl http://localhost:3001/api` and check NestJS startup logs |
| Re-run seed after reset | `cd backend && npx ts-node src/database/seed.ts` |
| Update Prisma client after schema change | `cd backend && npx prisma generate` then `db push` |

---

## Default Credentials Summary

| Account | Email | Password / PIN |
|---------|-------|----------------|
| Super Admin | `admin@foodvillage.com` | `admin123` |
| Vendor Booth 1–10 | `booth1–10@foodvillage.com` | `vendor123` |
| Kitchen PIN | — | `1234` (Burger Barn) |

> **Change all passwords before going to production.**
