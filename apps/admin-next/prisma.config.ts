import { config } from 'dotenv';
import { defineConfig, env } from 'prisma/config';

// Next.js reads .env.local; make the Prisma CLI read it too so
// `prisma generate` (postinstall) works with the same file.
config({ path: ['.env.local', '.env'] });

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env('DATABASE_URL'),
  },
});
