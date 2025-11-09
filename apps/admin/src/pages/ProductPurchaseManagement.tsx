import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { useProduct } from '@/hooks/product/useProduct';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ProductPurchaseList, AddProductPurchase } from '@/components/products/purchase';

const ProductPurchaseManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { product, isLoading, error } = useProduct(id || '');
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleProductPurchaseAdded = () => {
    // Trigger refresh of the purchase list
    setRefreshTrigger(prev => prev + 1);
  };

  const handleProductPurchaseDeleted = () => {
    // Trigger refresh of the purchase list
    setRefreshTrigger(prev => prev + 1);
  };

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

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header con información del producto */}
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
                <CardTitle className="text-2xl font-bold text-gray-900 capitalize flex items-center gap-2">
                  <ShoppingCart className="h-6 w-6" />
                  Gestión de Compras
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Administra las compras del producto
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              SKU: {product.sku}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <Package className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Producto</p>
                <p className="font-semibold capitalize">{product.name}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Cantidad Comprada</p>
                <p className="font-semibold">{product.amount_purchased || 0}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <Package className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Cantidad Solicitada</p>
                <p className="font-semibold">{product.amount_requested || 0}</p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant="secondary" className="mt-1">
                {product.status}
              </Badge>
            </div>
            <div>
              <p className="text-sm text-gray-600">Costo Total</p>
              <p className="font-semibold text-lg">${product.total_cost?.toFixed(2) || '0.00'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección para agregar nuevas compras */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Agregar Nueva Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <AddProductPurchase
            productId={Number(product.id)}
            orderId={typeof product.order === 'number' ? product.order : product.order?.id || 0}
            onPurchaseAdded={handleProductPurchaseAdded}
          />
        </CardContent>
      </Card>

      {/* Lista de compras existentes */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Historial de Compras</CardTitle>
        </CardHeader>
        <CardContent>
          <ProductPurchaseList
            productId={Number(product.id)}
            refreshTrigger={refreshTrigger}
            onPurchaseDeleted={handleProductPurchaseDeleted}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default ProductPurchaseManagement;
