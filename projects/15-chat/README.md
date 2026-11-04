[🇮🇷 فارسی](/projects/15-chat/README.fa.md)

# ChatFlow

> A fullstack real-time chat: React + Django Channels + WebSocket + Redis + PostgreSQL, all in Docker. Join a room and watch messages appear **without refreshing**.

---

## Overview

ChatFlow is a real-time chat application that demonstrates **WebSocket communication** in a realistic Docker setup. Users register, join chat rooms, and messages are broadcast **instantly** to everyone in the room — no polling, no refresh.

This is the reference project for **Lesson 15** of the Docker Zero to Hero course.

The key differences from previous lessons:

- **WebSocket instead of HTTP polling** — a persistent, bidirectional connection
- **Django Channels** — ASGI support in Django
- **Redis as Channel Layer** — broadcasts messages across connections
- **Daphne instead of Gunicorn** — ASGI server for WebSocket
- **Nginx with WebSocket support** — `Upgrade` and `Connection` headers
- **JWT for REST and WebSocket** — unified authentication

---

## Features

- **Register and login** with JWT (access + refresh)
- **Create rooms** and browse the room list
- **Real-time chat** over WebSocket
- **Message history** stored in PostgreSQL
- **Broadcast messages** to all room members via Redis Channel Layer
- **Auto-refresh JWT** — expired tokens are renewed automatically
- **Django admin** for managing rooms and messages
- **Multi-stage frontend build** — 10x smaller image
- **Runs on port 8090** so it can run alongside the other course projects

---

## Architecture

Five services work together:

```text
User ──► frontend (Nginx, port 8090)
            │
            ├──► /             ──► React static files
            ├──► /api/         ──► backend:8000 (Django REST)
            ├──► /admin/       ──► backend:8000 (Django admin)
            ├──► /health/      ──► backend:8000
            ├──► /static/      ──► static_files volume
            └──► /ws/          ──► backend:8000 (WebSocket → Daphne)
                        │
                        ▼
                ┌───────────────┐
                │   backend     │  (Django + Daphne)
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌────────┐    ┌──────────┐  ┌──────────┐
    │  db    │    │  redis   │  │ migrate  │
    │(postg.)│    │(channel  │  │(one-shot)│
    │        │    │ layer)   │  │          │
    └────────┘    └──────────┘  └──────────┘
```

| Service | Role | Port | Image |
|---------|------|------|-------|
| `db` | PostgreSQL 16 | internal | `postgres:16` |
| `redis` | Channel Layer for WebSocket | internal | `redis:7-alpine` |
| `migrate` | Runs migrations once, then exits | — | built from `./backend-django` |
| `backend` | Django + Daphne (ASGI: HTTP + WebSocket) | internal 8000 | built from `./backend-django` |
| `frontend` | React (built) + Nginx | **8090** (host) | built from `./frontend-react` |

> **Note about the port:** This project runs on port **8090**. The other course projects use 8000 (TaskFlow), 9000 (URL Monitor), 8080 (Photo Gallery), 3000 (Kanban Board), 8088 (Recipe Book), and 8089 (Task Runner). Unique ports mean all can run at the same time.

### Two volumes

| Volume | Written by | Read by | What it holds |
|--------|------------|---------|---------------|
| `postgres_data` | `db` | `db` | Database files |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) | Django admin CSS |

---

## The WebSocket Flow

This is what makes the project interesting. Let's trace what happens when a user sends a message:

1. The user types a message in React and presses Enter
2. React sends the message over WebSocket to `/ws/chat/{room}/?token=<JWT>`
3. Nginx forwards the request to Daphne with `Upgrade` headers
4. `JWTAuthMiddleware` validates the token and populates `scope['user']`
5. `ChatConsumer.receive()` receives the message
6. The message is saved to PostgreSQL
7. `channel_layer.group_send()` broadcasts the message to the `chat_<room>` group
8. Redis fans the message out to every consumer in that group
9. Each consumer sends the message over its own WebSocket to its own browser
10. All room members see the message **without refreshing**

**The key insight:** Django never blocks. WebSocket is a persistent connection, and messages are broadcast between all consumer instances via Redis.

