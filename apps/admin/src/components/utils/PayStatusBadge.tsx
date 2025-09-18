
import React from "react";
import { CheckCircle2, CircleAlert, Loader2 } from "lucide-react";
import type { PayStatus } from "@/types";

interface Props {
  status: PayStatus;
}

const statusConfig: Record<PayStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Unpaid": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "No pagado",
    icon: CircleAlert
  },
  "Paid": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Pagado",
    icon: CheckCircle2
  },
  "Partial": {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    label: "Parcial",
    icon: Loader2
  }
};

const PayStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig["Unpaid"];
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
