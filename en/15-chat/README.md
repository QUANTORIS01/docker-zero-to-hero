[🇮🇷 فارسی](/fa/15-chat/README.md)

# Lesson 15 — Real-time Chat with WebSocket: ChatFlow

---

## Introduction

We have now gone through 14 lessons and built six projects. Everything we built so far used **HTTP**: we sent a request, we got a response, done. Like calling a company: you dial, ask a question, get an answer, hang up.

But many real apps do not work that way. **Chat**, **real-time notifications**, **online games**, **live stock prices** — they cannot keep asking "anything new?". They need to **keep a line open** and receive messages at any moment.

That open line is called **WebSocket**. In this lesson, we learn how to Dockerize a real-time app.

### Why is this lesson important?

Until Lesson 14, every project followed the same pattern of "HTTP + Gunicorn". Now **something new** enters the picture: WebSocket. And WebSocket changes a few things:

- The **server** changes (Daphne instead of Gunicorn)
- **Nginx** needs a specific configuration
- **Authentication** needs a different approach
- **Redis** takes on a new role

**The main goal of this lesson:** after this lesson, when you see a real-time project, you will know where to start and how to Dockerize it.

That skill is exactly the **Docker mindset** we have been building.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain what WebSocket is and how it differs from HTTP
- Explain why we need Daphne (not Gunicorn) for WebSocket
- Explain what Redis does as a "Channel Layer"
- Configure Nginx to forward WebSocket traffic
- Send a JWT token to WebSocket via query string
- Have the **Docker mindset**: look at any project and know how to Dockerize it

---

## 1. First, What Are We Building?

### The Story

A simple chat app, but **fully real**:

1. User `alice` registers
2. She creates a room called `general`
3. She enters the room — an open line (WebSocket) connects to the server
4. She sends: "Hello!"
5. `bob` (in another browser) has also joined the same room
6. **Without refreshing**, `bob` sees `alice`'s message
7. `bob` replies: "Hi!"
8. `alice` sees the reply instantly

**Important note:** In Lesson 14, React asked "did tasks change?" every 2 seconds. This lesson **does not do that**. It keeps an open line and the server pushes messages **by itself**.

### Compare with an example

- **Lesson 14 (polling):** "Anything new?" — "No" — "Anything new?" — "No" — "Anything new?" — "Oh, a task completed!" ← a question every 2 seconds
- **Lesson 15 (WebSocket):** "Hi, I'm listening." — "OK." — "..." — "..." — "New message!" ← an open line, no repeated questions

---

## 2. Quick Recap — What is WebSocket?

Before anything else, let me explain 4 new concepts of this lesson in the **simplest possible way**.

### What is WebSocket?

**HTTP is a short conversation:**

- Client: "Hi, please give me this request."
- Server: "Here's the response."
- (Done. Disconnected.)

**WebSocket is an open phone line:**

- Client: "Hi, can I open a line?"
- Server: "Sure, go ahead."
- (The line stays open...)
- Client: "A message."
- Server: "Got it."
- Server: "Here's a new message from another user."
- (The line stays open until someone hangs up.)

**Key difference:** In HTTP, the server cannot send unsolicited messages. In WebSocket, it **can**.

### What is ASGI? What is WSGI?

- **WSGI** = the old Python standard that only understands HTTP. "WSGI" stands for "Web Server Gateway Interface".
- **ASGI** = the new standard that understands both HTTP and WebSocket. "ASGI" stands for "Asynchronous Server Gateway Interface".

**Simple analogy:**

- **WSGI** = a postman who can only carry letters back and forth. If one day you also want a phone line, he cannot help.
- **ASGI** = a postman who delivers letters AND can connect a phone line. Better for modern work.

**So for this lesson:**

- Gunicorn → WSGI → HTTP only → ❌ for WebSocket
- Daphne → ASGI → HTTP + WebSocket → ✅ for WebSocket

### What is Daphne?

Daphne is an ASGI server built by the Django Channels project. Like Gunicorn, but it understands WebSocket. **The name comes from a mythical character, but that doesn't matter. It's just a name.**

### What is Channels?

Django on its own does not understand WebSocket. **Channels** is a Django extension that teaches Django to handle WebSocket. It introduces a new concept called **Consumer**.

- **View** (which we already know) = handler for HTTP requests
- **Consumer** (new) = handler for WebSocket connections

### What is a Channel Layer?

Imagine 100 people in the `general` room. Each one has an open WebSocket. When `alice` sends a message, how does it reach **all 100 people**?

**Answer:** Redis. Each connection has a Consumer that belongs to a **group** in Redis. When a message arrives, Redis broadcasts it to every member of that group.

