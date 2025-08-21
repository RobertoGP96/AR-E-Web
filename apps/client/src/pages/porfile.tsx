import { useState } from 'react';
import { User, Mail, Phone, MapPin, Calendar, Save, Edit3 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function Profile() {
    const [isEditing, setIsEditing] = useState(false);
    const [profileData, setProfileData] = useState({
        firstName: 'Juan',
        lastName: 'Pérez',
        email: 'juan.perez@admin.com',
        phone: '+57 300 123 4567',
        address: 'Carrera 15 #32-45, Bogotá',
        role: 'Cliente', joinDate: '15 de Enero, 2023',
        bio: 'Administrador del sistema con más de 5 años de experiencia en gestión de plataformas digitales.'
    });

    const handleInputChange = (field: string, value: string) => {
        setProfileData(prev => ({
            ...prev,
            [field]: value
        }));
    };

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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Profile Card */}
                <div className="lg:col-span-1">
                    <Card className="h-full shadow-lg border-0 rounded-2xl ring-1 ring-gray-50/30">
                        <CardContent className="text-center">
                            <div className="relative inline-block">
                                <div className="w-25 h-25 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full mx-auto mb-1 flex items-center justify-center">
                                    <User className="h-16 w-16 text-white" />
                                </div>
                            </div>

                            <h2 className="text-2xl font-bold text-gray-900 mb-1">
                                {profileData.firstName} {profileData.lastName}
                            </h2>

                            <div className="space-y-2 mb-3">
                                <Badge className="bg-orange-300/10 border border-primary text-primary hover:bg-orange-100 rounded-full px-3 py-1">
                                    {profileData.role}
                                </Badge>
                            </div>

                            <div className="flex items-center justify-center text-gray-300 text-sm">
                                <Calendar className="h-4 w-4 mr-2" />
                                Desde {profileData.joinDate}
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Information Cards */}
                <div className="lg:col-span-3 space-y-6">
                    {/* Personal Information */}
                    <Card className="shadow-lg border-0 rounded-2xl ring-1 ring-gray-50/30">
                        <CardHeader className="pb-4">
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
                                            value={profileData.firstName}
                                            onChange={(e) => handleInputChange('firstName', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 text-gray-400" />
                                            {profileData.firstName}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Apellidos
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={profileData.lastName}
                                            onChange={(e) => handleInputChange('lastName', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <User className="h-4 w-4 " />
                                            {profileData.lastName}
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
                                            value={profileData.email}
                                            onChange={(e) => handleInputChange('email', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Mail className="h-4 w-4 text-gray-400" />
                                            {profileData.email}
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Teléfono
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={profileData.phone}
                                            onChange={(e) => handleInputChange('phone', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <Phone className="h-4 w-4 text-gray-400" />
                                            {profileData.phone}
                                        </div>
                                    )}
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-primary mb-2">
                                        Dirección
                                    </label>
                                    {isEditing ? (
                                        <Input
                                            value={profileData.address}
                                            onChange={(e) => handleInputChange('address', e.target.value)}
                                            className="border-gray-200 focus:border-orange-300 focus:ring-orange-200 rounded-xl"
                                        />
                                    ) : (
                                        <div className="flex items-center gap-2">
                                            <MapPin className="h-4 w-4 text-gray-400" />
                                            {profileData.address}
                                        </div>
                                    )}
                                </div>


                            </div>
                        </CardContent>
                    </Card>

                    {isEditing && (
                        <div className="flex justify-end gap-3">
                            <Button
                                onClick={() => setIsEditing(false)}
                                variant="outline"
                                className="border-gray-300  hover:bg-gray-50 rounded-xl"
                            >
                                Cancelar
                            </Button>
                            <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl border-0">
                                <Save className="h-4 w-4 mr-2" />
                                Guardar Cambios
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
