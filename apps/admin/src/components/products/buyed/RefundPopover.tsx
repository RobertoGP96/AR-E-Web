import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { RefreshCw, Save, X } from 'lucide-react';
import { toast } from 'sonner';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import type { ProductBuyed } from '@/types/models';

interface RefundPopoverProps {
  productBuyed: ProductBuyed;
  disabled?: boolean;
}

interface RefundData {
  is_refunded: boolean;
  quantity_refunded?: number;
  refund_date: string;
  refund_amount: number;
  refund_notes: string;
}

export const RefundPopover: React.FC<RefundPopoverProps> = ({
  productBuyed,
  disabled = false,
}) => {
  const [open, setOpen] = useState(false);
  const [refundData, setRefundData] = useState<RefundData>({
    is_refunded: true,
    refund_date: new Date().toISOString().split('T')[0],
    refund_amount: 0,
    refund_notes: '',
  });

  const queryClient = useQueryClient();

  const refundMutation = useMutation({
    mutationFn: async (data: RefundData) => {
      return await apiClient.patch<ProductBuyed>(`/api_data/buyed_product/${productBuyed.id}/`, data);
    },
    onSuccess: () => {
      toast.success('Reembolso registrado correctamente');
      queryClient.invalidateQueries({ queryKey: ['productsBuyed'] });
      queryClient.invalidateQueries({ queryKey: ['shoppingReceipts'] });
      queryClient.invalidateQueries({ queryKey: ['shoppingReceipt', productBuyed.shopping_receip?.id] });
      setOpen(false);
    },
    onError: (error: Error & { response?: { data?: { detail?: string } } }) => {
      toast.error(error.response?.data?.detail || 'Error al registrar el reembolso');
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (refundData.refund_amount <= 0) {
      toast.error('El monto del reembolso debe ser mayor a 0');
      return;
    }

    refundMutation.mutate(refundData);
  };

  const handleCancel = () => {
    setOpen(false);
    // Resetear datos
    setRefundData({
      is_refunded: true,
      refund_date: new Date().toISOString().split('T')[0],
      refund_amount:  0,
      refund_notes: '',
    });
  };

  // Si ya está reembolsado, no mostrar el botón
  if (productBuyed.is_refunded) {
    return null;
  }

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled}
          className="gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Reembolsar
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96" align="end">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <RefreshCw className="w-4 h-4" />
              Registrar Reembolso
            </h4>
            <p className="text-xs text-muted-foreground">
              Completa la información del reembolso del producto
            </p>
          </div>

          <div className="space-y-3">
            {/* Fecha de reembolso */}
            <div className="space-y-1">
              <Label htmlFor="refund_date" className="text-xs">
                Fecha de Reembolso
              </Label>
              <Input
                id="refund_date"
                type="date"
                value={refundData.refund_date}
                onChange={(e) =>
                  setRefundData({ ...refundData, refund_date: e.target.value })
                }
                required
                className="h-9"
              />
            </div>

            {/* Cantidad del reembolso */}
            <div className="space-y-1">
              <Label htmlFor="quantity_refunded" className="text-xs">
                Cantidad Reembolsada
              </Label>
              <Input
                id="quantity_refuned"
                type="number"
                step="1"
                min="1"
                value={refundData.quantity_refunded}
                onChange={(e) =>
                  setRefundData({
                    ...refundData,
                    quantity_refunded: parseInt(e.target.value) || 0,
                  })
                }
                required
                className="h-9"
              />
            </div>

            {/* Monto del reembolso */}
            <div className="space-y-1">
              <Label htmlFor="refund_amount" className="text-xs">
                Monto Reembolsado ($)
              </Label>
              <Input
                id="refund_amount"
                type="number"
                step="0.01"
                min="0.01"
                value={refundData.refund_amount}
                onChange={(e) =>
                  setRefundData({
                    ...refundData,
                    refund_amount: parseFloat(e.target.value) || 0,
                  })
                }
                required
                className="h-9"
              />
            </div>

            {/* Notas del reembolso */}
            <div className="space-y-1">
              <Label htmlFor="refund_notes" className="text-xs">
                Notas / Motivo (opcional)
              </Label>
              <Textarea
                id="refund_notes"
                value={refundData.refund_notes}
                onChange={(e) =>
                  setRefundData({ ...refundData, refund_notes: e.target.value })
                }
                placeholder="Ej: Producto defectuoso, cliente insatisfecho..."
                className="min-h-[80px] text-sm"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex gap-2 pt-2">
            <Button
              type="submit"
              size="sm"
              className="flex-1 gap-2"
              disabled={refundMutation.isPending}
            >
              <Save className="w-4 h-4" />
              {refundMutation.isPending ? 'Guardando...' : 'Guardar Reembolso'}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={refundMutation.isPending}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </form>
      </PopoverContent>
    </Popover>
  );
};
