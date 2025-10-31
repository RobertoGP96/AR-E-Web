import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/order/useOrders';
import { OrdersHeader, OrdersStats, OrdersFilters, OrdersTable, AddProductsDialog } from '@/components/orders';
import type { CreateProductData, Order } from '@/types';
import { toast } from 'sonner';
import { useDeleteOrder } from '@/hooks/order/useDeleteOrder';
import { useMarkOrderAsPaid } from '@/hooks/order/useMarkOrderAsPaid';
import { useAddProductsToOrder } from '@/hooks/order/useAddProductsToOrder';

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


  // Hook para eliminar orden
  const deleteOrderMutation = useDeleteOrder();

  // Manejar eliminación de orden
  const handleDelete = async (order: Order) => {
    try {
      await deleteOrderMutation.mutateAsync(order.id);
      toast.success(`Pedido #${order.id} eliminado`);
    } catch (err) {
      console.error('Error eliminando orden:', err);
      toast.error('Error al eliminar el pedido');
    }
  };

  // Estado para el diálogo de añadir productos
  const [addProductsOrder, setAddProductsOrder] = useState<Order | null>(null);

  // Hooks para mutaciones reales
  const markPaidMutation = useMarkOrderAsPaid();
  const addProductsMutation = useAddProductsToOrder();

  // Handler para confirmar pago usando mutación
  const handleConfirmPayment = async (order: Order) => {
    try {
      await markPaidMutation.mutateAsync(order.id);
      toast.success(`Pago confirmado para pedido #${order.id}`);
    } catch (err) {
      console.error('Error confirmando pago:', err);
      toast.error('Error al confirmar el pago');
    }
  };

  // Handler para abrir diálogo de añadir productos
  const handleAddProducts = (order: Order) => {
    setAddProductsOrder(order);
  };

  const handleAddProductsConfirm = async (order: Order, products: CreateProductData[]) => {
    try {
      await addProductsMutation.mutateAsync({ orderId: order.id, products });
      toast.success(`Se añadió ${products.length} producto(s) al pedido #${order.id}`);
    } catch (err) {
      console.error('Error añadiendo productos:', err);
      toast.error('Error al añadir productos');
    } finally {
      setAddProductsOrder(null);
    }
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
        
        onDelete={handleDelete}
        onConfirmPayment={handleConfirmPayment}
        onAddProducts={handleAddProducts}
      />

      {/* Dialogo de añadir productos */}
      {addProductsOrder && (
        <AddProductsDialog
          order={addProductsOrder}
          open={Boolean(addProductsOrder)}
          onOpenChange={(open) => !open && setAddProductsOrder(null)}
          onAdd={handleAddProductsConfirm}
        />
      )}
    </div>
  );
};

export default Orders;
