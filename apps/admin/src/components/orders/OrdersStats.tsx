import { DollarSign, Package } from 'lucide-react';
import CardStats from '../utils/CardStats';
import { formatCurrency } from '@/types';

interface OrderStatsData {
  total: number;
  completed: number;
  pending: number;
  totalRevenue: number;
}

interface OrdersStatsProps {
  stats?: OrderStatsData;
}

const defaultStats: OrderStatsData = {
  total: 0,
  completed: 0,
  pending: 0,
  totalRevenue: 0
};

export default function OrdersStats({ stats = defaultStats }: OrdersStatsProps) {
  return (
    <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">

      <CardStats stats={
        {
          title: "Total",
          description: "Total de pedidos",
          color: "gray",
          value: `${stats.pending}`,
          icon: Package
        }
      } />

      <CardStats stats={
        {
          title: "Completados",
          description: "",
          color: "blue",
          value: `${stats.pending}`,
          icon: Package
        }
      } />


      <CardStats stats={
        {
          title: "Pendientes",
          description: "Pedidos pendientes",
          color: "yellow",
          value: `${stats.pending}`,
          icon: Package
        }
      } />

      <CardStats stats={
        {
          title: "Ingresos Totales",
          description: "",
          color: "green",
          value: `${formatCurrency(stats.totalRevenue)}`,
          icon: DollarSign
        }
      } />
    </div>
  );
}
