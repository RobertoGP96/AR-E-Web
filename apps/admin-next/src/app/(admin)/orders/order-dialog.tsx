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
  currentUser: CurrentUser;
  onClose: () => void;
  onSuccess: (newId?: string) => void;
}

/** Valor del select de agente para "clientes sin agente asignado". */
const NO_AGENT = 'none';

export function OrderDialog({
  open,
  mode,
  order,
  clientOptions,
  managerOptions,
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

  // El agente se elige primero y determina qué clientes se pueden
  // escoger. Si quien crea la orden es un agente, queda fijado a sí
  // mismo y no puede cambiarse.
  function initialAgent(): string {
    if (isAgent) return currentUser.id;
    if (mode === 'edit' && order) {
      if (order.salesManagerId) return order.salesManagerId;
      const client = clientOptions.find((c) => c.id === order.clientId);
      if (client) return client.agentId ?? NO_AGENT;
    }
    return '';
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
    else if (!state.fieldErrors) toast.error(state.error);
  }, [state, onSuccess]);

  const errors = state && !state.ok ? (state.fieldErrors ?? {}) : {};

  const filteredClients = agentId
    ? clientOptions.filter((c) =>
        agentId === NO_AGENT ? c.agentId === null : c.agentId === agentId
      )
    : [];
  // En edición el cliente actual debe seguir siendo elegible aunque su
  // agente asignado ya no coincida con el gestor de la orden.
  const currentClient =
    clientId && !filteredClients.some((c) => c.id === clientId)
      ? clientOptions.find((c) => c.id === clientId)
      : undefined;
  const selectableClients = currentClient
    ? [currentClient, ...filteredClients]
    : filteredClients;

  const agentLabel =
    managerOptions.find((m) => m.id === currentUser.id)?.label ?? 'Tú';

  function handleAgentChange(next: string) {
    setAgentId(next);
    // Un cliente que no pertenece al nuevo agente deja de ser válido.
    const stillValid =
      next &&
      clientOptions.some(
        (c) =>
          c.id === clientId &&
          (next === NO_AGENT ? c.agentId === null : c.agentId === next)
      );
    if (!stillValid) setClientId('');
  }

  return (
    <AppModal
      isOpen={open}
      onClose={onClose}
      title={mode === 'create' ? 'Nueva orden' : 'Editar orden'}
      description={
        mode === 'create'
          ? 'Elige el agente y luego un cliente suyo; los productos se añaden después.'
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
          value={
            isAgent ? currentUser.id : agentId === NO_AGENT ? '' : agentId
          }
        />

        <Field
          label="Agente"
          required
          hint={
            isAgent
              ? 'Las órdenes que creas quedan a tu nombre.'
              : undefined
          }
        >
          {isAgent ? (
            <Select value={currentUser.id} disabled aria-label="Agente">
              <option value={currentUser.id}>{agentLabel}</option>
            </Select>
          ) : (
            <Select
              value={agentId}
              onChange={(e) => handleAgentChange(e.target.value)}
            >
              <option value="">— Selecciona un agente —</option>
              {managerOptions.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.label}
                </option>
              ))}
              <option value={NO_AGENT}>Sin agente (clientes sin asignar)</option>
            </Select>
          )}
        </Field>

        <Field label="Cliente" required error={errors['clientId']}>
          <SearchSelect
            name="clientId"
            value={clientId}
            onChange={(e) => setClientId(e.target.value)}
            required
            disabled={!agentId}
            invalid={!!errors['clientId']}
            placeholder={
              agentId
                ? '— Selecciona un cliente —'
                : 'Selecciona primero un agente'
            }
            searchPlaceholder="Buscar cliente por nombre o teléfono…"
            emptyMessage={
              filteredClients.length === 0
                ? 'Este agente no tiene clientes asignados'
                : 'Sin resultados'
            }
            options={selectableClients.map((c) => ({
              value: c.id,
              label: c.label,
              description: c.phoneNumber,
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
