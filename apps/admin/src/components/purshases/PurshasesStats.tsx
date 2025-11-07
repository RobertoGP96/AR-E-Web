import { CompactMetricsSummary } from '@/components/metrics/CompactMetricsSummary';

/**
 * Componente de estadísticas para la página de Compras
 * Muestra métricas clave: Total, Este Mes, Esta Semana y Hoy
 */
export default function PurshasesStats() {
  return <CompactMetricsSummary type="purchases" />;
}
