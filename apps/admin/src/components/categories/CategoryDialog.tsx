import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import CategoryForm from './CategoryForm';
import { useState } from 'react';
import type { Category } from '@/types/models/category';

interface CategoryDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  initialCategory?: Category | null;
  onSave?: (data: { name: string; shipping_cost_per_pound: number; id?: number }) => Promise<void> | void;
}

export default function CategoryDialog({ open, onOpenChange, initialCategory, onSave }: CategoryDialogProps) {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (data: { name: string; shipping_cost_per_pound: number }) => {
    setLoading(true);
    try {
      if (onSave) {
        await onSave({ ...data, id: initialCategory?.id });
      }
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[540px]">
        <DialogHeader>
          <DialogTitle>{initialCategory ? 'Editar categoría' : 'Nueva categoría'}</DialogTitle>
          <DialogDescription>
            {initialCategory ? 'Modifica los datos de la categoría' : 'Completa los datos para crear una nueva categoría'}
          </DialogDescription>
        </DialogHeader>

        <CategoryForm initialValues={initialCategory ?? undefined} loading={loading} onSubmit={handleSubmit} />

        <DialogFooter />
      </DialogContent>
    </Dialog>
  );
}
