import { useState, useEffect, useMemo } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Truck,
  Loader2,
  User,
  Info,
  ChevronRight,
  Plus,
  Weight,
  Tag,
} from "lucide-react";
import { DatePicker } from "@/components/utils/DatePicker";
import { InputGroupInput } from "@/components/ui/input-group";

// Hooks
// Hooks
import { useCreateDelivery } from "@/hooks/delivery/useCreateDelivery";
import { useUpdateDelivery } from "@/hooks/delivery/useUpdateDelivery";
import { useAddProductToDelivery } from "@/hooks/delivery/useAddProductToDelivery";
import { useRemoveProductFromDelivery } from "@/hooks/delivery/useRemoveProductFromDelivery";
import { useUsers } from "@/hooks/user";
import { useCategories } from "@/hooks/category/useCategory";
import { useProducts } from "@/hooks/product/useProducts";
import type { ProductFilters } from "@/types/api";

// Logic components
import {
  DeliveryProductListEditor,
  type DeliveryProductItem,
} from "./delivery-products/DeliveryProductListEditor";
import { DeliveryProductSelector } from "./delivery-products/DeliveryProductSelector";

import type {
  CreateDeliverReceipData,
  DeliverReceip,
  UpdateDeliverReceipData,
} from "@/types/models/delivery";

// Schema de validación
const createDeliverySchema = z.object({
  client_id: z.string().min(1, "Debes seleccionar un cliente"),
  category_id: z.string().optional(),
  status: z.enum(["Pendiente", "En transito", "Entregado", "Fallida"]),
  deliver_date: z.string().optional(),
  weight: z.number().min(0.01, "El peso debe ser mayor a 0"),
  weight_cost: z.number().optional(),
  manager_profit: z.number().optional(),
  deliver_picture: z.string().optional(),
});

type CreateDeliveryFormData = z.infer<typeof createDeliverySchema>;

