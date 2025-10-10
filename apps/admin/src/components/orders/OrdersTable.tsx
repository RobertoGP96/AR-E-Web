import OrderStatusBadge from './OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, type Order, type OrderStatus, type PayStatus } from '@/types';
import { Edit2, ShoppingCart, Trash2 } from 'lucide-react';
import AvatarUser from '../utils/AvatarUser';
import PayStatusBadge from '../utils/PayStatusBadge';

interface OrderTableProps {
  orders: Order[];
  isLoading?: boolean;
  onEdit?: (order: Order) => void;
  onDelete?: (order: Order) => void;
  onViewDetails?: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = ({ 
  orders, 
  isLoading = false,
  onEdit,
  onDelete,
}) => {
  if (isLoading) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
        </div>
      </div>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <div className="flex flex-col items-center justify-center h-64 text-center p-4">
          <ShoppingCart className="h-16 w-16 text-gray-300 mb-4" />
          <h3 className="text-lg font-semibold text-gray-700 mb-2">No hay pedidos</h3>
          <p className="text-sm text-gray-500">
            Comienza creando un nuevo pedido usando el botón "Agregar Pedido"
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100 ">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>ID</TableHead>
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
          {orders.map((order, index) => (
            <TableRow key={order.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className='flex flex-row items-center'>
                  <span className='rounded-full bg-gray-200 px-2  py-1 text-xs font-medium'>
                    {"#" + order.id}
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
                <div className='flex flex-row items-center gap-0.5 text-gray-600'>
                  <ShoppingCart className='h-4 w-4'/>
                  <span>
                    {order.products?.length || 0}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <OrderStatusBadge status={order.status as OrderStatus} />
              </TableCell>
              <TableCell>
                {formatCurrency(order.total_cost)}
              </TableCell>
              <TableCell>
                <PayStatusBadge status={order.pay_status as PayStatus} />
              </TableCell>

              <TableCell>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => onEdit?.(order)}
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => onDelete?.(order)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default OrderTable;