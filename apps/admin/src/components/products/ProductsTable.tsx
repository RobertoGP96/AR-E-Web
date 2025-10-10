
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
import { Edit2, Trash2, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface ProductsTableProps {
  products: Product[];
  onEdit?: (product: Product) => void;
  onDelete?: (product: Product) => void;
}

// Función helper para obtener el color del badge según el estado
const getStatusBadgeVariant = (status: string) => {
  const statusMap: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
    "Encargado": "default",
    "Comprado": "secondary",
    "Completado": "outline",
    "Cancelado": "destructive",
  };
  return statusMap[status] || "default";
};

const ProductsTable: React.FC<ProductsTableProps> = ({ 
  products, 
  onEdit, 
  onDelete 
}) => {
  // Si no hay productos, mostrar mensaje
  if (!products || products.length === 0) {
    return (
      <div className="rounded-lg border border-muted bg-background p-8 text-center shadow">
        <p className="text-muted-foreground">No hay productos disponibles</p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table>
        <TableHeader className="bg-gray-100">
          <TableRow>
            <TableHead className="w-12">#</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Nombre</TableHead>
            <TableHead>Tienda</TableHead>
            <TableHead>Categoría</TableHead>
            <TableHead className="text-center">Solicitado</TableHead>
            <TableHead className="text-center">Comprado</TableHead>
            <TableHead className="text-center">Entregado</TableHead>
            <TableHead className="text-center">Estado</TableHead>
            <TableHead className="text-right">Costo Total</TableHead>
            <TableHead className="text-right">Costo/Unidad</TableHead>
            <TableHead className="text-center">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, idx) => (
            <TableRow key={product.id}>
              <TableCell className="font-medium">{idx + 1}</TableCell>
              <TableCell className="font-mono text-sm">{product.sku}</TableCell>
              <TableCell>
                <div className="flex items-center gap-2">
                  <span className="font-medium">{product.name}</span>
                  {product.link && (
                    <a
                      href={product.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800"
                      title="Ver producto en tienda"
                    >
                      <ExternalLink className="h-4 w-4" />
                    </a>
                  )}
                </div>
                {product.description && (
                  <p className="text-sm text-muted-foreground">{product.description}</p>
                )}
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium">{product.shop?.name || "N/A"}</span>
                  {product.shop?.link && (
                    <a
                      href={product.shop.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-600 hover:text-blue-800"
                    >
                      Ir a tienda
                    </a>
                  )}
                </div>
              </TableCell>
              <TableCell>
                {product.category && (
                  <Badge variant="outline">{product.category}</Badge>
                )}
              </TableCell>
              <TableCell className="text-center">{product.amount_requested}</TableCell>
              <TableCell className="text-center">
                <span className={product.is_fully_purchased ? "font-semibold text-green-600" : ""}>
                  {product.amount_purchased}
                </span>
                {product.pending_purchase > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (pendiente: {product.pending_purchase})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <span className={product.is_fully_delivered ? "font-semibold text-green-600" : ""}>
                  {product.amount_delivered}
                </span>
                {product.pending_delivery > 0 && (
                  <span className="ml-1 text-xs text-muted-foreground">
                    (pendiente: {product.pending_delivery})
                  </span>
                )}
              </TableCell>
              <TableCell className="text-center">
                <Badge variant={getStatusBadgeVariant(product.status)}>
                  {product.status}
                </Badge>
              </TableCell>
              <TableCell className="text-right font-semibold">
                ${product.total_cost.toFixed(2)}
              </TableCell>
              <TableCell className="text-right text-muted-foreground">
                ${product.cost_per_product.toFixed(2)}
              </TableCell>
              <TableCell>
                <div className="flex items-center justify-center gap-2">
                  {onEdit && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(product)}
                      title="Editar producto"
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                  )}
                  {onDelete && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete(product)}
                      title="Eliminar producto"
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
      
      {/* Resumen de totales */}
      <div className="border-t bg-gray-50 p-4">
        <div className="flex justify-end gap-8 text-sm">
          <div>
            <span className="text-muted-foreground">Total productos: </span>
            <span className="font-semibold">{products.length}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Costo total: </span>
            <span className="font-semibold">
              ${products.reduce((sum, p) => sum + p.total_cost, 0).toFixed(2)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductsTable;
