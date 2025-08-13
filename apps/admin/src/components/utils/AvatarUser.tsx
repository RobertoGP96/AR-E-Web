import React from "react";

import type { CustomUser } from "@/types";
import { User } from "lucide-react";
import { Avatar, AvatarFallback } from "../ui/avatar";

interface Props {
    user: CustomUser;
}

const AvatarUser: React.FC<Props> = ({ user }) => {
    return (
        <div className="flex items-center space-x-4">
            <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-orange-400 to-yellow-200 font-semibold">
                    {user ? (
                        <>
                            <span className="text-">{user.last_name.charAt(0) + user.name.charAt(0)}</span>
                        </>
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
                    {user.phone_number}
                </div>
            </div>
            }
        </div>
    );
};

export default AvatarUser;
