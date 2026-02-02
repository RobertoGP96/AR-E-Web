import { Routes, Route } from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Users from "@/pages/Users";
import Shops from "@/pages/Shops";
import Products from "@/pages/Products";
import Purchases from "@/pages/Purchases";
import Packages from "@/pages/Packages";
import Delivery from "@/pages/Delivery";
import DeliveryDetail from "@/pages/DeliveryDetail";
import Orders from "@/pages/Orders";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";
import ProtectedRoute from "@/components/utils/ProtectedRoute";
import Categories from "@/pages/Categories";
import ProductDetails from "@/components/products/product-details";
import OrderDetails from "@/components/orders/order-details";
import { PurchaseDetails } from "@/components/purshases";
import NewPurchasePage from "@/pages/purchases/NewPurchasePage";
import EditPurchasePage from "@/pages/purchases/EditPurchasePage";
import { PackageDetails } from "@/components/packages";
import AddProductsToPackagePage from "@/components/packages/AddProductsToPackagePage";
import RemoveProductsFromPackagePage from "@/components/packages/RemoveProductsFromPackagePage";
import AddProductsToDeliveryPage from "@/components/delivery/AddProductsToDeliveryPage";
import RemoveProductsFromDeliveryPage from "@/components/delivery/RemoveProductsFromDeliveryPage";
import AddMultipleProductsToOrderPage from "@/components/orders/AddMultipleProductsToOrderPage";
import PurchaseProductsManagement from "@/pages/PurchaseProductsManagement";
import PackageProductsManagement from "@/pages/PackageProductsManagement";
import NewPackagePage from "@/pages/packages/NewPackagePage";
import EditPackagePage from "@/pages/packages/EditPackagePage";
import DeliveryProductsManagement from "@/pages/DeliveryProductsManagement";

import Analytics from "@/pages/Analytics";
import Invoices from "@/pages/Invoices";
import Expenses from "@/pages/Expenses";
import BalanceReport from "@/components/balance/balance-report";
import BalancePage from "@/pages/Balance";

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
        <Route path="purchases/new" element={<NewPurchasePage />} />
        <Route path="purchases/:id" element={<PurchaseDetails />} />
        <Route path="purchases/:id/edit" element={<EditPurchasePage />} />
        <Route
          path="purchases/:id/manage-products"
          element={<PurchaseProductsManagement />}
        />

        <Route path="packages" element={<Packages />} />
        <Route path="packages/new" element={<NewPackagePage />} />
        <Route path="packages/:id" element={<PackageDetails />} />
        <Route path="packages/:id/edit" element={<EditPackagePage />} />
        <Route
          path="packages/:id/manage-products"
          element={<PackageProductsManagement />}
        />
        <Route
          path="packages/:id/add-products"
          element={<AddProductsToPackagePage />}
        />
        <Route
          path="packages/:id/remove-products"
          element={<RemoveProductsFromPackagePage />}
        />

        <Route path="delivery" element={<Delivery />} />
        <Route path="delivery/:id" element={<DeliveryDetail />} />
        <Route
          path="delivery/:id/manage-products"
          element={<DeliveryProductsManagement />}
        />
        <Route
          path="delivery/:id/add-products"
          element={<AddProductsToDeliveryPage />}
        />
        <Route
          path="delivery/:id/remove-products"
          element={<RemoveProductsFromDeliveryPage />}
        />

        <Route path="orders" element={<Orders />} />
        <Route path="orders/:id" element={<OrderDetails />} />
        <Route
          path="orders/:id/add-products"
          element={<AddMultipleProductsToOrderPage />}
        />

        <Route path="invoices" element={<Invoices />} />
        <Route path="expenses" element={<Expenses />} />

        <Route path="balance" element={<BalancePage />} />
        <Route path="balance/new-balance" element={<BalanceReport />} />

        <Route path="analytics" element={<Analytics />} />

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
