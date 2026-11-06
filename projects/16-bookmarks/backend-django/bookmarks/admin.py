from django.contrib import admin
from .models import Bookmark


@admin.register(Bookmark)
class BookmarkAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'owner', 'url', 'tags', 'created_at')
    list_filter = ('owner', 'created_at')
    search_fields = ('title', 'url', 'tags', 'description')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
