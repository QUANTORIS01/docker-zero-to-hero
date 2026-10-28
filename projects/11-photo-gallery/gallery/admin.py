from django.contrib import admin
from django.utils.html import format_html

from .models import Photo


@admin.register(Photo)
class PhotoAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'title', 'photographer', 'location', 'created_at')
    list_display_links = ('thumbnail', 'title')
    search_fields = ('title', 'description', 'photographer', 'location')
    list_filter = ('created_at',)
    date_hierarchy = 'created_at'

    @admin.display(description='Preview')
    def thumbnail(self, obj):
        """Show a small preview of the image in the admin list."""
        if not obj.image:
            return '—'
        return format_html(
            '<img src="{}" style="height:60px;border-radius:6px;" />',
            obj.image.url,
        )
