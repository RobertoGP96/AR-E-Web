/**
 * Tipos del flujo de importación de embarques desde Excel (AR&E Shipps).
 *
 * Todo lo que viaja entre server action y cliente es JSON-serializable:
 * los BigInt de Prisma van como string y las fechas como ISO string.
 */

export type ImportSheet = 'Shein' | 'Amazon' | 'Temu' | 'Otras 5%';

export type IssueLevel = 'error' | 'warning';

export interface RowIssue {
  level: IssueLevel;
  message: string;
}

/** Fila de artículo detectada en una hoja de productos. */
export interface ParsedItemRow {
  /** Identificador estable dentro del análisis, p.ej. "Shein:23". */
  uid: string;
  sheet: ImportSheet;
  rowNumber: number;
  /** Tienda del producto (fija por hoja; en "Otras 5%" viene de la columna Tienda). */
  storeName: string | null;
  /** ID del pedido en la tienda (Shein). */
  storeOrderId: string | null;
  /** Clave del grupo de compra (recibo) al que pertenece la fila. */
  groupKey: string | null;
  /** Cuenta de compra (RS, iCloud, TAD…). */
  account: string | null;
  tracking: string | null;
  /** Etiqueta interna de paquete del Excel ("#9"). */
  packageLabel: string | null;
  buyDate: string | null;
  arrivalDate: string | null;
  agent: string | null;
  client: string;
  sku: string | null;
  description: string | null;
  quantity: number;
  unitValue: number | null;
  /** Coste real de la fila (columna Coste), cuando la fila lo trae. */
  rowCost: number | null;
  issues: RowIssue[];
}

/**
 * Grupo de compra: una fila "Factura" del Excel (pedido real en la tienda)
 * o una agrupación automática por tienda + cuenta + fecha de compra para
 * las filas sin pedido explícito (ningún producto queda sin compra).
 */
export interface ParsedReceiptGroup {
  key: string;
  sheet: ImportSheet;
  /** 'factura': pedido explícito del Excel; 'auto': tienda+cuenta+fecha. */
  origin: 'factura' | 'auto';
  storeName: string;
  storeOrderId: string | null;
  account: string | null;
  buyDate: string | null;
  /** Cantidad de artículos declarada en la fila Factura. */
  itemCount: number | null;
  /** Valor declarado (suma de artículos). */
  declaredValue: number | null;
  /** Coste real pagado (dato manual de la columna Coste). */
  realCost: number | null;
}

export interface ParsedExpense {
  uid: string;
  label: string;
  amount: number;
  category: string;
}

export interface ParsedAgent {
  name: string;
  /** Dólar por libra según la hoja ConfiguracionAG. */
  ratePerPound: number | null;
}

export interface ParsedClient {
  name: string;
  /** Nombre del agente según la hoja Agente-Cliente (o el de la fila). */
  agent: string | null;
  /** true si viene del registro Agente-Cliente; false si solo aparece en filas. */
  inRegistry: boolean;
}

export interface SkippedRow {
  sheet: string;
  rowNumber: number;
  reason: string;
  preview: string;
}

/** Resultado puro del parser (sin tocar la base de datos). */
export interface ParsedWorkbook {
  fileName: string;
  /** Número de embarque deducido del nombre del archivo ("#238"). */
  shipmentTag: string | null;
  shops: string[];
  agents: ParsedAgent[];
  clients: ParsedClient[];
  /** Cuentas de compra detectadas, con su tienda. */
  accounts: { name: string; store: string }[];
  items: ParsedItemRow[];
  receipts: ParsedReceiptGroup[];
  expenses: ParsedExpense[];
  skipped: SkippedRow[];
  globalIssues: RowIssue[];
}

// ---------------------------------------------------------------------------
// Análisis (parser + contraste con la base de datos)
// ---------------------------------------------------------------------------

export type MatchStatus = 'new' | 'existing';

export interface ShopEntry {
  name: string;
  status: MatchStatus;
  existingId: string | null;
  /** true si alguna fila/cuenta del archivo usa esta tienda (solo esas se crean). */
  used: boolean;
}

export interface AccountEntry {
  name: string;
  store: string;
  status: MatchStatus;
  existingId: string | null;
}

export interface AgentEntry extends ParsedAgent {
  status: MatchStatus;
  existingId: string | null;
  /** Rol actual del usuario existente (para avisar si no es "agent"). */
  existingRole: string | null;
}

export interface SimilarUser {
  id: string;
  fullName: string;
}

export interface ClientEntry extends ParsedClient {
  status: MatchStatus;
  existingId: string | null;
  /** Usuarios existentes con nombre parecido (posibles duplicados). */
  similar: SimilarUser[];
  /** Cantidad de filas de artículo que referencian a este cliente. */
  itemCount: number;
}

export interface ItemComputed {
  /** % de tarifa de tienda aplicada (0/1/3/5). */
  shopTaxes: number;
  /** Costo total que cobrará el sistema (fórmula del backend). */
  totalCost: number;
}

export interface ItemEntry extends ParsedItemRow {
  computed: ItemComputed;
  hasError: boolean;
}

export interface ImportAnalysis {
  fileName: string;
  shipmentTag: string | null;
  shops: ShopEntry[];
  agents: AgentEntry[];
  clients: ClientEntry[];
  accounts: AccountEntry[];
  items: ItemEntry[];
  receipts: ParsedReceiptGroup[];
  expenses: ParsedExpense[];
  skipped: SkippedRow[];
  globalIssues: RowIssue[];
  /** true si ya existen órdenes importadas desde este mismo archivo. */
  alreadyImported: boolean;
}

// ---------------------------------------------------------------------------
// Resultado de la importación
// ---------------------------------------------------------------------------

export interface ImportSummary {
  shopsCreated: number;
  accountsCreated: number;
  agentsCreated: number;
  clientsCreated: number;
  clientsReused: number;
  ordersCreated: number;
  productsCreated: number;
  receiptsCreated: number;
  packagesCreated: number;
  receptionsCreated: number;
  expensesCreated: number;
}
