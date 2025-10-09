
import PackageStatusBadge from './PackageStatusBadge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import type { Package } from '@/types';
import { Camera, Clock, Edit2, Trash2 } from 'lucide-react';
import { formatDate } from '@/lib/format-date';




// Datos de ejemplo
const mockPackages: Package[] = [
  {
    id: 1,
    agency_name: "2",
    number_of_tracking: "PKG-001234",
    status_of_processing: "Encargado",
    created_at: "2023-10-01T12:00:00Z",
    updated_at: "2023-10-01T12:00:00Z",
    package_picture: []
  },
  {
    id: 2,
    agency_name: "3",
    number_of_tracking: "PKG-001235",
    status_of_processing: "Procesando",
    created_at: "2023-10-01T12:00:00Z",
    updated_at: "2023-10-01T12:00:00Z",
    package_picture: []
  },
  {
    id: 3,
    agency_name: "24",
    number_of_tracking: "PKG-001236",
    status_of_processing: "Completado",
    created_at: "2023-10-01T12:00:00Z",
    updated_at: "2023-10-01T12:00:00Z",
    package_picture: []
  },
  {
    id: 4,
    agency_name: "34",
    number_of_tracking: "PKG-001237",
    status_of_processing: "Cancelado",
    created_at: "2023-10-01T12:00:00Z",
    updated_at: "2023-10-01T12:00:00Z",
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
            <TableHead>Llegada</TableHead>
            <TableHead>Estado</TableHead>
            <TableHead>Captura</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {mockPackages.map((apackage, index) => (
            <TableRow key={apackage.id}>
              <TableCell>{index + 1}</TableCell>
              <TableCell>
                <div className='flex flex-row items-center'>
                  <span className='rounded-full bg-gray-200 px-2  py-1 text-xs font-medium'>
                    {"#" + apackage.agency_name}
                  </span>
                </div>
              </TableCell>
              <TableCell>{apackage.number_of_tracking}</TableCell>
              <TableCell>
                <div className='flex flex-row items-center text-gray-500'>
                  <Clock className="mr-2 inline h-4 w-4" />
                  {formatDate(apackage.created_at)}
                </div>
              </TableCell>
              <TableCell>
                <PackageStatusBadge status={apackage.status_of_processing} />
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

export default PackageTable;