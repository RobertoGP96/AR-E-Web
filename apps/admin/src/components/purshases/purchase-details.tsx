import React from "react";
import { useParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, ShoppingBag, Store, CreditCard } from "lucide-react";
import { useShoppingReceipt } from "@/hooks/shopping-receipts";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "./StatusBadge";
import { formatDate } from "@/lib/format-date";
import ProductPurchaseRow from "../products/buyed/product-purchase-row";
import LoadingSpinner from "../utils/LoadingSpinner";

const PurchaseDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { shoppingReceipt, isLoading, error } = useShoppingReceipt(
    Number(id) || 0,
  );

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" text="Cargando detalles" />
      </div>
    );
  }

  if (error || !shoppingReceipt) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {error?.message || "Compra no encontrada"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const profit =
    shoppingReceipt.total_cost_of_shopping -
    shoppingReceipt.total_cost_of_purchase;

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Encabezado de la Compra */}
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
                    Compra #{shoppingReceipt.id}
                  </CardTitle>
                  <p className="text-sm text-gray-500 font-medium">
                    Detalles de la adquisición
                  </p>
                </div>
              </div>
              <div className="flex gap-2 mt-2">
                <StatusBadge status={shoppingReceipt.status_of_shopping} />
              </div>
            </div>

            {/* Información de fechas */}
            <div className="text-right text-sm text-gray-500 space-y-1 bg-gray-50 p-3 rounded-lg border border-gray-100">
              <p className="flex justify-between items-center gap-4">
                <span className="font-medium text-gray-700">
                  Fecha de Compra:
                </span>
                <span className="font-mono text-gray-600">
                  {shoppingReceipt.buy_date
                    ? formatDate(shoppingReceipt.buy_date)
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
          {/* Información General */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Store className="h-5 w-5 text-gray-500" />
                Información General
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <Store className="h-3 w-3" />
                    Tienda / Proveedor
                  </div>
                  <div>
                    <p className="text-lg font-semibold text-gray-900">
                      {shoppingReceipt.shop_of_buy || "N/A"}
                    </p>
                  </div>
                </div>

                <div className="space-y-3 bg-gray-50 p-4 rounded-lg border border-gray-100">
                  <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
                    <CreditCard className="h-3 w-3" />
                    Método de Pago
                  </div>
                  <div className="space-y-1">
                    <p className="text-lg font-semibold text-gray-900">
                      {shoppingReceipt.shopping_account_name || "N/A"}
                    </p>
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className="text-xs bg-white text-gray-600 border-gray-200"
                      >
                        <CreditCard className="h-3 w-3 mr-1" />
                        {shoppingReceipt.card_id || "N/A"}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos Comprados */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                  <ShoppingBag className="h-5 w-5 text-gray-500" />
                  Productos Comprados
                </CardTitle>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                  {shoppingReceipt.buyed_products?.length || 0}{" "}
                  {shoppingReceipt.buyed_products?.length === 1
                    ? "producto"
                    : "productos"}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {shoppingReceipt.buyed_products &&
              shoppingReceipt.buyed_products.length > 0 ? (
                <div className="space-y-3">
                  {shoppingReceipt.buyed_products.map((productBuyed) => (
                    <ProductPurchaseRow
                      key={productBuyed.id}
                      product={productBuyed}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-gray-50/50 rounded-lg border-2 border-dashed border-gray-200">
                  <div className="p-3 bg-white rounded-full shadow-sm mb-3">
                    <ShoppingBag className="h-6 w-6 text-gray-400" />
                  </div>
                  <p className="text-gray-900 font-medium">
                    No hay productos asociados
                  </p>
                  <p className="text-sm text-gray-500 mt-1 max-w-xs">
                    Esta compra no tiene items registrados.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
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
              {/* Costo Real */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-500"></span>
                  Costo Real
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="text-3xl font-light text-gray-900 tracking-tight">
                    ${(shoppingReceipt.total_cost_of_purchase || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Pagado efectivamente
                  </p>
                </div>
              </div>

              <div className="h-px bg-gray-100 w-full" />

              {/* Valor Comercial */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span className="h-1.5 w-1.5 rounded-full bg-green-500"></span>
                  Valor Comercial
                </p>
                <div className="bg-gray-50 p-4 rounded-lg border border-gray-100 transition-all hover:border-gray-300 hover:shadow-sm">
                  <p className="text-3xl font-light text-gray-900 tracking-tight">
                    ${(shoppingReceipt.total_cost_of_shopping || 0).toFixed(2)}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">
                    Valor de productos
                  </p>
                </div>
              </div>

              {/* Reembolsos (si existen) */}
              {shoppingReceipt.total_refunded > 0 && (
                <>
                  <div className="h-px bg-gray-100 w-full" />
                  <div className="space-y-2">
                    <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-500"></span>
                      Reembolsado
                    </p>
                    <div className="bg-amber-50/50 p-4 rounded-lg border border-amber-100 transition-all">
                      <p className="text-2xl font-light text-amber-700 tracking-tight">
                        ${(shoppingReceipt.total_refunded || 0).toFixed(2)}
                      </p>
                    </div>
                  </div>
                </>
              )}

              <div className="h-px bg-gray-100 w-full" />

              {/* Diferencia / Profit */}
              <div className="space-y-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                  <span
                    className={`h-1.5 w-1.5 rounded-full ${profit > 0 ? "bg-green-500" : "bg-amber-500"}`}
                  ></span>
                  Diferencia
                </p>
                <div
                  className={`p-5 rounded-lg border transition-all ${
                    profit > 0
                      ? "bg-green-50/50 border-green-200 text-green-900"
                      : "bg-amber-50/50 border-amber-200 text-amber-900"
                  }`}
                >
                  <div className="flex justify-between items-end">
                    <div>
                      <p
                        className={`text-xs font-medium mb-1 uppercase tracking-wider ${
                          profit > 0 ? "text-green-600" : "text-amber-600"
                        }`}
                      >
                        Estado
                      </p>
                      <p className="font-medium text-sm">
                        {profit > 0 ? "Ahorro" : "Sobreprecio"}
                      </p>
                    </div>
                    <p className="text-3xl font-bold tracking-tight">
                      {profit > 0 ? "+" : ""}${Math.abs(profit).toFixed(2)}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PurchaseDetails;
