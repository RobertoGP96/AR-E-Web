import {
  Truck,
  LoaderIcon,
  CheckCircle2,
  XCircle,
  Clock,
  CircleAlert,
  Loader2,
  ShoppingBag,
  PackageCheck,
  type LucideIcon,
} from 'lucide-react';
import { Chip } from '@heroui/react';

// Status chips of the design system (HeroUI Chip, soft variant): one
// semantic color per pipeline stage — default=idle, accent=in our
// flow, warning=mid-pipeline, success=done, danger=failed.

type ChipColor = 'accent' | 'default' | 'success' | 'warning' | 'danger';

interface BadgeConfig {
  color: ChipColor;
  icon: LucideIcon;
  label?: string;
}

function StatusChip({
  config,
  label,
  solid = false,
}: {
  config: BadgeConfig;
  label: string;
  solid?: boolean;
}) {
  const Icon = config.icon;
  const text = config.label ?? label;
  return (
    <Chip
      color={config.color}
      variant={solid ? 'primary' : 'soft'}
      size="sm"
      className="whitespace-nowrap"
      title={text}
    >
      <Icon className="h-3.5 w-3.5" aria-hidden />
      <Chip.Label>{text}</Chip.Label>
    </Chip>
  );
}

const ORDER_STATUS: Record<string, BadgeConfig> = {
  Encargado: { color: 'accent', icon: Truck },
  Procesando: { color: 'warning', icon: LoaderIcon },
  Completado: { color: 'success', icon: CheckCircle2 },
  Cancelado: { color: 'danger', icon: XCircle },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS[status] ?? ORDER_STATUS.Encargado;
  return <StatusChip config={config} label={status} />;
}

const PAY_STATUS: Record<string, BadgeConfig> = {
  'No pagado': { color: 'danger', icon: CircleAlert },
  Pagado: { color: 'success', icon: CheckCircle2 },
  Parcial: { color: 'warning', icon: Loader2 },
};

export function PayStatusBadge({ status }: { status: string }) {
  const config = PAY_STATUS[status] ?? PAY_STATUS['No pagado'];
  return <StatusChip config={config} label={status} />;
}

const DELIVERY_STATUS: Record<string, BadgeConfig> = {
  Pendiente: { color: 'default', icon: Clock },
  'En transito': { color: 'accent', icon: Truck, label: 'En tránsito' },
  Entregado: { color: 'success', icon: CheckCircle2 },
  Fallida: { color: 'danger', icon: XCircle },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = DELIVERY_STATUS[status] ?? DELIVERY_STATUS.Pendiente;
  return <StatusChip config={config} label={status} />;
}

const PACKAGE_STATUS: Record<string, BadgeConfig> = {
  Enviado: { color: 'accent', icon: Truck },
  Recibido: { color: 'warning', icon: LoaderIcon },
  Procesado: { color: 'success', icon: CheckCircle2 },
};

export function PackageStatusBadge({ status }: { status: string }) {
  const config = PACKAGE_STATUS[status] ?? PACKAGE_STATUS.Enviado;
  return <StatusChip config={config} label={status} />;
}

/** Product pipeline: Encargado → Comprado → Recibido → Entregado. */
const PRODUCT_STATUS: Record<string, BadgeConfig> = {
  Encargado: { color: 'default', icon: ShoppingBag },
  Comprado: { color: 'warning', icon: CheckCircle2 },
  Recibido: { color: 'accent', icon: PackageCheck },
  Entregado: { color: 'success', icon: Truck },
};

export function ProductStatusBadge({ status }: { status: string }) {
  const config = PRODUCT_STATUS[status] ?? PRODUCT_STATUS.Encargado;
  return <StatusChip config={config} label={status} />;
}

/** Solid-fill pay chip used by Purchases. */
const PURCHASE_PAY: Record<string, BadgeConfig> = {
  'no pagado': { color: 'danger', icon: XCircle },
  pagado: { color: 'success', icon: CheckCircle2 },
  parcial: { color: 'warning', icon: Loader2 },
};

export function PurchasePayBadge({ status }: { status: string }) {
  const config = PURCHASE_PAY[status.toLowerCase()] ?? {
    color: 'default' as const,
    icon: CircleAlert,
  };
  return (
    <span className="capitalize">
      <StatusChip config={config} label={status} solid />
    </span>
  );
}
