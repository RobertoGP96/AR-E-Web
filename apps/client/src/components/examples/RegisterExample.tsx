/**
 * Componente de ejemplo para el registro de usuarios
 * Demuestra cómo usar el servicio de registro actualizado
 */

import React, { useState } from 'react';
import { useRegisterFlow, useCheckEmailAvailability, useCheckPhoneAvailability } from '@/hooks/auth/useRegister';
import type { RegisterData } from '@/types/api';

// Componente de ejemplo para el registro
export function RegisterExample() {
  const [formData, setFormData] = useState<RegisterData>({
    email: '',
    password: '',
    name: '',
    last_name: '',
    home_address: '',
    phone_number: '',
  });

  const {
    register,
    isRegistering,
    registerError,
    registerSuccess,
    verifyEmail,
    isVerifyingEmail,
    verifyEmailError,
    verifyEmailSuccess,
  } = useRegisterFlow();

  // Verificación de disponibilidad de email y teléfono
  const { data: emailAvailability, isLoading: checkingEmail } = useCheckEmailAvailability(
    formData.email,
    formData.email.includes('@')
  );

  const { data: phoneAvailability, isLoading: checkingPhone } = useCheckPhoneAvailability(
    formData.phone_number,
    formData.phone_number.length > 8
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      await register(formData);
    } catch (error) {
      console.error('Error al registrar:', error);
    }
  };

  const handleVerifyEmail = async (secret: string) => {
    try {
      await verifyEmail(secret);
    } catch (error) {
      console.error('Error al verificar email:', error);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8 p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-6 text-center">Registro de Usuario</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Nombre
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Apellido
          </label>
          <input
            type="text"
            value={formData.last_name}
            onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Email
          </label>
          <input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          {checkingEmail && (
            <p className="text-sm text-gray-500 mt-1">Verificando disponibilidad...</p>
          )}
          {emailAvailability && !emailAvailability.available && (
            <p className="text-sm text-red-600 mt-1">Este email ya está registrado</p>
          )}
          {emailAvailability && emailAvailability.available && (
            <p className="text-sm text-green-600 mt-1">Email disponible</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Número de teléfono
          </label>
          <input
            type="tel"
            value={formData.phone_number}
            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="+53XXXXXXXX"
            required
          />
          {checkingPhone && (
            <p className="text-sm text-gray-500 mt-1">Verificando disponibilidad...</p>
          )}
          {phoneAvailability && !phoneAvailability.available && (
            <p className="text-sm text-red-600 mt-1">Este número ya está registrado</p>
          )}
          {phoneAvailability && phoneAvailability.available && (
            <p className="text-sm text-green-600 mt-1">Número disponible</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Dirección
          </label>
          <textarea
            value={formData.home_address}
            onChange={(e) => setFormData({ ...formData, home_address: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            rows={3}
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Contraseña
          </label>
          <input
            type="password"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={
            isRegistering ||
            (emailAvailability && !emailAvailability.available) ||
            (phoneAvailability && !phoneAvailability.available)
          }
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRegistering ? 'Registrando...' : 'Registrar'}
        </button>
      </form>

      {/* Estados del registro */}
      {registerError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error: {registerError.message}
        </div>
      )}

      {registerSuccess && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ¡Usuario registrado exitosamente! Revisa tu correo para verificar tu cuenta.
        </div>
      )}

      {/* Estados de verificación de email */}
      {isVerifyingEmail && (
        <div className="mt-4 p-3 bg-blue-100 border border-blue-400 text-blue-700 rounded">
          Verificando email...
        </div>
      )}

      {verifyEmailError && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          Error al verificar email: {verifyEmailError.message}
        </div>
      )}

      {verifyEmailSuccess && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          ¡Email verificado exitosamente! Ya puedes iniciar sesión.
        </div>
      )}

      {/* Ejemplo de verificación de email */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <h3 className="text-lg font-medium mb-2">Verificar Email</h3>
        <p className="text-sm text-gray-600 mb-2">
          Si ya tienes un código de verificación, ingrésalo aquí:
        </p>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Código de verificación"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                const input = e.target as HTMLInputElement;
                if (input.value) {
                  handleVerifyEmail(input.value);
                  input.value = '';
                }
              }
            }}
          />
          <button
            onClick={() => {
              const input = document.querySelector('input[placeholder="Código de verificación"]') as HTMLInputElement;
              if (input?.value) {
                handleVerifyEmail(input.value);
                input.value = '';
              }
            }}
            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
          >
            Verificar
          </button>
        </div>
      </div>
    </div>
  );
}

export default RegisterExample;