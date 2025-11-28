import { useState, useMemo } from 'react';
import { useOrders } from '../hooks/order/useOrders';
import { OrdersHeader, OrdersFilters, OrdersTable, AddProductsDialog, EditOrderDialog } from '@/components/orders';
import type { OrderFilterState } from '@/components/filters/order-filters';
import type { CreateProductData, Order } from '@/types';
import { toast } from 'sonner';
import { useDeleteOrder } from '@/hooks/order/useDeleteOrder';
import { useAddProductsToOrder } from '@/hooks/order/useAddProductsToOrder';
import { CompactMetricsSummary } from '@/components/metrics';

const Orders = () => {
  const [filters, setFilters] = useState<OrderFilterState>({ search: '', status: 'all', pay_status: 'all', sales_manager: 'all', date_from: '', date_to: '' });

  // Obtener órdenes de la API
  const { orders, isLoading, error } = useOrders(filters);

  // Filtrar órdenes basado en la búsqueda
  const filteredOrders = useMemo(() => {
    if (!orders) return [];

    let filtered = [...orders];

    // Filtrar por término de búsqueda
    if (filters.search?.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(order => 
        order.id.toString().includes(searchLower) ||
        order.client?.full_name?.toLowerCase().includes(searchLower) ||
        order.client?.email?.toLowerCase().includes(searchLower) ||
        order.sales_manager?.full_name?.toLowerCase().includes(searchLower)
      );
    }

    // Filtrar por estado
    if (filters.status && filters.status !== 'all') {
      filtered = filtered.filter(order => order.status === filters.status);
    }

    // Filtro por fecha de creación (igualar día)
    if (filters.date_from || filters.date_to) {
      filtered = filtered.filter(order => {
        try {
          const created = new Date(order.created_at);
          const createdDateStr = created.toISOString().split('T')[0];
          if (filters.date_from && filters.date_to) {
            return createdDateStr >= filters.date_from && createdDateStr <= filters.date_to;
          }
          if (filters.date_from) return createdDateStr >= filters.date_from;
          if (filters.date_to) return createdDateStr <= filters.date_to;
          return true;
        } catch (err) {
          return false;
        }
      });
    }

    return filtered;
  }, [orders, filters]);

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

  // Estado para el diálogo de edición
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);

  // Hooks para mutaciones reales
  const addProductsMutation = useAddProductsToOrder();

  // Handler para abrir diálogo de añadir productos
  const handleAddProducts = (order: Order) => {
    setAddProductsOrder(order);
  };

  // Handler para abrir diálogo de edición
  const handleEdit = (order: Order) => {
    setEditingOrder(order);
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
      
      {/* Métricas compactas de órdenes */}
      <CompactMetricsSummary type="orders" />


      <OrdersFilters
        searchTerm={filters.search ?? ''}
        filters={filters}
        onSearchChange={(value) => setFilters(prev => ({ ...prev, search: value }))}
        onFiltersChange={(newFilters) => setFilters(newFilters)}
        resultCount={filteredOrders.length}
      />

      <OrdersTable 
        orders={filteredOrders}
        isLoading={isLoading}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onAddProducts={handleAddProducts}
      />

      {/* Dialogo de editar pedido */}
      {editingOrder && (
        <EditOrderDialog
          order={editingOrder}
          open={Boolean(editingOrder)}
          onOpenChange={(open) => !open && setEditingOrder(null)}
        />
      )}

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
