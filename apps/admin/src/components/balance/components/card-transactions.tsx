import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { PaymentStatusEnum } from '@/types/services/cardOperations';
import { useCardHistory } from '@/hooks/use-card-history';

type CardTransactionsProps = {
  initialCardId?: string;
};

const STATUS_COLORS = {
  [PaymentStatusEnum.PAGADO]: 'bg-green-100 text-green-800',
  [PaymentStatusEnum.PENDIENTE]: 'bg-yellow-100 text-yellow-800',
  [PaymentStatusEnum.CANCELADO]: 'bg-red-100 text-red-800',
  [PaymentStatusEnum.REEMBOLSADO]: 'bg-blue-100 text-blue-800',
  [PaymentStatusEnum.NO_PAGADO]: 'bg-gray-100 text-gray-800',
} as const;

export function CardTransactions({ initialCardId = '' }: CardTransactionsProps = {}) {
  const today = new Date();
  const [dateRange, setDateRange] = useState({
    from: new Date(today.getFullYear(), today.getMonth(), 1), // First day of current month
    to: today, // Today
  });
  
  const [cardId, setCardId] = useState(initialCardId);
  
  const { data, isLoading, isError, error } = useCardHistory({
    startDate: dateRange.from,
    endDate: dateRange.to,
    cardId: cardId || undefined,
  } as const);

  if (isError) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle>Error al cargar transacciones</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-destructive">{error.message}</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <CardTitle>Historial de Transacciones</CardTitle>
            <CardDescription>
              Visualiza el historial de transacciones de las tarjetas
            </CardDescription>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  id="date"
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dateRange && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dateRange?.from ? (
                    dateRange.to ? (
                      <>
                        {format(dateRange.from, 'LLL dd, y', { locale: es })} -{' '}
                        {format(dateRange.to, 'LLL dd, y', { locale: es })}
                      </>
                    ) : (
                      format(dateRange.from, 'LLL dd, y', { locale: es })
                    )
                  ) : (
                    <span>Selecciona un rango de fechas</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  initialFocus
                  mode="range"
                  defaultMonth={dateRange?.from}
                  selected={dateRange}
                  onSelect={(range) => {
                    if (range?.from && range.to) {
                      setDateRange({ from: range.from, to: range.to });
                    }
                  }}
                  numberOfMonths={2}
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            <Input
              placeholder="Filtrar por ID de tarjeta"
              value={cardId}
              onChange={(e) => setCardId(e.target.value)}
              className="w-full sm:w-[200px]"
            />
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[600px] rounded-md border">
          <Table>
            <TableHeader className="sticky top-0 bg-background">
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Monto</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Tienda</TableHead>
                <TableHead>Producto</TableHead>
                <TableHead>Notas</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    <div className="flex items-center justify-center">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : data?.cards && data.cards.length > 0 ? (
                data.cards.flatMap((card) =>
                  card.operations.map((op, idx) => (
                    <TableRow key={`${card.card_id}-${idx}`}>
                      <TableCell>
                        {op.date ? format(new Date(op.date), 'dd/MM/yyyy HH:mm', { locale: es }) : 'N/A'}
                      </TableCell>
                      <TableCell className="font-medium">{op.type}</TableCell>
                      <TableCell className={op.amount < 0 ? 'text-destructive' : 'text-green-600'}>
                        {op.amount.toLocaleString('es-AR', {
                          style: 'currency',
                          currency: 'ARS',
                        })}
                      </TableCell>
                      <TableCell>
                        <span
                          className={cn(
                            'px-2 py-1 rounded-full text-xs font-medium',
                            STATUS_COLORS[op.status as keyof typeof STATUS_COLORS] || 'bg-gray-100 text-gray-800'
                          )}
                        >
                          {op.status}
                        </span>
                      </TableCell>
                      <TableCell>{op.shop}</TableCell>
                      <TableCell>{op.product || '-'}</TableCell>
                      <TableCell className="max-w-[200px] truncate" title={op.notes}>
                        {op.notes || '-'}
                      </TableCell>
                    </TableRow>
                  ))
                )
              ) : (
                <TableRow>
                  <TableCell colSpan={7} className="text-center h-24">
                    No se encontraron transacciones
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>

        {data?.cards && data.cards.length > 0 && (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
            {data.cards.map((card) => (
              <div key={card.card_id} className="border rounded-lg p-4">
                <h4 className="font-medium mb-2">Resumen de tarjeta: {card.card_id}</h4>
                <div className="space-y-1">
                  <p className="text-sm">
                    <span className="text-muted-foreground">Compras totales:</span>{' '}
                    {card.total_purchases.toLocaleString('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    })}
                  </p>
                  <p className="text-sm">
                    <span className="text-muted-foreground">Total reembolsado:</span>{' '}
                    {card.total_refunded.toLocaleString('es-AR', {
                      style: 'currency',
                      currency: 'ARS',
                    })}
                  </p>
                  <p className="font-medium">
                    <span className="text-muted-foreground">Saldo neto:</span>{' '}
                    <span className={card.net_amount < 0 ? 'text-destructive' : 'text-green-600'}>
                      {card.net_amount.toLocaleString('es-AR', {
                        style: 'currency',
                        currency: 'ARS',
                      })}
                    </span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
