import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Store, Tag, Package, Box, Truck, ShoppingBag } from 'lucide-react';
import { parseTagsFromDescriptionBlock } from '@/lib/tags';
import type { ProductBuyed } from '@/types/models/product-buyed';
import QRLink from '../qr-link';
import { RefundBadge } from './RefundBadge';
import { RefundPopover } from './RefundPopover';

interface ProductBuyedShoppingProps {
    product: ProductBuyed;
}

const ProductPurchaseRow: React.FC<ProductBuyedShoppingProps> = ({ product }) => {
    const tags = parseTagsFromDescriptionBlock(product.original_product_details.description);

    return (
        <Card className="py-1 w-full transition-all duration-200 hover:shadow-md">
            <CardContent className="p-4">
                <div className="flex items-center space-x-4">
                    {/* Imagen del producto */}
                    {product.original_product_details.image_url ? (
                        <img
                            src={product.original_product_details.image_url}
                            alt={product.original_product_details.name}
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
                                    {product.original_product_details.name}
                                </h3>
                                <QRLink link={product.original_product_details.link || 'https://arye-shipps.netlify.app'} />
                                <RefundBadge
                                    isRefunded={product.is_refunded}
                                    refundDate={product.refund_date}
                                    refundAmount={product.refund_amount}
                                    refundNotes={product.refund_notes}
                                />
                            </div>
                            {product.original_product_details.sku && (
                                <Badge variant="secondary" className="text-xs">
                                    SKU: {product.original_product_details.sku}
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
                                {product.original_product_details.shop}
                            </div>

                            {product.original_product_details.category && (
                                <div className="flex items-center gap-1">
                                    <Tag className="h-4 w-4" />
                                    {product.original_product_details.category}
                                </div>
                            )}

                            {product.original_product_details.amount_requested && (
                                <div className="flex items-center gap-1">
                                    <Box className="h-4 w-4" />
                                    {product.original_product_details.amount_requested}
                                </div>
                            )}

                            {product.amount_buyed && (
                                <div className="flex items-center gap-1">
                                    <ShoppingBag className="h-4 w-4" />
                                    {product.amount_buyed}
                                </div>
                            )}

                            <Badge variant="outline" className="text-xs">
                                {product.original_product_details.status}
                            </Badge>
                        </div>
                    </div>

                    {/* Cantidad y Costo total */}
                    <div className="flex flex-col items-end space-y-3">
                        {/* Botón de reembolso */}
                        <RefundPopover productBuyed={product} />
                        
                        {/* Costos */}
                        <div className="flex flex-col justify-end items-center gap-2">
                            <div className="flex items-center justify-center gap-1 text-sm text-gray-600">
                                <Truck className="h-4 w-4" />
                                <span>Envío: ${(product.original_product_details.shop_delivery_cost || 0).toFixed(2)}</span>
                            </div>
                            <div className={`flex items-center gap-1 text-lg font-semibold ${product.is_refunded ? 'text-gray-500 line-through' : 'text-green-700'}`}>
                                <Store className="h-4 w-4" />
                                <span>${(product.original_product_details.shop_cost || 0).toFixed(2)}</span>
                            </div>
                            {product.is_refunded && product.refund_amount > 0 && (
                                <div className="flex items-center gap-1 text-sm font-medium text-amber-700">
                                    <span>Reembolsado: ${product.refund_amount.toFixed(2)}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};

export default ProductPurchaseRow;
