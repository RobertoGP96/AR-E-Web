
import PackageStatusBadge from './PackageStatusBadge';
// Extiende el badge para aceptar 'Procesado'
import type { PackageStatus } from '@/types/models/base';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Package } from '@/types';
import { Camera, Edit2,Trash2 } from 'lucide-react';




// Datos de ejemplo
const mockPackages: Package[] = [
  {
    id: 1,
    agency_name: "2",
    number_of_tracking: "#PKG-001234",
    status_of_processing: "Enviado",
    package_picture: []
  },
  {
    id: 2,
    agency_name: "3",
    number_of_tracking: "#PKG-001235",
    status_of_processing: "Enviado",
    package_picture: []
  },
  {
    id: 3,
    agency_name: "24",
    number_of_tracking: "#PKG-001236",
    status_of_processing: "Recibido",
    package_picture: []
  },
  {
    id: 4,
    agency_name: "34",
    number_of_tracking: "#PKG-001237",
    status_of_processing: "Procesado",
    package_picture: []
  }
];

const PackageTable: React.FC = () => {
  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100 ">
          <TableRow>
            <TableHead>#</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>No. Rastreo</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Captura</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPackages.map((apackage, index) => (
            <TableRow key={apackage.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>{apackage.agency_name}</TableCell>
              <TableCell>{apackage.number_of_tracking}</TableCell>
              <TableCell>
                <PackageStatusBadge status={apackage.status_of_processing as PackageStatus} />
              </TableCell>
              <TableCell>
                <Camera className='h-5 w-5' />
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

export default PackageTable;