import react from "@vitejs/plugin-react-swc";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { defineConfig } from "vite";

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
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
      sourcemap: mode === 'development',
      minify: 'terser',
      rollupOptions: {
        output: {
          manualChunks: {
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
            ]
          }
        }
      },
      chunkSizeWarningLimit: 1000,
      cssCodeSplit: true,
    },
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
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
    }
  }
});
