// Contrato serializable servidor → cliente de /analytics. El servidor
// agrega TODO por mes calendario (12 cubetas, de la más vieja a la más
// nueva); el cliente solo rebana por rango (3/6/12 meses) y suma, de
// modo que el filtro de período gobierna cada gráfico por igual.

export interface MonthBucket {
  /** Clave 'YYYY-MM' del mes (UTC). */
  month: string;
  /** Etiqueta corta para ejes: "sept 25". */
  label: string;
  /** Cobrado en el mes: órdenes + entregas. */
  ingresos: number;
  /** Compras a tiendas (ShoppingReceip). */
  compras: number;
  /** Gastos operativos (Expense). */
  gastos: number;
  /** Costo de envío de entregas: peso × costo por libra. */
  envio: number;
  /** Ganancia pagada a agentes (managerProfit). */
  gananciaAgentes: number;
  /** Libras entregadas. */
  peso: number;
  entregas: number;
  ordenes: number;
  clientesNuevos: number;
  /** Funnel de productos creados en el mes (unidades). */
  encargado: number;
  comprado: number;
  recibido: number;
  entregado: number;
}

/** Fila agrupada por mes (índice en months) + clave nominal. */
export interface SliceRow {
  m: number;
  key: string;
  value: number;
  count?: number;
}

export interface ClientRow {
  m: number;
  id: string;
  name: string;
  ingresos: number;
  ordenes: number;
  entregas: number;
}

export interface AgentRow {
  m: number;
  id: string;
  name: string;
  ganancia: number;
  entregas: number;
  peso: number;
}

/** Estado de cobros a día de hoy (no depende del rango elegido). */
export interface CurrentState {
  porCobrarOrdenes: number;
  nOrdenesSinPagar: number;
  porCobrarEntregas: number;
  nEntregasSinPagar: number;
  deudaClientes: number;
  nDeudores: number;
}

export interface AnalyticsData {
  months: MonthBucket[];
  /** Órdenes por estado (count). */
  statusRows: SliceRow[];
  /** Órdenes por estado de pago (count). */
  payRows: SliceRow[];
  /** Gastos por categoría ($). */
  catRows: SliceRow[];
  /** Compras por tienda ($, count = compras). */
  shopRows: SliceRow[];
  clientRows: ClientRow[];
  agentRows: AgentRow[];
  /** Balance actual por cliente (id → saldo). */
  clientBalances: Record<string, number>;
  current: CurrentState;
}
