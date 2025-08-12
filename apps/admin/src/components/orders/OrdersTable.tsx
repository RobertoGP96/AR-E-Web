import { Eye } from 'lucide-react';
import type { OrderTableData } from '@/types/models/orderTable';
import { orderStatusConfig, payStatusConfig } from '@/types/models/orderTable';
import type { CustomUser } from '@/types/models/user';

interface OrdersTableProps {
  orders?: OrderTableData[];
  onViewDetails?: (order: OrderTableData) => void;
}

// Datos de ejemplo que coinciden con la estructura actual
const mockOrders: OrderTableData[] = [
  {
    id: 1,
    client: { 
      id: 1, 
      name: "Juan", 
      last_name: "Pérez",
      email: "juan@example.com",
      home_address: "",
      phone_number: "",
      role: "user",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "Juan Pérez"
    } as CustomUser,
    sales_manager: { 
      id: 1, 
      name: "Ana", 
      last_name: "García",
      email: "ana@example.com",
      home_address: "",
      phone_number: "",
      role: "agent",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "Ana García"
    } as CustomUser,
    status: "Completado",
    pay_status: "Pagado",
    total_cost: 150000,
    received_products: [],
    received_value_of_client: 150000,
    extra_payments: 0,
    customerName: "Juan Pérez",
    customerEmail: "juan@example.com",
    orderDate: "2024-01-15",
    itemsCount: 3
  },
  {
    id: 2,
    client: { 
      id: 2, 
      name: "María", 
      last_name: "López",
      email: "maria@example.com",
      home_address: "",
      phone_number: "",
      role: "user",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "María López"
    } as CustomUser,
    sales_manager: { 
      id: 1, 
      name: "Ana", 
      last_name: "García",
      email: "ana@example.com",
      home_address: "",
      phone_number: "",
      role: "agent",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "Ana García"
    } as CustomUser,
    status: "Procesando",
    pay_status: "Parcial",
    total_cost: 89500,
    received_products: [],
    received_value_of_client: 45000,
    extra_payments: 0,
    customerName: "María López",
    customerEmail: "maria@example.com",
    orderDate: "2024-01-14",
    itemsCount: 2
  },
  {
    id: 3,
    client: { 
      id: 3, 
      name: "Carlos", 
      last_name: "Ruiz",
      email: "carlos@example.com",
      home_address: "",
      phone_number: "",
      role: "user",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "Carlos Ruiz"
    } as CustomUser,
    sales_manager: { 
      id: 2, 
      name: "Pedro", 
      last_name: "Morales",
      email: "pedro@example.com",
      home_address: "",
      phone_number: "",
      role: "agent",
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: "",
      sent_verification_email: false,
      full_name: "Pedro Morales"
    } as CustomUser,
    status: "Encargado",
    pay_status: "No pagado",
    total_cost: 275000,
    received_products: [],
    received_value_of_client: 0,
    extra_payments: 0,
    customerName: "Carlos Ruiz",
    customerEmail: "carlos@example.com",
    orderDate: "2024-01-13",
    itemsCount: 5
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('es-ES');
};

export default function OrdersTable({
  orders = mockOrders,
  onViewDetails
}: OrdersTableProps) {
  return (
    <div className="mt-8 flex flex-col">
      <div className="-my-2 -mx-4 overflow-x-auto sm:-mx-6 lg:-mx-8">
        <div className="inline-block min-w-full py-2 align-middle md:px-6 lg:px-8">
          <div className="overflow-hidden shadow ring-1 ring-black ring-opacity-5 md:rounded-lg">
            <table className="min-w-full divide-y divide-gray-300">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orden #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Cliente
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Items
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Estado Pago
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha
                  </th>
                  <th className="relative px-6 py-3">
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.map((order) => {
                  const statusInfo = orderStatusConfig[order.status];
                  const payStatusInfo = payStatusConfig[order.pay_status];
                  
                  return (
                    <tr key={order.id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          #{order.id}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {order.customerName || order.client.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {order.customerEmail || order.client.email}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(order.total_cost)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.itemsCount || order.received_products?.length || 0} items
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusInfo.className}`}>
                          {statusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${payStatusInfo.className}`}>
                          {payStatusInfo.label}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {order.orderDate ? formatDate(order.orderDate) : 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button 
                          className="text-blue-600 hover:text-blue-900"
                          onClick={() => onViewDetails?.(order)}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
