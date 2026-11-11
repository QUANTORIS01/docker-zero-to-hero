from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    RegisterView,
    ShortURLViewSet,
)

router = DefaultRouter()
router.register(r'urls', ShortURLViewSet, basename='short-url')

urlpatterns = [
    # ─── Auth ─────────────────────────────────────────────
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),

    # ─── Short URLs CRUD ──────────────────────────────────
    path('', include(router.urls)),
]
