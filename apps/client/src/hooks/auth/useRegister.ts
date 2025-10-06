/**
 * Hook para el registro de usuarios
 */

import { useMutation, useQuery } from '@tanstack/react-query';
import { register, verifyEmail, checkEmailAvailability, checkPhoneAvailability } from '@/services/auth';
import type { RegisterData } from '@/types/api';

/**
 * Hook para registrar un nuevo usuario
 */
export function useRegister() {
  return useMutation({
    mutationKey: ['auth', 'register'],
    mutationFn: async (userData: RegisterData) => {
      const response = await register(userData);
      return response;
    },
    onSuccess: () => {
      // Aquí podrías agregar lógica adicional como mostrar notificaciones
      // Usuario registrado exitosamente
    },
    onError: () => {
      // Error al registrar usuario
    },
  });
}

/**
 * Hook para verificar el correo electrónico
 */
export function useVerifyEmail() {
  return useMutation({
    mutationKey: ['auth', 'verify-email'],
    mutationFn: async (verificationSecret: string) => {
      const response = await verifyEmail(verificationSecret);
      return response;
    },
    onSuccess: () => {
      return {
        message: ""
      }
    },
    onError: () => {
      return {
        message: ""
      }
    },
  });
}

/**
 * Hook para verificar disponibilidad de email
 * Solo se ejecuta cuando se proporciona un email válido
 */
export function useCheckEmailAvailability(email: string, enabled = true) {
  return useQuery({
    queryKey: ['auth', 'check-email', email],
    queryFn: async () => {
      const response = await checkEmailAvailability(email);
      return response.data;
    },
    enabled: enabled && !!email && email.includes('@'),
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
  });
}

/**
 * Hook para verificar disponibilidad de número de teléfono
 * Solo se ejecuta cuando se proporciona un número válido
 */
export function useCheckPhoneAvailability(phoneNumber: string, enabled = true) {
  return useQuery({
    queryKey: ['auth', 'check-phone', phoneNumber],
    queryFn: async () => {
      const response = await checkPhoneAvailability(phoneNumber);
      return response.data;
    },
    enabled: enabled && !!phoneNumber && phoneNumber.length > 8,
    staleTime: 5 * 60 * 1000, // 5 minutos
    retry: false,
  });
}

/**
 * Hook que combina todas las funcionalidades de registro
 */
export function useRegisterFlow() {
  const registerMutation = useRegister();
  const verifyEmailMutation = useVerifyEmail();

  return {
    // Registro
    register: registerMutation.mutate,
    registerAsync: registerMutation.mutateAsync,
    isRegistering: registerMutation.isPending,
    registerError: registerMutation.error,
    registerData: registerMutation.data,
    registerSuccess: registerMutation.isSuccess,

    // Verificación de email
    verifyEmail: verifyEmailMutation.mutate,
    verifyEmailAsync: verifyEmailMutation.mutateAsync,
    isVerifyingEmail: verifyEmailMutation.isPending,
    verifyEmailError: verifyEmailMutation.error,
    verifyEmailData: verifyEmailMutation.data,
    verifyEmailSuccess: verifyEmailMutation.isSuccess,

    // Reset
    reset: () => {
      registerMutation.reset();
      verifyEmailMutation.reset();
    },
  };
}