### Why is `migrate` a separate service?

If `backend` and `migrate` were the same service, two processes would try to run migrations at the same time, causing conflicts. Instead, `migrate` is a **one-shot container** that runs migrations, exits successfully, and lets `backend` start.

That's why `docker compose ps -a` shows it as `Exited (0)` — this is correct behavior, not a failure.

---

## The Multi-stage Build (key concept)

The frontend Dockerfile uses **two stages**:

### Stage 1 — Build

```dockerfile
FROM node:22-alpine AS builder
# ... install deps, run `npm run build`
```

This stage contains Node.js, npm, and vite. It compiles React into static files in `/app/dist/`.

**~500 MB.**

### Stage 2 — Serve

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

This stage only has Nginx. It copies **only the `dist` folder** from stage 1.

**~50 MB.**

### Result

The final image is 10x smaller because it has no Node.js, no npm, no `node_modules`, and no source code. Just Nginx + static files.

Verify:

```bash
docker images | grep 15-chat
```

You should see the `frontend` image at around 50 MB.

---

## Why Daphne and not Gunicorn?

Gunicorn is a **WSGI** server and only understands HTTP. WebSocket is a different protocol. **Daphne** is an **ASGI** server that supports both HTTP and WebSocket.

In Lessons 09–14 we used Gunicorn because we only had HTTP. From this lesson onward, any project with WebSocket must use Daphne (or Uvicorn).

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/15-chat
```

### 2. Create the backend environment file

```bash
cp backend-django/.env.example backend-django/.env
```

### 3. Build and run everything

```bash
docker compose up --build
```

First build takes 3-5 minutes. Subsequent builds are cached.

### 4. Open the app

- **ChatFlow:** <http://127.0.0.1:8090/>
- **Admin panel:** <http://127.0.0.1:8090/admin/>
- **API:** <http://127.0.0.1:8090/api/rooms/>
- **Health check:** <http://127.0.0.1:8090/health/>

### 5. Create an admin user (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

### 6. Try it!

1. Register (e.g., `alice` / `alicepass123`).
2. Create a room (e.g., `general`).
3. Enter the room — you should see **● connected** (green).
4. In a second browser (Incognito), log in as a second user (`bob` / `bobpass123`).
5. Both join the `general` room.
6. Send a message from `alice` — it appears in `bob` **without refreshing**. 🎉

**Watch the logs in another terminal:**

```bash
docker compose logs -f backend
```

You will see:

```text
WSCONNECTING /ws/chat/general/
WSCONNECT /ws/chat/general/
```

---

## Project Structure

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
│   │   ├── asgi.py          ← ProtocolTypeRouter
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── chat/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── consumers.py      ← ChatConsumer (WebSocket)
│       ├── middleware.py     ← JWTAuthMiddleware
│       ├── models.py         ← Room, Message
│       ├── routing.py        ← websocket_urlpatterns
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

There is a single `.gitignore` at the repository root covering all projects.

---

## Environment Variables

Defined in `backend-django/.env` (see `.env.example`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | — (required) |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1,backend` |
| `CORS_ALLOWED_ORIGINS` | React origins | `http://localhost:5173,http://localhost:8090` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for POST | `http://localhost:5173,http://localhost:8090` |
| `POSTGRES_DB` | Database name | `chatflow` |
| `POSTGRES_USER` | Database user | `chatflow` |
| `POSTGRES_PASSWORD` | Database password | `chatflow_dev_password` |
| `POSTGRES_HOST` | Database host | `localhost` (in `.env`), `db` (in compose) |
| `POSTGRES_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` (in `.env`), `redis://redis:6379/0` (in compose) |

**Never commit `.env`.**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register a new user |
| POST | `/api/auth/login/` | Login, get `access` and `refresh` |
| POST | `/api/auth/refresh/` | Renew access token |
| GET | `/api/auth/me/` | Current user info |
| GET | `/api/rooms/` | List rooms |
| POST | `/api/rooms/` | Create a new room |
| GET | `/api/rooms/{slug}/` | Room detail |
| GET | `/api/rooms/{slug}/messages/` | Message history |
| GET | `/health/` | Health check |
| GET | `/admin/` | Django admin panel |

