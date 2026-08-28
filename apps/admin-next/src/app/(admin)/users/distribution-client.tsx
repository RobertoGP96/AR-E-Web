'use client';

import { useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRightLeft,
  Handshake,
  Mail,
  Phone,
  UserRound,
  UserRoundCheck,
  UserRoundSearch,
  UserRoundX,
  UsersRound,
  X,
} from 'lucide-react';
import { toast } from '@/lib/toast';
import { Button, Checkbox, Chip, Spinner } from '@heroui/react';
import { reassignClientsAction } from './actions';
import {
  Field,
  MobileCard,
  ResponsiveTable,
  SearchInput,
  Select,
  StatCard,
  TableEmpty,
} from '@/components/ui';
import type { DistAgentRow, DistClientRow } from './schema';

/** 'all' | 'unassigned' | agent id */
type AgentFilter = string;

/** Sentinel for the "quitar agente" option of the target select. */
const UNASSIGN = '__unassign__';

function RowCheckbox({
  checked,
  onChange,
  label,
  indeterminate,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  indeterminate?: boolean;
}) {
  return (
    <Checkbox
      isSelected={checked}
      isIndeterminate={indeterminate}
      onChange={onChange}
      aria-label={label}
    >
      <Checkbox.Content>
        <Checkbox.Control>
          <Checkbox.Indicator />
        </Checkbox.Control>
      </Checkbox.Content>
    </Checkbox>
  );
}

function ActiveDot({ active }: { active: boolean }) {
  return (
    <Chip
      color={active ? 'success' : 'danger'}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
    >
      <Chip.Label>{active ? 'Activo' : 'Inactivo'}</Chip.Label>
    </Chip>
  );
}

