import { Routes, Route } from "react-router-dom";
import { lazy } from "react";
import MainLayout from "@/layouts/MainLayout";
import Dashboard from "@/pages/Dashboard";
import Delivery from "@/pages/Delivery";
import Orders from "@/pages/Orders";
import Settings from "@/pages/Settings";
import Profile from "@/pages/Profile";
import NotFound from "@/pages/NotFound";
import LoginPage from "@/pages/LoginPage";

import ProtectedRoute from "@/components/utils/ProtectedRoute";
import Unauthorized from "./unauthorized";

const Users = lazy(() => import("@/pages/Users"));
const Shops = lazy(() => import("@/pages/Shops"));
const Products = lazy(() => import("@/pages/Products"));
const Purchases = lazy(() => import("@/pages/Purchases"));
const Packages = lazy(() => import("@/pages/Packages"));
const DeliveryDetail = lazy(() => import("@/pages/DeliveryDetail"));
const Categories = lazy(() => import("@/pages/Categories"));
const ProductDetails = lazy(() => import("@/components/products/product-details"));
const OrderDetails = lazy(() => import("@/components/orders/order-details"));
const PurchaseDetails = lazy(() => import("@/components/purshases/purchase-details"));
const NewPurchasePage = lazy(() => import("@/pages/purchases/NewPurchasePage"));
const EditPurchasePage = lazy(() => import("@/pages/purchases/EditPurchasePage"));
const PackageDetails = lazy(() => import("@/components/packages/PackageDetails"));
const AddProductsToPackagePage = lazy(() => import("@/components/packages/AddProductsToPackagePage"));
const RemoveProductsFromPackagePage = lazy(() => import("@/components/packages/RemoveProductsFromPackagePage"));
const AddProductsToDeliveryPage = lazy(() => import("@/components/delivery/AddProductsToDeliveryPage"));
const RemoveProductsFromDeliveryPage = lazy(() => import("@/components/delivery/RemoveProductsFromDeliveryPage"));
const AddMultipleProductsToOrderPage = lazy(() => import("@/components/orders/AddMultipleProductsToOrderPage"));
const PurchaseProductsManagement = lazy(() => import("@/pages/PurchaseProductsManagement"));
const PackageProductsManagement = lazy(() => import("@/pages/PackageProductsManagement"));
const NewPackagePage = lazy(() => import("@/pages/packages/NewPackagePage"));
const EditPackagePage = lazy(() => import("@/pages/packages/EditPackagePage"));
const DeliveryProductsManagement = lazy(() => import("@/pages/DeliveryProductsManagement"));
const NewDeliveryPage = lazy(() => import("@/pages/delivery/NewDeliveryPage"));
const EditDeliveryPage = lazy(() => import("@/pages/delivery/EditDeliveryPage"));
const Analytics = lazy(() => import("@/pages/Analytics"));
const Invoices = lazy(() => import("@/pages/Invoices"));
const Expenses = lazy(() => import("@/pages/Expenses"));
const BalanceReport = lazy(() => import("@/components/balance/balance-report"));
const BalancePage = lazy(() => import("@/pages/Balance"));
const ClientBalancesTable = lazy(() =>
  import("@/components/client-balances/client-balances-table").then((m) => ({
    default: m.ClientBalancesTable,
  }))
);

// ─── Helper component ─────────────────────────────────────────────────────────

type UserRole = "agent" | "accountant" | "logistical" | "admin";

function RoleGuard({
  children,
  roles,
}: {
  children: React.ReactNode;
  roles: UserRole[];
}) {
  return <ProtectedRoute allowedRoles={roles}>{children}</ProtectedRoute>;
}

// ─── Grupos de roles reutilizables ────────────────────────────────────────────

const ADMIN_ONLY:       UserRole[] = ["admin"];
const ADMIN_AGENT:      UserRole[] = ["admin", "agent"];
const ADMIN_ACCOUNTANT: UserRole[] = ["admin", "accountant"];
const ADMIN_LOGISTICAL: UserRole[] = ["admin", "logistical"];
const ALL_ROLES:        UserRole[] = ["admin", "agent", "accountant", "logistical"];

// ─── Routes ───────────────────────────────────────────────────────────────────

