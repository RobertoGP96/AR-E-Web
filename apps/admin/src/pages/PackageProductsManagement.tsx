import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, Package as PackageIcon, Box } from 'lucide-react';
import { usePackage } from '@/hooks/package';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { AddProductsToPackage, PackageProductsList } from '@/components/packages/package-products';

const PackageProductsManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { package: packageData, isLoading, error } = usePackage(Number(id));
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProductAdded = () => {
    // Trigger refresh of the products list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProductDeleted = () => {
    // Trigger refresh of the products list
    setRefreshTrigger(prev => prev + 1);
  };

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

  const totalProducts = packageData.contained_products?.length || 0;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header con información del paquete */}
      <Card className="w-full shadow-lg">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <PackageIcon className="h-6 w-6" />
                  Gestión de Productos del Paquete
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Administra los productos incluidos en este paquete
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Paquete #{packageData.id}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <PackageIcon className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Agencia</p>
                <p className="font-semibold">{packageData.agency_name || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Box className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="font-semibold">{totalProducts}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <PackageIcon className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Tracking</p>
                <p className="font-semibold text-xs">{packageData.number_of_tracking || 'N/A'}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <PackageIcon className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Fecha Llegada</p>
                <p className="font-semibold text-xs">
                  {packageData.arrival_date ? new Date(packageData.arrival_date).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fecha de Creación</p>
              <p className="font-semibold">
                {packageData.created_at ? new Date(packageData.created_at).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant="secondary" className="mt-1">
                {packageData.status_of_processing || 'Pendiente'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección para agregar productos */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Agregar Productos al Paquete</CardTitle>
        </CardHeader>
        <CardContent>
          <AddProductsToPackage
            packageId={packageData.id}
            onProductsAdded={handleProductAdded}
          />
        </CardContent>
      </Card>

      {/* Lista de productos en el paquete */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Productos en este Paquete</CardTitle>
        </CardHeader>
        <CardContent>
          <PackageProductsList
            packageId={packageData.id}
            refreshTrigger={refreshTrigger}
            onProductDeleted={handleProductDeleted}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PackageProductsManagement;
