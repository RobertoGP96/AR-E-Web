import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  change?: string;
  changeType?: 'increase' | 'decrease' | 'neutral';
  loading?: boolean;
  className?: string;
}

/**
 * Componente genérico para mostrar tarjetas de métricas
 */
export const MetricCard = ({
  title,
  value,
  icon: Icon,
  change,
  changeType = 'neutral',
  loading = false,
  className
}: MetricCardProps) => {
  const getChangeColor = () => {
    switch (changeType) {
      case 'increase':
        return 'text-green-600 bg-green-50';
      case 'decrease':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <Card className={cn("transition-all duration-200 hover:shadow-md", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {loading ? (
            <div className="h-8 bg-gray-200 rounded animate-pulse" />
          ) : (
            value
          )}
        </div>
        {change && (
          <div className="flex items-center space-x-1 mt-1">
            <Badge variant="secondary" className={cn("text-xs", getChangeColor())}>
              {change}
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
};