from rest_framework.routers import DefaultRouter

from .views import CheckResultViewSet, MonitoredURLViewSet

router = DefaultRouter()
router.register(r'urls', MonitoredURLViewSet, basename='url')
router.register(r'checks', CheckResultViewSet, basename='check')

urlpatterns = router.urls
