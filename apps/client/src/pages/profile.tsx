import { useState, useEffect } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Edit3, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useUser } from '@/hooks/useUser';

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
        } catch  {
            // Error guardando cambios
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
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-ES', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
        } catch {
            return 'Fecha no disponible';
        }
    };

    // Mostrar loading
    if (isLoading) {
        return (
            <div className="w-full px-[30%] space-y-6">
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </div>
        );
    }

    // Mostrar error
    if (isError || !user) {
        return (
            <div className="w-full px-[30%] space-y-6">
                <div className="flex items-center justify-center py-12">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold text-gray-300 mb-2">
                            Error al cargar el perfil
                        </h2>
                        <p className="text-gray-400">
                            No se pudieron cargar los datos del usuario
                        </p>

                        {}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="w-full px-[30%] space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="font-bold text-primary flex items-center gap-3">
                        Mi Perfil
                    </h1>
                    <p className="text-gray-300 mt-2">
                        Gestiona tu información personal y configuración de cuenta
                    </p>
                </div>
                <Button
                    onClick={() => setIsEditing(!isEditing)}
                    className={`flex items-center gap-2 transition-all duration-300 rounded-xl border-0 ${isEditing
                        ? 'bg-gray-500 hover:bg-gray-600 shadow-lg hover:shadow-xl'
                        : 'bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl'
                        }`}
                >
                    <Edit3 className="h-5 w-5" />
                    {isEditing ? 'Cancelar' : 'Editar Perfil'}
                </Button>
            </div>

            <div className={`grid grid-cols-1 lg:grid-cols-3 gap-6 transition-all duration-1000 delay-300 ${
                isVisible 
                    ? 'opacity-100 transform translate-y-0' 
                    : 'opacity-0 transform translate-y-8'
            }`}>
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <Card className="h-full shadow-lg border-0 rounded-2xl ring-1 bg-black/20 ring-gray-50/20">
                        <CardContent className="text-center">
                            <div className="relative inline-block">
                                <div className="w-25 h-25 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                                    <User className="h-16 w-16 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-200 mb-1">
                                {getUserDisplayName()}
                            </h2>

                            <div className="space-y-2 mb-3">
                                <Badge className="bg-orange-300/10 border border-primary text-primary hover:bg-orange-100 rounded-full px-3 py-1">
                                    {getUserRole()}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-center text-gray-300 text-sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Desde {formatJoinDate(user.date_joined)}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Information Cards */}
                <div className={`lg:col-span-3 space-y-6 transition-all duration-1000 delay-500 ${
                    isVisible 
                        ? 'opacity-100 transform translate-y-0' 
                        : 'opacity-0 transform translate-y-8'
                }`}>
                    {/* Personal Information */}
                    <Card className="shadow-lg border-0 bg-black/20 rounded-2xl ring-1 ring-gray-50/20">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-xl font-semibold text-gray-300">
                                Información Personal
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Nombres
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.name}
                                            onChange={(e) => handleInputChange('name', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {user.name}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Apellidos
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.last_name}
                                            onChange={(e) => handleInputChange('last_name', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 " />
                                            {user.last_name}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Email
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            type="email"
                                            value={formData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {user.email}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Teléfono
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.phone_number}
                                            onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {user.phone_number || 'No especificado'}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Dirección
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={formData.home_address}
                                            onChange={(e) => handleInputChange('home_address', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {user.home_address || 'No especificada'}
                                        </div>
                                    )}
                                </div>


                            </div>
                        </CardContent>
                    </Card>

                    {isEditing && (
                        <div className={`flex justify-end gap-3 transition-all duration-1000 delay-700 ${
                            isVisible 
                                ? 'opacity-100 transform translate-y-0' 
                                : 'opacity-0 transform translate-y-8'
                        }`}>
                            <Button
                                onClick={handleCancelEdit}
                                variant="outline"
                                className="border-gray-300 hover:bg-gray-50 rounded-xl hover:scale-105 transition-all duration-300"
                                disabled={isUpdating}
                            >
                                Cancelar
                            </Button>
                            <Button 
                                onClick={handleSaveChanges}
                                className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0 hover:scale-105 btn-hover-glow"
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
