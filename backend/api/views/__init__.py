# Importar todas las vistas modulares para mantener compatibilidad
from .auth_views import (
    MyTokenObtainPairView,
    Protection,
    PasswordRecoverList,
    verify_user
)
from .user_views import UserViewSet, CurrentUserView
from .order_views import OrderViewSet
from .product_views import (
    ProductViewSet,
    ProductBuyedViewSet,
    ProductReceivedViewSet,
    ProductDeliveryViewSet
)
from .delivery_views import (
    PackageViewSet,
    DeliverReceipViewSet
)
from .shop_views import (
    ShopViewSet,
    BuyingAccountsViewsSet,
    ShoppingReceipViewSet
)
from .expense_views import ExpenseViewSet
from .common_views import (
    CategoryViewSet,
    CommonInformationViewSet,
    ImageUploadApiView
)
from .dashboard_views import (
    DashboardMetricsView,
    ProfitReportsView,
    SystemInfoView
)
from .reports_views import (
    ExpenseAnalysisView,
    DeliveryAnalysisView,
    OrderAnalysisView,
    PurchasesAnalysisView,
    PurchasesSummaryView,
    ProductBuysAnalysisView,
)
from .amazon_views import (
    AmazonScrapingView,
    CreateAdminView
)
from .invoice_views import (
    InvoiceViewSet,
    TagViewSet
)

__all__ = [
    # Auth views
    'MyTokenObtainPairView',
    'Protection',
    'PasswordRecoverList',
    'verify_user',

    # User views
    'UserViewSet',
    'CurrentUserView',

    # Order views
    'OrderViewSet',

    # Product views
    'ProductViewSet',
    'ProductBuyedViewSet',
    'ProductReceivedViewSet',
    'ProductDeliveryViewSet',

    # Delivery views
    'PackageViewSet',
    'DeliverReceipViewSet',

    # Shop views
    'ShopViewSet',
    'BuyingAccountsViewsSet',
    'ShoppingReceipViewSet',
    'ExpenseViewSet',

    # Common views
    'CategoryViewSet',
    'CommonInformationViewSet',
    'ImageUploadApiView',

    # Dashboard views
    'DashboardMetricsView',
    'ProfitReportsView',
    'SystemInfoView',
    'ExpenseAnalysisView',
    'DeliveryAnalysisView',
    'OrderAnalysisView',
    'PurchasesAnalysisView',
    'PurchasesSummaryView',
    'ProductBuysAnalysisView',

    # Amazon views
    'AmazonScrapingView',
    'CreateAdminView',

    # Invoice views
    'InvoiceViewSet',
    'TagViewSet',
]