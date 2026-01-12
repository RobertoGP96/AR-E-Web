import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAddProductsToOrder } from "@/hooks/order/useAddProductsToOrder";
import { useOrders } from "@/hooks/order/useOrders";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, ArrowLeft, Package, Pencil } from 'lucide-react';
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
import type { CreateProductData, Order } from "@/types";
import { parseTagsFromDescriptionBlock } from "@/lib/tags";
import { Badge } from "../ui/badge";

export default function AddMultipleProductsToOrderPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const orderId = id ? parseInt(id) : 0;

  const addProductsMutation = useAddProductsToOrder();
  const { orders } = useOrders();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Encontrar la orden actual
  const currentOrder = orders?.find((o: Order) => o.id === orderId);

  // Estado para el diálogo y la lista de productos
  const [showProductDialog, setShowProductDialog] = useState<{open: boolean, editIndex: number | null}>({open: false, editIndex: null});
  const [productsList, setProductsList] = useState<CreateProductData[]>([]);

  // Función para agregar o actualizar un producto en la lista
  const handleAddOrUpdateProduct = (product: CreateProductData) => {
    if (showProductDialog.editIndex !== null) {
      // Actualizar producto existente
      setProductsList(prev => prev.map((p, i) => 
        i === showProductDialog.editIndex ? product : p
      ));
      toast.success(`Producto "${product.name}" actualizado correctamente`);
    } else {
      // Agregar nuevo producto
      setProductsList(prev => [...prev, product]);
      toast.success(`Producto "${product.name}" agregado a la lista`);
    }
    setShowProductDialog({open: false, editIndex: null});
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
        } a la orden exitosamente`
      );

      // Navegar de vuelta a la lista de órdenes
      navigate("/orders");
    } catch (error) {
      console.error("Error adding products to order:", error);
      toast.error(
        "No se pudieron agregar los productos a la orden. Por favor intenta de nuevo."
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            onClick={() => navigate("/orders")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver a Órdenes
          </Button>
          <h1 className="text-2xl font-bold">
            Agregar Productos a la Orden #{orderId}
          </h1>
        </div>
      </div>

      {/* Información de la orden */}
      {currentOrder && (
        <Card className="border-gray-200">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">ORDEN #</p>
                <p className="font-medium">#{currentOrder.id}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">FECHA</p>
                <p>{new Date(currentOrder.created_at).toLocaleDateString()}</p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">CLIENTE</p>
                <p className="font-medium">
                  {typeof currentOrder.client === "object"
                    ? currentOrder.client.name || "Sin nombre"
                    : "Cliente no disponible"}
                </p>
              </div>
              <div className="space-y-1">
                <p className="text-xs font-medium text-gray-500">ESTADO</p>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {currentOrder.status}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Botón para agregar producto */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Lista de Productos</CardTitle>
              <CardDescription>
                Agrega productos uno por uno usando el formulario. Los productos
                aparecerán en la lista antes de ser enviados.
              </CardDescription>
            </div>
            <Button
              onClick={() => setShowProductDialog({open: true, editIndex: null})}
              className="bg-orange-500 hover:bg-orange-600"
            >
              <Plus className="h-4 w-4 mr-2" />
              Crear Producto
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {productsList.length === 0 ? (
            <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-lg">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 font-medium mb-2">
                No hay productos en la lista
              </p>
              <p className="text-sm text-gray-400">
                Haz clic en "Crear Producto" para agregar productos a esta orden
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">#</TableHead>
                    <TableHead>Nombre</TableHead>
                    <TableHead>Tienda</TableHead>
                    <TableHead>Cantidad</TableHead>
                    <TableHead>Costo Unit.</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead className="text-right">Acciones</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {productsList.map((product, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{index + 1}</TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{product.name}</p>

                          {/* Mostrar tags como badges en formato Badge(name:value) debajo de la descripción */}
                          {(() => {
                            const description = product.description as
                              | string
                              | undefined;
                            const tags =
                              parseTagsFromDescriptionBlock(description);
                            if (!tags || tags.length === 0) return null;
                            return (
                              <div className=" flex flex-row flex-wrap items-start gap-1">
                                {tags.map((tag, i) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-xs"
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
                      <TableCell>{product.shop}</TableCell>
                      <TableCell>{product.amount_requested}</TableCell>
                      <TableCell>
                        ${(product.shop_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="font-semibold">
                        ${(product.total_cost || 0).toFixed(2)}
                      </TableCell>
                      <TableCell className="text-rigth">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setShowProductDialog({open: true, editIndex: index});
                          }}
                          className="text-blue-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveProduct(index)}
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Resumen */}
              <div className="flex justify-end pt-4 border-t">
                <div className="text-right space-y-2">
                  <p className="text-sm text-gray-600">
                    Total de productos:{" "}
                    <span className="font-semibold">{productsList.length}</span>
                  </p>
                  <p className="text-lg font-bold text-orange-600">
                    Total estimado: $
                    {productsList
                      .reduce((sum, p) => sum + (p.total_cost || 0), 0)
                      .toFixed(2)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end gap-3">
        <Button
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isSubmitting || productsList.length === 0}
          className="bg-orange-500 hover:bg-orange-600"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Enviando...
            </>
          ) : (
            `Agregar ${productsList.length} Producto${
              productsList.length !== 1 ? "s" : ""
            } a la Orden`
          )}
        </Button>
      </div>

      {/* Diálogo para crear producto */}
        <Dialog 
          open={showProductDialog.open} 
          onOpenChange={(open) => setShowProductDialog({...showProductDialog, open})}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {showProductDialog.editIndex !== null ? 'Editar Producto' : 'Agregar Producto'}
              </DialogTitle>
              <DialogDescription>
                {showProductDialog.editIndex !== null 
                  ? 'Modifique la información del producto.'
                  : 'Complete la información del producto a agregar a la orden.'}
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              onSubmit={handleAddOrUpdateProduct} 
              initialValues={showProductDialog.editIndex !== null ? productsList[showProductDialog.editIndex] : undefined}
              orderId={orderId}
            />
          </DialogContent>
        </Dialog>
    </div>
  );
}
