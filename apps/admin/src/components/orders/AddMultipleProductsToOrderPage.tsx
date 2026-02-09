import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAddProductsToOrder } from "@/hooks/order/useAddProductsToOrder";
import { useOrders } from "@/hooks/order/useOrders";
import { useShops } from "@/hooks/shop/useShops";
import { useCategories } from "@/hooks/category/useCategory";

import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ArrowLeft,
  Package,
  Pencil,
  Plus,
  Trash2,
  Loader2,
  Calendar,
  User,
  Hash,
  Tag,
  ClipboardList,
  ShoppingBag,
  ChevronRight,
} from "lucide-react";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ProductForm } from "@/components/products/ProductForm";
import type { CreateProductData, Order, Category } from "@/types";

import { parseTagsFromDescriptionBlock } from "@/lib/tags";
import { Badge } from "../ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

export default function AddMultipleProductsToOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id ? parseInt(id) : 0;

  const addProductsMutation = useAddProductsToOrder();
  const { orders, isLoading: isLoadingOrders } = useOrders();
  const { shops } = useShops();
  const { data: categoriesData } = useCategories();
  const categories = categoriesData?.results || [];

  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encontrar la orden actual
  const currentOrder = orders?.find((o: Order) => o.id === orderId);

  // Estado para el diálogo y la lista de productos
  const [showProductDialog, setShowProductDialog] = useState<{
    open: boolean;
    editIndex: number | null;
  }>({ open: false, editIndex: null });
  const [productsList, setProductsList] = useState<CreateProductData[]>([]);

  // Función para agregar o actualizar un producto en la lista
  const handleAddOrUpdateProduct = (product: CreateProductData) => {
    if (showProductDialog.editIndex !== null) {
      // Actualizar producto existente
      setProductsList((prev) =>
        prev.map((p, i) => (i === showProductDialog.editIndex ? product : p)),
      );
      toast.success(`Producto "${product.name}" actualizado correctamente`);
    } else {
      // Agregar nuevo producto
      setProductsList((prev) => [...prev, product]);
      toast.success(`Producto "${product.name}" agregado a la lista`);
    }
    setShowProductDialog({ open: false, editIndex: null });
  };

  // Función para remover un producto de la lista
  const handleRemoveProduct = (index: number) => {
    const product = productsList[index];
    setProductsList((prev) => prev.filter((_, i) => i !== index));
    toast.info(`Producto "${product.name}" removido de la lista`);
  };

  // Función para enviar todos los productos a la orden
  const handleSubmit = async () => {
    if (productsList.length === 0) {
      toast.error("Debe agregar al menos un producto a la lista");
      return;
    }

    setIsSubmitting(true);

    try {
      await addProductsMutation.mutateAsync({
        orderId,
        products: productsList,
      });

      toast.success(
        `Se agregaron ${productsList.length} producto${
          productsList.length > 1 ? "s" : ""
        } a la orden exitosamente`,
      );

      // Navegar de vuelta a la lista de órdenes
      navigate("/orders");
    } catch (error) {
      console.error("Error adding products to order:", error);
      toast.error(
        "No se pudieron agregar los productos a la orden. Por favor intenta de nuevo.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    navigate("/orders");
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-2">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            onClick={() => navigate("/orders")}
            className="group h-12 w-12 rounded-2xl bg-white border border-slate-100 shadow-sm hover:bg-slate-50 hover:border-slate-200 transition-all"
          >
            <ArrowLeft className="h-5 w-5 text-slate-600 group-hover:-translate-x-0.5 transition-transform" />
          </Button>
          <div>
            <h1 className="text-3xl font-black tracking-tight text-slate-900">
              Gestión de Productos
            </h1>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-slate-400">
              <span>Órdenes</span>
              <ChevronRight className="h-3 w-3" />
              <span className="text-orange-600">Asignación Múltiple</span>
              <ChevronRight className="h-3 w-3" />
              <span>ID #{orderId}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Información de la orden */}
      {isLoadingOrders ? (
        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
              <Skeleton className="h-4 w-4 rounded-full" />
              <Skeleton className="h-4 w-32" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[1, 2, 3, 4].map((i) => (
                <div
                  key={i}
                  className="flex flex-col gap-2 p-3 rounded-2xl bg-slate-50/50 border border-slate-50"
                >
                  <div className="flex items-center gap-2">
                    <Skeleton className="h-3 w-3 rounded-full" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                  <Skeleton className="h-5 w-24 ml-5" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ) : currentOrder ? (
        <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white">
          <CardContent className="p-6">
            <div className="flex items-center gap-2 border-b border-slate-100 pb-3 mb-6">
              <ClipboardList className="h-4 w-4 text-slate-400" />
              <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                Detalles de la Orden Destino
              </h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Card: ID */}
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Hash className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Identificador
                  </span>
                </div>
                <p className="text-lg font-black text-slate-900 ml-5.5">
                  #{currentOrder.id}
                </p>
              </div>

              {/* Card: Fecha */}
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Calendar className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Fecha de Creación
                  </span>
                </div>
                <p className="text-sm font-semibold text-slate-700 ml-5.5">
                  {new Date(currentOrder.created_at).toLocaleDateString(
                    "es-ES",
                    {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    },
                  )}
                </p>
              </div>

              {/* Card: Cliente */}
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <User className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Cliente Asignado
                  </span>
                </div>
                <p className="text-sm font-bold text-orange-600 ml-5.5 truncate">
                  {typeof currentOrder.client === "object"
                    ? currentOrder.client.name +
                        " " +
                        currentOrder.client.last_name || "Sin nombre"
                    : "Cliente no disponible"}
                </p>
              </div>

              {/* Card: Estado */}
              <div className="flex flex-col gap-1 p-4 rounded-2xl bg-slate-50/50 border border-slate-50 hover:bg-white transition-all">
                <div className="flex items-center gap-2 text-slate-500 mb-1">
                  <Tag className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold uppercase tracking-wider">
                    Estado Actual
                  </span>
                </div>
                <div className="ml-5.5">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-bold bg-orange-100 text-orange-700 border border-orange-200">
                    {currentOrder.status}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div
          className="bg-red-50 border border-red-100 text-red-600 p-6 rounded-[32px] flex items-center gap-4 shadow-sm"
          role="alert"
        >
          <div className="h-12 w-12 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
            <Package className="h-6 w-6" />
          </div>
          <div>
            <p className="font-black text-lg">Orden No Encontrada</p>
            <p className="text-sm opacity-80 font-medium text-slate-500">
              No se pudo recuperar la información de la orden #{orderId}.
              Verifique el identificador.
            </p>
          </div>
        </div>
      )}

      {/* Botón para agregar producto */}
      <Card className="rounded-[32px] border-slate-100 shadow-sm overflow-hidden bg-white">
        <CardHeader className="p-8 pb-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <ShoppingBag className="h-5 w-5" />
              </span>
              <div>
                <CardTitle className="text-xl font-black text-slate-900">
                  Items de la Orden
                </CardTitle>
                <CardDescription className="text-slate-500 font-medium max-w-md">
                  Añada los productos solicitados. Se registrarán temporalmente
                  antes del envío definitivo.
                </CardDescription>
              </div>
            </div>
            <Button
              onClick={() =>
                setShowProductDialog({ open: true, editIndex: null })
              }
              className="rounded-2xl h-12 px-6 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <Plus className="h-4 w-4 mr-2" />
              Nuevo Item
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-8 pt-6">
          {productsList.length === 0 ? (
            <div className="text-center py-16 border-2 border-dashed border-slate-100 rounded-[32px] bg-slate-50/30">
              <div className="h-16 w-16 bg-white rounded-3xl shadow-sm flex items-center justify-center mx-auto mb-4 border border-slate-50">
                <Package className="h-8 w-8 text-slate-300" />
              </div>
              <p className="text-slate-900 font-black text-lg mb-1">
                Lista Vacía
              </p>
              <p className="text-sm text-slate-400 font-medium max-w-xs mx-auto">
                No hay productos registrados aún. Utilice el botón superior para
                empezar.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="bg-slate-50/50 rounded-[24px] border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-white/50">
                    <TableRow className="border-slate-100 hover:bg-transparent">
                      <TableHead className="w-12 text-[10px] font-bold uppercase tracking-widest text-slate-400 pl-6">
                        #
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Producto
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Categoría
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-center">
                        Cant.
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Costo Unit.
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                        Subtotal
                      </TableHead>
                      <TableHead className="text-[10px] font-bold uppercase tracking-widest text-slate-400 text-right pr-6">
                        Acciones
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {productsList.map((product, index) => (
                      <TableRow
                        key={index}
                        className="border-slate-50 hover:bg-white transition-colors"
                      >
                        <TableCell className="font-bold text-slate-400 pl-6 text-xs">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="py-1">
                            <p className="font-bold text-slate-900 capitalize">
                              {product.name}
                            </p>
                            <p className="text-[10px] text-slate-400 font-medium truncate max-w-[200px] capitalize">
                              {typeof product.shop === "number"
                                ? shops.find((s) => s.id === product.shop)
                                    ?.name || "Tienda no encontrada"
                                : product.shop || "Sin tienda"}
                            </p>

                            {/* Mostrar tags como badges */}
                            {(() => {
                              const description = product.description as
                                | string
                                | undefined;
                              const tags =
                                parseTagsFromDescriptionBlock(description);
                              if (!tags || tags.length === 0) return null;
                              return (
                                <div className="flex flex-row flex-wrap items-start gap-1 mt-1.5">
                                  {tags.map((tag, i) => (
                                    <Badge
                                      key={i}
                                      variant="secondary"
                                      className="text-[9px] h-4 px-1.5 rounded-md bg-slate-100/80 text-slate-600 border-none hover:bg-slate-200 transition-colors"
                                    >
                                      {tag.name}
                                      {tag.value ? `: ${tag.value}` : ""}
                                    </Badge>
                                  ))}
                                </div>
                              );
                            })()}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className="rounded-lg border-slate-200 text-slate-500 font-bold text-[10px] uppercase tracking-wider"
                          >
                            {typeof product.category === "number"
                              ? categories.find(
                                  (c: Category) => c.id === product.category,
                                )?.name || "Sin categoría"
                              : product.category || "Sin categoría"}
                          </Badge>
                        </TableCell>

                        <TableCell className="text-center">
                          <span className="inline-flex h-7 px-3 items-center justify-center rounded-lg bg-orange-50 text-orange-600 font-black text-xs">
                            {product.amount_requested}
                          </span>
                        </TableCell>
                        <TableCell className="text-slate-500 font-semibold text-xs">
                          ${(product.shop_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="font-black text-slate-900 text-xs">
                          ${(product.total_cost || 0).toFixed(2)}
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() =>
                                setShowProductDialog({
                                  open: true,
                                  editIndex: index,
                                })
                              }
                              className="h-8 w-8 rounded-xl text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-all"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleRemoveProduct(index)}
                              className="h-8 w-8 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              {/* Resumen Final */}
              <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-6 pt-6 border-t border-slate-100">
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Items totales
                  </span>
                  <span className="h-8 px-4 flex items-center justify-center rounded-xl bg-slate-100 text-slate-900 font-black text-sm">
                    {productsList.length}
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Proyección Total
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-slate-400 font-medium text-sm">
                      $
                    </span>
                    <span className="text-3xl font-black text-slate-900 tracking-tighter">
                      {productsList
                        .reduce((sum, p) => sum + (p.total_cost || 0), 0)
                        .toFixed(2)}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3 pt-4 pb-12">
        <Button
          variant="ghost"
          onClick={handleCancel}
          disabled={isSubmitting}
          className="h-14 px-8 rounded-2xl text-slate-400 font-bold hover:text-slate-600 transition-all"
        >
          Descartar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || productsList.length === 0}
          className="h-14 px-10 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-base shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Procesando Envío...
            </>
          ) : (
            `Vincular ${productsList.length} Producto${productsList.length !== 1 ? "s" : ""} a la Orden`
          )}
        </Button>
      </div>

      {/* Diálogo para crear producto */}
      <Dialog
        open={showProductDialog.open}
        onOpenChange={(open) =>
          setShowProductDialog({ ...showProductDialog, open })
        }
      >
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[32px] border-none shadow-2xl p-8">
          <DialogHeader className="mb-6">
            <div className="flex items-center gap-3 mb-2">
              <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
                <Package className="h-5 w-5" />
              </span>
              <DialogTitle className="text-2xl font-black text-slate-900">
                {showProductDialog.editIndex !== null
                  ? "Editar Producto"
                  : "Nuevo Item para Orden"}
              </DialogTitle>
            </div>
            <DialogDescription className="text-slate-500 font-medium">
              {showProductDialog.editIndex !== null
                ? "Modifique la información técnica del producto seleccionado."
                : "Especifique el producto y cantidades que desea anexar a esta orden."}
            </DialogDescription>
          </DialogHeader>
          <div className="bg-slate-50/50 rounded-3xl p-1 border border-slate-100">
            <ProductForm
              onSubmit={handleAddOrUpdateProduct}
              initialValues={
                showProductDialog.editIndex !== null
                  ? productsList[showProductDialog.editIndex]
                  : undefined
              }
              orderId={orderId}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
