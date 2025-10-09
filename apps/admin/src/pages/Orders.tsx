import { useState } from 'react';
import { useOrders } from '../hooks/order/useOrders';
import { OrdersHeader, OrdersStats, OrdersFilters, OrdersTable } from '@/components/orders';
import type { OrderTableData } from '@/types/models/orderTable';
import type { Order } from '@/types/models/order';

const Orders = () => {
  const { orders } = useOrders();
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Calcular estadísticas
  const ordersArray = orders || [];
  const totalRevenue = ordersArray.reduce((sum: number, order: Order) => sum + (order.total_cost || 0), 0);
  const completedOrders = ordersArray.filter((order: Order) => order.status === 'Completado').length;
  const pendingOrders = ordersArray.filter((order: Order) => order.status === 'Encargado').length;

  const stats = {
    total: ordersArray.length,
    completed: completedOrders,
    pending: pendingOrders,
    totalRevenue: totalRevenue
  };

  const handleViewDetails = (order: OrderTableData) => {
    console.log("Ver detalles de orden:", order.id);
  };

  return (
    <div className='space-y-6'>
      <OrdersHeader />
      
      <OrdersStats stats={stats} />

      <OrdersFilters
        searchTerm={searchValue}
        statusFilter={statusFilter}
        dateFilter={dateFilter}
        onSearchChange={setSearchValue}
        onStatusChange={setStatusFilter}
        onDateChange={setDateFilter}
      />

      <OrdersTable onViewDetails={handleViewDetails} />
    </div>
  );
};

export default Orders;
