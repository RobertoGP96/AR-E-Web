import { lazy } from 'react';
import { Routes, Route } from 'react-router-dom';

// Eager imports — must load immediately
import LogIn from '@/components/auth/login';
import MainLayout from '@/components/layout/main-layout';
import NotFound from '@/pages/not-found';
import Home from '@/components/home/home';

// Lazy imports — code-split per route
const Register = lazy(() => import('@/components/auth/register'));
const About = lazy(() => import('@/pages/about'));
const Contact = lazy(() => import('@/pages/contact'));
const Pricing = lazy(() => import('@/pages/pricing'));
const Stores = lazy(() => import('@/pages/stores'));
const Profile = lazy(() => import('@/pages/profile'));
const UserOrders = lazy(() => import('@/pages/user-orders'));
const UserDeliveries = lazy(() => import('@/pages/user-deliveries'));
const ProductList = lazy(() =>
    import('@/components/product').then((m) => ({ default: m.ProductList }))
);
const OrderDetailPage = lazy(() => import('@/pages/order-detail'));

const AppRoutes = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LogIn />} />

            {/* Rutas protegidas — Suspense está en MainLayout envolviendo Outlet */}
            <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="register" element={<Register />} />
                <Route path="home" element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="stores" element={<Stores />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="contact" element={<Contact />} />
                <Route path="profile" element={<Profile />} />
                <Route path="user_orders" element={<UserOrders />} />
                <Route path="user_deliveries" element={<UserDeliveries />} />
                <Route path="product-list" element={<ProductList />} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Ruta 404 - Debe ir al final */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
