from django.contrib import admin

from .models import Category, Task


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'created_at')
    search_fields = ('name',)


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'title',
        'owner',
        'status',
        'priority',
        'due_date',
        'created_at',
    )
    list_filter = ('status', 'priority', 'category')
    search_fields = ('title', 'description')
    autocomplete_fields = ('owner', 'category')
    date_hierarchy = 'created_at'
