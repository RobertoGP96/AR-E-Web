import LogIn from '@/components/auth/login';
import Home from '@/components/home/home';
import MainLayout from '@/components/layout/main-layout';
import Contact from '@/pages/contact';
import { Routes, Route } from 'react-router-dom';
import Register from '@/components/auth/register';
import About from '@/pages/about';
import Profile from '@/pages/profile';
import Pricing from '@/pages/pricing';
import Stores from '@/pages/stores';
import UserOrders from '@/pages/user-orders';
import UserDeliveries from '@/pages/user-deliveries';
import { ProductList } from '@/components/product';
import OrderDetailPage from '@/pages/order-detail';
import NotFound from '@/pages/not-found';


const AppRoutes = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LogIn />} />

            {/* Rutas protegidas */}
            <Route path="/" element={<MainLayout />}>
                <Route index element={<Home />} />
                <Route path="register" element={<Register />} />
                <Route path='home' element={<Home />} />
                <Route path="about" element={<About />} />
                <Route path="stores" element={<Stores />} />
                <Route path="pricing" element={<Pricing />} />
                <Route path="contact" element={<Contact />} />
                <Route path="profile" element={<Profile/>} />
                <Route path="user_orders" element={<UserOrders/>} />
                <Route path="user_deliveries" element={<UserDeliveries/>} />
                <Route path="product-list" element={<ProductList/>} />
                <Route path="orders/:id" element={<OrderDetailPage />} />
            </Route>

            {/* Ruta 404 - Debe ir al final */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