- Each room = a group in Redis (e.g., `chat_general`)
- Each WebSocket = a member of that group
- New message = broadcast to all members

**Why does this matter?** If the server has multiple instances, they all read from the same Redis. That means you can have 100 servers working together.

---

## 3. Docker Mindset — The Same 7 Questions, Plus One New

In Lesson 14, we learned the 7 Docker mindset questions. Now we look at this project with **the same 7 questions**, but this time we add an eighth question that is specific to real-time projects.

### Question 1 — How many "parts" does this project have?

| Part | Container |
|------|-----------|
| Frontend (React) | `frontend` |
| Backend (Django + Channels) | `backend` |
| Database (PostgreSQL) | `db` |
| Channel Layer (Redis) | `redis` |
| Migrations (one-shot) | `migrate` |

**Five services** (Lesson 14 had six, because it also had a `worker`. This project has no Celery).

**Why is Redis here?** In Lesson 14, Redis was the Celery queue. Here Redis is the **Channel Layer**. One tool, two roles. **This is itself an important lesson:** Redis is a general-purpose tool that can be a queue, a cache, or a Channel Layer. Our code decides the purpose.

### Question 2 — What does each part need to run?

| Service | What it needs |
|---------|----------------|
| `backend` | Python 3.12 + Django + Channels + Daphne ← **Dockerfile** |
| `frontend` | Node.js (build) + Nginx (serve) ← **Multi-stage Dockerfile** |
| `db` | Ready-made Image `postgres:16` |
| `redis` | Ready-made Image `redis:7-alpine` |
| `migrate` | **Same as backend** (only `command` differs) |

**Note:** `migrate` does not need its own Dockerfile. Like Lesson 14, it reuses the backend Image.

### Question 3 — How do these parts talk to each other?

```text
User ──► frontend (port 8090, from outside)
            │
            ├──► /             ──► React
            ├──► /api/         ──► backend:8000 (HTTP)
            ├──► /admin/       ──► backend:8000 (HTTP)
            ├──► /health/      ──► backend:8000 (HTTP)
            ├──► /static/      ──► static_files volume
            └──► /ws/          ──► backend:8000 (WebSocket) ⭐ new
backend ──► db (internal)
backend ──► redis (internal, for Channel Layer)
```

**New note:** The `/ws/` path is separate because **its protocol is different**. Nginx must know this path is WebSocket and forward it with a specific configuration.

### Question 4 — What data must stay alive?

| Data | Volume |
|------|--------|
| PostgreSQL data | `postgres_data` |
| Django static files (admin CSS) | `static_files` |
| Source code | **No** (baked into the Image) |
| Redis data | **No** (messages are stored in the DB) |

**Why doesn't Redis need a volume?** Because it is only a temporary connection line. The real messages are stored in PostgreSQL. If Redis restarts, only live connections drop (users reconnect).

### Question 5 — What settings must be changeable?

- Database password
- Django secret key
- Redis address (differs between dev and Docker)
- **JWT token lifetime** (because security matters)

**All in `.env`.**

### Question 6 — How should it be built?

| Service | Build type |
|---------|------------|
| `backend` | **Single-stage** (Python) |
| `frontend` | **Multi-stage** (Node.js → Nginx) |
| `db` | Ready-made |
| `redis` | Ready-made |
| `migrate` | **Uses backend's Image** |

### Question 7 — What is the startup order?

```text
1. db (healthcheck: pg_isready)
2. redis (healthcheck: redis-cli ping)
3. migrate (waits for db healthy) → runs once, exits
4. backend (waits for migrate completed + redis healthy)
5. frontend (waits for backend healthy)
```

### 🎯 Question 8 (new) — What is the protocol?

**This question is specific to this lesson.** Before anything else, ask: "Does this project use HTTP or WebSocket?"

| Protocol | Server | Nginx |
|----------|--------|-------|
| HTTP only | Gunicorn | plain `proxy_pass` |
| **HTTP + WebSocket** | **Daphne** | **`proxy_pass` + Upgrade headers** ⭐ |
| WebSocket only | Daphne | `proxy_pass` + Upgrade |

**New golden rule:** if the project has WebSocket, you must:

1. Replace Gunicorn with **Daphne**
2. Configure Nginx with **Upgrade headers**
3. Send JWT via **query string** (not from a header)

If you forget any of these three, WebSocket will **not work** — it either won't connect at all, or it will drop after a few seconds. Our own painful experience was finding all three problems one by one.

### 🎯 Summary of the Docker mindset for this lesson

- **The previous 7 questions** are answered the same way
- **Question 8 (protocol)** is added: do you have WebSocket?
- If yes, three things change: the server, Nginx, authentication

**Those three lines are the heart of this lesson.** The rest is details.

