import React, { memo } from 'react';
import { CheckCircle2, Home, Tag } from 'lucide-react';
import type { Product } from '../../types/product';

// Mapping de estados a clases CSS
const STATUS: Record<string, string> = {
  'Encargado': 'bg-gray-100 text-gray-800',
  'ordered': 'bg-gray-100 text-gray-800',
  'Procesando': 'bg-blue-100 text-blue-800',
  'processing': 'bg-blue-100 text-blue-800',
  'Comprado': 'bg-blue-100 text-blue-800',
  'purchased': 'bg-blue-100 text-blue-800',
  'Completado': 'bg-green-100 text-green-800',
  'completed': 'bg-green-100 text-green-800',
  'Recibido': 'bg-green-100 text-green-800',
  'received': 'bg-green-100 text-green-800',
  'Enviado': 'bg-green-100 text-green-800',
  'shipped': 'bg-green-100 text-green-800',
  'Entregado': 'bg-green-100 text-green-800',
  'delivered': 'bg-green-100 text-green-800',
  'Cancelado': 'bg-red-100 text-red-800',
  'cancelled': 'bg-red-100 text-red-800',
  'Pendiente': 'bg-yellow-100 text-yellow-800',
  'pending': 'bg-yellow-100 text-yellow-800',
} as const;

interface ProductCardProps {
  product: Product;
}

interface IconProps {
  className?: string;
  size?: number;
}

const IconHome: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <Home className={className} />
);

const IconTag: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <Tag className={className} />
);

const IconCheck: React.FC<IconProps> = ({ className = 'w-3 h-3' }) => (
  <CheckCircle2 className={className} />
);

function ProductCardComponent({ product }: ProductCardProps) {
  const statusClass = STATUS[product.status] || STATUS['pending'];
  const isFullyDelivered = product.is_fully_delivered;

  return (
    <div className="w-72 rounded-2xl p-5 shadow-sm border border-orange-400  hover:shadow-md transition-shadow duration-300">
      {/* Top row */}
      <div className="flex justify-between items-start mb-4">
        {/* Left: id + name + badges */}
        <div className="flex flex-col gap-1.5">
          <span className="text-sm font-semibold text-orange-400 line-clamp-2">{product.name}</span>


        </div>

        {/* Right: status + ok badges */}
        <div className="flex flex-col items-end gap-1.5 shrink-0 ml-2">
          <span className={`text-[11px] font-medium px-2 py-0.5 rounded-md ${statusClass}`}>
            {product.status}
          </span>
          {isFullyDelivered && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/30 px-2 py-0.5 rounded-md">
              <IconCheck />
              Ok
            </span>
          )}
        </div>
      </div>

      {/* Tienda + Categoria badges */}
          <div className="w-full flex flex-row flex-wrap gap-1.5 mt-0.5 mb-2">
            {product.shop && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                <IconHome />
                {typeof product.shop === 'string' ? product.shop : product.shop.name}
              </span>
            )}
            {product.category && (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md">
                <IconTag />
                {product.category}
              </span>
            )}
          </div>
      {/* Divider */}
      <div className="h-px bg-gray-100 dark:bg-gray-700 mb-4" />

      {/* Stats */}
      <div className="grid grid-cols-2 text-center">
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-gray-800 dark:text-gray-100 leading-none tabular-nums">
            {product.amount_requested}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Solicitado</span>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-2xl font-bold text-green-600 dark:text-green-400 leading-none tabular-nums">
            {product.amount_delivered}
          </span>
          <span className="text-[10px] uppercase tracking-wider text-gray-400 dark:text-gray-500">Entregado</span>
        </div>
      </div>
    </div>
  );
}

export const ProductCard = memo(ProductCardComponent);
