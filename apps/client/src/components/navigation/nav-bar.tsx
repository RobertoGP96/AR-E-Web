import { Compass, DollarSign, Headset, Home, LogIn, UserPlus, Menu, X, Store } from "lucide-react";
import { Button } from "../ui/button";
import { NavLink, useLocation } from "react-router";
import useAuth from "@/hooks/auth/useAuth";
import { NavUser } from "./user-nav";
import LoadingSpinner from "../utils/loading-spinner";
import {
    Sheet,
    SheetContent,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "../ui/sheet";
import { useState } from "react";

const NavBar = () => {
    const { isLoading, isAuthenticated } = useAuth()
    const [isOpen, setIsOpen] = useState(false)

    const navigation = [
        { name: 'Inicio', href: 'home', icon: Home },
        { name: 'Tiendas', href: 'stores', icon: Store },
        { name: 'Saber más', href: 'about', icon: Compass },
        { name: 'Precios', href: 'pricing', icon: DollarSign },
        { name: 'Contáctanos', href: 'contact', icon: Headset },
    ]
    const location = useLocation()

    const handleLinkClick = () => {
        setIsOpen(false)
    }

    return (
        <header className="w-full bg-background/10 backdrop-blur-md border-b border-border/20 shadow-sm">
            <nav aria-label="Global" className="flex items-center justify-between p-3 lg:px-8">
                <div className="flex lg:flex-1 ml-5">
                    {/* Logo space - Responsive logo */}
                    <img src="/assets/logo/logo.svg" alt="Logo" className="hidden lg:block h-15" />
                    <img src="/assets/logo/f-logo.svg" alt="Logo" className="block lg:hidden h-12" />
                </div>

                {/* Desktop Navigation */}
                <div className="hidden lg:flex lg:gap-x-12 ">
                    {navigation.map((item) => (
                        <NavLink key={item.href} to={item.href}>
                            <div className={`flex flex-row justify-center items-center gap-1  hover:text-primary ${location.pathname.includes(item.href) ? "text-primary" : "text-white"}`}>
                                <item.icon className='h-4 w-4' />
                                <span className="text-sm/6 font-semibold  ">
                                    {item.name}
                                </span>
                            </div>
                        </NavLink>
                    ))}
                </div>

                {/* Desktop Auth Section */}
                <div className="hidden lg:flex flex-row justify-center items-center gap-2 lg:flex-1 lg:justify-end">
                    {isLoading &&
                        <LoadingSpinner />
                    }
                    {!isLoading && !isAuthenticated ? (
                        <div className="flex flex-row justify-center items-end">
                            <NavUser />
                        </div>
                    ) : (
                        <>
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
                    )}
                </div>

                {/* Mobile Menu */}
                <div className="lg:hidden">
                    <Sheet open={isOpen} onOpenChange={setIsOpen}>
                        <SheetTrigger asChild>
                            <Button variant="outline" size="icon" className="lg:hidden">
                                <Menu className="h-6 w-6" />
                                <span className="sr-only">Abrir menú</span>
                            </Button>
                        </SheetTrigger>
                        <SheetContent side="right" className="w-[340px] sm:w-[400px] bg-black/50 backdrop-blur-lg border-l border-border/50 p-0 shadow-2xl [&>button]:hidden">
                            <SheetHeader className="border-b border-border/50 p-6 bg-gradient-to-r from-primary/5 to-secondary/5 relative">
                                <SheetTitle className="text-xl font-bold text-foreground flex items-center gap-3">
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="rounded-full hover:bg-primary/10"
                                        onClick={() => setIsOpen(!isOpen)}
                                    >
                                        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                                            {isOpen ? (
                                                <X className="h-4 w-4 text-primary" />
                                            ) : (

                                                <Menu className="h-5 w-5 text-primary" />
                                            )}
                                        </div>
                                    </Button>
                                    <span className="bg-gradient-to-r from-primary to-orange-400 bg-clip-text text-transparent">
                                        Navegación
                                    </span>
                                </SheetTitle>

                            </SheetHeader>

                            <div className="flex flex-col h-full p-6">
                                {/* Mobile Navigation Links */}
                                <div className="flex flex-col gap-1 flex-1">
                                   

                                    {navigation.map((item, index) => (
                                        <NavLink
                                            key={item.href}
                                            to={item.href}
                                            onClick={handleLinkClick}
                                            className="block"
                                        >
                                            <div className={`relative flex flex-row items-center gap-2 p-2 rounded-2xl transition-all duration-300 ease-out ${location.pathname.includes(item.href)
                                                ? "bg-gradient-to-r from-primary/10 via-primary/5 to-transparent text-primary border border-primary/30 shadow-md"
                                                : "text-gray-200  border border-accent/0"
                                                }`} style={{ animationDelay: `${index * 100}ms` }}>
                                                <div className={`relative p-3 rounded-xl transition-all duration-300 ${location.pathname.includes(item.href)
                                                    ? "bg-primary/20 border border-primary/30 shadow-inner"
                                                    : "bg-black/50 border border-muted/30"
                                                    }`}>
                                                    <item.icon className='h-5 w-5' />
                                                </div>
                                                <div className="flex-1">
                                                    <span className="text-base text-gray-200 font-semibold block leading-tight">
                                                        {item.name}
                                                    </span>
                                                    <span className="text-xs text-gray-400 opacity-70">
                                                        {item.href === 'home' && 'Página principal'}
                                                        {item.href === 'stores' && 'Directorio de tiendas'}
                                                        {item.href === 'about' && 'Información sobre nosotros'}
                                                        {item.href === 'pricing' && 'Planes y precios'}
                                                        {item.href === 'contact' && 'Ponte en contacto'}
                                                    </span>
                                                </div>
                                                {location.pathname.includes(item.href) && (
                                                    <div className="w-1 h-8 bg-gradient-to-b from-primary to-primary/50 rounded-full shadow-md" />
                                                )}
                                            </div>
                                        </NavLink>
                                    ))}
                                </div>

                                {/* Mobile Auth Section */}
                                <div className="border-t border-border/50 pt-6 mt-6 space-y-4">

                                    {isLoading ? (
                                        <div className="flex justify-center py-8">
                                            <div className="flex flex-col items-center gap-3">
                                                <LoadingSpinner />
                                                <span className="text-sm text-muted-foreground">Cargando...</span>
                                            </div>
                                        </div>
                                    ) : isAuthenticated ? (
                                        <div className="p-4 rounded-2xl bg-gradient-to-br from-accent/30 to-accent/10 border border-accent/20 shadow-inner">
                                            <NavUser />
                                        </div>
                                    ) : (
                                        <div className="space-y-3">
                                            <NavLink to={"/login"} onClick={handleLinkClick} className="block">
                                                <Button
                                                    variant={"outline"}
                                                    className="w-full justify-start h-14 text-base font-semibold bg-primary/10 text-primary border-primary/30 rounded-xl"
                                                >
                                                    <div className="p-2 rounded-lg bg-primary/20 mr-4">
                                                        <LogIn className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span>Inicia Sesión</span>
                                                        <span className="text-xs opacity-70 font-normal">Accede a tu cuenta</span>
                                                    </div>
                                                </Button>
                                            </NavLink>
                                            <NavLink to={"/register"} onClick={handleLinkClick} className="block">
                                                <Button
                                                    variant={"outline"}
                                                    className="w-full justify-start h-14 text-base font-semibold  text-gray-300 border-gray-300 rounded-xl"
                                                >
                                                    <div className="p-2 rounded-lg bg-secondary/20 mr-4">
                                                        <UserPlus className="h-5 w-5" />
                                                    </div>
                                                    <div className="flex flex-col items-start">
                                                        <span>Regístrate</span>
                                                        <span className="text-xs opacity-70 font-normal">Crea una cuenta nueva</span>
                                                    </div>
                                                </Button>
                                            </NavLink>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </SheetContent>
                    </Sheet>
                </div>
            </nav>
        </header>
    );
}; export default NavBar;