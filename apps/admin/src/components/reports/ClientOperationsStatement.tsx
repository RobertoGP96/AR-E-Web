import React from "react";
import { useClientOperationsStatement } from "@/hooks/useClientOperationsStatement";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Download, RefreshCw } from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";

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
      case "entrega":
        return "bg-slate-100 text-slate-700 border-none font-semibold hover:bg-slate-100";
      case "pago pedido":
      case "pago entrega":
        return "bg-blue-100/50 text-blue-600 border-none font-semibold hover:bg-blue-100/50";
      default:
        return "bg-slate-50 text-slate-700 border-none font-semibold";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20 min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
        <span className="ml-3 text-slate-600 font-medium">
          Cargando estado de cuenta...
        </span>
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
          <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
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
                ? "text-green-700"
                : client.balance < 0
                  ? "text-red-700"
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
          <table className="w-full text-sm text-left whitespace-nowrap min-w-[700px]">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50/50">
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[160px]">
                  Fecha
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest w-[140px]">
                  Tipo
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                  Descripción
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[120px]">
                  Débito
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[120px]">
                  Crédito
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[120px]">
                  Saldo
                </th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-center w-[100px]">
                  Estado
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {statement.operations.map((op) => (
                <tr
                  key={op.id}
                  className="hover:bg-slate-50/50 transition-colors"
                >
                  <td className="px-6 py-4 text-slate-600 font-medium text-[13px]">
                    {format(new Date(op.date), "dd/MM/yyyy HH:mm")}
                  </td>
                  <td className="px-6 py-4">
                    <Badge
                      className={`px-2.5 py-0.5 text-[10px] tracking-widest uppercase ${getOperationTypeColor(
                        op.type,
                      )}`}
                    >
                      {op.type}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 text-slate-900 font-semibold text-[13px]">
                    {op.description}
                  </td>
                  <td className="px-6 py-4 text-center text-[13px] font-semibold">
                    {op.debit > 0 ? (
                      <span className="text-blue-400/80">
                        {formatMoney(op.debit)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-[13px] font-semibold">
                    {op.credit > 0 ? (
                      <span className="text-blue-600">
                        {formatMoney(op.credit)}
                      </span>
                    ) : (
                      <span className="text-slate-300">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 text-center text-[13px] font-bold text-blue-700">
                    {formatMoney(Math.abs(op.balance))}
                  </td>
                  <td className="px-6 py-4 text-center">
                    <Badge className="bg-slate-100 text-slate-700 hover:bg-slate-100 border-none px-2.5 py-1 text-[10px] font-semibold shadow-none rounded-md uppercase tracking-wider">
                      {op.payment_status?.toLowerCase() || "pendiente"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
