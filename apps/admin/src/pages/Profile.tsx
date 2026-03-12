import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/hooks/auth/useAuth';
import { useCurrentUser, useUpdateUser } from '@/hooks/user/useUsers';
import { roleLabels } from '@/types/models/user';

interface EditableFields {
  name: string;
  last_name: string;
  phone_number: string;
  home_address: string;
}

export default function Profile() {
  const { user: authUser } = useAuth();
  const { data: currentUser, isLoading, isError } = useCurrentUser();
  const updateUser = useUpdateUser();

  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<EditableFields>({
    name: '',
    last_name: '',
    phone_number: '',
    home_address: '',
  });

  // Sync form data when API data arrives or auth user changes
  const userData = currentUser ?? authUser;
  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name ?? '',
        last_name: userData.last_name ?? '',
        phone_number: userData.phone_number ?? '',
        home_address: userData.home_address ?? '',
      });
    }
  }, [userData]);

  const handleInputChange = (field: keyof EditableFields, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleCancel = () => {
    // Reset form to current server data
    if (userData) {
      setFormData({
        name: userData.name ?? '',
        last_name: userData.last_name ?? '',
        phone_number: userData.phone_number ?? '',
        home_address: userData.home_address ?? '',
      });
    }
    setIsEditing(false);
  };

  const handleSave = () => {
    if (!userData?.id) return;
    updateUser.mutate(
      { id: userData.id, ...formData },
      {
        onSuccess: () => setIsEditing(false),
      }
    );
  };

  const formatJoinDate = (dateString?: string) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  if (isLoading && !authUser) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-orange-500" />
        <span className="ml-3 text-gray-600">Cargando perfil...</span>
      </div>
    );
  }

  if (isError && !authUser) {
    return (
      <div className="flex items-center justify-center h-64 gap-3 text-red-600">
        <AlertCircle className="h-8 w-8" />
        <span>No se pudo cargar el perfil. Por favor, recarga la página.</span>
      </div>
    );
  }

  const displayName = `${formData.name} ${formData.last_name}`.trim() || userData?.full_name || '—';
  const roleLabel = userData?.role ? (roleLabels[userData.role] ?? userData.role) : '—';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
            <User className="h-8 w-8 text-orange-500" />
            Mi Perfil
          </h1>
          <p className="text-gray-600 mt-2">
            Gestiona tu información personal y configuración de cuenta
          </p>
        </div>
        <Button
          onClick={() => (isEditing ? handleCancel() : setIsEditing(true))}
          className={`flex items-center gap-2 transition-all duration-300 rounded-xl border-0 ${
            isEditing
              ? 'bg-gray-500 hover:bg-gray-600 shadow-lg hover:shadow-xl'
              : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
          }`}
        >
          <Edit3 className="h-5 w-5" />
          {isEditing ? 'Cancelar' : 'Editar Perfil'}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Summary Card */}
        <div className="lg:col-span-1">
          <Card className="shadow-lg border-0 bg-white rounded-2xl">
            <CardContent className="p-6 text-center">
              <div className="w-32 h-32 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <User className="h-16 w-16 text-white" />
              </div>

              <h2 className="text-2xl font-bold text-gray-900 mb-3">
                {isLoading ? (
                  <span className="inline-block w-40 h-7 bg-gray-200 rounded animate-pulse" />
                ) : (
                  displayName
                )}
              </h2>

              <div className="mb-4">
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-100 rounded-full px-3 py-1">
                  {roleLabel}
                </Badge>
              </div>

              <div className="flex items-center justify-center text-gray-600 text-sm">
                <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                Desde {formatJoinDate(userData?.date_joined)}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Information Card */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="shadow-lg border-0 bg-white rounded-2xl">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold text-gray-900">
                Información Personal
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nombre
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <User className="h-4 w-4 text-gray-400" />
                      {formData.name || '—'}
                    </div>
                  )}
                </div>

                {/* Apellido */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Apellido
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.last_name}
                      onChange={(e) => handleInputChange('last_name', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <User className="h-4 w-4 text-gray-400" />
                      {formData.last_name || '—'}
                    </div>
                  )}
                </div>

                {/* Email (read-only) */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <div className="flex items-center gap-2 text-gray-900">
                    <Mail className="h-4 w-4 text-gray-400" />
                    {userData?.email || '—'}
                  </div>
                </div>

                {/* Teléfono */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Teléfono
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.phone_number}
                      onChange={(e) => handleInputChange('phone_number', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <Phone className="h-4 w-4 text-gray-400" />
                      {formData.phone_number || '—'}
                    </div>
                  )}
                </div>

                {/* Dirección */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Dirección
                  </label>
                  {isEditing ? (
                    <Input
                      value={formData.home_address}
                      onChange={(e) => handleInputChange('home_address', e.target.value)}
                      className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                    />
                  ) : (
                    <div className="flex items-center gap-2 text-gray-900">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {formData.home_address || '—'}
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {isEditing && (
            <div className="flex justify-end gap-3">
              <Button
                onClick={handleCancel}
                variant="outline"
                className="border-gray-300 text-gray-700 hover:bg-gray-50 rounded-xl"
                disabled={updateUser.isPending}
              >
                Cancelar
              </Button>
              <Button
                onClick={handleSave}
                disabled={updateUser.isPending}
                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0"
              >
                {updateUser.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Save className="h-4 w-4 mr-2" />
                )}
                Guardar Cambios
              </Button>
            </div>
          )}

          {updateUser.isError && (
            <p className="text-sm text-red-600 flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              No se pudieron guardar los cambios. Inténtalo de nuevo.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
