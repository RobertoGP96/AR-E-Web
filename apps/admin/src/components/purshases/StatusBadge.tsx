import React from "react";
import { XCircle, CheckCircle, HelpCircle, Circle } from "lucide-react";

interface StatusBadgeProps {
    status: string;
}


const statusConfig: Record<string, { color: string; label: string; icon: React.ReactNode }> = {
    "no pagado": {
        color: "bg-red-400 text-white",
        label: "No pagado",
        icon: <XCircle className="inline-block mr-1 h-4 w-4" />,
    },
    "pagado": {
        color: "bg-green-500 text-white",
        label: "Pagado",
        icon: <CheckCircle className="inline-block mr-1 h-4 w-4" />,
    },
    "parcial": {
        color: "bg-yellow-400 text-black",
        label: "Parcial",
        icon: <Circle className="inline-block mr-1 h-4 w-4" />,
    },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
    const normalizedStatus = status.toLowerCase();
    const config = statusConfig[normalizedStatus] || {
        color: "bg-gray-300 text-black",
        label: status,
        icon: <HelpCircle className="inline-block mr-1 h-4 w-4" />,
    };
    return (
        <div className="flex flex-row">
            <span
                className={`px-2 py-1 rounded-full capitalize text-xs font-semibold flex items-center gap-1 ${config.color}`}
                title={config.label}
            >
                {config.icon}
                {config.label}
            </span>
        </div>
    );
};
