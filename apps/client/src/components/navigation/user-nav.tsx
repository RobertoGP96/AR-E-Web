import { useAuthUser, useAuthActions } from "@/hooks/auth/useAuth";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "../ui/dropdown-menu";
import { Avatar, AvatarFallback} from "../ui/avatar";
import { LogOut, ShoppingCart, User } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";

interface NavUserProps {
    onNavigate?: () => void;
}

export function NavUser({ onNavigate }: NavUserProps) {
    const auth = useAuthUser()
    const { logout } = useAuthActions();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try {
            await logout();
            navigate("/login");
        } catch {
            // Error durante el logout
        }
    };

    const handleNavigate = (path: string) => {
        navigate(path);
        onNavigate?.(); // Cierra el sheet en móvil si la función está disponible
    };
    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <div className="w-full flex items-center gap-3 px-2 py-1 rounded-xl hover:bg-gray-800/50 transition-all duration-200 group">
                    <Avatar className="h-10 w-10 rounded-xl">
                        <AvatarFallback className="rounded-full bg-gradient-to-r from-orange-400 to-amber-500 text-gray-900 font-semibold">
                            {auth ? auth?.name.charAt(0).toUpperCase() + auth?.last_name.charAt(0).toUpperCase() : "N/A"}
                        </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 text-left">
                        <span className="block font-semibold text-base text-white">{auth?.name+" "+auth?.last_name.charAt(0)+"." || "Username"}</span>
                        <span className="block text-sm text-gray-400">{auth?.phone_number || "phone number"}</span>
                    </div>
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent
                className="w-56 rounded-xl border-0 shadow-xl bg-background"
                side="bottom"
                align="end"
                sideOffset={8}
            >
                <NavLink to={"/profile"}>
                    <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer" onClick={() => handleNavigate("/profile")}>
                        <User className="h-5 w-5 text-primary" />
                        <span className="text-gray-300">Perfil</span>
                    </DropdownMenuItem>
                </NavLink>
                <NavLink to={"/product-list"}>
                    <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer" onClick={() => handleNavigate("/product-list")}>
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <span className="text-gray-300">Mis productos</span>
                    </DropdownMenuItem>
                </NavLink>
                <NavLink to={"/user_orders"}>
                    <DropdownMenuItem className="gap-3 px-3 py-3 text-base cursor-pointer" onClick={() => handleNavigate("/user_orders")} >
                        <ShoppingCart className="h-5 w-5 text-primary" />
                        <span className="text-gray-300">Pedidos</span>
                    </DropdownMenuItem>
                </NavLink>
                <DropdownMenuSeparator className="bg-gray-800" />
                <DropdownMenuItem 
                    className="gap-3 px-3 py-3 text-base text-red-500 focus:text-red-600 cursor-pointer hover:bg-gray-500/25"
                    onClick={handleLogout}
                >
                    <LogOut className="h-5 w-5 text-red-500" />
                    Cerrar sesión
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
export default { NavUser }