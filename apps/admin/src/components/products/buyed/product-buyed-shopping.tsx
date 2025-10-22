import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Store, Tag, DollarSign, Package, Box } from 'lucide-react';
import { parseTagsFromDescriptionBlock } from '@/lib/tags';
import type { CreateProductBuyedData } from '@/types/models/product-buyed';
import QRLink from '../qr-link';
import { useProduct } from '@/hooks/product/useProduct';

interface ProductBuyedShoppingProps {
    productB: CreateProductBuyedData;
}

const ProductBuyedShopping: React.FC<ProductBuyedShoppingProps> = ({ productB }) => {
    const { product }= useProduct(productB.original_product)
    const [productBuyed, setProductBuyed] = useState<Partial<CreateProductBuyedData>>(() => ({
        product_id: product?.id,
        amount_buyed: product?.amount_requested || 1,
    }));


    const tags = parseTagsFromDescriptionBlock(product?.description);

    const handleQuantityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const value = parseInt(e.target.value, 10);
        if (!isNaN(value) && value >= 0) {
            setProductBuyed(prev => ({
                ...prev,
                amount_buyed: value,
                updated_at: new Date().toISOString(),
            }));
        }
    };

    return (
        <Card className="py-1 w-full transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    {product?.image_url ? (
                        <img
                            src={product?.image_url}
                            alt={product?.name}
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
                                    {product?.name}
                                </h3>
                                <QRLink link={product?.link || 'https://arye-shipps.netlify.app'} />
                            </div>
                            {product?.sku && (
                                <Badge variant="secondary" className="text-xs">
                                    SKU: {product.sku}
                                </Badge>
                            )}
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
                                {product?.shop}
                            </div>

                            {product?.category && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    {product?.category}
                                </div>
                            )}

                            {product?.amount_requested && (
                                <div className="flex items-center gap-1">
                                    <Box className="h-4 w-4" />
                                    {product.amount_requested}
                                </div>
                            )}

                            <Badge variant="outline" className="text-xs">
                                {product?.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Cantidad y Costo total */}
                    <div className="flex flex-col items-end space-y-2">
                        <div className="flex items-center gap-2">
                            <label htmlFor={`quantity-${product?.id}`} className="text-sm font-medium">
                                Cantidad:
                            </label>
                            <Input
                                id={`quantity-${product?.id}`}
                                type="number"
                                min="0"
                                value={productBuyed.amount_buyed ?? 1}
                                onChange={handleQuantityChange}
                                className="w-20"
                            />
                        </div>
                        <div className="flex items-center gap-1 text-lg font-semibold text-green-700">
                            <DollarSign className="h-5 w-5" />
                            <p className='text-xl'>
                                {product?.shop_cost.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductBuyedShopping;
