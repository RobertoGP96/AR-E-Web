import { CompactMetricsSummary } from '@/components/metrics/CompactMetricsSummary';

/**
 * Componente de estadísticas para la página de Entregas
 * Muestra métricas clave: Total, Hoy, Esta Semana y Pendientes
 */
export default function DeliveryStats() {
  return <CompactMetricsSummary type="deliveries" />;
}
