import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { CardTransactions } from './card-transactions';

type CardTransactionsDialogProps = {
  triggerText?: string;
  triggerVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  triggerClassName?: string;
  cardId?: string;
};

export function CardTransactionsDialog({
  triggerText = 'Ver Transacciones',
  triggerVariant = 'default',
  triggerClassName,
  cardId,
}: CardTransactionsDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant={triggerVariant} className={triggerClassName}>
          {triggerText}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-6xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Historial de Transacciones</DialogTitle>
          <DialogDescription>
            Visualiza el historial de transacciones de las tarjetas
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex-1 overflow-hidden">
          <CardTransactions initialCardId={cardId} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
