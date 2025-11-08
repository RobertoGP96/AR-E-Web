import { Routes, Route } from 'react-router-dom';
import MainLayout from '@/layouts/MainLayout';
import Dashboard from '@/pages/Dashboard';
import Users from '@/pages/Users';
import Shops from '@/pages/Shops';
import Products from '@/pages/Products';
import Purchases from '@/pages/Purchases';
import Packages from '@/pages/Packages';
import Delivery from '@/pages/Delivery';
import DeliveryDetail from '@/pages/DeliveryDetail';
import Orders from '@/pages/Orders';
import Settings from '@/pages/Settings';
import Profile from '@/pages/Profile';
import NotFound from '@/pages/NotFound';
import LoginPage from '@/pages/LoginPage';
import ProtectedRoute from '@/components/ProtectedRoute';
import Categories from '@/pages/Categories';
import ProductDetails from '@/components/products/product-details';
import OrderDetails from '@/components/orders/order-details';
import { PurchaseDetails } from '@/components/purshases';
import { PackageDetails } from '@/components/packages';
import AddProductsToPackagePage from '@/components/packages/AddProductsToPackagePage';
import AddProductsToDeliveryPage from '@/components/delivery/AddProductsToDeliveryPage';
import Reports from '@/pages/Reports';

const AppRoutes = () => {
    return (
        <Routes>
            {/* Rutas públicas */}
            <Route path="/login" element={<LoginPage />} />

            {/* Rutas protegidas */}
            <Route 
                path="/" 
                element={
                    <ProtectedRoute>
                        <MainLayout />
                    </ProtectedRoute>
                }
            >
                <Route index element={<Dashboard />} />
                
                <Route path="users" element={<Users />} />
                <Route path="shops" element={<Shops />} />
                
                <Route path="products" element={<Products />} />
                <Route path="products/:id" element={<ProductDetails />} />
                
                <Route path="purchases" element={<Purchases />} />
                <Route path="purchases/:id" element={<PurchaseDetails />} />

                <Route path="packages" element={<Packages />} />
                <Route path="packages/:id" element={<PackageDetails />} />
                <Route path="packages/:id/add-products" element={<AddProductsToPackagePage />} />
                
                <Route path="delivery" element={<Delivery />} />
                <Route path="delivery/:id" element={<DeliveryDetail />} />
                <Route path="delivery/:id/add-products" element={<AddProductsToDeliveryPage />} />
                
                <Route path="orders" element={<Orders />} />
                <Route path="reports" element={<Reports />} />
                <Route path="orders/:id" element={<OrderDetails />} />
                
                <Route path="profile" element={<Profile />} />
                <Route path="settings" element={<Settings />} />
                <Route path="categories" element={<Categories />} />
            </Route>

            {/* Ruta 404 */}
            <Route path="*" element={<NotFound />} />
        </Routes>
    );
};

export default AppRoutes;
