from rest_framework import mixins, viewsets

from .models import Task
from .serializers import TaskSerializer
from .tasks import process_task


class TaskViewSet(mixins.CreateModelMixin, mixins.ListModelMixin, mixins.RetrieveModelMixin, viewsets.GenericViewSet):
    """
    API for tasks.

    - GET    /api/tasks/         → list all
    - POST   /api/tasks/         → create a new task (dispatches the Celery job)
    - GET    /api/tasks/{id}/    → retrieve one
    """

    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        task = serializer.save()
        process_task.delay(task.id)
