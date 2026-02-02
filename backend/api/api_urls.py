"""Api Urls"""

from django.urls import include, path, re_path
from api import views

from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import (
    TokenRefreshView,
)

router = DefaultRouter()
router.register(r"user", views.UserViewSet)
router.register(r"order", views.OrderViewSet)
router.register(r"shop", views.ShopViewSet)
router.register(r"buying_account", views.BuyingAccountsViewsSet)
router.register(r"common_information", views.CommonInformationViewSet)
router.register(r"product", views.ProductViewSet)
router.register(r"shopping_reciep", views.ShoppingReceipViewSet)
router.register(r"buyed_product", views.ProductBuyedViewSet)
router.register(r"delivery_receips", views.DeliverReceipViewSet)
router.register(r"product_received", views.ProductReceivedViewSet)
router.register(r"package", views.PackageViewSet)
router.register(r"product_delivery", views.ProductDeliveryViewSet)
router.register(r"category", views.CategoryViewSet)
router.register(r"balance", views.BalanceViewSet)
router.register(r"invoice", views.InvoiceViewSet)
router.register(r"tag", views.TagViewSet)
router.register(r"expense", views.ExpenseViewSet)

from api.views.expense_views import ExpenseViewSet
from api.views.invoice_views import InvoiceViewSet

from api.views.card_views import CardOperationsView

urlpatterns = [
    # Inclusión de las rutas del router bajo el prefijo `api_data/`
    path("api_data/", include(router.urls)),
    
    # Endpoint explícito para las órdenes del usuario autenticado
    path("user/", views.CurrentUserView.as_view(), name="current_user"),
    path("verify_user/<str:verification_secret>", views.verify_user, name="verify_user"),
    path("auth/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("auth/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    re_path(
        r"password/(?P<password_secret>\S+)?/?$",
        views.PasswordRecoverList.as_view(),
        name="recover_password",
    ),
    path("image_upload/", views.ImageUploadApiView.as_view(), name="image_upload"),
    # Posting Management Security URL
    path("security/", views.Protection.as_view(), name="posting_management"),
    # Amazon Scraping URL
    path("amazon/scrape/", views.AmazonScrapingView.as_view(), name="amazon_scraping"),
    # Admin User Creation URL
    path("admin/create/", views.CreateAdminView.as_view(), name="create_admin_user"),
    # Card Operations URL
    path("cards/operations/", CardOperationsView.as_view(), name="card_operations"),
    
    # Dashboard URLs
    path("api_data/dashboard/stats/", views.DashboardMetricsView.as_view(), name="dashboard_stats"),
    
    # Reports URLs
    path("api_data/reports/profits/", views.ProfitReportsView.as_view(), name="profit_reports"),
    path("api_data/reports/expenses/", views.ExpenseAnalysisView.as_view(), name="expense_analysis"),
    path("api_data/reports/deliveries/", views.DeliveryAnalysisView.as_view(), name="delivery_analysis"),
    path("api_data/reports/orders/", views.OrderAnalysisView.as_view(), name="order_analysis"),
    path("api_data/reports/purchases/", views.PurchasesAnalysisView.as_view(), name="purchases_analysis"),
    path("api_data/reports/purchases/summary/", views.PurchasesSummaryView.as_view(), name="purchases_summary"),
    path("api_data/reports/purchases/products/", views.ProductBuysAnalysisView.as_view(), name="product_buys_analysis"),
    path("api_data/reports/clients/balances/", views.ClientBalancesReportView.as_view(), name="client_balances_report"),
    path("api_data/system/info/", views.SystemInfoView.as_view(), name="system_info"),
    # URLs de notificaciones (incluidas bajo el mismo prefijo `api_data/`)
    path("api_data/", include("api.notifications.urls_notifications")),
]
