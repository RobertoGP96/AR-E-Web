"use client";

import { useState, useMemo } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  TrendingDown,
  TrendingUp,
  CheckCircle,
  Users,
  UserCircle,
  Phone,
  DollarSign,
  Receipt,
  Truck,
  Wallet,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { AdvancedFilters, type FilterState } from "./advanced-filters";
import { useQuery } from "@tanstack/react-query";
import { fetchClientBalancesReport } from "@/services/reports/reports";
import type { ClientBalanceEntry } from "@/types";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("es-MX", {
    style: "currency",
    currency: "MXN",
  }).format(value);
}

function StatusBadge({ status }: { status: ClientBalanceEntry["status"] }) {
  const variants = {
    DEUDA:
      "bg-red-50 text-red-700 ring-red-600/80 dark:bg-red-400/10 dark:text-red-400 ring-red-400/20",
    "SALDO A FAVOR":
      "bg-green-50 text-green-700 ring-green-600/20 dark:bg-green-400/10 dark:text-green-400 ring-green-400/20",
    "AL DÍA":
      "bg-blue-50 text-blue-700 ring-blue-600/20 dark:bg-blue-400/10 dark:text-blue-400 ring-blue-400/20",
  };

  return (
    <Badge className={variants[status]} variant="default">
      {status}
    </Badge>
  );
}

interface CardSummaryProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  subtitle?: string;
  textColor?: string;
}

function CardSummary({
  label,
  value,
  icon,
  subtitle,
  textColor = "text-slate-800",
}: CardSummaryProps) {
  return (
    <Card className=" relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:border-orange-200 border group cursor-pointer bg-white">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs md:text-sm font-bold text-muted-foreground uppercase tracking-wide">
          {label}
        </CardTitle>
        <div className="text-orange-500 group-hover:text-orange-600 transition-colors duration-300 p-2.5 rounded-lg bg-orange-50  flex-shrink-0 ">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div
          className="text-2xl md:text-3xl font-bold tracking-tight"
          style={{
            color: textColor === "text-slate-800" ? "#1e293b" : undefined,
          }}
        >
          {value}
        </div>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>
        )}
      </CardContent>
    </Card>
  );
}

function SummaryCards({ data }: { data: ClientBalanceEntry[] }) {
  const summary = useMemo(() => {
    const totalClients = data.length;
    const clientsWithDebt = data.filter((c) => c.status === "DEUDA").length;
    const clientsWithSurplus = data.filter(
      (c) => c.status === "SALDO A FAVOR",
    ).length;
    const clientsUpToDate = data.filter((c) => c.status === "AL DÍA").length;
    const totalPendingToPay = data.reduce(
      (sum, c) => sum + c.pending_to_pay,
      0,
    );
    const totalSurplus = data.reduce((sum, c) => sum + c.surplus_balance, 0);

    return {
      totalClients,
      clientsWithDebt,
      clientsWithSurplus,
      clientsUpToDate,
      totalPendingToPay,
      totalSurplus,
    };
  }, [data]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      <CardSummary
        label="Total Clientes"
        value={summary.totalClients}
        icon={<Users className="h-5 w-5" />}
      />

      <CardSummary
        label="Con Deuda"
        value={summary.clientsWithDebt}
        icon={<TrendingDown className="h-5 w-5" />}
        subtitle={`${formatCurrency(summary.totalPendingToPay)} pendiente`}
        textColor="text-red-600 dark:text-red-400"
      />

      <CardSummary
        label="Saldo a Favor"
        value={summary.clientsWithSurplus}
        icon={<TrendingUp className="h-5 w-5" />}
        subtitle={`${formatCurrency(summary.totalSurplus)} total`}
        textColor="text-emerald-600 dark:text-emerald-400"
      />

      <CardSummary
        label="Al Día"
        value={summary.clientsUpToDate}
        icon={<CheckCircle className="h-5 w-5 " />}
        subtitle={`${((summary.clientsUpToDate / summary.totalClients) * 100 || 0).toFixed(1)}% del total`}
        textColor="text-sky-600 dark:text-sky-400"
      />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="relative overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="h-4 w-24 bg-muted animate-pulse rounded" />
            <div className="h-4 w-4 bg-muted animate-pulse rounded" />
          </CardHeader>
          <CardContent className="pt-0 space-y-2">
            <div className="h-8 w-16 bg-muted animate-pulse rounded" />
            <div className="h-3 w-32 bg-muted animate-pulse rounded" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="space-y-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-12 bg-muted animate-pulse rounded-md" />
      ))}
    </div>
  );
}

