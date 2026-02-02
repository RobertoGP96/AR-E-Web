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
  CreditCard,
  Loader2,
  DollarSign,
  Store,
  ShoppingBag,
  Info,
  ChevronRight,
  Plus,
} from "lucide-react";
import { shoppingReceipService } from "@/services/api";
import type {
  CreateProductBuyedData,
  CreateShoppingReceipData,
  ProductBuyed,
  ShoppingReceip,
} from "@/types/models";
import { SHOPPING_STATUSES } from "@/types/models/base";
import { DatePicker } from "@/components/utils/DatePicker";
import { useShops } from "@/hooks/useShops";
import { useProducts } from "@/hooks/product";
import { InputGroupInput } from "@/components/ui/input-group";
import { ProductSelector } from "./purchase-products/purchase-product-selector";
import { PurchaseProductListEditor } from "./purchase-products/PurchaseProductListEditor";

// Schema de validación
const createShoppingReceipSchema = z.object({
  shop_of_buy_id: z.number().min(1, "Debes seleccionar una tienda"),
  shopping_account_id: z
    .number()
    .min(1, "Debes seleccionar una cuenta de compra"),
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

export function PurchaseForm({
  purchase,
  onSuccess,
  onCancel,
}: PurchaseFormProps) {
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

  // Cargar datos iniciales si estamos en modo edición
  useEffect(() => {
    if (purchase && shops.length > 0) {
      // Encontrar la tienda por nombre para obtener su ID
      const shop = shops.find((s) => s.name === purchase.shop_of_buy);
      if (shop) {
        form.setValue("shop_of_buy_id", shop.id);

        // Encontrar la cuenta por nombre dentro de esa tienda
        const account = shop.buying_accounts?.find(
          (a) => a.account_name === purchase.shopping_account,
        );
        if (account) {
          form.setValue("shopping_account_id", account.id);
        }
      }

      // Llenar el resto de campos
      form.setValue(
        "status_of_shopping",
        purchase.status_of_shopping as "No pagado" | "Pagado" | "Parcial",
      );
      form.setValue(
        "buy_date",
        purchase.buy_date
          ? new Date(purchase.buy_date).toISOString().split("T")[0]
          : undefined,
      );
      form.setValue("card_id", purchase.card_id || "");
      form.setValue("total_cost_of_purchase", purchase.total_cost_of_purchase);

      // Cargar productos
      if (purchase.buyed_products) {
        setSelectedProductsDetails(purchase.buyed_products);
        setSelectedProducts(
          purchase.buyed_products.map((p) => ({
            original_product: (p.product_id ||
              p.original_product_details?.id) as string,
            amount_buyed: p.amount_buyed,
          })),
        );
      }
    }
  }, [purchase, shops, form]);

  // Calcular total automáticamente cuando cambian los productos
  useEffect(() => {
    const total = selectedProductsDetails.reduce((sum, item) => {
      return (
        sum +
        (item.original_product_details?.total_cost || 0) * item.amount_buyed
      );
    }, 0);
    // Solo actualizar si no estamos en carga inicial o si el valor cambia
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
      (item) =>
        (item.product_id || item.original_product_details?.id) !== productId,
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
      original_product: (item.product_id ||
        item.original_product_details?.id) as string,
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

      const payload: CreateShoppingReceipData = {
        shopping_account: data.shopping_account_id!,
        shop_of_buy: selectedShop.name,
        status_of_shopping: data.status_of_shopping,
        buy_date: data.buy_date,
        card_id: data.card_id || "",
        total_cost_of_purchase: data.total_cost_of_purchase || 0,
        buyed_products: selectedProductsDetails.map((item) => ({
          original_product: (item.product_id ||
            item.original_product_details?.id) as string,
          amount_buyed: item.amount_buyed,
        })),
      };

      if (purchase?.id) {
        await shoppingReceipService.updateShoppingReceipt(purchase.id, payload);
        toast.success("Recibo de compra actualizado exitosamente");
      } else {
        await shoppingReceipService.createShoppingReceipt(payload);
        toast.success("Recibo de compra creado exitosamente");
      }
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

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="w-full space-y-10 pb-20"
      >
        {/* Header Section */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-orange-50 text-orange-600">
              <ShoppingBag className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {purchase?.id ? "Editar Registro" : "Nuevo Recibo de Compra"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Gestión de Adquisiciones</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-orange-600">
                  {purchase?.id ? `ID: #${purchase.id}` : "Nuevo Ingreso"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Section: Origin */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Store className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                  Origen de la Compra
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-medium">
                <FormField
                  control={form.control}
                  name="shop_of_buy_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Establecimiento
                      </FormLabel>
                      <Select
                        onValueChange={(value) => {
                          field.onChange(Number(value));
                          setSelectedProducts([]);
                          setSelectedProductsDetails([]);
                        }}
                        value={field.value?.toString()}
                        disabled={isLoadingShops}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm">
                            <SelectValue placeholder="Tienda de compra" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          {shops.map((shop) => (
                            <SelectItem
                              key={shop.id}
                              value={shop.id.toString()}
                              className="rounded-lg py-3"
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

                <FormField
                  control={form.control}
                  name="shopping_account_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Cuenta Relacionada
                      </FormLabel>
                      <Select
                        onValueChange={(value) => field.onChange(Number(value))}
                        value={field.value?.toString()}
                        disabled={
                          !selectedShopId || buyingAccounts.length === 0
                        }
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm">
                            <SelectValue placeholder="Cuenta de cargo" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          {buyingAccounts.map((account) => (
                            <SelectItem
                              key={account.id}
                              value={account.id.toString()}
                              className="rounded-lg py-3"
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
              </div>
            </section>

            {/* Section: Items */}
            <section className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Artículos Adquiridos
                  </h3>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(true)}
                  disabled={!selectedShopId}
                  variant="ghost"
                  className="h-8 rounded-full px-4 text-xs font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Agregar Item
                </Button>
              </div>

              <div className="bg-slate-50/30 rounded-3xl p-1 border border-slate-100">
                <PurchaseProductListEditor
                  items={selectedProductsDetails}
                  onUpdateQuantity={updateProductQuantity}
                  onRemove={removeProductFromCart}
                  isLoading={isLoading}
                />
              </div>
            </section>
          </div>

          {/* Sidebar / Secondary Info */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8 sticky top-6">
              <div className="space-y-6 font-medium">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  <Info className="h-4 w-4 text-orange-500" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Resumen Financiero
                  </h4>
                </div>

                <FormField
                  control={form.control}
                  name="status_of_shopping"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Estado de Pago
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-none">
                            <SelectValue placeholder="Seleccionar..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          {Object.values(SHOPPING_STATUSES).map((status) => (
                            <SelectItem
                              key={status}
                              value={status}
                              className="py-2.5"
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
                  name="buy_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Fecha de Operación
                      </FormLabel>
                      <FormControl>
                        <DatePicker
                          placeholder="Fijar fecha"
                          selected={
                            field.value ? new Date(field.value) : undefined
                          }
                          onDateChange={(date) =>
                            field.onChange(
                              date
                                ? date.toISOString().split("T")[0]
                                : undefined,
                            )
                          }
                          className="h-11 w-full rounded-xl border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-none"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="card_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Número de Tarjeta / ID
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <InputGroupInput
                            className="h-11 rounded-xl border-slate-100 bg-slate-50/50 pr-10 focus-visible:bg-white transition-all shadow-none"
                            placeholder="**** **** ****"
                            value={field.value}
                            onChange={(e) => field.onChange(e.target.value)}
                          />
                          <CreditCard className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 group-focus-within:text-orange-400" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="total_cost_of_purchase"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Total Liquidado
                      </FormLabel>
                      <FormControl>
                        <div className="relative group">
                          <InputGroupInput
                            className="h-14 rounded-2xl border-orange-100 bg-orange-50/30 text-xl font-black text-slate-900 pr-10 hover:bg-orange-50 focus-visible:bg-white focus-visible:border-orange-200 transition-all shadow-none"
                            type="number"
                            value={field.value}
                            onChange={(e) =>
                              field.onChange(parseFloat(e.target.value))
                            }
                          />
                          <DollarSign className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-orange-500" />
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedProducts.length === 0}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-base shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : purchase?.id ? (
                    "Guardar Cambios"
                  ) : (
                    "Completar Compra"
                  )}
                </Button>
                {onCancel && (
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={onCancel}
                    className="w-full h-12 rounded-xl text-slate-400 font-semibold hover:text-slate-600"
                  >
                    Descartar
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl max-h-[95vh] sm:max-h-[90vh] rounded-[24px] sm:rounded-[40px] border-none shadow-2xl p-0 overflow-y-auto">
            <div className="flex flex-col h-full bg-slate-50">
              <div className="p-5 sm:p-8 pb-4">
                <DialogTitle className="text-2xl font-black text-slate-900">
                  Catálogo de Productos
                </DialogTitle>
                <p className="text-slate-500 text-sm mt-1">
                  Selecciona los productos solicitados por los clientes.
                </p>
              </div>
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <ProductSelector
                  shopFilter={selectedShop?.name}
                  statusFilter="Encargado"
                  products={products || []}
                  initialCart={selectedProductsDetails}
                  onCartChange={handleCartChange}
                  showSummary={true}
                  maxHeight="500px"
                />
              </div>
              <div className="p-5 sm:p-8 pt-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl h-12 px-8 border-slate-200"
                  onClick={() => setIsDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsDialogOpen(false)}
                  className="rounded-2xl h-12 px-8 bg-orange-500 hover:bg-orange-600 shadow-lg shadow-orange-100"
                >
                  Guardar Selección
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </form>
    </Form>
  );
}
