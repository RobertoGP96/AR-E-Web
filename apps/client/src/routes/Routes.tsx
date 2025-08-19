import LogIn from '@/components/auth/login';
import Home from '@/components/home/home';
import MainLayout from '@/components/layout/main-layout';
import Pricing from '@/components/about/price/Pricing';
import Contact from '@/pages/contact';
import { Routes, Route } from 'react-router';


const AppRoutes = () => {
    return (
            <Routes>
                {/* Rutas públicas */}
                <Route path="/login" element={<LogIn />}/>

                {/* Rutas protegidas */}
                <Route path="/" element={<MainLayout />}>
                    <Route index element={<Home />} />
                    <Route path="pricing" element={<Pricing />} />
                    <Route path="contact" element={<Contact />} />
                </Route>
            </Routes>
    );
};

export default AppRoutes;
