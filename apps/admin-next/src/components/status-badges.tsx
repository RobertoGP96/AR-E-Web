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

// Status badges ported 1:1 from the Vite admin's *StatusBadge.tsx
// components (apps/admin/src/components): same pill shell, same
// per-status colors and icons.

const SHELL =
  'inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold';

interface BadgeConfig {
  color: string;
  icon: LucideIcon;
  label?: string;
}

function Badge({
  config,
  label,
}: {
  config: BadgeConfig;
  label: string;
}) {
  const Icon = config.icon;
  const text = config.label ?? label;
  return (
    <span className={`${SHELL} ${config.color}`} title={text}>
      <Icon size={16} className="inline-block" aria-hidden />
      {text}
    </span>
  );
}

const ORDER_STATUS: Record<string, BadgeConfig> = {
  Encargado: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Truck,
  },
  Procesando: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: LoaderIcon,
  },
  Completado: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  Cancelado: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
};

export function OrderStatusBadge({ status }: { status: string }) {
  const config = ORDER_STATUS[status] ?? ORDER_STATUS.Encargado;
  return <Badge config={config} label={status} />;
}

/** Pay status — the variant used in the Vite OrdersTable (PayStatusBadge). */
const PAY_STATUS: Record<string, BadgeConfig> = {
  'No pagado': {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: CircleAlert,
  },
  Pagado: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  Parcial: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: Loader2,
  },
};

export function PayStatusBadge({ status }: { status: string }) {
  const config = PAY_STATUS[status] ?? PAY_STATUS['No pagado'];
  return <Badge config={config} label={status} />;
}

const DELIVERY_STATUS: Record<string, BadgeConfig> = {
  Pendiente: {
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: Clock,
  },
  'En transito': {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Truck,
    label: 'En tránsito',
  },
  Entregado: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  Fallida: {
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: XCircle,
  },
};

export function DeliveryStatusBadge({ status }: { status: string }) {
  const config = DELIVERY_STATUS[status] ?? DELIVERY_STATUS.Pendiente;
  return <Badge config={config} label={status} />;
}

const PACKAGE_STATUS: Record<string, BadgeConfig> = {
  Enviado: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: Truck,
  },
  Recibido: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: LoaderIcon,
  },
  Procesado: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
};

export function PackageStatusBadge({ status }: { status: string }) {
  const config = PACKAGE_STATUS[status] ?? PACKAGE_STATUS.Enviado;
  return <Badge config={config} label={status} />;
}

/** Product pipeline status (colors follow the same family scheme). */
const PRODUCT_STATUS: Record<string, BadgeConfig> = {
  Encargado: {
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: ShoppingBag,
  },
  Comprado: {
    color: 'bg-green-100 text-green-800 border-green-300',
    icon: CheckCircle2,
  },
  Recibido: {
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    icon: PackageCheck,
  },
  Entregado: {
    color: 'bg-cyan-100 text-cyan-800 border-cyan-300',
    icon: Truck,
  },
};

export function ProductStatusBadge({ status }: { status: string }) {
  const config = PRODUCT_STATUS[status] ?? PRODUCT_STATUS.Encargado;
  return <Badge config={config} label={status} />;
}

/**
 * Solid-fill pay badge used by Purchases, ported from the Vite
 * purshases/StatusBadge.tsx (no border, white/black text on fill).
 */
const PURCHASE_PAY: Record<string, { color: string; icon: LucideIcon }> = {
  'no pagado': { color: 'bg-red-400 text-white', icon: XCircle },
  pagado: { color: 'bg-green-500 text-white', icon: CheckCircle2 },
  parcial: { color: 'bg-yellow-400 text-black', icon: Loader2 },
};

export function PurchasePayBadge({ status }: { status: string }) {
  const config = PURCHASE_PAY[status.toLowerCase()];
  const Icon = config?.icon ?? CircleAlert;
  return (
    <span
      className={`flex w-fit flex-row items-center gap-1 rounded-full px-2 py-1 text-xs font-semibold capitalize ${config?.color ?? 'bg-gray-300 text-black'}`}
      title={status}
    >
      <Icon className="mr-1 inline-block h-4 w-4" aria-hidden />
      {status}
    </span>
  );
}
