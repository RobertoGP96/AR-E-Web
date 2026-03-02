import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';

import { OrderStatusLabel, PaymentStatusLabel } from './order-status';
import { ProductCard } from './product-card';
import { 
  ShoppingCart, 
  Package, 
  DollarSign, 
  Truck,
  Eye
} from 'lucide-react';

import type { Order } from '../../types/order';
import type { Product } from '../../types/product';

interface OrderDetailsProps {
  order: Order;
}

const OrderDetails: React.FC<OrderDetailsProps> = ({ order }) => {
  // Función para formatear precios
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('es-AR', {
      style: 'currency',
      currency: 'ARS',
    }).format(price);
  };

  // Función para formatear fechas
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No disponible';
    return new Date(dateString).toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Función para obtener el color del badge según el status (para productos y entregas)
  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'encargado':
      case 'ordered':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      case 'procesando':
      case 'processing':
      case 'comprado':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'completado':
      case 'completed':
      case 'recivido':
      case 'received':
      case 'enviado':
      case 'shipped':
      case 'entregado':
      case 'delivered':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelado':
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'pendiente':
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-3 sm:p-4 lg:p-6 space-y-4 sm:space-y-6  min-h-screen">
      {/* Header del pedido */}
      <Card className="border-0 shadow-xl ">
        <CardHeader className="pb-4 sm:pb-6 px-4 sm:px-6 border-b border-gray-200 dark:border-gray-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
            <div className="space-y-2 sm:space-y-3">
              <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-orange-100">
                <div className="p-2 sm:p-3 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                  <ShoppingCart className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
                </div>
                <span className="truncate">Pedido</span>
              </CardTitle>
              <CardDescription className="text-sm sm:text-base lg:text-lg text-gray-600 dark:text-orange-200 font-medium line-clamp-2">
                {formatDate(order.created_at)}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 sm:gap-3 flex-shrink-0">
              <OrderStatusLabel status={order.status} />
              <PaymentStatusLabel paidStatus={order.pay_status} />
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 px-4 sm:px-6">
          {/* Primera fila: Cliente y Gestor */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 mb-6 sm:mb-8">
            

          </div>

          {/* Segunda fila: Resumen Financiero */}
          <div className="space-y-4">
            <h3 className="font-bold flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6 text-gray-900 dark:text-white text-base sm:text-lg">
              <div className="p-2 bg-orange-500 rounded-lg sm:rounded-xl shadow-md flex-shrink-0">
                <DollarSign className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
              </div>
              <span className="truncate">Resumen Financiero</span>
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-6">
              <div className="flex flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:p-5  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="text-xs sm:text-sm font-semibold text-gray-700 dark:text-gray-300">Total del pedido:</span>
                <span className="font-bold text-xl sm:text-2xl lg:text-3xl text-orange-600 dark:text-orange-400">{formatPrice(order.total_cost)}</span>
              </div>
              <div className="flex flex-row sm:flex-row sm:items-center justify-between gap-2 sm:gap-3 p-4 sm:p-5  rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
                <span className="text-xs sm:text-sm font-medium text-gray-600 dark:text-gray-400">Valor recibido:</span>
                <span className="font-bold text-lg sm:text-xl text-gray-900 dark:text-gray-200">{formatPrice(order.received_value_of_client || 0)}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Lista de productos */}
      <Card className="border-0 shadow-xl">
        <CardHeader className=" border-0 rounded-t-xl px-4 sm:px-6 py-4 sm:py-6">
          <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
            <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
              <Package className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
            </div>
            <span>Productos ({order.products?.length || 0})</span>
          </CardTitle>
          <CardDescription className="text-sm sm:text-base lg:text-lg text-white/80">
            Detalles de todos los productos incluidos en este pedido
          </CardDescription>
        </CardHeader>
        <CardContent className="p-4 sm:p-6 lg:p-8">
          <div className="flex flex-wrap gap-4 sm:gap-6">
            {order.products?.length > 0 ? (
              order.products.map((product: Product) => (
                <ProductCard key={product.id} product={product} />
              ))
            ) : (
              <div className="w-full text-center py-16 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-2xl border-2 border-dashed border-gray-300 dark:border-gray-600">
                <div className="p-6 bg-gray-100 dark:bg-gray-700 rounded-full w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                  <Package className="h-12 w-12 text-gray-400 dark:text-gray-500" />
                </div>
                <p className="text-gray-500 dark:text-gray-400 font-semibold text-lg mb-2">No hay productos en este pedido</p>
                <p className="text-gray-400 dark:text-gray-500 text-sm">Los productos aparecerán aquí cuando se agreguen al pedido</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Información de entrega - Múltiples paquetes */}
      {order.delivery?.length > 0 && (
        <Card className="border-0 shadow-xl">
          <CardHeader className="bg-orange-600 dark:bg-orange-700 border-0 rounded-t-xl px-4 sm:px-6 py-4 sm:py-6">
            <CardTitle className="flex items-center gap-2 sm:gap-3 text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
              <div className="p-2 sm:p-3 bg-white/20 rounded-lg sm:rounded-xl shadow-lg flex-shrink-0">
                <Truck className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 text-white" />
              </div>
              <span>Paquetes ({order.delivery.length})</span>
            </CardTitle>
            <CardDescription className="text-sm sm:text-base lg:text-lg text-white/80">
              Los productos se entregan en múltiples paquetes a medida que van llegando
            </CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6 lg:p-8 bg-white dark:bg-gray-900">
            <div className="space-y-4 sm:space-y-6">
              {order.delivery.map((delivery, index) => (
                <div key={index} className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border border-gray-200 dark:border-gray-700 rounded-lg sm:rounded-2xl p-4 sm:p-6 lg:p-8 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <h4 className="font-bold text-base sm:text-xl text-gray-900 dark:text-white flex items-center gap-2 sm:gap-3">
                      <div className="p-2 bg-gradient-to-br from-cyan-100 to-blue-100 dark:from-cyan-900/50 dark:to-blue-900/50 rounded-lg sm:rounded-xl flex-shrink-0">
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-cyan-600 dark:text-cyan-400" />
                      </div>
                      <span className="truncate">Paquete #{index + 1}</span>
                    </h4>
                    <Badge className={getStatusColor(delivery.status || 'Pendiente')} >
                      {delivery.status || 'Pendiente'}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    <div className="bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-900/20 dark:to-amber-800/20 p-4 sm:p-5 rounded-lg sm:rounded-2xl shadow-md border border-orange-200 dark:border-orange-600">
                      <span className="font-semibold text-orange-700 dark:text-orange-300 block mb-2 sm:mb-3 text-sm sm:text-base">Peso del paquete:</span>
                      <p className="text-xl sm:text-2xl font-bold text-orange-900 dark:text-orange-100 flex items-center gap-2">
                        <span>{delivery.weight} kg</span>
                        <Package className="h-4 w-4 sm:h-5 sm:w-5 text-orange-500 flex-shrink-0" />
                      </p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-amber-50 to-yellow-100 dark:from-amber-900/20 dark:to-yellow-800/20 p-4 sm:p-5 rounded-lg sm:rounded-2xl shadow-md border border-amber-200 dark:border-amber-700">
                      <span className="font-semibold text-amber-700 dark:text-amber-300 block mb-2 sm:mb-3 text-sm sm:text-base">Costo de envío:</span>
                      <p className="text-xl sm:text-2xl font-bold text-amber-600 dark:text-amber-400">
                        {formatPrice(delivery.weight_cost)}
                      </p>
                    </div>
                    
                    {delivery.deliver_date && (
                      <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/20 p-4 sm:p-5 rounded-lg sm:rounded-2xl shadow-md border border-yellow-200 dark:border-yellow-700">
                        <span className="font-semibold text-yellow-800 dark:text-yellow-300 block mb-2 sm:mb-3 text-sm sm:text-base">Fecha de entrega:</span>
                        <p className="text-yellow-700 dark:text-yellow-200 font-bold text-sm sm:text-lg line-clamp-2">
                          {formatDate(delivery.deliver_date)}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {delivery.deliver_picture?.length > 0 && (
                    <div className="mt-4 sm:mt-6 p-4 sm:p-5 bg-gradient-to-br from-orange-50 to-amber-100 dark:from-orange-800/20 dark:to-amber-700/20 rounded-lg sm:rounded-2xl shadow-md border border-orange-200 dark:border-orange-600">
                      <span className="font-semibold text-orange-800 dark:text-orange-300 text-base sm:text-lg mb-3 sm:mb-4 flex items-center gap-2">
                        <div className="p-1 sm:p-1.5 bg-orange-100 dark:bg-orange-900/50 rounded-lg flex-shrink-0">
                          <Eye className="h-3 w-3 sm:h-4 sm:w-4 text-orange-600 dark:text-orange-400" />
                        </div>
                        <span className="truncate">Evidencias ({delivery.deliver_picture.length})</span>
                      </span>
                      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-2 sm:gap-3">
                        {delivery.deliver_picture.map((image, imgIndex) => (
                          <img
                            key={imgIndex}
                            src={image.image_url}
                            alt={`Evidencia de entrega ${imgIndex + 1}`}
                            className="w-full aspect-square object-cover rounded-lg sm:rounded-xl border-2 border-orange-200 dark:border-orange-600 hover:border-orange-400 dark:hover:border-orange-500 transition-all duration-200 shadow-sm hover:shadow-md transform hover:scale-105"
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

    </div>
  );
};

export default OrderDetails;
