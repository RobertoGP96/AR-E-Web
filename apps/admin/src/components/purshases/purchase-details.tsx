import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, DollarSign, ShoppingBag, Store, CreditCard, Calendar } from 'lucide-react';
import { useShoppingReceipt } from '@/hooks/shopping-receipts';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from './StatusBadge';
import { formatDate } from '@/lib/format-date';
import ProductPurchaseRow from '../products/buyed/product-purchase-row';

const PurchaseDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { shoppingReceipt, isLoading, error } = useShoppingReceipt(Number(id) || 0);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando compra...</span>
            </div>
        );
    }

    if (error || !shoppingReceipt) {
        return (
            <div className="container mx-auto p-4">
                <Card className="w-full">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600">{error?.message || 'Compra no encontrada'}</p>
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
                                            #{shoppingReceipt.id}
                                        </Badge>
                                        <StatusBadge status={shoppingReceipt.status_of_shopping} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-3 gap-6">
                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <Store className="h-4 w-4" />
                                                Tienda
                                            </h4>
                                            <p className="text-sm text-gray-900">
                                                {shoppingReceipt.shop_of_buy || 'N/A'}
                                            </p>
                                        </div>

                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <CreditCard className="h-4 w-4" />
                                                Cuenta
                                            </h4>
                                            <p className="text-sm text-gray-900">
                                                {shoppingReceipt.shopping_account || 'N/A'}
                                            </p>
                                        </div>

                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                <Calendar className="h-4 w-4 inline-block mr-1" />
                                                Fecha de Compra
                                            </h4>
                                            <p className="text-sm flex flex-row justify-start items-center text-gray-900">
                                                {shoppingReceipt.buy_date ? formatDate(shoppingReceipt.buy_date) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="col-span-2">
                                <CardContent>
                                    {/* Productos Comprados */}
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Productos Comprados
                                        </h4>
                                        {shoppingReceipt.buyed_products && shoppingReceipt.buyed_products.length > 0 ? (
                                            <div className="space-y-2">
                                                {shoppingReceipt.buyed_products.map((productBuyed) => (
                                                    <ProductPurchaseRow key={productBuyed.id} product={productBuyed} />
                                                ))}
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center py-8 px-4 text-center bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                                <ShoppingBag className="h-12 w-12 text-gray-400 mb-3" />
                                                <p className="text-gray-500 font-medium">No hay productos comprados</p>
                                                <p className="text-sm text-gray-400 mt-1">
                                                    Esta compra aún no tiene productos asociados
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Información Económica */}
                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                            <CardHeader className="">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Información Económica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div className="grid grid-cols-1 gap-2">
                            <div className="p-2 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Costo Real de Compra
                                </h4>
                                <p className="text-2xl font-bold text-blue-700">
                                    ${(shoppingReceipt.total_cost_of_purchase || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Lo que se pagó efectivamente</p>
                            </div>
                            
                            <div className="p-2 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Valor de Productos
                                </h4>
                                <p className="text-2xl font-bold text-green-700">
                                    ${(shoppingReceipt.total_cost_of_shopping || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-gray-500 mt-1">Suma del costo total de productos</p>
                            </div>
                            
                            {shoppingReceipt.total_refunded > 0 && (
                                <>
                                    <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                                        <h4 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">
                                            Total Reembolsado
                                        </h4>
                                        <p className="text-2xl font-bold text-amber-700">
                                            ${(shoppingReceipt.total_refunded || 0).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-amber-600 mt-1">
                                            Monto devuelto al sistema
                                        </p>
                                    </div>
                                    
                                    <div className="p-2 rounded-lg">
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                            Valor Neto (Sin Reembolsos)
                                        </h4>
                                        <p className="text-2xl font-bold text-purple-700">
                                            ${(shoppingReceipt.total_cost_excluding_refunds || 0).toFixed(2)}
                                        </p>
                                        <p className="text-xs text-gray-500 mt-1">Valor real de productos activos</p>
                                    </div>
                                </>
                            )}
                            
                            <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
                                <h4 className="text-sm font-medium text-amber-700 uppercase tracking-wide mb-2">
                                    Gastos Operativos
                                </h4>
                                <p className="text-2xl font-bold text-amber-700">
                                    ${(shoppingReceipt.operational_expenses || 0).toFixed(2)}
                                </p>
                                <p className="text-xs text-amber-600 mt-1">
                                    Diferencia entre costo real y valor neto
                                </p>
                            </div>
                            
                            <div className="p-2 rounded-lg">
                                <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                    Detalle de Productos
                                </h4>
                                {shoppingReceipt.buyed_products && shoppingReceipt.buyed_products.length > 0 ? (
                                    <div className="space-y-1">
                                        {shoppingReceipt.buyed_products.map((product) => (
                                            <div key={product.id} className={`flex justify-between text-sm ${product.is_refunded ? 'text-gray-400 line-through' : ''}`}>
                                                <span className="flex items-center gap-1">
                                                    {product.original_product_details.name} (x{product.amount_buyed})
                                                    {product.is_refunded && (
                                                        <span className="text-xs text-amber-600 font-medium ml-1">
                                                            [Reemb.]
                                                        </span>
                                                    )}
                                                </span>
                                                <span>${((product.original_product_details.total_cost || 0) * (product.amount_buyed || 0)).toFixed(2)}</span>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-4">
                                        <p className="text-xs text-gray-400">Sin productos</p>
                                    </div>
                                )}
                            </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
};

export default PurchaseDetails;