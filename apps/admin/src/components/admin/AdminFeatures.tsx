import React, { useEffect, useState } from 'react';
import { getAllFeatures, subscribeFeatures, setFeatureEnabled } from '@/config/adminFeatures';
import type { AdminFeature } from '@/config/adminFeatures';
import { Badge } from '@/components/ui/badge';

export const AdminFeatures: React.FC = () => {
  const [features, setFeatures] = useState<AdminFeature[]>(() => getAllFeatures());

  useEffect(() => {
    const unsub = subscribeFeatures((f) => setFeatures(f));
    return unsub;
  }, []);

  const toggle = (id: string, enabled: boolean) => {
    setFeatureEnabled(id, enabled);
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900">Funcionalidades del panel</h3>
        <Badge variant="secondary">{features.filter(f => f.enabled).length} activas</Badge>
      </div>

      <ul className="space-y-2">
        {features.map(f => (
          <li key={f.id} className="flex items-start justify-between gap-4 p-3 rounded-md hover:bg-gray-50 transition-colors">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={!!f.enabled}
                onChange={() => toggle(f.id, !f.enabled)}
                className="mt-1 h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
              />
              <div>
                <div className="flex items-center gap-2">
                  <h4 className={`text-sm font-medium ${f.enabled ? 'line-through text-gray-400' : 'text-gray-900'}`}>{f.title}</h4>
                  {!f.enabled && <Badge className="ml-2">Próximo</Badge>}
                </div>
                {f.description && <p className={`text-xs mt-1 ${f.enabled ? 'text-gray-400 line-through' : 'text-gray-500'}`}>{f.description}</p>}
              </div>
            </label>
            <div className="flex items-center gap-2">
              {f.addedAt && <span className="text-xs text-muted-foreground">{new Date(f.addedAt).toLocaleDateString()}</span>}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AdminFeatures;
