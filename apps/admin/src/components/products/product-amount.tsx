import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { Product } from '@/types/models';

interface ProductAmountProps {
  product: Product;
}



const ProductAmount: React.FC<ProductAmountProps> = ({ product }) => {
  const { amount_requested, amount_purchased, amount_delivered,  amount_received} = product;
  const percentage = (part: number, total: number) => (total > 0 ? (part / total) * 100 : 0);

  const AmmountSection = ({cuantity, total, label}: {cuantity: number, total: number, label: string}) => {
    return <div className='space-y-2 w-full'>
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}:</span>
        <Badge variant="secondary" className="text-sm">{cuantity}</Badge>
      </div>
      <Progress value={percentage(cuantity, total)}  className={`w-full h-2 ${cuantity === total ? '[&>div]:bg-green-500' : ''}`} />
    </div>
  }

  return (
    <Card className="w-full border-0 shadow-none bg-transparent ring ring-gray-300">
      <CardHeader>
        <CardTitle className="text-md font-semibold">Cantidades</CardTitle>
      </CardHeader>
      <CardContent className="space-y-2 w-full">
        <div className="w-full flex justify-between items-center">
          <span className="text-sm font-medium">Encargado:</span>
          <Badge variant="outline" className="text-sm">
            {amount_requested}
          </Badge>
        </div>
        <AmmountSection cuantity={amount_purchased} total={amount_requested} label="Comprado" />
        <AmmountSection cuantity={amount_received} total={amount_requested} label="Recibido" />
        <AmmountSection cuantity={amount_delivered} total={amount_requested} label="Entregado" />
      </CardContent>
    </Card>
  );
};

export default ProductAmount;