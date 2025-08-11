import { Package, Plus, Search, DollarSign, Archive, Tag, TrendingUp } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function Products() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Package className="h-8 w-8 text-orange-500" />
            Productos
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona el inventario y catálogo de productos
          </p>
        </div>
        <Button className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0">
          <Plus className="h-5 w-5" />
          Nuevo Producto
        </Button>
      </div>

      {/* Filtros */}
      <Card className="shadow-lg border-0 bg-white/80 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar productos..."
                  className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-[180px] border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm">
                <SelectValue placeholder="Categoría" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl bg-white">
                <SelectItem value="all" className="focus:bg-orange-50 focus:text-orange-900">Todas las categorías</SelectItem>
                <SelectItem value="electronics" className="focus:bg-orange-50 focus:text-orange-900">Electrónicos</SelectItem>
                <SelectItem value="clothing" className="focus:bg-orange-50 focus:text-orange-900">Ropa</SelectItem>
                <SelectItem value="food" className="focus:bg-orange-50 focus:text-orange-900">Alimentos</SelectItem>
                <SelectItem value="books" className="focus:bg-orange-50 focus:text-orange-900">Libros</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px] border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl shadow-sm">
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent className="rounded-xl border-gray-200 shadow-xl bg-white">
                <SelectItem value="all" className="focus:bg-orange-50 focus:text-orange-900">Todos los estados</SelectItem>
                <SelectItem value="active" className="focus:bg-orange-50 focus:text-orange-900">Activo</SelectItem>
                <SelectItem value="inactive" className="focus:bg-orange-50 focus:text-orange-900">Inactivo</SelectItem>
                <SelectItem value="out-of-stock" className="focus:bg-orange-50 focus:text-orange-900">Sin stock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Lista de Productos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Producto de ejemplo 1 */}
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white rounded-2xl group hover:scale-[1.02]">
          <div className="h-48 bg-gradient-to-br from-orange-400 to-amber-500 relative">
            <div className="absolute top-4 left-4">
              <Badge className="bg-green-100/90 text-green-800 hover:bg-green-100 shadow-sm border-0 rounded-full px-3 py-1">
                En Stock
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Smartphone Pro Max
                </CardTitle>
                <Badge variant="outline" className="text-blue-600 border-blue-200 bg-blue-50/50 rounded-full px-3 py-1">
                  Electrónicos
                </Badge>
              </div>
            </CardHeader>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">$899.99</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Archive className="h-4 w-4" />
                <span className="text-sm">125 unidades disponibles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4" />
                <span className="text-sm">SKU: SPM-001</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ventas del mes:</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  45 unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Producto de ejemplo 2 */}
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white rounded-2xl group hover:scale-[1.02]">
          <div className="h-48 bg-gradient-to-br from-blue-400 to-purple-500 relative">
            <div className="absolute top-4 left-4">
              <Badge className="bg-yellow-100/90 text-yellow-800 hover:bg-yellow-100 shadow-sm border-0 rounded-full px-3 py-1">
                Bajo Stock
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Camiseta Premium
                </CardTitle>
                <Badge variant="outline" className="text-purple-600 border-purple-200 bg-purple-50/50 rounded-full px-3 py-1">
                  Ropa
                </Badge>
              </div>
            </CardHeader>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">$29.99</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Archive className="h-4 w-4" />
                <span className="text-sm">8 unidades disponibles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4" />
                <span className="text-sm">SKU: CPR-002</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ventas del mes:</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  23 unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Producto de ejemplo 3 */}
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white rounded-2xl group hover:scale-[1.02]">
          <div className="h-48 bg-gradient-to-br from-green-400 to-teal-500 relative">
            <div className="absolute top-4 left-4">
              <Badge className="bg-red-100/90 text-red-800 hover:bg-red-100 shadow-sm border-0 rounded-full px-3 py-1">
                Sin Stock
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Café Premium
                </CardTitle>
                <Badge variant="outline" className="text-green-600 border-green-200 bg-green-50/50 rounded-full px-3 py-1">
                  Alimentos
                </Badge>
              </div>
            </CardHeader>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">$15.99</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Archive className="h-4 w-4" />
                <span className="text-sm">0 unidades disponibles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4" />
                <span className="text-sm">SKU: CFP-003</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ventas del mes:</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  67 unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Producto de ejemplo 4 */}
        <Card className="overflow-hidden hover:shadow-2xl transition-all duration-300 border-0 shadow-lg bg-white rounded-2xl group hover:scale-[1.02]">
          <div className="h-48 bg-gradient-to-br from-pink-400 to-rose-500 relative">
            <div className="absolute top-4 left-4">
              <Badge className="bg-green-100/90 text-green-800 hover:bg-green-100 shadow-sm border-0 rounded-full px-3 py-1">
                En Stock
              </Badge>
            </div>
          </div>
          <CardContent className="p-6">
            <CardHeader className="p-0 mb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl font-semibold text-gray-900 group-hover:text-orange-600 transition-colors">
                  Libro de Cocina
                </CardTitle>
                <Badge variant="outline" className="text-indigo-600 border-indigo-200 bg-indigo-50/50 rounded-full px-3 py-1">
                  Libros
                </Badge>
              </div>
            </CardHeader>
            
            <div className="space-y-3">
              <div className="flex items-center gap-2 text-gray-600">
                <DollarSign className="h-4 w-4" />
                <span className="text-sm">$24.99</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Archive className="h-4 w-4" />
                <span className="text-sm">35 unidades disponibles</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Tag className="h-4 w-4" />
                <span className="text-sm">SKU: LCO-004</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Ventas del mes:</span>
                <span className="font-medium text-gray-900 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-500" />
                  18 unidades
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
