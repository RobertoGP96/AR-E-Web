import { Hexagon } from 'lucide-react';
import { useMemo } from 'react';

interface HoneyLoaderProps {
  size?: 'sm' | 'md' | 'lg';
  text?: string;
  fullScreen?: boolean;
  color?: 'orange' | 'amber' | 'yellow';
}

/**
 * HoneyLoader - Componente de carga con animación de hexágonos (abeja/miel)
 * Optimizado para no crecer demasiado con memoización
 * 
 * @param size - Tamaño del loader: 'sm' | 'md' | 'lg' (default: 'md')
 * @param text - Texto a mostrar debajo del loader (opcional)
 * @param fullScreen - Si es true, ocupa toda la pantalla (default: false)
 * @param color - Color: 'orange' | 'amber' | 'yellow' (default: 'orange')
 */
function HoneyLoaderComponent({
  size = 'md',
  fullScreen = false,
  color = 'orange'
}: HoneyLoaderProps) {
  
  // Memoizar objetos de mapeos para evitar re-renders innecesarios
  const sizes = useMemo(() => ({
    hexagon: { sm: 'w-6 h-6', md: 'w-10 h-10', lg: 'w-14 h-14' },
    container: { sm: 'w-32 h-32', md: 'w-64 h-64', lg: 'w-96 h-96' },
    position: { sm: 'top-6 gap-0.5', md: 'top-14 gap-1', lg: 'top-20 gap-2' }
  }), []);

  const colorMap = useMemo(() => ({
    orange: 'text-orange-400',
    amber: 'text-amber-400',
    yellow: 'text-yellow-400'
  }), []);

  const mainClass = fullScreen
    ? 'fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex flex-col items-center justify-center'
    : 'flex flex-col items-center justify-center min-w-52 max-h-52';

  const hexClass = `${sizes.hexagon[size]} ${colorMap[color]}`;

  return (
    <div className={mainClass}>
      <div className={`relative flex items-center justify-center ${sizes.container[size]}`}>
        <div className={`absolute left-1/2 -translate-x-1/2 flex ${sizes.position[size]}`}>
          <Hexagon 
            className={hexClass} 
            style={{ 
              animation: 'honey-pulse 2s ease-in-out infinite',
              animationDelay: '0.8s' 
            }} 
          />
          <Hexagon 
            className={hexClass} 
            fill="currentColor" 
            style={{ 
              animation: 'honey-pulse 2s ease-in-out infinite',
              animationDelay: '0.2s' 
            }} 
          />
          <Hexagon 
            className={hexClass} 
            style={{ 
              animation: 'honey-pulse 2s ease-in-out infinite',
              animationDelay: '0.6s' 
            }} 
          />
        </div>
      </div>

      <style>{`
        @keyframes honey-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(0.6); opacity: 0.5; }
        }
      `}</style>
    </div>
  );
}

export default HoneyLoaderComponent;