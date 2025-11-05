import React, { useEffect, useState } from 'react';
import { getAllFeatures, subscribeFeatures, setFeatureEnabled } from '@/config/adminFeatures';
import type { AdminFeature } from '@/config/adminFeatures';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2, Circle, Calendar } from 'lucide-react';
import { Switch } from '@/components/ui/switch';

export const AdminFeatures: React.FC = () => {
  const [features, setFeatures] = useState<AdminFeature[]>(() => getAllFeatures());

  useEffect(() => {
    const unsub = subscribeFeatures((f) => setFeatures(f));
    return unsub;
  }, []);

  const toggle = (id: string, enabled: boolean) => {
    setFeatureEnabled(id, enabled);
  };

  const activeCount = features.filter(f => f.enabled).length;
  const totalCount = features.length;

  return (
    <Card className="border-2 shadow-sm hover:shadow-lg transition-shadow duration-300">
      <CardHeader className="border-b bg-gradient-to-r from-gray-50 to-white">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-gray-900">
            Estado de Funcionalidades
          </CardTitle>
          <div className="flex items-center gap-2">
            <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-semibold">
              {activeCount} / {totalCount} activas
            </Badge>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-6">
        <div className="space-y-3">
          {features.map(f => (
            <div
              key={f.id}
              className="group relative flex items-start justify-between gap-4 p-4 rounded-lg border-2 border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all duration-200"
            >
              {/* Left content */}
              <div className="flex items-start gap-3 flex-1">
                <div className="pt-1">
                  {f.enabled ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <Circle className="h-5 w-5 text-gray-300" />
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h4 className={`text-sm font-semibold ${
                      f.enabled 
                        ? 'text-gray-900' 
                        : 'text-gray-500'
                    }`}>
                      {f.title}
                    </h4>
                    
                    {f.enabled ? (
                      <Badge className="bg-emerald-100 text-emerald-700 border-emerald-300 hover:bg-emerald-100">
                        Completado
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-300">
                        Próximamente
                      </Badge>
                    )}
                  </div>
                  
                  {f.description && (
                    <p className={`text-xs mt-1.5 ${
                      f.enabled 
                        ? 'text-gray-600' 
                        : 'text-gray-500'
                    }`}>
                      {f.description}
                    </p>
                  )}
                  
                  {f.addedAt && (
                    <div className="flex items-center gap-1.5 mt-2">
                      <Calendar className="h-3 w-3 text-gray-400" />
                      <span className="text-xs text-gray-500">
                        {new Date(f.addedAt).toLocaleDateString('es-ES', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric'
                        })}
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Right content - Switch */}
              <div className="flex items-center">
                <Switch
                  checked={f.enabled}
                  onCheckedChange={(checked: boolean) => toggle(f.id, checked)}
                  className="data-[state=checked]:bg-emerald-500"
                />
              </div>
            </div>
          ))}
        </div>

        {/* Summary footer */}
        <div className="mt-6 pt-6 border-t border-gray-200">
          <div className="flex items-center justify-between text-sm">
            <div className="text-gray-600">
              Progreso general del proyecto
            </div>
            <div className="flex items-center gap-2">
              <div className="w-32 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-emerald-500 to-emerald-600 transition-all duration-500"
                  style={{ width: `${(activeCount / totalCount) * 100}%` }}
                />
              </div>
              <span className="font-semibold text-gray-900">
                {Math.round((activeCount / totalCount) * 100)}%
              </span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AdminFeatures;
