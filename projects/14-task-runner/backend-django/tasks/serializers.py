from rest_framework import serializers

from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id',
            'title',
            'description',
            'email',
            'status',
            'status_display',
            'result',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'status', 'result', 'created_at', 'updated_at']
