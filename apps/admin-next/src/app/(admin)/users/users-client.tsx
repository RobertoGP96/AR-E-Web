'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  KeyRound,
  BadgeCheck,
  Power,
  CheckCircle2,
  XCircle,
  CircleAlert,
  UserRound,
  UserRoundSearch,
  CalendarDays,
  Mail,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button, Tooltip, Chip } from '@heroui/react';
import { UserDialog, ROLE_LABELS } from './user-dialog';
import { ChangePasswordDialog } from './change-password-dialog';
import { DeleteUserDialog } from './delete-dialog';
import { toggleUserActiveAction, verifyUserAction } from './actions';
import { formatDate } from '@/lib/format';
import { FilterPopover } from '@/components/filter-popover';
import {
  PageHeader,
  SearchInput,
  Field,
  Select,
  ResponsiveTable,
  MobileCard,
  TableEmpty,
} from '@/components/ui';
import {
  USER_ROLES,
  type AgentOption,
  type UserRole,
  type UserRow,
} from './schema';

type ChipColor = 'accent' | 'default' | 'success' | 'warning' | 'danger';

const ROLE_COLORS: Record<UserRole, ChipColor> = {
  admin: 'accent',
  agent: 'warning',
  accountant: 'success',
  logistical: 'default',
  client: 'default',
  user: 'default',
};

function RoleBadge({ role }: { role: UserRole }) {
  return (
    <Chip
      color={ROLE_COLORS[role] ?? 'default'}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
    >
      <Chip.Label>{ROLE_LABELS[role] ?? role}</Chip.Label>
    </Chip>
  );
}

function ActiveBadge({ active }: { active: boolean }) {
  const Icon = active ? CheckCircle2 : XCircle;
  return (
    <Chip
      color={active ? 'success' : 'danger'}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <Chip.Label>{active ? 'Activo' : 'Inactivo'}</Chip.Label>
    </Chip>
  );
}

function VerifiedBadge({ verified }: { verified: boolean }) {
  const Icon = verified ? BadgeCheck : CircleAlert;
  return (
    <Chip
      color={verified ? 'success' : 'danger'}
      variant="soft"
      size="sm"
      className="whitespace-nowrap"
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <Chip.Label>{verified ? 'Verificado' : 'No verificado'}</Chip.Label>
    </Chip>
  );
}

interface UsersClientProps {
  initialRows: UserRow[];
  agentOptions: AgentOption[];
  initialFilters: {
    q: string;
    role: UserRole | null;
    active: boolean | null;
    verified: boolean | null;
  };
}

