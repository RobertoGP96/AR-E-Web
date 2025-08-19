import { Compass, Headset, Home, LogIn, UserPlus } from "lucide-react";
import { Button } from "../ui/button";
import { NavLink } from "react-router";

const NavBar = () => {

    const navigation = [
        { name: 'Inicio', href: '/', icon: Home },
        { name: 'Saber más', href: 'pricing', icon: Compass },
        { name: 'Contáctanos', href: 'contact', icon: Headset },
    ]

    return (
        <header className="absolute inset-x-0 top-0 z-50">
            <nav aria-label="Global" className="flex items-center justify-between p-6 lg:px-8">
                <div className="flex lg:flex-1">
                </div>

                <div className="hidden lg:flex lg:gap-x-12 ">
                    {navigation.map((item) => (
                        <NavLink to={item.href}>
                            <div className="flex flex-row justify-center items-center gap-1 text-white hover:text-primary ">
                                <item.icon className='h-4 w-4' />
                                <span className="text-sm/6 font-semibold  ">
                                    {item.name}
                                </span>
                            </div>
                        </NavLink>
                    ))}
                </div>
                <div className="flex flex-row justify-center items-center gap-2 lg:flex lg:flex-1 lg:justify-end">
                    <NavLink to={"/login"}>

                        <Button variant={"outline"}>
                            <LogIn />
                            Inicia Sesión
                        </Button>
                    </NavLink>
                    <span>ó</span>
                    <Button variant={"outline"}>
                        <UserPlus />
                        Registrate
                    </Button>
                </div>
            </nav>

        </header>
    );
};

export default NavBar;