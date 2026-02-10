import { DashboardCharts } from '@/components/charts';
import { MetricsSummaryCards, ProductMetrics, AlertsMetrics, ExchangeRateCard } from '@/components/metrics';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { useMemo, useEffect, useState } from 'react';

const Dashboard = () => {
  // Obtener saludo según hora del día
  const greeting = useMemo(() => {
    const hour = new Date().getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, []);

  // Variable para la hora/fecha en vivo
  const [timeNow, setTimeNow] = useState(new Date());
  useEffect(() => {
    const id = setInterval(() => setTimeNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  // Fecha actual formateada (gran día + detalle)
  const currentDayNumber = timeNow.getDate().toString();
  const currentShortMonthYear = timeNow.toLocaleString('es-ES', { month: 'long' });
  const currentWeekday = timeNow.toLocaleString('es-ES', { weekday: 'long' });

  // Hora actual formateada en 12 horas con am/pm (ej: 2:05:30 pm)
  const hour24 = timeNow.getHours();
  const hour12 = hour24 % 12 || 12;
  const minutes = timeNow.getMinutes().toString().padStart(2, '0');
  const seconds = timeNow.getSeconds().toString().padStart(2, '0');
  const ampm = hour24 >= 12 ? 'pm' : 'am';
  const currentTime = `${hour12}:${minutes}:${seconds} ${ampm}`;

  return (
    <div className="space-y-8 pb-8 animate-in fade-in duration-500">
      {/* Welcome Header Section */}
      <div className="relative  rounded-2xl  animate-in slide-in-from-top duration-700">

        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 flex items-center gap-3">
                    {greeting}
                  </h1>
                  <p className="text-gray-500 mt-1 text-sm md:text-base">
                    Panel de Administración · Resumen General
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-end sm:items-center gap-4">
              {/* Exchange Rate Card */}
              <ExchangeRateCard />
              
              {/* Calendar-style Card */}
              <Card className="bg-white border-2 border-orange-200 shadow-sm w-full md:w-35 overflow-hidden relative py-0 gap-0">
                <CardHeader className='p-0 gap-0'>
                  <div className="bg-orange-400 text-white px-3 py-1 text-[14px] font-bold uppercase flex items-center gap-0 justify-center tracking-wider">
                    <span className="truncate">{currentShortMonthYear}</span>
                  </div>
                </CardHeader>
                <CardContent className="p-0 bg-white">
                  <div className="p-3 text-white text-center">
                    <div className="text-[12px] font-bold uppercase tracking-tight text-orange-400/80">{currentWeekday}</div>
                    <div className="text-4xl text-orange-400 font-extrabold leading-none my-1">{currentDayNumber}</div>
                    <div className="text-[12px] font-semibold text-gray-400">{currentTime}</div>
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
              Métricas
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              Resumen de las métricas más importantes de tu negocio
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <MetricsSummaryCards />
      </section>

      {/* Product Metrics Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-300">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Métricas de Productos</h2>
            <p className="text-sm text-gray-600 mt-1">
              Estado y rendimiento de productos en el sistema
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <ProductMetrics />
      </section>

      {/* Alerts Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-400">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Alertas del Sistema</h2>
            <p className="text-sm text-gray-600 mt-1">
              Situaciones que requieren atención inmediata
            </p>
          </div>
        </div>
        <Separator className="my-4" />
        <AlertsMetrics />
      </section>

      {/* Analytics Section */}
      <section className="space-y-4 animate-in slide-in-from-bottom duration-700 delay-500">
        <div className="flex items-center gap-3">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-900">Análisis y Estadísticas</h2>
            <p className="text-sm text-gray-600 mt-1">
              Visualiza el rendimiento de tu negocio con gráficos interactivos
            </p>
          </div>

        </div>
        <Separator className="my-4" />
        <DashboardCharts />
      </section>

    </div>
  );
};

export default Dashboard;