export function UsersClient({
  initialRows,
  agentOptions,
  initialFilters,
}: UsersClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
    params.delete('page');
    startTransition(() => {
      router.replace(`/users?${params.toString()}`);
    });
  }

  function handleToggleActive(row: UserRow) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await toggleUserActiveAction(row.id, !row.isActive);
      setBusyId(null);
      if (result.ok) {
        toast.success(
          `${row.name} ${row.isActive ? 'desactivado' : 'activado'}`
        );
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  function handleVerify(row: UserRow) {
    setBusyId(row.id);
    startTransition(async () => {
      const result = await verifyUserAction(row.id);
      setBusyId(null);
      if (result.ok) {
        toast.success(`${row.name} verificado`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  const rowActions = (row: UserRow) => (
    <>
      {!row.isVerified ? (
        <Tooltip delay={500}>
          <Button
            variant="ghost"
            size="sm"
            isIconOnly
            aria-label="Verificar usuario"
            isDisabled={busyId === row.id}
            onPress={() => handleVerify(row)}
            className="text-success-soft-foreground hover:bg-success-soft"
          >
            <BadgeCheck className="h-4 w-4" aria-hidden />
          </Button>
          <Tooltip.Content>Verificar</Tooltip.Content>
        </Tooltip>
      ) : null}
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label={row.isActive ? 'Desactivar usuario' : 'Activar usuario'}
          isDisabled={busyId === row.id}
          onPress={() => handleToggleActive(row)}
        >
          <Power className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>
          {row.isActive ? 'Desactivar' : 'Activar'}
        </Tooltip.Content>
      </Tooltip>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Cambiar contraseña"
          onPress={() => setPwTarget(row)}
        >
          <KeyRound className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Cambiar contraseña</Tooltip.Content>
      </Tooltip>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Editar usuario"
          onPress={() => setEditTarget(row)}
        >
          <Pencil className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Editar</Tooltip.Content>
      </Tooltip>
      <Tooltip delay={500}>
        <Button
          variant="ghost"
          size="sm"
          isIconOnly
          aria-label="Eliminar usuario"
          onPress={() => setDeleteTarget(row)}
          className="hover:bg-danger-soft hover:text-danger"
        >
          <Trash2 className="h-4 w-4" aria-hidden />
        </Button>
        <Tooltip.Content>Eliminar</Tooltip.Content>
      </Tooltip>
    </>
  );

  return (
    <div className="space-y-5">
      <PageHeader
        icon={UsersIcon}
        title="Usuarios"
        subtitle="Gestiona los usuarios y permisos del sistema"
        actions={
          <Button variant="primary" onPress={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden />
            Nuevo usuario
          </Button>
        }
      />

      <div className="animate-in fade-in slide-in-from-top-2 duration-300 flex flex-col gap-2 lg:flex-row lg:items-center">
        <SearchInput
          initialValue={initialFilters.q}
          placeholder="Buscar por nombre, email o teléfono…"
          onApply={(v) => setParam('q', v)}
        />
        <FilterPopover
          title="Filtros de usuarios"
          subtitle="Filtra usuarios por rol, estado y verificación"
          activeFilters={[
            ...(initialFilters.role
              ? [
                  {
                    key: 'role',
                    label: ROLE_LABELS[initialFilters.role] ?? initialFilters.role,
                    onRemove: () => setParam('role', null),
                  },
                ]
              : []),
            ...(initialFilters.active !== null
              ? [
                  {
                    key: 'active',
                    label: initialFilters.active ? 'Activos' : 'Inactivos',
                    onRemove: () => setParam('active', null),
                  },
                ]
              : []),
            ...(initialFilters.verified !== null
              ? [
                  {
                    key: 'verified',
                    label: initialFilters.verified
                      ? 'Verificados'
                      : 'No verificados',
                    onRemove: () => setParam('verified', null),
                  },
                ]
              : []),
          ]}
          onClear={() => {
            const params = new URLSearchParams(searchParams.toString());
            params.delete('role');
            params.delete('active');
            params.delete('verified');
            params.delete('page');
            startTransition(() => {
              router.replace(`/users?${params.toString()}`);
            });
          }}
        >
          <Field label="Rol">
            <Select
              value={initialFilters.role ?? ''}
              onChange={(e) => setParam('role', e.target.value || null)}
            >
              <option value="">Todos los roles</option>
              {USER_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r] ?? r}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estado">
            <Select
              value={
                initialFilters.active === null
                  ? ''
                  : initialFilters.active
                    ? 'true'
                    : 'false'
              }
              onChange={(e) => setParam('active', e.target.value || null)}
            >
              <option value="">Todos</option>
              <option value="true">Solo activos</option>
              <option value="false">Solo inactivos</option>
            </Select>
          </Field>
          <Field label="Verificación">
            <Select
              value={
                initialFilters.verified === null
                  ? ''
                  : initialFilters.verified
                    ? 'true'
                    : 'false'
              }
              onChange={(e) => setParam('verified', e.target.value || null)}
            >
              <option value="">Todos</option>
              <option value="true">Solo verificados</option>
              <option value="false">Solo no verificados</option>
            </Select>
          </Field>
        </FilterPopover>
      </div>

      <ResponsiveTable
        table={
          <table className="data-table">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Contacto</th>
                <th>Rol</th>
                <th>Agente</th>
                <th>Estado</th>
                <th>Registrado</th>
                <th className="text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {initialRows.length === 0 ? (
                <TableEmpty
                  colSpan={7}
                  icon={UserRoundSearch}
                  message={isPending ? 'Cargando…' : 'No hay usuarios.'}
                />
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="font-medium text-foreground">
                        {row.name} {row.lastName}
                      </span>
                    </td>
                    <td className="text-muted">
                      <div>{row.phoneNumber}</div>
                      {row.email ? (
                        <div className="text-xs">{row.email}</div>
                      ) : null}
                    </td>
                    <td>
                      <RoleBadge role={row.role} />
                    </td>
                    <td className="text-muted">
                      {row.assignedAgentName ?? (
                        <span className="italic text-muted/60">—</span>
                      )}
                    </td>
                    <td>
                      <div className="flex flex-col items-start gap-1">
                        <ActiveBadge active={row.isActive} />
                        <VerifiedBadge verified={row.isVerified} />
                      </div>
                    </td>
                    <td className="text-muted">{formatDate(row.dateJoined)}</td>
                    <td className="text-right">
                      <div className="inline-flex gap-0.5">
                        {rowActions(row)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        }
        cards={
          initialRows.length === 0 ? (
            <div className="surface-card p-8 text-center text-sm text-muted">
              {isPending ? 'Cargando…' : 'No hay usuarios.'}
            </div>
          ) : (
            initialRows.map((row) => (
              <MobileCard
                key={row.id}
                title={`${row.name} ${row.lastName}`}
                subtitle={row.phoneNumber}
                badges={
                  <>
                    <RoleBadge role={row.role} />
                    <ActiveBadge active={row.isActive} />
                    <VerifiedBadge verified={row.isVerified} />
                  </>
                }
                rows={[
                  {
                    icon: Mail,
                    label: 'Email',
                    value: row.email ?? '—',
                  },
                  {
                    icon: UserRound,
                    label: 'Agente',
                    value: row.assignedAgentName ?? '—',
                  },
                  {
                    icon: CalendarDays,
                    label: 'Registrado',
                    value: formatDate(row.dateJoined),
                  },
                ]}
                actions={rowActions(row)}
              />
            ))
          )
        }
      />

      <UserDialog
        open={createOpen}
        mode="create"
        agentOptions={agentOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('Usuario creado');
          router.refresh();
        }}
      />

      <UserDialog
        open={editTarget !== null}
        mode="edit"
        user={editTarget ?? undefined}
        agentOptions={agentOptions}
        onClose={() => setEditTarget(null)}
        onSuccess={() => {
          setEditTarget(null);
          toast.success('Usuario actualizado');
          router.refresh();
        }}
      />

      <ChangePasswordDialog
        user={pwTarget}
        onClose={() => setPwTarget(null)}
        onSuccess={() => {
          setPwTarget(null);
          toast.success('Contraseña actualizada');
        }}
      />

      <DeleteUserDialog
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('Usuario eliminado');
          router.refresh();
        }}
      />
    </div>
  );
}
