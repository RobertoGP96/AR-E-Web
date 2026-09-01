import type { LucideIcon } from 'lucide-react';
import { Card } from '@heroui/react';
import { TrendingDown, TrendingUp } from 'lucide-react';

const TONES = {
  default: 'text-foreground bg-default',
  accent: 'text-accent bg-accent-soft',
  success: 'text-success-soft-foreground bg-success-soft',
  warning: 'text-warning-soft-foreground bg-warning-soft',
  danger: 'text-danger-soft-foreground bg-danger-soft',
} as const;

export type KpiTone = keyof typeof TONES;

export interface KpiDelta {
  /** Variación porcentual vs el período de referencia; null = sin base. */
  pct: number | null;
  /** Nombre del período de referencia ("vs mes anterior"). */
  label: string;
  /** true si subir es bueno (ingresos), false si es malo (gastos). */
  upIsGood?: boolean;
}

/** Sparkline de 12 puntos: línea en tono apagado, punto final en accent. */
function Sparkline({ points }: { points: number[] }) {
  const W = 96;
  const H = 28;
  const PAD = 3;
  const max = Math.max(...points);
  const min = Math.min(...points);
  const span = max - min || 1;
  const step = points.length > 1 ? (W - PAD * 2) / (points.length - 1) : 0;
  const coords = points.map((v, i) => [
    PAD + i * step,
    H - PAD - ((v - min) / span) * (H - PAD * 2),
  ]);
  const last = coords[coords.length - 1];
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="h-7 w-24"
      aria-hidden
      focusable="false"
    >
      <polyline
        points={coords.map(([x, y]) => `${x},${y}`).join(' ')}
        fill="none"
        stroke="var(--muted)"
        strokeWidth={1.5}
        strokeLinejoin="round"
        strokeLinecap="round"
        opacity={0.55}
      />
      {last ? (
        <circle
          cx={last[0]}
          cy={last[1]}
          r={3}
          fill="var(--accent)"
          stroke="var(--surface)"
          strokeWidth={2}
        />
      ) : null}
    </svg>
  );
}

/**
 * Stat tile analítico: etiqueta + valor (cifras proporcionales) + delta
 * firmado contra un período nombrado + sparkline de tendencia opcional.
 * El color del delta = dirección × si subir es bueno.
 */
export function KpiCard({
  icon: Icon,
  label,
  value,
  delta,
  spark,
  hint,
  tone = 'accent',
  className,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  delta?: KpiDelta;
  spark?: number[];
  hint?: string;
  tone?: KpiTone;
  className?: string;
}) {
  const up = delta?.pct != null && delta.pct >= 0;
  const good = delta?.pct != null && up === (delta.upIsGood ?? true);
  const DeltaIcon = up ? TrendingUp : TrendingDown;
  return (
    <Card
      className={`surface-card group gap-0 overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${className ?? ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="truncate text-xs font-medium uppercase tracking-wide text-muted">
          {label}
        </p>
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${TONES[tone]}`}
        >
          <Icon className="h-4 w-4" aria-hidden />
        </span>
      </div>
      <p className="mt-1 text-xl font-bold text-foreground sm:text-2xl">
        {value}
      </p>
      <div className="mt-1.5 flex items-end justify-between gap-2">
        <div className="min-w-0">
          {delta ? (
            <p className="flex items-center gap-1 text-xs">
              {delta.pct == null ? (
                <span className="text-muted">— {delta.label}</span>
              ) : (
                <>
                  <span
                    className={`flex items-center gap-0.5 font-semibold ${good ? 'text-success' : 'text-danger'}`}
                  >
                    <DeltaIcon className="h-3.5 w-3.5" aria-hidden />
                    {delta.pct > 0 ? '+' : ''}
                    {delta.pct.toFixed(1)}%
                  </span>
                  <span className="truncate text-muted">{delta.label}</span>
                </>
              )}
            </p>
          ) : null}
          {hint ? (
            <p className="mt-0.5 truncate text-xs text-muted">{hint}</p>
          ) : null}
        </div>
        {spark && spark.length > 1 ? <Sparkline points={spark} /> : null}
      </div>
    </Card>
  );
}
