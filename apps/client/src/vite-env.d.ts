/// <reference types="vite/client" />

// Declaraciones para módulos de la aplicación
declare module '@/lib/utils' {
  import { type ClassValue } from "clsx";
  export function cn(...inputs: ClassValue[]): string;
}


