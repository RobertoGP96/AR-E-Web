import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/order/useOrders';
import { OrdersHeader, OrdersStats, OrdersFilters, OrdersTable } from '@/components/orders';
import type { Order } from '@/types';
import { toast } from 'sonner';

const Orders = () => {
  const [searchValue, setSearchValue] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFilter, setDateFilter] = useState("");

  // Obtener órdenes de la API
  const { orders, isLoading, error } = useOrders();

  // Filtrar órdenes basado en la búsqueda
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];

    // Filtrar por término de búsqueda
    if (searchValue.trim()) {
      const searchLower = searchValue.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchLower) ||
        order.client?.full_name?.toLowerCase().includes(searchLower) ||
        order.client?.email?.toLowerCase().includes(searchLower) ||
        order.sales_manager?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por estado
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }

    // TODO: Implementar filtro por fecha si es necesario
    // if (dateFilter) { ... }

    return filtered;
  }, [orders, searchValue, statusFilter]);

  // Calcular estadísticas
  const stats = useMemo(() => {
    const ordersArray = orders || [];
    const totalRevenue = ordersArray.reduce((sum: number, order: Order) => sum + (order.total_cost || 0), 0);
    const completedOrders = ordersArray.filter((order: Order) => order.status === 'Completado').length;
    const pendingOrders = ordersArray.filter((order: Order) => order.status === 'Encargado').length;

    return {
      total: ordersArray.length,
      completed: completedOrders,
      pending: pendingOrders,
      totalRevenue: totalRevenue
    };
  }, [orders]);

  // Manejar edición de orden
  const handleEdit = (order: Order) => {
    console.log("Editar orden:", order.id);
    toast.info("Función de edición en desarrollo");
    // TODO: Implementar diálogo de edición
  };

  // Manejar eliminación de orden
  const handleDelete = (order: Order) => {
    console.log("Eliminar orden:", order.id);
    toast.info("Función de eliminación en desarrollo");
    // TODO: Implementar confirmación y eliminación
  };

  // Mostrar error si existe
  if (error) {
    toast.error('Error al cargar pedidos', {
      description: error.message || 'No se pudieron cargar los pedidos'
    });
  }

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

      <OrdersTable 
        orders={filteredOrders}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
    </div>
  );
};

export default Orders;
