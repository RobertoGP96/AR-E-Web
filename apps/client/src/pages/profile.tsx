import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Edit3, Loader2, AlertCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/hooks/useUser';
import { toast } from 'sonner';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    
    // Usar el hook personalizado para obtener datos del usuario
    const { 
        user, 
        isLoading, 
        isError, 
        updateUser, 
        isUpdating, 
        updateError,
        getUserDisplayName, 
        getUserRole 
    } = useUser();

    // Estado local para el formulario de edición
    const [formData, setFormData] = useState({
        name: '',
        last_name: '',
        email: '',
        phone_number: '',
        home_address: ''
    });

    useEffect(() => {
        setIsVisible(true);
    }, []);

    // Sincronizar datos del usuario con el formulario
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                home_address: user.home_address || ''
            });
        }
    }, [user]);

    const handleInputChange = (field: string, value: string) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    const handleSaveChanges = async () => {
        try {
            await updateUser(formData);
            setIsEditing(false);
            toast.success('¡Perfil actualizado exitosamente!', {
                description: 'Tus cambios han sido guardados correctamente. Los datos persisten al actualizar la página.',
                duration: 4000
            });
        } catch (error) {
            // El error detallado se obtiene del hook updateError
            const errorMessage = updateError || 'Error al actualizar el perfil. Intenta nuevamente.';
            toast.error('Error al guardar cambios', {
                description: errorMessage,
                duration: 5000
            });
            console.error('Error updating profile:', error);
        }
    };

    const handleCancelEdit = () => {
        if (user) {
            setFormData({
                name: user.name || '',
                last_name: user.last_name || '',
                email: user.email || '',
                phone_number: user.phone_number || '',
                home_address: user.home_address || ''
            });
        }
        setIsEditing(false);
    };

    // Función para formatear la fecha de registro
    const formatJoinDate = (dateString: string) => {
        if (!dateString) return 'Fecha no disponible';
        
        try {
            // Manejar diferentes formatos de fecha
            let date: Date;
            
            // Si la fecha incluye 'T' (formato ISO) o contiene 'Z'
            if (dateString.includes('T') || dateString.includes('Z')) {
                date = new Date(dateString);
            } else {
                // Si es solo una fecha (YYYY-MM-DD), agregarle tiempo para evitar problemas de zona horaria
                date = new Date(dateString + 'T00:00:00');
            }
            
            // Verificar si la fecha es válida
            if (isNaN(date.getTime())) {
                return 'Fecha no válida';
            }
            
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch (error) {
            console.warn('Error formateando fecha:', error);
            return 'Fecha no disponible';
        }
    };

    // Mostrar loading
    if (isLoading) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-center py-12 sm:py-16 lg:py-20">
                    <div className="text-center">
                        <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 lg:h-12 lg:w-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-gray-300 text-sm sm:text-base">Cargando tu perfil...</p>
                    </div>
                </div>
            </div>
        );
    }

    // Mostrar error
    if (isError || !user) {
        return (
            <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
                <div className="flex items-center justify-center py-12 sm:py-16 lg:py-20">
                    <div className="text-center max-w-md mx-auto">
                        <h2 className="text-lg sm:text-xl font-semibold text-gray-300 mb-2">
                            Error al cargar el perfil
                        </h2>
                        <p className="text-gray-400 text-sm sm:text-base">
                            No se pudieron cargar los datos del usuario
                        </p>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h1 className="text-2xl sm:text-3xl font-bold text-primary flex items-center gap-3">
                        Mi Perfil
                    </h1>
                    <p className="text-gray-300 mt-2 text-sm sm:text-base">
                        Gestiona tu información personal y configuración de cuenta
                    </p>
                </div>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 transition-all duration-300 rounded-xl border-0 w-full sm:w-auto ${isEditing
                        ? 'bg-gray-500 hover:bg-gray-600 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
                        }`}
                >
                    <Edit3 className="h-5 w-5" />
                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-4 gap-4 sm:gap-6 transition-all duration-1000 delay-300 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <Card className="h-full shadow-lg border-0 rounded-2xl ring-1 bg-black/20 ring-gray-50/20">
                        <CardContent className="text-center p-4 sm:p-6">
                            <div className="relative inline-block">
                                <div className="w-20 h-20 sm:w-24 sm:h-24 lg:w-28 lg:h-28 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mx-auto mb-3 sm:mb-4 flex items-center justify-center">
                                    <User className="h-10 w-10 sm:h-12 sm:w-12 lg:h-16 lg:w-16 text-white" />
                                </div>
                            </div>

                            <h2 className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-200 mb-2 break-words">
                                {getUserDisplayName()}
                            </h2>

                            <div className="space-y-2 mb-3">
                                <Badge className="bg-orange-300/10 border border-primary text-primary hover:bg-orange-100 rounded-full px-3 py-1 text-xs sm:text-sm">
                                    {getUserRole()}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-center text-gray-300 text-xs sm:text-sm break-words">
                                <Calendar className="h-3 w-3 sm:h-4 sm:w-4 mr-2 flex-shrink-0" />
                                <span className="text-center">Desde {formatJoinDate(user.date_joined)}</span>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Information Cards */}
                <div className={`lg:col-span-3 space-y-4 sm:space-y-6 transition-all duration-1000 delay-500 ${
                    isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                }`}>
                    {/* Personal Information */}
                    <Card className="shadow-lg border-0 bg-black/20 rounded-2xl ring-1 ring-gray-50/20">
                        <CardHeader className="pb-2 p-4 sm:p-6">
                            <CardTitle className="text-lg sm:text-xl font-semibold text-gray-300">
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-4 sm:p-6 pt-0">
                            {updateError && (
                                <Alert variant="destructive">
                                    <AlertCircle className="h-4 w-4" />
                                    <AlertTitle>Error al actualizar</AlertTitle>
                                    <AlertDescription>
                                        {updateError}
                                    </AlertDescription>
                                </Alert>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-primary">
                                        Nombres
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl text-sm sm:text-base"
                                            placeholder="Ingresa tus nombres"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-200 text-sm sm:text-base break-words">
                                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                            <span>{user.name || 'No especificado'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-primary">
                                        Apellidos
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.last_name}
                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl text-sm sm:text-base"
                                            placeholder="Ingresa tus apellidos"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-200 text-sm sm:text-base break-words">
                                            <User className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                            <span>{user.last_name || 'No especificado'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-primary">
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl text-sm sm:text-base"
                                            placeholder="ejemplo@correo.com"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-200 text-sm sm:text-base break-all">
                                            <Mail className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                            <span>{user.email || 'No especificado'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-primary">
                                        Teléfono
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl text-sm sm:text-base"
                                            placeholder="+1 234 567 8900"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2 text-gray-200 text-sm sm:text-base break-words">
                                            <Phone className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0" />
                                            <span>{user.phone_number || 'No especificado'}</span>
                                        </div>
                                    )}
                                </div>

                                <div className="sm:col-span-2 space-y-2">
                                    <label className="block text-sm font-medium text-primary">
                                        Dirección
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.home_address}
                                            onChange={(e) => handleInputChange('home_address', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl text-sm sm:text-base"
                                            placeholder="Ingresa tu dirección completa"
                                        />
                                    ) : (
                                        <div className="flex items-start gap-2 text-gray-200 text-sm sm:text-base break-words">
                                            <MapPin className="h-3 w-3 sm:h-4 sm:w-4 text-gray-400 flex-shrink-0 mt-1" />
                                            <span>{user.home_address || 'No especificada'}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {isEditing && (
                        <div className={`flex flex-col sm:flex-row justify-end gap-3 transition-all duration-1000 delay-700 ${
                            isVisible 
                                ? 'opacity-100 transform translate-y-0' 
                                : 'opacity-0 transform translate-y-8'
                        }`}>
                            <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-50 rounded-xl hover:scale-105 transition-all duration-300 w-full sm:w-auto order-2 sm:order-1"
                                disabled={isUpdating}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSaveChanges}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 hover:scale-105 btn-hover-glow w-full sm:w-auto order-1 sm:order-2"
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4 mr-2" />
                                        Guardar Cambios
                                    </>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
