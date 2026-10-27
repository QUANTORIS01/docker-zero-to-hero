from rest_framework import serializers

from .models import CheckResult, MonitoredURL


class MonitoredURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredURL
        fields = ['id', 'name', 'url', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CheckResultSerializer(serializers.ModelSerializer):
    url_name = serializers.ReadOnlyField(source='monitored_url.name')

    class Meta:
        model = CheckResult
        fields = [
            'id',
            'monitored_url',
            'url_name',
            'is_up',
            'status_code',
            'response_time_ms',
            'error_message',
            'checked_at',
        ]
        read_only_fields = fields  # CheckResult records are never created by users.
