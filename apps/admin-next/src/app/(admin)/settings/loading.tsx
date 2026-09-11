import { CardSkeleton } from '@/components/ui';

/**
 * Esqueleto de las sub-vistas de /settings. La cabecera y las pestañas
 * las pinta el layout (SettingsNav) y permanecen fijas: aquí solo va el
 * contenido, para no duplicar la cabecera mientras carga.
 */
export default function SettingsLoading() {
  return (
    <div role="status" aria-label="Cargando" className="grid gap-4 pb-8">
      <CardSkeleton rows={6} />
    </div>
  );
}
