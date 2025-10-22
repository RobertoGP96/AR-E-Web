import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Store, Tag, DollarSign, Package, Box } from 'lucide-react';
import { parseTagsFromDescriptionBlock } from '@/lib/tags';
import type { Product } from '@/types/models';
import QRLink from './qr-link';
import { useOrder } from '@/hooks/order/useOrder';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';


interface ProductRowProps {
    product: Product;
    selectable?: boolean;
    isSelected?: boolean;
    onSelect?: (product: Product) => void;
}

const ProductRow: React.FC<ProductRowProps> = ({ product, selectable = false, isSelected = false, onSelect }) => {
    const tags = parseTagsFromDescriptionBlock(product.description);

    const { order } = useOrder(product.order as number);

    const handleRowClick = (e: React.MouseEvent) => {
        // Evitar que el click se propague si se hizo en el checkbox
        if ((e.target as HTMLElement).closest('[data-checkbox]')) return;
        if (selectable) {
            onSelect?.(product);
        }
    };

    return (
        <Card
            className={`py-1 w-full transition-all duration-200 ${selectable ? 'cursor-pointer hover:shadow-lg hover:bg-gray-50' : 'hover:shadow-md'} ${isSelected ? 'ring-2 ring-blue-500 bg-blue-50' : ''}`}
            onClick={handleRowClick}
        >
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    {/* Checkbox de selección */}
                    {selectable && (
                        <Checkbox
                            checked={isSelected}
                            onCheckedChange={() => onSelect?.(product)}
                            className="mt-1"
                            data-checkbox
                        />
                    )}

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
                            {
                                product.sku && (
                                    <Badge variant="secondary" className="text-xs">
                                        SKU: {product.sku}
                                    </Badge>
                                )
                            }
                        </div>

                        {/* Tags */}
                        {tags && tags.length > 0 && (
                            <div className="my-2 flex flex-wrap gap-2">
                                {tags.map((tag, i) => (
                                    <Badge key={i} variant="outline" className="text-xs">
                                        {tag.name}{tag.value ? `: ${tag.value}` : ''}
                                    </Badge>
                                ))}
                            </div>
                        )}

                        {/* Información adicional */}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center gap-1">
                                <Store className="h-4 w-4" />
                                {product.shop}
                            </div>

                            {product.category && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    {product.category}
                                </div>
                            )}

                            {product.amount_requested && (
                                <div className="flex items-center gap-1">
                                    <Box className="h-4 w-4" />
                                    {product.amount_requested}
                                </div>
                            )}

                            <Badge variant="outline" className="text-xs">
                                {product.status}
                            </Badge>

                            {order?.client && (
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                        <AvatarFallback className="text-xs bg-blue-100 text-gray-700">
                                            {order.client.full_name.charAt(0).toUpperCase()}
                                        </AvatarFallback>
                                    </Avatar>
                                    <span className="text-sm text-gray-700 font-medium">
                                        {order.client.full_name}
                                    </span>
                                </div>
                            )}
                        </div>
                    </div>
                    {/* Costo total */}
                    <div className="text-right">
                        <div className="flex items-center gap-1 text-lg font-semibold text-green-700">
                            <DollarSign className="h-5 w-5" />
                            <p className='text-xl'>
                                {(product.total_cost || 0).toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductRow;
