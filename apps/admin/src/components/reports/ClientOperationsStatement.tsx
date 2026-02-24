import React from "react";
import { useClientOperationsStatement } from "@/hooks/useClientOperationsStatement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import LoadingSpinner from "../utils/LoadingSpinner";

interface ClientOperationsStatementProps {
  clientId: number;
}

export const ClientOperationsStatement: React.FC<
  ClientOperationsStatementProps
> = ({ clientId }) => {
  const { data, isLoading, isError, error, refetch } =
    useClientOperationsStatement({ clientId });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case "deuda":
        return "bg-red-50 text-red-600 border-none font-bold";
      case "saldo a favor":
        return "bg-green-50 text-green-600 border-none font-bold";
      case "al día":
        return "bg-blue-50 text-blue-600 border-none font-bold uppercase";
      default:
        return "bg-slate-50 text-slate-600 border-none font-bold";
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case "pedido":
        return "bg-red-100 text-red-700 border-none font-semibold hover:bg-red-100";
      case "pago entrega":
      case "pago pedido":
        return "bg-green-100 text-green-600 border-none font-semibold hover:bg-green-100";
      case "entrega":
        return "bg-blue-100 text-blue-600 border-none font-semibold hover:bg-blue-100";
      default:
        return "bg-slate-50 text-slate-700 border-none font-semibold";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <LoadingSpinner
          text="Cargando operaciones ..."
          size="md"
        ></LoadingSpinner>
      </div>
    );
  }

  if (isError) {
    const errorMessage = typeof error === "string" ? error : "Ocurrió un error";
    return (
      <div className="flex flex-col items-center justify-center py-20 min-h-[50vh]">
        <div className="text-red-500 mb-4 font-medium">{errorMessage}</div>
        <Button
          onClick={() => refetch()}
          variant="outline"
          className="border-slate-200"
        >
          <RefreshCw className="h-4 w-4 mr-2" />
          Reintentar
        </Button>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <span className="text-slate-500 font-medium">
          No hay datos disponibles
        </span>
      </div>
    );
  }

  const { client, statement, generated_at } = data;

  const formatMoney = (val: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(val);
  };

  return (
    <div className="space-y-6 sm:space-y-5 px-4 sm:px-0 bg-transparent min-h-full py-4 sm:py-0">
      {/* Header Card */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 shadow-sm">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-orange-400 tracking-tight">
            Estado de Cuenta - {client.name}
          </h2>
          <p className="text-sm text-slate-500 mt-1 font-medium">
            {client.phone}
            {client.agent_name && (
              <span className="mx-2 text-slate-300">•</span>
            )}
            {client.agent_name && `Agente: ${client.agent_name}`}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <Badge
            className={`px-3 py-1 text-[11px] tracking-wider ${getStatusColor(
              statement.summary.status,
            )}`}
          >
            {statement.summary.status}
          </Badge>
          <Button
            variant="outline"
            size="sm"
            className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700 ml-auto md:ml-0 font-semibold shadow-sm h-9 rounded-lg"
          >
            <Download className="h-4 w-4 mr-2" />
            Exportar
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {[
          {
            label: "TOTAL OPERACIONES",
            value: statement.summary.total_operations.toString(),
            color: "text-slate-900",
          },
          {
            label: "TOTAL DÉBITOS",
            value: formatMoney(statement.summary.total_debits),
            color: "text-red-500/80",
          },
          {
            label: "TOTAL CRÉDITOS",
            value: formatMoney(statement.summary.total_credits),
            color: "text-green-500/80",
          },
          {
            label: "SALDO FINAL",
            value: formatMoney(Math.abs(client.balance)),
            color:
              client.balance > 0
                ? "text-green-500"
                : client.balance < 0
                  ? "text-red-500"
                  : "text-blue-700",
          },
        ].map((item, i) => (
          <div
            key={i}
            className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm flex flex-col justify-center"
          >
            <h3 className="text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-2">
              {item.label}
            </h3>
            <p
              className={`text-2xl sm:text-3xl font-black ${item.color} tracking-tight leading-none`}
            >
              {item.value}
            </p>
          </div>
        ))}
      </div>

      {/* Operations Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 md:px-6 md:py-5 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-bold text-slate-800 tracking-tight">
            Detalle de Operaciones
          </h3>
        </div>
        <div className="overflow-x-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Fecha</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Descripción</TableHead>
                <TableHead>Débito</TableHead>
                <TableHead>Crédito</TableHead>
                <TableHead>Saldo</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {statement.operations.map((operation) => (
                <TableRow key={operation.id}>
                  <TableCell>
                    <Badge variant="outline"> {operation.date}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={getOperationTypeColor(operation.type)}>
                      {operation.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{operation.description}</TableCell>
                  <TableCell className="text-red-500 font-bold">
                    {operation.debit > 0 ? formatMoney(operation.debit) : "-"}
                  </TableCell>
                  <TableCell className="text-green-500 font-bold">
                    {operation.credit > 0 ? formatMoney(operation.credit) : "-"}
                  </TableCell>
                  <TableCell
                    className={
                      " font-bold " +
                      (operation.balance > 0
                        ? "text-green-500"
                        : "text-red-500")
                    }
                  >
                    {operation.balance}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {statement.operations.length === 0 && (
            <div className="p-8 text-center text-slate-500 font-medium">
              No se encontraron operaciones para este cliente.
            </div>
          )}
        </div>
      </div>

      <div className="pt-2 pb-6 text-[11px] font-medium text-slate-400 text-center tracking-wide">
        Generado el{" "}
        {format(
          new Date(generated_at),
          "dd 'de' MMMM 'de' yyyy 'a las' HH:mm",
          {
            locale: es,
          },
        )}
      </div>
    </div>
  );
};

export default ClientOperationsStatement;
