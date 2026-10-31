from django.contrib import admin
from django.utils.html import format_html

from .models import Recipe


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'title', 'category', 'difficulty', 'total_time_minutes', 'created_at')
    list_display_links = ('thumbnail', 'title')
    list_filter = ('category', 'difficulty')
    search_fields = ('title', 'description', 'ingredients')
    date_hierarchy = 'created_at'
    fieldsets = (
        ('Basic info', {
            'fields': ('title', 'description', 'photo'),
        }),
        ('Classification', {
            'fields': ('category', 'difficulty', 'servings'),
        }),
        ('Timing', {
            'fields': ('prep_time_minutes', 'cook_time_minutes'),
        }),
        ('Content', {
            'fields': ('ingredients', 'instructions'),
        }),
    )

    @admin.display(description='Photo')
    def thumbnail(self, obj):
        if not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="height:50px;width:50px;object-fit:cover;border-radius:6px;" />',
            obj.photo.url,
        )

    @admin.display(description='Total time')
    def total_time_minutes(self, obj):
        return f"{obj.total_time_minutes} min"
