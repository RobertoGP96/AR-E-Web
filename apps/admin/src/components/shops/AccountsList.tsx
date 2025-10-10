import { User, Edit, Trash2, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import BuyingAccountFormPopover from './form/BuyingAccountFormPopover';
import type { Shop } from '@/types/models/shop';
import type { BuyingAccount } from '@/types/models/buying-account';

interface AccountsListProps {
  shop: Shop | null;
  onAccountUpdate: (account: BuyingAccount) => void;
  onAccountDelete: (account: BuyingAccount) => void;
}

export default function AccountsList({
  shop,
  onAccountUpdate,
  onAccountDelete
}: AccountsListProps) {
  // Estado cuando no hay tienda seleccionada
  if (!shop) {
    return (
      <article className="overflow-x-auto rounded-lg border border-muted bg-background shadow-md">
        <div className="flex flex-col items-center justify-center p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
            <Store className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-700 mb-2">
            Selecciona una tienda
          </h3>
          <p className="text-sm text-gray-500 max-w-sm">
            Haz clic en una tienda de la lista para ver sus cuentas de compra asociadas
          </p>
        </div>
      </article>
    );
  }

  const accounts = shop.buying_accounts || [];

  return (
    <article className="flex flex-col h-full overflow-hidden rounded-lg border border-muted bg-background shadow-md">
      <Table>
        <TableHeader className="bg-gradient-to-r from-gray-50 to-gray-100 sticky top-0 z-10">
          <TableRow>
            <TableHead className="font-semibold text-gray-700">
              Cuentas de {shop.name}
            </TableHead>
            <TableHead className="font-semibold text-gray-700 text-right">
              Acciones
            </TableHead>
          </TableRow>
        </TableHeader>
      </Table>
      <div className="flex-1 overflow-y-auto">
        <Table>
          <TableBody>
            {accounts.length === 0 ? (
            <TableRow>
              <TableCell colSpan={2} className="text-center py-8">
                <div className="flex flex-col items-center gap-3">
                  <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-6 h-6 text-gray-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      No hay cuentas registradas
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      Agrega una cuenta de compra para esta tienda
                    </p>
                  </div>
                </div>
              </TableCell>
            </TableRow>
          ) : (
            accounts.map((account) => (
              <TableRow
                key={account.id}
                className="hover:bg-gray-50 transition-colors duration-150"
              >
                <TableCell className="py-4 px-6">
                  <div className="flex flex-row justify-start items-center gap-3">
                    <Avatar className="h-10 w-10 bg-gradient-to-br from-blue-100 to-purple-100">
                      <AvatarFallback className="bg-transparent text-blue-700">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex flex-col">
                      <span className="font-semibold text-gray-800 text-base">
                        {account.account_name}
                      </span>
                      <span className="text-xs text-gray-500">
                        Creada: {new Date(account.created_at).toLocaleDateString('es-ES')}
                      </span>
                    </div>
                  </div>
                </TableCell>

                <TableCell className="p-4">
                  <div className="flex justify-end gap-2">
                    {/* Botón Editar Cuenta */}
                    <BuyingAccountFormPopover
                      account={account}
                      shopId={shop.id}
                      shopName={shop.name}
                      mode="edit"
                      onSuccess={onAccountUpdate}
                      trigger={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-9 w-9 flex items-center justify-center border border-blue-200 bg-white shadow-sm hover:bg-blue-50 hover:text-blue-600 transition-all duration-200"
                          aria-label="Editar Cuenta"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      }
                    />

                    {/* Botón Eliminar Cuenta */}
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 w-9 flex items-center justify-center border border-red-200 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      aria-label="Eliminar Cuenta"
                      onClick={() => onAccountDelete(account)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      </div>
    </article>
  );
}
