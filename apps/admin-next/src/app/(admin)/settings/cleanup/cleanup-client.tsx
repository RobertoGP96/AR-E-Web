'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import {
  Bell,
  DatabaseBackup,
  Eraser,
  FileText,
  Package,
  Receipt,
  Scale,
  Shapes,
  ShoppingCart,
  Store,
  Trash2,
  TriangleAlert,
  Truck,
  Users,
  Workflow,
  type LucideIcon,
} from 'lucide-react';
import { AlertDialog, Button, Spinner } from '@heroui/react';
import { toast } from '@/lib/toast';
import { TextInput } from '@/components/ui';
import { purgeDataAction, type PurgeScope } from './actions';

export interface CleanupCounts {
  orders: number;
  products: number;
  purchases: number;
  purchaseRows: number;
  packages: number;
  packageRows: number;
  deliveries: number;
  deliveryRows: number;
  expenses: number;
  invoices: number;
  invoiceRows: number;
  balances: number;
  notifications: number;
  notificationsDone: number;
  shops: number;
  accounts: number;
  categories: number;
  clients: number;
}

interface PurgeTarget {
  scope: PurgeScope;
  title: string;
  description: string;
  /** Palabra que hay que escribir para habilitar el borrado. */
  challenge?: string;
  total: number;
}

const numberFormat = new Intl.NumberFormat('es');

