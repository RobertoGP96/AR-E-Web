"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import {
  Loader2,
  Package,
  Info,
  ChevronRight,
  Plus,
  Truck,
  Hash,
  Calendar,
} from "lucide-react";
import { createPackage, updatePackage } from "@/services/packages";
import { apiClient } from "@/lib/api-client";
import type {
  CreateProductReceivedData,
  Package as PackageType,
  ProductReceived,
} from "@/types/models";
import { PACKAGE_STATUSES } from "@/types/models/base";
import { DatePicker } from "@/components/utils/DatePicker";
import { useProducts } from "@/hooks/product";
import { InputGroupInput } from "@/components/ui/input-group";
import { PackageProductSelector } from "./package-products/PackageProductSelector";
import { PackageProductListEditor } from "./package-products/PackageProductListEditor";

// Schema de validación
const packageSchema = z.object({
  agency_name: z.string().min(1, "La agencia es requerida"),
  number_of_tracking: z.string().min(1, "El número de tracking es requerido"),
  status_of_processing: z.enum(["Enviado", "Recibido", "Procesado"]),
  arrival_date: z.string().min(1, "La fecha de llegada es requerida"),
});

type PackageFormData = z.infer<typeof packageSchema>;

interface PackageFormProps {
  packageData?: PackageType;
  onSuccess?: () => void;
  onCancel?: () => void;
  onInvalidate?: () => void;
}