---

## 4. Project Architecture

```text
┌──────────────────────────────────────────────────┐
│                      User                        │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              frontend (Nginx, port 8090)         │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000 (HTTP)           │
│  /admin/      ──►  backend:8000 (HTTP)           │
│  /health/     ──►  backend:8000 (HTTP)           │
│  /static/     ──►  static_files volume           │
│  /ws/         ──►  backend:8000 (WebSocket) ⭐   │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│        backend (Django + Daphne, port 8000)      │
│                                                  │
│  HTTP: Views         WebSocket: Consumers        │
└─────┬─────────────────────────────────┬──────────┘
      │                                 │
      ▼                                 ▼
┌──────────────┐               ┌──────────────────┐
│      db      │               │      redis       │
│  PostgreSQL  │               │  (channel layer) │
└──────────────┘               └──────────────────┘
```

**Course ports:**

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| 13 | Recipe Book | 8088 |
| 14 | Task Runner | 8089 |
| **15** | **ChatFlow** | **8090** |

---

## 5. Directory Structure

```text
15-chat/
├── compose.yaml
├── README.md
├── README.fa.md
├── backend-django/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py         ← ProtocolTypeRouter
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── chat/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── consumers.py     ← ChatConsumer (WebSocket)
│       ├── middleware.py    ← JWTAuthMiddleware
│       ├── models.py        ← Room, Message
│       ├── routing.py       ← websocket_urlpatterns
│       ├── serializers.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           ├── __init__.py
│           └── 0001_initial.py
└── frontend-react/
    ├── .dockerignore
    ├── Dockerfile
    ├── nginx.conf
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Auth.jsx
            ├── ChatRoom.jsx
            └── RoomsList.jsx
```

**There is a single `.gitignore` at the repository root** covering all projects.

---

## 6. Backend Files — Line by Line

### 6.1. `requirements.txt`

```txt
Django==5.1.4
djangorestframework==3.15.2
djangorestframework-simplejwt==5.4.0
psycopg[binary]==3.2.10
django-environ==0.14.0
django-cors-headers==4.6.0
channels==4.2.0
channels-redis==4.2.1
daphne==4.1.2
```

**What is each package?**

| Package | Its job |
|---------|---------|
| **Django** | Backend framework |
| **djangorestframework** | Building APIs |
| **djangorestframework-simplejwt** | ⭐ JWT authentication |
| **psycopg[binary]** | PostgreSQL driver |
| **django-environ** | Reading `.env` |
| **django-cors-headers** | Allow requests from React |
| **channels** | ⭐ WebSocket for Django |
| **channels-redis** | ⭐ Channel Layer on Redis |
| **daphne** | ⭐ ASGI server |

**Important note:** we **removed** `gunicorn`. Why? Because Gunicorn only understands WSGI (HTTP). For WebSocket, Daphne is required.

### 6.2. `.env.example`

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# CORS (for React)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8090
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8090

# PostgreSQL
POSTGRES_DB=chatflow
POSTGRES_USER=chatflow
POSTGRES_PASSWORD=chatflow_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis (Channels layer)
REDIS_URL=redis://localhost:6379/0
```

**Why `localhost` in `.env` but `db` and `redis` in `compose.yaml`?**

Because `.env` is for **local** execution (outside Docker). `compose.yaml` overrides these values and uses service names (`db`, `redis`).

### 6.3. `config/settings.py` — the important parts

```python
import environ
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'daphne',  # ⭐ must be before staticfiles
    # ... Django
    'rest_framework',
    'corsheaders',
    'channels',  # ⭐ new
    'chat',
]

ASGI_APPLICATION = 'config.asgi.application'  # ⭐ new

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        # ...
    }
}

# ⭐ new: Channel Layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}],
        },
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

**Most important changes from Lesson 14:**

- **`daphne` in INSTALLED_APPS** — so `runserver` becomes ASGI (for dev)
- **`channels` in INSTALLED_APPS** — enables WebSocket
- **`ASGI_APPLICATION`** — the WebSocket entry point
- **`CHANNEL_LAYERS`** — the Redis address
- **`SIMPLE_JWT`** — JWT authentication

**Important line: `'socket_timeout': 20`**

This is a well-known trap. `redis-py` version 8+ defaults to `socket_timeout=5`. But `channels_redis` uses `BRPOP`, which is **blocking** and waits 5 seconds for a message. That means:

- `redis-py` says: "I'll wait 5 seconds, if no response comes I'll disconnect."
- `channels_redis` says: "I'll wait 5 seconds for a message."
- These two collide → `Timeout reading from redis:6379`
- Result: every connection **drops after about 6 seconds**

