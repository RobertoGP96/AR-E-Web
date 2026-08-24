'use client';

import { useEffect, useMemo, useState } from 'react';
import { DollarSign } from 'lucide-react';

/**
 * Greeting header + live clock/calendar card + exchange-rate card,
 * ported from the Vite admin's Dashboard.tsx and ExchangeRateCard.tsx.
 */
export function DashboardGreeting({
  role,
  rate,
}: {
  role: string;
  rate: number;
}) {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Live clock: subscribing to wall-clock time is the "external
    // system" case — the first tick also hydrates the SSR placeholder.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const greeting = useMemo(() => {
    const hour = (now ?? new Date()).getHours();
    if (hour < 12) return '¡Buenos días!';
    if (hour < 19) return '¡Buenas tardes!';
    return '¡Buenas noches!';
  }, [now]);

  const month = now?.toLocaleString('es-ES', { month: 'long' }) ?? '';
  const weekday = now?.toLocaleString('es-ES', { weekday: 'long' }) ?? '';
  const dayNumber = now?.getDate().toString() ?? '';
  const time = now
    ? (() => {
        const h = now.getHours();
        const hour12 = h % 12 === 0 ? 12 : h % 12;
        const mm = now.getMinutes().toString().padStart(2, '0');
        const ss = now.getSeconds().toString().padStart(2, '0');
        return `${hour12}:${mm}:${ss} ${h < 12 ? 'am' : 'pm'}`;
      })()
    : '';

  return (
    <div className="relative animate-in rounded-2xl duration-700 slide-in-from-top">
      <div className="relative z-10">
        <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
          <div className="space-y-3">
            <h1 className="flex items-center gap-3 text-3xl font-bold text-gray-900 md:text-4xl">
              {greeting}
            </h1>
            <p className="mt-1 text-sm text-gray-500 md:text-base">
              {role === 'agent'
                ? 'Panel de Agente · Mi Resumen'
                : 'Panel de Administración · Resumen General'}
            </p>
          </div>
          <div className="flex flex-col items-end gap-4 sm:flex-row sm:items-center">
            {/* Exchange rate card */}
            <div className="w-full overflow-hidden rounded-xl border-2 border-orange-200 bg-white py-0 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg md:w-48">
              <div className="bg-orange-400 px-3 py-2">
                <div className="mb-0 flex items-center justify-center gap-2 pb-0 text-sm font-bold uppercase tracking-wider text-white">
                  <DollarSign className="h-4 w-4" aria-hidden />
                  Tasa Cambio
                </div>
              </div>
              <div className="bg-white p-2 text-center">
                <div className="flex flex-col items-center justify-center">
                  <div className="flex items-baseline gap-1">
                    <p className="text-4xl font-extrabold text-orange-400">
                      {rate > 0 ? rate.toFixed(2) : 'N/A'}
                    </p>
                    {rate > 0 ? (
                      <span className="text-xs font-bold text-orange-400/70">
                        CUP
                      </span>
                    ) : null}
                  </div>
                  <p className="mt-1 text-[10px] font-medium text-gray-400">
                    Actualizado hoy
                  </p>
                </div>
                {rate === 0 ? (
                  <div className="mt-2 rounded border border-amber-200 bg-amber-50 p-1 text-[10px] text-amber-800">
                    ⚠️ No configurada
                  </div>
                ) : null}
              </div>
            </div>

            {/* Calendar / clock card */}
            <div className="w-full overflow-hidden rounded-xl border-2 border-orange-200 bg-white shadow-sm md:w-36">
              <div className="flex items-center justify-center bg-orange-400 px-3 py-1 text-[14px] font-bold uppercase tracking-wider text-white">
                <span className="truncate">{month}</span>
              </div>
              <div className="bg-white p-3 text-center">
                <div className="text-[12px] font-bold uppercase tracking-tight text-orange-400/80">
                  {weekday}
                </div>
                <div className="my-1 text-4xl font-extrabold leading-none text-orange-400">
                  {dayNumber}
                </div>
                <div className="text-[12px] font-semibold text-gray-400">
                  {time}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
