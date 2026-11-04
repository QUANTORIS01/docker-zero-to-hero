"""
WebSocket consumer for a chat room.

Client → server:  {"message": "hello"}
Server → client:  {"id": 1, "message": "hello", "author": "alice", "created_at": "..."}
"""
import json

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer

from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close(code=4401)  # 4401 = unauthorized
            return

        self.room_slug = self.scope['url_route']['kwargs']['room_slug']
        self.room_group_name = f'chat_{self.room_slug}'

        room = await self._get_room(self.room_slug)
        if room is None:
            await self.close(code=4404)  # 4404 = room not found
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name,
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = (data.get('message') or '').strip()
        if not content:
            return

        user = self.scope['user']
        message = await self._save_message(user, self.room_slug, content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',           # → calls chat_message() below
                'id': message.id,
                'content': content,
                'author': user.username,
                'created_at': message.created_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['content'],
            'author': event['author'],
            'created_at': event['created_at'],
        }))

    # ─── DB helpers (sync → async bridge) ─────────────────
    @database_sync_to_async
    def _get_room(self, slug):
        return Room.objects.filter(slug=slug).first()

    @database_sync_to_async
    def _save_message(self, user, room_slug, content):
        room = Room.objects.get(slug=room_slug)
        return Message.objects.create(room=room, author=user, content=content)
