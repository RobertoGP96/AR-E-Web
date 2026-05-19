import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'AR-E Admin — Shein Shop Management',
    short_name: 'AR-E Admin',
    description:
      'Panel de administración: pedidos, productos, entregas, balance y analíticas.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    background_color: '#1c1c1f',
    theme_color: '#e8772e',
    icons: [
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'any',
      },
      {
        src: '/logo.svg',
        sizes: 'any',
        type: 'image/svg+xml',
        purpose: 'maskable',
      },
    ],
  };
}
