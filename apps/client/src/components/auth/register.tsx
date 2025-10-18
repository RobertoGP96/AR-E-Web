import { Mail, MapPin, Phone, User2, UserPlus, X, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { Button } from "../ui/button";
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useRegisterFlow, useCheckEmailAvailability, useCheckPhoneAvailability } from "@/hooks/auth/useRegister";
import type { RegisterData } from "@/types/api";


export default function Register() {
    const navigate = useNavigate();
    
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
        registerData,
        reset,
    } = useRegisterFlow();

    // Manejo de efectos para registro exitoso y errores
    useEffect(() => {
        if (registerSuccess && registerData) {
            toast.success("¡Registro exitoso!", {
                description: "Usuario registrado correctamente. Redirigiendo al login...",
                duration: 3000,
            });
            
            // Redirección al login después de 2 segundos
            setTimeout(() => {
                navigate('/', { replace: true });
            }, 2000);
        }
    }, [registerSuccess, registerData, navigate]);

    useEffect(() => {
        if (registerError) {
            // Manejo específico de errores del backend
            let errorMessage = "Error al registrar usuario";
            let errorDescription = "Ha ocurrido un error inesperado";

            // Verificar si el error tiene propiedades específicas
            if (registerError && typeof registerError === 'object' && registerError !== null) {
                // Convertir a unknown primero para evitar errores de tipo
                const errorObj = registerError as unknown;
                const error = errorObj as Record<string, unknown>;
                
                // Verificar errores específicos de campo
                if (error.details && typeof error.details === 'object' && error.details !== null) {
                    const details = error.details as Record<string, unknown>;
                    
                    if (details.phone_number) {
                        errorMessage = "Error en número de teléfono";
                        errorDescription = Array.isArray(details.phone_number) 
                            ? String(details.phone_number[0])
                            : String(details.phone_number);
                    } else if (details.email) {
                        errorMessage = "Error en email";
                        errorDescription = Array.isArray(details.email) 
                            ? String(details.email[0])
                            : String(details.email);
                    } else if (details.password) {
                        errorMessage = "Error en contraseña";
                        errorDescription = Array.isArray(details.password) 
                            ? String(details.password[0])
                            : String(details.password);
                    } else if (details.non_field_errors) {
                        errorMessage = "Error de validación";
                        errorDescription = Array.isArray(details.non_field_errors) 
                            ? String(details.non_field_errors[0])
                            : String(details.non_field_errors);
                    }
                } else if (error.message && typeof error.message === 'string') {
                    errorDescription = error.message;
                } else if (registerError instanceof Error) {
                    errorDescription = registerError.message;
                }
            }

            toast.error(errorMessage, {
                description: errorDescription,
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 5000,
            });
        }
    }, [registerError]);

    // Verificación de disponibilidad de email y teléfono
    const { 
        data: emailAvailability, 
        isLoading: checkingEmail 
    } = useCheckEmailAvailability(
        formData.email || '',
        (formData.email?.trim().length || 0) > 0 && formData.email?.includes('@') && (formData.email?.length || 0) > 5
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
        
        // Validaciones básicas con toasts
        if (!formData.name.trim()) {
            toast.error('Campo requerido', {
                description: 'El nombre es requerido',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 4000,
            });
            return;
        }
        
        if (!formData.phone_number.trim()) {
            toast.error('Campo requerido', {
                description: 'El número de teléfono es requerido',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 4000,
            });
            return;
        }
        
        if (!formData.password.trim()) {
            toast.error('Campo requerido', {
                description: 'La contraseña es requerida',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 4000,
            });
            return;
        }

        if (formData.password !== confirmPassword) {
            toast.error('Error de validación', {
                description: 'Las contraseñas no coinciden',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 4000,
            });
            return;
        }

        if (formData.password.length < 6) {
            toast.error('Error de validación', {
                description: 'La contraseña debe tener al menos 6 caracteres',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 4000,
            });
            return;
        }

        if (phoneAvailability && !phoneAvailability.available) {
            toast.error('Número no disponible', {
                description: 'Este número de teléfono ya está registrado',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 5000,
            });
            return;
        }

        // Solo validar email si se ha proporcionado
        if (formData.email?.trim() && emailAvailability && !emailAvailability.available) {
            toast.error('Email no disponible', {
                description: 'Este email ya está registrado',
                icon: <AlertCircle className="h-4 w-4" />,
                duration: 5000,
            });
            return;
        }

        try {
            // Preparar datos de registro, solo incluir email si tiene valor
            const registrationData = { ...formData };
            if (!formData.email?.trim()) {
                delete registrationData.email;
            }
            
            await register(registrationData);
        } catch (error) {
            // El error ya se maneja en el hook y se muestra en la UI
            console.error('Error en registro:', error);
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
                       (!emailAvailability || emailAvailability.available || !formData.email?.trim());

    return (
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <form onSubmit={handleSubmit} className="mx-auto mt-1/4 py-30 max-w-3xl">
                <div className="space-y-12">
                    <div className="border-b border-gray-900/10 pb-12 dark:border-white/10">
                        <h2 className="flex flex-row gap-2 text-base/7 font-semibold text-gray-900 dark:text-white">
                            <User2 />
                            Información Personal 
                        </h2>



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
                                {emailAvailability && emailAvailability.available && formData.email?.includes('@') && (
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
