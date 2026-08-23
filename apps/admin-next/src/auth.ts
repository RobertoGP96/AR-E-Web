import NextAuth, { type DefaultSession } from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import { verifyDjangoPassword } from '@/lib/password';
import { authConfig, type Role } from '@/auth.config';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      phoneNumber: string;
      name: string;
    } & DefaultSession['user'];
  }

  interface User {
    id?: string;
    role: Role;
    phoneNumber: string;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: {
        identifier: {
          label: 'Email or phone',
          type: 'text',
        },
        password: {
          label: 'Password',
          type: 'password',
        },
      },
      async authorize(credentials) {
        const identifier = String(credentials?.identifier ?? '').trim();
        const password = String(credentials?.password ?? '');
        if (!identifier || !password) return null;

        const isEmail = identifier.includes('@');
        const user = await prisma.customUser.findFirst({
          where: isEmail
            ? { email: identifier }
            : { phoneNumber: identifier },
        });

        if (!user || !user.isActive) return null;
        if (!verifyDjangoPassword(password, user.password)) return null;

        return {
          id: user.id.toString(),
          email: user.email ?? undefined,
          name: `${user.name} ${user.lastName}`.trim(),
          phoneNumber: user.phoneNumber,
          role: user.role,
        };
      },
    }),
  ],
});
