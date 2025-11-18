import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, ArrowDown, Scale, DollarSign, Calendar, Layers } from 'lucide-react';
import { formatCurrency } from '@/types';

type RangeData = {
    start_date?: string;
    end_date?: string;
    total_weight?: number;
    total_cost?: number;
    total_purchase_cost?: number;
    total_delivery_cost?: number;
    total_revenue?: number;
    total_profit?: number;
    orders_count?: number;
    deliveries_count?: number;
};

type InvoiceData = {
    start_date?: string;
    end_date?: string;
    total_invoices_amount?: number;
    total_tag_weight?: number;
    total_tag_costs?: number;
    invoices_count?: number;
    tags_count?: number;
};

function safeNumber(n: unknown): number {
    if (n === undefined || n === null) return 0;
    if (typeof n === 'number' && !Number.isNaN(n)) return n;
    if (typeof n === 'bigint') return Number(n);
    if (typeof n === 'string') {
        const parsed = Number(n);
        return Number.isFinite(parsed) ? parsed : 0;
    }
    // If it's an object or other type we don't support, return 0
    return 0;
}

export default function ComparisonCards({ expected, invoices }: { expected?: RangeData; invoices?: InvoiceData; loading?: boolean }) {
    const expWeight = safeNumber(expected?.total_weight);
    const expCost = safeNumber(expected?.total_cost);
    const expRevenue = safeNumber(expected?.total_revenue);
    const expOrders = safeNumber(expected?.orders_count);
    const expDeliveries = safeNumber(expected?.deliveries_count);

    const invWeight = safeNumber(invoices?.total_tag_weight);
    const invCost = safeNumber(invoices?.total_tag_costs);
    const invTotal = safeNumber(invoices?.total_invoices_amount);
    const invCount = safeNumber(invoices?.invoices_count);

    const costDiff = expCost - invCost;
    const revenueDiff = invTotal - expRevenue;

    const costDiffPercent = expCost > 0 ? (costDiff / expCost) * 100 : 0;
    const revenueDiffPercent = expRevenue > 0 ? (revenueDiff / expRevenue) * 100 : 0;

    return (
        <div className="flex flex-col gap-4">
            <Card className='gap-2'>
                <CardHeader className='py-0'>
                    <CardTitle className="text-sm flex items-center gap-2"><Scale className="h-4 w-4" />Peso</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Registrado</div>
                            <div className="text-lg font-semibold">{expWeight ? `${expWeight.toFixed(2)} Lb` : '-'}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Facturas</div>
                            <div className="text-lg font-medium">{invWeight ? `${invWeight.toFixed(2)} Lb` : '-'}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Diferencia</div>
                            <div className="text-lg text-orange-400 font-medium">{invWeight ? `${(invWeight - expWeight).toFixed(2)} Lb` : '-'}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='gap-2'>
                <CardHeader>
                    <CardTitle className="text-sm flex items-center gap-2"><DollarSign className="h-4 w-4" />Costo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-row items-center justify-between gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Registrado</div>
                            <div className="text-lg font-semibold">{expCost ? formatCurrency(expCost) : '-'}</div>

                        </div>
                        <div>

                            <div className="mt-1 text-xs text-muted-foreground">Facturas</div>
                            <div className="text-lg font-semibold">{invCost ? formatCurrency(invCost) : '-'}</div>
                        </div>

                        <div className="flex items-center gap-2 md:flex-col md:items-end">
                            <Badge variant={costDiff > 0 ? 'destructive' : 'secondary'} className="flex items-center gap-1">
                                {costDiff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                <span className="text-[14px]">{Math.abs(costDiffPercent).toFixed(1)}%</span>
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='gap-2'>
                <CardHeader className='py-0'>
                    <CardTitle className="text-sm flex items-center gap-2"><Layers className="h-4 w-4" />Ingresos</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Registrado</div>
                            <div className="text-lg font-semibold">{expRevenue ? formatCurrency(expRevenue) : '-'}</div>
                        </div>

                        <div>
                            <div className="mt-1 text-xs text-muted-foreground">Facturas</div>
                            <div className="text-lg font-semibold">{invTotal ? formatCurrency(invTotal) : '-'}</div>
                        </div>

                        <div className="flex items-center gap-2 md:flex-col md:items-end">
                            <Badge variant={revenueDiff > 0 ? 'secondary' : 'destructive'} className="flex items-center gap-1">
                                {revenueDiff >= 0 ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />}
                                <span className="text-[14px]">{Math.abs(revenueDiffPercent).toFixed(1)}%</span>
                            </Badge>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className='gap-2'>
                <CardHeader className='py-0'>
                    <CardTitle className="text-sm flex items-center gap-2"><Calendar className="h-4 w-4" />Conteo</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                        <div>
                            <div className="text-xs text-muted-foreground">Órdenes</div>
                            <div className="text-lg font-semibold">{expOrders || '-'}</div>
                        </div>
                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Entregas</div>
                            <div className="text-lg font-semibold">{expDeliveries || '-'}</div>
                        </div>

                        <div className="text-right">
                            <div className="text-xs text-muted-foreground">Facturas</div>
                            <div className="text-lg font-semibold">{invCount || '-'}</div>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
