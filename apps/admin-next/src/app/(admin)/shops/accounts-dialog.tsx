'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Trash2, KeyRound } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Tooltip } from '@heroui/react';
import {
  addBuyingAccountAction,
  renameBuyingAccountAction,
  deleteBuyingAccountAction,
} from './actions';
import { AppModal, TextInput } from '@/components/ui';
import type { ShopRow } from './schema';

interface AccountsDialogProps {
  shop: ShopRow | null;
  onClose: () => void;
}

export function AccountsDialog({ shop, onClose }: AccountsDialogProps) {
  return (
    <AppModal
      isOpen={shop !== null}
      onClose={onClose}
      title="Cuentas de compra"
      description={shop ? `Cuentas asociadas a ${shop.name}` : undefined}
      icon={<KeyRound className="h-5 w-5" aria-hidden />}
      size="md"
    >
      {shop ? <AccountsBody key={shop.id} shop={shop} /> : null}
    </AppModal>
  );
}

function AccountsBody({ shop }: { shop: ShopRow }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [newName, setNewName] = useState('');
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const result = await addBuyingAccountAction(shop.id, name);
      if (result.ok) {
        toast.success('Cuenta añadida', {
          description: `«${name}» se añadió a las cuentas de ${shop.name}.`,
        });
        setNewName('');
        router.refresh();
      } else {
        toast.error('No se pudo añadir la cuenta', {
          description: result.error,
        });
      }
    });
  }

  function handleRename(accountId: string, original: string) {
    const draft = drafts[accountId]?.trim();
    if (!draft || draft === original) return;
    startTransition(async () => {
      const result = await renameBuyingAccountAction(accountId, draft);
      if (result.ok) {
        toast.success('Cuenta renombrada', {
          description: `«${original}» ahora se llama «${draft}».`,
        });
        router.refresh();
      } else {
        toast.error('No se pudo renombrar la cuenta', {
          description: result.error,
        });
      }
    });
  }

  function handleDelete(accountId: string) {
    startTransition(async () => {
      const result = await deleteBuyingAccountAction(accountId);
      if (result.ok) {
        toast.success('Cuenta eliminada', {
          description: `La cuenta se quitó de ${shop.name}.`,
        });
        router.refresh();
      } else {
        toast.error('No se pudo eliminar la cuenta', {
          description: result.error,
        });
      }
    });
  }

  return (
    <div className="space-y-4">
      <ul className="stagger-children max-h-72 space-y-2 overflow-y-auto pr-0.5">
        {shop.accounts.length === 0 ? (
          <li className="rounded-xl border border-dashed border-border px-3 py-8 text-center text-sm text-muted">
            Esta tienda no tiene cuentas de compra.
          </li>
        ) : (
          shop.accounts.map((account) => (
            <li
              key={account.id}
              className="flex items-center gap-2 rounded-xl border border-border bg-surface p-2 transition-colors hover:bg-surface-hover"
            >
              <TextInput
                type="text"
                maxLength={100}
                defaultValue={account.accountName}
                aria-label={`Renombrar ${account.accountName}`}
                onChange={(e) =>
                  setDrafts((d) => ({
                    ...d,
                    [account.id]: e.target.value,
                  }))
                }
                onBlur={() => handleRename(account.id, account.accountName)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') e.currentTarget.blur();
                }}
                className="min-w-0 flex-1"
              />
              <span className="shrink-0 text-xs tabular-nums text-muted">
                {account.buysCount} compra{account.buysCount === 1 ? '' : 's'}
              </span>
              <Tooltip delay={500}>
                <Button
                  variant="danger-soft"
                  size="sm"
                  isIconOnly
                  isDisabled={isPending || account.buysCount > 0}
                  aria-label={`Eliminar ${account.accountName}`}
                  onPress={() => handleDelete(account.id)}
                >
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
                <Tooltip.Content>
                  {account.buysCount > 0
                    ? 'No se puede eliminar: tiene compras'
                    : 'Eliminar cuenta'}
                </Tooltip.Content>
              </Tooltip>
            </li>
          ))
        )}
      </ul>

      <div className="flex gap-2 border-t border-separator pt-4">
        <TextInput
          type="text"
          maxLength={100}
          value={newName}
          placeholder="Nueva cuenta…"
          aria-label="Nombre de la nueva cuenta"
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') handleAdd();
          }}
          className="min-w-0 flex-1"
        />
        <Button
          variant="primary"
          onPress={handleAdd}
          isDisabled={isPending || !newName.trim()}
          className="shrink-0"
        >
          <Plus className="h-4 w-4" aria-hidden />
          Añadir
        </Button>
      </div>
    </div>
  );
}
