'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  ArrowLeft,
  Boxes,
  CalendarDays,
  ClipboardList,
  Clock,
  PackageCheck,
  PackageOpen,
  Pencil,
} from 'lucide-react';
import { Button } from '@heroui/react';
import { toast } from '@/lib/toast';
import { formatDate } from '@/lib/format';
import { PackageStatusBadge } from '@/components/status-badges';
import { StatCard } from '@/components/ui';
import { DetailPhotos } from '@/components/detail-photos';
import { ArrivalChecklist } from '../arrival-checklist';
import { ReceivedList } from '../received-list';
import { PackageActionsBar } from '../package-actions-bar';
import { PackageDialog } from '../package-dialog';
import type { PackageStatus } from '../schema';
import type { ArrivalCandidate, CategoryChoice, ReviewPackage } from '../types';

interface PackageDetailClientProps {
  role: string;
  canWrite: boolean;
  pkg: ReviewPackage;
  candidates: ArrivalCandidate[];
  truncated: boolean;
  categories: CategoryChoice[];
}

export function PackageDetailClient({
  role,
  canWrite,
  pkg,
  candidates,
  truncated,
  categories,
}: PackageDetailClientProps) {
  const [editOpen, setEditOpen] = useState(false);
  const unitsPending = candidates.reduce((s, c) => s + c.pendingArrival, 0);

  return (
    <div className="space-y-6">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300 flex flex-wrap items-center justify-between gap-2">
        <Link
          href="/packages"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a paquetes
        </Link>
        <Link
          href="/delivery/prepare"
          className="inline-flex items-center gap-1.5 rounded-md text-sm font-medium text-accent transition-colors hover:text-accent/80"
        >
          <ClipboardList className="h-4 w-4" aria-hidden />
          Preparar entregas
        </Link>
      </div>

      <header className="surface-card animate-in fade-in slide-in-from-top-2 duration-300 p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-xl font-bold tracking-tight text-foreground">
              {pkg.agency}
            </h1>
            <p className="mt-0.5 break-all font-mono text-sm text-muted">
              {pkg.tracking}
            </p>
            <p className="mt-1 flex items-center gap-1.5 text-sm text-muted">
              <CalendarDays className="h-3.5 w-3.5" aria-hidden />
              Llegada: {formatDate(pkg.arrivalDate)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <PackageStatusBadge status={pkg.status} />
            {canWrite ? (
              <Button
                variant="ghost"
                size="sm"
                isIconOnly
                aria-label="Editar paquete"
                onPress={() => setEditOpen(true)}
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Button>
            ) : null}
          </div>
        </div>

        <DetailPhotos
          className="mt-4"
          label="Fotos del paquete"
          photos={[
            { url: pkg.packagePicture, alt: `Foto 1 del paquete ${pkg.tracking}` },
            { url: pkg.packagePicture2, alt: `Foto 2 del paquete ${pkg.tracking}` },
          ]}
        />

        <div className="stagger-children mt-5 grid grid-cols-2 gap-3 lg:grid-cols-3">
          <StatCard
            icon={PackageCheck}
            label="Recepciones"
            value={pkg.receptions.length}
            tone="accent"
          />
          <StatCard
            icon={Boxes}
            label="Unidades recibidas"
            value={pkg.unitsMarked}
            tone="success"
          />
          <StatCard
            icon={Clock}
            label="Por llegar"
            value={unitsPending}
            hint="Compradas sin recepción (todos los paquetes)"
            tone={unitsPending > 0 ? 'warning' : 'default'}
            className="col-span-2 lg:col-span-1"
          />
        </div>

        {canWrite ? (
          <div className="mt-4 border-t border-border pt-4">
            <PackageActionsBar
              packageId={pkg.id}
              tracking={pkg.tracking}
              status={pkg.status}
              role={role}
              receptionCount={pkg.receptions.length}
            />
          </div>
        ) : null}
      </header>

      <ReceivedList packageId={pkg.id} receptions={pkg.receptions} canWrite={canWrite} />

      <div>
        <h3 className="mb-2 flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackageOpen className="h-4 w-4 text-accent" aria-hidden />
          ¿Qué llegó en este paquete?
        </h3>
        <ArrivalChecklist
          packageId={pkg.id}
          packageLabel={pkg.tracking}
          packageStatus={pkg.status}
          candidates={candidates}
          truncated={truncated}
          categories={categories}
          canWrite={canWrite}
        />
      </div>

      <PackageDialog
        open={editOpen}
        mode="edit"
        role={role}
        pkg={{
          id: pkg.id,
          agencyName: pkg.agency,
          numberOfTracking: pkg.tracking,
          statusOfProcessing: pkg.status as PackageStatus,
          arrivalDate: pkg.arrivalDate,
          packagePicture: pkg.packagePicture,
          packagePicture2: pkg.packagePicture2,
          createdAt: '',
          updatedAt: '',
          receptionCount: pkg.receptions.length,
        }}
        onClose={() => setEditOpen(false)}
        onSuccess={() => {
          setEditOpen(false);
          toast.success('Paquete actualizado', {
            description: 'Los cambios del paquete se guardaron.',
          });
        }}
      />
    </div>
  );
}
