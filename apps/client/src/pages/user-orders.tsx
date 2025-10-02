'use client'

import OrderRow from '@/components/order/order-row'
import { Separator } from '@/components/ui/separator'
import ErrorMeassage from '@/components/utils/error'
import LoadingSpinner from '@/components/utils/loading-spinner'
import useAuth from '@/hooks/auth/useAuth'
import { useOrders } from '@/hooks/order/useOrders'
import { OrderFilters } from '@/types/api'
import { Order } from '@/types/order'

import { ShoppingBag } from 'lucide-react'
import { useEffect, useState } from 'react'


const mockOrders: Order[] = [{
    id: 1,
    delivery: [],
    extra_payments: 0,
    pay_status: 'Pendiente',
    products: [],
    total_cost: 100.0,
    status: 'Completado',
    create_at: new Date().toDateString()

}]

export default function UserOrders() {
    const [isVisible, setIsVisible] = useState(false)
    
    const { user } = useAuth()
    const [filters, setFilters] = useState<OrderFilters>({ client_id: user?.id });
    const { orders, error, isLoading } = useOrders(filters)

    useEffect(() => {
        setFilters({ client_id: user?.id })
    }, [user])

    useEffect(() => {
        setIsVisible(true)
    }, [])

    return (
        <>
            <main className="animate-fade-in">
                <header className="relative isolate pt-8">
                    <div className="mx-auto max-w-7xl px-4 py-4 pb-0 sm:px-6 lg:px-8">
                        <div className={`mx-auto flex max-w-2xl items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none transition-all duration-1000 ${
                            isVisible 
                                ? 'opacity-100 transform translate-y-0' 
                                : 'opacity-0 transform translate-y-8'
                        }`}>
                            <div className="flex items-center gap-x-6">
                                <ShoppingBag className='h-10 w-10 text-primary animate-pulse' />
                                <h1 className='text-2xl font-bold text-primary animate-pulse-slow'>
                                    Pedidos
                                </h1>
                            </div>
                            
                        </div>
                        
                    </div>
                        
                </header>

                <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
                    <Separator className={`mb-4 transition-all duration-1000 delay-300 ${
                        isVisible 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-8'
                    }`} />
                    <div className={`w-full flex flex-col justify-start py-4 items-center transition-all duration-1000 delay-500 ${
                        isVisible 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-8'
                    }`}>


                        {isLoading && orders.length == 0 && <LoadingSpinner size='lg' />}
                        {error && orders.length == 0 && <ErrorMeassage text='A ocurrido un error. Revise su conexion a internet.' />}
                        {isLoading && !error && orders.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="animate-scale-in" 
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <OrderRow order={item} />
                            </div>
                        ))}


                        {mockOrders.map((item, index) => (
                            <div 
                                key={item.id} 
                                className="animate-scale-in hover:scale-105 transition-transform duration-300" 
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <OrderRow order={item} />
                            </div>
                        ))}
                    </div>
                    
                </div>
            </main>
        </>
    )
}
