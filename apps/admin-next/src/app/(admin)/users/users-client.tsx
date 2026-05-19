'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Plus,
  Pencil,
  Trash2,
  Users as UsersIcon,
  Search,
  KeyRound,
  BadgeCheck,
  Power,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserDialog } from './user-dialog';
import { ChangePasswordDialog } from './change-password-dialog';
import { DeleteUserDialog } from './delete-dialog';
import { toggleUserActiveAction, verifyUserAction } from './actions';
import { formatDate } from '@/lib/format';
import {
  USER_ROLES,
  type AgentOption,
  type UserRole,
  type UserRow,
} from './schema';

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
  const [query, setQuery] = useState(initialFilters.q);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<UserRow | null>(null);
  const [pwTarget, setPwTarget] = useState<UserRow | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<UserRow | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  function setParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) params.set(key, value);
    else params.delete(key);
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
        toast.success(`${row.name} ${row.isActive ? 'deactivated' : 'activated'}`);
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
        toast.success(`${row.name} verified`);
        router.refresh();
      } else {
        toast.error(result.error);
      }
    });
  }

  return (
    <div className="space-y-6">
      <header className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="rounded-md bg-zinc-100 p-2 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
            <UsersIcon className="h-5 w-5" aria-hidden />
          </div>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Usuarios</h1>
            <p className="text-sm text-zinc-500 dark:text-zinc-400">
              Manage accounts, roles, and agent assignments.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCreateOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-zinc-800 dark:bg-zinc-50 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          <Plus className="h-4 w-4" aria-hidden />
          New user
        </button>
      </header>

      <div className="flex flex-col gap-2 lg:flex-row lg:items-center">
        <label className="relative flex-1 lg:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400"
            aria-hidden
          />
          <input
            type="search"
            value={query}
            placeholder="Search name, email, phone…"
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') setParam('q', query || null);
            }}
            onBlur={() => {
              if (query !== initialFilters.q) setParam('q', query || null);
            }}
            className="w-full rounded-md border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm outline-none focus:border-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:focus:border-zinc-100"
          />
        </label>
        <select
          value={initialFilters.role ?? ''}
          onChange={(e) => setParam('role', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">All roles</option>
          {USER_ROLES.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
        <select
          value={
            initialFilters.active === null
              ? ''
              : initialFilters.active
                ? 'true'
                : 'false'
          }
          onChange={(e) => setParam('active', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Active: all</option>
          <option value="true">Active only</option>
          <option value="false">Inactive only</option>
        </select>
        <select
          value={
            initialFilters.verified === null
              ? ''
              : initialFilters.verified
                ? 'true'
                : 'false'
          }
          onChange={(e) => setParam('verified', e.target.value || null)}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm shadow-sm dark:border-zinc-700 dark:bg-zinc-950"
        >
          <option value="">Verified: all</option>
          <option value="true">Verified only</option>
          <option value="false">Unverified only</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-lg border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950">
        <div className="hidden overflow-x-auto lg:block">
          <table className="w-full text-left text-sm">
            <thead className="bg-zinc-50 text-xs uppercase tracking-wide text-zinc-500 dark:bg-zinc-900 dark:text-zinc-400">
              <tr>
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Contact</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Agent</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Joined</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {initialRows.length === 0 ? (
                <tr>
                  <td
                    colSpan={7}
                    className="px-4 py-8 text-center text-sm text-zinc-500"
                  >
                    {isPending ? 'Loading…' : 'No users found.'}
                  </td>
                </tr>
              ) : (
                initialRows.map((row) => (
                  <tr key={row.id} className="text-zinc-800 dark:text-zinc-200">
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {row.name} {row.lastName}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      <div>{row.phoneNumber}</div>
                      {row.email ? (
                        <div className="text-xs">{row.email}</div>
                      ) : null}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                        {row.role}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {row.assignedAgentName ?? (
                        <span className="italic text-zinc-400">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.isActive
                              ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                              : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                          }`}
                        >
                          {row.isActive ? 'Active' : 'Inactive'}
                        </span>
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                            row.isVerified
                              ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                          }`}
                        >
                          {row.isVerified ? 'Verified' : 'Unverified'}
                        </span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-zinc-500">
                      {formatDate(row.dateJoined)}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="inline-flex gap-1">
                        {!row.isVerified ? (
                          <button
                            type="button"
                            onClick={() => handleVerify(row)}
                            disabled={busyId === row.id}
                            aria-label="Verify user"
                            className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-blue-600 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            <BadgeCheck className="h-4 w-4" aria-hidden />
                          </button>
                        ) : null}
                        <button
                          type="button"
                          onClick={() => handleToggleActive(row)}
                          disabled={busyId === row.id}
                          aria-label="Toggle active"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 disabled:opacity-50 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Power className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setPwTarget(row)}
                          aria-label="Change password"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <KeyRound className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditTarget(row)}
                          aria-label="Edit user"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
                        >
                          <Pencil className="h-4 w-4" aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteTarget(row)}
                          aria-label="Delete user"
                          className="rounded-md p-1.5 text-zinc-600 transition hover:bg-zinc-100 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-red-400"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <ul className="divide-y divide-zinc-200 lg:hidden dark:divide-zinc-800">
          {initialRows.length === 0 ? (
            <li className="px-4 py-8 text-center text-sm text-zinc-500">
              {isPending ? 'Loading…' : 'No users found.'}
            </li>
          ) : (
            initialRows.map((row) => (
              <li key={row.id} className="space-y-2 px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-medium">
                      {row.name} {row.lastName}
                    </div>
                    <div className="text-xs text-zinc-500">
                      {row.phoneNumber}
                      {row.email ? ` · ${row.email}` : ''}
                    </div>
                  </div>
                  <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
                    {row.role}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 text-xs">
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      row.isActive
                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300'
                        : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400'
                    }`}
                  >
                    {row.isActive ? 'Active' : 'Inactive'}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 font-medium ${
                      row.isVerified
                        ? 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
                        : 'bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-300'
                    }`}
                  >
                    {row.isVerified ? 'Verified' : 'Unverified'}
                  </span>
                  {row.assignedAgentName ? (
                    <span className="text-zinc-500">
                      Agent: {row.assignedAgentName}
                    </span>
                  ) : null}
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {!row.isVerified ? (
                    <button
                      type="button"
                      onClick={() => handleVerify(row)}
                      disabled={busyId === row.id}
                      className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300"
                    >
                      Verify
                    </button>
                  ) : null}
                  <button
                    type="button"
                    onClick={() => handleToggleActive(row)}
                    disabled={busyId === row.id}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 disabled:opacity-50 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    {row.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setPwTarget(row)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    Password
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditTarget(row)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTarget(row)}
                    className="rounded-md border border-zinc-200 px-2 py-1 text-xs text-red-600 dark:border-zinc-800"
                  >
                    Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>
      </div>

      <UserDialog
        open={createOpen}
        mode="create"
        agentOptions={agentOptions}
        onClose={() => setCreateOpen(false)}
        onSuccess={() => {
          setCreateOpen(false);
          toast.success('User created');
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
          toast.success('User updated');
          router.refresh();
        }}
      />

      <ChangePasswordDialog
        user={pwTarget}
        onClose={() => setPwTarget(null)}
        onSuccess={() => {
          setPwTarget(null);
          toast.success('Password updated');
        }}
      />

      <DeleteUserDialog
        user={deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onSuccess={() => {
          setDeleteTarget(null);
          toast.success('User deleted');
          router.refresh();
        }}
      />
    </div>
  );
}
