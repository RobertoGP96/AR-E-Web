import React from "react";
import { Truck, LoaderIcon, CheckCircle2 } from "lucide-react";
import type { PackageStatus } from "@/types";

interface Props {
  status: PackageStatus;
}

const statusConfig: Record<PackageStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Enviado": {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "Enviado",
    icon: Truck
  },
  "Recibido": {
    color: "bg-yellow-100 text-yellow-800 border-yellow-300",
    label: "Recibido",
    icon: LoaderIcon
  },
  "Procesado": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Procesado",
    icon: CheckCircle2
  }
};

const PackageStatusBadge: React.FC<Props> = ({ status }) => {
  // Normalizar el estado: primera letra mayúscula, resto minúsculas
  const normalizedStatus = status 
    ? (status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()) as PackageStatus
    : "Enviado" as PackageStatus;
  
  const config = statusConfig[normalizedStatus] || statusConfig["Enviado"];
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

export default PackageStatusBadge;
