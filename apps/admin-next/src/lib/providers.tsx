'use client';

import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sileo';
import 'sileo/styles.css';
import type { ReactNode } from 'react';

export function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      {children}
      {/* theme="light" = píldora negra (#1a1a1a), a juego con el sidebar */}
      <Toaster position="top-right" theme="light" />
    </SessionProvider>
  );
}
