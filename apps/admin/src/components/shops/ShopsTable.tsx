import { ExternalLink, Edit, Store } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import ShopFormPopover from './form/ShopFormPopover';
import type { Shop } from '@/types/models/shop';

// Importar logos
import adidasLogo from '@/assets/stores/adidas.svg';
import aliexpressLogo from '@/assets/stores/aliexpress.svg';
import amazonLogo from '@/assets/stores/amazon.svg';
import ebayLogo from '@/assets/stores/ebay.svg';
import nikeLogo from '@/assets/stores/nike.svg';
import sheinLogo from '@/assets/stores/shein.svg';
import temuLogo from '@/assets/stores/temu.svg';
import wallmartLogo from '@/assets/stores/wallmart.svg';
import { Badge } from '../ui/badge';

interface ShopsTableProps {
  shops?: Shop[];
  onDelete?: (shop: Shop) => void;
  onShopUpdated?: (shop: Shop) => void;
  isLoading?: boolean;
}

// Función para obtener el logo basado en el nombre de la tienda
const getShopLogo = (shopName: string): string => {
  const name = shopName.toLowerCase();

  if (name.includes('adidas')) return adidasLogo;
  if (name.includes('aliexpress')) return aliexpressLogo;
  if (name.includes('amazon')) return amazonLogo;
  if (name.includes('ebay')) return ebayLogo;
  if (name.includes('nike')) return nikeLogo;
  if (name.includes('shein')) return sheinLogo;
  if (name.includes('temu')) return temuLogo;
  if (name.includes('walmart') || name.includes('wallmart')) return wallmartLogo;

  // Logo por defecto si no coincide con ninguno
  return amazonLogo;
};

const mockShops: Shop[] = [
  {
    id: 1,
    name: "Adidas",
    link: "https://adidas.com"
  },
  {
    id: 2,
    name: "Nike",
    link: "https://nike.com"
  },
  {
    id: 3,
    name: "Amazon",
    link: "https://amazon.com"
  },
  {
    id: 4,
    name: "eBay",
    link: "https://ebay.com"
  },
  {
    id: 5,
    name: "Shein",
    link: "https://shein.com"
  }, {
    id: 6,
    name: "Temu",
    link: "https://temu.com"
  }, {
    id: 7,
    name: "Aliexpress",
    link: "https://aliexpress.com"
  }
];

export default function ShopsTable({
  shops = mockShops,
  onDelete,
  onShopUpdated,
  isLoading = false
}: ShopsTableProps) {
  if (isLoading) {
    return (
      <Card className="rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-gray-200 rounded w-1/4"></div>
            <div className="space-y-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-gray-100 rounded"></div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!shops || shops.length === 0) {
    return (
      <Card className="rounded-2xl shadow-lg border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
        <CardContent className="p-12 text-center">
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center">
              <Store className="w-8 h-8 text-gray-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No hay tiendas</h3>
              <p className="text-gray-500">Aún no se han agregado tiendas a la plataforma.</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-1/2 overflow-x-auto rounded-lg border border-muted bg-background shadow">
      <Table >
        <TableHeader className='bg-gray-100' >
          <TableRow className="">
            <TableHead className="text-center">#</TableHead>
            <TableHead className="">Logo</TableHead>
            <TableHead className="">ID</TableHead>
            <TableHead className="">Nombre</TableHead>
            <TableHead className="">Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {shops.map((shop, index) => (
            <TableRow
              key={shop.id}
              className=""
            >
              <TableCell className="py-4 px-3 text-center w-16">
                <span className="inline-flex items-center justify-center w-8 h-8 text-gray-700 text-sm font-medium">
                  {index + 1}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex items-center justify-center w-15 h-15 rounded-xl bg-gradient-to-br from-white to-gray-50 shadow-sm border border-gray-100 overflow-hidden group-hover:shadow-md transition-shadow duration-200">
                  <img
                    src={getShopLogo(shop.name)}
                    alt={`${shop.name} logo`}
                    className="w-18 h-18 object-contain filter drop-shadow-sm"
                    onError={(e) => {
                      // Fallback a un ícono si la imagen falla
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
                  />
                  <Store className="w-6 h-6 text-gray-400 hidden" />
                </div>
              </TableCell>
              <TableCell className="py-4 px-6">
                <span className="inline-flex text-gray-600 items-center justify-center w-8 h-8 font-semibold">
                  {"#" + shop.id}
                </span>
              </TableCell>
              <TableCell className="py-4 px-6">
                <div className="flex flex-row gap-2">
                  <span className="font-semibold text-gray-900 text-base">{shop.name}</span>
                  <div>
                    <Badge variant="outline">

                      <a
                        href={shop.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-sm  rounded-lg bg-gradient-to-r "
                      >
                        <ExternalLink className="h-4 w-4" />

                      </a>
                    </Badge>
                  </div>
                </div>
              </TableCell>


              <TableCell className="p-4 ">
                <div className="flex justify-start gap-2">
                  <ShopFormPopover
                    shop={shop}
                    mode="edit"
                    onSuccess={onShopUpdated}
                    trigger={
                      <Button
                        variant="secondary"
                        className="h-9 w-9 flex items-center justify-center  border border-blue-100 bg-white shadow-sm transition-all duration-200"
                        aria-label="Editar"
                      >
                        <Edit className="h-5 w-5" />
                      </Button>
                    }
                  />
                  <Button
                    variant="ghost"
                    className="h-9 w-9 flex items-center justify-center  border border-red-100 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                    aria-label="Eliminar"
                    onClick={() => onDelete?.(shop)}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </Button>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
