import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Shops from './pages/Shops';
import Products from './pages/Products';
import Purchases from './pages/Purchases';
import Packages from './pages/Packages';
import Delivery from './pages/Delivery';
import Orders from './pages/Orders';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import TailwindTest from './TailwindTest';

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
        <Router>
          <Routes>
            <Route path="/test" element={<TailwindTest />} />
            <Route path="/" element={<MainLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="shops" element={<Shops />} />
              <Route path="products" element={<Products />} />
              <Route path="purchases" element={<Purchases />} />
              <Route path="packages" element={<Packages />} />
              <Route path="delivery" element={<Delivery />} />
              <Route path="orders" element={<Orders />} />
              <Route path="settings" element={<Settings />} />
              <Route path="profile" element={<Profile />} />
            </Route>
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </div>
  );
}

export default App;