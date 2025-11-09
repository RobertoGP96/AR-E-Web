import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowLeft, ShoppingCart, Package } from 'lucide-react';
import { useShoppingReceipt } from '@/hooks/shopping-receipts/useShoppingReceipt';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { PurchaseProductsList, AddProductsToPurchase } from '@/components/purshases/purchase-products';

const PurchaseProductsManagement: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { shoppingReceipt, isLoading, error } = useShoppingReceipt(Number(id));
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

  const totalProducts = shoppingReceipt.buyed_products?.length || 0;

  return (
    <div className="container mx-auto p-4 space-y-6">
      {/* Header con información de la compra */}
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
                  <ShoppingCart className="h-6 w-6" />
                  Gestión de Productos de Compra
                </CardTitle>
                <p className="text-sm text-gray-500 mt-1">
                  Administra los productos incluidos en esta compra
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              Compra #{shoppingReceipt.id}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-sm text-gray-600">Tienda</p>
                <p className="font-semibold">{shoppingReceipt.shop_of_buy}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
              <Package className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-sm text-gray-600">Total Productos</p>
                <p className="font-semibold">{totalProducts}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-purple-50 rounded-lg">
              <Package className="h-8 w-8 text-purple-600" />
              <div>
                <p className="text-sm text-gray-600">Cuenta</p>
                <p className="font-semibold">{shoppingReceipt.shopping_account}</p>
              </div>
            </div>
            <div className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
              <ShoppingCart className="h-8 w-8 text-orange-600" />
              <div>
                <p className="text-sm text-gray-600">Costo Total</p>
                <p className="font-semibold">${shoppingReceipt.total_cost_of_shopping?.toFixed(2) || '0.00'}</p>
              </div>
            </div>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600">Fecha de Compra</p>
              <p className="font-semibold">
                {shoppingReceipt.buy_date ? new Date(shoppingReceipt.buy_date).toLocaleDateString() : 'N/A'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Estado</p>
              <Badge variant="secondary" className="mt-1">
                {shoppingReceipt.status_of_shopping || 'No pagado'}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sección para agregar productos */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Agregar Productos a la Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <AddProductsToPurchase
            shoppingReceiptId={shoppingReceipt.id}
            onProductsAdded={handleProductAdded}
          />
        </CardContent>
      </Card>

      {/* Lista de productos en la compra */}
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Productos en esta Compra</CardTitle>
        </CardHeader>
        <CardContent>
          <PurchaseProductsList
            shoppingReceiptId={shoppingReceipt.id}
            refreshTrigger={refreshTrigger}
            onProductDeleted={handleProductDeleted}
          />
        </CardContent>
      </Card>
    </div>
  );
};

export default PurchaseProductsManagement;
