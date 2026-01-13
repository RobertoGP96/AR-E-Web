import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Tag, Package, Box } from 'lucide-react';
import { parseTagsFromDescriptionBlock } from '@/lib/tags';
import type { ProductBuyed } from '@/types/models/product-buyed';
import QRLink from '../products/qr-link';
import { useProduct } from '@/hooks/product/useProduct';

interface PurchaseProductRowProps {
    productBuyed: ProductBuyed;
}

const PurchaseProductRow: React.FC<PurchaseProductRowProps> = ({ productBuyed }) => {
    const { product } = useProduct(productBuyed.product_id);

    const tags = parseTagsFromDescriptionBlock(product?.description);

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

                            <div className="flex items-center gap-1">
                                <Box className="h-4 w-4" />
                                Cantidad: {productBuyed.amount_buyed}
                            </div>

                            {product?.status && (
                                <Badge variant="outline" className="text-xs">
                                    {product.status}
                                </Badge>
                            )}
                        </div>

                        {productBuyed.observation && (
                            <div className="mt-2 text-sm text-gray-600">
                                <strong>Observación:</strong> {productBuyed.observation}
                            </div>
                        )}
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default PurchaseProductRow;