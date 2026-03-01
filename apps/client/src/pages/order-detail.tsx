import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useOrder } from '@/hooks/order/useOrder';
import OrderDetails from '@/components/order/order-details';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Loader2 } from 'lucide-react';

/**
 * Página de detalles de orden
 * Muestra todos los detalles de una orden específica
 */
const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { order, isLoading, error } = useOrder(Number(id) || 0);

  // Estado de carga
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-orange-500" />
          <p className="text-gray-600 dark:text-gray-400 font-medium">Cargando detalles del pedido...</p>
        </div>
      </div>
    );
  }

  // Estado de error
  if (error || !order) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-4">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="outline"
            onClick={() => navigate('/user_orders')}
            className="mb-6"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Volver a mis pedidos
          </Button>
          
          <Card className="border-red-200 bg-red-50 dark:bg-red-900/20 dark:border-red-800">
            <CardContent className="py-8 text-center">
              <p className="text-red-600 dark:text-red-400 font-medium text-lg mb-4">
                {error ? 'Error al cargar los detalles del pedido' : 'Pedido no encontrado'}
              </p>
              <p className="text-red-500 dark:text-red-300 text-sm mb-6">
                {error?.message || 'El pedido que buscas no existe o ha sido eliminado'}
              </p>
              <Button
                onClick={() => navigate('/user_orders')}
                variant="default"
                className="bg-orange-500 hover:bg-orange-600"
              >
                Ver todos mis pedidos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Render exitoso
  return (
    <div className="min-h-screen  py-8 px-4">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header con botón de regreso */}
        <div className="flex items-center justify-between">
          <Button
            variant="outline"
            onClick={() => navigate('/user_orders')}
            className="gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a mis pedidos
          </Button>
        </div>

        {/* Contenido principal */}
        <OrderDetails order={order} />
      </div>
    </div>
  );
};

export default OrderDetailPage;
