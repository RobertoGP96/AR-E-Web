import { Users, UserCheck, Shield, UserX } from 'lucide-react';
import { MetricCard } from './MetricCard';
import { useUserMetrics } from '@/hooks/useDashboardMetrics';

/**
 * Componente para mostrar métricas de usuarios
 */
export const UserMetricsCards = () => {
  const { userMetrics, isLoading } = useUserMetrics();

  if (!userMetrics && !isLoading) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard
        title="Total de Usuarios"
        value={userMetrics?.total?.toLocaleString() || '0'}
        icon={Users}
        loading={isLoading}
      />
      <MetricCard
        title="Usuarios Activos"
        value={userMetrics?.active?.toLocaleString() || '0'}
        icon={UserCheck}
        loading={isLoading}
      />
      <MetricCard
        title="Usuarios Verificados"
        value={userMetrics?.verified?.toLocaleString() || '0'}
        icon={Shield}
        loading={isLoading}
      />
      <MetricCard
        title="Agentes"
        value={userMetrics?.agents?.toLocaleString() || '0'}
        icon={UserX}
        loading={isLoading}
      />
    </div>
  );
};