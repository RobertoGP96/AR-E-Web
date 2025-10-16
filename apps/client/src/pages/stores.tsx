import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Separator } from '../components/ui/separator';
import { Button } from '../components/ui/button';

// Token de la API de logo.dev
const LOGO_DEV_TOKEN = 'pk_Yp6dorDSS8q1eSnYi7HhNA';

// Función para generar URL del logo usando logo.dev o imágenes locales
const getLogoUrl = (website: string, storeName: string): string => {
  // Usar imagen local para Vans
  if (storeName.toLowerCase() === 'vans') {
    return '/assets/stores/vans-og.svg';
  }
  
  return `https://img.logo.dev/${website}?token=${LOGO_DEV_TOKEN}&retina=true`;
};

// Interfaz para las tiendas
interface Store {
  name: string;
  description: string;
  category: string;
  website: string;
  specialties: string[];
}

const Stores: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    setIsVisible(true)
  }, [])

  // Tiendas principales/populares
  const popularStores: Store[] = [
    {
      name: "Amazon",
      description: "La tienda online más grande del mundo con millones de productos, desde electrónicos hasta artículos para el hogar.",
      category: "Marketplace General",
      website: "amazon.com",
      specialties: ["Electrónicos", "Libros", "Hogar", "Ropa"]
    },
    {
      name: "eBay",
      description: "Plataforma de subastas y ventas donde puedes encontrar productos nuevos, usados y vintage de todo el mundo.",
      category: "Subastas y Marketplace",
      website: "ebay.com",
      specialties: ["Subastas", "Coleccionables", "Vintage", "Electrónicos", "Autos"]
    },
    {
      name: "AliExpress",
      description: "Plataforma china con productos a precios muy competitivos, ideal para compras al por mayor y productos únicos.",
      category: "Marketplace Internacional",
      website: "aliexpress.com",
      specialties: ["Electrónicos", "Gadgets", "Ropa", "Hogar", "Accesorios"]
    },
    {
      name: "SHEIN",
      description: "Tienda de moda rápida con las últimas tendencias en ropa, accesorios y artículos para el hogar a precios accesibles.",
      category: "Moda Rápida",
      website: "shein.com",
      specialties: ["Moda Mujer", "Accesorios", "Hogar", "Belleza", "Tendencias"]
    },
    {
      name: "Temu",
      description: "Marketplace con una amplia variedad de productos a precios muy competitivos, desde tecnología hasta artículos para el hogar.",
      category: "Marketplace Diverso",
      website: "temu.com",
      specialties: ["Electrónicos", "Hogar", "Herramientas", "Deportes", "Mascotas"]
    },
    {
      name: "Newegg",
      description: "Especialista en tecnología y componentes de computadora, ideal para gamers y entusiastas de la tecnología.",
      category: "Tecnología Especializada",
      website: "newegg.com",
      specialties: ["PC Gaming", "Componentes", "Laptops", "Periféricos", "Software"]
    },
    {
      name: "Best Buy",
      description: "Cadena líder en electrónicos y tecnología con una amplia gama de productos desde smartphones hasta electrodomésticos.",
      category: "Electrónicos y Tecnología",
      website: "bestbuy.com",
      specialties: ["Electrónicos", "Smartphones", "Computadoras", "Gaming", "Electrodomésticos"]
    },
    {
      name: "Costco",
      description: "Club de membresía que ofrece productos de calidad a precios al por mayor en una amplia variedad de categorías.",
      category: "Club de Membresía",
      website: "costco.com",
      specialties: ["Mayoreo", "Comestibles", "Electrónicos", "Hogar", "Farmacia"]
    },
    {
      name: "Target",
      description: "Tienda departamental moderna que combina estilo, calidad y precios accesibles en moda, hogar y más.",
      category: "Tienda Departamental",
      website: "target.com",
      specialties: ["Moda", "Hogar", "Belleza", "Niños", "Comestibles"]
    },
    {
      name: "The Home Depot",
      description: "La cadena más grande de mejoras para el hogar, ofreciendo herramientas, materiales y servicios de construcción.",
      category: "Mejoras para el Hogar",
      website: "homedepot.com",
      specialties: ["Herramientas", "Construcción", "Jardín", "Pintura", "Servicios"]
    },
    {
      name: "Etsy",
      description: "Marketplace global para productos únicos, hechos a mano, vintage y suministros creativos de vendedores independientes.",
      category: "Marketplace Artesanal",
      website: "etsy.com",
      specialties: ["Hecho a Mano", "Vintage", "Arte", "Joyería", "Personalizado"]
    },
    {
      name: "Walmart",
      description: "La cadena de supermercados más grande del mundo, ofreciendo productos de uso diario a precios bajos.",
      category: "Supermercado Global",
      website: "walmart.com",
      specialties: ["Comestibles", "Electrónicos", "Ropa", "Hogar", "Farmacia"]
    }
  ];

  // Tiendas de marcas de lujo
  const luxuryStores: Store[] = [
    {
      name: "Adidas",
      description: "Marca alemana líder en ropa deportiva, calzado y accesorios para atletas y entusiastas del deporte.",
      category: "Deportiva Premium",
      website: "adidas.com",
      specialties: ["Zapatillas", "Ropa Deportiva", "Fútbol", "Running", "Lifestyle"]
    },
    {
      name: "Nike",
      description: "La marca deportiva más reconocida mundialmente, sinónimo de innovación y rendimiento atlético.",
      category: "Deportiva Premium",
      website: "nike.com",
      specialties: ["Air Jordan", "Running", "Basketball", "Lifestyle", "Innovación"]
    },
    {
      name: "Puma",
      description: "Marca deportiva alemana conocida por su innovación en calzado deportivo y ropa atlética de alto rendimiento.",
      category: "Deportiva Premium",
      website: "puma.com",
      specialties: ["Zapatillas", "Fútbol", "Running", "Motorsport", "Lifestyle"]
    },
    {
      name: "Vans",
      description: "Marca icónica de calzado y ropa asociada con la cultura del skateboarding, surf y estilo de vida alternativo.",
      category: "Streetwear Premium",
      website: "vans.com",
      specialties: ["Skateboarding", "Zapatillas", "Streetwear", "Surf", "Cultura Urbana"]
    },
    {
      name: "Louis Vuitton",
      description: "Casa de moda francesa de ultra lujo, reconocida por sus icónicos bolsos, maletas y accesorios de piel.",
      category: "Lujo Francés",
      website: "louisvuitton.com",
      specialties: ["Bolsos de Lujo", "Maletas", "Relojería", "Joyería", "Alta Costura"]
    },
    {
      name: "H&M",
      description: "Cadena sueca de moda rápida que ofrece ropa trendy y accesible con colaboraciones de diseñadores reconocidos.",
      category: "Moda Accesible",
      website: "hm.com",
      specialties: ["Moda Rápida", "Tendencias", "Colaboraciones", "Accesorio"]
    },
    {
      name: "Forever 21",
      description: "Marca de moda rápida estadounidense enfocada en tendencias juveniles y estilos urbanos a precios accesibles.",
      category: "Moda Juvenil",
      website: "forever21.com",
      specialties: ["Moda Juvenil", "Tendencias", "Streetwear", "Accesorios", "Plus Size"]
    },
    {
      name: "Ralph Lauren",
      description: "Marca estadounidense de lujo que define el estilo americano clásico con elegancia y sofisticación atemporal.",
      category: "Lujo Americano",
      website: "ralphlauren.com",
      specialties: ["Polo", "Trajes", "Hogar", "Fragancias", "Estilo Clásico"]
    },
    {
      name: "Chanel",
      description: "Casa de alta costura francesa icónica, sinónimo de elegancia y lujo atemporal en moda, fragancias y accesorios.",
      category: "Alta Costura",
      website: "chanel.com",
      specialties: ["Alta Costura", "Bolsos", "Fragancias", "Joyería", "Relojería"]
    },
    {
      name: "Zara",
      description: "Marca española de moda rápida que ofrece las últimas tendencias con calidad y estilo europeo.",
      category: "Moda Contemporánea",
      website: "zara.com",
      specialties: ["Moda Mujer", "Moda Hombre", "Niños", "Hogar", "Tendencias"]
    },
    {
      name: "John Lewis",
      description: "Prestigiosa cadena departamental británica conocida por su excelente servicio al cliente y productos de calidad.",
      category: "Departamental Premium",
      website: "johnlewis.com",
      specialties: ["Hogar", "Moda", "Tecnología", "Belleza", "Servicio Premium"]
    },
    {
      name: "Gucci",
      description: "Casa de moda italiana de lujo conocida por su diseño innovador y craftmanship excepcional.",
      category: "Lujo Italiano",
      website: "gucci.com",
      specialties: ["Alta Moda", "Bolsos", "Calzado", "Fragancias", "Joyería"]
    }
  ];

  const StoreCard: React.FC<{ store: Store; index: number }> = ({ store, index }) => (
    <Card className={`h-full hover:shadow-lg transition-all gap-3 duration-300 hover:scale-105 border-border/50 bg-black/10 ${
      isVisible 
        ? 'opacity-100 transform translate-y-0' 
        : 'opacity-0 transform translate-y-8'
    }`} style={{ transitionDelay: `${index * 100}ms` }}>
      <CardHeader className="pb-4">
        <div className="flex items-center gap-4 mb-3">
          <div className="w-16 h-16 rounded-xl bg-background/50 flex items-center justify-center border border-border/30 shadow-sm">
            <img 
              src={getLogoUrl(store.website, store.name)} 
              alt={`${store.name} logo`}
              className="w-16 h-16 object-contain rounded-xl"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(store.name)}&background=f97316&color=000&size=48&bold=true`;
              }}
            />
          </div>
          <div className="flex-1">
            <CardTitle className="text-xl font-bold text-foreground mb-1">{store.name}</CardTitle>
            <Badge variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
              {store.category}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <CardDescription className="text-muted-foreground mb-4 leading-relaxed">
          {store.description}
        </CardDescription>
        
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground mb-2">Especialidades:</p>
            <div className="flex flex-wrap gap-1.5">
              {store.specialties.map((specialty, index) => (
                <Badge 
                  key={index} 
                  variant="outline" 
                  className="text-xs bg-accent/5  border-accent/20 hover:bg-accent/10"
                >
                  {specialty}
                </Badge>
              ))}
            </div>
          </div>
          
          <div className="pt-2 border-t border-border/30">
            
            
            <Button 
              onClick={() => window.open(`https://${store.website}`, '_blank')}
              className="w-full cursor-pointer bg-primary hover:bg-primary/90 text-primary-foreground font-medium transition-all duration-200 hover:scale-105"
            >
              Visitar {store.name}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="min-h-screen animate-fade-in">
      {/* Header */}
      <div className="relative">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center mb-12">
            <h1 className={`text-4xl md:text-5xl font-bold mb-4 transition-all duration-1000 ${
              isVisible 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
            }`}>
              Directorio de Tiendas
            </h1>
            <p className={`text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed transition-all duration-1000 delay-300 ${
              isVisible 
                ? 'opacity-100 transform translate-y-0' 
                : 'opacity-0 transform translate-y-8'
            }`}>
              Descubre las mejores tiendas online del mundo, desde marketplaces populares hasta marcas de lujo exclusivas
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pb-16">
        {/* Tiendas Populares */}
        <section className="mb-16">
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
              <div className="w-1 h-8 bg-primary rounded-full"></div>
              Tiendas Populares
            </h2>
            <p className="text-muted-foreground text-lg">
              Las plataformas de comercio electrónico más utilizadas a nivel mundial
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {popularStores.map((store, index) => (
              <StoreCard key={index} store={store} index={index} />
            ))}
          </div>
        </section>

        {/* Separador */}
        <div className="flex items-center justify-center mb-16">
          <Separator className="flex-1 bg-border/30" />
          <div className="px-6">
            <div className="w-3 h-3 rounded-full bg-primary/30"></div>
          </div>
          <Separator className="flex-1 bg-border/30" />
        </div>

        {/* Marcas de Lujo */}
        <section>
          <div className="mb-8">
            <h2 className="text-3xl font-bold text-foreground mb-3 flex items-center gap-3">
              <div className="w-1 h-8 bg-gradient-to-b from-primary to-accent rounded-full"></div>
              Marcas de Lujo
            </h2>
            <p className="text-muted-foreground text-lg">
              Las marcas más prestigiosas y exclusivas del mundo de la moda y el lujo
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {luxuryStores.map((store, index) => (
              <StoreCard key={index} store={store} index={index + popularStores.length} />
            ))}
          </div>
        </section>

        
      </div>
    </div>
  );
};

export default Stores;