**Fix:** `socket_timeout: 20` (larger than 5 seconds). **It must be inside each host, not as a separate key:**

```python
'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}]
```

If you write it wrong:

```python
# ❌ wrong — raises: unexpected keyword argument 'socket_timeout'
'hosts': [env('REDIS_URL')],
'socket_timeout': 20,
```

**Remember this trap. It was our real-world experience.**

### 6.4. `config/asgi.py` — the WebSocket entry point

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ⭐ first, fully initialize Django
django_asgi_app = get_asgi_application()

# then import Channels routes
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from chat.middleware import JWTAuthMiddleware
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    ),
})
```

**Line by line:**

- **`get_asgi_application()`** — initializes Django
- **`ProtocolTypeRouter`** — a router that decides by protocol
- **`'http'`** — HTTP requests ← go to normal Django
- **`'websocket'`** — WebSocket connections ← go to the dedicated pipeline
- **`AllowedHostsOriginValidator`** — checks the browser Origin
- **`JWTAuthMiddleware`** — validates the token
- **`URLRouter`** — matches the URL to the right Consumer

**Critical note: import order**

If you import `from chat.routing import ...` **before** `get_asgi_application()`, Django apps are not loaded yet and you get `AppRegistryNotReady`. **Always Django first, then Channels.**

### 6.5. `chat/models.py`

```python
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
```

**Fields:**

| Model | Field | Meaning |
|-------|-------|---------|
| Room | `name` | Room name (e.g., "general") |
| Room | `slug` | URL-friendly version (e.g., "general") — for the WebSocket path |
| Room | `created_by` | Creator |
| Message | `room` | Which room the message belongs to |
| Message | `author` | Sender |
| Message | `content` | Message text |

**Why `slug` separate from `name`?** Because URLs cannot contain spaces and special characters. `slugify` turns spaces into `-`. For example, `My Room!` becomes `my-room`. **This decision matters because it is used in the WebSocket path.**

### 6.6. `chat/consumers.py` — the heart of WebSocket

```python
import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        self.room_slug = self.scope['url_route']['kwargs']['room_slug']
        self.room_group_name = f'chat_{self.room_slug}'

        room = await self._get_room(self.room_slug)
        if room is None:
            await self.close(code=4404)  # not found
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
                'type': 'chat_message',
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

    @database_sync_to_async
    def _get_room(self, slug):
        return Room.objects.filter(slug=slug).first()

    @database_sync_to_async
    def _save_message(self, user, room_slug, content):
        room = Room.objects.get(slug=room_slug)
        return Message.objects.create(room=room, author=user, content=content)
```

**Line by line:**

- **`AsyncWebsocketConsumer`** — base class for WebSocket (async)
- **`connect()`** — when a user connects
- **`disconnect()`** — when they disconnect
- **`receive()`** — when a message arrives from the user
- **`chat_message()`** — when a message arrives from the group

**The three main methods:**

**`connect()`:**

1. Check if the user is logged in (if not, close with code 4401)
2. Read `room_slug` from the URL
3. Build the group name: `chat_general`
4. Check the room exists
5. **Join the group** — this is the key line
6. Accept the connection (`accept`)

**`receive()`:**

1. Parse the JSON
2. Extract the text
3. Save the message to PostgreSQL
4. **Send the message to the group** — this is the magic line

**`chat_message()`:**

This method is called when `group_send` sends a message to this group. It forwards the message to the user's browser.

**Important: `database_sync_to_async`**

Database operations (like `Room.objects.get`) are **sync**. But consumers are **async**. To bridge them, we use this decorator. If you call them directly, you get `SynchronousOnlyOperation`.

### 6.7. `chat/middleware.py` — WebSocket authentication

```python
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(token):
    try:
        access = AccessToken(token)
        return get_user_model().objects.get(id=access['user_id'])
    except (TokenError, KeyError, get_user_model().DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get('query_string', b'').decode())
        token = query.get('token', [None])[0]

        scope['user'] = await _get_user(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
```

**This file solves a browser limitation:**

**The browser cannot send custom headers for WebSocket.** Unlike HTTP, you cannot send `Authorization: Bearer xyz`. The browser WebSocket API only accepts a URL.

**So where do we put the token?** In the **query string**:

```text
ws://127.0.0.1:8090/ws/chat/general/?token=<JWT>
```

**This middleware:**

1. Reads `scope['query_string']`
2. Extracts the token from the query
3. Validates it with `AccessToken`
4. Fetches the user from the database
5. Populates `scope['user']`

**Without this middleware, `self.scope['user']` is always `AnonymousUser` and `connect()` will close.**

### 6.8. `chat/routing.py`

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_slug>[\w-]+)/$', consumers.ChatConsumer.as_asgi()),
]
```

**This is a very important decision:**

- URL pattern: `/ws/chat/{room_slug}/`
- `[\w-]+` means letters, digits, underscore, and dash
- `room_slug` is **passed from the URL to the consumer**

**Why `/ws/` separate from `/api/`?** Because Nginx must know this path is WebSocket and forward it with a specific configuration.

### 6.9. `chat/views.py` — normal API

```python
from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Message, Room
from .serializers import (
    MessageSerializer, RegisterSerializer, RoomSerializer, UserSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().select_related('created_by')
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MessageViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_slug = self.kwargs.get('room_slug')
        return Message.objects.filter(room__slug=room_slug).select_related('author')
```

**Nothing new here — everything is HTTP.** The only change: `RoomViewSet` uses `slug` (not `id`) to keep URLs aligned with WebSocket.

### 6.10. `chat/urls.py`

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, MeView, MessageViewSet, RegisterView, RoomViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('rooms/<slug:room_slug>/messages/',
         MessageViewSet.as_view({'get': 'list'}), name='room-messages'),
    path('', include(router.urls)),
]
```

**API paths:**

| Method | Path |
|--------|------|
| POST | `/api/auth/register/` |
| POST | `/api/auth/login/` |
| POST | `/api/auth/refresh/` |
| GET | `/api/auth/me/` |
| GET/POST | `/api/rooms/` |
| GET | `/api/rooms/{slug}/` |
| GET | `/api/rooms/{slug}/messages/` |

### 6.11. `config/urls.py`

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('chat.urls')),
]
```

