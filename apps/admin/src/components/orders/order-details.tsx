import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Loader2, DollarSign, User, Truck, ShoppingBag } from 'lucide-react';
import { useOrder } from '@/hooks/order/useOrder';
import ProductRow from '@/components/products/product-row';
import OrderStatusBadge from './OrderStatusBadge';
import PaymentStatusBadge from './PaymentStatusBadge';
import { Badge } from '../ui/badge';

const OrderDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { order, isLoading, error } = useOrder(Number(id) || 0);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando pedido...</span>
            </div>
        );
    }

    if (error || !order) {
        return (
            <div className="container mx-auto p-4">
                <Card className="w-full">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600">{error?.message || 'Pedido no encontrado'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            <Card className="w-full shadow-lg">

                <CardContent className="space-y-8 p-6">
                    {/* Información General y Económica */}
                    <div className="grid grid-cols-[74%_25%] gap-4">
                        <div className='flex flex-col gap-4'>

                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ShoppingBag className="h-5 w-5" />
                                    Información General

                                    <Badge variant="secondary" className="text-xs">
                                        #{order.id}
                                    </Badge>
                                </CardTitle>
                                <div className="flex gap-2">
                                    <OrderStatusBadge status={order.status} />
                                    <PaymentStatusBadge status={order.pay_status} />
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            Cliente
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            {order.client ? `${order.client.name} ${order.client.last_name}` : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                            <User className="h-4 w-4" />
                                            Agente
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            {order.sales_manager ? `${order.sales_manager.name} ${order.sales_manager.last_name}` : 'N/A'}
                                        </p>
                                    </div>
                                </div>



                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Creado
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            {order.created_at ? new Date(order.created_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Actualizado
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            {order.updated_at ? new Date(order.updated_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                

                                
                            </CardContent>
                        </Card>

                        <Card className="col-span-2">
                            <CardContent>
                                {/* Productos */}
                                {order.products && order.products.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Productos
                                        </h4>
                                        <div className="space-y-2">
                                            {order.products.map((product) => (
                                                <ProductRow key={product.id} product={product} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>


                            {/* Recibos de Entrega */}
                                {order.delivery_receipts && order.delivery_receipts.length > 0 && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2 flex items-center gap-1">
                                            <Truck className="h-4 w-4" />
                                            Recibos de Entrega
                                        </h4>
                                        <div className="space-y-2">
                                            {order.delivery_receipts.map((receipt) => (
                                                <Card key={receipt.id} className="p-3">
                                                    <p className="text-sm">Recibo #{receipt.id} - Estado: {receipt.status}</p>
                                                </Card>
                                            ))}
                                        </div>
                                    </div>
                                )}
                        </Card>

                        </div>
                        {/* Información Económica */}
                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none" >
                            <CardHeader className="">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Información Económica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                                    <div className=" p-2 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Costo Total
                                        </h4>
                                        <p className="text-2xl font-bold text-blue-700">
                                            ${(order.total_cost || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className=" p-2 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Valor Recibido del Cliente
                                        </h4>
                                        <p className="text-xl font-semibold text-green-700">
                                            ${(order.received_value_of_client || 0).toFixed(2)}
                                        </p>
                                    </div>

                                    <div className=" p-2 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Pagos Extra
                                        </h4>
                                        <p className="text-xl font-semibold text-yellow-700">
                                            ${(order.extra_payments || 0).toFixed(2)}
                                        </p>
                                    </div>
                                </div>

                                <Separator />

                                <div className="bg-gray-50 p-2 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                        Balance
                                    </h4>
                                    <p className={`text-xl font-bold ${(order.received_value_of_client || 0) + (order.extra_payments || 0) - (order.total_cost || 0) >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                                        ${((order.received_value_of_client || 0) + (order.extra_payments || 0) - (order.total_cost || 0)).toFixed(2)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                        
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default OrderDetails;
