import type { NextAuthConfig } from 'next-auth';

export type Role =
  | 'user'
  | 'agent'
  | 'accountant'
  | 'logistical'
  | 'admin'
  | 'client';

/**
 * Provider-free base config, shared between src/auth.ts (full, with the
 * Credentials provider → Prisma) and src/proxy.ts. The proxy must NOT
 * import Prisma/ws — bundling them into the middleware chunk fails —
 * so it builds its own NextAuth instance from this config only. JWT
 * decoding uses AUTH_SECRET, identical in both instances.
 */
export const authConfig = {
  // Required behind Vercel's proxy and for preview deployments.
  trustHost: true,
  session: { strategy: 'jwt' },
  pages: { signIn: '/login' },
  providers: [],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = user.id;
        token.role = user.role;
        token.phoneNumber = user.phoneNumber;
      }
      return token;
    },
    async session({ session, token }) {
      if (token.sub) session.user.id = token.sub;
      session.user.role = token.role as Role;
      session.user.phoneNumber = token.phoneNumber as string;
      return session;
    },
  },
} satisfies NextAuthConfig;
