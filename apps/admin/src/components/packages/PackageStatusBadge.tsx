import React from "react";
import { Send, CheckCircle2, FileText } from "lucide-react";
import type { PackageStatus } from "@/types";

interface Props {
  status: PackageStatus;
}

const statusConfig: Record<PackageStatus, { color: string; label: string; icon: React.ElementType }> = {
  "Sent": {
    color: "bg-gray-100 text-gray-800 border-gray-300",
    label: "Enviado",
    icon: Send
  },
  "Received": {
    color: "bg-green-100 text-green-800 border-green-300",
    label: "Recibido",
    icon: CheckCircle2
  },
  "Processed": {
    color: "bg-blue-100 text-blue-800 border-blue-300",
    label: "Procesado",
    icon: FileText
  }
};

const PackageStatusBadge: React.FC<Props> = ({ status }) => {
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

export default PackageStatusBadge;
