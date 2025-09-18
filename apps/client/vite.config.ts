
import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',
      rollupOptions: {
        output: {
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
