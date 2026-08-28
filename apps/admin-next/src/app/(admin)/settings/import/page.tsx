import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { ImportClient } from './import-client';

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
