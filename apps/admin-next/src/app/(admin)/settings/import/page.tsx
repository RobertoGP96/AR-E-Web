import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ImportClient } from './import-client';

// Las server actions de esta ruta (analizar + importar el libro) corren
// una transacción de hasta 300 s; sin esto Vercel corta la función al
// límite por defecto y el usuario ve un error opaco.
export const maxDuration = 300;

/**
 * Importación de embarques desde Excel (libros "AR&E Shipps #NNN").
 * Todo el flujo es interactivo: subir → previsualizar/omitir → importar.
 * Vive bajo /settings; solo admin (el proxy lo impone y aquí se repite).
 */
export default async function ImportPage() {
  const session = await auth();
  if (session?.user.role !== 'admin') {
    redirect('/unauthorized');
  }
  return <ImportClient />;
}
