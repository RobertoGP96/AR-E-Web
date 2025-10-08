import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Eye, EyeOff, LogIn, Loader2, Info, Mail, Phone } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/hooks/auth/useAuth';
import type { LoginCredentials } from '@/types/api';
import logoSvg from '@/assets/logo/logo.svg';

// Función helper para detectar si es email o teléfono
const detectInputType = (value: string): 'email' | 'phone' | 'unknown' => {
  const trimmedValue = value.trim();
  
  // Detectar email (contiene @ y formato válido)
  if (trimmedValue.includes('@') && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedValue)) {
    return 'email';
  }
  
  // Detectar teléfono (solo números, +, espacios, guiones, paréntesis)
  if (/^[+\d\s\-()]+$/.test(trimmedValue) && trimmedValue.replace(/[\s\-()]/g, '').length >= 8) {
    return 'phone';
  }
  
  return 'unknown';
};

// Schema de validación con Zod - Campo flexible para email o teléfono
const loginSchema = z.object({
  emailOrPhone: z
    .string()
    .trim()
    .min(1, 'El email o número de teléfono es requerido')
    .refine(
      (val) => {
        const type = detectInputType(val);
        return type === 'email' || type === 'phone';
      },
      'Ingresa un email válido o un número de teléfono válido'
    ),
  password: z
    .string()
    .min(1, 'La contraseña es requerida')
    .min(6, 'La contraseña debe tener al menos 6 caracteres')
    .max(128, 'La contraseña es demasiado larga')
    .refine(
      (val) => val.trim().length === val.length,
      'La contraseña no debe contener espacios al inicio o final'
    ),
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
  redirectTo = '/',
  className 
}) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isLoading, error, clearError, isAuthenticated } = useAuth();
  const [showPassword, setShowPassword] = useState(false);

  // Obtener la ubicación desde donde se redirigió o usar la ruta por defecto
  const from = (location.state as { from?: { pathname: string } })?.from?.pathname || redirectTo;

  // Configuración del formulario con react-hook-form y zod
  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      emailOrPhone: '',
      password: '',
      rememberMe: false,
    },
  });

  // Estado para mostrar el icono según el tipo detectado
  const [inputType, setInputType] = useState<'email' | 'phone' | 'unknown'>('unknown');

  // Watch del campo para detectar el tipo en tiempo real
  const emailOrPhoneValue = form.watch('emailOrPhone');

  useEffect(() => {
    if (emailOrPhoneValue) {
      const detected = detectInputType(emailOrPhoneValue);
      setInputType(detected);
    } else {
      setInputType('unknown');
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

  // Limpiar errores cuando el usuario comience a escribir
  useEffect(() => {
    const subscription = form.watch(() => {
      if (error) {
        clearError();
      }
    });
    return () => subscription.unsubscribe();
  }, [error, clearError, form]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      const inputValue = data.emailOrPhone.trim();
      const type = detectInputType(inputValue);
      
      // Crear credenciales según el tipo detectado
      const credentials: LoginCredentials & { phone_number?: string } = type === 'email'
        ? { email: inputValue.toLowerCase(), password: data.password }
        : { email: '', phone_number: inputValue, password: data.password };
      
      await login(credentials as LoginCredentials);
      
      // Si llegamos aquí, el login fue exitoso
      if (onSuccess) {
        onSuccess();
      } else {
        navigate(from, { replace: true });
      }
    } catch (err) {
      // El error ya es manejado por el AuthContext y useAuth
      // Solo logueamos en consola para debugging
      if (import.meta.env.DEV) {
        console.error('Login failed:', err);
      }
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleForgotPassword = () => {
    navigate('/forgot-password');
  };


  return (
    <TooltipProvider>
      <div className={cn("flex items-center justify-center min-h-screen bg-gradient-to-br from-orange-100 to-gray-500", className)}>
        <Card className="w-full max-w-md shadow-2xl border-0 bg-white/95 backdrop-blur-sm drop-shadow-xl">
          <CardHeader className="space-y-1 text-center">
            <div className="flex justify-center mb-2">
                <img 
                  src={logoSvg} 
                  alt="Logo de la aplicación" 
                  className="h-25 w-25 object-contain"
                />
            </div>
            <CardTitle className="text-2xl font-bold text-gray-900">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-gray-600">
              Ingresa tus credenciales para acceder al sistema de administración
            </CardDescription>
          </CardHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                {error && (
                  <Alert variant="destructive" className="border-red-200 bg-red-50">
                    <Info className="h-4 w-4" />
                    <AlertDescription className="text-red-700">
                      {error}
                    </AlertDescription>
                  </Alert>
                )}
                
                <FormField
                  control={form.control}
                  name="emailOrPhone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-gray-700 font-medium flex items-center gap-1">
                        {inputType === 'email' && <Mail className="h-4 w-4" />}
                        {inputType === 'phone' && <Phone className="h-4 w-4" />}
                        {inputType === 'unknown' && <Mail className="h-4 w-4 opacity-50" />}
                        Email o Teléfono
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="tu@email.com o +53 1234 5678"
                          type="text"
                          disabled={isLoading}
                          className="h-11"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                      {inputType !== 'unknown' && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {inputType === 'email' && '✓ Email detectado'}
                          {inputType === 'phone' && '✓ Teléfono detectado'}
                        </p>
                      )}
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
                            type={showPassword ? 'text' : 'password'}
                            disabled={isLoading}
                            className="h-11 pr-10"
                            {...field}
                          />
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                onClick={togglePasswordVisibility}
                                disabled={isLoading}
                              >
                                {showPassword ? (
                                  <EyeOff className="h-4 w-4 text-gray-500" />
                                ) : (
                                  <Eye className="h-4 w-4 text-gray-500" />
                                )}
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>{showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}</p>
                            </TooltipContent>
                          </Tooltip>
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
                      <FormItem className="flex flex-row items-start space-x-2 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            disabled={isLoading}
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="text-sm font-normal text-gray-600">
                            Recordarme
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                  
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        type="button"
                        variant="link"
                        className="px-0 text-sm "
                        onClick={handleForgotPassword}
                        disabled={isLoading}
                      >
                        ¿Olvidaste tu contraseña?
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Recuperar contraseña por email</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </CardContent>

              <CardFooter className='p-4'>
                <Button
                  type="submit"
                  className="w-full h-11  text-white font-medium"
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
    </TooltipProvider>
  );
};

export default Login;