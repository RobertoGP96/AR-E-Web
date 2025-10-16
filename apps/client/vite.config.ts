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
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      // Mejora para resolver módulos más robustamente
      dedupe: ['react', 'react-dom'],
    },
    esbuild: {
      // Configuración específica para esbuild que puede ayudar con TypeScript
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      // Asegurar compatibilidad con TypeScript en builds
      target: 'es2020'
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
      } : undefined, // Cambiar a esbuild en lugar de terser para Vercel
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router'],
            query: ['@tanstack/react-query'],
            ui: [
              '@radix-ui/react-dialog', 
              '@radix-ui/react-dropdown-menu',
              '@radix-ui/react-select',
              '@radix-ui/react-avatar',
              '@radix-ui/react-popover'
            ]
          }
        }
      },
      // Optimizaciones adicionales
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      // Asegurar que TypeScript compile correctamente
      emptyOutDir: true,
      
      // Asegurar que todos los archivos vayan a dist
      copyPublicDir: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router',
        '@tanstack/react-query',
        'axios',
        'lucide-react'
      ]
    },
    server: {
      port: 5173,
      host: true,
      strictPort: true,
    },
    preview: {
      port: 4173,
      host: true,
    },
    base: '/',
    // Variables de entorno que serán expuestas al cliente
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
})
