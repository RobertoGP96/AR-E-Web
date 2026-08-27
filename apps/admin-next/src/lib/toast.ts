import { sileo } from 'sileo';
import type { ReactNode } from 'react';

// Adaptador con la firma de sonner (`toast.success('...', { description })`)
// sobre sileo, que recibe un único objeto de opciones.
interface ToastOptions {
  description?: ReactNode | string;
  duration?: number | null;
}

function opts(title: string | undefined, options?: ToastOptions) {
  return { title, ...options };
}

export const toast = {
  success: (title?: string, options?: ToastOptions) => sileo.success(opts(title, options)),
  error: (title?: string, options?: ToastOptions) => sileo.error(opts(title, options)),
  info: (title?: string, options?: ToastOptions) => sileo.info(opts(title, options)),
  warning: (title?: string, options?: ToastOptions) => sileo.warning(opts(title, options)),
  dismiss: (id: string) => sileo.dismiss(id),
};
