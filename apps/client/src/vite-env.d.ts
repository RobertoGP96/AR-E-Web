/// <reference types="vite/client" />

// Declaraciones para módulos de la aplicación
declare module '@/lib/utils' {
  import { type ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}

// Declaración explícita para el módulo lib/index que permite todas las exportaciones
declare module '@/lib' {
  export * from '@/lib/api-client';
  export * from '@/lib/utils';
  export * from '@/lib/format-date';
  export * from '@/lib/format-phone';
  export * from '@/lib/format-usd';
  export * from '@/lib/format-weight-lb';
}


