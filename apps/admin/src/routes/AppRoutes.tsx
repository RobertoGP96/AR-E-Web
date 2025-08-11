import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Shops from '@/pages/Shops';
import Products from '@/pages/Products';
import Purchases from '@/pages/Purchases';
import Packages from '@/pages/Packages';
import Delivery from '@/pages/Delivery';
import Orders from '@/pages/Orders';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import TailwindTest from '@/TailwindTest';
import LoginPage from '@/pages/LoginPage';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />
            <Route path="/test" element={<TailwindTest />} />

            {/* Rutas protegidas */}
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

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
