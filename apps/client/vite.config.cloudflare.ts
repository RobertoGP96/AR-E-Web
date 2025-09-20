import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// Configuración específica para Cloudflare Pages
export default defineConfig(({ mode }) => {
  return {
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
      dedupe: ['react', 'react-dom'],
    },
    esbuild: {
      logOverride: { 'this-is-undefined-in-esm': 'silent' },
      target: 'es2020'
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: mode === 'development',
      minify: 'terser',
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
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
      emptyOutDir: true,
      target: 'es2020',
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
    // Para Cloudflare Pages no necesitamos basename
    base: '/',
    define: {
      __APP_VERSION__: JSON.stringify(process.env.npm_package_version)
    }
  }
})