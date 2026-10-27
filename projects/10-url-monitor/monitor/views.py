from rest_framework import viewsets

from .models import CheckResult, MonitoredURL
from .serializers import CheckResultSerializer, MonitoredURLSerializer


class MonitoredURLViewSet(viewsets.ModelViewSet):
    """
    Full CRUD for URLs being monitored.
    Users can add, edit, and delete URLs through the API or admin panel.
    """
    queryset = MonitoredURL.objects.all()
    serializer_class = MonitoredURLSerializer


class CheckResultViewSet(viewsets.ReadOnlyModelViewSet):
    """
    Read-only access to check results.

    Users can list and view results, but they cannot create them.
    New results are created only by the Celery task.
    """
    queryset = CheckResult.objects.select_related('monitored_url').all()
    serializer_class = CheckResultSerializer
