'use client'

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from '@/components/ui/empty'
import { Separator } from '@/components/ui/separator'
import ErrorMessage from '@/components/utils/error'
import LoadingSpinner from '@/components/utils/loading-spinner'
import { useDeliveries } from '@/hooks/delivery/useDeliveries'
import { Package } from 'lucide-react'
import { useEffect, useState } from 'react'

/**
 * Componente para mostrar las entregas del usuario autenticado
 * 
 * ✅ NUEVA FEATURE: Permite a los clientes ver todas sus entregas
 */
export default function UserDeliveries() {
    const [isVisible, setIsVisible] = useState(false)
    
    // ✅ SEGURIDAD: Sin inyección de client_id (backend lo determina del token)
    const { deliveries, error, isLoading } = useDeliveries()

    useEffect(() => {
        setIsVisible(true)
    }, [])

    if (!isVisible) return null

    // ✅ Mapeo de estados a español
    const statusLabels: Record<string, { label: string; color: string }> = {
        'Pendiente': { label: 'Pendiente', color: 'bg-yellow-100 text-yellow-800' },
        'Entregado': { label: 'Entregado', color: 'bg-green-100 text-green-800' },
        'En transito': { label: 'En tránsito', color: 'bg-blue-100 text-blue-800' },
        'Fallida': { label: 'Entrega fallida', color: 'bg-red-100 text-red-800' },
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tight">Mis Entregas</h1>
                <p className="text-muted-foreground">
                    Historial completo de entregas realizadas
                </p>
            </div>

            <Separator />

            {/* Loading State */}
            {isLoading && (
                <div className="flex justify-center items-center min-h-[400px]">
                    <LoadingSpinner />
                </div>
            )}

            {/* Error State */}
            {error && (
                <ErrorMessage 
                    text={error.message || 'Error cargando entregas'}
                />
            )}

            {/* Empty State */}
            {!isLoading && !error && deliveries.length === 0 && (
                <Empty>
                    <Package className="h-12 w-12 text-muted-foreground" />
                    <EmptyHeader>No hay entregas</EmptyHeader>
                    <EmptyTitle>Aún no tienes entregas registradas</EmptyTitle>
                    <EmptyDescription>
                        Las entregas que recibas aparecerán aquí
                    </EmptyDescription>
                </Empty>
            )}

            {/* Deliveries List */}
            {!isLoading && !error && deliveries.length > 0 && (
                <div className="space-y-4">
                    {deliveries.map((delivery) => {
                        const statusInfo = statusLabels[delivery.status as string] || 
                            { label: delivery.status, color: 'bg-gray-100 text-gray-800' }
                        
                        return (
                            <div
                                key={delivery.id}
                                className="rounded-lg border p-4 space-y-3 hover:bg-accent/50 transition-colors"
                            >
                                {/* Delivery Header */}
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Package className="h-5 w-5 text-primary" />
                                        <div className="space-y-1">
                                            <p className="font-medium">
                                                Entrega #{delivery.id}
                                            </p>
                                            <p className="text-sm text-muted-foreground">
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
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <p className="text-muted-foreground">Peso</p>
                                        <p className="font-semibold">{delivery.weight} kg</p>
                                    </div>
                                    <div>
                                        <p className="text-muted-foreground">Costo de entrega</p>
                                        <p className="font-semibold">${delivery.weight_cost.toFixed(2)}</p>
                                    </div>
                                </div>

                                {/* Delivery Date */}
                                <div className="text-sm text-muted-foreground">
                                    <p>Fecha de entrega: {new Date(delivery.deliver_date).toLocaleDateString('es-ES', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric'
                                    })}</p>
                                </div>

                                {/* Delivery Pictures if exists */}
                                {delivery.deliver_picture && delivery.deliver_picture.length > 0 && (
                                    <div className="pt-2">
                                        <p className="text-xs text-muted-foreground mb-2">Evidencia de entrega</p>
                                        <div className="grid grid-cols-1 gap-2">
                                            {delivery.deliver_picture.map((image, idx) => (
                                                <img
                                                    key={idx}
                                                    src={image.image_url}
                                                    alt={image.description || "Evidencia de entrega"}
                                                    className="rounded-md max-h-40 object-cover"
                                                />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            )}
        </div>
    )
}
