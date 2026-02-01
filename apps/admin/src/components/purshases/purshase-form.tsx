import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
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
  CreditCard,
  Loader2,
  Package,
  Trash2,
  ShoppingCart,
  DollarSign,
} from "lucide-react";
import { shoppingReceipService } from "@/services/api";
import type {
  CreateProductBuyedData,
  ProductBuyed,
  ShoppingReceip,
} from "@/types/models";
import { SHOPPING_STATUSES } from "@/types/models/base";
import { DatePicker } from "@/components/utils/DatePicker";
import { useShops } from "@/hooks/useShops";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "../ui/input-group";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ProductSelector } from "./purchase-products/purchase-product-selector";
import { useProducts } from "@/hooks/product";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";

// Schema de validación
const createShoppingReceipSchema = z.object({
  shop_of_buy_id: z.number().min(1, "Debes seleccionar una tienda"),
  shopping_account_id: z
    .number()
    .min(1, "Debes seleccionar una cuenta de compra")
    .optional(),
  status_of_shopping: z.enum(["No pagado", "Pagado", "Parcial"]).optional(),
  buy_date: z.string().optional(),
  card_id: z.string().optional(),
  total_cost_of_purchase: z
    .number()
    .min(0, "El costo debe ser mayor o igual a 0")
    .optional(),
});

type CreateShoppingReceipFormData = z.infer<typeof createShoppingReceipSchema>;

