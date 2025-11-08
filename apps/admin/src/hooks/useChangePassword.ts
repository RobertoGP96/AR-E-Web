import { useMutation } from '@tanstack/react-query';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface ChangePasswordData {
  current_password: string;
  new_password: string;
}

interface ChangePasswordResponse {
  message: string;
}

interface ApiErrorResponse {
  error?: string;
  message?: string;
}

export const useChangePassword = () => {
  return useMutation<ChangePasswordResponse, Error, ChangePasswordData>({
    mutationFn: async (data: ChangePasswordData) => {
      return await apiClient.post<ChangePasswordResponse>(
        '/api_data/user/change_password/',
        data
      );
    },
    onSuccess: (data) => {
      toast.success('Contraseña actualizada', {
        description: data.message || 'Tu contraseña ha sido actualizada exitosamente',
      });
    },
    onError: (error: Error) => {
      const apiError = error as Error & { details?: ApiErrorResponse };
      const errorMessage = apiError.details?.error || apiError.details?.message || 'Error al cambiar la contraseña';
      toast.error('Error', {
        description: errorMessage,
      });
    },
  });
};
