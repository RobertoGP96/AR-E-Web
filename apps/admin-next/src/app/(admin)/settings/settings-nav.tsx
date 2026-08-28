'use client';

import { useState, useTransition } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Activity,
  Database,
  FileSpreadsheet,
  Settings,
  SlidersHorizontal,
  type LucideIcon,
} from 'lucide-react';
import { Tabs } from '@heroui/react';
import { PageHeader } from '@/components/ui';
import { canAccessPath } from '@/lib/route-roles';

interface SettingsSection {
  href: string;
  label: string;
  subtitle: string;
  icon: LucideIcon;
}

const SECTIONS: SettingsSection[] = [
  {
    href: '/settings',
    label: 'General',
    subtitle: 'Parámetros que rigen los cálculos de todo el sistema',
    icon: SlidersHorizontal,
  },
  {
    href: '/settings/data',
    label: 'Datos',
    subtitle: 'Salvas, exportación e importación de los datos del sistema',
    icon: Database,
  },
  {
    href: '/settings/import',
    label: 'Importar',
    subtitle: 'Incorpora los datos de un libro de embarque AR&E Shipps',
    icon: FileSpreadsheet,
  },
  {
    href: '/settings/system',
    label: 'Sistema',
    subtitle: 'Estado de la aplicación y de la base de datos',
    icon: Activity,
  },
];

function sectionFor(pathname: string): string {
  let best = '/settings';
  for (const s of SECTIONS) {
    if (
      (pathname === s.href || pathname.startsWith(`${s.href}/`)) &&
      s.href.length > best.length
    ) {
      best = s.href;
    }
  }
  return best;
}

/**
 * Header + route-driven tab bar shared by every /settings sub-view.
 * The selection is optimistic (same pattern as UsersTabs) so the tab
 * responds at once while the navigation resolves.
 */
export function SettingsNav({ role }: { role: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const [, startTransition] = useTransition();

  const current = sectionFor(pathname);
  const [selected, setSelected] = useState(current);

  // Re-sync with the URL during render (back/forward navigation).
  const [lastCurrent, setLastCurrent] = useState(current);
  if (current !== lastCurrent) {
    setLastCurrent(current);
    setSelected(current);
  }

  const sections = SECTIONS.filter((s) => canAccessPath(role, s.href));
  const active = SECTIONS.find((s) => s.href === selected) ?? SECTIONS[0];

  function handleSelect(href: string) {
    if (href === selected) return;
    setSelected(href);
    startTransition(() => {
      router.push(href);
    });
  }

  return (
    <div>
      <PageHeader
        icon={Settings}
        title="Configuración"
        subtitle={active.subtitle}
      />
      {sections.length > 1 ? (
        <Tabs
          selectedKey={selected}
          onSelectionChange={(key) => handleSelect(key as string)}
          className="mb-5"
        >
          <Tabs.ListContainer className="w-fit max-w-full">
            <Tabs.List aria-label="Secciones de configuración">
              {sections.map((s) => {
                const Icon = s.icon;
                return (
                  <Tabs.Tab
                    key={s.href}
                    id={s.href}
                    className="gap-1.5 whitespace-nowrap"
                  >
                    <Icon className="h-4 w-4" aria-hidden />
                    {s.label}
                    <Tabs.Indicator />
                  </Tabs.Tab>
                );
              })}
            </Tabs.List>
          </Tabs.ListContainer>
          {/* El contenido real lo renderiza la ruta activa debajo; los
              paneles existen solo para cumplir el contrato de Tabs. */}
          {sections.map((s) => (
            <Tabs.Panel key={s.href} id={s.href} className="hidden p-0">
              {null}
            </Tabs.Panel>
          ))}
        </Tabs>
      ) : null}
    </div>
  );
}
