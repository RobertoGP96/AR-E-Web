import { useParams, useNavigate } from "react-router-dom";
import { useSingleDelivery } from "@/hooks/delivery";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  Truck,
  Weight,
  User,
  Plus,
  Loader2,
  Tag,
  Package,
  Users,
} from "lucide-react";
import { formatDate } from "@/lib/format-date";
import DeliveryStatusBadge from "@/components/delivery/DeliveryStatusBadge";
import { useState } from "react";
import { AddProductToDeliveryDialog } from "@/components/delivery/AddProductToDeliveryDialog";
import { DeliveryProductsTable } from "@/components/delivery/DeliveryProductsTable";

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
            <p className="text-red-600 font-medium">
              Error al cargar el delivery
            </p>
            <Button
              onClick={() => navigate("/deliveries")}
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
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Header */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/deliveries")}
                className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-50">
                  <Truck className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Delivery #{delivery.id}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Gestión de entrega y paquetería
                  </p>
                </div>
              </div>
            </div>
            <DeliveryStatusBadge status={delivery.status} />
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Cliente */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <User className="h-5 w-5 text-gray-500" />
                Información del Cliente
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {delivery.client ? (
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="bg-white p-2 rounded-full border border-gray-200 text-orange-600">
                    <User className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">
                      {delivery.client.name} {delivery.client.last_name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {delivery.client.email || "Sin email registrado"}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-6 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <Users className="h-8 w-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">
                    Sin cliente asociado a esta entrega
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Productos */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Package className="h-5 w-5 text-gray-500" />
                    Productos en el Delivery
                  </CardTitle>
                </div>
                <Button
                  onClick={() => setShowAddProductDialog(true)}
                  className="bg-orange-600 hover:bg-orange-700 text-white border-green-600 shadow-sm h-8 text-sm"
                >
                  <Plus className="mr-2 h-3 w-3" />
                  Agregar Producto
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <div className="p-2">
                <DeliveryProductsTable
                  deliveryId={delivery.id}
                  products={delivery.delivered_products || []}
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral - 1/3 Sticky */}
        <div className="lg:col-span-1 space-y-6">
          {/* Resumen Financiero */}
          <Card className="sticky top-6 border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-md bg-orange-50">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                Costos de Entrega
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5 pt-6">
              <div className="space-y-3">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Costo por peso</span>
                  <span className="font-medium text-gray-900">
                    ${delivery.weight_cost.toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Ganancia manager</span>
                  <span className="font-medium text-gray-900 text-green-600">
                    + ${delivery.manager_profit.toFixed(2)}
                  </span>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2 mb-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                  Total
                </p>
                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                  <p className="text-3xl font-light text-gray-900 tracking-tight text-center">
                    ${delivery.weight_cost.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Detalles Logísticos */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Detalles Logísticos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                    <Calendar className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Fecha de Entrega</p>
                    <p className="text-sm font-medium text-gray-900">
                      {formatDate(delivery.deliver_date)}
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-500">
                    <Weight className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Peso Total</p>
                    <p className="text-sm font-medium text-gray-900">
                      {delivery.weight} Lb
                    </p>
                  </div>
                </div>
              </div>

              {delivery.category && (
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <Tag className="h-3 w-3 text-orange-500" />
                    <span className="text-xs font-bold text-gray-700 uppercase">
                      Categoría
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-900 font-medium">
                      {delivery.category.name}
                    </span>
                    <span className="text-xs bg-white px-2 py-0.5 rounded border border-gray-200 text-gray-500 font-mono">
                      ${delivery.category.shipping_cost_per_pound}/lb
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

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
