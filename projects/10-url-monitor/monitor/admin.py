from django.contrib import admin

from .models import CheckResult, MonitoredURL


@admin.register(MonitoredURL)
class MonitoredURLAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'url', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'url')


@admin.register(CheckResult)
class CheckResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'monitored_url', 'is_up', 'status_code', 'response_time_ms', 'checked_at')
    list_filter = ('is_up', 'monitored_url')
    search_fields = ('monitored_url__name', 'monitored_url__url')
    date_hierarchy = 'checked_at'
