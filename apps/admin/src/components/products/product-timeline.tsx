import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Clock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ShoppingCart,
  Package,
  Truck,
} from 'lucide-react';
import { useProductTimeline, type TimelineEvent } from '@/hooks/product/useProductTimeline';

interface ProductTimelineProps {
  productId: string;
}

/**
 * Componente para mostrar la timeline de un producto
 * Los eventos vienen ya formateados desde el API sin necesidad de transformación
 */
const ProductTimeline: React.FC<ProductTimelineProps> = ({ productId }) => {
  const { events, isLoading, error } = useProductTimeline(productId);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'Sin fecha';
    const date = new Date(dateString);
    return date.toLocaleDateString('es-AR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  /**
   * Renderiza el icono basado en el nombre del icono
   * Los nombres vienen desde el API como strings ('shopping-cart', 'package', etc)
   */
  const renderIcon = (iconName: string, color: string) => {
    switch (iconName) {
      case 'shopping-cart':
        return <ShoppingCart className={`h-5 w-5 ${color}`} />;
      case 'package':
        return <Package className={`h-5 w-5 ${color}`} />;
      case 'truck':
        return <Truck className={`h-5 w-5 ${color}`} />;
      case 'check-circle-2':
        return <CheckCircle2 className={`h-5 w-5 ${color}`} />;
      default:
        return <Clock className={`h-5 w-5 ${color}`} />;
    }
  };

  return (
    <Card className="w-full shadow-lg">
      <CardHeader>
        <CardTitle className="text-lg flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Historial de Eventos del Producto
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-6 w-6 animate-spin text-gray-400 mr-2" />
            <p className="text-gray-500">Cargando eventos...</p>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-6 w-6 text-red-400 mr-2" />
            <p className="text-red-500">Error al cargar los eventos: {error.message}</p>
          </div>
        ) : events && events.length > 0 ? (
          <div className="relative">
            {/* Línea central vertical con gradiente */}
            <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-200 via-yellow-200 to-green-200"></div>

            {/* Eventos renderizados directamente del API */}
            <div className="space-y-6 pl-20">
              {events.map((event: TimelineEvent, index: number) => (
                <div key={index} className="relative">
                  {/* Punto de la línea de tiempo */}
                  <div className={`absolute left-[-56px] top-1 w-12 h-12 rounded-full flex items-center justify-center ${event.bgColor} border-4 border-white shadow-md transition-transform hover:scale-110`}>
                    {renderIcon(event.icon, event.color)}
                  </div>

                  {/* Contenedor del evento */}
                  <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex flex-col gap-1">
                        <h4 className="font-semibold text-gray-900">
                          {event.label}
                        </h4>
                        <Badge variant="outline" className="text-xs w-fit">
                          {formatDate(event.date)}
                        </Badge>
                      </div>
                      {event.isCompleted && (
                        <CheckCircle2 className="h-5 w-5 text-green-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600">
                      {event.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center py-12">
            <AlertCircle className="h-6 w-6 text-gray-400 mr-2" />
            <p className="text-gray-500">
              {events?.length === 0 
                ? 'No hay eventos registrados para este producto'
                : 'Cargando información del producto...'}
            </p>
          </div>
        )}

        {/* Leyenda de estados */}
        {events && events.length > 0 && (
          <div className="mt-8 pt-6 border-t">
            <h4 className="text-sm font-semibold text-gray-900 mb-3">
              Estados del Producto:
            </h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <CheckCircle2 className="h-4 w-4 text-gray-600" />
                </div>
                <span className="text-xs text-gray-600">Creado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                  <ShoppingCart className="h-4 w-4 text-blue-600" />
                </div>
                <span className="text-xs text-gray-600">Comprado</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center">
                  <Package className="h-4 w-4 text-yellow-600" />
                </div>
                <span className="text-xs text-gray-600">Recibido</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                  <Truck className="h-4 w-4 text-green-600" />
                </div>
                <span className="text-xs text-gray-600">Entregado</span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ProductTimeline;