**Three HTTP paths.** WebSocket paths are **not** here — they live in `config/asgi.py`. **This separation matters:** URLconf is for HTTP, URLRouter is for WebSocket.

### 6.12. `chat/admin.py`

```python
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
```

**Like previous lessons, the admin panel for management.**

---

## 7. Frontend Files — Line by Line

### 7.1. `vite.config.js` — the dev bridge

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
```

**Change from Lesson 14:** the `/ws` block was added. `ws: true` means "this path is WebSocket, upgrade it."

**In production**, Nginx plays this role with `Upgrade` headers.

### 7.2. `src/api.js` — the only connection point + auto-refresh

```js
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Request: attach token automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: on 401, refresh once and retry
let refreshPromise = null
function handleAuthFailure() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  window.location.reload()
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    if (status === 401 && !original._retry && !original.url.includes('/auth/refresh')) {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        handleAuthFailure()
        return Promise.reject(error)
      }
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post('/api/auth/refresh/', { refresh })
            .finally(() => { refreshPromise = null })
        }
        const { data } = await refreshPromise
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        handleAuthFailure()
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

// API surface
export const authApi = {
  register: async (username, password) => {
    const res = await api.post('/auth/register/', { username, password })
    return res.data
  },
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    return res.data
  },
}

export const roomApi = {
  list: async () => {
    const res = await api.get('/rooms/')
    return res.data
  },
  create: async (name) => {
    const res = await api.post('/rooms/', { name })
    return res.data
  },
}

export const messageApi = {
  list: async (roomSlug) => {
    const res = await api.get(`/rooms/${roomSlug}/messages/`)
    return res.data
  },
}
```

**Key sections:**

**1. Request interceptor:** reads the token from localStorage and attaches it to the `Authorization` header. **You no longer need to pass `token` to every function.**

**2. Response interceptor:** if the response is `401` (expired token), refresh once and retry the request.

**3. `refreshPromise`:** if 5 requests simultaneously get a `401`, **only one** refreshes and the rest wait for the same promise. **This prevents a very common bug:** multiple simultaneous refreshes causing race conditions.

**Why does this matter?** Because `ACCESS_TOKEN_LIFETIME` is one hour. Without the interceptor, **after one hour the user is silently logged out and doesn't know why.** We experienced this and added the fix.

### 7.3. `src/components/Auth.jsx`

A simple login/register form. Like previous lessons. Passes the received token to `App`.

### 7.4. `src/components/RoomsList.jsx`

Room list + create form. Uses `roomApi`. **No `token` passed** — the interceptor adds it.

### 7.5. `src/components/ChatRoom.jsx` — the heart of the frontend WebSocket

```jsx
export default function ChatRoom({ room, username, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // 1. Load history via HTTP
  useEffect(() => {
    messageApi.list(room.slug).then((data) => setMessages(data.results || data))
  }, [room.slug])

  // 2. Connect WebSocket
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/chat/${room.slug}/?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, {
        id: data.id,
        content: data.message,
        author: { username: data.author },
        created_at: data.created_at,
      }])
    }

    return () => ws.close()
  }, [room.slug])

  // 3. Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ message: text }))
    setInput('')
  }

  return ( /* form + message list + connection status */ )
}
```

**Three important things:**

**1. The URL:**

```js
const url = `${protocol}//${window.location.host}/ws/chat/${room.slug}/?token=${token}`
```

- `protocol` = `ws:` or `wss:` (based on HTTP/HTTPS)
- `host` = `127.0.0.1:8090` (the frontend domain — Nginx forwards `/ws/` to backend)
- `token` = from localStorage

**2. History via HTTP, new messages via WebSocket**

This is a very important pattern:

- **History** is fetched with `GET /api/rooms/{slug}/messages/` (HTTP)
- **New messages** arrive via WebSocket

**Why?** Because history may be thousands of messages, while WebSocket is only appropriate for messages **from now on**.

**3. `useEffect` cleanup**

`return () => ws.close()` — when the component is unmounted, closes the WebSocket. **Without this, every time the user switches rooms, an orphan connection is left behind.**

---

## 8. Docker Files — The Heart of the Project

### 8.1. `backend-django/Dockerfile`

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 gosu \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN mkdir -p /app/staticfiles \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
```

