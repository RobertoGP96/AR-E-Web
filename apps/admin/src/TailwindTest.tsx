import { Card, CardContent, CardHeader, CardTitle } from './components/ui/card';
import { Button } from './components/ui/button';
import { Badge } from './components/ui/badge';
import { Package, TrendingUp, AlertCircle } from 'lucide-react';

const TailwindTest = () => {
  return (
    <div className="p-8 space-y-8 bg-background min-h-screen">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-2">Prueba de Estilos - Tailwind CSS v4</h1>
        <p className="text-lg text-muted-foreground mb-8">
          Verificando que todos los componentes y colores funcionen correctamente
        </p>
        
        {/* Tarjetas de Prueba */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <Card className="border-border hover:shadow-lg transition-shadow">
            <CardHeader>
              <CardTitle className="text-card-foreground flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Card Principal
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                Esta es una tarjeta de prueba con el tema personalizado de abejas.
              </p>
              <div className="space-y-2">
                <Button className="w-full bg-primary text-primary-foreground hover:bg-primary/90">
                  Botón Primario
                </Button>
                <Button variant="outline" className="w-full border-border hover:bg-accent">
                  Botón Outline
                </Button>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border bg-gradient-to-br from-bee-50 to-honey-50">
            <CardHeader>
              <CardTitle className="text-card-foreground">Colores Bee Theme</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="p-2 bg-bee-500 text-white rounded text-center">Bee 500</div>
                <div className="p-2 bg-honey-500 text-white rounded text-center">Honey 500</div>
                <div className="p-2 bg-primary text-primary-foreground rounded text-center">Primary</div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="border-border">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-card-foreground">
                Estadística
              </CardTitle>
              <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-4 w-4 text-primary" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-card-foreground">1,234</div>
              <p className="text-xs text-muted-foreground">
                <TrendingUp className="h-3 w-3 inline mr-1" />
                +12% desde el mes pasado
              </p>
            </CardContent>
          </Card>
        </div>
        
        {/* Badges de Prueba */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Badges y Estados</h2>
          <div className="flex flex-wrap gap-2">
            <Badge className="bg-primary/10 text-primary border-primary/20">
              Activo
            </Badge>
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
              En Stock
            </Badge>
            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
              <AlertCircle className="h-3 w-3 mr-1" />
              Bajo Stock
            </Badge>
            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
              Sin Stock
            </Badge>
            <Badge variant="destructive">
              Error
            </Badge>
            <Badge variant="secondary">
              Secundario
            </Badge>
          </div>
        </div>
        
        {/* Paleta de Colores */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-foreground mb-4">Paleta de Colores</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-2">
            <div className="space-y-1">
              <div className="h-12 bg-background border border-border rounded"></div>
              <p className="text-xs text-center">Background</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-card border border-border rounded"></div>
              <p className="text-xs text-center">Card</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-primary rounded"></div>
              <p className="text-xs text-center text-foreground">Primary</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-secondary rounded"></div>
              <p className="text-xs text-center">Secondary</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-muted rounded"></div>
              <p className="text-xs text-center">Muted</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-accent rounded"></div>
              <p className="text-xs text-center">Accent</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 bg-destructive rounded"></div>
              <p className="text-xs text-center text-white">Destructive</p>
            </div>
            <div className="space-y-1">
              <div className="h-12 border-2 border-border rounded"></div>
              <p className="text-xs text-center">Border</p>
            </div>
          </div>
        </div>
        
        {/* Colores Bee y Honey */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-4">Tema de Abejas</h2>
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Colores Bee</h3>
              <div className="grid grid-cols-5 gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="space-y-1">
                    <div 
                      className={`h-8 rounded bg-bee-${shade}`}
                      style={{ backgroundColor: `hsl(var(--bee-${shade}))` }}
                    ></div>
                    <p className="text-xs text-center">{shade}</p>
                  </div>
                ))}
              </div>
            </div>
            <div>
              <h3 className="text-lg font-medium text-foreground mb-2">Colores Honey</h3>
              <div className="grid grid-cols-5 gap-1">
                {[50, 100, 200, 300, 400, 500, 600, 700, 800, 900].map((shade) => (
                  <div key={shade} className="space-y-1">
                    <div 
                      className={`h-8 rounded bg-honey-${shade}`}
                      style={{ backgroundColor: `hsl(var(--honey-${shade}))` }}
                    ></div>
                    <p className="text-xs text-center">{shade}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TailwindTest;
