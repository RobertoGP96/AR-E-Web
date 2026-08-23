import NextAuth from 'next-auth';
import { NextResponse } from 'next/server';
import { authConfig } from '@/auth.config';
import { canAccessPath } from '@/lib/route-roles';

// Middleware-safe NextAuth instance: JWT decode only, no providers, no
// Prisma. Decodes the same AUTH_SECRET-signed cookie as src/auth.ts.
const { auth } = NextAuth(authConfig);

const PUBLIC_PATHS = ['/login', '/api/auth', '/manifest.webmanifest'];

export const proxy = auth((req) => {
  const { pathname } = req.nextUrl;
  const isPublic = PUBLIC_PATHS.some((p) => pathname.startsWith(p));
  const isLoggedIn = Boolean(req.auth);

  if (!isLoggedIn && !isPublic) {
    const url = req.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  if (isLoggedIn && pathname === '/login') {
    const url = req.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // Page-level RBAC: /unauthorized is reachable by any authenticated
  // user; everything else in the admin area needs a matching role.
  if (
    isLoggedIn &&
    !isPublic &&
    pathname !== '/unauthorized' &&
    !canAccessPath(req.auth?.user?.role, pathname)
  ) {
    const url = req.nextUrl.clone();
    url.pathname = '/unauthorized';
    url.search = '';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
});

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)',
  ],
};