export function DistributionClient({
  agents,
  clients,
}: {
  agents: DistAgentRow[];
  clients: DistClientRow[];
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [filter, setFilter] = useState<AgentFilter>('all');
  const [search, setSearch] = useState('');
  const [selectedIds, setSelectedIds] = useState<ReadonlySet<string>>(
    new Set()
  );
  const [target, setTarget] = useState('');

  const total = clients.length;
  const assignedCount = useMemo(
    () => clients.filter((c) => c.assignedAgentId !== null).length,
    [clients]
  );
  const unassignedCount = total - assignedCount;
  const agentsWithClients = useMemo(
    () => agents.filter((a) => a.clientCount > 0).length,
    [agents]
  );

  const agentLabels = useMemo(() => {
    const map = new Map<string, string>();
    for (const a of agents) map.set(a.id, a.label);
    return map;
  }, [agents]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return clients.filter((c) => {
      if (filter === 'unassigned' && c.assignedAgentId !== null) return false;
      if (
        filter !== 'all' &&
        filter !== 'unassigned' &&
        c.assignedAgentId !== filter
      ) {
        return false;
      }
      if (!term) return true;
      const haystack =
        `${c.name} ${c.lastName} ${c.phoneNumber} ${c.email ?? ''}`.toLowerCase();
      return haystack.includes(term);
    });
  }, [clients, filter, search]);

  const allFilteredSelected =
    filtered.length > 0 && filtered.every((c) => selectedIds.has(c.id));
  const someFilteredSelected = filtered.some((c) => selectedIds.has(c.id));

  function toggleClient(id: string, next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      if (next) copy.add(id);
      else copy.delete(id);
      return copy;
    });
  }

  function toggleAllFiltered(next: boolean) {
    setSelectedIds((prev) => {
      const copy = new Set(prev);
      for (const c of filtered) {
        if (next) copy.add(c.id);
        else copy.delete(c.id);
      }
      return copy;
    });
  }

  function handleReassign() {
    if (selectedIds.size === 0 || !target) return;
    const ids = [...selectedIds];
    const agentId = target === UNASSIGN ? null : target;
    const targetLabel =
      agentId === null ? null : (agentLabels.get(agentId) ?? 'agente');
    startTransition(async () => {
      const result = await reassignClientsAction(ids, agentId);
      if (result.ok) {
        toast.success('Reasignación completada', {
          description:
            agentId === null
              ? `${ids.length} cliente${ids.length === 1 ? '' : 's'} quedaron sin agente asignado.`
              : `${ids.length} cliente${ids.length === 1 ? '' : 's'} ahora pertenece${ids.length === 1 ? '' : 'n'} a ${targetLabel}.`,
        });
        setSelectedIds(new Set());
        setTarget('');
        router.refresh();
      } else {
        toast.error('No se pudo reasignar', {
          description: result.error,
        });
      }
    });
  }

  const filterTitle =
    filter === 'all'
      ? 'Todos los clientes'
      : filter === 'unassigned'
        ? 'Clientes sin asignar'
        : `Clientes de ${agentLabels.get(filter) ?? 'agente'}`;

  return (
    <div className="space-y-5">
      <div className="stagger-children grid grid-cols-2 gap-3 xl:grid-cols-4">
        <StatCard
          icon={UsersRound}
          label="Clientes"
          value={total}
          tone="accent"
        />
        <StatCard
          icon={UserRoundCheck}
          label="Asignados"
          value={assignedCount}
          hint={total > 0 ? `${Math.round((assignedCount / total) * 100)}% del total` : undefined}
          tone="success"
        />
        <StatCard
          icon={UserRoundX}
          label="Sin asignar"
          value={unassignedCount}
          tone={unassignedCount > 0 ? 'warning' : 'default'}
        />
        <StatCard
          icon={Handshake}
          label="Agentes"
          value={agents.length}
          hint={`${agentsWithClients} con clientes`}
          tone="default"
        />
      </div>

      <section className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
          Distribución por agente
        </h2>
        <div className="stagger-children grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          <AgentCard
            label="Sin asignar"
            sublabel="Clientes sin agente"
            count={unassignedCount}
            total={total}
            tone="warning"
            selected={filter === 'unassigned'}
            onPress={() =>
              setFilter(filter === 'unassigned' ? 'all' : 'unassigned')
            }
          />
          {agents.map((agent) => (
            <AgentCard
              key={agent.id}
              label={agent.label}
              sublabel={
                agent.role === 'admin' ? 'Administrador' : 'Agente'
              }
              inactive={!agent.isActive}
              count={agent.clientCount}
              total={total}
              tone="accent"
              selected={filter === agent.id}
              onPress={() => setFilter(filter === agent.id ? 'all' : agent.id)}
            />
          ))}
        </div>
      </section>

      <section className="animate-in fade-in slide-in-from-top-2 duration-300 space-y-3">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-2">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted">
              {filterTitle}
            </h2>
            <Chip color="default" variant="soft" size="sm">
              <Chip.Label>{filtered.length}</Chip.Label>
            </Chip>
            {filter !== 'all' ? (
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setFilter('all')}
                className="text-muted"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Quitar filtro
              </Button>
            ) : null}
          </div>
          <SearchInput
            initialValue={search}
            placeholder="Buscar cliente por nombre, teléfono o email…"
            onApply={(v) => setSearch(v ?? '')}
          />
        </div>

        {selectedIds.size > 0 ? (
          <div className="surface-card animate-in fade-in slide-in-from-top-1 duration-200 flex flex-col gap-3 border-accent/40 p-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="flex items-center gap-2">
              <Chip color="accent" variant="soft" size="sm">
                <Chip.Label>
                  {selectedIds.size} seleccionado
                  {selectedIds.size === 1 ? '' : 's'}
                </Chip.Label>
              </Chip>
              <Button
                variant="ghost"
                size="sm"
                onPress={() => setSelectedIds(new Set())}
                className="text-muted"
              >
                <X className="h-3.5 w-3.5" aria-hidden />
                Limpiar
              </Button>
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <Field label="Asignar a">
                <Select
                  value={target}
                  onChange={(e) => setTarget(e.target.value)}
                  triggerClassName="min-w-56"
                >
                  <option value="">Selecciona destino…</option>
                  <option value={UNASSIGN}>Sin agente (quitar)</option>
                  {agents
                    .filter((a) => a.isActive)
                    .map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.label}
                      </option>
                    ))}
                </Select>
              </Field>
              <Button
                variant="primary"
                isDisabled={!target || isPending}
                onPress={handleReassign}
              >
                {isPending ? (
                  <Spinner size="sm" aria-hidden />
                ) : (
                  <ArrowRightLeft className="h-4 w-4" aria-hidden />
                )}
                Reasignar
              </Button>
            </div>
          </div>
        ) : null}

        <ResponsiveTable
          table={
            <table className="data-table">
              <thead>
                <tr>
                  <th className="w-10">
                    <RowCheckbox
                      checked={allFilteredSelected}
                      indeterminate={someFilteredSelected && !allFilteredSelected}
                      onChange={toggleAllFiltered}
                      label="Seleccionar todos los clientes filtrados"
                    />
                  </th>
                  <th>Cliente</th>
                  <th>Contacto</th>
                  <th>Agente actual</th>
                  <th>Estado</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <TableEmpty
                    colSpan={5}
                    icon={UserRoundSearch}
                    message="No hay clientes con este filtro."
                  />
                ) : (
                  filtered.map((client) => (
                    <tr
                      key={client.id}
                      className="cursor-pointer"
                      onClick={() =>
                        toggleClient(client.id, !selectedIds.has(client.id))
                      }
                    >
                      <td onClick={(e) => e.stopPropagation()}>
                        <RowCheckbox
                          checked={selectedIds.has(client.id)}
                          onChange={(next) => toggleClient(client.id, next)}
                          label={`Seleccionar a ${client.name} ${client.lastName}`}
                        />
                      </td>
                      <td>
                        <span className="font-medium text-foreground">
                          {client.name} {client.lastName}
                        </span>
                      </td>
                      <td className="text-muted">
                        <div>{client.phoneNumber}</div>
                        {client.email ? (
                          <div className="text-xs">{client.email}</div>
                        ) : null}
                      </td>
                      <td className="text-muted">
                        {client.assignedAgentId ? (
                          (agentLabels.get(client.assignedAgentId) ?? '—')
                        ) : (
                          <span className="italic text-muted/60">
                            Sin asignar
                          </span>
                        )}
                      </td>
                      <td>
                        <ActiveDot active={client.isActive} />
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          }
          cards={
            filtered.length === 0 ? (
              <div className="surface-card p-8 text-center text-sm text-muted">
                No hay clientes con este filtro.
              </div>
            ) : (
              filtered.map((client) => (
                <MobileCard
                  key={client.id}
                  media={
                    // Keep checkbox taps from also firing the card's
                    // onClick (which would immediately undo the toggle).
                    <span onClick={(e) => e.stopPropagation()}>
                      <RowCheckbox
                        checked={selectedIds.has(client.id)}
                        onChange={(next) => toggleClient(client.id, next)}
                        label={`Seleccionar a ${client.name} ${client.lastName}`}
                      />
                    </span>
                  }
                  title={`${client.name} ${client.lastName}`}
                  subtitle={client.phoneNumber}
                  badges={<ActiveDot active={client.isActive} />}
                  onClick={() =>
                    toggleClient(client.id, !selectedIds.has(client.id))
                  }
                  rows={[
                    {
                      icon: Phone,
                      label: 'Teléfono',
                      value: client.phoneNumber,
                    },
                    {
                      icon: Mail,
                      label: 'Email',
                      value: client.email ?? '—',
                    },
                    {
                      icon: UserRound,
                      label: 'Agente',
                      value: client.assignedAgentId
                        ? (agentLabels.get(client.assignedAgentId) ?? '—')
                        : 'Sin asignar',
                    },
                  ]}
                />
              ))
            )
          }
        />
      </section>
    </div>
  );
}