**Golden note:** this Dockerfile is used for **both** `backend` **and** `migrate`. Only `command` in `compose.yaml` differs.

**Key difference from Lesson 14:**

```dockerfile
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]   ← Lesson 14
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]  ← this lesson
```

- **Gunicorn** is WSGI only → HTTP only → ❌ cannot understand WebSocket
- **Daphne** is ASGI → HTTP + WebSocket → ✅

**The rest of the Dockerfile (libpq5, gosu, useradd, chown) is identical to Lesson 14.** If you don't remember them, revisit Lesson 14.

### 8.2. `entrypoint.sh`

```sh
#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
    echo "Fixing volume permissions..."
    chown -R appuser:appuser /app/staticfiles
    exec gosu appuser "$0" "$@"
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting: $*"
exec "$@"
```

**Exactly the same entrypoint as Lesson 14.** Why? Because:

- We have the same permission problem on the `static_files` volume
- We have the same `migrate`-before-server problem
- We have the same `collectstatic` need for admin CSS

**This is an important lesson:** the pattern for solving the problem is protocol-agnostic. The problem is not WebSocket; the problem is **volumes** and **migrate** — both solved in Lesson 14.

### 8.3. `frontend-react/Dockerfile` — Multi-stage

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Exactly the same pattern as Lessons 13 and 14.** Final image ~50 MB.

### 8.4. `nginx.conf` — the most important difference in this lesson

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;
    client_max_body_size 20M;

    root /usr/share/nginx/html;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ⭐⭐⭐ this block is the WebSocket key ⭐⭐⭐
    location /ws/ {
        proxy_pass http://backend;

        # three critical lines
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # long-lived connection — raise timeouts
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        access_log off;
    }
}
```

**The three critical lines for WebSocket:**

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**Why these three lines?**

- The browser sends an HTTP request for WebSocket with the header `Upgrade: websocket`
- It is an "invitation to upgrade": "Hey server, convert this HTTP into WebSocket"
- Nginx **by default** does not forward this header — it tells the backend "just a normal HTTP request"
- Result: the backend responds as normal HTTP, and WebSocket closes
- With these three lines: Nginx forwards the header, the backend accepts the upgrade, and the two-way tunnel opens

**`proxy_read_timeout 3600s`:** without this, the connection is closed after 60 seconds (Nginx default). 3600 seconds (one hour) is enough.

**Difference with `/api/`:** `location /api/` only has `proxy_pass`, no Upgrade. **Why?** Because HTTP doesn't need upgrade. If you add `Upgrade` to `/api/`, Nginx gets confused.

### 8.5. `compose.yaml` — the orchestrator

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-chatflow}
      POSTGRES_USER: ${POSTGRES_USER:-chatflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatflow_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-chatflow} -d ${POSTGRES_DB:-chatflow}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  migrate:
    build:
      context: ./backend-django
    command: python manage.py migrate --noinput
    environment: &django_env
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1,backend}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8090}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8090}
      POSTGRES_DB: ${POSTGRES_DB:-chatflow}
      POSTGRES_USER: ${POSTGRES_USER:-chatflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatflow_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy

  backend:
    build:
      context: ./backend-django
    environment: *django_env
    volumes:
      - static_files:/app/staticfiles
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 20s
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8090:80"
    volumes:
      - static_files:/app/staticfiles:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
```

**Differences from Lesson 14:**

- **`worker` removed** — this project has no Celery
- **Same `&django_env` and `*django_env`** — one env for two services (migrate, backend)
- **Same `static_files` volume** — shared between backend and frontend
- **Same `depends_on` and `healthcheck`** — same order

