import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Product } from '@/types/models';


interface ProductAmountProps {
  product: Product;
}

const ProductAmount: React.FC<ProductAmountProps> = ({ product }) => {
  const { amount_requested, amount_purchased, amount_delivered } = product;

  // Calcular porcentajes de progreso
  const purchaseProgress = amount_requested > 0 ? (amount_purchased / amount_requested) * 100 : 0;
  const deliveryProgress = amount_requested > 0 ? (amount_delivered / amount_requested) * 100 : 0;

  return (
    <Card className="w-full border-0 shadow-none">
      <CardHeader>
        <CardTitle className="text-lg font-semibold">Cantidades del Producto</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 w-full">
        <div className="w-full flex justify-between items-center">
          <span className="text-sm font-medium">Encargado:</span>
          <Badge variant="outline" className="text-sm">
            {amount_requested}
          </Badge>
        </div>

        <div className="space-y-2 w-full">
          <div className="w-full flex justify-between items-center">
            <span className="text-sm font-medium">Comprado:</span>
            <Badge variant="secondary" className="text-sm">
              {amount_purchased}
            </Badge>
          </div>
          <Progress value={purchaseProgress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground">
            {purchaseProgress.toFixed(1)}% completado
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Entregado:</span>
            <Badge variant="secondary" className="text-sm">
              {amount_delivered}
            </Badge>
          </div>
          <Progress value={deliveryProgress} className="w-full h-2" />
          <p className="text-xs text-muted-foreground">
            {deliveryProgress.toFixed(1)}% completado
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ProductAmount;