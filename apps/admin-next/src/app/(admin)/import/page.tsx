import { redirect } from 'next/navigation';

/** La importación de Excel se movió a Configuración → Importar Excel. */
export default function ImportRedirect() {
  redirect('/settings/import');
}
