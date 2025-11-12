import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Loader2, Package as PackageIcon, Truck, Calendar, Hash, ArrowLeft, Image as ImageIcon } from 'lucide-react';
import { usePackage } from '@/hooks/package';
import { Badge } from '@/components/ui/badge';
import PackageStatusBadge from './PackageStatusBadge';
import { formatDate } from '@/lib/format-date';
import { Button } from '@/components/ui/button';

const PackageDetails: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { package: packageData, isLoading, error } = usePackage(Number(id) || 0);

    if (isLoading) {
        return (
            <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
                <span className="ml-2">Cargando paquete...</span>
            </div>
        );
    }

    if (error || !packageData) {
        return (
            <div className="container mx-auto p-4">
                <Card className="w-full">
                    <CardContent className="p-6 text-center">
                        <p className="text-red-600">{error?.message || 'Paquete no encontrado'}</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4">
            {/* Botón de regreso */}
            <Button
                variant="ghost"
                onClick={() => navigate('/packages')}
                className="mb-4 hover:bg-gray-100"
            >
                <ArrowLeft className="h-4 w-4 mr-2" />
                
            </Button>

            <Card className="w-full shadow-lg">
                <CardContent className="space-y-8 p-6">
                    {/* Información General y Productos */}
                    <div className="grid grid-cols-1 lg:grid-cols-[70%_29%] gap-4">
                        {/* Información General */}
                        <div className='flex flex-col gap-4'>
                            <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <PackageIcon className="h-5 w-5" />
                                        Información del Paquete
                                        <Badge variant="secondary" className="text-xs">
                                            #{packageData.agency_name}
                                        </Badge>
                                        <PackageStatusBadge status={packageData.status_of_processing} />
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <Truck className="h-4 w-4" />
                                                Agencia
                                            </h4>
                                            <p className="text-sm text-gray-900">
                                                {packageData.agency_name || 'N/A'}
                                            </p>
                                        </div>

                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1 flex items-center gap-1">
                                                <Hash className="h-4 w-4" />
                                                No. Rastreo
                                            </h4>
                                            <p className="text-sm text-gray-900 font-mono">
                                                {packageData.number_of_tracking || 'N/A'}
                                            </p>
                                        </div>

                                        <div className='border-2 border-dotted p-3 rounded-2xl'>
                                            <h4 className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-1">
                                                <Calendar className="h-4 w-4 inline-block mr-1" />
                                                Fecha de Llegada
                                            </h4>
                                            <p className="text-sm flex flex-row justify-start items-center text-gray-900">
                                                {packageData.arrival_date ? formatDate(packageData.arrival_date) : 'N/A'}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            {/* Productos Recibidos */}
                            <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                                <CardHeader className="pb-3">
                                    <CardTitle className="text-lg flex items-center gap-2">
                                        <PackageIcon className="h-5 w-5" />
                                        Productos Recibidos
                                        <Badge variant="secondary" className="text-xs">
                                            {packageData.contained_products?.length || 0} productos
                                        </Badge>
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    {packageData.contained_products && packageData.contained_products.length > 0 ? (
                                        <div className="space-y-2">
                                            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                            {packageData.contained_products.map((product: any) => (
                                                <div
                                                    key={product.id}
                                                    className="flex items-start justify-between p-4 rounded-lg border border-gray-200 bg-white hover:bg-gray-50 transition-colors"
                                                >
                                                    <div className="flex-1">
                                                        <h5 className="text-sm font-semibold text-gray-900">
                                                            {product.original_product.name}
                                                        </h5>
                                                        <p className="text-xs text-gray-500 mt-1">
                                                            ID: {product.original_product.id}
                                                        </p>
                                                        {product.observation && (
                                                            <p className="text-xs text-gray-600 mt-2 italic border-l-2 border-gray-300 pl-2">
                                                                {product.observation}
                                                            </p>
                                                        )}
                                                    </div>
                                                    <div className="ml-4 flex flex-col items-end gap-2">
                                                        <Badge variant="default" className="text-xs">
                                                            Cantidad: {product.amount_received}
                                                        </Badge>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <div className="text-center py-8 text-gray-500">
                                            <PackageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                            <p className="text-sm">No hay productos recibidos en este paquete</p>
                                        </div>
                                    )}
                                </CardContent>
                            </Card>
                        </div>

                        {/* Evidencias Fotográficas */}
                        <Card className="border-0 bg-gray-200/20 ring ring-gray-300 shadow-none">
                            <CardHeader>
                                <CardTitle className="text-lg flex items-center gap-2">
                                    <ImageIcon className="h-5 w-5" />
                                    Evidencias
                                    <Badge variant="secondary" className="text-xs">
                                        {packageData.package_picture?.length || 0}
                                    </Badge>
                                </CardTitle>
                            </CardHeader>
                            <CardContent>
                                {packageData.package_picture && packageData.package_picture.length > 0 ? (
                                    <div className="grid grid-cols-1 gap-3">
                                        {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                                        {packageData.package_picture.map((image: any, index: number) => (
                                            <div
                                                key={image.id || index}
                                                className="relative aspect-square rounded-lg overflow-hidden border-2 border-gray-200 hover:border-blue-400 transition-all cursor-pointer group"
                                            >
                                                <img
                                                    src={image.picture || '/placeholder-image.png'}
                                                    alt={`Evidencia ${index + 1}`}
                                                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                                                />
                                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
                                                    <span className="text-white opacity-0 group-hover:opacity-100 transition-opacity text-sm font-medium">
                                                        Ver imagen
                                                    </span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center py-8 text-gray-500">
                                        <ImageIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                        <p className="text-sm">No hay evidencias fotográficas</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Información de Fechas */}
                    <Card className="border-0 bg-blue-50/50 ring ring-blue-200 shadow-none">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-blue-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Creado el</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(packageData.created_at)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-green-100 rounded-lg">
                                        <Calendar className="h-5 w-5 text-green-600" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-gray-500">Última actualización</p>
                                        <p className="text-sm font-medium text-gray-900">
                                            {formatDate(packageData.updated_at)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                </CardContent>
            </Card>
        </div>
    );
};

export default PackageDetails;
