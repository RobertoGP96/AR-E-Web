import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { lazy, Suspense } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { AuthProvider } from '@/context/AuthContext';
import { ApiRedirectProvider } from '@/components/utils/ApiRedirectProvider';
import { AppRoutes } from '@/routes';
import ErrorBoundary from '@/components/error-boundary';

const ReactQueryDevtools = lazy(() =>
  import('@tanstack/react-query-devtools').then((m) => ({
    default: m.ReactQueryDevtools,
  }))
);

// Crear instancia del cliente de React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutos
      gcTime: 2 * 60 * 1000, // 2 minutos (cacheTime en versiones anteriores)
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function App() {
  return (
    <div className="w-full h-full bg-background text-foreground">
      <QueryClientProvider client={queryClient}>
        <ErrorBoundary>
          <AuthProvider>
            <Router>
              <ApiRedirectProvider>
                <AppRoutes />
              </ApiRedirectProvider>
            </Router>
          </AuthProvider>
        </ErrorBoundary>
        {import.meta.env.DEV && (
          <Suspense fallback={null}>
            <ReactQueryDevtools initialIsOpen={false} />
          </Suspense>
        )}
        <Toaster />
      </QueryClientProvider>
    </div>
  );
}

export default App;