/** Tarjeta de un ámbito de limpieza con sus conteos y su botón. */
function PurgeCard({
  icon: Icon,
  title,
  description,
  stats,
  note,
  children,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  stats: { label: string; value: number }[];
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="surface-card flex flex-col p-5">
      <div className="flex items-center gap-2.5 border-b border-separator pb-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-danger-soft text-danger">
          <Icon className="h-4 w-4" aria-hidden />
        </span>
        <h2 className="text-base font-semibold tracking-tight text-foreground">
          {title}
        </h2>
      </div>
      <div className="mt-4 flex-1 space-y-3">
        <p className="text-sm text-muted">{description}</p>
        <ul className="flex flex-wrap gap-1.5">
          {stats.map((s) => (
            <li
              key={s.label}
              className="rounded-full bg-default px-2.5 py-1 text-xs font-medium text-muted"
            >
              {s.label}{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {numberFormat.format(s.value)}
              </span>
            </li>
          ))}
        </ul>
        {note ? (
          <p className="flex items-start gap-1.5 rounded-lg bg-default px-3 py-2 text-xs text-muted">
            <TriangleAlert
              className="mt-0.5 h-3.5 w-3.5 shrink-0"
              aria-hidden
            />
            {note}
          </p>
        ) : null}
      </div>
      <div className="mt-4 flex flex-wrap justify-end gap-2">{children}</div>
    </section>
  );
}

/**
 * Confirmación de vaciado. Cuando el ámbito tiene `challenge`, exige
 * escribir la palabra exacta antes de habilitar el botón.
 */
function PurgeModal({
  isOpen,
  target,
  onClose,
  onDone,
}: {
  isOpen: boolean;
  /** Se conserva durante la animación de cierre del diálogo. */
  target: PurgeTarget | null;
  onClose: () => void;
  onDone: () => void;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [typed, setTyped] = useState('');

  const challengeMet =
    !target?.challenge || typed.trim().toUpperCase() === target.challenge;

  function close() {
    if (isPending) return;
    setError(null);
    setTyped('');
    onClose();
  }

  function confirm() {
    if (!target || !challengeMet) return;
    setError(null);
    startTransition(async () => {
      const result = await purgeDataAction(target.scope);
      if (result.ok) {
        toast.success('Limpieza completada', {
          description: `Se eliminaron ${numberFormat.format(
            result.deleted
          )} registros.`,
        });
        setTyped('');
        onClose();
        onDone();
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <AlertDialog.Backdrop
      isOpen={isOpen}
      onOpenChange={(open) => {
        if (!open) close();
      }}
      isDismissable={!isPending}
      isKeyboardDismissDisabled={isPending}
    >
      <AlertDialog.Container size="sm" placement="auto">
        <AlertDialog.Dialog>
          <AlertDialog.Header>
            <AlertDialog.Icon status="danger" />
            <AlertDialog.Heading>{target?.title}</AlertDialog.Heading>
            <p className="text-sm text-muted">
              {target?.description} Se eliminarán{' '}
              <span className="font-semibold tabular-nums text-foreground">
                {numberFormat.format(target?.total ?? 0)}
              </span>{' '}
              registros de forma permanente. Esta acción no se puede
              deshacer.
            </p>
          </AlertDialog.Header>
          {target?.challenge || error ? (
            <AlertDialog.Body>
              {target?.challenge ? (
                <label className="block space-y-1.5">
                  <span className="field-label">
                    Escribe{' '}
                    <span className="font-semibold text-danger">
                      {target.challenge}
                    </span>{' '}
                    para confirmar
                  </span>
                  <TextInput
                    value={typed}
                    onChange={(e) => setTyped(e.target.value)}
                    placeholder={target.challenge}
                    autoComplete="off"
                    disabled={isPending}
                  />
                </label>
              ) : null}
              {error ? (
                <p
                  role="alert"
                  className="rounded-lg bg-danger-soft px-3 py-2 text-sm font-medium text-danger-soft-foreground"
                >
                  {error}
                </p>
              ) : null}
            </AlertDialog.Body>
          ) : null}
          <AlertDialog.Footer>
            <Button variant="tertiary" onPress={close} isDisabled={isPending}>
              Cancelar
            </Button>
            <Button
              variant="danger"
              onPress={confirm}
              isDisabled={isPending || !challengeMet}
            >
              {isPending ? (
                <>
                  <Spinner size="sm" aria-hidden />
                  Eliminando…
                </>
              ) : (
                'Eliminar'
              )}
            </Button>
          </AlertDialog.Footer>
        </AlertDialog.Dialog>
      </AlertDialog.Container>
    </AlertDialog.Backdrop>
  );
}

export function CleanupClient({ counts: c }: { counts: CleanupCounts }) {
  const router = useRouter();
  // El target sobrevive al cierre para que el diálogo no se vacíe
  // durante su animación de salida.
  const [target, setTarget] = useState<PurgeTarget | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  function openPurge(t: PurgeTarget) {
    setTarget(t);
    setIsOpen(true);
  }

  const operationsTotal =
    c.orders +
    c.products +
    c.purchases +
    c.purchaseRows +
    c.packages +
    c.packageRows +
    c.deliveries +
    c.deliveryRows;
  const everythingTotal =
    operationsTotal +
    c.expenses +
    c.invoices +
    c.invoiceRows +
    c.balances +
    c.notifications +
    c.shops +
    c.accounts +
    c.categories +
    c.clients;

  function purgeButton(t: PurgeTarget, label = 'Vaciar') {
    return (
      <Button
        variant="danger"
        size="sm"
        isDisabled={t.total === 0}
        onPress={() => openPurge(t)}
      >
        <Trash2 className="h-4 w-4" aria-hidden />
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-5">
      <section className="surface-card flex flex-wrap items-center gap-3 border-danger/30 bg-danger-soft/40 p-4">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-danger text-white">
          <TriangleAlert className="h-4.5 w-4.5" aria-hidden />
        </span>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-semibold text-foreground">
            Zona de riesgo: los borrados son permanentes
          </h2>
          <p className="text-xs text-muted">
            Antes de vaciar cualquier dato descarga una salva completa desde
            Configuración → Datos. El personal y los parámetros del sistema
            nunca se eliminan desde aquí.
          </p>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onPress={() => router.push('/settings/data')}
        >
          <DatabaseBackup className="h-4 w-4" aria-hidden />
          Descargar salva
        </Button>
      </section>

      <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
        <PurgeCard
          icon={Workflow}
          title="Flujo de operaciones"
          description="Órdenes con sus productos, compras, paquetes y entregas: todo el ciclo operativo del negocio."
          stats={[
            { label: 'Órdenes', value: c.orders },
            { label: 'Productos', value: c.products },
            { label: 'Compras', value: c.purchases + c.purchaseRows },
            { label: 'Paquetes', value: c.packages + c.packageRows },
            { label: 'Entregas', value: c.deliveries + c.deliveryRows },
          ]}
        >
          {purgeButton({
            scope: 'operations',
            title: '¿Vaciar el flujo de operaciones?',
            description:
              'Se eliminarán todas las órdenes, productos, compras, paquetes y entregas.',
            challenge: 'ELIMINAR',
            total: operationsTotal,
          })}
        </PurgeCard>

        <PurgeCard
          icon={ShoppingCart}
          title="Compras"
          description="Recibos de compra en tiendas y sus renglones."
          stats={[
            { label: 'Recibos', value: c.purchases },
            { label: 'Renglones', value: c.purchaseRows },
          ]}
          note="Los contadores de comprado de los productos vuelven a cero y su estado se recalcula."
        >
          {purgeButton({
            scope: 'purchases',
            title: '¿Vaciar las compras?',
            description:
              'Se eliminarán los recibos de compra y sus renglones, y los productos volverán a estado sin comprar.',
            challenge: 'ELIMINAR',
            total: c.purchases + c.purchaseRows,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Package}
          title="Paquetes"
          description="Paquetes con tracking y sus productos recibidos."
          stats={[
            { label: 'Paquetes', value: c.packages },
            { label: 'Renglones', value: c.packageRows },
          ]}
          note="Los contadores de recibido de los productos vuelven a cero y su estado se recalcula."
        >
          {purgeButton({
            scope: 'packages',
            title: '¿Vaciar los paquetes?',
            description:
              'Se eliminarán los paquetes y sus productos recibidos, y los productos volverán a estado sin recibir.',
            challenge: 'ELIMINAR',
            total: c.packages + c.packageRows,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Truck}
          title="Entregas"
          description="Recibos de entrega a clientes y sus renglones."
          stats={[
            { label: 'Recibos', value: c.deliveries },
            { label: 'Renglones', value: c.deliveryRows },
          ]}
          note="Los contadores de entregado de los productos vuelven a cero y su estado se recalcula."
        >
          {purgeButton({
            scope: 'deliveries',
            title: '¿Vaciar las entregas?',
            description:
              'Se eliminarán los recibos de entrega y sus renglones, y los productos volverán a estado sin entregar.',
            challenge: 'ELIMINAR',
            total: c.deliveries + c.deliveryRows,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Receipt}
          title="Gastos"
          description="Registro de gastos operativos del negocio."
          stats={[{ label: 'Gastos', value: c.expenses }]}
        >
          {purgeButton({
            scope: 'expenses',
            title: '¿Vaciar los gastos?',
            description: 'Se eliminará todo el registro de gastos operativos.',
            challenge: 'ELIMINAR',
            total: c.expenses,
          })}
        </PurgeCard>

        <PurgeCard
          icon={FileText}
          title="Costos de envío"
          description="Facturas de costos de envío y sus renglones."
          stats={[
            { label: 'Facturas', value: c.invoices },
            { label: 'Renglones', value: c.invoiceRows },
          ]}
        >
          {purgeButton({
            scope: 'invoices',
            title: '¿Vaciar los costos de envío?',
            description:
              'Se eliminarán todas las facturas de costos de envío con sus renglones.',
            challenge: 'ELIMINAR',
            total: c.invoices + c.invoiceRows,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Scale}
          title="Balances"
          description="Balances generales por período."
          stats={[{ label: 'Balances', value: c.balances }]}
        >
          {purgeButton({
            scope: 'balances',
            title: '¿Vaciar los balances?',
            description: 'Se eliminarán todos los balances por período.',
            challenge: 'ELIMINAR',
            total: c.balances,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Bell}
          title="Notificaciones"
          description="Notificaciones generadas por el sistema para usuarios y personal."
          stats={[
            { label: 'Total', value: c.notifications },
            { label: 'Leídas o caducadas', value: c.notificationsDone },
          ]}
        >
          <Button
            variant="ghost"
            size="sm"
            isDisabled={c.notificationsDone === 0}
            onPress={() =>
              openPurge({
                scope: 'notifications-read',
                title: '¿Eliminar las notificaciones leídas y caducadas?',
                description:
                  'Se conservarán las notificaciones pendientes de leer.',
                total: c.notificationsDone,
              })
            }
          >
            Leídas y caducadas
          </Button>
          {purgeButton(
            {
              scope: 'notifications',
              title: '¿Eliminar todas las notificaciones?',
              description:
                'Se eliminarán también las notificaciones sin leer.',
              challenge: 'ELIMINAR',
              total: c.notifications,
            },
            'Todas'
          )}
        </PurgeCard>

        <PurgeCard
          icon={Store}
          title="Tiendas y cuentas"
          description="Catálogo de tiendas y sus cuentas de compra."
          stats={[
            { label: 'Tiendas', value: c.shops },
            { label: 'Cuentas', value: c.accounts },
          ]}
          note="Requiere que no existan productos ni compras: vacía primero el flujo de operaciones."
        >
          {purgeButton({
            scope: 'shops',
            title: '¿Vaciar las tiendas?',
            description:
              'Se eliminarán todas las tiendas del catálogo y sus cuentas de compra.',
            challenge: 'ELIMINAR',
            total: c.shops + c.accounts,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Shapes}
          title="Categorías"
          description="Categorías de envío con sus costos por libra."
          stats={[{ label: 'Categorías', value: c.categories }]}
          note="Los productos y entregas existentes quedarán sin categoría asignada."
        >
          {purgeButton({
            scope: 'categories',
            title: '¿Vaciar las categorías?',
            description:
              'Se eliminarán todas las categorías; los productos y entregas quedarán sin categoría.',
            challenge: 'ELIMINAR',
            total: c.categories,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Users}
          title="Clientes"
          description="Cuentas de usuario con rol cliente y sus notificaciones. El personal nunca se elimina."
          stats={[{ label: 'Clientes', value: c.clients }]}
          note="Requiere que no existan órdenes ni entregas: vacía primero el flujo de operaciones."
        >
          {purgeButton({
            scope: 'clients',
            title: '¿Eliminar todas las cuentas de clientes?',
            description:
              'Se eliminarán las cuentas con rol cliente y sus notificaciones.',
            challenge: 'ELIMINAR',
            total: c.clients,
          })}
        </PurgeCard>

        <PurgeCard
          icon={Eraser}
          title="Limpieza total"
          description="Deja el sistema vacío: operaciones, finanzas, notificaciones, catálogos y clientes. Solo se conservan el personal y los parámetros del sistema."
          stats={[{ label: 'Registros en total', value: everythingTotal }]}
        >
          {purgeButton(
            {
              scope: 'all',
              title: '¿Limpiar todos los datos del sistema?',
              description:
                'Se eliminará todo excepto las cuentas del personal y los parámetros del sistema.',
              challenge: 'ELIMINAR TODO',
              total: everythingTotal,
            },
            'Limpiar todo'
          )}
        </PurgeCard>
      </div>

      <PurgeModal
        isOpen={isOpen}
        target={target}
        onClose={() => setIsOpen(false)}
        onDone={() => router.refresh()}
      />
    </div>
  );
}
