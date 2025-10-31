import { LayoutDashboard } from 'lucide-react';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { DashboardCharts } from '@/components/charts';
import { MetricsSummaryCards } from '@/components/metrics';

const Dashboard = () => {
  return (
    <div className="space-y-8">
      {/* Header Section with Logo and Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <LayoutDashboard className="h-8 w-8 text-orange-500" />
            Dashboard
          </h1>
          <p className="text-gray-600 mt-2">
            Resumen general del panel de administración
          </p>
        </div>
      </div>

      {/* Tarjetas de resumen de métricas */}
      <MetricsSummaryCards />

      {/* Gráficos de métricas */}
      <DashboardCharts />

      {/* Lista de funcionalidades del admin */}
      <AdminFeatures />
    </div>
  );
};

export default Dashboard;