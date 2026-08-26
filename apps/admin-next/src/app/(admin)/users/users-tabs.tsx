'use client';

import { useState, useTransition, type ReactNode } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChartPie, Users as UsersIcon } from 'lucide-react';
import { Spinner, Tabs } from '@heroui/react';
import { PageHeader } from '@/components/ui';
import { NewUserButton } from './new-user-button';
import type { AgentOption } from './schema';

export type UsersTab = 'users' | 'distribution';

const SUBTITLES: Record<UsersTab, string> = {
  users: 'Gestiona los usuarios y permisos del sistema',
  distribution: 'Controla la distribución de clientes por agente',
};

/**
 * URL-driven tab switcher for /users. The server page renders only the
 * active panel's content; the local selection is optimistic so the tab
 * responds at once while the navigation resolves (spinner meanwhile).
 */
export function UsersTabs({
  tab,
  agentOptions,
  usersPanel,
  distributionPanel,
}: {
  tab: UsersTab;
  agentOptions: AgentOption[];
  usersPanel: ReactNode;
  distributionPanel: ReactNode;
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
    if (key === 'distribution') params.set('tab', 'distribution');
    else params.delete('tab');
    params.delete('page');
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
          selected === 'users' ? (
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
            <Tabs.Tab id="users" className="gap-1.5">
              <UsersIcon className="h-4 w-4" aria-hidden />
              Usuarios
            </Tabs.Tab>
            <Tabs.Tab id="distribution" className="gap-1.5">
              <ChartPie className="h-4 w-4" aria-hidden />
              Distribución
            </Tabs.Tab>
            <Tabs.Indicator />
          </Tabs.List>
        </Tabs.ListContainer>

        <Tabs.Panel id="users" className="p-0">
          {usersPanel ?? <PanelLoading />}
        </Tabs.Panel>
        <Tabs.Panel id="distribution" className="p-0">
          {distributionPanel ?? <PanelLoading />}
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