export function PackageForm({
  packageData,
  onSuccess,
  onCancel,
  onInvalidate,
}: PackageFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados para productos
  const [selectedProducts, setSelectedProducts] = useState<
    CreateProductReceivedData[]
  >([]);
  const [selectedProductsDetails, setSelectedProductsDetails] = useState<
    ProductReceived[]
  >([]);

  const { products, isLoading: isLoadingProducts } = useProducts();

  const form = useForm<PackageFormData>({
    resolver: zodResolver(packageSchema),
    defaultValues: {
      agency_name: "",
      number_of_tracking: "",
      status_of_processing: "Enviado",
      arrival_date: new Date().toISOString().split("T")[0],
    },
  });

  // Cargar datos iniciales si estamos en modo edición
  useEffect(() => {
    if (packageData) {
      form.setValue("agency_name", packageData.agency_name);
      form.setValue("number_of_tracking", packageData.number_of_tracking);
      form.setValue("status_of_processing", packageData.status_of_processing);
      form.setValue(
        "arrival_date",
        packageData.arrival_date
          ? new Date(packageData.arrival_date).toISOString().split("T")[0]
          : "",
      );

      // Cargar productos
      if (packageData.contained_products) {
        setSelectedProductsDetails(packageData.contained_products);
        setSelectedProducts(
          packageData.contained_products.map((p) => ({
            original_product_id: p.original_product.id,
            amount_received: p.amount_received,
            observation: p.observation,
          })),
        );
      }
    }
  }, [packageData, form]);

  // Manejar cambios en el carrito desde PackageProductSelector
  const handleCartChange = (
    apiData: CreateProductReceivedData[],
    fullDetails?: ProductReceived[],
  ) => {
    setSelectedProducts(apiData);
    if (fullDetails) {
      setSelectedProductsDetails(fullDetails);
    }
  };

  // Eliminar un producto
  const removeProduct = (productId: string) => {
    const newDetails = selectedProductsDetails.filter(
      (item) => item.original_product.id !== productId,
    );
    setSelectedProductsDetails(newDetails);

    const newApiData = selectedProducts.filter(
      (item) => item.original_product_id !== productId,
    );
    setSelectedProducts(newApiData);
  };

  // Actualizar cantidad
  const updateProductQuantity = (productId: string, delta: number) => {
    const newDetails = selectedProductsDetails
      .map((item) => {
        if (item.original_product.id === productId) {
          const newQuantity = item.amount_received + delta;
          if (newQuantity <= 0) return null;
          return { ...item, amount_received: newQuantity };
        }
        return item;
      })
      .filter(Boolean) as ProductReceived[];

    setSelectedProductsDetails(newDetails);

    const newApiData = newDetails.map((item) => ({
      original_product_id: item.original_product.id,
      amount_received: item.amount_received,
      observation: item.observation,
    }));
    setSelectedProducts(newApiData);
  };

  const onSubmit = async (data: PackageFormData) => {
    setIsSubmitting(true);
    try {
      let resultPackage: PackageType;

      if (packageData?.id) {
        // Enviar también los productos si el backend lo soporta,
        // o manejar la actualización de productos por separado.
        // Por ahora, asumimos que enviamos el paquete y luego actualizamos productos
        resultPackage = await updatePackage(packageData.id, {
          ...data,
          // contained_products: selectedProducts // Intentamos enviarlos por si acaso
        } as PackageFormData);

        // Sincronizar productos
        await apiClient.post(
          `/api_data/package/${packageData.id}/add_products/`,
          {
            products: selectedProducts,
          },
        );

        toast.success("Paquete actualizado exitosamente");
        onInvalidate?.();
      } else {
        resultPackage = await createPackage(data as PackageFormData);

        // Agregar productos al nuevo paquete
        if (selectedProducts.length > 0) {
          await apiClient.post(
            `/api_data/package/${resultPackage.id}/add_products/`,
            {
              products: selectedProducts,
            },
          );
        }

        toast.success("Paquete creado exitosamente");
        onInvalidate?.();
      }

      form.reset();
      setSelectedProducts([]);
      setSelectedProductsDetails([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error saving package:", error);
      toast.error("Error al guardar el paquete");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-10 pb-20"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-orange-50 text-orange-600 shadow-inner">
              <Package className="h-6 w-6" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {packageData?.id ? "Editar Paquete" : "Nuevo Paquete"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500 font-medium">
                <span>Gestión Logística</span>
                <ChevronRight className="h-4 w-4 text-slate-300" />
                <span className="text-orange-600">
                  {packageData?.id
                    ? `ID: #${packageData.id}`
                    : "Ingreso de Carga"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Section: Details */}
            <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8">
              <div className="flex items-center gap-2 border-b border-slate-50 pb-4">
                <Truck className="h-5 w-5 text-orange-500" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Información del Envío
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                <FormField
                  control={form.control}
                  name="agency_name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-bold">
                        Agencia Logística
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <InputGroupInput
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pr-10 hover:bg-white focus-visible:bg-white transition-all shadow-none font-medium"
                            placeholder="Nombre de la agencia..."
                            {...field}
                          />
                          <Truck className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="number_of_tracking"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600 font-bold">
                        Número de Tracking
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <InputGroupInput
                            className="h-12 rounded-2xl border-slate-200 bg-slate-50/50 pr-10 hover:bg-white focus-visible:bg-white transition-all shadow-none font-mono"
                            placeholder="TRACK-XXXX-XXXX"
                            {...field}
                          />
                          <Hash className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-orange-500 transition-colors" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            </section>

            {/* Section: Items */}
            <section className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8">
              <div className="flex items-center justify-between border-b border-slate-50 pb-4">
                <div className="flex items-center gap-2">
                  <Package className="h-5 w-5 text-orange-500" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Contenido del Paquete
                  </h3>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  variant="ghost"
                  className="h-10 rounded-2xl px-5 text-sm font-extrabold text-orange-600 hover:bg-orange-50 transition-all active:scale-95"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Agregar Productos
                </Button>
              </div>

              <div className="bg-slate-50/50 rounded-[28px] border border-slate-100 overflow-hidden">
                <PackageProductListEditor
                  items={selectedProductsDetails}
                  onUpdateQuantity={updateProductQuantity}
                  onRemove={removeProduct}
                  isLoading={false}
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8 sticky top-10">
              <div className="space-y-6">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  <Info className="h-5 w-5 text-orange-500" />
                  <h4 className="text-xs font-black uppercase tracking-widest text-slate-400">
                    Estado y Fechas
                  </h4>
                </div>

                <FormField
                  control={form.control}
                  name="status_of_processing"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">
                        Estado Actual
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all font-bold text-slate-900">
                            <SelectValue placeholder="Seleccionar estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl p-2">
                          {Object.values(PACKAGE_STATUSES).map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="rounded-xl py-3 font-medium transition-colors"
                            >
                              {status}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="arrival_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs font-bold text-slate-500">
                        Fecha Estimada / Arribo
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <DatePicker
                            placeholder="Seleccionar fecha"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onDateChange={(date) =>
                              field.onChange(
                                date ? date.toISOString().split("T")[0] : "",
                              )
                            }
                            className="h-12 w-full rounded-2xl border-slate-100 bg-slate-50/50 hover:bg-white hover:border-slate-200 transition-all shadow-none font-bold"
                          />
                          <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 pointer-events-none" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Resumen rápido */}
                <div className="bg-orange-50/30 rounded-2xl p-5 border border-orange-100/50 space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">
                      Total Unidades:
                    </span>
                    <span className="font-black text-orange-600">
                      {selectedProductsDetails.reduce(
                        (acc, curr) => acc + curr.amount_received,
                        0,
                      )}
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-slate-500 font-medium">
                      Items Distintos:
                    </span>
                    <span className="font-black text-slate-900">
                      {selectedProductsDetails.length}
                    </span>
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-black text-base shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-6 w-6 animate-spin mr-2" />
                  ) : packageData?.id ? (
                    "Guardar Cambios"
                  ) : (
                    "Registrar Paquete"
                  )}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="w-full h-12 rounded-2xl text-slate-400 font-bold hover:text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Descartar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Dialogo de Selector de Productos */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[90vh] max-h-[95vh] rounded-[32px] sm:rounded-[48px] border-none shadow-2xl p-0 overflow-hidden bg-slate-50 flex flex-col">
            <div className="p-8 sm:p-10 pb-6 bg-white border-b border-slate-100 shrink-0">
              <DialogTitle className="text-3xl font-black text-slate-900 tracking-tight">
                Inventario de Productos
              </DialogTitle>
              <p className="text-slate-500 font-medium mt-1">
                Selecciona los productos comprados que han llegado en este
                paquete.
              </p>
            </div>

            <div className="flex flex-col flex-1 min-h-0">
              <div className="flex-1 overflow-y-auto px-8 py-6">
                {isLoadingProducts ? (
                  <div className="flex flex-col items-center justify-center h-64">
                    <div className="h-12 w-12 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
                    <p className="mt-4 text-slate-500 font-bold">
                      Cargando catálogo...
                    </p>
                  </div>
                ) : (
                  <PackageProductSelector
                    products={products || []}
                    statusFilter="Comprado"
                    initialCart={selectedProductsDetails}
                    onCartChange={handleCartChange}
                    showSummary={true}
                    maxHeight="auto"
                  />
                )}
              </div>

              <div className="p-8 sm:p-10 pt-6 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-4 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl h-14 px-10 border-slate-200 text-slate-600 font-bold hover:bg-slate-50 transition-all"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-2xl h-14 px-10 bg-orange-500 hover:bg-orange-600 text-white font-black shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  Validar Selección
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}
