from django.contrib import admin

from .models import Message, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_by', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'author', 'content', 'created_at')
    list_filter = ('room',)
    search_fields = ('content',)
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at',)
