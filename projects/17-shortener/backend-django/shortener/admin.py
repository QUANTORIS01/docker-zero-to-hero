from django.contrib import admin
from .models import ShortURL


@admin.register(ShortURL)
class ShortURLAdmin(admin.ModelAdmin):
    list_display = ('id', 'short_code', 'owner', 'original_url', 'clicks', 'created_at', 'expires_at')
    list_filter = ('owner', 'created_at')
    search_fields = ('short_code', 'original_url')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'clicks')
