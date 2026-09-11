'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface MobileNavState {
  open: boolean;
  setOpen: (open: boolean) => void;
}

const MobileNavContext = createContext<MobileNavState | null>(null);

/**
 * Estado compartido del drawer móvil: lo abren tanto el botón del
 * header (MobileNav) como el hueco "Más" de la barra inferior
 * (BottomNav). Vive en el layout del área (admin).
 */
export function MobileNavProvider({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <MobileNavContext.Provider value={{ open, setOpen }}>
      {children}
    </MobileNavContext.Provider>
  );
}

export function useMobileNav(): MobileNavState {
  const ctx = useContext(MobileNavContext);
  if (!ctx) {
    throw new Error('useMobileNav debe usarse dentro de MobileNavProvider');
  }
  return ctx;
}