interface PurchaseFormProps {
  purchase?: ShoppingReceip;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function PurchaseForm({ onSuccess, onCancel }: PurchaseFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  // Estados separados: uno para la API y otro para mostrar detalles
  const [selectedProducts, setSelectedProducts] = useState<
    CreateProductBuyedData[]
  >([]);
  const [selectedProductsDetails, setSelectedProductsDetails] = useState<
    ProductBuyed[]
  >([]);

  const { shops, isLoading: isLoadingShops } = useShops();
  const { products, isLoading } = useProducts();

  const form = useForm<CreateShoppingReceipFormData>({
    resolver: zodResolver(createShoppingReceipSchema),
    defaultValues: {
      shop_of_buy_id: undefined,
      shopping_account_id: undefined,
      status_of_shopping: undefined,
      buy_date: undefined,
      total_cost_of_purchase: undefined,
      card_id: undefined,
    },
  });

  const selectedShopId = form.watch("shop_of_buy_id");
  const selectedShop = shops.find((shop) => shop.id === selectedShopId);
  const buyingAccounts = selectedShop?.buying_accounts || [];

  // Calcular total automáticamente cuando cambian los productos
  useEffect(() => {
    const total = selectedProductsDetails.reduce((sum, item) => {
      return sum + item.original_product_details.total_cost * item.amount_buyed;
    }, 0);
    form.setValue("total_cost_of_purchase", total);
  }, [selectedProductsDetails, form]);

  // Manejar cambios en el carrito desde ProductSelector
  const handleCartChange = (
    apiData: CreateProductBuyedData[],
    fullDetails?: ProductBuyed[],
  ) => {
    setSelectedProducts(apiData);
    if (fullDetails) {
      setSelectedProductsDetails(fullDetails);
    }
  };

  // Eliminar un producto del carrito
  const removeProductFromCart = (productId: string) => {
    const newDetails = selectedProductsDetails.filter(
      (item) => item.product_id !== productId,
    );
    setSelectedProductsDetails(newDetails);

    const newApiData = selectedProducts.filter(
      (item) => item.original_product !== productId,
    );
    setSelectedProducts(newApiData);
  };

  // Actualizar cantidad de un producto
  const updateProductQuantity = (productId: string, delta: number) => {
    const newDetails = selectedProductsDetails
      .map((item) => {
        if (item.product_id === productId) {
          const newQuantity = item.amount_buyed + delta;
          if (newQuantity <= 0) return null;
          return { ...item, amount_buyed: newQuantity };
        }
        return item;
      })
      .filter(Boolean) as ProductBuyed[];

    setSelectedProductsDetails(newDetails);

    const newApiData = newDetails.map((item) => ({
      original_product: item.product_id as string,
      amount_buyed: item.amount_buyed,
    }));
    setSelectedProducts(newApiData);
  };

  const onSubmit = async (data: CreateShoppingReceipFormData) => {
    // Validación de productos
    if (selectedProducts.length === 0) {
      toast.error("Debes agregar al menos un producto a la compra");
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedAccount = selectedShop?.buying_accounts?.find(
        (account) => account.id === data.shopping_account_id,
      );

      if (!selectedAccount || !selectedShop) {
        toast.error("Cuenta de compra o tienda no encontrada");
        return;
      }

      const payload = {
        shopping_account: data.shopping_account_id,
        shop_of_buy: selectedShop.name,
        status_of_shopping: data.status_of_shopping,
        buy_date: data.buy_date,
        card_id: data.card_id,
        total_cost_of_purchase: data.total_cost_of_purchase || 0,
        buyed_products: selectedProducts,
      };

      await shoppingReceipService.createShoppingReceipt(
        payload as Partial<unknown>,
      );

      toast.success("Recibo de compra creado exitosamente");
      form.reset();
      setSelectedProducts([]);
      setSelectedProductsDetails([]);
      onSuccess?.();
    } catch (error) {
      console.error("Error creating shopping receipt:", error);
      toast.error("Error al crear el recibo de compra");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Calcular resumen
  const cartSummary = {
    totalItems: selectedProductsDetails.reduce(
      (sum, item) => sum + item.amount_buyed,
      0,
    ),
    totalCost: selectedProductsDetails.reduce(
      (sum, item) =>
        sum + item.original_product_details.total_cost * item.amount_buyed,
      0,
    ),
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-3 text-sm">
          {/* Seleccionar tienda */}
          <FormField
            control={form.control}
            name="shop_of_buy_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tienda</FormLabel>
                <Select
                  onValueChange={(value) => {
                    field.onChange(Number(value));
                    // Limpiar productos al cambiar de tienda
                    setSelectedProducts([]);
                    setSelectedProductsDetails([]);
                  }}
                  value={field.value?.toString()}
                  disabled={isLoadingShops}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      {isLoadingShops ? (
                        <div className="flex items-center">
                          <span>Cargando tiendas...</span>
                          <Loader2 className="h-4 w-4 animate-spin ml-2" />
                        </div>
                      ) : (
                        <SelectValue
                          className="truncate"
                          placeholder="Selecciona una tienda"
                        />
                      )}
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {shops.map((shop) => (
                      <SelectItem
                        key={shop.id}
                        value={shop.id.toString()}
                        className="capitalize"
                      >
                        {shop.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Seleccionar cuenta de compra */}
          <FormField
            control={form.control}
            name="shopping_account_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Cuenta de Compra</FormLabel>
                <Select
                  onValueChange={(value) => field.onChange(Number(value))}
                  value={field.value?.toString()}
                  disabled={!selectedShopId || buyingAccounts.length === 0}
                >
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        className="truncate"
                        placeholder={
                          !selectedShopId
                            ? "Selecciona una tienda primero"
                            : buyingAccounts.length === 0
                              ? "No hay cuentas disponibles"
                              : "Selecciona una cuenta"
                        }
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {buyingAccounts.map((account) => (
                      <SelectItem
                        key={account.id}
                        value={account.id.toString()}
                      >
                        {account.account_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Estado de compra */}
          <FormField
            control={form.control}
            name="status_of_shopping"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Estado de Pago</FormLabel>
                <Select onValueChange={field.onChange} value={field.value}>
                  <FormControl>
                    <SelectTrigger className="w-full">
                      <SelectValue
                        className="truncate"
                        placeholder="Selecciona un estado"
                      />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {Object.values(SHOPPING_STATUSES).map((status) => (
                      <SelectItem key={status} value={status}>
                        {status}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Tarjeta de Pago */}
          <FormField
            control={form.control}
            name="card_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Tarjeta de Pago</FormLabel>
                <FormControl>
                  <InputGroup className="w-full">
                    <InputGroupInput
                      placeholder="---- ---- ---- ----"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(e.target.value);
                      }}
                      maxLength={19}
                    />
                    <InputGroupAddon>
                      <CreditCard className="inline-start text-muted-foreground" />
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Fecha de compra */}
          <FormField
            control={form.control}
            name="buy_date"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <DatePicker
                    label="Fecha de Compra"
                    placeholder="Selecciona la fecha"
                    selected={field.value ? new Date(field.value) : undefined}
                    onDateChange={(date) =>
                      field.onChange(
                        date ? date.toISOString().split("T")[0] : undefined,
                      )
                    }
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Costo total (calculado automáticamente) */}
          <FormField
            control={form.control}
            name="total_cost_of_purchase"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Costo de la Compra</FormLabel>
                <FormControl>
                  <InputGroup className="w-full mt-1">
                    <InputGroupInput
                      placeholder="0.00"
                      type="number"
                      value={field.value}
                      onChange={(e) => {
                        field.onChange(parseFloat(e.target.value));
                      }}
                      maxLength={19}
                    />
                    <InputGroupAddon>
                      <DollarSign className="inline-start text-muted-foreground" />
                    </InputGroupAddon>
                  </InputGroup>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        {/* Sección de productos */}
        <div className="w-full mt-4 space-y-3">
          <div className="w-full flex flex-row items-center justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-base font-semibold">
                Productos de la Compra
              </h2>
              {selectedProductsDetails.length > 0 && (
                <Badge variant="default">
                  {selectedProductsDetails.length}{" "}
                  {selectedProductsDetails.length === 1
                    ? "producto"
                    : "productos"}
                </Badge>
              )}
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={!selectedShopId || isLoading}
                  className={
                    !selectedShopId ? "pointer-events-none opacity-50" : ""
                  }
                >
                  <ShoppingCart className="h-4 w-4 mr-2" />
                  {isLoading ? "Cargando..." : "Seleccionar Productos"}
                </Button>
              </DialogTrigger>
              <DialogContent className="min-w-[70%] max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    Seleccionar Productos para la Compra
                  </DialogTitle>
                </DialogHeader>
                <ProductSelector
                  shopFilter={selectedShop?.name}
                  statusFilter="Encargado"
                  products={products || []}
                  initialCart={selectedProductsDetails}
                  onCartChange={handleCartChange}
                  showSummary={true}
                  maxHeight="500px"
                />
                <div className="flex justify-end gap-2 pt-4 border-t">
                  <Button
                    type="button"
                    variant="default"
                    onClick={() => setIsDialogOpen(false)}
                  >
                    Cerrar
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de productos seleccionados */}
          <Card>
            <CardContent className="p-4">
              {selectedProductsDetails.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mb-3 opacity-50" />
                  <p className="font-medium">No hay productos seleccionados</p>
                  <p className="text-sm">
                    Haz clic en "Seleccionar Productos" para agregar
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {selectedProductsDetails.map((item) => (
                    <div
                      key={item.product_id}
                      className="flex items-center gap-3 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                    >
                      <div className="h-10 w-10 rounded-md bg-muted flex items-center justify-center shrink-0">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="font-medium truncate">
                          {item.original_product_details.name}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground flex-wrap">
                          <span className="font-mono">
                            {item.original_product_details.sku}
                          </span>
                          {item.original_product_details.category && (
                            <>
                              <span>•</span>
                              <Badge variant="secondary" className="text-xs">
                                {item.original_product_details.category}
                              </Badge>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-3 shrink-0">
                        <div className="text-right">
                          <p className="text-sm font-semibold">
                            $
                            {(
                              item.original_product_details.total_cost *
                              item.amount_buyed
                            ).toFixed(2)}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            $
                            {item.original_product_details.total_cost.toFixed(
                              2,
                            )}{" "}
                            × {item.amount_buyed}
                          </p>
                        </div>

                        <div className="flex items-center gap-1 border rounded-md p-1">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() =>
                              updateProductQuantity(
                                item.product_id as string,
                                -1,
                              )
                            }
                          >
                            -
                          </Button>
                          <span className="w-8 text-center text-sm font-medium">
                            {item.amount_buyed}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            disabled={
                              item.amount_buyed ===
                              item.original_product_details.amount_buyed +
                                item.amount_buyed
                            }
                            onClick={() =>
                              updateProductQuantity(
                                item.product_id as string,
                                1,
                              )
                            }
                          >
                            +
                          </Button>
                        </div>

                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() =>
                            removeProductFromCart(item.product_id as string)
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}

                  {/* Resumen del carrito */}
                  <div className="border-t pt-3 mt-3">
                    <div className="flex justify-between items-center">
                      <div className="text-sm text-muted-foreground">
                        Total: {cartSummary.totalItems} unidades
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">
                          Total estimado
                        </p>
                        <p className="text-lg font-bold">
                          ${cartSummary.totalCost.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Botones */}
        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t">
          {onCancel && (
            <Button type="button" variant="outline" onClick={onCancel}>
              Cancelar
            </Button>
          )}
          <Button
            type="submit"
            disabled={isSubmitting || selectedProducts.length === 0}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Creando...
              </>
            ) : (
              "Crear Recibo de Compra"
            )}
          </Button>
        </div>
      </form>
    </Form>
  );
}
