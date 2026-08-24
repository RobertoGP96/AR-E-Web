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
    <div className="animate-in fade-in slide-in-from-top-2 duration-500">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-foreground md:text-4xl">
            {greeting}
          </h1>
          <p className="text-sm text-muted md:text-base">
            {role === 'agent'
              ? 'Panel de Agente · Mi Resumen'
              : 'Panel de Administración · Resumen General'}
          </p>
        </div>
        <div className="flex flex-col items-stretch gap-4 sm:flex-row sm:items-center">
          {/* Exchange rate card — brand gradient */}
          <div className="animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-100 duration-500 w-full overflow-hidden rounded-xl bg-gradient-to-br from-accent to-warning text-white shadow-md transition-all hover:-translate-y-1 hover:shadow-lg md:w-48">
            <div className="flex items-center justify-center gap-2 border-b border-white/25 px-3 py-2 text-sm font-bold uppercase tracking-wider">
              <DollarSign className="h-4 w-4" aria-hidden />
              Tasa Cambio
            </div>
            <div className="p-2 text-center">
              <div className="flex items-baseline justify-center gap-1">
                <p className="text-4xl font-extrabold tabular-nums">
                  {rate > 0 ? rate.toFixed(2) : 'N/A'}
                </p>
                {rate > 0 ? (
                  <span className="text-xs font-bold text-white/80">CUP</span>
                ) : null}
              </div>
              <p className="mt-1 text-[10px] font-medium text-white/75">
                Actualizado hoy
              </p>
              {rate === 0 ? (
                <div className="mt-2 rounded-md bg-white/15 px-2 py-1 text-[10px] font-semibold">
                  No configurada
                </div>
              ) : null}
            </div>
          </div>

          {/* Calendar / clock card */}
          <div className="surface-card animate-in fade-in slide-in-from-bottom-2 fill-mode-backwards delay-200 duration-500 w-full overflow-hidden md:w-36">
            <div className="flex items-center justify-center bg-accent px-3 py-1 text-sm font-bold uppercase tracking-wider text-accent-foreground">
              <span className="truncate">{month}</span>
            </div>
            <div className="p-3 text-center">
              <div className="text-xs font-bold uppercase tracking-tight text-accent">
                {weekday}
              </div>
              <div className="my-1 text-4xl font-extrabold leading-none tabular-nums text-foreground">
                {dayNumber}
              </div>
              <div className="text-xs font-semibold tabular-nums text-muted">
                {time}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
