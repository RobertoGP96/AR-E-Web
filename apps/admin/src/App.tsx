import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ApiRedirectProvider } from '@/components/utils/ApiRedirectProvider';
import { AppRoutes } from '@/routes';

// Crear instancia del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutos
      gcTime: 10 * 60 * 1000, // 10 minutos (cacheTime en versiones anteriores)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <div className="w-full h-full bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Router>
            <ApiRedirectProvider>
              <AppRoutes />
            </ApiRedirectProvider>
          </Router>
        </AuthProvider>
        <ReactQueryDevtools initialIsOpen={false} />
        <Toaster />
      </QueryClientProvider>
    </div>
  );
}

export default App;