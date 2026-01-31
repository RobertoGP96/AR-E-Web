import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Eye, EyeOff, LogIn, Loader2, Mail, Phone, Check } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/auth/useAuth";
import type { LoginCredentials } from "@/types/api";
import { apiClient } from "@/lib/api-client";
import logoSvg from "@/assets/logo/logo.svg";

// Función helper para detectar si es email o teléfono
const detectInputType = (value: string): "email" | "phone" | "unknown" => {
  const trimmedValue = value.trim();

  // Detectar email
  if (
    trimmedValue.includes("@") &&
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)
  ) {
    return "email";
  }

  // Detectar teléfono
  if (
    /^[+\d\s\-()]+$/.test(trimmedValue) &&
    trimmedValue.replace(/[\s\-()]/g, "").length >= 8
  ) {
    return "phone";
  }

  return "unknown";
};

// Schema de validación con Zod
const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .trim()
    .min(1, "El email o número de teléfono es requerido")
    .refine((val) => {
      const type = detectInputType(val);
      return type === "email" || type === "phone";
    }, "Ingresa un email válido o un número de teléfono válido"),
  password: z
    .string()
    .min(1, "La contraseña es requerida")
    .min(6, "La contraseña debe tener al menos 6 caracteres"),
  rememberMe: z.boolean(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginProps {
  onSuccess?: () => void;
  redirectTo?: string;
  className?: string;
}

export const Login: React.FC<LoginProps> = ({
  onSuccess,
  redirectTo = "/",
  className,
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [inputType, setInputType] = useState<"email" | "phone" | "unknown">(
    "unknown",
  );

  const from =
    (location.state as { from?: { pathname: string } })?.from?.pathname ||
    redirectTo;

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: "",
      password: "",
      rememberMe: false,
    },
  });

  const emailOrPhoneValue = form.watch("emailOrPhone");

  useEffect(() => {
    if (emailOrPhoneValue) {
      setInputType(detectInputType(emailOrPhoneValue));
    } else {
      setInputType("unknown");
    }
  }, [emailOrPhoneValue]);

  // Redirigir si ya está autenticado
  useEffect(() => {
    if (isAuthenticated) {
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(from, { replace: true });
      }
    }
  }, [isAuthenticated, navigate, onSuccess, from]);

  // Mostrar error si existe
  useEffect(() => {
    if (error) {
      toast.error(error, {
        duration: 5000,
        position: "top-center",
      });
      clearError();
    }
  }, [error, clearError]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const inputValue = data.emailOrPhone.trim();
      const type = detectInputType(inputValue);

      const credentials: LoginCredentials & { rememberMe: boolean } = {
        password: data.password,
        rememberMe: data.rememberMe,
      };

      if (type === "email") {
        credentials.email = inputValue.toLowerCase();
      } else {
        credentials.phone_number = inputValue;
      }

      await login(credentials);

      toast.success("¡Bienvenido! Redirigiendo...", {
        duration: 2000,
        position: "top-center",
      });
    } catch (err: unknown) {
      // El error se maneja en el hook AuthContext / useAuth
      if (import.meta.env.DEV) console.error("Login failed:", err);

      // Si por alguna razón el contexto no capturó el error, lo hacemos aquí usando apiClient
      if (!error) {
        toast.error(apiClient.getErrorMessage(err as Error));
      }
    }
  };

  return (
    <div
      className={cn(
        "flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-gray-500",
        className,
      )}
    >
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm drop-shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-2">
            <img
              src={logoSvg}
              alt="Logo"
              className="h-24 w-auto object-contain"
            />
          </div>
          <CardTitle className="text-2xl font-bold text-gray-900">
            Iniciar Sesión
          </CardTitle>
          <CardDescription className="text-gray-600">
            Panel de administración
          </CardDescription>
        </CardHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <CardContent className="space-y-4">
              <FormField
                control={form.control}
                name="emailOrPhone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      Email o
                      <Phone className="h-4 w-4" />
                      Teléfono
                    </FormLabel>
                    <FormControl>
                      <InputGroup>
                        <InputGroupInput
                          {...field}
                          disabled={isLoading}
                          className="h-11 bg-white"
                          placeholder="tu@email.com o +53..."
                        />
                        {inputType !== "unknown" && (
                          <InputGroupAddon align="inline-end">
                            <div className="bg-primary text-primary-foreground flex size-4 items-center justify-center rounded-full">
                              <Check className="h-2 w-2" />
                            </div>
                          </InputGroupAddon>
                        )}
                      </InputGroup>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-gray-700 font-medium">
                      Contraseña
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          placeholder="••••••••"
                          type={showPassword ? "text" : "password"}
                          disabled={isLoading}
                          className="h-11 pr-10 bg-white"
                          {...field}
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowPassword(!showPassword)}
                          disabled={isLoading}
                        >
                          {showPassword ? (
                            <EyeOff className="h-4 w-4 text-gray-500" />
                          ) : (
                            <Eye className="h-4 w-4 text-gray-500" />
                          )}
                        </Button>
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex items-center justify-between">
                <FormField
                  control={form.control}
                  name="rememberMe"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          disabled={isLoading}
                        />
                      </FormControl>
                      <FormLabel className="text-sm font-normal text-gray-600 cursor-pointer">
                        Recordarme
                      </FormLabel>
                    </FormItem>
                  )}
                />

                <Button
                  type="button"
                  variant="link"
                  className="px-0 text-sm h-auto"
                  onClick={() => navigate("/forgot-password")}
                  disabled={isLoading}
                >
                  ¿Olvidaste tu contraseña?
                </Button>
              </div>
            </CardContent>

            <CardFooter className="p-6 pt-2">
              <Button
                type="submit"
                className="w-full h-11 text-white font-medium"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <LogIn className="mr-2 h-4 w-4" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </CardFooter>
          </form>
        </Form>
      </Card>
    </div>
  );
};

export default Login;
