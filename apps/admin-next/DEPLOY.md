# Deploying `admin-next` to Vercel

This app lives in a pnpm monorepo (`apps/admin-next`). It is a Next.js 16
app using Prisma 7 (Neon driver adapter) and Auth.js v5.

## 1. Rotate the leaked credentials first

The Neon DB password and `ADMIN_CREATION_SECRET_KEY` were pasted in chat
and must be rotated before any deploy:

- Neon dashboard → Roles → reset password for `neondb_owner`.
- Render/Django `.env` → new `ADMIN_CREATION_SECRET_KEY`.

## 2. Create the Vercel project

Recommended via the dashboard (CLI also works — `npm i -g vercel`):

1. **Import** the Git repo.
2. **Root Directory**: `apps/admin-next` (Vercel auto-detects the pnpm
   workspace and installs from the repo root).
3. **Framework Preset**: Next.js (auto-detected).
4. Build/install commands: leave default — `vercel.json` pins
   `prisma generate && next build`, and `postinstall` also runs
   `prisma generate`.

## 3. Environment variables (Project → Settings → Environment Variables)

Set for **Production** and **Preview**:

| Variable | Notes |
|---|---|
| `DATABASE_URL` | Neon **pooled** connection string (rotated). |
| `AUTH_SECRET` | `openssl rand -base64 32` |
| `CLOUDINARY_CLOUD_NAME` | Optional — image upload disabled if unset. |
| `CLOUDINARY_API_KEY` | Optional. |
| `CLOUDINARY_API_SECRET` | Optional. |
| `CLOUDINARY_FOLDER` | Optional (default `ar-e-admin`). |

Do **not** set `AUTH_URL` — Auth.js v5 infers it from the Vercel URL and
`trustHost: true` is enabled in `src/auth.ts`. Set it only for a fixed
custom domain if you want canonical callback URLs.

`DATABASE_URL` must be available at build time too (Prisma generate +
`prisma.config.ts` read it). Vercel injects build env automatically.

## 4. Deploy

- Push to the production branch (or `vercel --prod` with the CLI).
- First deploy runs `pnpm install` → `postinstall` (`prisma generate`)
  → `prisma generate && next build`.

## 5. Post-deploy smoke test

1. Open the deployment URL → redirected to `/login`.
2. Log in with an existing Django user (phone or email + password).
3. Visit `/dashboard`, `/orders`, `/orders/[id]`, `/analytics`.
4. Create an order, add a product — confirm total + pay status.
5. Upload an image on a package/delivery (if Cloudinary configured).

## Notes / gotchas

- **Shared DB with Django**: this app writes Neon directly and replicates
  the Django balance/total/status recalculations in `src/lib/*`. Schema
  migrations must stay coordinated with the Django backend — do not run
  `prisma migrate` against the shared DB; use `prisma db pull` to sync
  the schema if Django changes it.
- Functions run on Node.js (Fluid Compute). The Neon serverless driver +
  `ws` are marked `serverExternalPackages` so they use native `require`.
- `outputFileTracingRoot` is set to the monorepo root so the serverless
  bundle includes workspace-hoisted dependencies.