**So what changed?** Only:

1. `redis` is now the Channel Layer (role changed, but image is the same)
2. `backend` now runs Daphne (via `CMD` in the Dockerfile)
3. `worker` was removed

**This is an important lesson:** most of the compose file is copied from Lesson 14. **The Docker mindset means this:** patterns repeat. If you learn them once, next time you only adjust the differences.

---

## 9. WebSocket Flow — Start to Finish

Let's walk the whole path once.

### Step 1 — The user logs in

- The user opens `http://127.0.0.1:8090/` in the browser
- Fills in the form and clicks "Register"
- `POST /api/auth/register/` ← Nginx ← Django
- `POST /api/auth/login/` ← Nginx ← Django
- Django returns two tokens: `access` (1 hour) and `refresh` (7 days)
- The frontend stores them in `localStorage`

### Step 2 — The user enters a room

- React clicks on a room
- **First**, fetch history with `GET /api/rooms/{slug}/messages/` (HTTP)
- **Then** open WebSocket: `ws://.../ws/chat/{slug}/?token=<access>`
- Nginx forwards the `Upgrade` headers
- `JWTAuthMiddleware` validates the token
- `ChatConsumer.connect()` runs
- The user is added to the `chat_{slug}` group in Redis
- `accept()` — connection established ✅

### Step 3 — The user sends a message

- The user presses Enter
- React: `ws.send(JSON.stringify({ message: "Hello!" }))`
- `ChatConsumer.receive()` runs
- The message is saved to PostgreSQL
- **`group_send()`** to the `chat_{slug}` group — this is the key line

### Step 4 — Redis fans out the message

- Redis sends the message to every consumer that is a member of `chat_{slug}`
- **Even if `alice` and `bob` are on two different servers**, it still works
- This means **scalability:** you can have 100 servers, all with the same Redis

### Step 5 — Everyone sees the message

- Each `ChatConsumer` calls `chat_message()`
- Forwards the message to that user's WebSocket
- React adds the message to the list
- **No refresh is needed** ✅

**The whole thing:**

```text
React ──► Nginx ──► Daphne ──► PostgreSQL (store)
                        │
                        └──► Redis (fanout) ──► all Consumers ──► all browsers
```

---

## 10. Running It

From inside `15-chat/`:

```bash
docker compose up --build
```

**Expected:**

```text
 ✔ Container 15-chat-db-1        Healthy
 ✔ Container 15-chat-redis-1     Healthy
 ✔ Container 15-chat-migrate-1   Exited (0)
 ✔ Container 15-chat-backend-1   Healthy
 ✔ Container 15-chat-frontend-1  Started
```

**`migrate` with `Exited (0)` = good.** (Remember why.)

**Important backend logs:**

```text
backend-1  | Starting: daphne -b 0.0.0.0 -p 8000 config.asgi:application
backend-1  | INFO     Listening on TCP address 0.0.0.0:8000
```

**`Daphne` in the logs means it started correctly.** ✅

---

## 11. Testing

### Test 1 — Health endpoint

```text
http://127.0.0.1:8090/health/
```

**Expected:** `{"status": "ok"}`

### Test 2 — Home page

```text
http://127.0.0.1:8090/
```

**Expected:** the login form titled "ChatFlow".

### Test 3 — Register the first user

- Username: `alice`
- Password: `alicepass123`

**Expected:** lands on the room list page.

### Test 4 — Create a room

- New room name: `general`

**Expected:** the room `#general` with `0 messages`.

### Test 5 — Enter the room

Click `#general`.

**Expected:**
- Header: `#general  ● connected` (green)
- Text: `No messages yet. Say hi! 👋`

### Test 6 — Send a message

Message: `Hello world!`

**Expected:** the message appears on the right (blue).

### Test 7 — ⭐ Real WebSocket test (two browsers)

**This is the most important test in this lesson:**

1. Second browser (Incognito) → `http://127.0.0.1:8090/`
2. Register: `bob` / `bobpass123`
3. Enter the `#general` room
4. `bob` sends: `Hi alice!`

**What should happen?**

- `bob` sees his own message on the right (blue)
- `alice` (still in the first browser, still in the `general` room) sees `bob`'s message **without refreshing**
- And vice versa

**If this works, WebSocket is functioning correctly.** 🎉

### Test 8 — WebSocket logs

```bash
docker compose logs -f backend
```

After connecting, you should see:

```text
WSCONNECTING /ws/chat/general/
WSCONNECT /ws/chat/general/
```

**`WSCONNECT` means the connection is fully established.** ✅

### Test 9 — Redis channels

```bash
docker compose exec redis redis-cli PUBSUB CHANNELS
```

