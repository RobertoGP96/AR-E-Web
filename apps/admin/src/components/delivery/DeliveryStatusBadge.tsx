import React from "react";
import { Clock, Truck, CheckCircle2, XCircle } from "lucide-react";
import type { DeliveryStatus } from "@/types";

interface Props {
  status: DeliveryStatus;
}

const statusConfig: Record<DeliveryStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Pendiente": {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    label: "Pendiente",
    icon: Clock
  },
  "En transito": {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "En tránsito",
    icon: Truck
  },
  "Entregado": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Entregado",
    icon: CheckCircle2
  },
  "Fallida": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "Fallida",
    icon: XCircle
  }
};

const DeliveryStatusBadge: React.FC<Props> = ({ status }) => {
  // Normalizar el estado: primera letra mayúscula, resto minúsculas (excepto "En transito")
  let normalizedStatus: DeliveryStatus;
  
  if (!status) {
    normalizedStatus = "Pendiente";
  } else {
    const lower = status.toLowerCase();
    if (lower === 'en transito' || lower === 'en tránsito') {
      normalizedStatus = "En transito";
    } else {
      normalizedStatus = (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as DeliveryStatus;
    }
  }
  
  const config = statusConfig[normalizedStatus] || statusConfig["Pendiente"];
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
