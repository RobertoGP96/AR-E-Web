'use client';

import { useActionState, useEffect, useRef, useState } from 'react';
import { ShoppingCart } from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button } from '@heroui/react';
import {
  createOrderAction,
  updateOrderAction,
  type ActionResult,
} from './actions';
import {
  AppModal,
  Field,
  Select,
  SearchSelect,
  TextArea,
  SubmitButton,
} from '@/components/ui';
import {
  ORDER_STATUSES,
  type ClientOption,
  type CurrentUser,
  type OrderRow,
  type SelectOption,
} from './schema';

interface OrderDialogProps {
  open: boolean;
  mode: 'create' | 'edit';
  order?: OrderRow;
  clientOptions: ClientOption[];
  managerOptions: SelectOption[];
  /** Admin general: gestor por defecto (ADR-0007). */
  defaultManagerId: string | null;
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: (newId?: string) => void;
}

export function OrderDialog({
  open,
  mode,
  order,
  clientOptions,
  managerOptions,
  defaultManagerId,
  currentUser,
  onClose,
  onSuccess,
}: OrderDialogProps) {
  const action = mode === 'create' ? createOrderAction : updateOrderAction;
  const [state, formAction, isPending] = useActionState<
    ActionResult | undefined,
    FormData
  >(action, undefined);
  const lastHandledRef = useRef<ActionResult | undefined>(undefined);

  const isAgent = currentUser.role === 'agent';

  // ADR-0007: el gestor puede ser cualquier miembro del personal. Si
  // quien opera es un agente queda fijado a sí mismo; si no, se
  // preselecciona el gestor actual de la orden o el admin general.
  function initialAgent(): string {
    if (isAgent) return currentUser.id;
    if (mode === 'edit' && order?.salesManagerId) return order.salesManagerId;
    return defaultManagerId ?? '';
  }

  const [agentId, setAgentId] = useState<string>(initialAgent);
  const [clientId, setClientId] = useState<string>(order?.clientId ?? '');

  // Re-sincroniza al reabrir o cambiar de orden (mismo patrón de
  // adjust-state-in-render que product-dialog.tsx).
  const signature = `${open}-${mode}-${order?.id ?? 'new'}`;
  const [lastSignature, setLastSignature] = useState(signature);
  if (signature !== lastSignature) {
    setLastSignature(signature);
    setAgentId(initialAgent());
    setClientId(order?.clientId ?? '');
  }

  useEffect(() => {
    if (!state || state === lastHandledRef.current) return;
    lastHandledRef.current = state;
    if (state.ok) onSuccess(state.id);
    else if (!state.fieldErrors)
      toast.error('No se pudo guardar la orden', {
        description: state.error,
      });
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  // ADR-0007: el gestor ya no filtra los clientes (para un agente el
  // servidor solo carga los suyos). El agente asignado se muestra como
  // descripción porque es el que cobra la comisión (RN-003).
  const selectableClients = clientOptions;
  const managerNameById = new Map(managerOptions.map((m) => [m.id, m.label]));

  const agentLabel =
    managerOptions.find((m) => m.id === currentUser.id)?.label ?? 'Tú';

  function handleAgentChange(next: string) {
    setAgentId(next);
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva orden' : 'Editar orden'}
      description={
        mode === 'create'
          ? 'Elige el cliente y el gestor; los productos se añaden después.'
          : `Orden #${order?.id ?? ''} de ${order?.clientName ?? ''}`
      }
      icon={<ShoppingCart className="h-5 w-5" aria-hidden />}
      size="lg"
    >
      <form
        key={mode === 'edit' ? (order?.id ?? 'edit') : 'create'}
        action={formAction}
        className="space-y-4"
      >
        {mode === 'edit' && order ? (
          <input type="hidden" name="id" value={order.id} />
        ) : null}
        <input
          type="hidden"
          name="salesManagerId"
          value={isAgent ? currentUser.id : agentId}
        />

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
            <Select
              value={agentId}
              onChange={(e) => handleAgentChange(e.target.value)}
            >
              {agentId ? null : <option value="">— Selecciona un gestor —</option>}
              {managerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
            </Select>
          )}
        </Field>

        <Field label="Cliente" required error={errors['clientId']}>
          <SearchSelect
            name="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            invalid={!!errors['clientId']}
            placeholder="— Selecciona un cliente —"
            searchPlaceholder="Buscar cliente por nombre o teléfono…"
            emptyMessage={
              selectableClients.length === 0 ? 'No hay clientes' : 'Sin resultados'
            }
            options={selectableClients.map((c) => ({
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

        <Field label="Estado">
          <Select name="status" defaultValue={order?.status ?? 'Encargado'}>
            {ORDER_STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Observaciones (opcional)">
          <TextArea
            name="observations"
            rows={3}
            maxLength={2000}
            defaultValue={order?.observations ?? ''}
          />
        </Field>

        <p className="text-xs text-muted">
          El total de la orden se calcula a partir de sus productos. Los
          pagos (recibido del cliente y saldo aplicado) se registran con la
          acción «Confirmar pago».
        </p>

        <div className="flex justify-end gap-2 pt-2">
          <Button variant="tertiary" onPress={onClose}>
            Cancelar
          </Button>
          <SubmitButton isPending={isPending}>Guardar</SubmitButton>
        </div>
      </form>
    </AppModal>
  );
}
