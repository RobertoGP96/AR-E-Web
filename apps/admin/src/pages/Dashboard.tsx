import { LayoutDashboard, Calendar, Clock, Sparkles } from 'lucide-react';
import AdminFeatures from '@/components/admin/AdminFeatures';
import { DashboardCharts } from '@/components/charts';
import { MetricsSummaryCards } from '@/components/metrics';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useMemo } from 'react';
import CloudinaryImage from '@/components/images/CloudinaryImage';

const Dashboard = () => {
  // Obtener saludo según hora del día
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, []);

  // Fecha actual formateada
  const currentDate = useMemo(() => {
    return new Date().toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }, []);

  // Hora actual formateada
  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString('es-ES', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }, []);

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Welcome Header Section */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-primary  to-orange-400 p-8 shadow-2xl animate-in slide-in-from-top duration-700">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -mt-4 -mr-4 h-32 w-32 rounded-full bg-white/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 -mb-8 -ml-8 h-40 w-40 rounded-full bg-white/10 blur-3xl" />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl shadow-lg">
                  <LayoutDashboard className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-white flex items-center gap-3">
                    {greeting}
                    <Sparkles className="h-6 w-6 text-yellow-300 animate-pulse" />
                  </h1>
                  <p className="text-orange-100 mt-1 text-sm md:text-base">
                    Panel de Administración · Resumen General
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex flex-col gap-2">
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg">
                <CardContent className="">
                  <div className="flex items-center gap-3 text-white">
                    <Calendar className="h-5 w-5 text-orange-200" />
                    <div>
                      <p className="text-xs text-orange-200 uppercase tracking-wide">Fecha</p>
                      <p className="font-semibold capitalize">{currentDate}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              <Card className="bg-white/10 backdrop-blur-sm border-white/20 shadow-lg p-0">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3 text-white">
                    <Clock className="h-5 w-5 text-orange-200" />
                    <div>
                      <p className="text-xs text-orange-200 uppercase tracking-wide">Hora</p>
                      <p className="font-semibold">{currentTime}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-150">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              Métricas Clave
              <Badge variant="secondary" className="bg-orange-50 text-orange-700 border-orange-200">
                En vivo
              </Badge>
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Resumen de las métricas más importantes de tu negocio
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <MetricsSummaryCards />
      </section>

      {/* Analytics Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-300">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Análisis y Estadísticas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visualiza el rendimiento de tu negocio con gráficos interactivos
            </p>
          </div>
          <div className='min-h-2 bg-amber-600'>
            <CloudinaryImage />
          </div>
        </div>
        <Separator className="my-4" />
        <DashboardCharts />
      </section>

      {/* Features Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-500">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Funcionalidades</h2>
            <p className="text-sm text-gray-600 mt-1">
              Gestiona las características disponibles en el panel de administración
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <AdminFeatures />
      </section>
    </div>
  );
};

export default Dashboard;