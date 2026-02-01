import React, { useState } from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

import { Loader2, DollarSign, User, Truck, ShoppingBag } from "lucide-react";
import { useOrder } from "@/hooks/order/useOrder";
import ProductRow from "@/components/products/product-row";
import { ProductEditDialog } from "@/components/products/ProductEditDialog";
import OrderStatusBadge from "./OrderStatusBadge";
import PaymentStatusBadge from "./PaymentStatusBadge";

import type { Product } from "@/types/models";

const OrderDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { order, isLoading, error } = useOrder(Number(id) || 0);

  // Estado para el diálogo de edición de producto
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const handleCloseEditDialog = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setEditingProduct(null);
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
        <span className="ml-2">Cargando pedido...</span>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {error?.message || "Pedido no encontrado"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Encabezado de la Orden */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-50">
                  <ShoppingBag className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <CardTitle className="text-2xl font-bold text-gray-900">
                    Orden #{order.id}
                  </CardTitle>
                  <p className="text-sm text-gray-500 font-medium">
                    Detalles de la transacción
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <OrderStatusBadge status={order.status} />
                <PaymentStatusBadge status={order.pay_status} />
              </div>
            </div>

            {/* Información de fechas en el encabezado */}
            <div className="text-right text-sm text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="flex justify-between items-center gap-4">
                <span className="font-medium text-gray-700">Creado:</span>
                <span className="font-mono text-gray-600">
                  {order.created_at
                    ? new Date(order.created_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </span>
              </p>
              <div className="h-px bg-gray-200 w-full my-1"></div>
              <p className="flex justify-between items-center gap-4">
                <span className="font-medium text-gray-700">Actualizado:</span>
                <span className="font-mono text-gray-600">
                  {order.updated_at
                    ? new Date(order.updated_at).toLocaleDateString("es-ES", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })
                    : "N/A"}
                </span>
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Contenido Principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - 2/3 del ancho */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información del Cliente y Agente */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <User className="h-5 w-5 text-gray-500" />
                Información de Contacto
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <User className="h-3 w-3" />
                    Cliente
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {order.client
                        ? `${order.client.name} ${order.client.last_name}`
                        : "N/A"}
                    </p>
                    {order.client?.email && (
                      <p className="text-sm text-gray-500 font-medium">
                        {order.client.email}
                      </p>
                    )}
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <User className="h-3 w-3" />
                    Agente de Ventas
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {order.sales_manager
                        ? `${order.sales_manager.name} ${order.sales_manager.last_name}`
                        : "N/A"}
                    </p>
                    {order.sales_manager?.email && (
                      <p className="text-sm text-gray-500 font-medium">
                        {order.sales_manager.email}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos */}
          {order.products && order.products.length > 0 && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <ShoppingBag className="h-5 w-5 text-gray-500" />
                    Productos
                  </CardTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                    {order.products.length}{" "}
                    {order.products.length === 1 ? "producto" : "productos"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {order.products.map((product) => (
                    <ProductRow
                      key={product.id}
                      product={product}
                      onEdit={handleEditProduct}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recibos de Entrega */}
          {order.delivery_receipts && order.delivery_receipts.length > 0 && (
            <Card className="border border-gray-200 shadow-sm bg-white">
              <CardHeader className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                    <Truck className="h-5 w-5 text-gray-500" />
                    Recibos de Entrega
                  </CardTitle>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200">
                    {order.delivery_receipts.length}{" "}
                    {order.delivery_receipts.length === 1
                      ? "recibo"
                      : "recibos"}
                  </span>
                </div>
              </CardHeader>
              <CardContent className="pt-6">
                <div className="space-y-3">
                  {order.delivery_receipts.map((receipt) => (
                    <div
                      key={receipt.id}
                      className="group flex items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200"
                    >
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 text-orange-600 bg-orange-50 rounded-full flex items-center justify-center border border-orange-100 group-hover:scale-110 transition-transform">
                          <Truck className="h-5 w-5" />
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">
                            Recibo #{receipt.id}
                          </p>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="h-1.5 w-1.5 rounded-full bg-orange-500"></span>
                            <p className="text-sm text-gray-500">
                              Estado:{" "}
                              <span className="font-medium text-gray-700">
                                {receipt.status}
                              </span>
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Columna Lateral - 1/3 del ancho - Información Financiera */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                <div className="p-2 rounded-md bg-orange-50">
                  <DollarSign className="h-5 w-5 text-orange-600" />
                </div>
                Resumen Financiero
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 pt-6">
              {/* Costo Total */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                  Costo Total
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="text-3xl font-light text-gray-900 tracking-tight">
                    ${(order.total_cost || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Valor Recibido */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-gray-400"></span>
                  Valor Recibido
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="text-3xl font-light text-gray-900 tracking-tight">
                    ${(order.received_value_of_client || 0).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Balance */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${
                      (order.received_value_of_client || 0) -
                        (order.total_cost || 0) >=
                      0
                        ? "bg-gray-400"
                        : "bg-orange-500"
                    }`}
                  ></span>
                  Balance
                </p>
                <div
                  className={`p-5 rounded-lg border transition-all ${
                    (order.received_value_of_client || 0) -
                      (order.total_cost || 0) >=
                    0
                      ? "bg-gray-900 border-gray-900 text-white"
                      : "bg-orange-50 border-orange-200 text-orange-900"
                  }`}
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <p
                        className={`text-xs font-medium mb-1 uppercase tracking-wider ${
                          (order.received_value_of_client || 0) -
                            (order.total_cost || 0) >=
                          0
                            ? "text-gray-400"
                            : "text-orange-600"
                        }`}
                      >
                        Estado
                      </p>
                      <p className="font-medium text-sm">
                        {(order.received_value_of_client || 0) -
                          (order.total_cost || 0) >=
                        0
                          ? "Pagado"
                          : "Pendiente"}
                      </p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">
                      {(order.received_value_of_client || 0) -
                        (order.total_cost || 0) >=
                      0
                        ? "+"
                        : ""}
                      $
                      {Math.abs(
                        (order.received_value_of_client || 0) -
                          (order.total_cost || 0),
                      ).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Diálogo de edición de producto */}
      <ProductEditDialog
        product={editingProduct}
        open={isEditDialogOpen}
        onOpenChange={handleCloseEditDialog}
      />
    </div>
  );
};

export default OrderDetails;
