import React from "react";

import type { CustomUser } from "@/types";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { formatPhone } from "@/lib/format-phone";

interface Props {
    user: CustomUser;
}


const AvatarUser: React.FC<Props> = ({ user }) => {
    // Detecta si el usuario NO es cliente (ajusta la propiedad según tu modelo)
    const isNotClient = user && user.role && user.role !== "client";

    // Estilos condicionales para el avatar
    const avatarClass = `h-10 w-10 ${isNotClient ? "border-2 border-gray-500 bg-gradient-to-br from-gray-400 to-gray-200" : "bg-gradient-to-br from-orange-400 to-yellow-200"}`;

    return (
        <div className="flex items-center space-x-4">
            <Avatar className={avatarClass}>
                <AvatarFallback className={`font-semibold ${isNotClient ? "bg-white border-gray-500 border-1" : "bg-gradient-to-br from-orange-400 to-yellow-200"}`}>
                    {user && user.name && user.last_name ? (
                        <>
                            <span>{user.name.charAt(0).toUpperCase()}{user.last_name.charAt(0).toUpperCase()}</span>
                        </>
                    ) : user && user.name ? (
                        <span>{user.name.charAt(0).toUpperCase()}</span>
                    ) : (
                        <User />
                    )}
                </AvatarFallback>
            </Avatar>
            {user && <div>
                <div className="text-sm font-semibold text-gray-900 group-hover:text-blue-900 transition-colors">
                    {user.full_name}
                </div>
                <div className="text-sm text-gray-500">
                    {formatPhone(user.phone_number)}
                </div>
            </div>
            }
        </div>
    );
};

export default AvatarUser;
