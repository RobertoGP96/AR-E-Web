import { useQuery } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export interface SystemInfo {
  application?: {
    version: string;
    last_updated: string;
    environment: string;
  };
  database?: {
    engine: string;
    size_mb: number;
    tables_count: number;
    record_counts: {
      users: number;
      orders: number;
      products: number;
      packages: number;
      shops: number;
      categories: number;
    };
    total_records: number;
  };
  server?: {
    os: string;
    os_version: string;
    architecture: string;
  };
  technology?: {
    django_version: string;
    python_version: string;
    database_type: string;
  };
}

interface SystemInfoResponse {
  success: boolean;
  data: SystemInfo;
  message: string;
}

export const useSystemInfo = () => {
  return useQuery<SystemInfo, Error>({
    queryKey: ['system-info'],
    queryFn: async () => {
      const response = await apiClient.get<SystemInfoResponse>('/api_data/system/info/');
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutos
    gcTime: 10 * 60 * 1000, // 10 minutos (anteriormente cacheTime)
  });
};
