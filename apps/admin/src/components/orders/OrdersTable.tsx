
import OrderStatusBadge from './OrderStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { formatCurrency, type CustomUser, type DeliverReceip, type Order, type OrderStatus, type PayStatus } from '@/types';
import { Edit2, ShoppingCart, Trash2 } from 'lucide-react';
import AvatarUser from '../utils/AvatarUser';
import PayStatusBadge from '../utils/PayStatusBadge';

const mockManager: CustomUser = {
  id: 2,
  email: "albert@gmail.com",
  name: "Alberto",
  last_name: "Do Rego",
  full_name: "Alberto Do Rego",
  home_address: "Calle Progreso #105",
  phone_number: "+53-5545-5678",
  role: "admin",
  agent_profit: 0,
  is_staff: true,
  is_active: true,
  is_verified: true,
  date_joined: "2023-01-02T11:00:00Z",
  sent_verification_email: true
};

const mockClient: CustomUser = {
  id: 3,
  email: "client@demo.com",
  name: "Carlos",
  last_name: "Pérez",
  full_name: "Carlos Pérez",
  home_address: "Av. Principal 456",
  phone_number: "+51-555-5678",
  role: "client",
  agent_profit: 0,
  is_staff: true,
  is_active: true,
  is_verified: true,
  date_joined: "2023-01-02T11:00:00Z",
  sent_verification_email: true
};


// Datos de ejemplo
const mockOrder: Order[] = [
  {
    id: 1,
    sales_manager: mockManager,
    client: mockClient,
    status: 'Ordered',
    pay_status: 'Paid',
    extra_payments: 0,
    received_products: [] as DeliverReceip[],
    received_value_of_client: 0,
    total_cost: 150.75,
  },
  {
    id: 2,
    sales_manager: mockManager,
    client: mockClient,
    status: 'Processing',
    pay_status: 'Unpaid',
    extra_payments: 0,
    received_products: [] as DeliverReceip[],
    received_value_of_client: 0,
    total_cost: 200.00,
  },
  {
    id: 3,
    sales_manager: mockManager,
    client: mockClient,
    status: 'Cancelled',
    pay_status: 'Paid',
    extra_payments: 0,
    received_products: [] as DeliverReceip[],
    received_value_of_client: 0,
    total_cost: 100.00,
  }
]

interface OrderTableProps {
  onViewDetails?: (order: Order) => void;
}

const OrderTable: React.FC<OrderTableProps> = () => {
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
          {mockOrder.map((order, index) => (
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
                    {order.received_products?.length || 0}
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
                <Button variant="secondary" className="mr-2">
                  <Edit2 className="h-5 w-5" />
                </Button>
                <Button variant="secondary">
                  <Trash2 className="h-5 w-5" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export default OrderTable;