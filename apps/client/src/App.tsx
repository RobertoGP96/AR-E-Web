import AuthProvider from "./context/AuthContext"
import AppRoutes from "./routes/Routes"
import { Toaster } from "./components/ui/sonner"
import { QueryClientProvider } from "@tanstack/react-query"
import { queryClient } from "./lib/query-client"

function App() {
  return (
    <div className="relative w-full overflow-x-hidden">
      {/* Elementos decorativos de fondo */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80 pointer-events-none"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] max-w-none -translate-x-1/2 rotate-30 bg-gradient-to-tr from-[#dd6540] to-[#ca9b0d] opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"
        />
      </div>

      {/* Contenido principal */}
      <main className="relative z-0 min-h-screen">

        <AuthProvider>
          <QueryClientProvider client={queryClient}>
            <AppRoutes />
          </QueryClientProvider>
        </AuthProvider>
      </main>

      {/* Toaster para notificaciones */}
      <Toaster 
        richColors 
        position="top-right"
        expand={true}
        visibleToasts={5}
      />

      {/* Elemento decorativo inferior */}
      <div
        aria-hidden="true"
        className="fixed inset-x-0 bottom-0 -z-10 transform-gpu overflow-hidden blur-3xl pointer-events-none"
      >
        <div
          style={{
            clipPath:
              'polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%)',
          }}
          className="relative left-[calc(50%+3rem)] aspect-[1155/674] w-[36.125rem] max-w-none -translate-x-1/2 bg-gradient-to-tr from-[#fab834] to-[#885b00] opacity-30 sm:left-[calc(50%+36rem)] sm:w-[72.1875rem]"
        />
      </div>
    </div>
  )
}

export default App
