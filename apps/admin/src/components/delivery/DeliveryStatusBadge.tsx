import React from "react";
import { Send, CheckCircle2, Truck } from "lucide-react";
import type { DeliveryStatus } from "@/types";

interface Props {
  status: DeliveryStatus;
}

const statusConfig: Record<DeliveryStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Sent": {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    label: "Enviado",
    icon: Send
  },
  "Delivered": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Entregado",
    icon: CheckCircle2
  },
  "In Transit": {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "En tránsito",
    icon: Truck
  }
};

const DeliveryStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig["Sent"];
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

export default DeliveryStatusBadge;
