// Tipos para la tabla de paquetes
export interface PackageTableData {
  id: number;
  tracking_number: string;
  status: PackageStatus;
  origin: string;
  destination: string;
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
  sender: {
    name: string;
    email: string;
    phone: string;
  };
  recipient: {
    name: string;
    email: string;
    phone: string;
    address: string;
  };
  shipping_cost: number;
  estimated_delivery: string;
  actual_delivery?: string;
  created_at: string;
  updated_at: string;
}

export type PackageStatus = 
  | 'pending'
  | 'in_transit'
  | 'out_for_delivery'
  | 'delivered'
  | 'returned'
  | 'cancelled';

export interface PackageFilters {
  status?: PackageStatus;
  origin?: string;
  destination?: string;
  dateRange?: {
    start: string;
    end: string;
  };
}