import OrderStatusBadge from "./OrderStatusBadge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import {
  formatCurrency,
  type Order,
  type OrderStatus,
  type PayStatus,
} from "@/types";
import {
  Edit2,
  ShoppingCart,
  Trash2,
  MoreHorizontal,
  CheckCircle,
  Plus,
  Loader2,
  ExternalLink,
  CalendarIcon,
} from "lucide-react";
import { Link } from "react-router-dom";
import AvatarUser from "../utils/AvatarUser";
import PayStatusBadge from "../utils/PayStatusBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useState, useMemo, useEffect } from "react";
import { useDeleteOrder } from "@/hooks/order/useDeleteOrder";
import { useMarkOrderAsPaid } from "@/hooks/order/useMarkOrderAsPaid";
import { toast } from "sonner";
import { formatDayMonth } from "@/lib/format-date";
import { ConfirmPaymentDialog } from "./ConfirmPaymentDialog";
import { TablePagination } from "../utils/TablePagination";
import {
  ProductListPopover,
  useProductListAdapter,
} from "../utils/ProductListPopover";

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onConfirmPayment?: (
    orderId: number,
    amountReceived: number,
    paymentDate: Date | undefined,
  ) => void;
  onAddProducts?: (order: Order) => void;
  itemsPerPage?: number;
}

