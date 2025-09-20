

import {
    Carousel,
    CarouselContent,
    CarouselItem,

} from "@/components/ui/carousel"
import { storeList } from "@/utils/stores";
import AutoScroll from 'embla-carousel-auto-scroll'




export const CarouselStores = () => {

    // Función para obtener el logo basado en el nombre de la tienda
    const getShopLogo = (shopName: string): string => {
        // Mapeo de nombres especiales para coincidencia exacta con los archivos
       
        const name = shopName.toLowerCase();
        // Si el nombre está en el mapeo, usar el valor mapeado
        const fileName =  name;
        return `/assets/stores/${fileName}.svg`;
    }
    // Asegúrate de que las imágenes estén en la carpeta pública
    return (
        <Carousel
            opts={{
                align: "start",
                loop: true,
            }}
            plugins={[
                AutoScroll({ playOnInit: true }),
            ]}

            className="w-full"
        >
            <CarouselContent className="w-full">
                {storeList.map((store, index) => (
                    <CarouselItem key={index} className="basis-1/3 md:basis-1/5 lg:basis-1/10 border-0">
                        <div className="p-2 flex items-center justify-center w-30 h-30 border-0 overflow-hidden">
                            <img
                                src={getShopLogo(store.name)}
                                alt={`${store.name} logo`}
                                className="w-full h-auto object-contain"
                                onError={(e) => {
                                    console.error(`Error loading image for ${store.name}:`, getShopLogo(store.name));
                                    e.currentTarget.style.display = 'none';
                                }}
                                onLoad={() => {
                                    console.log(`Successfully loaded image for ${store.name}`);
                                }}
                            />
                        </div>
                    </CarouselItem>
                ))}
            </CarouselContent>
        </Carousel>
    )
}
