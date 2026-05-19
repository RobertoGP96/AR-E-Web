import type { NextConfig } from 'next';
import path from 'node:path';

const nextConfig: NextConfig = {
  // pnpm monorepo: trace files from the repo root (two levels up) so the
  // serverless bundle includes workspace-hoisted dependencies.
  outputFileTracingRoot: path.join(__dirname, '../../'),

  // Use native require for these on the server instead of bundling them
  // (Prisma engine, Neon driver, ws all use Node.js native features).
  serverExternalPackages: [
    '@prisma/client',
    '@prisma/adapter-neon',
    '@neondatabase/serverless',
    'ws',
  ],

  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'res.cloudinary.com' },
    ],
  },
};

export default nextConfig;
