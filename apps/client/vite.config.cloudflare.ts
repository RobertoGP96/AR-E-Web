import { defineConfig } from 'vite'
import path from "path"
import tailwindcss from "@tailwindcss/vite"
import react from '@vitejs/plugin-react'

// Configuración específica para Cloudflare Pages
export default defineConfig(() => {
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
      target: 'es2020'
    },
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: true,
      rollupOptions: {
        output: {
          entryFileNames: 'assets/[name]-[hash].js',
          chunkFileNames: 'assets/[name]-[hash].js',
          assetFileNames: 'assets/[name]-[hash].[ext]',
        }
      },
      chunkSizeWarningLimit: 1000,
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
    // Para Cloudflare Pages no necesitamos basename
    base: '/',
    define: {
      'process.env.NODE_ENV': '"production"'
    }
  }
})