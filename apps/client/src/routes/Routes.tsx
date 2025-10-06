import LogIn from '@/components/auth/login';
import Home from '@/components/home/home';
import MainLayout from '@/components/layout/main-layout';
import Contact from '@/pages/contact';
import { Routes, Route } from 'react-router';
import Register from '@/components/auth/register';
import About from '@/pages/about';
import Profile from '@/pages/profile';
import Pricing from '@/pages/pricing';
import Stores from '@/pages/stores';
import UserOrders from '@/pages/user-orders';
import { ProductList } from '@/components/product';


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
                <Route path="product-list" element={<ProductList/>} />
            </Route>
        </Routes>
    );
};

export default AppRoutes;
