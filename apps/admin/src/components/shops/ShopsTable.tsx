import { Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import type { ShopTableData } from '@/types/models/shopTable';
import { shopStatusConfig } from '@/types/models/shopTable';

interface ShopsTableProps {
  shops?: ShopTableData[];
  onViewDetails?: (shop: ShopTableData) => void;
  onEdit?: (shop: ShopTableData) => void;
  onViewReports?: (shop: ShopTableData) => void;
}

const mockShops: ShopTableData[] = [
  {
    id: 1,
    name: "Tienda Centro",
    link: "https://centro.example.com",
    address: "Carrera 7 #32-16",
    city: "Bogotá",
    status: "active",
    employees: 12,
    monthlySales: 2450000
  },
  {
    id: 2,
    name: "Tienda Norte",
    link: "https://norte.example.com",
    address: "Calle 85 #15-22",
    city: "Bogotá",
    status: "active",
    employees: 8,
    monthlySales: 1850000
  },
  {
    id: 3,
    name: "Tienda Sur",
    link: "https://sur.example.com",
    address: "Carrera 30 #8-45",
    city: "Bogotá",
    status: "active",
    employees: 15,
    monthlySales: 3200000
  },
  {
    id: 4,
    name: "Tienda Medellín Centro",
    link: "https://medellin.example.com",
    address: "Carrera 43A #19-45",
    city: "Medellín",
    status: "maintenance",
    employees: 10,
    monthlySales: 1950000
  },
  {
    id: 5,
    name: "Tienda Cali Valle",
    link: "https://cali.example.com",
    address: "Avenida 6N #25-40",
    city: "Cali",
    status: "active",
    employees: 18,
    monthlySales: 2800000
  }
];

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0
  }).format(amount);
};

export default function ShopsTable({
  shops = mockShops,
  onViewDetails,
  onEdit,
  onViewReports
}: ShopsTableProps) {
  return (
    <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nombre</TableHead>
              <TableHead>Enlace</TableHead>
              <TableHead>Dirección</TableHead>
              <TableHead>Ciudad</TableHead>
              <TableHead>Estado</TableHead>
              <TableHead>Empleados</TableHead>
              <TableHead>Ventas del Mes</TableHead>
              <TableHead>Acciones</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shops.map((shop) => {
              const statusInfo = shopStatusConfig[shop.status || 'active'];
              
              return (
                <TableRow key={shop.id}>
                  <TableCell className="font-medium">{shop.name}</TableCell>
                  <TableCell>
                    <a 
                      href={shop.link} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 underline"
                    >
                      Ver sitio
                    </a>
                  </TableCell>
                  <TableCell>{shop.address || '-'}</TableCell>
                  <TableCell>{shop.city || '-'}</TableCell>
                  <TableCell>
                    <span className={`px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${statusInfo.className}`}>
                      {statusInfo.label}
                    </span>
                  </TableCell>
                  <TableCell>
                    {shop.employees ? (
                      <div className="flex items-center gap-1">
                        <Users className="h-4 w-4" />
                        {shop.employees} empleados
                      </div>
                    ) : '-'}
                  </TableCell>
                  <TableCell className="font-medium">
                    {shop.monthlySales ? formatCurrency(shop.monthlySales) : '-'}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button 
                        variant="link" 
                        className="text-orange-600 hover:text-orange-900 p-0"
                        onClick={() => onViewDetails?.(shop)}
                      >
                        Ver Detalles
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-blue-600 hover:text-blue-900 p-0"
                        onClick={() => onEdit?.(shop)}
                      >
                        Editar
                      </Button>
                      <Button 
                        variant="link" 
                        className="text-purple-600 hover:text-purple-900 p-0"
                        onClick={() => onViewReports?.(shop)}
                      >
                        Reportes
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
