import { ExternalLink, Edit, Store, User } from 'lucide-react';
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
import { useState } from 'react';
import { Avatar } from '../ui/avatar';
import { AvatarFallback } from '@radix-ui/react-avatar';

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
    link: "https://adidas.com",
    is_active: true,
    created_at: "2024-01-01T10:00:00Z",
    updated_at: "2024-01-01T10:00:00Z",
    buying_accounts: [
      {
        id: 1,
        account_name: "Cuenta Adidas 1",
        created_at: "2024-01-01T10:00:00Z",
        updated_at: "2024-01-01T10:00:00Z"
      },
      {
        id: 2,
        account_name: "Cuenta Adidas 2",
        created_at: "2024-01-02T10:00:00Z",
        updated_at: "2024-01-02T10:00:00Z"
      }
    ]
  },
  {
    id: 2,
    name: "Nike",
    link: "https://nike.com",
    is_active: true,
    created_at: "2024-01-03T10:00:00Z",
    updated_at: "2024-01-03T10:00:00Z",
    buying_accounts: []
  },
  {
    id: 3,
    name: "Amazon",
    link: "https://amazon.com",
    is_active: true,
    created_at: "2024-01-04T10:00:00Z",
    updated_at: "2024-01-04T10:00:00Z",
    buying_accounts: []
  },
  {
    id: 4,
    name: "eBay",
    link: "https://ebay.com",
    is_active: true,
    created_at: "2024-01-05T10:00:00Z",
    updated_at: "2024-01-05T10:00:00Z",
    buying_accounts: []
  },
  {
    id: 5,
    name: "Shein",
    link: "https://shein.com",
    is_active: true,
    created_at: "2024-01-06T10:00:00Z",
    updated_at: "2024-01-06T10:00:00Z",
    buying_accounts: []
  }, {
    id: 6,
    name: "Temu",
    link: "https://temu.com",
    is_active: true,
    created_at: "2024-01-07T10:00:00Z",
    updated_at: "2024-01-07T10:00:00Z",
    buying_accounts: []
  }, {
    id: 7,
    name: "Aliexpress",
    link: "https://aliexpress.com",
    is_active: true,
    created_at: "2024-01-08T10:00:00Z",
    updated_at: "2024-01-08T10:00:00Z",
    buying_accounts: []
  }
];

export default function ShopsTable({
  shops = mockShops,
  onDelete,
  onShopUpdated,
  isLoading = false
}: ShopsTableProps) {

  const [selectedShop, setSelectedShop] = useState<Shop | null>(null);

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
    <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <article className=" overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <Table >
          <TableHeader className='bg-gray-100' >
            <TableRow className="">
              <TableHead className="">Tiendas Disponibles</TableHead>
              <TableHead className=""></TableHead>
              <TableHead className=""></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {shops.map((shop) => (
                <TableRow
                  key={shop.id}
                  className="cursor-pointer hover:bg-gray-100 group"
                  onClick={() => setSelectedShop(shop)}
                >
                <TableCell className="py-4 px-6">
                  <div className='flex flex-row gap-4'>
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
                    <div className="flex flex-col gap-2">
                      <span className="font-semibold text-gray-700 text-base">{shop.name}</span>
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
                  </div>

                </TableCell>
                <TableCell className="p-4 ">
                  <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="font-semibold text-gray-700">{shop.buying_accounts?.length || 0}</span>
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
                          className="h-9 w-9 flex items-center justify-center border border-blue-100 bg-white shadow-sm transition-all duration-200 opacity-0 group-hover:opacity-100"
                          aria-label="Editar"
                        >
                          <Edit className="h-5 w-5" />
                        </Button>
                      }
                    />
                    <Button
                      variant="ghost"
                      className="h-9 w-9 flex items-center justify-center border border-red-100 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200 opacity-0 group-hover:opacity-100"
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
      </article>
      <article className=" overflow-x-auto rounded-lg border border-muted bg-background shadow">
        <Table >
          <TableHeader className='bg-gray-100' >
            <TableRow className="">
              <TableHead className="">Cuentas</TableHead>
              <TableHead className=""></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {
              (!selectedShop?.buying_accounts || selectedShop.buying_accounts.length === 0) && (
                <TableRow>
                  <TableCell colSpan={2} className="text-center py-4">
                    No hay cuentas disponibles
                  </TableCell>
                </TableRow>
              )
            }
            {selectedShop?.buying_accounts?.map((account) => (
              <TableRow
                key={account.id}
                className=""
              >
                <TableCell className="py-4 px-6">
                  <div className='flex flex-row justify-start items-center gap-4'>
                    <Avatar className={"h-7 w-7 flex items-center justify-center"}>
                      <AvatarFallback>
                        <User />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-gray-700 text-base">{account.account_name}</span>
                  </div>

                </TableCell>



                <TableCell className="p-4 ">
                  <div className="flex justify-start gap-2">
                    <Button
                      variant="ghost"
                      className="h-9 w-9 flex items-center justify-center  border border-red-100 bg-white shadow-sm hover:bg-red-50 hover:text-red-600 transition-all duration-200"
                      aria-label="Eliminar"
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
      </article>
    </section>
  );
}
