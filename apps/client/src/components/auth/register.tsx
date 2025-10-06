import { Mail, MapPin, Phone, User2, UserPlus, X, Eye, EyeOff, Loader2, AlertCircle, CheckCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useState } from "react";
import { useRegisterFlow, useCheckEmailAvailability, useCheckPhoneAvailability } from "@/hooks/auth/useRegister";
import type { RegisterData } from "@/types/api";


export default function Register() {
    const [formData, setFormData] = useState<RegisterData>({
        name: '',
        last_name: '',
        phone_number: '',
        email: '',
        home_address: '',
        password: '',
    });

    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const {
        register,
        isRegistering,
        registerError,
        registerSuccess,
        reset,
    } = useRegisterFlow();

    // Verificación de disponibilidad de email y teléfono
    const { 
        data: emailAvailability, 
        isLoading: checkingEmail 
    } = useCheckEmailAvailability(
        formData.email,
        formData.email.trim().length > 0 && formData.email.includes('@') && formData.email.length > 5
    );

    const { 
        data: phoneAvailability, 
        isLoading: checkingPhone 
    } = useCheckPhoneAvailability(
        formData.phone_number,
        formData.phone_number.length > 8
    );

    const handleInputChange = (field: keyof RegisterData, value: string) => {
        setFormData(prev => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!formData.name.trim()) {
            alert('El nombre es requerido');
            return;
        }
        
        if (!formData.phone_number.trim()) {
            alert('El teléfono es requerido');
            return;
        }
        
        if (!formData.password.trim()) {
            alert('La contraseña es requerida');
            return;
        }

        if (formData.password !== confirmPassword) {
            alert('Las contraseñas no coinciden');
            return;
        }

        if (formData.password.length < 6) {
            alert('La contraseña debe tener al menos 6 caracteres');
            return;
        }

        if (phoneAvailability && !phoneAvailability.available) {
            alert('Este número de teléfono ya está registrado');
            return;
        }

        // Solo validar email si se ha proporcionado
        if (formData.email.trim() && emailAvailability && !emailAvailability.available) {
            alert('Este email ya está registrado');
            return;
        }

        try {
            await register(formData);
        } catch {
            // Error al registrar
        }
    };

    const handleCancel = () => {
        setFormData({
            name: '',
            last_name: '',
            phone_number: '',
            email: '',
            home_address: '',
            password: '',
        });
        setConfirmPassword('');
        reset();
    };

    const isFormValid = formData.name.trim() && 
                       formData.phone_number.trim() && 
                       formData.password.trim() &&
                       confirmPassword.trim() &&
                       formData.password === confirmPassword &&
                       formData.password.length >= 6 &&
                       (!phoneAvailability || phoneAvailability.available) &&
                       (!emailAvailability || emailAvailability.available || !formData.email.trim());

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="mx-auto mt-1/4 py-30 max-w-3xl">
                <div className="space-y-12">
                    <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                        <h2 className="flex flex-row gap-2 text-base/7 font-semibold text-gray-900 dark:text-white">
                            <User2 />
                            Información Personal 
                        </h2>

                        {/* Mostrar estados de registro */}
                        {registerError && (
                            <div className="mt-4 flex items-center gap-2 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md dark:bg-red-900/20 dark:border-red-800 dark:text-red-300">
                                <AlertCircle className="h-4 w-4" />
                                <span>Error: {registerError?.message || 'Error al registrar usuario'}</span>
                            </div>
                        )}

                        {registerSuccess && (
                            <div className="mt-4 flex items-center gap-2 p-3 bg-green-100 border border-green-400 text-green-700 rounded-md dark:bg-green-900/20 dark:border-green-800 dark:text-green-300">
                                <CheckCircle className="h-4 w-4" />
                                <span>¡Usuario registrado exitosamente! Revisa tu correo para verificar tu cuenta.</span>
                            </div>
                        )}

                        <div className="mt-10 grid grid-cols-1 gap-x-6 gap-y-8 sm:grid-cols-6">
                            <div className="sm:col-span-3">
                                <label htmlFor="first-name" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Nombres*
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="first-name"
                                        name="first-name"
                                        type="text"
                                        value={formData.name}
                                        onChange={(e) => handleInputChange('name', e.target.value)}
                                        autoComplete="given-name"
                                        required
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="last-name" className="block text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Apellidos
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="last-name"
                                        name="last-name"
                                        type="text"
                                        value={formData.last_name}
                                        onChange={(e) => handleInputChange('last_name', e.target.value)}
                                        autoComplete="family-name"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="phone" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <Phone />
                                    Teléfono*
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="phone"
                                        name="phone"
                                        type="tel"
                                        value={formData.phone_number}
                                        onChange={(e) => handleInputChange('phone_number', e.target.value)}
                                        autoComplete="tel"
                                        placeholder="+5355555555"
                                        required
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                    {checkingPhone && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {phoneAvailability && !phoneAvailability.available && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        Este número ya está registrado
                                    </p>
                                )}
                                {phoneAvailability && phoneAvailability.available && formData.phone_number.length > 8 && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        Número disponible
                                    </p>
                                )}
                            </div>

                            <div className="sm:col-span-3">
                                <label htmlFor="email" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <Mail />
                                    Correo (Opcional)
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="email"
                                        name="email"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        autoComplete="email"
                                        placeholder="usuario@ejemplo.com"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-500"
                                    />
                                    {checkingEmail && (
                                        <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
                                        </div>
                                    )}
                                </div>
                                {emailAvailability && !emailAvailability.available && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        Este email ya está registrado
                                    </p>
                                )}
                                {emailAvailability && emailAvailability.available && formData.email.includes('@') && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        Email disponible
                                    </p>
                                )}
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="street-address" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    <MapPin />
                                    Dirección
                                </label>
                                <div className="mt-2">
                                    <input
                                        id="street-address"
                                        name="street-address"
                                        type="text"
                                        value={formData.home_address}
                                        onChange={(e) => handleInputChange('home_address', e.target.value)}
                                        autoComplete="street-address"
                                        placeholder="Calle, número, ciudad"
                                        className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                </div>
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="password" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Contraseña*
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="password"
                                        name="password"
                                        type={showPassword ? "text" : "password"}
                                        value={formData.password}
                                        onChange={(e) => handleInputChange('password', e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        minLength={6}
                                        className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {formData.password && formData.password.length < 6 && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        La contraseña debe tener al menos 6 caracteres
                                    </p>
                                )}
                            </div>

                            <div className="col-span-full">
                                <label htmlFor="confirm-password" className="flex flex-row gap-2 text-sm/6 font-medium text-gray-900 dark:text-white">
                                    Confirmar Contraseña*
                                </label>
                                <div className="mt-2 relative">
                                    <input
                                        id="confirm-password"
                                        name="confirm-password"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        autoComplete="new-password"
                                        required
                                        className="block w-full rounded-md bg-white px-3 py-1.5 pr-10 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-400 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-400"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                        className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                                    >
                                        {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                {confirmPassword && formData.password !== confirmPassword && (
                                    <p className="mt-1 text-sm text-red-600 dark:text-red-400">
                                        Las contraseñas no coinciden
                                    </p>
                                )}
                                {confirmPassword && formData.password === confirmPassword && confirmPassword.length >= 6 && (
                                    <p className="mt-1 text-sm text-green-600 dark:text-green-400">
                                        Las contraseñas coinciden
                                    </p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-6 flex items-center justify-end gap-x-6">
                    <Button 
                        type="button"
                        onClick={handleCancel}
                        className="cursor-pointer" 
                        variant={"ghost"}
                        disabled={isRegistering}
                    >
                        <X />
                        <span>Cancelar</span>
                    </Button>
                    
                    <Button 
                        type="submit"
                        className="cursor-pointer"
                        disabled={!isFormValid || isRegistering}
                    >
                        {isRegistering ? (
                            <>
                                <Loader2 className="h-4 w-4 animate-spin" />
                                <span>Registrando...</span>
                            </>
                        ) : (
                            <>
                                <UserPlus />
                                <span>Registrar</span>
                            </>
                        )}
                    </Button>
                </div>
            </form>
        </div>
    );
}
