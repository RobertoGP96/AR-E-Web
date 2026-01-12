'use client'

import OrderRow from '@/components/order/order-row'
import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import ErrorMeassage from '@/components/utils/error'
import LoadingSpinner from '@/components/utils/loading-spinner'
import { useOrders } from '@/hooks/order/useOrders'
import { ShoppingBag, Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { useState } from 'react'

export default function UserOrders() {
    const [searchTerm, setSearchTerm] = useState('')
    
    // ✅ SEGURIDAD: Sin inyección de client_id (backend lo determina del token JWT)
    const { orders, error, isLoading } = useOrders()

    // Filtrar órdenes por búsqueda
    const filteredOrders = orders.filter(order => 
        order.id.toString().includes(searchTerm.toLowerCase()) ||
        order.client?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        order.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Obtener estadísticas
    const totalOrders = orders.length
    const processingOrders = orders.filter(o => o.status === 'Procesando').length
    const completedOrders = orders.filter(o => o.status === 'Completado').length

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header con estadísticas y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <ShoppingBag className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Mis Órdenes
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Gestiona todos tus órdenes en un solo lugar
                            </p>
                        </div>
                    </div>
                    
                    {/* Estadísticas rápidas */}
                    {orders.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                {totalOrders} pedido{totalOrders !== 1 ? 's' : ''}
                            </Badge>
                            {processingOrders > 0 && (
                                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                    {processingOrders} procesando
                                </Badge>
                            )}
                            {completedOrders > 0 && (
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                    {completedOrders} completado{completedOrders !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Controles de búsqueda - Solo mostrar si hay órdenes */}
            {orders.length > 0 && (
                <Card className="border-muted-foreground/10 py-2">
                    <CardContent className="px-2">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {/* Búsqueda */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar órdenes por ID, cliente o estado..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-10 transition-all duration-200 focus:ring-2 focus:ring-primary/30"
                                />
                            </div>
                        </div>

                        {/* Mostrar resultados de búsqueda */}
                        {searchTerm && (
                            <div className="mt-3 pt-3 border-t border-muted-foreground/10">
                                <p className="text-sm text-muted-foreground">
                                    {filteredOrders.length === 0 
                                        ? "No se encontraron órdenes"
                                        : `${filteredOrders.length} pedido${filteredOrders.length !== 1 ? 's' : ''} encontrado${filteredOrders.length !== 1 ? 's' : ''}`
                                    } para "{searchTerm}"
                                </p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}

            {/* Contenido principal */}
            <div className="space-y-6">
                {/* Loading State */}
                {isLoading && orders.length === 0 && (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <LoadingSpinner size='lg' />
                    </div>
                )}

                {/* Error State */}
                {error && orders.length === 0 && (
                    <ErrorMeassage text='A ocurrido un error. Revise su conexión a internet.' />
                )}

                {/* Empty State */}
                {!isLoading && !error && orders.length === 0 && (
                    <Card className="border-dashed border-2 border-muted-foreground/20">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-6">
                                <ShoppingBag className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground/80 mb-2">
                                ¡Empieza a realizar órdenes!
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Tus órdenes aparecerán aquí una vez que comiences a realizar compras. Ponte en contacto con nuestros agentes para empezar.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* No search results state */}
                {!isLoading && !error && orders.length > 0 && filteredOrders.length === 0 && (
                    <Card className="border-muted-foreground/10">
                        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                                No se encontraron órdenes
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Intenta con otros términos de búsqueda
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Órdenes List */}
                {!isLoading && !error && filteredOrders.length > 0 && (
                    <div className="space-y-4">
                        {filteredOrders.map((order, index) => (
                            <div
                                key={order.id}
                                className="animate-scale-in"
                                style={{ animationDelay: `${index * 100}ms` }}
                            >
                                <OrderRow order={order} />
                                {index < filteredOrders.length - 1 && (
                                    <Separator className="my-4 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
