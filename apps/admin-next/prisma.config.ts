import { config } from 'dotenv';
import { defineConfig } from 'prisma/config';

// Next.js reads .env.local; make the Prisma CLI read it too so
// `prisma generate` (postinstall) works with the same file.
config({ path: ['.env.local', '.env'] });

// `prisma generate` (el postinstall del workspace) no necesita conectar a
// la base de datos, pero el config exige una URL. En instalaciones sin
// DATABASE_URL (Netlify/Cloudflare construyendo el panel Vite o la app
// cliente, CI) se usa un marcador para no romper el `pnpm install` de
// todo el monorepo. En runtime la app sí exige la variable real.
const PLACEHOLDER_URL =
  'postgresql://placeholder:placeholder@localhost:5432/placeholder';

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL ?? PLACEHOLDER_URL,
  },
});
