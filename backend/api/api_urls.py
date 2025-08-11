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
router.register(r"deliver_reciep", views.DeliverReceipViewSet)
router.register(r"product_received", views.ProductReceivedViewSet)
router.register(r"package", views.PackageViewSet)
urlpatterns = [
    path("api_data/", include(router.urls)),
    path("verify_user/<verification_secret>", views.verify_user, name="verify_user"),
    path("token/", views.MyTokenObtainPairView.as_view(), name="token_obtain_pair"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
    re_path(
        r"password/(?P<password_secret>\S+)?/?$",
        views.PasswordRecoverList.as_view(),
        name="recover_password",
    ),
    path("image_upload/", views.ImageUploadApiView.as_view(), name="image_upload"),
    path("security/", views.Protection.as_view(), name="posting_management"),
]