### WebSocket

```text
ws://127.0.0.1:8090/ws/chat/{room_slug}/?token=<access_token>
```

**Message format (client → server):**

```json
{ "message": "Hello world!" }
```

**Message format (server → client):**

```json
{
  "id": 1,
  "message": "Hello world!",
  "author": "alice",
  "created_at": "2026-11-04T12:00:00Z"
}
```

### Example: register and login

```bash
# Register
curl -X POST http://127.0.0.1:8090/api/auth/register/ \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "alicepass123"}'

# Login
curl -X POST http://127.0.0.1:8090/api/auth/login/ \
  -H "Content-Type: application/json" \
  -d '{"username": "alice", "password": "alicepass123"}'
```

Response:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

---

## Development Mode (without Docker)

### Backend

```bash
cd backend-django
python -m venv .venv
source .venv/bin/activate        # or: .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Start PostgreSQL and Redis locally, then:
python manage.py migrate
python manage.py runserver
```

Runs at <http://localhost:8000/>.

> Because `daphne` is in `INSTALLED_APPS`, `runserver` automatically serves ASGI (WebSocket) too.

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Runs at <http://localhost:5173/>. Vite's proxy forwards `/api` and `/ws` to `localhost:8000`.

---

## Common Commands

```bash
# Build and start everything
docker compose up --build

# See service status (including migrate's exit code)
docker compose ps -a

# Follow backend logs (WebSocket handshakes appear here)
docker compose logs -f backend

# Open a shell in the backend
docker compose exec backend bash

# Open psql
docker compose exec db psql -U chatflow -d chatflow

# Inspect Redis channels (see active rooms)
docker compose exec redis redis-cli PUBSUB CHANNELS

# Stop (keeps volumes)
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

---

## Troubleshooting

### Problem 1 — WebSocket disconnects after a few seconds

**Cause:** `redis-py` 8+ defaults `socket_timeout` to 5 seconds, while `channels_redis` uses a blocking 5-second wait for messages. The overlap causes `Timeout reading from redis:6379`.

**Fix:** In `settings.py`, set `socket_timeout` inside each host (not as a separate key):

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}],
        },
    },
}
```

### Problem 2 — API requests return 401

**Cause:** The access token has expired (1-hour lifetime) and the frontend has no refresh mechanism.

**Fix:** In `api.js`, add an auto-refresh interceptor (implemented in this project). If you still get 401, clear localStorage and log in again:

```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('username')
```

### Problem 3 — `/health/` shows the React page

**Cause:** Nginx has no `location /health/` block.

**Fix:** Add to `frontend-react/nginx.conf`:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### Problem 4 — WebSocket handshake fails

**Cause:** Nginx is not passing the `Upgrade` and `Connection` headers.

**Fix:** The `/ws/` block in `nginx.conf` must include:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### Problem 5 — `migrate` service shows `Exited (0)`

**This is correct.** The `migrate` service runs migrations once and exits. It is a **one-shot container**, not a long-running service.

### Problem 6 — Port 8090 is already in use

Change the host port:

```yaml
frontend:
  ports:
    - "127.0.0.1:8091:80"
```

Then use `http://127.0.0.1:8091`.

---

## Running Alongside Other Projects

Port assignments for the course:

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| 13 | Recipe Book | 8088 |
| 14 | Task Runner | 8089 |
| **15** | **ChatFlow** | **8090** |

All can run at once. Each is independent; stopping one does not affect the others.

---

## Production Notes

Before deploying to production:

- [ ] Set `DEBUG=False`
- [ ] Use a real `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your real domain
- [ ] Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to `https://yourdomain.com`
- [ ] Use HTTPS (Nginx with a Let's Encrypt certificate) — for WebSocket, use `wss://`
- [ ] Configure Nginx to forward the `Upgrade` header (already done)
- [ ] Consider `uvloop` for Daphne (optional, faster)
- [ ] Configure backups for `postgres_data`
- [ ] Use a secret-management system for credentials
- [ ] Consider moving `static_files` to object storage (S3) for multi-server deployments

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 15 — Real-time with WebSocket + Channels + Redis**](/en/15-chat/README.md)

---

## License

MIT
