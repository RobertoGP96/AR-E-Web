import React from "react";
import { XCircle, CheckCircle,PackageCheck, HelpCircle, Circle } from "lucide-react";

interface StatusBadgeProps {
    status: string;
}


const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    "No pagado": {
        color: "bg-red-400 text-white",
        label: "No pagado",
        icon: <XCircle className="inline-block mr-1 h-4 w-4" />,
    },
    "Pagado": {
        color: "bg-green-500 text-white",
        label: "Pagado",
        icon: <CheckCircle className="inline-block mr-1 h-4 w-4" />,
    },
    "Procesando": {
        color: "bg-yellow-400 text-black",
        label: "Procesando",
        icon: <Circle className="inline-block mr-1 h-4 w-4" />,
    },
    "Entregado": {
        color: "bg-blue-500 text-white",
        label: "Entregado",
        icon: <PackageCheck className="inline-block mr-1 h-4 w-4" />,
    },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const config = statusConfig[status] || {
        color: "bg-gray-300 text-black",
        label: status,
        icon: <HelpCircle className="inline-block mr-1 h-4 w-4" />,
    };
    return (
        <div className="flex flex-row">
            <span
                className={`px-2 py-1 rounded-full text-xs font-semibold flex items-center gap-1 ${config.color}`}
                title={config.label}
            >
                {config.icon}
                {config.label}
            </span>
        </div>
    );
};
