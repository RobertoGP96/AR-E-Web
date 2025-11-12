import { useParams, useNavigate } from 'react-router-dom';
import { useSingleDelivery } from '@/hooks/delivery';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { 
  ArrowLeft, 
  Calendar, 
  DollarSign, 
  Truck, 
  Weight,
  User,
  Hash,
  Plus,
  Loader2,
  Tag
} from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import DeliveryStatusBadge from '@/components/delivery/DeliveryStatusBadge';
import AvatarUser from '@/components/utils/AvatarUser';
import { Separator } from '@/components/ui/separator';
import { useState } from 'react';
import { AddProductToDeliveryDialog } from '@/components/delivery/AddProductToDeliveryDialog';
import { DeliveryProductsTable } from '@/components/delivery/DeliveryProductsTable';

export default function DeliveryDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { delivery, isLoading, error } = useSingleDelivery(Number(id));
  const [showAddProductDialog, setShowAddProductDialog] = useState(false);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  if (error || !delivery) {
    return (
      <div className="container mx-auto py-8">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="py-8 text-center">
            <p className="text-red-600 font-medium">Error al cargar el delivery</p>
            <Button 
              onClick={() => navigate('/deliveries')} 
              className="mt-4"
              variant="outline"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Volver a Deliveries
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={() => navigate('/deliveries')}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Delivery #{delivery.id}</h1>
            <p className="text-muted-foreground">
              Detalles y productos del delivery
            </p>
          </div>
        </div>
        <DeliveryStatusBadge status={delivery.status} />
      </div>

      {/* Información General */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {/* Card: Información del Delivery */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Truck className="h-5 w-5 text-orange-400" />
              Información del Delivery
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center gap-3">
              <Hash className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">ID</p>
                <p className="font-medium">#{delivery.id}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-3">
              <Calendar className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">Fecha de entrega</p>
                <p className="font-medium">{formatDate(delivery.deliver_date)}</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Weight className="h-4 w-4 text-gray-400" />
              <div>
                <p className="text-sm text-muted-foreground">Peso</p>
                <p className="font-medium">{delivery.weight} Lb</p>
              </div>
            </div>

            {delivery.category && (
              <div className="flex items-center gap-3">
                <Tag className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Categoría</p>
                  <p className="font-medium">{delivery.category.name}</p>
                  <p className="text-xs text-gray-500">
                    ${delivery.category.shipping_cost_per_pound}/lb
                  </p>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Card: Información del Pedido */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-400" />
              Cliente
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {delivery.client ? (
              <div className="flex items-center gap-3">
                <User className="h-4 w-4 text-gray-400" />
                <div>
                  <p className="text-sm text-muted-foreground">Cliente</p>
                  <AvatarUser user={delivery.client} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground italic">
                Sin cliente asociado
              </p>
            )}
          </CardContent>
        </Card>

        {/* Card: Costos */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-400" />
              Costos
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Costo por peso</span>
              <span className="font-medium">${delivery.weight_cost.toFixed(2)}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Ganancia manager</span>
              <span className="font-medium">${delivery.manager_profit.toFixed(2)}</span>
            </div>

            <Separator />

            <div className="flex justify-between items-center">
              <span className="text-sm font-semibold">Total</span>
              <span className="text-lg font-bold text-green-600">
                ${delivery.weight_cost.toFixed(2)}
              </span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Productos del Delivery */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Productos en el Delivery</CardTitle>
              <CardDescription>
                Lista de productos incluidos en este delivery
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowAddProductDialog(true)}
              className="bg-orange-400 hover:bg-orange-500"
            >
              <Plus className="mr-2 h-4 w-4" />
              Agregar Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <DeliveryProductsTable
            deliveryId={delivery.id}
            products={delivery.delivered_products || []}
          />
        </CardContent>
      </Card>

      {/* Dialog para agregar productos */}
      <AddProductToDeliveryDialog
        open={showAddProductDialog}
        onOpenChange={setShowAddProductDialog}
        deliveryId={delivery.id}
        clientId={delivery.client?.id}
      />
    </div>
  );
}
