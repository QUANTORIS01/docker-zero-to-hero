from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView

from .views import (
    LoginView,
    MeView,
    MessageViewSet,
    RegisterView,
    RoomViewSet,
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')

urlpatterns = [
    # ─── Auth ─────────────────────────────────────────────
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),

    # ─── Messages under a room ────────────────────────────
    path('rooms/<slug:room_slug>/messages/', MessageViewSet.as_view({'get': 'list'}), name='room-messages'),

    # ─── Rooms (list / create / detail by slug) ───────────
    path('', include(router.urls)),
]
