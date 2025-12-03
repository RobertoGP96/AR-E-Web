'use client'

import { Separator } from '@/components/ui/separator'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Input } from '@/components/ui/input'
import ErrorMessage from '@/components/utils/error'
import LoadingSpinner from '@/components/utils/loading-spinner'
import { useDeliveries } from '@/hooks/delivery/useDeliveries'
import { Package, Search } from 'lucide-react'
import { useState } from 'react'

/**
 * Componente para mostrar las entregas del usuario autenticado
 * 
 * ✅ NUEVA FEATURE: Permite a los clientes ver todas sus entregas
 */
export default function UserDeliveries() {
    const [searchTerm, setSearchTerm] = useState('')
    
    // ✅ SEGURIDAD: Sin inyección de client_id (backend lo determina del token)
    const { deliveries, error, isLoading } = useDeliveries()

    // Filtrar entregas por búsqueda
    const filteredDeliveries = deliveries.filter(delivery =>
        delivery.id.toString().includes(searchTerm.toLowerCase()) ||
        delivery.order?.toString().includes(searchTerm.toLowerCase()) ||
        delivery.status?.toLowerCase().includes(searchTerm.toLowerCase())
    )

    // Obtener estadísticas
    const totalDeliveries = deliveries.length
    const pendingDeliveries = deliveries.filter(d => d.status === 'Pendiente').length
    const deliveredDeliveries = deliveries.filter(d => d.status === 'Entregado').length
    const inTransitDeliveries = deliveries.filter(d => d.status === 'En transito').length

    // ✅ Mapeo de estados a español
    const statusLabels: Record<string, { label: string; color: string }> = {
        'Pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-200' },
        'Entregado': { label: 'Entregado', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200' },
        'En transito': { label: 'En tránsito', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200' },
        'Fallida': { label: 'Entrega fallida', color: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200' },
    }

    return (
        <div className="container mx-auto p-4 lg:p-6 space-y-6">
            {/* Header con estadísticas y controles */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <div className="p-2 rounded-full bg-primary/10">
                            <Package className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-foreground">
                                Mis Entregas
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                Historial completo de entregas realizadas
                            </p>
                        </div>
                    </div>
                    
                    {/* Estadísticas rápidas */}
                    {deliveries.length > 0 && (
                        <div className="flex flex-wrap gap-2 mt-3">
                            <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                {totalDeliveries} entrega{totalDeliveries !== 1 ? 's' : ''}
                            </Badge>
                            {pendingDeliveries > 0 && (
                                <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                                    {pendingDeliveries} pendiente{pendingDeliveries !== 1 ? 's' : ''}
                                </Badge>
                            )}
                            {inTransitDeliveries > 0 && (
                                <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                                    {inTransitDeliveries} en tránsito
                                </Badge>
                            )}
                            {deliveredDeliveries > 0 && (
                                <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800">
                                    {deliveredDeliveries} entregada{deliveredDeliveries !== 1 ? 's' : ''}
                                </Badge>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Controles de búsqueda - Solo mostrar si hay entregas */}
            {deliveries.length > 0 && (
                <Card className="border-muted-foreground/10 py-2">
                    <CardContent className="px-2">
                        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                            {/* Búsqueda */}
                            <div className="flex-1 relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Buscar entregas por ID, orden, cliente o estado..."
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
                                    {filteredDeliveries.length === 0 
                                        ? "No se encontraron entregas"
                                        : `${filteredDeliveries.length} entrega${filteredDeliveries.length !== 1 ? 's' : ''} encontrada${filteredDeliveries.length !== 1 ? 's' : ''}`
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
                {isLoading && deliveries.length === 0 && (
                    <div className="flex justify-center items-center min-h-[400px]">
                        <LoadingSpinner />
                    </div>
                )}

                {/* Error State */}
                {error && deliveries.length === 0 && (
                    <ErrorMessage 
                        text={error.message || 'Error cargando entregas'}
                    />
                )}

                {/* Empty State */}
                {!isLoading && !error && deliveries.length === 0 && (
                    <Card className="border-dashed border-2 border-muted-foreground/20">
                        <CardContent className="flex flex-col items-center justify-center py-16 px-6 text-center">
                            <div className="p-4 rounded-full bg-muted/50 mb-6">
                                <Package className="h-12 w-12 text-muted-foreground/50" />
                            </div>
                            <h3 className="text-xl font-semibold text-foreground/80 mb-2">
                                No hay entregas aún
                            </h3>
                            <p className="text-muted-foreground mb-6 max-w-sm">
                                Las entregas que recibas aparecerán aquí. Realiza tu primer pedido para comenzar.
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* No search results state */}
                {!isLoading && !error && deliveries.length > 0 && filteredDeliveries.length === 0 && (
                    <Card className="border-muted-foreground/10">
                        <CardContent className="flex flex-col items-center justify-center py-12 px-6 text-center">
                            <Search className="h-12 w-12 text-muted-foreground/50 mb-4" />
                            <h3 className="text-lg font-semibold text-foreground/80 mb-2">
                                No se encontraron entregas
                            </h3>
                            <p className="text-muted-foreground mb-4">
                                Intenta con otros términos de búsqueda
                            </p>
                        </CardContent>
                    </Card>
                )}

                {/* Deliveries List */}
                {!isLoading && !error && filteredDeliveries.length > 0 && (
                    <div className="space-y-4">
                        {filteredDeliveries.map((delivery, index) => {
                            const statusInfo = statusLabels[delivery.status as string] || 
                                { label: delivery.status, color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-200' }
                            
                            return (
                                <div key={delivery.id} className="animate-scale-in" style={{ animationDelay: `${index * 100}ms` }}>
                                    <Card className="hover:shadow-md transition-shadow duration-200">
                                        <CardContent className="p-4 space-y-3">
                                            {/* Delivery Header */}
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <div className="p-2 rounded-lg bg-primary/10">
                                                        <Package className="h-5 w-5 text-primary" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <p className="font-semibold text-foreground">
                                                            Entrega #{delivery.id}
                                                        </p>
                                                        <p className="text-xs text-muted-foreground">
                                                            Orden #{delivery.order}
                                                        </p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
                                                        {statusInfo.label}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Delivery Details */}
                                            <Separator className="my-2" />
                                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 text-sm">
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">Peso</p>
                                                    <p className="font-semibold text-foreground">{delivery.weight} kg</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">Costo</p>
                                                    <p className="font-semibold text-foreground">${delivery.weight_cost.toFixed(2)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted-foreground font-medium">Fecha</p>
                                                    <p className="font-semibold text-foreground">
                                                        {new Date(delivery.deliver_date).toLocaleDateString('es-ES', {
                                                            month: 'short',
                                                            day: 'numeric'
                                                        })}
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Delivery Pictures if exists */}
                                            {delivery.deliver_picture && delivery.deliver_picture.length > 0 && (
                                                <>
                                                    <Separator className="my-2" />
                                                    <div>
                                                        <p className="text-xs text-muted-foreground font-medium mb-2">Evidencia de entrega</p>
                                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                                                            {delivery.deliver_picture.map((image, idx) => (
                                                                <img
                                                                    key={idx}
                                                                    src={image.image_url}
                                                                    alt={image.description || "Evidencia de entrega"}
                                                                    className="rounded-md max-h-32 object-cover hover:opacity-80 transition-opacity cursor-pointer"
                                                                />
                                                            ))}
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </CardContent>
                                    </Card>
                                    {index < filteredDeliveries.length - 1 && (
                                        <Separator className="my-4 bg-gradient-to-r from-transparent via-muted-foreground/20 to-transparent" />
                                    )}
                                </div>
                            )
                        })}
                    </div>
                )}
            </div>
        </div>
    )
}
