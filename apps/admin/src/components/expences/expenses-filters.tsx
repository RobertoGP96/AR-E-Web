import { Plus, Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '../ui/button';

import type { UpdateExpenseData, CreateExpenseData} from '../../types/models/expenses';
import { ExpencesForm } from './expenses-form';

interface ExpencesFiltersProps {
  searchTerm?: string;
  onSearchChange?: (value: string) => void;
  onCreateExpense?: (data: CreateExpenseData | UpdateExpenseData) => void;
  isCreatingExpense?: boolean;
  resultCount?: number;
}

export default function ExpencesFilters({
  searchTerm,
  onSearchChange,
  onCreateExpense,
  isCreatingExpense = false,
}: ExpencesFiltersProps) {
  return (
    <div className="flex flex-col sm:flex-row gap-4">
      <div className="flex-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Buscar por ID, fecha o total..."
            value={searchTerm}
            onChange={(e) => onSearchChange?.(e.target.value)}
            className="pl-10 border-gray-200 focus:border-blue-300 focus:ring-blue-200 shadow-sm"
          />
        </div>
      </div>

      <ExpencesForm
        mode="create"
        onSubmit={onCreateExpense}
        loading={isCreatingExpense}
        trigger={
          <Button className="h-10">
            <Plus className="h-4 w-4 mr-2" />
            Agregar
          </Button>
        }
      />
    </div>
  );
}