import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useProducts } from "@/hooks/product";
import { useAddProductToDelivery } from "@/hooks/delivery";
import { toast } from "sonner";
import { Loader2, Search, Package } from "lucide-react";
import type { ID, UUID, Product } from "@/types";

interface AddProductToDeliveryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  deliveryId: ID;
  clientId?: ID; // ID del cliente para filtrar productos
}

export function AddProductToDeliveryDialog({
  open,
  onOpenChange,
  deliveryId,
  clientId,
}: AddProductToDeliveryDialogProps) {
  const [selectedProductId, setSelectedProductId] = useState<UUID | "">("");
  const [amount, setAmount] = useState<number>(1);
  const [searchTerm, setSearchTerm] = useState("");

  // Obtener productos del cliente o todos los productos
  const { products, isLoading: loadingProducts } = useProducts(
    clientId ? { client_id: clientId as number } : undefined,
  );

  const addProductMutation = useAddProductToDelivery();

  // Filtrar productos por término de búsqueda
  const filteredProducts = products.filter(
    (product: Product) =>
      product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  // Resetear el formulario cuando se cierra el diálogo
  useEffect(() => {
    if (!open) {
      setSelectedProductId("");
      setAmount(1);
      setSearchTerm("");
    }
  }, [open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedProductId) {
      toast.error("Por favor selecciona un producto");
      return;
    }

    if (amount <= 0) {
      toast.error("La cantidad debe ser mayor a 0");
      return;
    }

    try {
      await addProductMutation.mutateAsync({
        deliveryId,
        productId: selectedProductId,
        amount,
      });
      toast.success("Producto agregado al delivery");
      onOpenChange(false);
    } catch (error) {
      console.error("Error al agregar producto:", error);
      toast.error("Error al agregar el producto al delivery");
    }
  };

  const selectedProduct = products.find(
    (p: Product) => p.id === selectedProductId,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Agregar Producto al Delivery</DialogTitle>
          <DialogDescription>
            {clientId
              ? "Selecciona un producto del cliente para agregarlo a este delivery"
              : "Selecciona cualquier producto para agregarlo a este delivery"}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Buscador de productos */}
          <div className="space-y-2">
            <Label>Buscar Producto</Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Buscar por nombre o SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>

          {/* Selector de producto */}
          <div className="space-y-2">
            <Label htmlFor="product">Producto *</Label>
            {loadingProducts ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center border rounded-lg bg-gray-50">
                <Package className="h-12 w-12 text-gray-300 mb-2" />
                <p className="text-sm text-gray-500">
                  {searchTerm
                    ? "No se encontraron productos"
                    : "No hay productos disponibles"}
                </p>
              </div>
            ) : (
              <Select
                value={selectedProductId}
                onValueChange={(value) => setSelectedProductId(value as UUID)}
              >
                <SelectTrigger id="product">
                  <SelectValue placeholder="Selecciona un producto" />
                </SelectTrigger>
                <SelectContent>
                  {filteredProducts.map((product: Product) => (
                    <SelectItem key={product.id} value={product.id}>
                      <div className="flex items-center gap-2">
                        {product.image_url && (
                          <img
                            src={product.image_url}
                            alt={product.name}
                            className="h-8 w-8 rounded object-cover"
                          />
                        )}
                        <div className="flex flex-col">
                          <span className="font-medium">{product.name}</span>
                          <span className="text-xs text-gray-500">
                            SKU: {product.sku}
                          </span>
                        </div>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>

          {/* Información del producto seleccionado */}
          {selectedProduct && (
            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200 space-y-2">
              <h4 className="font-medium text-blue-900">
                Información del Producto
              </h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="text-gray-600">Disponible:</span>
                  <span className="ml-2 font-medium">
                    {selectedProduct.amount_delivered} unidades
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Tienda:</span>
                  <span className="ml-2 font-medium">
                    {selectedProduct.shop}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Costo:</span>
                  <span className="ml-2 font-medium">
                    ${selectedProduct.cost_per_product.toFixed(2)}
                  </span>
                </div>
                <div>
                  <span className="text-gray-600">Estado:</span>
                  <span className="ml-2 font-medium">
                    {selectedProduct.status}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Cantidad */}
          <div className="space-y-2">
            <Label htmlFor="amount">Cantidad a Entregar *</Label>
            <Input
              id="amount"
              type="number"
              min="1"
              max={selectedProduct?.amount_delivered}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="Ingrese la cantidad"
            />
            {selectedProduct && amount > selectedProduct.amount_delivered && (
              <p className="text-sm text-red-600">
                La cantidad no puede exceder las unidades disponibles (
                {selectedProduct.amount_delivered})
              </p>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={addProductMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={
                !selectedProductId ||
                amount <= 0 ||
                addProductMutation.isPending ||
                (selectedProduct
                  ? amount > selectedProduct.amount_delivered
                  : false)
              }
              className="bg-orange-400 hover:bg-orange-500"
            >
              {addProductMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Agregando...
                </>
              ) : (
                "Agregar Producto"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