const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

export function ClientBalancesTable() {
  const { data: clientBalances, isLoading } = useQuery<
    ClientBalanceEntry[],
    Error
  >({
    queryKey: ["clientBalances"],
    queryFn: fetchClientBalancesReport,
  });

  const data = useMemo(() => clientBalances ?? [], [clientBalances]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Calcular min/max de balance para el slider
  const { balanceMin, balanceMax } = useMemo(() => {
    if (data.length === 0) return { balanceMin: -10000, balanceMax: 10000 };
    const balances = data.map((c) => c.total_balance);
    return {
      balanceMin: Math.floor(Math.min(...balances) / 100) * 100,
      balanceMax: Math.ceil(Math.max(...balances) / 100) * 100,
    };
  }, [data]);

  const [filters, setFilters] = useState<FilterState>({
    searchTerm: "",
    statusFilter: "all",
    agentFilter: "all",
    balanceRange: [balanceMin, balanceMax],
  });

  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  }>({ key: "balance", direction: "asc" });

  // Obtener lista única de agentes
  const agents = useMemo(() => {
    const uniqueAgents = [...new Set(data.map((client) => client.agent_name))];
    return uniqueAgents.sort();
  }, [data]);

  const filteredData = useMemo(() => {
    return data
      .filter((client) => {
        const matchesSearch =
          (client.name || "")
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          (client.email || "")
            .toLowerCase()
            .includes(filters.searchTerm.toLowerCase()) ||
          (client.phone || "").includes(filters.searchTerm);

        const matchesStatus =
          filters.statusFilter === "all" ||
          client.status === filters.statusFilter;

        const matchesAgent =
          filters.agentFilter === "all" ||
          client.agent_name === filters.agentFilter;

        const matchesBalance =
          client.total_balance >= filters.balanceRange[0] &&
          client.total_balance <= filters.balanceRange[1];

        return matchesSearch && matchesStatus && matchesAgent && matchesBalance;
      })
      .sort((a, b) => {
        const { key, direction } = sortConfig;
        const modifier = direction === "asc" ? 1 : -1;

        switch (key) {
          case "name":
            return (a.name || "").localeCompare(b.name || "") * modifier;
          case "agent_name":
            return (
              (a.agent_name || "").localeCompare(b.agent_name || "") * modifier
            );
          case "total_order_cost":
            return (a.total_order_cost - b.total_order_cost) * modifier;
          case "total_deliver_cost":
            return (a.total_deliver_cost - b.total_deliver_cost) * modifier;
          case "total_received": {
            const receivedA = a.total_order_received + a.total_deliver_received;
            const receivedB = b.total_order_received + b.total_deliver_received;
            return (receivedA - receivedB) * modifier;
          }
          case "status":
            return (a.status || "").localeCompare(b.status || "") * modifier;
          case "balance":
            return (a.total_balance - b.total_balance) * modifier;
          default:
            return 0;
        }
      });
  }, [data, filters, sortConfig]);

  // Calcular paginacion
  const totalPages = Math.ceil(filteredData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedData = filteredData.slice(startIndex, endIndex);

  const handleFiltersChange = (newFilters: FilterState) => {
    setFilters(newFilters);
    setCurrentPage(1);
  };

  const handlePageSizeChange = (value: string) => {
    setPageSize(Number(value));
    setCurrentPage(1);
  };

  const handleSort = (key: string) => {
    setSortConfig((current) => ({
      key,
      direction:
        current.key === key && current.direction === "asc" ? "desc" : "asc",
    }));
  };

  return (
    <div className="space-y-6">
      {isLoading ? <CardsSkeleton /> : <SummaryCards data={data} />}

      <Card>
        <CardHeader>
          <CardTitle>Balance de Clientes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros avanzados */}
          <AdvancedFilters
            filters={filters}
            onFiltersChange={handleFiltersChange}
            agents={agents}
            balanceMin={balanceMin}
            balanceMax={balanceMax}
          />

          {/* Tabla */}
          {isLoading ? (
            <TableSkeleton />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead
                      className="cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4" />
                        Cliente
                        {sortConfig.key === "name" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="hidden sm:table-cell cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("agent_name")}
                    >
                      <div className="flex items-center gap-2">
                        <UserCircle className="h-4 w-4" />
                        Agente
                        {sortConfig.key === "agent_name" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("total_order_cost")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Receipt className="h-4 w-4" />
                        <span className="hidden xl:inline">Costo Pedidos</span>
                        <span className="xl:hidden">Pedidos</span>
                        {sortConfig.key === "total_order_cost" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right hidden lg:table-cell cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("total_deliver_cost")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Truck className="h-4 w-4" />
                        Envio
                        {sortConfig.key === "total_deliver_cost" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                    <TableHead
                      className="text-right hidden lg:table-cell cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("total_received")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <DollarSign className="h-4 w-4" />
                        Total Recibido
                        {sortConfig.key === "total_received" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>

                    <TableHead
                      className="text-right cursor-pointer hover:bg-muted/50"
                      onClick={() => handleSort("balance")}
                    >
                      <div className="flex items-center justify-end gap-2">
                        <Wallet className="h-4 w-4" />
                        Balance
                        {sortConfig.key === "balance" &&
                          (sortConfig.direction === "asc" ? (
                            <ChevronUp className="h-3 w-3" />
                          ) : (
                            <ChevronDown className="h-3 w-3" />
                          ))}
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.length === 0 ? (
                    <TableRow>
                      <TableCell
                        colSpan={7}
                        className="text-center py-8 text-muted-foreground"
                      >
                        <div className="flex flex-col items-center gap-2">
                          <Users className="h-8 w-8 opacity-50" />
                          No se encontraron clientes
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedData.map((client) => (
                      <TableRow key={client.id}>
                        <TableCell>
                          <div className="font-medium">{client.name}</div>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </div>
                          <div className="text-xs text-muted-foreground sm:hidden mt-1">
                            <span className="inline-flex items-center gap-1">
                              <UserCircle className="h-3 w-3" />
                              {client.agent_name}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <div className="flex items-center gap-2">
                            <UserCircle className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{client.agent_name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(client.total_order_cost)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          {formatCurrency(client.total_deliver_cost)}
                        </TableCell>
                        <TableCell className="text-right hidden lg:table-cell">
                          {formatCurrency(
                            client.total_order_received +
                              client.total_deliver_received,
                          )}
                        </TableCell>

                        <TableCell className="text-right font-medium">
                          <span
                            className={
                              client.total_balance < 0
                                ? "text-red-600 dark:text-red-400"
                                : client.total_balance > 0
                                  ? "text-emerald-600 dark:text-emerald-400"
                                  : ""
                            }
                          >
                            {formatCurrency(client.total_balance)}
                          </span>
                        </TableCell>
                        <TableCell className="text-center px-2">
                          <StatusBadge status={client.status} />
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Paginacion */}
          {!isLoading && filteredData.length > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span>Mostrar</span>
                <Select
                  value={pageSize.toString()}
                  onValueChange={handlePageSizeChange}
                >
                  <SelectTrigger className="w-[70px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZE_OPTIONS.map((size) => (
                      <SelectItem key={size} value={size.toString()}>
                        {size}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <span>por pagina</span>
              </div>

              <div className="text-sm text-muted-foreground">
                Mostrando {startIndex + 1}-
                {Math.min(endIndex, filteredData.length)} de{" "}
                {filteredData.length} clientes
              </div>

              <div className="flex items-center gap-1">
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage(1)}
                  disabled={currentPage === 1}
                >
                  <ChevronsLeft className="h-4 w-4" />
                  <span className="sr-only">Primera pagina</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Pagina anterior</span>
                </Button>
                <div className="flex items-center gap-1 px-2">
                  <span className="text-sm font-medium">{currentPage}</span>
                  <span className="text-sm text-muted-foreground">de</span>
                  <span className="text-sm font-medium">{totalPages}</span>
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Pagina siguiente</span>
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  className="h-8 w-8 bg-transparent"
                  onClick={() => setCurrentPage(totalPages)}
                  disabled={currentPage === totalPages}
                >
                  <ChevronsRight className="h-4 w-4" />
                  <span className="sr-only">Ultima pagina</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
