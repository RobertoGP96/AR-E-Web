import { Button } from "../ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router-dom";
import { Loader2Icon, LogIn as LoginIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";
import fLogoSvg from '/assets/logo/f-logo.svg';

// Schema de validación con Zod
const loginSchema = z.object({
    phone: z
        .string()
        .min(1, "El telefono es requerido"),
    password: z
        .string()
        .min(1, "La contraseña es requerida")
        .min(6, "La contraseña debe tener al menos 6 caracteres"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LogIn() {
    const { login } = useAuth();
    const navigate = useNavigate();

    const {
        register,
        handleSubmit,
        formState: { isSubmitting }
    } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
        mode: "onSubmit", // Cambiar a onSubmit para validar solo al enviar
    });

    const handleLogoClick = () => {
        navigate('/');
    };

    const onSubmit = async (data: LoginFormData) => {
        try {
            // Iniciando login
            
            await login({
                phone_number: data.phone,
                password: data.password
            });
            
            // Login exitoso
            
            toast.success("¡Inicio de sesión exitoso!", {
                description: "Redirigiendo a la página principal...",
                icon: <CheckCircle className="h-4 w-4" />,
                duration: 3000,
            });
            
            // Redirección a la página principal después del login exitoso
            navigate('/', { replace: true });
            
        } catch (err: unknown) {
            // Error en login
            console.error('Login error:', err);

            // Manejar errores específicos del servidor
            if (err && typeof err === 'object' && err !== null) {
                const errorObj = err as Record<string, unknown>;
                
                // Verificar si el error tiene detalles específicos de campo
                if (errorObj.details && typeof errorObj.details === 'object' && errorObj.details !== null) {
                    const details = errorObj.details as Record<string, unknown>;
                    
                    if (details.phone_number) {
                        const phoneErrors = Array.isArray(details.phone_number) ? details.phone_number : [details.phone_number];
                        toast.error("Error en número de teléfono", {
                            description: String(phoneErrors[0]) || "Número de teléfono inválido",
                            icon: <XCircle className="h-6 w-6" />,
                            duration: 5000,
                        });
                        return;
                    }
                    
                    if (details.password) {
                        const passwordErrors = Array.isArray(details.password) ? details.password : [details.password];
                        toast.error("Error en contraseña", {
                            description: String(passwordErrors[0]) || "Contraseña incorrecta",
                            icon: <XCircle className="h-6 w-6" />,
                            duration: 5000,
                        });
                        return;
                    }
                    
                    // Errores generales (non_field_errors)
                    if (details.non_field_errors) {
                        const generalErrors = Array.isArray(details.non_field_errors) ? details.non_field_errors : [details.non_field_errors];
                        toast.error("Error de autenticación", {
                            description: String(generalErrors[0]) || "Credenciales incorrectas",
                            icon: <XCircle className="h-6 w-6" />,
                            duration: 5000,
                        });
                        return;
                    }
                }
                
                // Usar el mensaje del error si existe
                if (errorObj.message && typeof errorObj.message === 'string') {
                    toast.error("Error al iniciar sesión", {
                        description: errorObj.message,
                        icon: <AlertCircle className="h-6 w-6" />,
                        duration: 5000,
                    });
                    return;
                }
            }
            
            // Error genérico como fallback
            toast.error("Error al iniciar sesión", {
                description: "Ha ocurrido un error inesperado. Por favor, intente nuevamente",
                icon: <XCircle className="h-6 w-6" />,
                duration: 5000,
            });
        }
    };

    // Función para manejar errores de validación con toast
    const onError = (errors: FieldErrors<LoginFormData>) => {
        // Mostrar todos los errores como toast individuales
        Object.values(errors).forEach((error) => {
            if (error?.message) {
                toast.error("Error de validación", {
                    description: error.message,
                    icon: <AlertCircle className="h-6 w-6" />,
                    duration: 4000,
                });
            }
        });
    };

    return (
        <div className="bg-black/40 flex min-h-screen flex-col justify-center px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <img
                    alt="AR&E Shipps logo"
                    src={fLogoSvg}
                    className="mx-auto h-16 w-auto cursor-pointer hover:opacity-80 transition-opacity"
                    onClick={handleLogoClick}
                />

                <h2 className="mt-10 text-center text-2xl/9 font-bold tracking-tight text-gray-900 dark:text-white">
                    Inicie sesión con su cuenta
                </h2>
            </div>

            <div className="mt-10 sm:mx-auto sm:w-full sm:max-w-sm">
                <form onSubmit={handleSubmit(onSubmit, onError)} className="space-y-6">
                    <div>
                        <label htmlFor="phone_number" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                            Teléfono
                        </label>
                        <div className="mt-2">
                            <input
                                id="phone_number"
                                type="tel"
                                autoComplete="phone"
                                {...register("phone")}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <div>
                        <div className="flex items-center justify-between">
                            <label htmlFor="password" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                                Contraseña
                            </label>
                            <div className="text-sm">
                                <a
                                    href="#"
                                    className="font-semibold text-gray-300 hover:text-primary"
                                >
                                    Olvidó su contraseña?
                                </a>
                            </div>
                        </div>
                        <div className="mt-2">
                            <input
                                id="password"
                                type="password"
                                autoComplete="current-password"
                                {...register("password")}
                                className="block w-full rounded-md bg-white px-3 py-1.5 text-base text-gray-900 outline-1 -outline-offset-1 outline-gray-300 placeholder:text-gray-400 focus:outline-2 focus:-outline-offset-2 focus:outline-orange-600 sm:text-sm/6 dark:bg-white/5 dark:text-white dark:outline-white/10 dark:placeholder:text-gray-500 dark:focus:outline-orange-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={isSubmitting}
                            />
                        </div>
                    </div>

                    <Button
                        className="w-full cursor-pointer"
                        type="submit"
                        disabled={isSubmitting}
                    >
                        <div className="flex items-center justify-center gap-2">
                            {isSubmitting ? (<>
                                <Loader2Icon className="h-4 w-4 animate-spin" />
                                <span>Iniciando...</span>
                            </>
                            ) : (<>
                                <LoginIcon size={18} />
                                <span>Iniciar Sesión</span>
                            </>
                            )}
                        </div>
                    </Button>
                </form>
            </div>
        </div>
    );
}
