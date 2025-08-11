import { Truck, Plus, Search, MapPin, Clock, User, Route, Calendar } from 'lucide-react';
import { Input } from '@/components/ui/input';

export default function Delivery() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Truck className="h-8 w-8 text-orange-500" />
            Entrega
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona las rutas de entrega y conductores
          </p>
        </div>
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-xl hover:bg-gray-50 transition-colors">
            <Route className="h-5 w-5" />
            Optimizar Rutas
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
            <Plus className="h-5 w-5" />
            Nueva Ruta
          </button>
        </div>
      </div>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Rutas Activas</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <Route className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="text-sm text-blue-600 mt-2">En curso hoy</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Conductores</p>
              <p className="text-2xl font-bold text-gray-900">28</p>
            </div>
            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
              <User className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <p className="text-sm text-green-600 mt-2">24 disponibles</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Entregas Hoy</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
            <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
              <Calendar className="h-6 w-6 text-orange-600" />
            </div>
          </div>
          <p className="text-sm text-orange-600 mt-2">89 completadas</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Vehículos</p>
              <p className="text-2xl font-bold text-gray-900">15</p>
            </div>
            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <Truck className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="text-sm text-purple-600 mt-2">13 en servicio</p>
        </div>
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                type="text"
                placeholder="Buscar rutas, conductores o vehículos..."
                className="pl-10"
              />
            </div>
          </div>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            <option value="">Todos los estados</option>
            <option value="planificada">Planificada</option>
            <option value="en-curso">En Curso</option>
            <option value="completada">Completada</option>
            <option value="cancelada">Cancelada</option>
          </select>
          <select className="px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500">
            <option value="">Todas las zonas</option>
            <option value="norte">Norte</option>
            <option value="sur">Sur</option>
            <option value="centro">Centro</option>
            <option value="oriente">Oriente</option>
          </select>
        </div>
      </div>

      {/* Lista de Rutas de Entrega */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ruta de ejemplo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ruta Norte #001</h3>
              <p className="text-sm text-gray-500">Zona Norte - Bogotá</p>
            </div>
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              En Curso
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Carlos Mendoza</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Vehículo: ABC-123</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">12 paradas programadas</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Iniciada: 8:30 AM</span>
            </div>
          </div>

          <div className="bg-gray-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progreso</span>
              <span className="text-sm text-gray-600">8 de 12 completadas</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" style={{width: '67%'}}></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
              Ver Mapa
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Contactar
            </button>
          </div>
        </div>

        {/* Más rutas de ejemplo */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ruta Centro #002</h3>
              <p className="text-sm text-gray-500">Zona Centro - Bogotá</p>
            </div>
            <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
              Completada
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Ana Rodríguez</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Vehículo: DEF-456</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">8 paradas completadas</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Finalizada: 2:15 PM</span>
            </div>
          </div>

          <div className="bg-green-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-green-700">Completada</span>
              <span className="text-sm text-green-600">8 de 8 entregadas</span>
            </div>
            <div className="w-full bg-green-200 rounded-full h-2">
              <div className="bg-gradient-to-r from-green-500 to-emerald-500 h-2 rounded-full w-full"></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors">
              Ver Reporte
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Descargar
            </button>
          </div>
        </div>

        {/* Ruta planificada */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Ruta Sur #003</h3>
              <p className="text-sm text-gray-500">Zona Sur - Bogotá</p>
            </div>
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
              Planificada
            </span>
          </div>

          <div className="space-y-3 mb-4">
            <div className="flex items-center gap-2 text-gray-600">
              <User className="h-4 w-4" />
              <span className="text-sm">Luis González</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Truck className="h-4 w-4" />
              <span className="text-sm">Vehículo: GHI-789</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <MapPin className="h-4 w-4" />
              <span className="text-sm">15 paradas programadas</span>
            </div>
            <div className="flex items-center gap-2 text-gray-600">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Inicio: Mañana 9:00 AM</span>
            </div>
          </div>

          <div className="bg-yellow-50 rounded-lg p-4 mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-yellow-700">Planificada</span>
              <span className="text-sm text-yellow-600">0 de 15 entregadas</span>
            </div>
            <div className="w-full bg-yellow-200 rounded-full h-2">
              <div className="bg-yellow-400 h-2 rounded-full w-0"></div>
            </div>
          </div>

          <div className="flex gap-2">
            <button className="flex-1 px-3 py-2 text-sm bg-orange-50 text-orange-700 rounded-lg hover:bg-orange-100 transition-colors">
              Iniciar Ruta
            </button>
            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors">
              Editar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
