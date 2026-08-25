import { ImportClient } from './import-client';

/**
 * Importación de embarques desde Excel (libros "AR&E Shipps #NNN").
 * Todo el flujo es interactivo: subir → previsualizar/omitir → importar.
 */
export default function ImportPage() {
  return <ImportClient />;
}
