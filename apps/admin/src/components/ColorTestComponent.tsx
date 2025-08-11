import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { beeColors, honeyColors, statusColors } from "@/lib/colors"

export default function ColorTestComponent() {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-3xl font-bold tracking-tight">Test de Colores</h2>
        <p className="text-muted-foreground">
          Verifica que todos los colores funcionan correctamente con shadcn/ui y Tailwind CSS v4
        </p>
      </div>

      {/* Test de Botones con Colores del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle>Botones con Colores del Sistema</CardTitle>
          <CardDescription>
            Usando variables CSS de shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button variant="default">Primary Button</Button>
          <Button variant="secondary">Secondary Button</Button>
          <Button variant="destructive">Destructive Button</Button>
          <Button variant="outline">Outline Button</Button>
          <Button variant="ghost">Ghost Button</Button>
          <Button variant="link">Link Button</Button>
        </CardContent>
      </Card>

      {/* Test de Colores Bee */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta Bee (Colores de Abeja)</CardTitle>
          <CardDescription>
            Colores personalizados para la temática de abejas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {Object.entries(beeColors).map(([shade, color]) => (
              <div key={shade} className="flex flex-col items-center space-y-2">
                <div 
                  className={`w-12 h-12 rounded-lg border border-border shadow-sm`}
                  style={{ backgroundColor: color }}
                />
                <Badge variant="outline" className="text-xs">
                  {shade}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test de Colores Honey */}
      <Card>
        <CardHeader>
          <CardTitle>Paleta Honey (Colores de Miel)</CardTitle>
          <CardDescription>
            Colores complementarios inspirados en la miel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 lg:grid-cols-10 gap-2">
            {Object.entries(honeyColors).map(([shade, color]) => (
              <div key={shade} className="flex flex-col items-center space-y-2">
                <div 
                  className={`w-12 h-12 rounded-lg border border-border shadow-sm`}
                  style={{ backgroundColor: color }}
                />
                <Badge variant="outline" className="text-xs">
                  {shade}
                </Badge>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Test de Clases Tailwind */}
      <Card>
        <CardHeader>
          <CardTitle>Clases Tailwind con Colores Personalizados</CardTitle>
          <CardDescription>
            Verificando que las clases de Tailwind funcionan con nuestros colores
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap gap-3">
            <div className="bg-bee-100 text-bee-900 p-3 rounded-lg border">
              bg-bee-100 text-bee-900
            </div>
            <div className="bg-bee-500 text-white p-3 rounded-lg shadow">
              bg-bee-500 text-white
            </div>
            <div className="bg-honey-200 text-honey-800 p-3 rounded-lg border">
              bg-honey-200 text-honey-800
            </div>
            <div className="bg-honey-600 text-white p-3 rounded-lg shadow">
              bg-honey-600 text-white
            </div>
          </div>
          
          <div className="flex flex-wrap gap-3">
            <Button className="bg-bee-500 hover:bg-bee-600">
              Botón Bee Custom
            </Button>
            <Button className="bg-honey-500 hover:bg-honey-600">
              Botón Honey Custom
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test de Variables CSS */}
      <Card>
        <CardHeader>
          <CardTitle>Variables CSS del Sistema</CardTitle>
          <CardDescription>
            Colores usando las variables CSS de shadcn/ui
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="bg-background text-foreground p-3 border rounded">
                background + foreground
              </div>
              <div className="bg-card text-card-foreground p-3 border rounded shadow-sm">
                card + card-foreground
              </div>
              <div className="bg-primary text-primary-foreground p-3 rounded">
                primary + primary-foreground
              </div>
              <div className="bg-secondary text-secondary-foreground p-3 rounded">
                secondary + secondary-foreground
              </div>
            </div>
            <div className="space-y-2">
              <div className="bg-muted text-muted-foreground p-3 rounded">
                muted + muted-foreground
              </div>
              <div className="bg-accent text-accent-foreground p-3 rounded">
                accent + accent-foreground
              </div>
              <div className="bg-destructive text-destructive-foreground p-3 rounded">
                destructive + destructive-foreground
              </div>
              <div className="border-2 border-border p-3 rounded">
                border color
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Test de Estados de Color */}
      <Card>
        <CardHeader>
          <CardTitle>Estados de Color</CardTitle>
          <CardDescription>
            Colores para diferentes estados de la aplicación
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Badge style={{ backgroundColor: statusColors.success }} className="text-white">
              Success
            </Badge>
            <Badge style={{ backgroundColor: statusColors.warning }} className="text-white">
              Warning
            </Badge>
            <Badge style={{ backgroundColor: statusColors.error }} className="text-white">
              Error
            </Badge>
            <Badge style={{ backgroundColor: statusColors.info }} className="text-white">
              Info
            </Badge>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
