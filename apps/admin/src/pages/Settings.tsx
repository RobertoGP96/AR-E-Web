import { useState, useEffect } from 'react';
import { Save, User, Shield, Bell, Database, Settings as SettingsIcon, DollarSign, Loader2, Info, Repeat, BaggageClaim, HardDrive, Server } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useSystemConfig } from '@/hooks/useSystemConfig';
import { useChangePassword } from '@/hooks/useChangePassword';
import { useSystemInfo } from '@/hooks/useSystemInfo';
import { toast } from 'sonner';

const Settings = () => {
  const [activeTab, setActiveTab] = useState('general');
  const { config, isLoading: isLoadingConfig, updateConfig, isUpdating } = useSystemConfig();
  const { mutate: changePassword, isPending: isChangingPassword } = useChangePassword();
  const { data: systemInfo, isLoading: isLoadingSystemInfo } = useSystemInfo();

  // Estados locales para el formulario de variables
  const [changeRate, setChangeRate] = useState('0');
  const [costPerPound, setCostPerPound] = useState('0');

  // Estados para el formulario de cambio de contraseña
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Sincronizar valores cuando se carga la configuración
  useEffect(() => {
    if (config) {
      setChangeRate(config.change_rate.toString());
      setCostPerPound(config.cost_per_pound.toString());
    }
  }, [config]);

  const handleSaveVariables = () => {
    const changeRateValue = parseFloat(changeRate);
    const costPerPoundValue = parseFloat(costPerPound);

    // Validación de tasa de cambio
    if (isNaN(changeRateValue) || changeRateValue < 0) {
      toast.error('Error de validación', {
        description: 'La tasa de cambio debe ser un número válido y positivo'
      });
      return;
    }

    // Validación de costo por libra
    if (isNaN(costPerPoundValue) || costPerPoundValue < 0) {
      toast.error('Error de validación', {
        description: 'El costo por libra debe ser un número válido y positivo'
      });
      return;
    }

    // Ejecutar actualización
    updateConfig({
      change_rate: changeRateValue,
      cost_per_pound: costPerPoundValue,
    });
  };

  const handleChangePassword = () => {
    // Validar que todos los campos estén llenos
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error('Error de validación', {
        description: 'Todos los campos son obligatorios'
      });
      return;
    }

    // Validar que las contraseñas coincidan
    if (newPassword !== confirmPassword) {
      toast.error('Error de validación', {
        description: 'Las contraseñas no coinciden'
      });
      return;
    }

    // Validar longitud mínima
    if (newPassword.length < 6) {
      toast.error('Error de validación', {
        description: 'La nueva contraseña debe tener al menos 6 caracteres'
      });
      return;
    }

    // Ejecutar cambio de contraseña
    changePassword(
      {
        current_password: currentPassword,
        new_password: newPassword,
      },
      {
        onSuccess: () => {
          // Limpiar formulario
          setCurrentPassword('');
          setNewPassword('');
          setConfirmPassword('');
        },
      }
    );
  };

  const tabs = [
    { id: 'general', name: 'General', icon: User },
    { id: 'notifications', name: 'Notificaciones', icon: Bell },
    { id: 'variables', name: 'Variables del Sistema', icon: DollarSign },
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
                      className={`group rounded-xl px-4 py-3 flex items-center text-sm font-medium w-full text-left transition-all duration-200 ${activeTab === tab.id
                        ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg'
                        : 'text-gray-700 hover:text-orange-600 hover:bg-orange-50'
                        }`}
                    >
                      <Icon
                        className={`flex-shrink-0 mr-3 h-5 w-5 ${activeTab === tab.id
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

          {activeTab === 'variables' && (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSaveVariables(); }}>
              <Card className="shadow-lg border-0 bg-white rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                    <DollarSign className="h-6 w-6 text-orange-500" />
                    Variables del Sistema
                  </CardTitle>
                  <p className="text-gray-600">
                    Configura las variables económicas que afectan los cálculos de costos y ganancias
                  </p>
                </CardHeader>
                <CardContent className="space-y-8">
                  {/* Estado de carga */}
                  {isLoadingConfig && (
                    <div className="flex items-center justify-center py-12">
                      <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                      <span className="ml-3 text-gray-600">Cargando configuración...</span>
                    </div>
                  )}

                  {/* Contenido cuando hay datos */}
                  {!isLoadingConfig && config && (
                    <>
                      {/* Información importante */}
                      <div className="bg-gray-50 border border-gray-200 rounded-xl p-4">
                        <div className="flex">
                          <div className="flex-shrink-0">
                            <Info className="h-5 w-5 inline mr-1" />
                          </div>
                          <div className="ml-3 flex-1">
                            <h3 className="text-sm font-medium text-gray-800">
                              Información Importante
                            </h3>
                            <div className="mt-2 text-sm text-gray-700">
                              <p>Estas variables se utilizan para calcular:</p>
                              <ul className="list-disc list-inside mt-2 space-y-1">
                                <li>Costos de productos en moneda local</li>
                                <li>Costos de envío y deliveries</li>
                                <li>Ganancias y márgenes de utilidad</li>
                              </ul>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Formulario de variables */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Tasa de cambio */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            <Repeat className="inline h-5 w-5 mr-1 text-orange-500" />
                            Tasa de Cambio (USD)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={changeRate}
                              onChange={(e) => setChangeRate(e.target.value)}
                              placeholder="0.00"
                              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                              disabled={isLoadingConfig}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Tasa de conversión de USD a tu moneda local
                          </p>
                          {config && (
                            <div className="bg-gray-50 rounded-lg p-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Valor actual:</span>
                                <span className="font-semibold text-gray-900">${config.change_rate.toFixed(2)}</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-gray-600">Última actualización:</span>
                                <span className="text-gray-900">{new Date(config.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* Costo por libra */}
                        <div className="space-y-3">
                          <label className="block text-sm font-medium text-gray-700">
                            <BaggageClaim className="inline h-5 w-5 mr-1 text-orange-500" /> Costo por Libra (USD)
                          </label>
                          <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                              <DollarSign className="h-5 w-5 text-gray-400" />
                            </div>
                            <Input
                              type="number"
                              step="0.01"
                              min="0"
                              value={costPerPound}
                              onChange={(e) => setCostPerPound(e.target.value)}
                              placeholder="0.00"
                              className="pl-10 border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                              disabled={isLoadingConfig}
                            />
                          </div>
                          <p className="text-xs text-gray-500">
                            Costo general de envío por libra (lb) en USD
                          </p>
                          {config && (
                            <div className="bg-gray-50 rounded-lg p-3 text-xs">
                              <div className="flex justify-between">
                                <span className="text-gray-600">Valor actual:</span>
                                <span className="font-semibold text-gray-900">${config.cost_per_pound.toFixed(2)}/lb</span>
                              </div>
                              <div className="flex justify-between mt-1">
                                <span className="text-gray-600">Última actualización:</span>
                                <span className="text-gray-900">{new Date(config.updated_at).toLocaleDateString()}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {/* Error al cargar */}
                  {!isLoadingConfig && !config && (
                    <div className="flex flex-col items-center justify-center py-12">
                      <div className="text-red-500 mb-2">⚠️</div>
                      <p className="text-gray-600">No se pudo cargar la configuración del sistema</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isLoadingConfig || isUpdating || !config}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
                >
                  {isUpdating ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Guardando...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Guardar Variables
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'security' && (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleChangePassword(); }}>
              <Card className="shadow-lg border-0 bg-white rounded-2xl">
                <CardHeader className="pb-4">
                  <CardTitle className="text-xl font-semibold flex flex-row gap-2  text-gray-900">
                    <Shield className="h-6 w-6 text-orange-500" />
                    Seguridad - Cambiar contraseña
                  </CardTitle>
                  <p className="text-gray-600">
                    Configuración de seguridad y autenticación
                  </p>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div>

                    <div className="space-y-4">
                      <div>
                        <label htmlFor="current-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Contraseña actual
                        </label>
                        <Input
                          id="current-password"
                          type="password"
                          placeholder="Ingresa tu contraseña actual"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                          disabled={isChangingPassword}
                        />
                      </div>
                      <div>
                        <label htmlFor="new-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Nueva contraseña
                        </label>
                        <Input
                          id="new-password"
                          type="password"
                          placeholder="Ingresa tu nueva contraseña"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                          disabled={isChangingPassword}
                        />
                        <p className="text-xs text-gray-500 mt-1">
                          La contraseña debe tener al menos 6 caracteres
                        </p>
                      </div>
                      <div>
                        <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700 mb-2">
                          Confirmar nueva contraseña
                        </label>
                        <Input
                          id="confirm-password"
                          type="password"
                          placeholder="Confirma tu nueva contraseña"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                          disabled={isChangingPassword}
                        />
                      </div>
                    </div>
                  </div>

                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  type="submit"
                  disabled={isChangingPassword}
                  className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
                >
                  {isChangingPassword ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Cambiando contraseña...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Cambiar contraseña
                    </>
                  )}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'system' && (
            <Card className="shadow-lg border-0 bg-white rounded-2xl">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="h-6 w-6 text-orange-500" />
                  Sistema
                </CardTitle>
                <p className="text-gray-600">
                  Información técnica del sistema y base de datos
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Estado de carga */}
                {isLoadingSystemInfo && (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
                    <span className="ml-3 text-gray-600">Cargando información del sistema...</span>
                  </div>
                )}

                {/* Contenido cuando hay datos */}
                {!isLoadingSystemInfo && systemInfo && (
                  <>
                    {/* Información de la aplicación */}
                    <div>
                      <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <Server className="h-4 w-4 text-orange-500" />
                        Información de la Aplicación
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Versión</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            <Badge variant="outline" className="text-orange-600 border-orange-200 bg-orange-50">
                              v{systemInfo.application.version}
                            </Badge>
                          </dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Última actualización</dt>
                          <dd className="text-sm text-gray-900 font-semibold">{systemInfo.application.last_updated}</dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Entorno</dt>
                          <dd className="text-sm text-gray-900 font-semibold capitalize">
                            {systemInfo.application.environment}
                          </dd>
                        </div>
                      </div>
                    </div>

                    {/* Información de la base de datos */}
                    <div className="pt-4 border-t border-gray-100">
                      <h4 className="text-sm font-medium text-gray-900 mb-4 flex items-center gap-2">
                        <HardDrive className="h-4 w-4 text-orange-500" />
                        Base de Datos
                      </h4>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-700 mb-1">Motor de Base de Datos</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {systemInfo.technology.database_type}
                          </dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-700 mb-1">Tamaño de BD</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {systemInfo.database.size_mb.toFixed(2)} MB
                          </dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-700 mb-1">Número de Tablas</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {systemInfo.database.tables_count}
                          </dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-700 mb-1">Total de Registros</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {systemInfo.database.total_records.toLocaleString()}
                          </dd>
                        </div>
                      </div>
                    </div>



                    {/* Tecnología */}
                    <div className="pt-4 border-t border-gray-100 ">
                      <h4 className="text-sm font-medium text-gray-900 mb-4">Stack Tecnológico</h4>
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 ">
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Django</dt>
                          <dd className="text-sm text-gray-900 font-semibold">v{systemInfo.technology.django_version}</dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Python</dt>
                          <dd className="text-sm text-gray-900 font-semibold">v{systemInfo.technology.python_version}</dd>
                        </div>
                        <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
                          <dt className="text-sm font-medium text-gray-500 mb-1">Sistema Operativo</dt>
                          <dd className="text-sm text-gray-900 font-semibold">
                            {systemInfo.server.os} {systemInfo.server.os_version}
                          </dd>
                        </div>
                      </div>
                    </div>
                  </>
                )}

                {/* Error al cargar */}
                {!isLoadingSystemInfo && !systemInfo && (
                  <div className="flex flex-col items-center justify-center py-12">
                    <div className="text-red-500 mb-2 text-2xl">⚠️</div>
                    <p className="text-gray-600">No se pudo cargar la información del sistema</p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}



          {activeTab !== 'general' && activeTab !== 'stores' && activeTab !== 'variables' && activeTab !== 'security' && (
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
