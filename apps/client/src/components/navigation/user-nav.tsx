import { useAuthUser } from "@/hooks/auth/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { LogOut, Settings, ShoppingCart, User } from "lucide-react";
import { useNavigate } from "react-router";

export function NavUser() {
    const auth = useAuthUser()
    const navigate = useNavigate();
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-gray-700/50 transition-all duration-200 group">
                    <Avatar className="h-10 w-10 rounded-xl ring-2 ring-orange-500/20">
                        <AvatarImage src="" alt="Administrador" />
                        <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">
                            {auth ? auth?.name.charAt(0).toUpperCase() + auth?.last_name.charAt(0).toUpperCase() : "N/A"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                        <span className="block font-semibold text-base text-white">{auth?.full_name}</span>
                        <span className="block text-sm text-gray-400">{auth?.phone_number}</span>
                    </div>
                </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-xl border-0 shadow-xl bg-background"
                side="right"
                align="end"
                sideOffset={8}
            >
                <DropdownMenuLabel className="p-0 font-normal">
                    <div className="flex items-center gap-3 px-3 py-3 text-left text-sm">
                        <Avatar className="h-10 w-10 rounded-xl ring-2 ring-orange-500/20">
                            <AvatarImage src="" alt="Administrador" />
                            <AvatarFallback className="rounded-xl bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">AD</AvatarFallback>
                        </Avatar>
                        <div className="grid flex-1 text-left text-sm leading-tight">
                            <span className="truncate font-semibold text-base text-gray-800">Administrador</span>
                            <span className="truncate text-sm text-gray-500">admin@example.com</span>
                        </div>
                    </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer hover:bg-orange-50 group" onClick={() => navigate("/profile")}>
                    <User className="h-5 w-5 text-gray-500 group-hover:text-orange-600" />
                    <span className="group-hover:text-orange-700">Perfil</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer hover:bg-orange-50 group" onClick={() => navigate("/settings")} >
                    <ShoppingCart className="h-5 w-5 text-gray-500 group-hover:text-orange-600" />
                    <span className="group-hover:text-orange-700">Configuración</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-100" />
                <DropdownMenuItem className="gap-3 px-3 py-3 text-base text-red-600 focus:text-red-600 cursor-pointer hover:bg-red-50">
                    <LogOut className="h-5 w-5" />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default { NavUser }