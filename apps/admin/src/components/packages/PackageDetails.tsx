import React from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Package as PackageIcon,
  Truck,
  Calendar,
  Hash,
  ArrowLeft,
  Image as ImageIcon,
  Box,
} from "lucide-react";
import { usePackage } from "@/hooks/package";
import PackageStatusBadge from "./PackageStatusBadge";
import { formatDate } from "@/lib/format-date";
import { Button } from "@/components/ui/button";
import LoadingSpinner from "../utils/LoadingSpinner";
import type { PackageImage } from "@/types/models/package";

const PackageDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    package: packageData,
    isLoading,
    error,
  } = usePackage(Number(id) || 0);

  if (isLoading) {
    return (
      <div className="container mx-auto p-4 flex justify-center items-center min-h-64">
        <LoadingSpinner size="lg" text="Cargando detalles del paquete" />
      </div>
    );
  }

  if (error || !packageData) {
    return (
      <div className="container mx-auto p-4">
        <Card className="w-full">
          <CardContent className="p-6 text-center">
            <p className="text-red-600">
              {error?.message || "Paquete no encontrado"}
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6 bg-gray-50/50 min-h-screen">
      {/* Encabezado */}
      <Card className="border border-gray-200 shadow-sm bg-white">
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate("/packages")}
                className="h-8 w-8 text-gray-400 hover:text-gray-900 hover:bg-gray-100"
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-md bg-orange-50">
                  <PackageIcon className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold tracking-tight text-gray-900">
                    Paquete #{packageData.id}
                  </h1>
                  <p className="text-sm text-gray-500 font-medium">
                    Gestión de recepción y procesamiento
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <p className="text-xs text-gray-400 uppercase tracking-wider mb-0.5">
                  Estado actual
                </p>
                <PackageStatusBadge status={packageData.status_of_processing} />
              </div>
              {/* Mobile only badge */}
              <div className="sm:hidden">
                <PackageStatusBadge status={packageData.status_of_processing} />
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Columna Principal - 2/3 */}
        <div className="lg:col-span-2 space-y-6">
          {/* Información General */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                <Box className="h-5 w-5 text-gray-500" />
                Información de Logística
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <Truck className="h-3 w-3" />
                    Agencia
                  </h4>
                  <p className="text-gray-900 font-medium text-lg">
                    {packageData.agency_name || "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <Hash className="h-3 w-3" />
                    No. Rastreo
                  </h4>
                  <p className="font-mono text-gray-900 font-medium bg-gray-50 px-2 py-0.5 rounded inline-block border border-gray-100">
                    {packageData.number_of_tracking || "N/A"}
                  </p>
                </div>

                <div className="space-y-1">
                  <h4 className="text-xs font-bold text-orange-600 uppercase tracking-wider flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Llegada
                  </h4>
                  <p className="text-gray-900 font-medium">
                    {packageData.arrival_date
                      ? formatDate(packageData.arrival_date)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Productos Recibidos */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="border-b border-gray-100 pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-900">
                  <PackageIcon className="h-5 w-5 text-gray-500" />
                  Contenido del Paquete
                </CardTitle>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-50 text-orange-700 border border-orange-100">
                  {packageData.contained_products?.length || 0} items
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {packageData.contained_products &&
              packageData.contained_products.length > 0 ? (
                <div className="space-y-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {packageData.contained_products.map((product: any) => (
                    <div
                      key={product.id}
                      className="group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-lg border border-gray-200 bg-white hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200"
                    >
                      <div className="flex-1 space-y-1">
                        <h5 className="font-semibold text-gray-900 group-hover:text-orange-900 transition-colors">
                          {product.original_product.name}
                        </h5>
                        <p className="text-xs text-gray-400 font-mono">
                          ID: #{product.original_product.id}
                        </p>
                        {product.observation && (
                          <p className="text-sm text-gray-600 mt-2 bg-yellow-50 p-2 rounded border border-yellow-100 italic">
                            "{product.observation}"
                          </p>
                        )}
                      </div>
                      <div className="mt-4 sm:mt-0 sm:ml-6 flex items-center">
                        <div className="flex flex-col items-end">
                          <span className="text-xs text-gray-500 uppercase tracking-wide mb-1">
                            Cantidad
                          </span>
                          <span className="text-lg font-bold text-gray-900 px-3 py-1 bg-gray-50 rounded border border-gray-100">
                            {product.amount_received}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 bg-gray-50/50 rounded-lg border border-dashed border-gray-200">
                  <div className="bg-white p-3 rounded-full shadow-sm inline-block mb-3">
                    <PackageIcon className="h-6 w-6 text-gray-300" />
                  </div>
                  <p className="text-gray-500 font-medium">
                    Sin contenido registrado
                  </p>
                  <p className="text-sm text-gray-400">
                    No hay productos asociados a este paquete.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Columna Lateral - 1/3 Sticky */}
        <div className="lg:col-span-1 space-y-6">
          {/* Evidencias Fotográficas */}
          <Card className="sticky top-6 border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2 text-gray-800">
                  <ImageIcon className="h-5 w-5 text-gray-500" />
                  Evidencias
                </CardTitle>
                <span className="text-xs font-medium text-gray-500">
                  {packageData.package_picture?.length || 0} fotos
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-6">
              {packageData.package_picture &&
              packageData.package_picture.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {packageData.package_picture.map(
                    (item: PackageImage, index: number) => (
                      <div
                        key={
                          (typeof item === "string" ? item : item.id) || index
                        }
                        className="relative aspect-square rounded-lg overflow-hidden border border-gray-200 hover:border-orange-400 transition-all cursor-pointer group shadow-sm bg-gray-50"
                      >
                        <img
                          src={
                            (typeof item === "string" ? item : item.picture) ||
                            "/placeholder-image.png"
                          }
                          alt={`Evidencia ${index + 1}`}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                          <ImageIcon className="text-white opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6" />
                        </div>
                      </div>
                    ),
                  )}
                </div>
              ) : (
                <div className="text-center py-8 px-4 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  <ImageIcon className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                  <p className="text-sm text-gray-500">
                    No hay evidencias fotográficas cargadas.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Meta Información */}
          <Card className="border border-gray-200 shadow-sm bg-white">
            <CardHeader className="pb-4 border-b border-gray-100">
              <CardTitle className="text-sm font-bold text-gray-500 uppercase tracking-wider">
                Historial
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-green-500"></div>
                  Creado
                </span>
                <span className="font-medium text-gray-900 text-right">
                  {formatDate(packageData.created_at)}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-500 flex items-center gap-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-orange-500"></div>
                  Actualizado
                </span>
                <span className="font-medium text-gray-900 text-right">
                  {formatDate(packageData.updated_at)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default PackageDetails;
