import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Package, TrendingUp } from 'lucide-react';

const StyleTest = () => {
  return (
    <div className="p-6 space-y-6 bg-background text-foreground">
      <h1 className="text-2xl font-bold text-primary">Prueba de Estilos</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-card-foreground">Card de Prueba</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">Este es un texto de prueba para verificar los colores.</p>
            <div className="flex gap-2 mt-4">
              <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                Botón Primario
              </Button>
              <Button variant="outline" className="border-border hover:bg-accent">
                Botón Outline
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <Card className="border-border bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">
              Estadística de Prueba
            </CardTitle>
            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
              <Package className="h-4 w-4 text-primary" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">100</div>
            <p className="text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 inline mr-1" />
              +12% desde el mes pasado
            </p>
            <div className="flex gap-2 mt-3">
              <Badge className="bg-primary/10 text-primary border-primary/20">
                Activo
              </Badge>
              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                En Stock
              </Badge>
              <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                Sin Stock
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <div className="space-y-2">
        <h3 className="font-semibold">Colores de Variables CSS:</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
          <div className="p-2 bg-primary text-primary-foreground rounded">Primary</div>
          <div className="p-2 bg-secondary text-secondary-foreground rounded">Secondary</div>
          <div className="p-2 bg-muted text-muted-foreground rounded">Muted</div>
          <div className="p-2 bg-accent text-accent-foreground rounded">Accent</div>
          <div className="p-2 bg-destructive text-destructive-foreground rounded">Destructive</div>
          <div className="p-2 bg-bee-500 text-white rounded">Bee 500</div>
          <div className="p-2 bg-honey-500 text-white rounded">Honey 500</div>
          <div className="p-2 border border-border text-foreground rounded">Border</div>
        </div>
      </div>
    </div>
  );
};

export default StyleTest;
