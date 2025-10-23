import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Tag, Package, Truck, ShoppingBag, User } from 'lucide-react';
import type { Product } from '@/types/models';
import QRLink from '../qr-link';
import { useOrder } from '@/hooks/order/useOrder';

interface ProductSummaryRowProps {
    product: Product;
    selectable?: boolean;
    isSelected?: boolean;
    onSelect?: (product: Product) => void;
}

const ProductSummaryRow: React.FC<ProductSummaryRowProps> = ({ product, selectable = false, isSelected = false, onSelect }) => {
    const { order } = useOrder(product.order as number);

    const handleRowClick = (e: React.MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.closest('a') || target.closest('button')) {
            return;
        }
        if (selectable) {
            onSelect?.(product);
        }
    };

    return (
        <Card
            className={`py-1 w-full transition-all duration-200 ${selectable ? 'cursor-pointer hover:shadow-lg hover:bg-gray-50' : 'hover:shadow-md'} ${isSelected ? 'ring-2 ring-gray-900 bg-gray-50 shadow-xl' : ''}`}
            onClick={handleRowClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">

                    {/* Imagen del producto */}
                    {product.image_url ? (
                        <img
                            src={product.image_url}
                            alt={product.name}
                            className="w-16 h-16 object-contain rounded-lg border"
                        />
                    ) : (
                        <div className="w-16 h-16 flex items-center justify-center rounded-lg border bg-gray-100">
                            <Package className="h-8 w-8 text-gray-400" />
                        </div>
                    )}

                    {/* Información principal */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-2">
                            <div className='flex flex-row items-center justify-center gap-3'>
                                <h3 className="text-lg font-semibold text-gray-900 truncate capitalize">
                                    {product.name}
                                </h3>
                                <QRLink link={product.link || 'https://arye-shipps.netlify.app'} />
                            </div>
                            {order?.client && (
                                <div className="flex items-center gap-2">
                                    <User className="h-5 w-5 text-gray-500" />
                                    <span className="text-sm text-gray-700 font-medium">
                                        {order.client.full_name}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Categoría y Cantidad */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            
                            {product.category && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    {product.category}
                                </div>
                            )}

                            {product.amount_requested && (
                                <div className="flex items-center gap-1">
                                    <Package className="h-4 w-4" />
                                    {product.amount_requested}
                                </div>
                            )}

                            {product.amount_purchased>=0 && (
                                <div className="flex items-center gap-1">
                                    <ShoppingBag className="h-4 w-4" />
                                    {product.amount_purchased}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Costos */}
                    <div className="text-right space-y-1">
                        <div className="flex items-center gap-1 text-lg font-semibold text-green-700">
                            <Store className="h-4 w-4" />
                            <span>${(product.shop_cost || 0).toFixed(2)}</span>
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-600">
                            <Truck className="h-4 w-4" />
                            <span>Envío: ${(product.shop_delivery_cost || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductSummaryRow;