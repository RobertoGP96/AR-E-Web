'use client'

import OrderRow from '@/components/order/order-row'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import ErrorMeassage from '@/components/utils/error'
import LoadingSpinner from '@/components/utils/loading-spinner'
import useAuth from '@/hooks/auth/useAuth'
import { useOrders } from '@/hooks/order/useOrders'
import { OrderFilters } from '@/types/api'
import { Order } from '@/types/order'

import { Plus, ShoppingBag } from 'lucide-react'
import { useState } from 'react'


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

    
    const { user } = useAuth()
    const [filters, setFilters] = useState<OrderFilters>({ client_id: user?.id });
    const { orders, error, isLoading } = useOrders(filters)
    return (
        <>
            <main>
                <header className="relative isolate pt-8">
                    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
                        <div className="mx-auto flex max-w-2xl items-center justify-between gap-x-8 lg:mx-0 lg:max-w-none">
                            <div className="flex items-center gap-x-6">
                                <ShoppingBag className='h-10 w-10 text-primary' />
                                <h1 className='text-2xl font-bold text-primary'>
                                    Pedidos
                                </h1>
                            </div>
                            <div className="flex items-center gap-x-4 sm:gap-x-6">
                                <Button className="cursor-pointer" variant="outline"> <Plus /> <span> Crear</span> </Button>
                            </div>
                        </div>
                    </div>
                </header>

                <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
                    <div className="w-full flex flex-col justify-star items-center">
                        {isLoading && orders.length == 0 && <LoadingSpinner size='lg' />}
                        {error && orders.length == 0 && <ErrorMeassage text='A ocurrido un error. Revise su conexion a internet.' />}
                        {isLoading && !error && orders.map((item) => <OrderRow order={item} />)}

                        <Separator className='my-7' />

                        {mockOrders.map((item) => <OrderRow order={item} />)}
                    </div>
                    
                </div>
            </main>
        </>
    )
}
