import React from "react";
import { CheckCircle2, Truck, XCircle, LoaderIcon } from "lucide-react";
import type { OrderStatus } from "@/types";

interface Props {
  status: OrderStatus;
}

const statusConfig: Record<OrderStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Encargado": {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "Encargado",
    icon: Truck
  },
  "Procesando": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Procesando",
    icon: LoaderIcon
  },
  "Completado": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Completado",
    icon: CheckCircle2
  },
  "Cancelado": {
    color: "bg-red-100 text-red-800 border-red-300",
    label: "Cancelado",
    icon: XCircle
  }
};

const OrderStatusBadge: React.FC<Props> = ({ status }) => {
  const config = statusConfig[status] || statusConfig["Encargado"];
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

export default OrderStatusBadge;
