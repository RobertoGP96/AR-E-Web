'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ArrowRight,
  DatabaseBackup,
  FileDown,
  FileSpreadsheet,
  FileText,
  Lock,
  ShieldCheck,
  Upload,
} from 'lucide-react';
import { Button, Checkbox, Label } from '@heroui/react';
import { toast } from '@/lib/toast';
import { Select } from '@/components/ui';
import type { LucideIcon } from 'lucide-react';

export interface ExportableEntity {
  key: string;
  label: string;
  description: string;
  count: number;
}

function SectionCard({
  icon: Icon,
  title,
  subtitle,
  children,
  className,
}: {
  icon: LucideIcon;
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`surface-card p-5 ${className ?? ''}`}>
      <div className="flex items-center gap-2.5 border-b border-separator pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <div>
          <h2 className="text-base font-semibold tracking-tight text-foreground">
            {title}
          </h2>
          <p className="text-xs text-muted">{subtitle}</p>
        </div>
      </div>
      <div className="mt-4">{children}</div>
    </section>
  );
}

/** Dispara la descarga de un endpoint con Content-Disposition. */
function download(url: string) {
  const a = document.createElement('a');
  a.href = url;
  a.rel = 'noopener';
  document.body.appendChild(a);
  a.click();
  a.remove();
}

const numberFormat = new Intl.NumberFormat('es');

export function DataClient({
  entities,
  canImport,
}: {
  entities: ExportableEntity[];
  canImport: boolean;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Set<string>>(
    () => new Set(entities.map((e) => e.key))
  );
  const [csvKey, setCsvKey] = useState(entities[0]?.key ?? '');

  const totalRecords = entities.reduce((acc, e) => acc + e.count, 0);
  const allSelected = selected.size === entities.length;

  function toggle(key: string, include: boolean) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (include) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function handleBackup() {
    toast.success('Preparando la salva…', {
      description: 'La descarga comenzará en unos segundos.',
    });
    download('/settings/data/export?format=json');
  }

  function handleExcel() {
    if (selected.size === 0) {
      toast.error('Marca al menos una entidad para exportar.');
      return;
    }
    toast.success('Generando el libro de Excel…', {
      description: 'La descarga comenzará en unos segundos.',
    });
    download(
      `/settings/data/export?format=xlsx&entities=${[...selected].join(',')}`
    );
  }

  function handleCsv() {
    if (!csvKey) return;
    toast.success('Generando el CSV…', {
      description: 'La descarga comenzará en unos segundos.',
    });
    download(`/settings/data/export?format=csv&entities=${csvKey}`);
  }

  return (
    <div className="grid items-start gap-5 lg:grid-cols-2">
      <SectionCard
        icon={DatabaseBackup}
        title="Salva completa"
        subtitle="Copia de seguridad de todos los datos en un archivo JSON"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            Descarga un archivo con las{' '}
            <span className="font-semibold text-foreground">
              {entities.length} entidades
            </span>{' '}
            del sistema (
            <span className="font-semibold tabular-nums text-foreground">
              {numberFormat.format(totalRecords)}
            </span>{' '}
            registros). Guárdala en un lugar seguro: sirve como respaldo
            histórico y para restaurar información con ayuda del soporte.
          </p>
          <p className="flex items-start gap-1.5 rounded-lg bg-default px-3 py-2 text-xs text-muted">
            <ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
            Por seguridad la salva nunca incluye contraseñas ni secretos de
            verificación de los usuarios.
          </p>
          <div className="flex justify-end">
            <Button variant="primary" onPress={handleBackup}>
              <FileDown className="h-4 w-4" aria-hidden />
              Descargar salva (JSON)
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={Upload}
        title="Importar datos"
        subtitle="Incorpora información desde los libros de embarque"
      >
        <div className="space-y-4">
          <p className="text-sm text-muted">
            La vía de importación del sistema son los libros de Excel
            &quot;AR&amp;E Shipps #NNN&quot;: se analizan, se revisa lo
            detectado y solo se guarda lo que confirmes. Las salvas JSON no se
            restauran desde el panel; para eso contacta al soporte.
          </p>
          {canImport ? (
            <div className="flex justify-end">
              <Button
                variant="primary"
                onPress={() => router.push('/settings/import')}
              >
                Ir a Importar Excel
                <ArrowRight className="h-4 w-4" aria-hidden />
              </Button>
            </div>
          ) : (
            <p className="flex items-start gap-1.5 rounded-lg bg-default px-3 py-2 text-xs text-muted">
              <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
              Solo el rol administrador puede importar libros de Excel.
            </p>
          )}
        </div>
      </SectionCard>

      <SectionCard
        icon={FileSpreadsheet}
        title="Exportar a Excel"
        subtitle="Un libro .xlsx con una hoja por cada entidad marcada"
        className="lg:col-span-2"
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-muted">
              {selected.size} de {entities.length} entidades marcadas
            </p>
            <Button
              variant="ghost"
              size="sm"
              onPress={() =>
                setSelected(
                  allSelected
                    ? new Set()
                    : new Set(entities.map((e) => e.key))
                )
              }
            >
              {allSelected ? 'Desmarcar todo' : 'Marcar todo'}
            </Button>
          </div>
          <ul className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
            {entities.map((e) => (
              <li key={e.key}>
                <Checkbox
                  isSelected={selected.has(e.key)}
                  onChange={(v: boolean) => toggle(e.key, v)}
                  className="w-full rounded-xl border border-separator px-3 py-2.5 transition-colors hover:bg-accent-soft/20"
                >
                  <Checkbox.Content>
                    <Checkbox.Control>
                      <Checkbox.Indicator />
                    </Checkbox.Control>
                    <Label className="min-w-0 flex-1 text-sm">
                      <span className="flex items-center justify-between gap-2 font-medium text-foreground">
                        {e.label}
                        <span className="shrink-0 rounded-full bg-default px-2 py-0.5 text-[11px] font-semibold tabular-nums text-muted">
                          {numberFormat.format(e.count)}
                        </span>
                      </span>
                      <span className="mt-0.5 block text-xs font-normal text-muted">
                        {e.description}
                      </span>
                    </Label>
                  </Checkbox.Content>
                </Checkbox>
              </li>
            ))}
          </ul>
          <div className="flex justify-end">
            <Button
              variant="primary"
              isDisabled={selected.size === 0}
              onPress={handleExcel}
            >
              <FileDown className="h-4 w-4" aria-hidden />
              Descargar Excel ({selected.size}{' '}
              {selected.size === 1 ? 'hoja' : 'hojas'})
            </Button>
          </div>
        </div>
      </SectionCard>

      <SectionCard
        icon={FileText}
        title="Exportar CSV"
        subtitle="Una entidad en un archivo separado por punto y coma"
        className="lg:col-span-2"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="w-full max-w-xs">
            <Select
              aria-label="Entidad a exportar"
              value={csvKey}
              onChange={(e) => setCsvKey(e.target.value)}
            >
              {entities.map((e) => (
                <option key={e.key} value={e.key}>
                  {e.label} ({numberFormat.format(e.count)})
                </option>
              ))}
            </Select>
          </div>
          <Button variant="ghost" onPress={handleCsv} isDisabled={!csvKey}>
            <FileDown className="h-4 w-4" aria-hidden />
            Descargar CSV
          </Button>
        </div>
      </SectionCard>
    </div>
  );
}
