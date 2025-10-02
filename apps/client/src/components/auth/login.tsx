import { Button } from "../ui/button";
import { useAuth } from "@/hooks/auth/useAuth";
import { toast } from "sonner";
import { useForm, type FieldErrors } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useNavigate } from "react-router";
import { Loader2Icon, LogIn as LoginIcon, CheckCircle, XCircle, AlertCircle } from "lucide-react";

// Schema de validación con Zod
const loginSchema = z.object({
    email: z
        .string()
        .min(1, "El email es requerido")
        .email("Por favor ingrese un email válido"),
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
            await login({
                email: data.email,
                password: data.password
            });
            
            toast.success("¡Inicio de sesión exitoso!", {
                description: "Redirigiendo a la página principal...",
                icon: <CheckCircle className="h-4 w-4" />,
                duration: 3000,
            });
            // El redirect se manejará automáticamente por el contexto de auth
            
        } catch (err) {
            console.error("Error en login:", err);

            // Manejar errores específicos del servidor
            if (err instanceof Error) {
                const errorMessage = err.message.toLowerCase();

                if (errorMessage.includes("email") || errorMessage.includes("usuario")) {
                    toast.error("Email no encontrado", {
                        description: "Verifique que el email esté registrado en el sistema",
                        icon: <XCircle className="h-6 w-6" />,
                        duration: 5000,
                    });
                } else if (errorMessage.includes("password") || errorMessage.includes("contraseña")) {
                    toast.error("Contraseña incorrecta", {
                        description: "La contraseña ingresada no coincide con nuestros registros",
                        icon: <XCircle className="h-6 w-6" />,
                        duration: 5000,
                    });
                } else {
                    toast.error("Error de conexión", {
                        description: err.message || "Ha ocurrido un error inesperado. Intente nuevamente",
                        icon: <AlertCircle className="h-6 w-6" />,
                        duration: 5000,
                    });
                }
            } else {
                toast.error("Error al iniciar sesión", {
                    description: "Ha ocurrido un error inesperado. Por favor, intente nuevamente",
                    icon: <XCircle className="h-6 w-6" />,
                    duration: 5000,
                });
            }
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
                    src="/assets/logo/f-logo.svg"
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
                        <label htmlFor="email" className="block text-sm/6 font-medium text-gray-900 dark:text-gray-100">
                            Usuario
                        </label>
                        <div className="mt-2">
                            <input
                                id="email"
                                type="email"
                                autoComplete="email"
                                {...register("email")}
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
