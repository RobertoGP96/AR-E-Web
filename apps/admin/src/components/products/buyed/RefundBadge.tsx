import React from 'react';
import { Badge } from '@/components/ui/badge';
import { RefreshCw, CheckCircle2 } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { formatDate } from '@/lib/format-date';

interface RefundBadgeProps {
  isRefunded: boolean;
  refundDate?: string | null;
  refundAmount?: number;
  refundNotes?: string | null;
  showDetails?: boolean;
}

export const RefundBadge: React.FC<RefundBadgeProps> = ({
  isRefunded,
  refundDate,
  refundAmount = 0,
  refundNotes,
  showDetails = true,
}) => {
  if (!isRefunded) {
    return null;
  }

  const badge = (
    <Badge 
      variant="secondary" 
      className="bg-amber-100 text-amber-800 hover:bg-amber-200 border-amber-300"
    >
      <RefreshCw className="w-3 h-3 mr-1" />
      Reembolsado
    </Badge>
  );

  if (!showDetails || (!refundDate && !refundAmount && !refundNotes)) {
    return badge;
  }

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          {badge}
        </TooltipTrigger>
        <TooltipContent className="max-w-xs">
          <div className="space-y-2 text-sm">
            <div className="flex items-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-green-600" />
              <span>Producto Reembolsado</span>
            </div>
            
            {refundDate && (
              <div>
                <span className="font-medium">Fecha:</span> {formatDate(refundDate)}
              </div>
            )}
            
            {refundAmount > 0 && (
              <div>
                <span className="font-medium">Monto:</span> ${refundAmount.toFixed(2)}
              </div>
            )}
            
            {refundNotes && (
              <div>
                <span className="font-medium">Notas:</span>
                <p className="text-muted-foreground mt-1">{refundNotes}</p>
              </div>
            )}
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};
