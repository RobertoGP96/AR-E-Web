import { Clock, MoreHorizontal, Eye, Edit, Truck, CreditCard, RotateCcw, AlertTriangle, CheckCircle } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import type { PackageTableData } from '@/types/models/packageTable';
import { packageStatusConfig, packageActionConfig } from '@/types/models/packageTable';

interface PackagesTableProps {
  packages?: PackageTableData[];
  onTrackPackage?: (pkg: PackageTableData) => void;
  onEditPackage?: (pkg: PackageTableData) => void;
  onDeliverPackage?: (pkg: PackageTableData) => void;
  onViewPackage?: (pkg: PackageTableData) => void;
  onInvoicePackage?: (pkg: PackageTableData) => void;
  onPackageClick?: (pkg: PackageTableData) => void;
}

// Iconos para las acciones
const actionIcons = {
  view: Eye,
  edit: Edit,
  track: Truck,
  deliver: CheckCircle,
  invoice: CreditCard,
  resend: RotateCcw,
  claim: AlertTriangle,
  resolve: AlertTriangle
};

// Función para formatear la fecha
const formatDate = (dateString: string): string => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
  
  if (diffInHours < 1) {
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    return `Hace ${diffInMinutes} min`;
  } else if (diffInHours < 24) {
    return `Hace ${diffInHours} horas`;
  } else {
    return date.toLocaleDateString('es-ES', { 
      day: '2-digit', 
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
};

// Datos de ejemplo
const mockPackages: PackageTableData[] = [
  {
    id: "1",
    trackingCode: "#PKG-001234",
    recipient: "Juan Pérez",
    recipientEmail: "juan.perez@email.com",
    recipientPhone: "+57 300 1234567",
    address: "Calle 123 #45-67, Bogotá",
    city: "bogota",
    status: "transito",
    lastUpdate: "2024-01-20T13:30:00Z",
    weight: 2.5,
    dimensions: "30x20x15 cm",
    declaredValue: 150000,
    orderCode: "#ORD-5678",
    carrier: "Servientrega",
    notes: "Entregar en horario de oficina"
  },
  {
    id: "2",
    trackingCode: "#PKG-001235",
    recipient: "María García",
    recipientEmail: "maria.garcia@email.com",
    recipientPhone: "+57 301 9876543",
    address: "Carrera 15 #78-90, Medellín",
    city: "medellin",
    status: "entrega",
    lastUpdate: "2024-01-20T14:00:00Z",
    weight: 1.2,
    dimensions: "25x15x10 cm",
    declaredValue: 80000,
    orderCode: "#ORD-5679",
    carrier: "Coordinadora",
    notes: "Verificar documento de identidad"
  },
  {
    id: "3",
    trackingCode: "#PKG-001236",
    recipient: "Carlos Rodríguez",
    recipientEmail: "carlos.rodriguez@email.com",
    recipientPhone: "+57 302 5555555",
    address: "Avenida 68 #25-34, Bogotá",
    city: "bogota",
    status: "entregado",
    lastUpdate: "2024-01-19T15:45:00Z",
    weight: 0.8,
    dimensions: "20x10x5 cm",
    declaredValue: 45000,
    orderCode: "#ORD-5680",
    carrier: "Servientrega",
    notes: "Entregado al portero"
  },
  {
    id: "4",
    trackingCode: "#PKG-001237",
    recipient: "Ana López",
    recipientEmail: "ana.lopez@email.com",
    recipientPhone: "+57 303 7777777",
    address: "Zona Industrial 789, Cali",
    city: "cali",
    status: "preparacion",
    lastUpdate: "2024-01-20T09:15:00Z",
    weight: 5.0,
    dimensions: "40x30x25 cm",
    declaredValue: 300000,
    orderCode: "#ORD-5681",
    carrier: "Inter Rapidísimo",
    notes: "Paquete frágil - manejar con cuidado"
  }
];

export default function PackagesTable({
  packages = mockPackages,
  onTrackPackage,
  onEditPackage,
  onDeliverPackage,
  onViewPackage,
  onInvoicePackage,
  onPackageClick
}: PackagesTableProps) {
  const handleAction = (action: string, pkg: PackageTableData) => {
    switch (action) {
      case 'track':
        onTrackPackage?.(pkg);
        break;
      case 'edit':
        onEditPackage?.(pkg);
        break;
      case 'deliver':
        onDeliverPackage?.(pkg);
        break;
      case 'view':
        onViewPackage?.(pkg);
        break;
      case 'invoice':
        onInvoicePackage?.(pkg);
        break;
      default:
        console.log(`Acción ${action} no implementada para:`, pkg);
    }
  };

  const getActionLabel = (action: string): string => {
    const actionLabels = {
      view: 'Ver Detalles',
      edit: 'Editar',
      track: 'Rastrear',
      deliver: 'Entregar',
      invoice: 'Facturar',
      resend: 'Reenviar',
      claim: 'Reclamar',
      resolve: 'Resolver',
      cancel: 'Cancelar'
    };
    return actionLabels[action as keyof typeof actionLabels] || action;
  };

  return (
    <Card className="shadow-lg border-0 bg-white rounded-2xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Código
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Destinatario
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Dirección
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Última Actualización
              </th>
              <th className="px-6 py-4 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {packages.map((pkg) => {
              const statusConfig = packageStatusConfig[pkg.status];
              const availableActions = packageActionConfig[pkg.status] || [];

              return (
                <tr 
                  key={pkg.id}
                  className="hover:bg-gray-50/80 transition-colors duration-200 cursor-pointer group"
                  onClick={() => onPackageClick?.(pkg)}
                >
                  <td className="px-6 py-4">
                    <div className="text-sm font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                      {pkg.trackingCode}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pkg.orderCode}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm font-medium text-gray-900">
                      {pkg.recipient}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pkg.recipientPhone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-600 max-w-xs truncate">
                      {pkg.address}
                    </div>
                    <div className="text-xs text-gray-500">
                      {pkg.carrier}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <Badge className={`${statusConfig.className} rounded-full px-3 py-1 w-fit`}>
                      {statusConfig.label}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-1 text-sm text-gray-600">
                      <Clock className="h-4 w-4" />
                      {formatDate(pkg.lastUpdate)}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          className="h-8 w-8 p-0 hover:bg-gray-100 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48 rounded-xl shadow-xl border-gray-200">
                        {availableActions.map((action) => {
                          const ActionIcon = actionIcons[action as keyof typeof actionIcons];
                          return (
                            <DropdownMenuItem 
                              key={action}
                              onClick={(e) => {
                                e.stopPropagation();
                                handleAction(action, pkg);
                              }}
                              className="flex items-center gap-2 hover:bg-orange-50 hover:text-orange-600 rounded-lg"
                            >
                              {ActionIcon && <ActionIcon className="h-4 w-4" />}
                              {getActionLabel(action)}
                            </DropdownMenuItem>
                          );
                        })}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
