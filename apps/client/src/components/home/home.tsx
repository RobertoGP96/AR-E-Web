'use client'

import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '../ui/button'
import { CarouselStores } from '../store/store-carousel'
import { Link, useNavigate } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { useAuth } from '@/hooks/auth/useAuth'
import { toast } from 'sonner'
import logoSvg from '/assets/logo/logo.svg'



export default function Home() {
    const [isVisible, setIsVisible] = useState(false)
    const { isAuthenticated, isLoading } = useAuth()
    const navigate = useNavigate()

    useEffect(() => {
        setIsVisible(true)
    }, [])

    const handleComenzarClick = () => {
        if (isLoading) {
            // Esperar a que termine la verificación de autenticación
            return
        }

        if (!isAuthenticated) {
            toast.warning('Debes iniciar sesión', {
                description: 'Para acceder a los productos necesitas estar autenticado. Te redirigiremos a la página principal.'
            })
            // Redirigir a la página principal (home) después de un breve delay
            setTimeout(() => {
                navigate('/')
            }, 2000)
            return
        }

        // Si está autenticado, navegar a la lista de productos
        navigate('/product-list')
    }

    return (
        <div className="animate-fade-in">
            <div className="h-full">
                <div className="relative isolate px-6 pt-5 lg:px-8">
                    <div className="mx-auto max-w-2xl py-2 sm:py-48 lg:py-26">
                        <div className="text-center flex flex-col items-center gap-2">
                            {/* Logo con animación de entrada */}
                            <div className={`flex lg:flex-1 justify-center items-center pb-2 transition-all duration-1000 ${
                                isVisible 
                                    ? 'opacity-100 transform translate-y-0 scale-100' 
                                    : 'opacity-0 transform translate-y-8 scale-95'
                            }`}>
                                <img
                                    alt="are-logo"
                                    src={logoSvg}
                                    className="h-24 sm:h-36 lg:h-44 w-auto animate-pulse-slow hover:scale-105 transition-transform duration-300"
                                />
                            </div>
                            
                            {/* Título con animación retardada */}
                            <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-balance text-white transition-all duration-1000 delay-300 ${
                                isVisible 
                                    ? 'opacity-100 transform translate-y-0' 
                                    : 'opacity-0 transform translate-y-8'
                            }`}>
                                ¡Descubre una nueva forma de hacer tus compras!
                            </h1>
                            
                            {/* Descripción con animación más retardada */}
                            <p className={`mt-8 text-sm font-medium text-pretty sm:text-xl text-gray-200 transition-all duration-1000 delay-500 ${
                                isVisible 
                                    ? 'opacity-100 transform translate-y-0' 
                                    : 'opacity-0 transform translate-y-8'
                            }`}>
                                En <strong className='text-primary animate-pulse'>AR&E Shipps</strong> conectamos tu día a día con las mejores tiendas, gestionando tus encargos con rapidez y confianza.
                            </p>
                            
                            {/* Botones con animación final */}
                            <div className={`mt-10 flex items-center justify-center gap-x-6 transition-all duration-1000 delay-700 ${
                                isVisible 
                                    ? 'opacity-100 transform translate-y-0' 
                                    : 'opacity-0 transform translate-y-8'
                            }`}>
                                <Button 
                                    type='button'
                                    onClick={handleComenzarClick}
                                    disabled={isLoading}
                                    className="text-sm/6 bg-gradient-to-r from-yellow-500 to-primary font-semibold text-white cursor-pointer hover:scale-105 hover:shadow-lg transition-all duration-300 hover:from-yellow-400 hover:to-primary/90 btn-hover-glow group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                                >
                                    <ShoppingBag className="animate-bounce group-hover:animate-pulse transition-all duration-300" />
                                    {isLoading ? 'Verificando...' : 'Comenzar'}
                                </Button>
                                <Link to="/about">
                                    <Button 
                                        variant={"outline"} 
                                        className="text-sm/6 font-semibold text-white cursor-pointer hover:scale-105 hover:bg-white/10 transition-all duration-300 hover:border-primary group"
                                    >
                                        Saber más
                                        <ArrowRight className="ml-1 animate-pulse group-hover:translate-x-1 transition-all duration-300" />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            {/* Carrusel con animación de entrada desde abajo */}
            <div className={`w-full flex justify-center items-center transition-all duration-1200 delay-1000 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-12'
            }`}>
                <CarouselStores />
            </div>
        </div>
    )
}