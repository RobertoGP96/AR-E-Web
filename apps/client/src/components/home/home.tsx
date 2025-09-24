'use client'

import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '../ui/button'
import { CarouselStores } from '../store/store-carousel'
import { Link } from 'react-router'



export default function Example() {


    return (
        <>
            <div className=" h-full">
                <div className="relative isolate px-6 pt-5 lg:px-8">

                    <div className="mx-auto max-w-2xl py-2 sm:py-48 lg:py-26">

                        <div className="text-center flex flex-col items-center gap-2">
                            <div className="flex lg:flex-1 justify-center items-center pb-2">
                                <img
                                    alt="are-logo"
                                    src="/assets/logo/logo.svg"
                                    className="h-24 sm:h-36 lg:h-44 w-auto"
                                />
                            </div>
                            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-balance text-white">
                                ¡Descubre una nueva forma de hacer tus compras!
                            </h1>
                            <p className="mt-8 text-sm font-medium text-pretty sm:text-xl text-gray-200">
                                En <strong className='text-primary'>AR&E Shipps</strong> conectamos tu día a día con las mejores tiendas, gestionando tus encargos con rapidez y confianza.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Button className="text-sm/6 bg-gradient-to-r from-yellow-500 to-primary font-semibold text-white cursor-pointer">
                                    <ShoppingBag />
                                    Comenzar
                                </Button>
                                <Link to="/about">
                                    <Button variant={"outline"} className="text-sm/6 font-semibold text-white cursor-pointer">
                                        Saber más
                                        <ArrowRight />
                                    </Button>
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
            <div className='w-full flex justify-center items-center'>
                <CarouselStores />
            </div>
        </>
    )
}