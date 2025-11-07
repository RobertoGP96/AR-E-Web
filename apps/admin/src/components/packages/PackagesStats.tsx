import { CompactMetricsSummary } from '@/components/metrics/CompactMetricsSummary';

/**
 * Componente de estadísticas para la página de Paquetes
 * Muestra métricas clave: Total, Enviados, En Tránsito y Entregados
 */
export default function PackagesStats() {
  return <CompactMetricsSummary type="packages" />;
}
