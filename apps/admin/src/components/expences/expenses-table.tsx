import { Edit, Trash2, MoreHorizontal, Eye, Calendar, DollarSign, CircleAlert,  ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
// Popover not required here (but kept for parity if tags are added later)
import { Badge } from '@/components/ui/badge';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
// No local AlertDialog used in the table; parent handles deletion confirmation.
import type { Expense } from '@/types/models/expenses';
import { formatCurrency, formatDate, formatDateTime } from '@/types';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
// Deleting is handled by parent (Expenses page). The table will only notify via callback.
// No local state required here
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext } from '@/components/ui/pagination';
import LoadingSpinner from '../utils/LoadingSpinner';

interface ExpensesTableProps {
	expenses?: Expense[];
	onEditExpense?: (expense: Expense) => void;
	onDeleteExpense?: (expense: Expense) => void; // notify parent to open delete dialog
	onExpenseClick?: (expense: Expense) => void;
	isLoading?: boolean;
	error?: string | null;
	pagination?: {
		current?: number;
		pageSize?: number;
		total?: number;
		onChange?: (page: number, pageSize: number) => void;
	};
}

export default function ExpensesTable({
	expenses = [],
	onEditExpense,
	onDeleteExpense,
	onExpenseClick,
	isLoading = false,
	error = null,
	pagination,
}: ExpensesTableProps) {

	// no local deletion mutation; parent controls it via onDeleteExpense

	if (isLoading) {
		return (
			<div className="flex items-center justify-center h-64">
				<LoadingSpinner size="lg" />
			</div>
		);
	}

	if (error) {
		return (
			<div className="flex items-center justify-center h-64">
                <CircleAlert className="h-12 w-12 text-gray-400 mb-4" />
				<div className="text-center">
					<p className="text-red-600">Error al cargar gastos: {error}</p>
				</div>
			</div>
		);
	}

	if (expenses.length === 0) {
		return (
			<div className="flex flex-col items-center justify-center h-64 rounded-lg border border-muted bg-background shadow">
				<ReceiptText className="h-12 w-12 text-gray-400 mb-4" />
				<div className="text-center">
					<span className="text-gray-600">No hay gastos registrados</span>
				</div>
			</div>
		);
	}

	return (
		<>
			<div className="rounded-lg border border-muted bg-background shadow">
				<Table>
					<TableHeader>
						<TableRow>
							<TableHead>ID</TableHead>
							<TableHead>Fecha</TableHead>
							<TableHead>Monto</TableHead>
							<TableHead>Categoría</TableHead>
							<TableHead>Descripción</TableHead>
							<TableHead>Creado</TableHead>
							<TableHead className="w-[70px]">Acciones</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{expenses.map((expense) => (
							<TableRow
								key={expense.id}
								className="cursor-pointer hover:bg-gray-50"
								onClick={() => onExpenseClick?.(expense)}
							>
								<TableCell className="font-medium">#{expense.id}</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<Calendar className="h-4 w-4 text-gray-400" />
										{formatDate(expense.date)}
									</div>
								</TableCell>
								<TableCell>
									<div className="flex items-center gap-2">
										<DollarSign className="h-4 w-4 text-green-500" />
										<span className="font-semibold text-green-600">{formatCurrency(expense.amount)}</span>
									</div>
								</TableCell>
								<TableCell>
									<Badge variant="secondary" className="py-1">{expense.category}</Badge>
								</TableCell>
								<TableCell>
									<div className="text-sm text-gray-700">{expense.description ?? '—'}</div>
								</TableCell>
								<TableCell className="text-sm text-gray-600">{formatDateTime(expense.created_at)}</TableCell>
								<TableCell>
									<DropdownMenu>
										<DropdownMenuTrigger asChild>
											<Button variant="ghost" className="h-8 w-8 p-0">
												<MoreHorizontal className="h-4 w-4" />
											</Button>
										</DropdownMenuTrigger>
										<DropdownMenuContent align="end">
											<DropdownMenuItem onClick={() => onExpenseClick?.(expense)}>
												<Eye className="mr-2 h-4 w-4" />
												Ver detalles
											</DropdownMenuItem>
											<DropdownMenuItem onClick={() => onEditExpense?.(expense)}>
												<Edit className="mr-2 h-4 w-4" />
												Editar
											</DropdownMenuItem>
											<DropdownMenuSeparator />
											<DropdownMenuItem
												onClick={(e) => {
													e.stopPropagation();
													onDeleteExpense?.(expense); // notify parent to open delete dialog
												}}
												className="text-red-600"
											>
												<Trash2 className="mr-2 h-4 w-4" />
												Eliminar
											</DropdownMenuItem>
										</DropdownMenuContent>
									</DropdownMenu>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</div>

			{/* Pagination (server-side) */}
			{pagination && pagination.total && pagination.pageSize && pagination.total > pagination.pageSize && (
				<div className="mt-4">
					<Pagination>
						<PaginationContent>
							<PaginationItem>
								<PaginationPrevious
									onClick={() => pagination.onChange?.(Math.max((pagination.current || 1) - 1, 1), pagination.pageSize || 10)}
									disabled={(pagination.current || 1) === 1}
								/>
							</PaginationItem>

							{(() => {
								const current = pagination.current || 1;
								const totalPages = Math.ceil((pagination.total || 0) / (pagination.pageSize || 10));
								const pages: (number | 'ellipsis')[] = [];
								if (totalPages <= 7) {
									for (let i = 1; i <= totalPages; i++) pages.push(i);
								} else {
									if (current <= 3) {
										for (let i = 1; i <= 4; i++) pages.push(i);
										pages.push('ellipsis');
										pages.push(totalPages);
									} else if (current >= totalPages - 2) {
										pages.push(1);
										pages.push('ellipsis');
										for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
									} else {
										pages.push(1);
										pages.push('ellipsis');
										for (let i = current - 1; i <= current + 1; i++) pages.push(i);
										pages.push('ellipsis');
										pages.push(totalPages);
									}
								}
								return pages.map((page, idx) => (
									page === 'ellipsis' ? (
										<PaginationItem key={`ellipsis-${idx}`}>
											<PaginationEllipsis />
										</PaginationItem>
									) : (
										<PaginationItem key={`page-${page}`}>
											<PaginationLink
												onClick={() => pagination.onChange?.(Number(page), pagination.pageSize || 10)}
												isActive={page === (pagination.current || 1)}
												className="cursor-pointer"
											>
												{page}
											</PaginationLink>
										</PaginationItem>
									)
								));
							})()}

							<PaginationItem>
								<PaginationNext
									onClick={() => pagination.onChange?.(Math.min((pagination.current || 1) + 1, Math.ceil((pagination.total || 0) / (pagination.pageSize || 10))), pagination.pageSize || 10)}
									disabled={(pagination.current || 1) === Math.ceil((pagination.total || 0) / (pagination.pageSize || 10))}
								/>
							</PaginationItem>
						</PaginationContent>
					</Pagination>
				</div>
			)}
		</>
	);
}

