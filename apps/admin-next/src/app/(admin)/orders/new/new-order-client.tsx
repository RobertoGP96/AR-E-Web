'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, PackagePlus, ShoppingCart, UserRound } from 'lucide-react';
import { toast } from '@/lib/toast';
import { formatCurrency } from '@/lib/format';
import { ChecklistSubmitBar } from '@/components/checklist-submit-bar';
import { Field, PageHeader, SearchSelect, Select, TextArea } from '@/components/ui';
import { createOrderWithProductsAction } from '../actions';
import {
  ProductDraftList,
  draftIsComplete,
  draftsTotal,
  newDraft,
  toDraftInput,
  type ProductDraft,
} from '../product-draft-list';
import type { ClientOption, CurrentUser, SelectOption } from '../schema';

interface NewOrderClientProps {
  clientOptions: ClientOption[];
  managerOptions: SelectOption[];
  /** Admin general: gestor por defecto (ADR-0007). */
  defaultManagerId: string | null;
  shopOptions: SelectOption[];
  categoryOptions: SelectOption[];
  currentUser: CurrentUser;
}

export function NewOrderClient({
  clientOptions,
  managerOptions,
  defaultManagerId,
  shopOptions,
  categoryOptions,
  currentUser,
}: NewOrderClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const isAgent = currentUser.role === 'agent';

  // ADR-0007: agente a su nombre; si no, el admin general por defecto.
  const [agentId, setAgentId] = useState<string>(
    isAgent ? currentUser.id : (defaultManagerId ?? '')
  );
  const [clientId, setClientId] = useState('');
  const [observations, setObservations] = useState('');
  const [drafts, setDrafts] = useState<ProductDraft[]>(() => [newDraft()]);

  // El gestor no filtra los clientes (ADR-0007); para un agente el
  // servidor ya carga solo los suyos.
  const managerNameById = new Map(managerOptions.map((m) => [m.id, m.label]));
  const agentLabel = managerNameById.get(currentUser.id) ?? 'Tú';
  const clientLabel = clientOptions.find((c) => c.id === clientId)?.label ?? '';

  function handleAgentChange(next: string) {
    setAgentId(next);
  }

  const complete = drafts.filter(draftIsComplete);
  const total = draftsTotal(drafts);
  const units = drafts.reduce((s, d) => s + d.amountRequested, 0);
  const ready = !!clientId && drafts.length > 0 && complete.length === drafts.length;

  function submit() {
    if (!clientId) {
      toast.error('Falta el cliente', { description: 'Elige un cliente para la orden.' });
      return;
    }
    if (complete.length !== drafts.length) {
      toast.error('Productos incompletos', {
        description: 'Cada producto necesita nombre, tienda, categoría y cantidad.',
      });
      return;
    }
    startTransition(async () => {
      const result = await createOrderWithProductsAction({
        clientId,
        salesManagerId: isAgent ? currentUser.id : agentId,
        observations,
        products: drafts.map(toDraftInput),
      });
      if (result.ok && result.id) {
        toast.success(`Orden #${result.id} creada`, {
          description: `${clientLabel} · ${drafts.length} producto${drafts.length === 1 ? '' : 's'} · ${formatCurrency(total)}.`,
        });
        router.push(`/orders/${result.id}`);
      } else if (!result.ok) {
        toast.error('No se pudo crear la orden', { description: result.error });
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a órdenes
        </Link>
      </div>

      <PageHeader
        icon={ShoppingCart}
        title="Nueva orden"
        subtitle="Elige el cliente y añade sus productos en la misma pantalla; el total se calcula al momento"
      />

      {/* -------- 1. Cliente -------- */}
      <section className="surface-card space-y-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <UserRound className="h-4 w-4 text-accent" aria-hidden />
          1 · Cliente
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field
            label="Gestor"
            required
            hint={
              isAgent
                ? 'Las órdenes que creas quedan a tu nombre.'
                : 'Cualquier miembro del personal; por defecto, el admin general.'
            }
          >
            {isAgent ? (
              <Select value={currentUser.id} disabled aria-label="Gestor">
                <option value={currentUser.id}>{agentLabel}</option>
              </Select>
            ) : (
              <Select value={agentId} onChange={(e) => handleAgentChange(e.target.value)}>
                {agentId ? null : <option value="">— Selecciona un gestor —</option>}
                {managerOptions.map((o) => (
                  <option key={o.id} value={o.id}>
                    {o.label}
                  </option>
                ))}
              </Select>
            )}
          </Field>
          <Field label="Cliente" required>
            <SearchSelect
              value={clientId}
              onChange={(e) => setClientId(e.target.value)}
              placeholder="— Selecciona un cliente —"
              searchPlaceholder="Buscar cliente por nombre o teléfono…"
              emptyMessage={clientOptions.length === 0 ? 'No hay clientes' : 'Sin resultados'}
              options={clientOptions.map((c) => ({
                value: c.id,
                label: c.label,
                description: [
                  c.phoneNumber,
                  c.agentId
                    ? `Agente: ${managerNameById.get(c.agentId) ?? '—'}`
                    : 'Sin agente',
                ].join(' · '),
              }))}
            />
          </Field>
        </div>
        <Field label="Observaciones (opcional)">
          <TextArea
            rows={2}
            maxLength={2000}
            value={observations}
            onChange={(e) => setObservations(e.target.value)}
          />
        </Field>
      </section>

      {/* -------- 2. Productos -------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackagePlus className="h-4 w-4 text-accent" aria-hidden />
          2 · Productos
          <span className="text-xs font-normal text-muted">
            ({drafts.length} · {formatCurrency(total)})
          </span>
        </h2>
        <ProductDraftList
          drafts={drafts}
          onChange={setDrafts}
          shopOptions={shopOptions}
          categoryOptions={categoryOptions}
        />
      </section>

      <ChecklistSubmitBar
        title="Orden"
        summary={`${clientLabel || 'Sin cliente'} · ${drafts.length} producto${drafts.length === 1 ? '' : 's'} · ${units} unidad${units === 1 ? '' : 'es'} · ${formatCurrency(total)}`}
        hints={
          <span>
            Los costos se recalculan y redondean en el servidor. Después podrás
            comprar los productos pendientes desde el detalle de la orden.
          </span>
        }
        label="Crear orden"
        icon={ShoppingCart}
        isPending={isPending}
        disabled={!ready}
        onSubmit={submit}
      />
    </div>
  );
}
