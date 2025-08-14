import { useState } from 'react';
import { Save, User, Shield, Bell, Database, Settings as SettingsIcon, StoreIcon } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ShopsHeader, ShopsTable } from '@/components/shops';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'stores', name: 'Tiendas', icon: StoreIcon },
    { id: 'security', name: 'Seguridad', icon: Shield },
    { id: 'system', name: 'Sistema', icon: Database },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <SettingsIcon className="h-8 w-8 text-orange-500" />
            Configuración
          </h1>
          <p className="text-gray-600 mt-2">
            Personaliza la configuración de tu panel de administración
          </p>
        </div>
      </div>

      <div className="lg:grid lg:grid-cols-12 lg:gap-x-6">
        {/* Sidebar */}
        <aside className="lg:col-span-3">
          <Card className="shadow-lg border-0 bg-white rounded-2xl">
            <CardContent className="p-6">
              <nav className="space-y-2">
                {tabs.map((tab) => {
                  const Icon = tab.icon;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`group rounded-xl px-4 py-3 flex items-center text-sm font-medium w-full text-left transition-all duration-200 ${
                        activeTab === tab.id
                          ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                          : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                      }`}
                    >
                      <Icon
                        className={`flex-shrink-0 mr-3 h-5 w-5 ${
                          activeTab === tab.id
                            ? 'text-white'
                            : 'text-gray-400 group-hover:text-orange-500'
                        }`}
                        aria-hidden="true"
                      />
                      <span className="truncate">{tab.name}</span>
                    </button>
                  );
                })}
              </nav>
            </CardContent>
          </Card>
        </aside>

        {/* Main content */}
        <div className="space-y-6 lg:col-span-9">
          {activeTab === 'general' && (
            <form className="space-y-6">
              <Card className="shadow-lg border-0 bg-white rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900">
                    Información General
                  </CardTitle>
                  <p className="text-gray-600">
                    Configuración básica del sistema
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Nombre de la aplicación
                      </label>
                      <Input
                        type="text"
                        defaultValue="Admin Panel"
                        className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Idioma
                      </label>
                      <select className="w-full py-3 px-4 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm">
                        <option>Español</option>
                        <option>English</option>
                        <option>Français</option>
                      </select>
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        URL del sitio
                      </label>
                      <Input
                        type="url"
                        defaultValue="https://admin.example.com"
                        className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                      />
                    </div>

                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Descripción
                      </label>
                      <textarea
                        rows={3}
                        defaultValue="Panel de administración para gestión de recursos"
                        className="w-full py-3 px-4 border border-gray-200 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm resize-none"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0">
                  <Save className="h-4 w-4 mr-2" />
                  Guardar cambios
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'notifications' && (
            <Card className="shadow-lg border-0 bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Notificaciones
                </CardTitle>
                <p className="text-gray-600">
                  Configura cómo y cuándo recibir notificaciones
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <h4 className="text-base font-medium text-gray-900 mb-4">Notificaciones por Email</h4>
                  <div className="space-y-4">
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="new-users"
                          name="new-users"
                          type="checkbox"
                          defaultChecked
                          className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="new-users" className="font-medium text-gray-700 text-sm">
                          Nuevos usuarios
                        </label>
                        <p className="text-gray-500 text-sm">Recibir notificación cuando se registre un nuevo usuario</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="new-orders"
                          name="new-orders"
                          type="checkbox"
                          defaultChecked
                          className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="new-orders" className="font-medium text-gray-700 text-sm">
                          Nuevas órdenes
                        </label>
                        <p className="text-gray-500 text-sm">Recibir notificación cuando se genere una nueva orden</p>
                      </div>
                    </div>
                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id="out-of-stock"
                          name="out-of-stock"
                          type="checkbox"
                          className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3">
                        <label htmlFor="out-of-stock" className="font-medium text-gray-700 text-sm">
                          Productos sin stock
                        </label>
                        <p className="text-gray-500 text-sm">Notificar cuando un producto se quede sin stock</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'security' && (
            <Card className="shadow-lg border-0 bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Seguridad
                </CardTitle>
                <p className="text-gray-600">
                  Configuración de seguridad y autenticación
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-4">
                    Cambiar contraseña
                  </label>
                  <div className="space-y-4">
                    <Input
                      type="password"
                      placeholder="Contraseña actual"
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                    <Input
                      type="password"
                      placeholder="Nueva contraseña"
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                    <Input
                      type="password"
                      placeholder="Confirmar nueva contraseña"
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="two-factor"
                        name="two-factor"
                        type="checkbox"
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="two-factor" className="font-medium text-gray-700 text-sm">
                        Autenticación de dos factores
                      </label>
                      <p className="text-gray-500 text-sm">Añade una capa extra de seguridad a tu cuenta</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'system' && (
            <Card className="shadow-lg border-0 bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900">
                  Sistema
                </CardTitle>
                <p className="text-gray-600">
                  Configuración técnica del sistema
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Zona horaria
                    </label>
                    <select className="w-full py-3 px-4 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm">
                      <option>America/Mexico_City</option>
                      <option>America/New_York</option>
                      <option>Europe/Madrid</option>
                      <option>Asia/Tokyo</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Formato de fecha
                    </label>
                    <select className="w-full py-3 px-4 border border-gray-200 bg-white rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-200 focus:border-orange-300 text-sm">
                      <option>DD/MM/YYYY</option>
                      <option>MM/DD/YYYY</option>
                      <option>YYYY-MM-DD</option>
                    </select>
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="maintenance"
                        name="maintenance"
                        type="checkbox"
                        className="focus:ring-orange-500 h-4 w-4 text-orange-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3">
                      <label htmlFor="maintenance" className="font-medium text-gray-700 text-sm">
                        Modo mantenimiento
                      </label>
                      <p className="text-gray-500 text-sm">Desactivar temporalmente el acceso al sistema</p>
                    </div>
                  </div>
                </div>

                <div className="pt-6 border-t border-gray-100">
                  <h4 className="text-sm font-medium text-gray-900 mb-4">Información del sistema</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <div className="bg-gray-50 rounded-xl p-4">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Versión</dt>
                      <dd className="text-sm text-gray-900 font-semibold">
                        <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                          v1.2.3
                        </Badge>
                      </dd>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Base de datos</dt>
                      <dd className="text-sm text-gray-900 font-semibold">PostgreSQL 14.2</dd>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Última actualización</dt>
                      <dd className="text-sm text-gray-900 font-semibold">08/01/2025</dd>
                    </div>
                    <div className="bg-gray-50 rounded-xl p-4">
                      <dt className="text-sm font-medium text-gray-500 mb-1">Almacenamiento usado</dt>
                      <dd className="text-sm text-gray-900 font-semibold">2.4 GB / 10 GB</dd>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {activeTab === 'stores' && (
            <Card className="shadow-lg border-0 bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <ShopsHeader/>
              </CardHeader>
              <CardContent className="space-y-6">
                <ShopsTable/>
              </CardContent>
            </Card>
          )}
          

          {activeTab !== 'general' && (
            <div className="flex justify-end">
              <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0">
                <Save className="h-4 w-4 mr-2" />
                Guardar cambios
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
