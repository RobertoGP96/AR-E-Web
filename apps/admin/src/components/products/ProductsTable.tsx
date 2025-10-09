
import * as React from "react";
import type { Product } from "../../types/models/product";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from "@/components/ui/table";
import { Button } from "../ui/button";
import { Edit2, Trash2 } from "lucide-react";

interface ProductsTableProps {
  products: Product[];
}



const mockUser: import("../../types/models/user").CustomUser = {
  id: 1,
  email: "cliente@demo.com",
  name: "Cliente",
  last_name: "Demo",
  home_address: "Calle Falsa 123",
  phone_number: "555-1234",
  role: "user",
  agent_profit: 0,
  is_staff: false,
  is_active: true,
  is_verified: true,
  date_joined: "2025-01-01T00:00:00Z",
  sent_verification_email: false,
  full_name: "Cliente Demo",
};

const mockManager: import("../../types/models/user").CustomUser = {
  id: 2,
  email: "manager@demo.com",
  name: "Manager",
  last_name: "Demo",
  home_address: "Calle Real 456",
  phone_number: "555-5678",
  role: "admin",
  agent_profit: 0,
  is_staff: true,
  is_active: true,
  is_verified: true,
  date_joined: "2025-01-01T00:00:00Z",
  sent_verification_email: false,
  full_name: "Manager Demo",
};

const mockProducts: Product[] = [
  {
    id: "1",
    sku: "SKU001",
    name: "Laptop Lenovo",
    link: "https://example.com/laptop",
    shop: { 
      id: 1, 
      name: "TechStore", 
      link: "https://techstore.com",
      buying_accounts: [],
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01"
    },
    description: "Laptop de alto rendimiento",
    observation: "Entrega rápida",
    category: "Electrónica",
    amount_requested: 5,
    amount_purchased: 5,
    amount_delivered: 0,
    order: {
      id: 101,
      client: mockUser,
      sales_manager: mockManager,
      status: "Encargado",
      pay_status: "Pagado",
      total_cost: 905,
      products: [],
      delivery_receipts: [],
      received_value_of_client: 0,
      extra_payments: 0,
      total_products_requested: 5,
      total_products_purchased: 5,
      total_products_delivered: 0,
      created_at: "2024-01-01T10:00:00Z",
      updated_at: "2024-01-01T10:00:00Z"
    },
    status: "Encargado",
    product_pictures: [],
    shop_cost: 800,
    shop_delivery_cost: 50,
    shop_taxes: 40,
    own_taxes: 10,
    added_taxes: 5,
    total_cost: 905,
    cost_per_product: 181,
    amount_buyed: 5,
    amount_received: 0,
    pending_purchase: 0,
    pending_delivery: 5,
    is_fully_purchased: true,
    is_fully_delivered: false,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z"
  },
  {
    id: "2",
    sku: "SKU002",
    name: "Mouse Logitech",
    link: "https://example.com/mouse",
    shop: { 
      id: 2, 
      name: "Peripherals", 
      link: "https://peripherals.com",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      buying_accounts: []
    },
    description: "Mouse inalámbrico",
    observation: "Garantía 2 años",
    category: "Accesorios",
    amount_requested: 10,
    amount_purchased: 10,
    amount_delivered: 10,
    order: {
      id: 102,
      client: mockUser,
      sales_manager: mockManager,
      status: "Completado",
      pay_status: "Pagado",
      total_cost: 28.5,
      products: [],
      delivery_receipts: [],
      received_value_of_client: 0,
      extra_payments: 0,
      total_products_requested: 10,
      total_products_purchased: 10,
      total_products_delivered: 10,
      created_at: "2024-01-02T10:00:00Z",
      updated_at: "2024-01-02T10:00:00Z"
    },
    status: "Completado",
    product_pictures: [],
    shop_cost: 20,
    shop_delivery_cost: 5,
    shop_taxes: 2,
    own_taxes: 1,
    added_taxes: 0.5,
    total_cost: 28.5,
    cost_per_product: 2.85,
    amount_buyed: 10,
    amount_received: 10,
    pending_purchase: 0,
    pending_delivery: 0,
    is_fully_purchased: true,
    is_fully_delivered: true,
    created_at: "2024-01-02T10:00:00Z",
    updated_at: "2024-01-02T10:00:00Z"
  },
  {
    id: "3",
    sku: "SKU003",
    name: "Monitor Samsung",
    link: "https://example.com/monitor",
    shop: { 
      id: 3, 
      name: "Displays", 
      link: "https://displays.com",
      is_active: true,
      created_at: "2024-01-01",
      updated_at: "2024-01-01",
      buying_accounts: []
    },
    description: "Monitor 24 pulgadas",
    observation: "Incluye cable HDMI",
    category: "Electrónica",
    amount_requested: 3,
    amount_purchased: 3,
    amount_delivered: 3,
    order: {
      id: 103,
      client: mockUser,
      sales_manager: mockManager,
      status: "Completado",
      pay_status: "Pagado",
      total_cost: 183,
      products: [],
      delivery_receipts: [],
      received_value_of_client: 0,
      extra_payments: 0,
      total_products_requested: 3,
      total_products_purchased: 3,
      total_products_delivered: 3,
      created_at: "2024-01-03T10:00:00Z",
      updated_at: "2024-01-03T10:00:00Z"
    },
    status: "Completado",
    product_pictures: [],
    shop_cost: 150,
    shop_delivery_cost: 20,
    shop_taxes: 10,
    own_taxes: 2,
    added_taxes: 1,
    total_cost: 183,
    cost_per_product: 61,
    amount_buyed: 3,
    amount_received: 3,
    pending_purchase: 0,
    pending_delivery: 0,
    is_fully_purchased: true,
    is_fully_delivered: true,
    created_at: "2024-01-03T10:00:00Z",
    updated_at: "2024-01-03T10:00:00Z"
  },
];

const ProductsTable: React.FC<ProductsTableProps> = () => {
  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100 ">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tienda</TableHead>
            <TableHead>Cantidad Solicitada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Costo Total</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockProducts.map((product, idx) => (
            <TableRow key={product.id}>
              <TableCell>{idx + 1}</TableCell>
              <TableCell>{product.sku}</TableCell>
              <TableCell>{product.name}</TableCell>
              <TableCell>{product.shop?.name}</TableCell>
              <TableCell>{product.amount_requested}</TableCell>
              <TableCell>{product.status}</TableCell>
              <TableCell>${product.total_cost.toFixed(2)}</TableCell>
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
};

export default ProductsTable;
