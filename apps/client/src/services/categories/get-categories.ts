import { apiClient } from '@/lib/api-client';

export interface PublicCategory {
  id: number;
  name: string;
  client_shipping_charge: number;
}

export async function getPublicCategories(): Promise<PublicCategory[]> {
  return apiClient.get<PublicCategory[]>('/api_data/public/categories/', { skipAuth: true });
}
