import React from "react";
import { CheckCircle2, Clock, AlertCircle, XCircle } from "lucide-react";

type PaymentStatus = "Pagado" | "Pendiente" | "Parcial" | "Cancelado" | "No pagado";

interface Props {
  status: PaymentStatus;
}

const paymentStatusConfig: Record<PaymentStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Pagado": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Pagado",
    icon: CheckCircle2
  },
  "Pendiente": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Pendiente",
    icon: Clock
  },
  "Parcial": {
    color: "bg-orange-100 text-orange-800 border-orange-300",
    label: "Parcial",
    icon: AlertCircle
  },
  "Cancelado": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "Cancelado",
    icon: XCircle
  },
  "No pagado": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "No pagado",
    icon: XCircle
  }
};

const PaymentStatusBadge: React.FC<Props> = ({ status }) => {
  const config = paymentStatusConfig[status] || paymentStatusConfig["Pendiente"];
  const Icon = config.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full border text-xs font-semibold ${config.color}`}
      title={config.label}
    >
      <Icon size={16} className="inline-block" />
      {config.label}
    </span>
  );
};

export default PaymentStatusBadge;