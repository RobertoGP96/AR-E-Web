import * as React from 'react';
import type { Category } from '@/types/models/category';
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableCell,
  TableHead,
} from '@/components/ui/table';
import { Button } from '../ui/button';
import { Edit2, Trash2, MoreHorizontal, Clock } from 'lucide-react';
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { formatDate } from '@/lib/format-date';

interface CategoriesTableProps {
  categories: Category[];
  isLoading?: boolean;
  onEdit?: (category: Category) => void;
  onDelete?: (category: Category) => void;
}

const CategoriesTable: React.FC<CategoriesTableProps> = ({ categories, isLoading, onEdit, onDelete }) => {
  if (isLoading) {
    return (
      <div className="rounded-lg border border-muted bg-background p-8 text-center shadow">
        <p className="text-muted-foreground">Cargando categorías...</p>
      </div>
    );
  }

  if (!categories || categories.length === 0) {
    return (
      <div className="rounded-lg border border-muted bg-background p-8 text-center shadow">
        <p className="text-muted-foreground">No hay categorías disponibles</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead className="text-right">Costo / lb</TableHead>
            <TableHead className="text-right">Creado</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((cat, idx) => (
            <TableRow key={cat.id}>
              <TableCell className="font-medium">{idx + 1}</TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{cat.name}</span>
                </div>
              </TableCell>
              <TableCell className="text-right font-semibold">${cat.shipping_cost_per_pound.toFixed(2)}</TableCell>
              <TableCell className="text-right text-muted-foreground">
                <div className="flex items-center justify-end gap-2">
                  <Clock className="h-4 w-4 text-gray-400" />
                  <span>{formatDate(cat.created_at)}</span>
                </div>
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="sm" aria-label="Más opciones">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-40 rounded-xl shadow-xl border-gray-200">
                      {onEdit && (
                        <DropdownMenuItem onClick={() => onEdit(cat)}>
                          <Edit2 className="h-4 w-4" />
                          <span>Editar</span>
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuSeparator />
                      {onDelete && (
                        <DropdownMenuItem data-variant="destructive" onClick={() => onDelete(cat)}>
                          <Trash2 className="h-4 w-4" />
                          <span>Eliminar</span>
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default CategoriesTable;