function AgentCard({
  label,
  sublabel,
  count,
  total,
  tone,
  selected,
  inactive,
  onPress,
}: {
  label: string;
  sublabel: string;
  count: number;
  total: number;
  tone: 'accent' | 'warning';
  selected: boolean;
  inactive?: boolean;
  onPress: () => void;
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0;
  const barColor = tone === 'warning' ? 'bg-warning' : 'bg-accent';
  const iconColor =
    tone === 'warning'
      ? 'bg-warning-soft text-warning-soft-foreground'
      : 'bg-accent-soft text-accent';

  return (
    <button
      type="button"
      onClick={onPress}
      aria-pressed={selected}
      className={`surface-card group cursor-pointer p-4 text-left transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${
        selected ? 'ring-2 ring-accent' : ''
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${iconColor}`}
          >
            {tone === 'warning' ? (
              <UserRoundX className="h-4.5 w-4.5" aria-hidden />
            ) : (
              <UserRound className="h-4.5 w-4.5" aria-hidden />
            )}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">
              {label}
            </p>
            <p className="truncate text-xs text-muted">{sublabel}</p>
          </div>
        </div>
        {inactive ? (
          <Chip color="danger" variant="soft" size="sm">
            <Chip.Label>Inactivo</Chip.Label>
          </Chip>
        ) : null}
      </div>
      <div className="mt-3 flex items-baseline justify-between gap-2">
        <span className="text-lg font-bold tabular-nums text-foreground">
          {count}
          <span className="ml-1 text-xs font-normal text-muted">
            cliente{count === 1 ? '' : 's'}
          </span>
        </span>
        <span className="text-xs font-medium tabular-nums text-muted">
          {pct}%
        </span>
      </div>
      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-default">
        <div
          className={`h-full rounded-full transition-all duration-300 ${barColor}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </button>
  );
}
