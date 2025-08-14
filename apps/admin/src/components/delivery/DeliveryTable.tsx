
import DeliveryStatusBadge from './DeliveryStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { CustomUser, DeliverReceip, DeliveryStatus, Order } from '@/types';
import { Camera, Clock, Edit2, Trash2, Weight } from 'lucide-react';
import { formatDate } from '@/lib/format-date';
import AvatarUser from '../utils/AvatarUser';




// Datos de ejemplo
const mockUser: CustomUser = {
  id: 1,
  email: "cliente@demo.com",
  name: "Juan",
  last_name: "Pérez",
  full_name: "Juan Pérez",
  home_address: "Calle Falsa 123",
  phone_number: "5353844409",
  role: "client",
  agent_profit: 0,
  is_staff: false,
  is_active: true,
  is_verified: true,
  date_joined: "2023-01-01T10:00:00Z",
  sent_verification_email: true
};

const mockManager: CustomUser = {
  id: 2,
  email: "manager@demo.com",
  name: "Ana",
  last_name: "García",
  full_name: "Ana García",
  home_address: "Av. Principal 456",
  phone_number: "+51-555-5678",
  role: "admin",
  agent_profit: 0,
  is_staff: true,
  is_active: true,
  is_verified: true,
  date_joined: "2023-01-02T11:00:00Z",
  sent_verification_email: true
};

const mockOrder = (id: number): Order => ({
  id,
  client: mockUser,
  sales_manager: mockManager,
  status: "Encargado",
  pay_status: "Pagado",
  total_cost: 100.0 + id,
  received_products: [],
  received_value_of_client: 50.0,
  extra_payments: 0
});

const mockDelivery: DeliverReceip[] = [
  {
    id: 1,
    order: mockOrder(101),
    weight: 2.5,
    status: "Enviado",
    deliver_date: "2023-10-05T15:00:00Z",
    deliver_picture: [],
    total_cost_of_deliver: 15.99
  },
  {
    id: 2,
    order: mockOrder(102),
    weight: 1.2,
    status: "En tránsito",
    deliver_date: "2023-10-06T16:00:00Z",
    deliver_picture: [],
    total_cost_of_deliver: 10.50
  },
  {
    id: 3,
    order: mockOrder(103),
    weight: 3.0,
    status: "Entregado",
    deliver_date: "2023-10-07T17:00:00Z",
    deliver_picture: [],
    total_cost_of_deliver: 20.00
  }
];

const DeliveryTable: React.FC = () => {
  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100 ">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>Pedido</TableHead>
            <TableHead>Cliente</TableHead>
            <TableHead>Peso</TableHead>
            <TableHead>Costo</TableHead>
            <TableHead>Llegada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Captura</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockDelivery.map((delivery, index) => (
            <TableRow key={delivery.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className='flex flex-row items-center'>
                  <span className='rounded-full bg-gray-200 px-2  py-1 text-xs font-medium'>
                    {"#" + delivery.order.id}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <AvatarUser user={delivery.order.client} />
              </TableCell>
              <TableCell>
                <div className='flex flex-row items-center text-gray-500'>
                  <Weight className="mr-2 inline h-4 w-4" />
                  <span>
                    {delivery.weight + " Lb"}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div>
                  {"$ " + delivery.total_cost_of_deliver.toFixed(2)}
                </div>
              </TableCell>
              <TableCell>
                <div className='flex flex-row items-center text-gray-500'>
                  <Clock className="mr-2 inline h-4 w-4" />
                  {formatDate(delivery.deliver_date)}
                </div>
              </TableCell>
              <TableCell>
                <DeliveryStatusBadge status={delivery.status as DeliveryStatus} />
              </TableCell>
              <TableCell>
                <div className='flex flex-row gap-2'>
                  <Button className=' text-gray-600 cursor-pointer bg-gray-200'>
                    <Camera className='h-5 w-5' />
                  </Button>
                </div>
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

export default DeliveryTable;