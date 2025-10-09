// Ejemplo de uso del componente UserForm en una página de usuarios

import { useState } from 'react';
import { UserForm, ViewUserButton } from '../components/users/UserForm';
import UsersFilters from '../components/users/UsersFilters';
import type { CustomUser, CreateUserData, UpdateUserData } from '../types/models/user';

export default function UsersPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Ejemplo de datos de usuarios (reemplazar con llamada a API)
  const users: CustomUser[] = [
    {
      id: 1,
      email: 'juan@ejemplo.com',
      name: 'Juan',
      last_name: 'Pérez',
      home_address: 'Calle Principal #123',
      phone_number: '+1234567890',
      role: 'user',
      agent_profit: 0,
      is_staff: false,
      is_active: true,
      is_verified: true,
      date_joined: '2024-01-15T10:00:00Z',
      sent_verification_email: true,
      full_name: 'Juan Pérez',
    },
    // ... más usuarios
  ];

  // Manejar creación de usuario
  const handleCreateUser = async (data: CreateUserData | UpdateUserData) => {
    setIsCreating(true);
    try {
      // TODO: Implementar llamada a API
      // await createUser(data as CreateUserData);
      console.log('Crear usuario:', data);
      
      // Mostrar toast de éxito
      // toast.success('Usuario creado exitosamente');
    } catch (error) {
      console.error('Error al crear usuario:', error);
      // toast.error('Error al crear usuario');
    } finally {
      setIsCreating(false);
    }
  };

  // Manejar actualización de usuario
  const handleUpdateUser = async (data: CreateUserData | UpdateUserData) => {
    setIsUpdating(true);
    try {
      // TODO: Implementar llamada a API
      // await updateUser(data as UpdateUserData);
      console.log('Actualizar usuario:', data);
      
      // Mostrar toast de éxito
      // toast.success('Usuario actualizado exitosamente');
    } catch (error) {
      console.error('Error al actualizar usuario:', error);
      // toast.error('Error al actualizar usuario');
    } finally {
      setIsUpdating(false);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
      </div>

      {/* Filtros y botón de crear */}
      <UsersFilters
        searchTerm={searchTerm}
        onSearchChange={setSearchTerm}
        onCreateUser={handleCreateUser}
        isCreatingUser={isCreating}
      />

      {/* Tabla de usuarios */}
      <div className="bg-white rounded-lg shadow">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Usuario
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Email
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Rol
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Estado
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                Acciones
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users
              .filter(user => 
                user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                user.email.toLowerCase().includes(searchTerm.toLowerCase())
              )
              .map((user) => (
                <tr key={user.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {user.full_name}
                    </div>
                    <div className="text-sm text-gray-500">
                      {user.phone_number}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      user.is_active 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {user.is_active ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                    {/* Botón para ver detalles */}
                    <ViewUserButton user={user} />
                    
                    {/* Botón para editar */}
                    <UserForm
                      user={user}
                      mode="edit"
                      onSubmit={handleUpdateUser}
                      loading={isUpdating}
                      trigger={
                        <button className="text-indigo-600 hover:text-indigo-900">
                          Editar
                        </button>
                      }
                    />
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
