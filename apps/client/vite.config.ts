import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';
  
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: !isProduction, // Solo en desarrollo
      minify: isProduction ? 'terser' as const : false,
      target: 'es2020', // Mejor compatibilidad para Cloudflare
      terserOptions: isProduction ? {
        compress: {
          drop_console: true,
          drop_debugger: true,
        },
        mangle: {
          safari10: true,
        },
        format: {
          comments: false,
        },
      } : undefined,
      rollupOptions: {
        output: {
          manualChunks: {
            // Chunks optimizados para Cloudflare
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            query: ['@tanstack/react-query'],
            forms: ['react-hook-form', 'zod', '@hookform/resolvers'],
            ui: [
              '@radix-ui/react-dialog', 
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-avatar',
              '@radix-ui/react-checkbox',
              '@radix-ui/react-label',
              '@radix-ui/react-popover',
              '@radix-ui/react-scroll-area',
              '@radix-ui/react-separator',
              '@radix-ui/react-tooltip'
            ],
            utils: ['axios', 'clsx', 'tailwind-merge', 'class-variance-authority'],
            icons: ['lucide-react']
          },
          // Optimización para Cloudflare CDN
          entryFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          chunkFileNames: isProduction ? 'assets/[name]-[hash].js' : 'assets/[name].js',
          assetFileNames: isProduction ? 'assets/[name]-[hash].[ext]' : 'assets/[name].[ext]'
        }
      },
      chunkSizeWarningLimit: 800, // Reducido para mejor performance en Cloudflare
      cssCodeSplit: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router',
        '@tanstack/react-query',
        'axios',
        'lucide-react',
        'react-hook-form',
        'zod'
      ]
    },
    server: {
      port: 5174,
      host: true,
      strictPort: true,
    },
    preview: {
      port: 4174,
      host: true,
    },
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    },
    // Configuración específica para Cloudflare Pages
    esbuild: isProduction ? {
      legalComments: 'none' as const,
      minifyIdentifiers: true,
      minifySyntax: true,
      minifyWhitespace: true
    } : undefined
  }
})
