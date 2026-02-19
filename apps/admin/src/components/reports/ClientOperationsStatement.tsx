import React from 'react';
import { useClientOperationsStatement } from '@/hooks/useClientOperationsStatement';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Loader2, Download, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface ClientOperationsStatementProps {
  clientId: number;
}

export const ClientOperationsStatement: React.FC<ClientOperationsStatementProps> = ({
  clientId,
}) => {
  const {
    data,
    isLoading,
    isError,
    error,
    refetch
  } = useClientOperationsStatement({ clientId });

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'deuda':
        return 'bg-red-100 text-red-800';
      case 'saldo a favor':
        return 'bg-green-100 text-green-800';
      case 'al día':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getOperationTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'pedido':
      case 'entrega':
        return 'bg-red-50 text-red-700 border-red-200';
      case 'pago pedido':
      case 'pago entrega':
        return 'bg-green-50 text-green-700 border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Cargando estado de cuenta...</span>
        </CardContent>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={() => refetch()} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-8">
          <span className="text-gray-500">No hay datos disponibles</span>
        </CardContent>
      </Card>
    );
  }

  const { client, statement, generated_at } = data;

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl">
                Estado de Cuenta - {client.name}
              </CardTitle>
              <p className="text-sm text-gray-600 mt-1">
                {client.phone} • {client.email}
                {client.agent_name && ` • Agente: ${client.agent_name}`}
              </p>
            </div>
            <div className="flex gap-2">
              <Badge className={getStatusColor(statement.summary.status)}>
                {statement.summary.status}
              </Badge>
              <Button variant="outline" size="sm">
                <Download className="h-4 w-4 mr-2" />
                Exportar
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Operaciones</div>
            <div className="text-2xl font-bold">{statement.summary.total_operations}</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Débitos</div>
            <div className="text-2xl font-bold text-red-600">
              ${statement.summary.total_debits.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Total Créditos</div>
            <div className="text-2xl font-bold text-green-600">
              ${statement.summary.total_credits.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-sm text-gray-600">Saldo Final</div>
            <div className={`text-2xl font-bold ${
              statement.summary.final_balance < 0 ? 'text-red-600' : 
              statement.summary.final_balance > 0 ? 'text-green-600' : 'text-blue-600'
            }`}>
              ${statement.summary.final_balance.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Detalle de Operaciones</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Fecha</th>
                  <th className="text-left p-2">Tipo</th>
                  <th className="text-left p-2">Descripción</th>
                  <th className="text-right p-2">Débito</th>
                  <th className="text-right p-2">Crédito</th>
                  <th className="text-right p-2">Saldo</th>
                  <th className="text-left p-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {statement.operations.map((operation) => (
                  <tr key={operation.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      {format(new Date(operation.date), 'dd/MM/yyyy HH:mm', { locale: es })}
                    </td>
                    <td className="p-2">
                      <Badge 
                        variant="outline" 
                        className={getOperationTypeColor(operation.type)}
                      >
                        {operation.type}
                      </Badge>
                    </td>
                    <td className="p-2">{operation.description}</td>
                    <td className="p-2 text-right">
                      {operation.debit > 0 && (
                        <span className="text-red-600">
                          ${operation.debit.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className="p-2 text-right">
                      {operation.credit > 0 && (
                        <span className="text-green-600">
                          ${operation.credit.toFixed(2)}
                        </span>
                      )}
                    </td>
                    <td className={`p-2 text-right font-medium ${
                      operation.balance < 0 ? 'text-red-600' : 
                      operation.balance > 0 ? 'text-green-600' : 'text-blue-600'
                    }`}>
                      ${operation.balance.toFixed(2)}
                    </td>
                    <td className="p-2">
                      <Badge variant="secondary" className="text-xs">
                        {operation.payment_status}
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="text-xs text-gray-500 text-center">
        Generado el {format(new Date(generated_at), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es })}
      </div>
    </div>
  );
};

export default ClientOperationsStatement;
