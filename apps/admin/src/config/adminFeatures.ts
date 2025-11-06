export type AdminFeature = {
  id: string;
  title: string;
  description?: string;
  enabled: boolean;
  addedAt?: string; // ISO date when the feature was added
};

// Lista inicial de funcionalidades (se puede ampliar en runtime usando addFeature)
const FEATURES: AdminFeature[] = [
  {
    id: 'products-management',
    title: 'Gestión de Productos',
    description: 'Crear, editar y listar productos en el sistema.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'orders-management',
    title: 'Gestión de Órdenes',
    description: 'Crear y gestionar órdenes de compra.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'shops-management',
    title: 'Tienda / Shops',
    description: 'Registro y normalización de tiendas.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'purchases-management',
    title: 'Gestión de Compras',
    description: 'Módulo para gestionar compras desde proveedores y órdenes de compra.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'packages-management',
    title: 'Gestión de Paquetes',
    description: 'Seguimiento y agrupación de paquetes para envíos.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'deliveries-management',
    title: 'Gestión de Entregas',
    description: 'Control de rutas y estados de entrega a clientes.',
    enabled: false,
    addedAt: new Date().toISOString()
  },
  {
    id: 'categories-management',
    title: 'Gestión de Categorías',
    description: 'Crear, editar y organizar categorías de productos.',
    enabled: true,
    addedAt: new Date().toISOString()
  },
  {
    id: 'notifications',
    title: 'Notificaciones',
    description: 'Sistema de notificaciones por email y en-app.',
    enabled: true,
  },
  {
    id: 'reports',
    title: 'Informes y métricas',
    description: 'Panel de métricas y generación de reportes descargables.',
    enabled: true
  },
  {
    id: 'users-management',
    title: 'Gestión de Usuarios',
    description: 'Crear, editar y gestionar usuarios del sistema.',
    enabled: true
  }
];

type Subscriber = (features: AdminFeature[]) => void;
const subscribers: Subscriber[] = [];

function notify() {
  const snapshot = FEATURES.slice();
  subscribers.forEach(s => {
    try { s(snapshot); } catch { /* ignore subscriber errors */ }
  });
}

export const getAllFeatures = (): AdminFeature[] => FEATURES.slice();
export const getEnabledFeatures = (): AdminFeature[] => FEATURES.filter(f => f.enabled);

export const addFeature = (feature: AdminFeature) => {
  const exists = FEATURES.find(f => f.id === feature.id);
  if (exists) return;
  FEATURES.push({ ...feature, addedAt: feature.addedAt ?? new Date().toISOString() });
  notify();
};

export const setFeatureEnabled = (id: string, enabled: boolean) => {
  const idx = FEATURES.findIndex(f => f.id === id);
  if (idx === -1) return;
  FEATURES[idx] = { ...FEATURES[idx], enabled };
  notify();
};

export const subscribeFeatures = (cb: Subscriber) => {
  subscribers.push(cb);
  // devolver unsubscribe
  return () => {
    const i = subscribers.indexOf(cb);
    if (i !== -1) subscribers.splice(i, 1);
  };
};

export default {
  getAllFeatures,
  getEnabledFeatures,
  addFeature,
  setFeatureEnabled,
  subscribeFeatures
};