**Expected:**

```text
chat_general
```

This means Redis recognizes the `chat_general` group. ✅

---

## 12. Common Problems

### Problem 1 — WebSocket drops after a few seconds ⭐ the most important issue

**Cause:** `redis-py` version 8+ defaults to `socket_timeout=5`. `channels_redis` uses `BRPOP`, which is **blocking** and waits 5 seconds for a message. The two collide → `Timeout reading from redis:6379`.

**Symptom:** in the backend logs you see:

```text
redis.exceptions.TimeoutError: Timeout reading from redis:6379
```

**Fix:** in `settings.py`, put `socket_timeout` **inside each host**:

```python
'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}]
```

**Not** as a separate key:

```python
# ❌ wrong — raises: unexpected keyword argument 'socket_timeout'
'hosts': [env('REDIS_URL')],
'socket_timeout': 20,
```

**We hit this trap and found this fix.**

### Problem 2 — API requests return 401 after an hour

**Cause:** the access token expired (its lifetime is 1 hour). **The frontend has no auto-refresh interceptor.**

**Fix:** implement the interceptor in `api.js` (we did). If you still get 401, clear localStorage:

```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('username')
```

Then log in again.

### Problem 3 — `/health/` shows the React page

**Cause:** Nginx has no `location /health/` block.

**Fix:** check `nginx.conf`. It must have `proxy_pass http://backend`.

### Problem 4 — WebSocket handshake fails

**Cause:** Nginx is not forwarding the `Upgrade` and `Connection` headers.

**Fix:** the `/ws/` block in `nginx.conf` must include:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Problem 5 — `migrate` shows `Exited (0)`

**This is correct.** `migrate` is a one-shot service. It runs migrations and exits. `backend` waits for `service_completed_successfully`.

### Problem 6 — Port 8090 is already in use

```yaml
frontend:
  ports:
    - "127.0.0.1:8091:80"
```

Then use `http://127.0.0.1:8091`.

---

## 13. Summary

### What we learned

**1. Docker mindset — 8 questions:**

1. What are the parts? ← services
2. What does each need? ← Dockerfile or ready-made Image
3. How do they talk? ← Network + service name
4. What data must stay alive? ← Volume
5. What settings? ← Environment Variables
6. How to build? ← Single or Multi-stage
7. Startup order? ← depends_on + healthcheck
8. **What is the protocol?** ← HTTP or WebSocket? ⭐

**2. Three key changes when you have WebSocket:**

| # | What changes | Why |
|---|--------------|-----|
| 1 | **Daphne instead of Gunicorn** | Gunicorn is WSGI only (HTTP), Daphne is ASGI (HTTP + WS) |
| 2 | **Nginx Upgrade headers** | To convert HTTP into WebSocket |
| 3 | **JWT via query string** | The browser WebSocket cannot send headers |

**3. Redis has two roles:**

- In Lesson 14: Celery queue (messages for the worker)
- In Lesson 15: Channel Layer (messages for all consumers)
- **Same image, same config, different purpose — our code decides**

**4. WebSocket flow:**

```text
React ──► Nginx ──► Daphne ──► PostgreSQL (store)
                        │
                        └──► Redis (fanout) ──► all consumers ──► all browsers
```

**5. Nginx as the waiter:**

- `/api/` ← backend (HTTP)
- `/admin/` ← backend (HTTP)
- `/health/` ← backend (HTTP)
- `/static/` ← Django static files
- `/` ← React
- **`/ws/` ← backend (WebSocket + Upgrade)** ⭐

**6. Patterns shared with Lesson 14:**

- Multi-stage build (Node → Nginx)
- One-shot `migrate`
- `gosu` for volume permissions
- `&django_env` in compose
- `depends_on` + `healthcheck`

### The key takeaway of this lesson

**Docker mindset = 8 questions**

We added an eighth (protocol). For any project, first ask: "HTTP or WebSocket?" If WebSocket, change three things: the server, Nginx, and authentication.

**This is the most valuable thing this course gives you.**

### What comes next

**Lesson 16 — Bookmark Manager (Push/Pull to Docker Hub)**

A new project where:

- We build Images with tags
- Push them to Docker Hub
- Pull them from Docker Hub
- **Learn how to share Images**

And after that:

- **Lesson 17:** URL Shortener (CI/CD with GitHub Actions)
- **Lesson 18:** Portfolio (Deploy to VPS + SSL + Domain)
- **Lesson 19:** Vault (Security: Trivy, Secrets, Hardening)
- **Lesson 20:** Log Analyzer (Deep debugging)
- **Lesson 21:** Cheat Sheet + Docker Templates
- **Lesson 22:** Wrap-up + Roadmap

