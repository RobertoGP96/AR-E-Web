import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import LoadingSpinner from './LoadingSpinner'

export default function ColorDemo() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light')
  const [isLoading, setIsLoading] = useState(false)

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light')
    document.documentElement.classList.toggle('dark')
  }

  const simulateLoading = () => {
    setIsLoading(true)
    setTimeout(() => setIsLoading(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="p-6">
        <LoadingSpinner 
          size="lg" 
          text="Cargando demostración de colores..." 
          variant="bee"
        />
      </div>
    )
  }

  return (
    <div className={`transition-colors duration-300 ${theme === 'dark' ? 'dark' : ''}`}>
      <div className="bg-background text-foreground p-6 space-y-6">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Demostración de Colores</h2>
            <p className="text-muted-foreground mt-1">
              Configuración de Tailwind CSS v4 + shadcn/ui con colores personalizados
            </p>
          </div>
          <div className="flex gap-3">
            <Button onClick={simulateLoading} variant="outline" className="border-bee-300 text-bee-700 hover:bg-bee-50">
              🔄 Simular Loading
            </Button>
            <Button onClick={toggleTheme} variant="outline">
              {theme === 'light' ? '🌙' : '☀️'} Cambiar a {theme === 'light' ? 'Oscuro' : 'Claro'}
            </Button>
          </div>
        </div>

        {/* Loading Spinners Demo */}
        <Card>
          <CardHeader>
            <CardTitle>Componentes de Loading</CardTitle>
            <CardDescription>
              Diferentes variantes del LoadingSpinner con nuestros colores
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Default</h4>
                <LoadingSpinner size="md" text="Cargando..." variant="default" />
              </div>
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Bee</h4>
                <LoadingSpinner size="md" text="Procesando..." variant="bee" />
              </div>
              <div className="text-center space-y-3">
                <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide">Honey</h4>
                <LoadingSpinner size="md" text="Enviando..." variant="honey" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema de Colores */}
        <Card>
          <CardHeader>
            <CardTitle>Colores del Sistema (shadcn/ui)</CardTitle>
            <CardDescription>
              Variables CSS que se adaptan automáticamente al tema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="bg-primary text-primary-foreground p-4 rounded-lg font-medium text-center">
                Primary
              </div>
              <div className="bg-secondary text-secondary-foreground p-4 rounded-lg font-medium text-center">
                Secondary
              </div>
              <div className="bg-accent text-accent-foreground p-4 rounded-lg font-medium text-center">
                Accent
              </div>
              <div className="bg-muted text-muted-foreground p-4 rounded-lg font-medium text-center">
                Muted
              </div>
              <div className="bg-card text-card-foreground p-4 rounded-lg border font-medium text-center">
                Card
              </div>
              <div className="bg-destructive text-destructive-foreground p-4 rounded-lg font-medium text-center">
                Destructive
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botones */}
        <Card>
          <CardHeader>
            <CardTitle>Variantes de Botones</CardTitle>
            <CardDescription>
              Diferentes estilos de botones disponibles con nuestro sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Button>Default</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="destructive">Destructive</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="link">Link</Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button className="bg-bee-500 hover:bg-bee-600 text-white">
                Bee Primary
              </Button>
              <Button className="bg-honey-500 hover:bg-honey-600 text-white">
                Honey Primary
              </Button>
              <Button variant="outline" className="border-bee-300 text-bee-700 hover:bg-bee-50">
                Bee Outline
              </Button>
              <Button variant="outline" className="border-honey-300 text-honey-700 hover:bg-honey-50">
                Honey Outline
              </Button>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <Button size="sm">Small</Button>
              <Button size="default">Default</Button>
              <Button size="lg">Large</Button>
            </div>
          </CardContent>
        </Card>

        {/* Colores Bee */}
        <Card>
          <CardHeader>
            <CardTitle>Colores Bee (Temática de Abejas)</CardTitle>
            <CardDescription>
              Paleta personalizada en tonos naranjas para branding
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-6">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center space-y-2">
                  <div 
                    className={`w-16 h-16 rounded-lg border border-border shadow-sm bg-bee-${shade} relative group cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {shade}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="bg-bee-50 border border-bee-200 p-4 rounded-lg">
              <p className="text-bee-800 font-medium">
                💡 Los colores bee van desde bee-50 (muy claro) hasta bee-900 (muy oscuro)
              </p>
              <p className="text-bee-700 text-sm mt-1">
                Usa bee-500 como color principal de branding
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Colores Honey */}
        <Card>
          <CardHeader>
            <CardTitle>Colores Honey (Temática de Miel)</CardTitle>
            <CardDescription>
              Paleta complementaria en tonos ámbar/amarillos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-5 md:grid-cols-10 gap-3 mb-6">
              {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                <div key={shade} className="text-center space-y-2">
                  <div 
                    className={`w-16 h-16 rounded-lg border border-border shadow-sm bg-honey-${shade} relative group cursor-pointer`}
                  >
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 rounded-lg transition-colors" />
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {shade}
                  </Badge>
                </div>
              ))}
            </div>
            
            <div className="bg-honey-50 border border-honey-200 p-4 rounded-lg">
              <p className="text-honey-800 font-medium">
                🍯 Los colores honey complementan perfectamente a los colores bee
              </p>
              <p className="text-honey-700 text-sm mt-1">
                Ideales para estados de éxito, alertas importantes o elementos destacados
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Ejemplos de Uso */}
        <Card>
          <CardHeader>
            <CardTitle>Ejemplos de Uso Combinado</CardTitle>
            <CardDescription>
              Mostrando cómo combinar colores del sistema con personalizados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">Tarjeta de Usuario</h3>
                  <Badge className="bg-bee-100 text-bee-800 hover:bg-bee-200">
                    Activo
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Esta tarjeta combina colores del sistema con acentos bee para crear una interfaz coherente.
                </p>
                <Button size="sm" className="bg-bee-500 hover:bg-bee-600">
                  Ver Perfil
                </Button>
              </div>
              
              <div className="bg-card border rounded-lg p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-card-foreground">Notificación</h3>
                  <Badge className="bg-honey-100 text-honey-800 hover:bg-honey-200">
                    Importante
                  </Badge>
                </div>
                <p className="text-muted-foreground text-sm">
                  Los colores honey son perfectos para elementos que requieren atención especial.
                </p>
                <Button size="sm" variant="outline" className="border-honey-300 text-honey-700 hover:bg-honey-50">
                  Marcar como Leída
                </Button>
              </div>
            </div>

            <div className="bg-gradient-to-r from-bee-500 via-honey-400 to-bee-600 p-6 rounded-lg text-white">
              <h3 className="text-xl font-bold mb-2">Gradiente Bee + Honey</h3>
              <p className="text-white/90">
                Combinando ambas paletas puedes crear gradientes hermosos para banners o elementos destacados.
              </p>
              <Button className="mt-3 bg-white/20 hover:bg-white/30 border border-white/30" size="sm">
                Acción Principal
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Guía de Uso */}
        <Card>
          <CardHeader>
            <CardTitle>📋 Guía de Uso Rápida</CardTitle>
            <CardDescription>
              Mejores prácticas para usar los colores en tu aplicación
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-primary uppercase tracking-wide">✅ Recomendado</h4>
                <div className="space-y-2 text-sm">
                  <p>• Usa colores del sistema para elementos base</p>
                  <p>• bee-500 para botones principales</p>
                  <p>• honey-500 para alertas/warnings</p>
                  <p>• Combina light/dark modes automáticamente</p>
                </div>
              </div>
              <div className="space-y-3">
                <h4 className="font-semibold text-sm text-destructive uppercase tracking-wide">⚠️ Evitar</h4>
                <div className="space-y-2 text-sm">
                  <p>• Hardcodear colores sin variables CSS</p>
                  <p>• Usar colores muy saturados para texto</p>
                  <p>• Mezclar demasiados colores en un elemento</p>
                  <p>• Ignorar el contraste de accesibilidad</p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
