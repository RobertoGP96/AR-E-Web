import React from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Loader2, DollarSign, Package, Store, Tag } from 'lucide-react';
import ProductAmount from './product-amount';
import ProductTimeline from './product-timeline';
import { useProduct } from '@/hooks/product/useProduct';
import { parseTagsFromDescriptionBlock } from '@/lib/tags';

const ProductDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const { product, isLoading, error } = useProduct(id || '');

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando producto...</span>
            </div>
        );
    }

    if (error || !product) {
        return (
            <div className="container mx-auto p-4">
                <Card className="w-full">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600">{error?.message || 'Producto no encontrado'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    const description = product.description?.split("--TAGS--")[0] || 'Sin descripción';
    const tags = parseTagsFromDescriptionBlock(product.description);

    return (
        <div className="container mx-auto p-4">
            <Card className="w-full shadow-lg">
                <CardHeader className="">
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-3xl font-bold text-gray-900 capitalize">
                            {product.name}
                        </CardTitle>
                        <Badge variant="secondary" className="text-sm px-3 py-1">
                            SKU: {product.sku}
                        </Badge>
                    </div>
                </CardHeader>
                <CardContent className="space-y-8 p-6">
                    {/* Imagen del producto */}
                    {product.image_url && (
                        <div className="flex justify-center">
                            <img
                                src={product.image_url}
                                alt={product.name}
                                className="max-w-full h-auto max-h-80 object-contain rounded-lg shadow-md border"
                            />
                        </div>
                    )}

                    {/* Información General y Económica */}
                    <div className="grid grid-cols-2 gap-6">
                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                            <CardHeader className="pb-3">
                                <div className="flex items-center justify-between">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <Package className="h-5 w-5" />
                                        Información General
                                    </CardTitle>
                                    <Badge variant="secondary" className="text-sm">
                                        Pedido #{typeof product.order === 'number' ? product.order : product.order?.id || 'N/A'}
                                    </Badge>
                                </div>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Descripción
                                    </h4>
                                    <p className="text-sm text-gray-900 leading-relaxed">
                                        {description}
                                    </p>
                                    {tags && tags.length > 0 && (
                                        <div className="mt-3 flex flex-wrap gap-2">
                                            {tags.map((tag, i) => (
                                                <Badge key={i} variant="outline" className="text-xs">
                                                    {tag.name}{tag.value ? `: ${tag.value}` : ''}
                                                </Badge>
                                            ))}
                                        </div>
                                    )}
                                </div>

                                {product.observation && (
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Observación
                                        </h4>
                                        <p className="text-sm text-gray-900 leading-relaxed">
                                            {product.observation}
                                        </p>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                            <Store className="h-4 w-4" />
                                            Tienda
                                        </h4>
                                        <p className="text-sm text-gray-900">{product.shop}</p>
                                    </div>

                                    {product.category && (
                                        <div>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <Tag className="h-4 w-4" />
                                                Categoría
                                            </h4>
                                            <p className="text-sm text-gray-900">{product.category}</p>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                        Estado
                                    </h4>
                                    <Badge variant="outline" className="text-sm">
                                        {product.status}
                                    </Badge>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-6">
                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Creado
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            {product.created_at ? new Date(product.created_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>

                                    <div>
                                        <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                            Actualizado
                                        </h4>
                                        <p className="text-sm text-gray-900">
                                            
                                            {product.updated_at ? new Date(product.updated_at).toLocaleString() : 'N/A'}
                                        </p>
                                    </div>
                                </div>

                                <ProductAmount product={product} />
                            </CardContent>
                        </Card>

                        {/* Información Económica */}
                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none" >
                            <CardHeader className="pb-3">
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <DollarSign className="h-5 w-5" />
                                    Información Económica
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className='flex flex-col gap-2'>


                                        <div className=" p-4 rounded-lg">
                                            <h4 className="text-sm font-medium  uppercase tracking-wide mb-2">
                                                Precio en Tienda
                                            </h4>
                                            <p className="text-xl font-semibold ">
                                                ${(product.shop_cost || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className=" p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Costo de Envío de Tienda
                                            </h4>
                                            <p className="text-lg font-semibold ">
                                                +${(product.shop_delivery_cost || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        
                                        <div className="p-4 rounded-lg border-2 border-dotted">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Subtotal Base
                                            </h4>
                                            <p className="text-lg font-semibold text-yellow-700">
                                                =${(product.shop_cost + product.shop_delivery_cost || 0).toFixed(2)}
                                            </p>
                                        </div>
                                        
                                        <div className="bg-blue-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                IVA (7%)
                                            </h4>
                                            <div className="flex items-center gap-2">
                                                {product.charge_iva ?? true ? (
                                                    <>
                                                        <span className="text-lg font-semibold text-blue-700">
                                                            +${(product.base_tax || 0).toFixed(2)}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-700 rounded-full font-medium">
                                                            Aplicado
                                                        </span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <span className="text-lg font-semibold text-gray-400">
                                                            $0.00
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded-full font-medium">
                                                            Exento
                                                        </span>
                                                    </>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className='flex flex-col gap-2'>


                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Impuesto en Tienda
                                            </h4>
                                            <p className="text-lg font-semibold text-yellow-700">
                                                +${(product.shop_taxes || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Impuesto Adicional
                                            </h4>
                                            <p className="text-lg font-semibold text-yellow-700">
                                                +${(product.added_taxes || 0).toFixed(2)}
                                            </p>
                                        </div>

                                        <div className="bg-yellow-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Impuesto Propio
                                            </h4>
                                            <p className="text-lg font-semibold text-yellow-700">
                                                +${(product.own_taxes || 0).toFixed(2)}
                                            </p>
                                        </div>



                                        <div className="bg-red-50 p-4 rounded-lg">
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                                Impuestos Totales
                                            </h4>
                                            <p className="text-lg font-semibold text-red-700">
                                                =${((product.shop_taxes || 0) + (product.own_taxes || 0) + (product.added_taxes || 0) + (product.own_taxes || 0)).toFixed(2)}
                                            </p>
                                        </div>

                                    </div>
                                </div>

                                <Separator />

                                <div className="bg-green-50 p-4 rounded-lg">
                                    <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                                        Costo Total
                                    </h4>
                                    <p className="text-2xl font-bold text-green-700">
                                        ${(product.total_cost || 0).toFixed(2)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                    </div>

                    {/* Registro de Eventos / Timeline */}
                    <ProductTimeline productId={id || ''} />
                </CardContent>
            </Card>

        </div>
    );
};

export default ProductDetails;
