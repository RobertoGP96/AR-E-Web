'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ClipboardList, Eye, PackageSearch, Truck } from 'lucide-react';
import { Button, Tabs } from '@heroui/react';
import { PageHeader } from '@/components/ui';
import { ReviewPackagesStep } from './review-packages-step';
import { BuildDeliveriesStep } from './build-deliveries-step';
import type { CategoryOption } from '../schema';
import type {
  ArrivalCandidate,
  PrepareClientGroup,
  ReviewPackage,
} from './types';

interface PrepareDeliveryClientProps {
  reviewPackages: ReviewPackage[];
  candidates: ArrivalCandidate[];
  groups: PrepareClientGroup[];
  categoryOptions: CategoryOption[];
  canWrite: boolean;
  canWritePackages: boolean;
}

type StepKey = 'packages' | 'deliveries';

/**
 * Workspace de preparación en dos fases, calcado del proceso físico:
 * primero se revisan los paquetes uno a uno marcando qué llegó en cada
 * bulto, y con lo verificado se arman las entregas de cada cliente
 * (parciales si aún hay mercancía en camino). Las dos fases quedan
 * montadas a la vez — cambiar de pestaña no pierde las marcas — por lo
 * que los paneles de Tabs son solo el conmutador (mismo patrón que
 * SettingsNav).
 */
export function PrepareDeliveryClient({
  reviewPackages,
  candidates,
  groups,
  categoryOptions,
  canWrite,
  canWritePackages,
}: PrepareDeliveryClientProps) {
  const router = useRouter();

  const pendingPackages = reviewPackages.filter(
    (p) => p.status !== 'Procesado'
  ).length;

  // Se arranca en la fase con trabajo pendiente.
  const [step, setStep] = useState<StepKey>(
    pendingPackages > 0 ? 'packages' : 'deliveries'
  );

  const STEPS: {
    key: StepKey;
    label: string;
    icon: typeof PackageSearch;
    badge: number;
  }[] = [
    {
      key: 'packages',
      label: '1 · Revisar paquetes',
      icon: PackageSearch,
      badge: pendingPackages,
    },
    {
      key: 'deliveries',
      label: '2 · Armar entregas',
      icon: Truck,
      badge: groups.length,
    },
  ];

  return (
    <div className="space-y-5">
      <PageHeader
        icon={ClipboardList}
        title="Preparar entregas"
        subtitle="Revisa los paquetes marcando lo que llegó y arma las entregas de cada cliente"
        actions={
          <Button variant="tertiary" onPress={() => router.push('/delivery')}>
            <Truck className="h-4 w-4" aria-hidden />
            Ver entregas
          </Button>
        }
      />

      {!canWrite && !canWritePackages ? (
        <div className="surface-card flex items-center gap-2.5 border-accent/30 bg-accent-soft/30 p-3 text-sm text-foreground">
          <Eye className="h-4 w-4 shrink-0 text-accent" aria-hidden />
          Modo lectura: tu rol permite revisar los paquetes y los productos
          pendientes, pero no registrar llegadas ni crear entregas.
        </div>
      ) : null}

      <Tabs
        selectedKey={step}
        onSelectionChange={(key) => setStep(key as StepKey)}
      >
        <Tabs.ListContainer className="w-fit max-w-full">
          <Tabs.List aria-label="Fases de la preparación">
            {STEPS.map((s) => {
              const Icon = s.icon;
              return (
                <Tabs.Tab key={s.key} id={s.key} className="gap-1.5">
                  <Icon className="h-4 w-4" aria-hidden />
                  {s.label}
                  {s.badge > 0 ? (
                    <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[11px] font-bold tabular-nums text-accent">
                      {s.badge}
                    </span>
                  ) : null}
                  <Tabs.Indicator />
                </Tabs.Tab>
              );
            })}
          </Tabs.List>
        </Tabs.ListContainer>
        {/* El contenido real vive fuera para que ambas fases conserven su
            estado; los paneles solo cumplen el contrato de Tabs. */}
        {STEPS.map((s) => (
          <Tabs.Panel key={s.key} id={s.key} className="hidden p-0">
            {null}
          </Tabs.Panel>
        ))}
      </Tabs>

      <div className={step === 'packages' ? '' : 'hidden'}>
        <ReviewPackagesStep
          packages={reviewPackages}
          candidates={candidates}
          canWrite={canWritePackages}
          onGoToDeliveries={() => setStep('deliveries')}
        />
      </div>
      <div className={step === 'deliveries' ? '' : 'hidden'}>
        <BuildDeliveriesStep
          groups={groups}
          categoryOptions={categoryOptions}
          canWrite={canWrite}
          onGoToPackages={() => setStep('packages')}
        />
      </div>
    </div>
  );
}
