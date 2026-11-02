from django.contrib import admin

from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'status', 'email', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('title', 'description', 'email')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