const AppRoutes = () => {
  return (
    <Routes>
      {/* Rutas públicas */}
      <Route path="/login"        element={<LoginPage />} />
      <Route path="/unauthorized" element={<Unauthorized />} />

      {/* Layout protegido */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        {/* Dashboard */}
        <Route index element={<RoleGuard roles={ALL_ROLES}><Dashboard /></RoleGuard>} />

        {/* ── Gestión ── */}
        <Route path="users"      element={<RoleGuard roles={ADMIN_AGENT}><Users /></RoleGuard>} />
        <Route path="shops"      element={<RoleGuard roles={ADMIN_ONLY}><Shops /></RoleGuard>} />
        <Route path="categories" element={<RoleGuard roles={ADMIN_ONLY}><Categories /></RoleGuard>} />

        {/* ── Órdenes ── */}
        <Route path="orders"                  element={<RoleGuard roles={ADMIN_AGENT}><Orders /></RoleGuard>} />
        <Route path="orders/:id"              element={<RoleGuard roles={ADMIN_AGENT}><OrderDetails /></RoleGuard>} />
        <Route path="orders/:id/add-products" element={<RoleGuard roles={ADMIN_AGENT}><AddMultipleProductsToOrderPage /></RoleGuard>} />

        {/* ── Productos ── */}
        <Route path="products"    element={<RoleGuard roles={ADMIN_ONLY}><Products /></RoleGuard>} />
        <Route path="products/:id" element={<RoleGuard roles={ADMIN_ONLY}><ProductDetails /></RoleGuard>} />

        {/* ── Compras ── */}
        <Route path="purchases"                      element={<RoleGuard roles={ADMIN_ONLY}><Purchases /></RoleGuard>} />
        <Route path="purchases/new"                  element={<RoleGuard roles={ADMIN_ONLY}><NewPurchasePage /></RoleGuard>} />
        <Route path="purchases/:id"                  element={<RoleGuard roles={ADMIN_ONLY}><PurchaseDetails /></RoleGuard>} />
        <Route path="purchases/:id/edit"             element={<RoleGuard roles={ADMIN_ONLY}><EditPurchasePage /></RoleGuard>} />
        <Route path="purchases/:id/manage-products"  element={<RoleGuard roles={ADMIN_ONLY}><PurchaseProductsManagement /></RoleGuard>} />

        {/* ── Paquetes ── */}
        <Route path="packages"                      element={<RoleGuard roles={ADMIN_LOGISTICAL}><Packages /></RoleGuard>} />
        <Route path="packages/new"                  element={<RoleGuard roles={ADMIN_LOGISTICAL}><NewPackagePage /></RoleGuard>} />
        <Route path="packages/:id"                  element={<RoleGuard roles={ADMIN_LOGISTICAL}><PackageDetails /></RoleGuard>} />
        <Route path="packages/:id/edit"             element={<RoleGuard roles={ADMIN_LOGISTICAL}><EditPackagePage /></RoleGuard>} />
        <Route path="packages/:id/manage-products"  element={<RoleGuard roles={ADMIN_LOGISTICAL}><PackageProductsManagement /></RoleGuard>} />
        <Route path="packages/:id/add-products"     element={<RoleGuard roles={ADMIN_LOGISTICAL}><AddProductsToPackagePage /></RoleGuard>} />
        <Route path="packages/:id/remove-products"  element={<RoleGuard roles={ADMIN_LOGISTICAL}><RemoveProductsFromPackagePage /></RoleGuard>} />

        {/* ── Delivery ── */}
        <Route path="delivery"                      element={<RoleGuard roles={ADMIN_LOGISTICAL}><Delivery /></RoleGuard>} />
        <Route path="delivery/new"                  element={<RoleGuard roles={ADMIN_LOGISTICAL}><NewDeliveryPage /></RoleGuard>} />
        <Route path="delivery/:id"                  element={<RoleGuard roles={ADMIN_LOGISTICAL}><DeliveryDetail /></RoleGuard>} />
        <Route path="delivery/:id/edit"             element={<RoleGuard roles={ADMIN_LOGISTICAL}><EditDeliveryPage /></RoleGuard>} />
        <Route path="delivery/:id/manage-products"  element={<RoleGuard roles={ADMIN_LOGISTICAL}><DeliveryProductsManagement /></RoleGuard>} />
        <Route path="delivery/:id/add-products"     element={<RoleGuard roles={ADMIN_LOGISTICAL}><AddProductsToDeliveryPage /></RoleGuard>} />
        <Route path="delivery/:id/remove-products"  element={<RoleGuard roles={ADMIN_LOGISTICAL}><RemoveProductsFromDeliveryPage /></RoleGuard>} />

        {/* ── Finanzas ── */}
        <Route path="invoices"          element={<RoleGuard roles={ADMIN_ACCOUNTANT}><Invoices /></RoleGuard>} />
        <Route path="expenses"          element={<RoleGuard roles={ADMIN_ACCOUNTANT}><Expenses /></RoleGuard>} />
        <Route path="balance"           element={<RoleGuard roles={ADMIN_ACCOUNTANT}><BalancePage /></RoleGuard>} />
        <Route path="balance/new-balance" element={<RoleGuard roles={ADMIN_ACCOUNTANT}><BalanceReport /></RoleGuard>} />
        <Route path="client-balances"   element={<RoleGuard roles={ADMIN_ACCOUNTANT}><ClientBalancesTable /></RoleGuard>} />
        <Route path="analytics"         element={<RoleGuard roles={ADMIN_ACCOUNTANT}><Analytics /></RoleGuard>} />

        {/* ── Perfil y Configuración ── */}
        <Route path="profile"   element={<RoleGuard roles={ALL_ROLES}><Profile /></RoleGuard>} />
        <Route path="settings"  element={<RoleGuard roles={ALL_ROLES}><Settings /></RoleGuard>} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

export default AppRoutes;