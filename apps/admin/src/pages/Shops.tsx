import { Store, Plus, Search, MapPin, Clock, Users } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

export default function Shops() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <Store className="h-8 w-8 text-orange-500" />
            Tiendas
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona las tiendas y sucursales del sistema
          </p>
        </div>
        <Button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-xl hover:shadow-lg transition-all duration-200">
          <Plus className="h-5 w-5" />
          Nueva Tienda
        </Button>
      </div>

      {/* Filtros */}
      <Card className="rounded-xl shadow-sm border border-gray-200">
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  type="text"
                  placeholder="Buscar tiendas..."
                  className="pl-10"
                />
              </div>
            </div>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todas las ubicaciones" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bogota">Bogotá</SelectItem>
                <SelectItem value="medellin">Medellín</SelectItem>
                <SelectItem value="cali">Cali</SelectItem>
              </SelectContent>
            </Select>
            <Select>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Todos los estados" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="activa">Activa</SelectItem>
                <SelectItem value="inactiva">Inactiva</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Tiendas Activas</p>
                <p className="text-2xl font-bold text-gray-900">12</p>
              </div>
              <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                <Store className="h-6 w-6 text-green-600" />
              </div>
            </div>
            <p className="text-sm text-green-600 mt-2">Operando normalmente</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Empleados</p>
                <p className="text-2xl font-bold text-gray-900">156</p>
              </div>
              <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
            </div>
            <p className="text-sm text-blue-600 mt-2">En todas las tiendas</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Ventas del Mes</p>
                <p className="text-2xl font-bold text-gray-900">$24.5M</p>
              </div>
              <div className="h-12 w-12 bg-orange-100 rounded-lg flex items-center justify-center">
                <MapPin className="h-6 w-6 text-orange-600" />
              </div>
            </div>
            <p className="text-sm text-orange-600 mt-2">+15% vs mes anterior</p>
          </CardContent>
        </Card>

        <Card className="rounded-xl shadow-sm border border-gray-200">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Promedio Diario</p>
                <p className="text-2xl font-bold text-gray-900">$816K</p>
              </div>
              <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                <Clock className="h-6 w-6 text-purple-600" />
              </div>
            </div>
            <p className="text-sm text-purple-600 mt-2">Por tienda</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de Tiendas */}
      <Card className="rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nombre</TableHead>
                <TableHead>Dirección</TableHead>
                <TableHead>Ciudad</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Empleados</TableHead>
                <TableHead>Ventas del Mes</TableHead>
                <TableHead>Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium">Tienda Centro</TableCell>
                <TableCell>Carrera 7 #32-16</TableCell>
                <TableCell>Bogotá</TableCell>
                <TableCell>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    12 empleados
                  </div>
                </TableCell>
                <TableCell className="font-medium">$2,450,000</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" className="text-orange-600 hover:text-orange-900 p-0">
                      Ver Detalles
                    </Button>
                    <Button variant="link" className="text-blue-600 hover:text-blue-900 p-0">
                      Editar
                    </Button>
                    <Button variant="link" className="text-purple-600 hover:text-purple-900 p-0">
                      Reportes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tienda Norte</TableCell>
                <TableCell>Calle 85 #15-22</TableCell>
                <TableCell>Bogotá</TableCell>
                <TableCell>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    8 empleados
                  </div>
                </TableCell>
                <TableCell className="font-medium">$1,850,000</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" className="text-orange-600 hover:text-orange-900 p-0">
                      Ver Detalles
                    </Button>
                    <Button variant="link" className="text-blue-600 hover:text-blue-900 p-0">
                      Editar
                    </Button>
                    <Button variant="link" className="text-purple-600 hover:text-purple-900 p-0">
                      Reportes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tienda Sur</TableCell>
                <TableCell>Carrera 30 #8-45</TableCell>
                <TableCell>Bogotá</TableCell>
                <TableCell>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    15 empleados
                  </div>
                </TableCell>
                <TableCell className="font-medium">$3,200,000</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" className="text-orange-600 hover:text-orange-900 p-0">
                      Ver Detalles
                    </Button>
                    <Button variant="link" className="text-blue-600 hover:text-blue-900 p-0">
                      Editar
                    </Button>
                    <Button variant="link" className="text-purple-600 hover:text-purple-900 p-0">
                      Reportes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tienda Medellín Centro</TableCell>
                <TableCell>Carrera 43A #19-45</TableCell>
                <TableCell>Medellín</TableCell>
                <TableCell>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    Mantenimiento
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    10 empleados
                  </div>
                </TableCell>
                <TableCell className="font-medium">$1,950,000</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" className="text-orange-600 hover:text-orange-900 p-0">
                      Ver Detalles
                    </Button>
                    <Button variant="link" className="text-blue-600 hover:text-blue-900 p-0">
                      Editar
                    </Button>
                    <Button variant="link" className="text-purple-600 hover:text-purple-900 p-0">
                      Reportes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell className="font-medium">Tienda Cali Valle</TableCell>
                <TableCell>Avenida 6N #25-40</TableCell>
                <TableCell>Cali</TableCell>
                <TableCell>
                  <span className="px-3 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                    Activa
                  </span>
                </TableCell>
                <TableCell>
                  <div className="flex items-center gap-1">
                    <Users className="h-4 w-4" />
                    18 empleados
                  </div>
                </TableCell>
                <TableCell className="font-medium">$2,800,000</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="link" className="text-orange-600 hover:text-orange-900 p-0">
                      Ver Detalles
                    </Button>
                    <Button variant="link" className="text-blue-600 hover:text-blue-900 p-0">
                      Editar
                    </Button>
                    <Button variant="link" className="text-purple-600 hover:text-purple-900 p-0">
                      Reportes
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
