'use client';

import { useCallback, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Box, PackageCheck, PackageOpen } from 'lucide-react';
import { Checkbox, Label } from '@heroui/react';
import { toast } from '@/lib/toast';
import { describeBags } from '@/lib/open-bags';
import { ImageUploadField } from '@/components/image-upload-field';
import { ChecklistSubmitBar } from '@/components/checklist-submit-bar';
import { Field, PageHeader, TextInput } from '@/components/ui';
import { createPackageWithArrivalsAction } from '../actions';
import { ArrivalChecklist, type ArrivalItemInput } from '../arrival-checklist';
import type { ArrivalCandidate, CategoryChoice } from '../types';

interface NewPackageClientProps {
  candidates: ArrivalCandidate[];
  truncated: boolean;
  categories: CategoryChoice[];
}

export function NewPackageClient({
  candidates,
  truncated,
  categories,
}: NewPackageClientProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [tracking, setTracking] = useState('');
  const [agency, setAgency] = useState('');
  const [arrivalDate, setArrivalDate] = useState(new Date().toISOString().slice(0, 10));
  const [arrived, setArrived] = useState(true);
  const [items, setItems] = useState<ArrivalItemInput[]>([]);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const formId = 'new-package-form';

  const onCollect = useCallback((next: ArrivalItemInput[]) => setItems(next), []);
  const units = items.reduce((s, i) => s + i.amount, 0);

  function submit() {
    const form = document.getElementById(formId) as HTMLFormElement | null;
    if (form && !form.reportValidity()) return;
    const picture = form
      ? String(new FormData(form).get('packagePicture') ?? '')
      : '';
    startTransition(async () => {
      const result = await createPackageWithArrivalsAction({
        numberOfTracking: tracking,
        agencyName: agency,
        arrivalDate,
        packagePicture: picture,
        alreadyArrived: arrived,
        items,
      });
      if (result.ok && result.id) {
        const bagsText = describeBags(result.bags);
        toast.success(items.length > 0 ? 'Paquete creado y llegadas registradas' : 'Paquete creado', {
          description: `${tracking}${
            items.length > 0
              ? ` · ${items.length} producto${items.length === 1 ? '' : 's'} · ${units} unidad${units === 1 ? '' : 'es'}`
              : ''
          }${bagsText ? `. En bolsas: ${bagsText}` : ''}.`,
        });
        router.push(`/packages/${result.id}`);
      } else if (!result.ok) {
        setFieldErrors(result.fieldErrors ?? {});
        toast.error('No se pudo crear el paquete', { description: result.error });
        router.refresh();
      }
    });
  }

  return (
    <div className="space-y-5">
      <div className="animate-in fade-in slide-in-from-top-1 duration-300">
        <Link
          href="/packages"
          className="inline-flex items-center gap-1 rounded-md text-sm text-muted transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" aria-hidden />
          Volver a paquetes
        </Link>
      </div>

      <PageHeader
        icon={Box}
        title="Nuevo paquete"
        subtitle="Registra el bulto y marca en la misma pantalla qué productos llegaron en él"
      />

      {/* -------- 1. Datos del paquete -------- */}
      <form id={formId} onSubmit={(e) => e.preventDefault()} className="surface-card space-y-4 p-4 sm:p-5">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <Box className="h-4 w-4 text-accent" aria-hidden />
          1 · Datos del paquete
        </h2>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Número de tracking" required error={fieldErrors['numberOfTracking']}>
            <TextInput
              value={tracking}
              onChange={(e) => setTracking(e.target.value)}
              required
              maxLength={100}
              invalid={!!fieldErrors['numberOfTracking']}
              className="font-mono"
            />
          </Field>
          <Field label="Nombre de la agencia" required error={fieldErrors['agencyName']}>
            <TextInput
              value={agency}
              onChange={(e) => setAgency(e.target.value)}
              required
              maxLength={100}
              invalid={!!fieldErrors['agencyName']}
            />
          </Field>
          <Field label="Fecha de llegada" required error={fieldErrors['arrivalDate']}>
            <TextInput
              type="date"
              value={arrivalDate}
              onChange={(e) => setArrivalDate(e.target.value)}
              required
            />
          </Field>
          <div className="flex items-end">
            <Checkbox
              isSelected={arrived}
              onChange={setArrived}
              className="w-fit rounded-lg border border-border px-3 py-2 transition-colors hover:bg-surface-hover"
            >
              <Checkbox.Content>
                <Checkbox.Control>
                  <Checkbox.Indicator />
                </Checkbox.Control>
                <Label className="text-sm font-medium text-foreground">
                  Ya está en el almacén
                </Label>
              </Checkbox.Content>
            </Checkbox>
          </div>
        </div>
        <ImageUploadField
          name="packagePicture"
          label="Foto del paquete (opcional)"
          capture="environment"
          buttonLabel="Tomar o subir una foto"
        />
      </form>

      {/* -------- 2. Qué llegó -------- */}
      <section className="space-y-3">
        <h2 className="flex items-center gap-2 text-sm font-semibold text-foreground">
          <PackageOpen className="h-4 w-4 text-accent" aria-hidden />
          2 · ¿Qué llegó en este paquete?
          <span className="text-xs font-normal text-muted">
            (opcional: puedes marcarlo después)
          </span>
        </h2>
        <ArrivalChecklist
          candidates={candidates}
          truncated={truncated}
          categories={categories}
          canWrite
          onCollect={onCollect}
        />
      </section>

      <ChecklistSubmitBar
        title="Paquete"
        summary={
          items.length > 0
            ? `${tracking || 'Sin tracking'} · ${items.length} producto${items.length === 1 ? '' : 's'} · ${units} unidad${units === 1 ? '' : 'es'}`
            : `${tracking || 'Sin tracking'} · sin llegadas marcadas`
        }
        hints={
          <span>
            {items.length > 0
              ? 'Cada producto caerá en la bolsa de su cliente y categoría; el paquete quedará «Recibido».'
              : 'Podrás marcar las llegadas desde el detalle del paquete o en «Preparar entregas».'}
          </span>
        }
        label={items.length > 0 ? 'Crear paquete y registrar llegadas' : 'Crear paquete'}
        icon={PackageCheck}
        isPending={isPending}
        disabled={!tracking.trim() || !agency.trim()}
        onSubmit={submit}
      />
    </div>
  );
}
