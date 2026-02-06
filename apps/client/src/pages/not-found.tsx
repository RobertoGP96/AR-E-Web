import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AlertCircle, Home, ArrowLeft } from 'lucide-react';

/**
 * Página 404 - No Found
 * Se muestra cuando el usuario intenta acceder a una ruta que no existe
 */
const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Icono grande con animación */}
        <div className="flex justify-center">
          <div className="relative w-32 h-32">
            <div className="absolute inset-0 bg-gradient-to-br from-orange-200 to-amber-200 dark:from-orange-900/30 dark:to-amber-900/30 rounded-full blur-2xl"></div>
            <div className="relative flex items-center justify-center w-full h-full">
              <AlertCircle className="w-24 h-24 text-orange-500 dark:text-orange-400 animate-pulse" />
            </div>
          </div>
        </div>

        {/* Código 404 */}
        <div className="space-y-3">
          <h1 className="text-7xl md:text-8xl font-black text-transparent bg-clip-text bg-gradient-to-r from-orange-500 to-amber-500 dark:from-orange-400 dark:to-amber-400">
            404
          </h1>
          <p className="text-gray-600 dark:text-gray-400 text-sm font-semibold uppercase tracking-widest">
            Página no encontrada
          </p>
        </div>

        {/* Mensaje descriptivo */}
        <div className="space-y-3">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white">
            ¡Oops! Algo salió mal
          </h2>
          <p className="text-gray-600 dark:text-gray-400 text-base leading-relaxed">
            La página que buscas no existe o ha sido movida. No te preocupes, podemos ayudarte a encontrar lo que necesitas.
          </p>
        </div>

        {/* Decoración visual */}
        <div className="flex justify-center gap-2">
          <div className="h-1 w-12 bg-gradient-to-r from-orange-500 to-amber-500 rounded-full"></div>
          <div className="h-1 w-12 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
        </div>

        {/* Botones de acción */}
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center pt-4">
          <Button
            onClick={() => navigate('/')}
            className="gap-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-semibold"
          >
            <Home className="h-4 w-4" />
            Ir a inicio
          </Button>
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="gap-2 border-gray-300 dark:border-gray-600 hover:bg-white/5"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver atrás
          </Button>
        </div>

        {/* Sugerencias */}
        <div className="pt-8 border-t border-gray-200 dark:border-gray-700 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">
            Puedes intentar:
          </p>
          <ul className="text-xs text-gray-500 dark:text-gray-500 space-y-2">
            <li>• Verificar la URL que ingresaste</li>
            <li>• Navegar desde el menú principal</li>
            <li>• Contactar con soporte si el problema persiste</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