const OrderTable: React.FC<OrderTableProps> = ({
  orders,
  isLoading = false,
  onEdit,
  onDelete,
  onConfirmPayment,
  onAddProducts,
  itemsPerPage: initialItemsPerPage = 10,
}) => {
  const { adaptOrderProducts } = useProductListAdapter();
  const [dialogState, setDialogState] = useState<{
    type: "delete" | null;
    order: Order | null;
  }>({ type: null, order: null });
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedOrderForPayment, setSelectedOrderForPayment] =
    useState<Order | null>(null);

  const deleteOrderMutation = useDeleteOrder();
  const markOrderAsPaidMutation = useMarkOrderAsPaid();
  const [isDeleting, setIsDeleting] = useState(false);

  // Estado de paginación
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

  // Calcular órdenes paginadas
  const paginatedOrders = useMemo(() => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return orders.slice(startIndex, endIndex);
  }, [orders, currentPage, itemsPerPage]);

  // Calcular total de páginas
  const totalPages = Math.ceil(orders.length / itemsPerPage);

  // Resetear a la primera página cuando cambian las órdenes o el tamaño de página
  useEffect(() => {
    setCurrentPage(1);
  }, [orders.length, itemsPerPage]);

  const handleDeleteConfirm = async () => {
    if (!dialogState.order) return;

    setIsDeleting(true);
    try {
      if (onDelete) {
        await onDelete(dialogState.order);
      } else {
        await deleteOrderMutation.mutateAsync(dialogState.order.id);
        toast.success(`Pedido #${dialogState.order.id} eliminado`);
      }
    } catch (err) {
      console.error("Error al eliminar pedido:", err);
      toast.error("Error al eliminar el pedido");
    } finally {
      setIsDeleting(false);
      setDialogState({ type: null, order: null });
    }
  };

  const handlePaymentConfirm = async (
    orderId: number,
    amountReceived: number,
    paymentDate: Date | undefined,
  ) => {
    if (!orderId || orderId === undefined) {
      console.error(
        "[OrdersTable] ERROR: orderId es undefined o inválido",
        orderId,
      );
      toast.error("Error: ID de pedido inválido");
      return;
    }

    try {
      if (onConfirmPayment && selectedOrderForPayment) {
        // Si se proporciona un callback personalizado, pásale el id, la cantidad recibida y la fecha de pago
        await onConfirmPayment(orderId, amountReceived, paymentDate);
      } else {
        // Usar el hook de mutación
        await markOrderAsPaidMutation.mutateAsync({ orderId, amountReceived });
        toast.success(`Pago confirmado para el pedido #${orderId}`, {
          description: `Se registró ${formatCurrency(amountReceived)} como cantidad recibida.`,
        });
      }
      setPaymentDialogOpen(false);
      setSelectedOrderForPayment(null);
    } catch (err) {
      console.error("[OrdersTable] Error al confirmar pago:", err);
      toast.error("Error al confirmar el pago");
      throw err; // Re-lanzar para que el diálogo maneje el error
    }
  };

  const handleDeleteCancel = () => setDialogState({ type: null, order: null });
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-400"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            No hay órdenes
          </h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo pedido usando el botón "Agregar Pedido"
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-lg border border-muted bg-background shadow flex flex-col h-[calc(92vh-16rem)]">
        <div className="overflow-auto flex-1">
          <Table>
            <TableHeader className="bg-gray-100 ">
              <TableRow>
                <TableHead>#</TableHead>
                <TableHead>Fecha</TableHead>
                <TableHead>Manager</TableHead>
                <TableHead>Cliente</TableHead>
                <TableHead>Productos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Costo</TableHead>
                <TableHead>Pago</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedOrders.map((order, index) => (
                <TableRow key={order.id}>
                  <TableCell>
                    {(currentPage - 1) * itemsPerPage + index + 1}
                  </TableCell>

                  <TableCell>
                    <div className="flex flex-row items-center gap-1">
                      <CalendarIcon className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        {order.created_at
                          ? formatDayMonth(order.created_at)
                          : "N/A"}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {order.sales_manager ? (
                      <AvatarUser user={order.sales_manager} />
                    ) : (
                      <span className="text-gray-400">Sin asignar</span>
                    )}
                  </TableCell>
                  <TableCell>
                    {order.client ? (
                      <AvatarUser user={order.client} />
                    ) : (
                      <span className="text-gray-400">Sin cliente</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <ProductListPopover
                      products={adaptOrderProducts(order.products || [])}
                      title="Productos del Pedido"
                      showPrice
                    />
                  </TableCell>
                  <TableCell>
                    <OrderStatusBadge status={order.status as OrderStatus} />
                  </TableCell>
                  <TableCell>{formatCurrency(order.total_cost)}</TableCell>
                  <TableCell>
                    <PayStatusBadge status={order.pay_status as PayStatus} />
                  </TableCell>

                  <TableCell>
                    <div className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent
                          align="end"
                          className="w-48 rounded-xl shadow-xl border-gray-200"
                        >
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();

                              // Evitar confirmar si ya está pagado
                              if (order.pay_status === "Pagado") {
                                toast.info(
                                  `El pedido #${order.id} ya está marcado como Pagado`,
                                );
                                return;
                              }

                              // Abrir el diálogo de confirmación de pago
                              setSelectedOrderForPayment(order);
                              setPaymentDialogOpen(true);
                            }}
                            className={`flex items-center gap-2 rounded-lg ${order.pay_status === "Pagado" ? "opacity-50 cursor-not-allowed" : "hover:bg-green-50 hover:text-green-600"}`}
                          >
                            <CheckCircle className="h-4 w-4" />
                            Confirmar pago
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onEdit?.(order);
                            }}
                            className="flex items-center gap-2 hover:bg-blue-50 hover:text-blue-600 rounded-lg"
                          >
                            <Edit2 className="h-4 w-4" />
                            Editar
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              onAddProducts?.(order);
                            }}
                            className="flex items-center gap-2 hover:bg-purple-50 hover:text-purple-600 rounded-lg"
                          >
                            <Plus className="h-4 w-4" />
                            Añadir producto
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                          >
                            <Link
                              to={`/orders/${order.id}/add-products`}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                              }}
                              className="inline-flex items-center gap-2"
                              title={`Agregar múltiples productos al pedido ${order.id}`}
                            >
                              <ShoppingCart className="h-4 w-4" />
                              Agregar múltiples productos
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                            }}
                            className="flex items-center gap-2 hover:bg-indigo-50 hover:text-indigo-600 rounded-lg"
                          >
                            <Link
                              to={`/orders/${order.id}`}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                              }}
                              className="inline-flex items-center gap-2"
                              title={`Ver detalles del pedido ${order.id}`}
                            >
                              <ExternalLink className="h-4 w-4" />
                              Ver detalles
                            </Link>
                          </DropdownMenuItem>

                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();

                              if (!order || !order.id) {
                                console.error(
                                  "Error: Pedido sin ID válido",
                                  order,
                                );
                                return;
                              }

                              setDialogState({ type: "delete", order });
                            }}
                            className="flex items-center gap-2 hover:bg-red-50 hover:text-red-600 rounded-lg"
                          >
                            <Trash2 className="h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Componente de paginación */}
      <TablePagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={setCurrentPage}
        itemsPerPage={itemsPerPage}
        onItemsPerPageChange={setItemsPerPage}
        totalItems={orders.length}
      />

      {/* Diálogo de confirmación para eliminar pedido */}
      <AlertDialog
        open={dialogState.type === "delete" || isDeleting}
        onOpenChange={(open) => {
          // Prevent closing while deleting
          if (!open && isDeleting) return;
          if (!open) handleDeleteCancel();
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar pedido?</AlertDialogTitle>
            <AlertDialogDescription>
              ¿Estás seguro de que deseas eliminar el pedido{" "}
              {dialogState.order ? `#${dialogState.order.id}` : ""}? Esta acción
              no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleDeleteCancel}
              disabled={isDeleting}
            >
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
              disabled={isDeleting}
            >
              {isDeleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Eliminando...
                </>
              ) : (
                "Eliminar"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Diálogo de confirmación de pago */}
      <ConfirmPaymentDialog
        order={selectedOrderForPayment}
        open={paymentDialogOpen}
        onClose={() => {
          setPaymentDialogOpen(false);
          setSelectedOrderForPayment(null);
        }}
        onConfirm={handlePaymentConfirm}
      />
    </>
  );
};

export default OrderTable;
