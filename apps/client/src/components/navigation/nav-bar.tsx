import { Compass, DollarSign, Headset, Home, LogIn, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { NavLink, useLocation,} from "react-router";
import useAuth from "@/hooks/auth/useAuth";
import { NavUser } from "./user-nav";
import LoadingSpinner from "../utils/LoadingSpinner";

const NavBar = () => {
    const { isLoading, isAuthenticated } = useAuth()

    const navigation = [
        { name: 'Inicio', href: 'home', icon: Home },
        { name: 'Saber más', href: 'about', icon: Compass },
        { name: 'Precios', href: 'pricing', icon: DollarSign },
        { name: 'Contáctanos', href: 'contact', icon: Headset },
    ]
    const location= useLocation()

    return (
        <header className="w-full">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                </div>

                <div className="hidden lg:flex lg:gap-x-12 ">
                    {navigation.map((item) => (
                        <NavLink to={item.href}>
                            <div className={`flex flex-row justify-center items-center gap-1  hover:text-primary ${location.pathname.includes(item.href)?"text-primary":"text-white"}` }>
                                <item.icon className='h-4 w-4' />
                                <span className="text-sm/6 font-semibold  ">
                                    {item.name}
                                </span>
                            </div>
                        </NavLink>
                    ))}
                </div>
                <div className="flex flex-row justify-center items-center gap-2 lg:flex lg:flex-1 lg:justify-end">
                    {isLoading &&
                        <LoadingSpinner />
                    }
                    {!isLoading && isAuthenticated ? (<>
                        <div className="flex flex-row justify-center items-end">
                            <NavUser />
                        </div>
                    </>) : (<>
                        <NavLink to={"/login"}>
                            <Button variant={"outline"} className="cursor-pointer">
                                <LogIn />
                                Inicia Sesión
                            </Button>
                        </NavLink>
                        <span>ó</span>
                        <NavLink to={"/register"}>
                            <Button variant={"outline"} className="cursor-pointer">
                                <UserPlus />
                                Registrate
                            </Button>
                        </NavLink>
                    </>
                    )
                    }

                </div>
            </nav>

        </header>
    );
};

export default NavBar;