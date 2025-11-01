import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  loading?: boolean;
  className?: string;
  color?: 'blue' | 'green' | 'orange' | 'purple' | 'red' | 'indigo' | 'pink' | 'cyan';
}

/**
 * Componente genérico para mostrar tarjetas de métricas con diseño mejorado
 */
export const MetricCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  loading = false,
  className,
  color = 'blue'
}: MetricCardProps) => {
  const getChangeStyles = () => {
    switch (changeType) {
      case 'increase':
        return {
          color: 'text-emerald-700 bg-emerald-50 border-emerald-200',
          icon: TrendingUp
        };
      case 'decrease':
        return {
          color: 'text-rose-700 bg-rose-50 border-rose-200',
          icon: TrendingDown
        };
      default:
        return {
          color: 'text-slate-700 bg-slate-50 border-slate-200',
          icon: Minus
        };
    }
  };

  const getColorStyles = () => {
    const styles = {
      blue: {
        icon: 'text-blue-600 bg-gradient-to-br from-blue-50 to-blue-100/50',
        border: 'border-blue-100',
        hover: 'hover:border-blue-200 hover:shadow-blue-100/50'
      },
      green: {
        icon: 'text-emerald-600 bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        border: 'border-emerald-100',
        hover: 'hover:border-emerald-200 hover:shadow-emerald-100/50'
      },
      orange: {
        icon: 'text-orange-600 bg-gradient-to-br from-orange-50 to-orange-100/50',
        border: 'border-orange-100',
        hover: 'hover:border-orange-200 hover:shadow-orange-100/50'
      },
      purple: {
        icon: 'text-purple-600 bg-gradient-to-br from-purple-50 to-purple-100/50',
        border: 'border-purple-100',
        hover: 'hover:border-purple-200 hover:shadow-purple-100/50'
      },
      red: {
        icon: 'text-rose-600 bg-gradient-to-br from-rose-50 to-rose-100/50',
        border: 'border-rose-100',
        hover: 'hover:border-rose-200 hover:shadow-rose-100/50'
      },
      indigo: {
        icon: 'text-indigo-600 bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        border: 'border-indigo-100',
        hover: 'hover:border-indigo-200 hover:shadow-indigo-100/50'
      },
      pink: {
        icon: 'text-pink-600 bg-gradient-to-br from-pink-50 to-pink-100/50',
        border: 'border-pink-100',
        hover: 'hover:border-pink-200 hover:shadow-pink-100/50'
      },
      cyan: {
        icon: 'text-cyan-600 bg-gradient-to-br from-cyan-50 to-cyan-100/50',
        border: 'border-cyan-100',
        hover: 'hover:border-cyan-200 hover:shadow-cyan-100/50'
      }
    };
    return styles[color];
  };

  const changeStyles = getChangeStyles();
  const colorStyles = getColorStyles();
  const ChangeIcon = changeStyles.icon;

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-lg border-2",
      colorStyles.border,
      colorStyles.hover,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <p className="text-sm font-medium text-muted-foreground mb-2">
              {title}
            </p>
            <div className="space-y-2">
              {loading ? (
                <div className="h-9 w-32 bg-gradient-to-r from-gray-200 to-gray-100 rounded animate-pulse" />
              ) : (
                <p className="text-3xl font-bold tracking-tight bg-gradient-to-br from-foreground to-muted-foreground bg-clip-text">
                  {value}
                </p>
              )}
              {change && !loading && (
                <Badge 
                  variant="secondary" 
                  className={cn(
                    "text-xs font-semibold border flex items-center gap-1 w-fit",
                    changeStyles.color
                  )}
                >
                  <ChangeIcon className="w-3 h-3" />
                  {change}
                </Badge>
              )}
            </div>
          </div>
          <div className={cn(
            "p-3 rounded-xl shadow-sm",
            colorStyles.icon
          )}>
            <Icon className="w-6 h-6" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};