interface DeliveryFormProps {
  delivery?: DeliverReceip; // Optional for edit
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function DeliveryForm({
  delivery,
  onSuccess,
  onCancel,
}: DeliveryFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [selectedProductsItem, setSelectedProductsItem] = useState<
    DeliveryProductItem[]
  >([]);

  // Mutations
  const createDeliveryMutation = useCreateDelivery();
  const updateDeliveryMutation = useUpdateDelivery();
  const addProductMutation = useAddProductToDelivery();
  const removeProductMutation = useRemoveProductFromDelivery();

  // Queries
  const { data: usersData, isLoading: isLoadingUsers } = useUsers({
    role: "client",
  });
  const { data: agentsData } = useUsers({ role: "agent" });
  const { data: categoriesData, isLoading: isLoadingCategories } =
    useCategories();

  const clients = useMemo(() => usersData?.results || [], [usersData]);
  const agents = useMemo(() => agentsData?.results || [], [agentsData]);
  const categories = useMemo(
    () => categoriesData?.results || [],
    [categoriesData],
  );

  const form = useForm<CreateDeliveryFormData>({
    resolver: zodResolver(createDeliverySchema),
    defaultValues: {
      client_id: delivery?.client?.id ? delivery.client.id.toString() : "",
      category_id: delivery?.category?.id
        ? delivery.category.id.toString()
        : undefined,
      status: delivery?.status || "Pendiente",
      deliver_date: delivery?.deliver_date
        ? new Date(delivery.deliver_date).toISOString().split("T")[0]
        : new Date().toISOString().split("T")[0],
      weight: delivery?.weight || 0,
      weight_cost: delivery?.weight_cost || 0,
      manager_profit: delivery?.manager_profit || 0,
    },
  });

  // Watchers
  const selectedClientId = form.watch("client_id");
  const selectedCategoryId = form.watch("category_id");
  const weight = form.watch("weight");

  // Load initial products if editing
  useEffect(() => {
    if (delivery?.delivered_products) {
      const items: DeliveryProductItem[] = delivery.delivered_products.map(
        (dp) => ({
          product: dp.original_product,
          amount: dp.amount_delivered,
        }),
      );
      setSelectedProductsItem(items);
    }
  }, [delivery]);

  // Fetch products for selected client
  const productFilters: ProductFilters = useMemo(
    () => ({
      // Filter logic can be added here if backend supports it
    }),
    [],
  );

  const { products: allProducts } = useProducts(productFilters || {});

  // Filter products by client locally
  const clientProducts = useMemo(() => {
    if (!selectedClientId) return [];
    return allProducts;
  }, [allProducts, selectedClientId]);

  // Calculations
  const selectedClient = clients.find(
    (c) => c.id.toString() === selectedClientId,
  );
  const assignedAgent = agents.find(
    (a) => a.id === selectedClient?.assigned_agent,
  );
  const selectedCategory = categories.find(
    (c) => c.id.toString() === selectedCategoryId,
  );

  // Auto-calculate weight cost (Only if not manually edited or if in create mode? For now auto-calc always on change)
  useEffect(() => {
    // Avoid overwriting if editing and value logic needs validation,
    // but typically cost should recalculate if weight/category changes.
    // To prevent overwriting initial load, we might check dirtiness, but for this simpler logic:
    // If weight/category matches form values which match delivery values, we might just be setting same value.
    if (selectedCategory && weight > 0) {
      const cost = selectedCategory.client_shipping_charge * weight;
      // Use setValue only if different to avoid potential loops or behavior issues, though useEffect protects us largely vs deps
      if (Math.abs(form.getValues("weight_cost") || 0 - cost) > 0.01) {
        form.setValue("weight_cost", parseFloat(cost.toFixed(2)));
      }
    }
  }, [selectedCategoryId, weight, selectedCategory, form]);

  // Auto-calculate manager profit
  useEffect(() => {
    if (assignedAgent && weight > 0 && assignedAgent.agent_profit) {
      const profit = weight * assignedAgent.agent_profit;
      if (Math.abs(form.getValues("manager_profit") || 0 - profit) > 0.01) {
        form.setValue("manager_profit", parseFloat(profit.toFixed(2)));
      }
    }
  }, [assignedAgent, weight, form]);

  // Handlers for Products
  const handleCartChange = (newItems: DeliveryProductItem[]) => {
    setSelectedProductsItem(newItems);
  };

  const removeProductFromCart = (productId: string) => {
    setSelectedProductsItem((prev) =>
      prev.filter((item) => item.product.id !== productId),
    );
  };

  const updateProductQuantity = (productId: string, delta: number) => {
    setSelectedProductsItem((prev) =>
      prev
        .map((item) => {
          if (item.product.id === productId) {
            return { ...item, amount: item.amount + delta };
          }
          return item;
        })
        .filter((item) => item.amount > 0),
    );
  };

  const onSubmit = async (data: CreateDeliveryFormData) => {
    if (selectedProductsItem.length === 0) {
      toast.error("Debes agregar al menos un producto a la entrega");
      return;
    }

    setIsSubmitting(true);
    try {
      if (delivery) {
        // --- UPDATE FLOW ---
        const updatePayload: UpdateDeliverReceipData = {
          id: delivery.id as number,
          client_id: parseInt(data.client_id),
          category_id: data.category_id
            ? parseInt(data.category_id)
            : undefined,
          weight: data.weight,
          status: data.status,
          deliver_date: data.deliver_date ? data.deliver_date : undefined,
          weight_cost: data.weight_cost,
          manager_profit: data.manager_profit,
        };

        await updateDeliveryMutation.mutateAsync({
          id: delivery.id as number,
          data: updatePayload,
        });

        // Sync Products
        const initialProducts = delivery.delivered_products || [];

        // 1. Identify items to add (in form but NOT in DB)
        const itemsToAdd = selectedProductsItem.filter(
          (formItem) =>
            !initialProducts.some(
              (dbItem) => dbItem.original_product.id === formItem.product.id,
            ),
        );

        // 2. Identify items to remove (in DB but NOT in form)
        const itemsToRemove = initialProducts.filter(
          (dbItem) =>
            !selectedProductsItem.some(
              (formItem) => formItem.product.id === dbItem.original_product.id,
            ),
        );

        // 3. Update behavior (Remove old relation and Add new relation for changed quantities)
        const itemsToUpdate = selectedProductsItem.filter((formItem) => {
          const dbItem = initialProducts.find(
            (i) => i.original_product.id === formItem.product.id,
          );
          return dbItem && dbItem.amount_delivered !== formItem.amount;
        });

        // Add 'itemsToUpdate' (db version) to removals
        const extraRemovals = initialProducts.filter((dbItem) =>
          itemsToUpdate.some(
            (u) => u.product.id === dbItem.original_product.id,
          ),
        );

        const finalItemsToRemove = [...itemsToRemove, ...extraRemovals];

        // Add 'itemsToUpdate' (form version) to additions
        const finalItemsToAdd = [...itemsToAdd, ...itemsToUpdate];

        // Execute Removals (Using productDeliveryId)
        for (const dbItem of finalItemsToRemove) {
          await removeProductMutation.mutateAsync({
            deliveryId: delivery.id,
            productDeliveryId: dbItem.id, // Correct ID for removal
          });
        }

        // Execute Additions
        for (const item of finalItemsToAdd) {
          await addProductMutation.mutateAsync({
            deliveryId: delivery.id,
            productId: item.product.id,
            amount: item.amount,
          });
        }

        toast.success("Entrega actualizada exitosamente");
      } else {
        // --- CREATE FLOW ---
        const deliveryPayload: CreateDeliverReceipData = {
          client_id: parseInt(data.client_id),
          category_id: data.category_id
            ? parseInt(data.category_id)
            : undefined,
          weight: data.weight,
          status: data.status,
          deliver_date: data.deliver_date ? data.deliver_date : undefined,
          weight_cost: data.weight_cost,
          manager_profit: data.manager_profit,
        };

        const newDelivery =
          await createDeliveryMutation.mutateAsync(deliveryPayload);

        if (!newDelivery?.id) {
          throw new Error("No se pudo obtener el ID del delivery creado");
        }

        // 2. Add Products to Delivery
        for (const item of selectedProductsItem) {
          await addProductMutation.mutateAsync({
            deliveryId: newDelivery.id,
            productId: item.product.id,
            amount: item.amount,
          });
        }
        toast.success("Entrega creada exitosamente con productos añadidos");
      }

      onSuccess?.();
    } catch (error) {
      console.error("Error submitting delivery:", error);
      toast.error("Error al guardar la entrega");
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
              <Truck className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-2xl font-extrabold tracking-tight text-slate-900 sm:text-3xl">
                {delivery ? "Editar Entrega" : "Nueva Entrega"}
              </h1>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <span>Gestión de Envíos</span>
                <ChevronRight className="h-3 w-3" />
                <span className="font-medium text-orange-600">
                  {delivery
                    ? `Editando #${delivery.id}`
                    : "Registro de Entrega"}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* Main Content */}
          <div className="lg:col-span-8 space-y-10">
            {/* Section: Client & Config */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <User className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-orange-400">
                  Información del Cliente
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 font-medium">
                <FormField
                  control={form.control}
                  name="client_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">Cliente</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          // Clear products when client changes as products depend on client
                          setSelectedProductsItem([]);
                        }}
                        value={field.value}
                        disabled={isLoadingUsers}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm">
                            <SelectValue placeholder="Seleccionar Cliente" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl h-[300px]">
                          {clients.map((user) => (
                            <SelectItem
                              key={user.id}
                              value={user.id.toString()}
                              className="rounded-lg py-3"
                            >
                              {user.full_name ||
                                `${user.name} ${user.last_name}`}
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
                  name="category_id"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Categoría de Envío
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                        disabled={isLoadingCategories}
                      >
                        <FormControl>
                          <SelectTrigger className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm">
                            <SelectValue placeholder="Categoría (Opcional)" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-2xl border-slate-100 shadow-2xl">
                          {categories.map((cat) => (
                            <SelectItem
                              key={cat.id}
                              value={cat.id.toString()}
                              className="rounded-lg py-3"
                            >
                              <div className="flex items-center justify-between w-full gap-2">
                                <span>{cat.name}</span>
                                <span className="text-xs text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                  ${cat.client_shipping_charge}/lb
                                </span>
                              </div>
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

            {/* Section: Weight & Cost */}
            <section className="space-y-6">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Weight className="h-4 w-4 text-slate-400" />
                <h3 className="text-sm font-bold uppercase tracking-widest text-orange-400">
                  Peso y Costos
                </h3>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 font-medium">
                <FormField
                  control={form.control}
                  name="weight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Peso Total (Lb)
                      </FormLabel>
                      <FormControl>
                        <InputGroupInput
                          className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="weight_cost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Costo Envío ($)
                      </FormLabel>
                      <FormControl>
                        <InputGroupInput
                          className="h-12 rounded-2xl border-slate-200 bg-slate-50 text-slate-500"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          readOnly
                          value={field.value}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="manager_profit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-slate-600">
                        Ganancia Manager ($)
                      </FormLabel>
                      <FormControl>
                        <InputGroupInput
                          className="h-12 rounded-2xl border-slate-200 bg-white/50 hover:bg-white transition-all shadow-sm"
                          type="number"
                          step="0.01"
                          placeholder="0.00"
                          onChange={(e) =>
                            field.onChange(parseFloat(e.target.value))
                          }
                          value={field.value}
                        />
                      </FormControl>
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
                  <Tag className="h-4 w-4 text-slate-400" />
                  <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">
                    Artículos a Entregar
                  </h3>
                </div>
                <Button
                  type="button"
                  onClick={() => setIsProductDialogOpen(true)}
                  disabled={!selectedClientId}
                  variant="ghost"
                  className="h-8 rounded-full px-4 text-xs font-bold text-orange-600 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                >
                  <Plus className="mr-1.5 h-3.5 w-3.5" />
                  Seleccionar Productos
                </Button>
              </div>

              {!selectedClientId && (
                <div className="p-4 bg-yellow-50 text-yellow-800 rounded-xl text-sm font-medium border border-yellow-200">
                  Selecciona un cliente primero para ver sus productos
                  disponibles.
                </div>
              )}

              <div className="bg-slate-50/30 rounded-3xl p-1 border border-slate-100">
                <DeliveryProductListEditor
                  items={selectedProductsItem}
                  onUpdateQuantity={updateProductQuantity}
                  onRemove={removeProductFromCart}
                  isAddDisabled={!selectedClientId}
                  onAddClick={() => setIsProductDialogOpen(true)}
                />
              </div>
            </section>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-4 space-y-8">
            <div className="bg-white rounded-[32px] border border-slate-100 p-8 shadow-sm space-y-8 sticky top-6">
              <div className="space-y-6 font-medium">
                <div className="flex items-center gap-2 pb-4 border-b border-slate-50">
                  <Info className="h-4 w-4 text-orange-500" />
                  <h4 className="text-xs font-bold uppercase tracking-widest text-slate-400">
                    Detalles de Operación
                  </h4>
                </div>

                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Estado Actual
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11 rounded-xl border-slate-100 bg-slate-50/50 hover:bg-slate-50 transition-all shadow-none">
                            <SelectValue placeholder="Estado" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                          <SelectItem value="Pendiente">Pendiente</SelectItem>
                          <SelectItem value="En transito">
                            En Tránsito
                          </SelectItem>
                          <SelectItem value="Entregado">Entregado</SelectItem>
                          <SelectItem value="Fallida">Fallida</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="deliver_date"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-xs text-slate-500">
                        Fecha de Entrega
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
              </div>

              <div className="space-y-3 pt-4">
                <Button
                  type="submit"
                  disabled={isSubmitting || selectedProductsItem.length === 0}
                  className="w-full h-14 rounded-2xl bg-slate-900 hover:bg-black text-white font-bold text-base shadow-xl shadow-slate-200 hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="h-5 w-5 animate-spin mr-2" />
                  ) : delivery ? (
                    "Guardar Cambios"
                  ) : (
                    "Crear Entrega"
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

        <Dialog
          open={isProductDialogOpen}
          onOpenChange={setIsProductDialogOpen}
        >
          <DialogContent className="w-[95vw] sm:max-w-[90vw] lg:max-w-6xl h-[90vh] max-h-[95vh] rounded-[24px] sm:rounded-[40px] border-none shadow-2xl p-0 overflow-hidden flex flex-col">
            <DialogHeader className="p-5 sm:p-8 pb-4 shrink-0">
              <div>
                <DialogTitle className="text-2xl font-black text-orange-600">
                  Selección de Productos
                </DialogTitle>
                <p className="text-slate-500 text-sm mt-1">
                  Agrega los productos que serán entregados en este envío.
                </p>
              </div>
            </DialogHeader>

            <div className="flex flex-col flex-1 min-h-0 bg-slate-50">
              <div className="flex-1 overflow-y-auto px-4 pb-4">
                <DeliveryProductSelector
                  products={clientProducts}
                  clientName={
                    selectedClient?.name
                      ? `${selectedClient.name} ${selectedClient.last_name || ""}`
                      : undefined
                  }
                  initialCart={selectedProductsItem}
                  onCartChange={handleCartChange}
                  showSummary={true}
                  maxHeight="auto"
                />
              </div>
              <div className="p-5 sm:p-8 pt-4 bg-white border-t border-slate-100 flex flex-col sm:flex-row justify-end gap-3 shrink-0">
                <Button
                  type="button"
                  variant="outline"
                  className="rounded-2xl h-12 px-8 border-slate-200"
                  onClick={() => setIsProductDialogOpen(false)}
                >
                  Cancelar
                </Button>
                <Button
                  type="button"
                  onClick={() => setIsProductDialogOpen(false)}
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
