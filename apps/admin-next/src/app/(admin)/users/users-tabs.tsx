'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChartPie, Coins, Users as UsersIcon } from 'lucide-react';
import { Spinner, Tabs } from '@heroui/react';
import { PageHeader } from '@/components/ui';
import { NewUserButton } from './new-user-button';
import type { AgentOption } from './schema';

export type UsersTab = 'users' | 'distribution' | 'balances';

const SUBTITLES: Record<UsersTab, string> = {
  users: 'Gestiona los usuarios y permisos del sistema',
  distribution: 'Controla la distribución de clientes por agente',
  balances: 'Balance por cliente: cobrado menos costo de órdenes y entregas',
};

// Cada tab usa sus propios filtros de URL; al cambiar de tab se
// descartan para no arrastrar un ?q= o ?status= a otro panel.
const FILTER_PARAMS = ['q', 'role', 'active', 'verified', 'status', 'page'];

/**
 * URL-driven tab switcher for /users. The server page renders only the
 * active panel's content; the local selection is optimistic so the tab
 * responds at once while the navigation resolves (spinner meanwhile).
 * Los contables solo ven la pestaña de balances (canManageUsers=false).
 */
export function UsersTabs({
  tab,
  agentOptions,
  canManageUsers,
  usersPanel,
  distributionPanel,
  balancesPanel,
}: {
  tab: UsersTab;
  agentOptions: AgentOption[];
  canManageUsers: boolean;
  usersPanel: ReactNode;
  distributionPanel: ReactNode;
  balancesPanel: ReactNode;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selected, setSelected] = useState<UsersTab>(tab);
  const [, startTransition] = useTransition();

  // Re-sync with the URL during render (back/forward navigation) —
  // same adjust-state-in-render pattern as user-dialog.tsx.
  const [lastTab, setLastTab] = useState(tab);
  if (tab !== lastTab) {
    setLastTab(tab);
    setSelected(tab);
  }

  function handleSelect(key: UsersTab) {
    if (key === selected) return;
    setSelected(key);
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'users') params.delete('tab');
    else params.set('tab', key);
    for (const param of FILTER_PARAMS) params.delete(param);
    startTransition(() => {
      router.replace(`/users?${params.toString()}`);
    });
  }

  return (
    <div>
      <PageHeader
        icon={UsersIcon}
        title="Usuarios"
        subtitle={SUBTITLES[selected]}
        actions={
          canManageUsers && selected === 'users' ? (
            <NewUserButton agentOptions={agentOptions} />
          ) : undefined
        }
      />

      <Tabs
        selectedKey={selected}
        onSelectionChange={(key) => handleSelect(key as UsersTab)}
      >
        <Tabs.ListContainer className="w-fit max-w-full">
          <Tabs.List aria-label="Secciones de usuarios">
            {canManageUsers ? (
              <>
                <Tabs.Tab id="users" className="gap-1.5">
                  <UsersIcon className="h-4 w-4" aria-hidden />
                  Usuarios
                  <Tabs.Indicator />
                </Tabs.Tab>
                <Tabs.Tab id="distribution" className="gap-1.5">
                  <ChartPie className="h-4 w-4" aria-hidden />
                  Distribución
                  <Tabs.Indicator />
                </Tabs.Tab>
              </>
            ) : null}
            <Tabs.Tab id="balances" className="gap-1.5">
              <Coins className="h-4 w-4" aria-hidden />
              Balances
              <Tabs.Indicator />
            </Tabs.Tab>
          </Tabs.List>
        </Tabs.ListContainer>

        {canManageUsers ? (
          <>
            <Tabs.Panel id="users" className="p-0">
              {usersPanel ?? <PanelLoading />}
            </Tabs.Panel>
            <Tabs.Panel id="distribution" className="p-0">
              {distributionPanel ?? <PanelLoading />}
            </Tabs.Panel>
          </>
        ) : null}
        <Tabs.Panel id="balances" className="p-0">
          {balancesPanel ?? <PanelLoading />}
        </Tabs.Panel>
      </Tabs>
    </div>
  );
}

function PanelLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      <Spinner size="lg" aria-label="Cargando…" />
    </div>
  );
}
