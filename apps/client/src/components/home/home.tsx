'use client'

import { ArrowRight, ShoppingBag } from 'lucide-react'
import { Button } from '../ui/button'
import { CarouselStores } from '../store/store-carousel'



export default function Example() {


    return (
        <>
            <div className="bg-black h-full">
                <div className="relative isolate px-6 pt-5 lg:px-8">
                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%-11rem)] aspect-1155/678 w-144.5 -translate-x-1/2 rotate-30 bg-linear-to-tr from-[#dd6540] to-[#ca9b0d] opacity-30 sm:left-[calc(50%-30rem)] sm:w-288.75"
                        />
                    </div>
                    <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56">

                        <div className="text-center flex flex-col items-center gap-2">
                            <div className="flex lg:flex-1 justify-center items-center pb-2">
                                <img
                                    alt="are-logo"
                                    src="src/assets/logo/logo.svg"
                                    className="h-40 w-auto"
                                />
                            </div>
                            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-7xl text-white">
                                ¡Descubre una nueva forma de hacer tus compras!
                            </h1>
                            <p className="mt-8 text-lg font-medium text-pretty sm:text-xl/8 text-gray-400">
                                En <strong className='text-primary'>AR&E Shipps</strong> conectamos tu día a día con las mejores tiendas, gestionando tus encargos con rapidez y confianza.
                            </p>
                            <div className="mt-10 flex items-center justify-center gap-x-6">
                                <Button className="text-sm/6 bg-gradient-to-r from-yellow-500 to-primary font-semibold text-white cursor-pointer">
                                    <ShoppingBag />
                                    Comenzar
                                </Button>
                                <Button variant={"outline"} className="text-sm/6 font-semibold text-white cursor-pointer">
                                    Saber más
                                    <ArrowRight />
                                </Button>
                            </div>
                        </div>

                    </div>

                    <div
                        aria-hidden="true"
                        className="absolute inset-x-0 top-[calc(100%-13rem)] -z-10 transform-gpu overflow-hidden blur-3xl sm:top-[calc(100%-30rem)]"
                    >
                        <div
                            style={{
                                clipPath:
                                    'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
                            }}
                            className="relative left-[calc(50%+3rem)] aspect-1155/678 w-144.5 -translate-x-1/2 bg-linear-to-tr from-[#fab834] to-[#885b00] opacity-30 sm:left-[calc(50%+36rem)] sm:w-288.75"
                        />
                    </div>
                </div>

            </div>
            <div className='w-full flex justify-center items-center bg-black'>
                <CarouselStores />
            </div>
        </>
    )
}