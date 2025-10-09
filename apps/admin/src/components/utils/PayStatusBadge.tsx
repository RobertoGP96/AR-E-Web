
import React from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import type { PayStatus } from "@/types";

interface Props {
  status: PayStatus;
}

const statusConfig: Record<PayStatus, { color: string; label: string; icon: React.ElementType }> = {
  "No pagado": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "No pagado",
    icon: CircleAlert
  },
  "Pagado": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Pagado",
    icon: CheckCircle2
  },
  "Parcial": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Parcial",
    icon: Loader2
  }
};

const PayStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig["No pagado"];
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

export default PayStatusBadge;
