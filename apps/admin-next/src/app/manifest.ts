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
    // Icons carry their own near-black background: the bee logo is
    // orange-on-transparent and vanishes on dark launchers/tab strips.
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
