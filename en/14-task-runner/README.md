[🇮🇷 فارسی](/fa/14-task-runner/README.md)

# Lesson 14 — Fullstack with Celery: Task Runner

## Introduction

We have now gone through 13 lessons and built five projects. It is time to bring together **everything we have learned** into a more realistic project.

In this lesson:

- We revisit **Django** (from Lesson [09](/en/09-django-docker/README.md))
- We revisit **Celery and Redis** (from Lesson [10](/en/10-celery-redis/README.md))
- We revisit **Nginx** (from Lesson [11](/en/11-nginx/README.md))
- We revisit **React and Multi-stage Build** (from Lesson [13](/en/13-fullstack/README.md))

And we combine all of them into a single project called **Task Runner**.

### Why is this lesson important?

Every project so far showed one corner of the Docker world. But real projects have **everything at once**. If you want to Dockerize a real project, you need to be able to put all these pieces together.

**The main goal of this lesson is this:** after this lesson, when you face a real project, you will know where to start and how to Dockerize it.

This is the most valuable thing this course gives you.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Launch a six-service project with Docker Compose
- Explain why `migrate` must be a separate service
- Explain how `backend` and `worker` can share one Image
- Explain how a background task runs from start to finish
- Have the **Docker mindset**: look at any project and know how to Dockerize it

---

## 1. First, What Are We Building?

### The Story

Imagine you need to do heavy work. For example, processing thousands of data records that takes 10 seconds.

If you do this work **inside** Django, the user has to wait 10 seconds for a response. That is bad.

**The solution:** Django only **accepts** the request and **puts a message** in a queue. A separate worker (Celery Worker) picks the message up and processes it. Django **immediately** tells the user: "Alright, it is in the queue. Go do your thing, I will let you know when it is done."

**Task Runner** implements this pattern:

1. The user creates a task (title, description, email)
2. The task is saved with status `pending` (waiting)
3. Django puts a message in the Redis queue
4. The Celery Worker picks up the message
5. Status becomes `pending` → `processing`
6. The worker "works" for 10 seconds (simulated)
7. Status becomes `processing` → `done`
8. React refreshes the page every 2 seconds and the **user sees** the status change

**Important note:** This project does not do real work (it just sleeps for 10 seconds). But the Docker pattern around it is **fully real**. If you later want to send a real email or generate a PDF instead of `sleep`, you only change the function. The Docker setup stays untouched.

---

## 2. Quick Recap of Previous Concepts

Before we start, let me **re-explain simply** a few key concepts. If you remember them, this is a quick review. If not, you will learn them right here.

### What is a Container?

A **Container** is an isolated box that runs a program inside it. Like an aquarium where fish live, without mixing with the outside.

Each container:

- has its own files
- has its own packages
- has its own configuration
- is isolated from other containers

**Why does it matter?** Because you can run several different programs side by side, without them interfering.

### What is an Image?

An **Image** is a **template** for building a Container. Like a cake recipe.

- Image = recipe
- Container = baked cake

From one Image, you can build **many** containers. Like from one recipe you can bake many cakes.

### What is a Volume?

A **Volume** is a **storage space outside the container**.

Imagine a container is a rented room. When you return the room, everything you put in it is gone. But if you put your things in a warehouse outside the room, you can retrieve them later.

**Volume = the warehouse outside the room.**

Most important use case: databases. If you delete the database container without a Volume, all data is gone. With a Volume, the data stays.

### What is a Network?

A **Network** is a **private network** between containers.

Imagine several rooms and a hallway between them. Containers talk to each other through this hallway.

**Important note:** Within a Network, each container is identified by **its service name**. That means if you have a service called `db`, others can reach it using `db` (like calling out a name in the hallway).

### What is Compose?

**Compose** is a file (`compose.yaml`) that defines all services together. Instead of writing dozens of `docker run` commands, you write everything in one file and run them with one command:

```bash
docker compose up
```

### What is Celery?

**Celery** is a Python library that runs jobs **in the background**.

Like a restaurant:

- **Waiter** (Django) takes the order and puts it in a queue
- **Chef** (Celery Worker) picks orders from the queue and cooks
- The waiter **immediately** tells the customer "Your order is registered", without waiting for the food

### What is Redis?

**Redis** is a separate program whose job is to **hold messages** in a queue.

Django puts messages in Redis. The Celery Worker reads from Redis. Redis is like a **shared mailbox** between them.

---

## 3. The Most Important Part — Docker Mindset

Read this section **carefully**. If you only remember this section, you can Dockerize any project.

### The 7 Questions of Docker Mindset

Whenever you face any project, ask these 7 questions. The answers will define everything.

---

#### ❓ Question 1 — How many "parts" does this project have?

Look at the project. How many **independent parts** does it have?

- Does it have a **Frontend**? (React, Vue, HTML)
- Does it have a **Backend**? (Django, Node.js, Spring)
- Does it have a **Database**? (PostgreSQL, MySQL)
- Does it have a **Cache or Queue**? (Redis, RabbitMQ)
- Does it have a **Background Worker**? (Celery, Sidekiq)
- Does it have a **Reverse Proxy**? (Nginx, Traefik)

**Golden rule:** Each independent part = one service = one container.

**Why?** Because each part has its own lifecycle and its own needs. If you put them all in one container, one crash takes down everything.

**For the Task Runner project:**

| Part | Container |
|------|-----------|
| Frontend (React) | `frontend` |
| Backend (Django) | `backend` |
| Database (PostgreSQL) | `db` |
| Queue (Redis) | `redis` |
| Worker (Celery) | `worker` |
| Migrations (one-shot) | `migrate` |

**Six services.**

---

#### ❓ Question 2 — What does each part need to run?

Examine each part separately:

- **Which language and version?** (Python 3.12, Node.js 22)
- **Which packages?** (Django, Celery, axios)
- **Or is there an existing Image?** (`postgres:16`, `redis:7-alpine`, `nginx:1.27-alpine`)

**Rule:** If an Image exists, use it (it is tested and secure). If not, **write a Dockerfile yourself**.

**For the Task Runner project:**

| Service | What it needs |
|---------|----------------|
| `backend` | Python 3.12 + Django + packages → **Dockerfile** |
| `worker` | **Same as backend** (only `command` differs) → **uses backend's Image** |
| `frontend` | Node.js (build) + Nginx (serve) → **Multi-stage Dockerfile** |
| `db` | Ready-made Image `postgres:16` |
| `redis` | Ready-made Image `redis:7-alpine` |
| `migrate` | **Same as backend** (only `command` differs) |

**Golden tip:** `worker` does not need its own Dockerfile! Its packages and code are identical to `backend`. Only the command that runs differs. This is a big savings.

---

#### ❓ Question 3 — How do these parts talk to each other?

Draw a mental diagram:

- Does Backend need to reach Database? → via **service name** `db`
- Does Backend need to reach Redis? → via **service name** `redis`
- Does Frontend need to reach Backend? → via **Nginx proxy**

**Rule:** All these connections are **internal**. Only Frontend is reachable from the outside.

**For the Task Runner project:**

```text
User ──► frontend (port 8089, from outside)
            │
            ├──► /api/  ──► backend:8000 (internal)
            │
backend ──► db (internal, via name db)
backend ──► redis (internal, via name redis)
worker  ──► db (internal)
worker  ──► redis (internal)
```

**Result:** Only one service is visible from outside (`frontend`). The rest are **not reachable** from outside, which improves **security**.

---

#### ❓ Question 4 — What data must **stay alive**?

This is the most important question after Question 1. Ask: "If I delete the container, what should not be lost?"

Answer: you need a **Volume**.

**For the Task Runner project:**

| Data | Volume |
|------|--------|
| PostgreSQL data | `postgres_data` |
| Django static files (admin CSS) | `static_files` |
| Source code | **No** (baked into the Image) |
| Redis data | **No** (optional, since tasks are transient) |

**Why doesn't Redis need a Volume?** Because tasks are transient. If Redis restarts and queued tasks are lost, it is not catastrophic (users can create them again). But for the database, **all** user data matters.

---

#### ❓ Question 5 — What settings must be **changeable**?

Ask: "What things do I need to change without touching code?"

- **Database password** (because it is more secure in production)
- **Django secret key** (because it should not be in code)
- **Redis address** (because it differs between Docker and dev)

**Result:** Put all these in `.env` and pass them as **environment variables**.

**Important rule:** Anything that is a **password** or **address** must be in `.env`. Never write it in code.

---

#### ❓ Question 6 — How should it be built?

**Single-stage**: if it is just "install and run". Like Django.

```dockerfile
FROM python:3.12-slim
COPY . .
RUN pip install -r requirements.txt
CMD ["gunicorn", ...]
```

**Multi-stage**: if there is a **build** step that requires special tools. Like React, which must be built with Node.js.

```dockerfile
# Stage 1: Build
FROM node:22-alpine AS builder
RUN npm run build

# Stage 2: Serve
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**For the Task Runner project:**

| Service | Build type |
|---------|------------|
| `backend` | Single-stage |
| `worker` | **Uses backend's Image — no separate build** |
| `frontend` | **Multi-stage** (Node.js → Nginx) |
| `db` | Ready-made |
| `redis` | Ready-made |
| `migrate` | **Uses backend's Image** |

---

#### ❓ Question 7 — What is the startup order?

Some services must be ready **before** others:

- The database must be ready **first**
- Migrations must run **after** the database
- Backend must start **after** migrations
- Worker must start **after** migrations and Redis
- Frontend must start **after** Backend

**Result:** Use `depends_on` with `condition`.

**For the Task Runner project:**

```text
1. db (healthcheck)
2. redis (healthcheck)
3. migrate (waits for db)
4. backend (waits for migrate + redis)
5. worker (waits for migrate + redis)
6. frontend (waits for backend)
```

---

### 🎯 Remember the Docker mindset

Whenever you get stuck, ask these 7 questions. **You will always find an answer.**

This is the main asset of this course.

---

## 4. Project Architecture

Now that we have answered the 7 questions, let's see the final architecture:

```text
┌─────────────────────────────────────────────────────┐
│                     User                            │
│              (browser on your machine)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             frontend (Nginx, port 8089)             │
│                                                     │
│  Address book:                                      │
│  /            ──►  React static files               │
│  /api/        ──►  backend:8000                     │
│  /admin/      ──►  backend:8000                     │
│  /health/     ──►  backend:8000                     │
│  /static/     ──►  static_files volume              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               backend (Django + Gunicorn)           │
│                    port 8000                        │
└──────┬───────────────────────────────────┬──────────┘
       │                                   │
       ▼                                   ▼
┌──────────────┐                   ┌──────────────────┐
│      db      │                   │      redis       │
│  PostgreSQL  │                   │  (message queue) │
└──────────────┘                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │     worker       │
                                   │  (Celery)        │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                      (connects to db)
```

**Six services, each with a role.**

**Course ports:**

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| 13 | Recipe Book | 8088 |
| **14** | **Task Runner** | **8089** |

**Why 8089?** Because 8088 belongs to Lesson 13. **Each project must have a unique port** so they can all run at the same time.

---

## 5. Directory Structure

```text
14-task-runner/
├── compose.yaml              ← wires everything together
├── README.md
├── README.fa.md
├── backend-django/           ← Django backend
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── gunicorn.conf.py
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py
│   │   ├── celery.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── tasks.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           ├── __init__.py
│           └── 0001_initial.py
└── frontend-react/           ← React frontend
    ├── .dockerignore
    ├── Dockerfile
    ├── nginx.conf
    ├── index.html
    ├── package.json
    ├── package-lock.json
    ├── vite.config.js
    ├── eslint.config.js
    ├── public/
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Header.jsx
            ├── TaskForm.jsx
            ├── TaskCard.jsx
            └── Loading.jsx
```

**A single `.gitignore` at the repository root** covers all projects. That is why each project does not have its own `.gitignore`.

---

## 6. Backend Files — Line by Line

### 6.1. `requirements.txt`

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
django-cors-headers==4.6.0
celery==5.4.0
redis==5.2.1
```

**What is each package?**

| Package | Its job |
|---------|---------|
| **Django** | Backend framework |
| **djangorestframework** | For building APIs |
| **psycopg[binary]** | PostgreSQL driver |
| **django-environ** | Reading `.env` |
| **gunicorn** | Python web server (for production) |
| **django-cors-headers** | Allow requests from React |
| **celery** | **New: background jobs** |
| **redis** | **New: Redis client for Celery** |

**Note:** We removed `Pillow` because this project does not upload images. We only keep what we actually need. This is an important principle: smaller image, faster, more secure.

### 6.2. `.env.example`

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (for React)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8089
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8089

# PostgreSQL
POSTGRES_DB=taskrunner
POSTGRES_USER=taskrunner
POSTGRES_PASSWORD=taskrunner_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis / Celery
REDIS_URL=redis://localhost:6379/0
```

**Why `POSTGRES_HOST=localhost` in `.env` but `db` in `compose.yaml`?**

Because in `.env`, it is set for **local** execution (outside Docker). In `compose.yaml`, for **inside Docker**, we use `db` (the database service name). `compose.yaml` overrides this value.

**Why `REDIS_URL` the same way?**

- In `.env`: `redis://localhost:6379/0` (for local execution)
- In `compose.yaml`: `redis://redis:6379/0` (because the service name is `redis`)

### 6.3. `config/settings.py` — the important parts

```python
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    # ... Django and packages
    'rest_framework',
    'corsheaders',
    'tasks',
]

MIDDLEWARE = [
    # ... 
    'corsheaders.middleware.CorsMiddleware',  # before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ...
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        # ...
    }
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[...])
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[...])

# Celery settings
CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60
```

**The most important changes from Lesson 13:**

- **`CELERY_BROKER_URL`** — tells Celery where Redis is
- **`CELERY_RESULT_BACKEND`** — stores each task's result in Redis
- **`CELERY_TASK_TIME_LIMIT = 60`** — each task has at most 60 seconds. If it takes longer, Celery kills it. This is an important **safety net**.

**Why is `CELERY_TASK_TIME_LIMIT` important?**

Imagine a task that sleeps forever (e.g., calls an API that never responds). Without a time limit, that worker is locked forever and cannot run any other task.

With a 60-second limit, Celery kills any stuck process every 60 seconds. The worker stays free for others.

### 6.4. `config/celery.py` — the heart of the Worker

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('taskrunner')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

**Line by line:**

**`os.environ.setdefault(...)`** — tells Celery to read Django settings from `config.settings`.

**`app = Celery('taskrunner')`** — creates a Celery instance. The name is only used in logs.

**`app.config_from_object('django.conf:settings', namespace='CELERY')`** — tells Celery: "go into Django settings, read every key that starts with `CELERY_`, and treat them as your own settings".

This means:

- `CELERY_BROKER_URL` in `settings.py` → becomes `CELERY_BROKER_URL` in Celery
- `CELERY_RESULT_BACKEND` in `settings.py` → becomes `CELERY_RESULT_BACKEND` in Celery

**`app.autodiscover_tasks()`** — tells Celery: "in every Django app (listed in `INSTALLED_APPS`), if there is a file named `tasks.py`, discover its tasks".

**Result:** We create a `tasks/tasks.py` that contains the main task. Celery finds it automatically.

### 6.5. `config/__init__.py`

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

**Why is this line important?**

When Django starts, the first thing it does is execute `config/__init__.py`. This file prepares Celery **before anything else**.

Without this line, Celery might wake up later and fail to recognize some tasks.

**Translated into plain words:** "Hey Django, when you wake up, wake Celery first, then do the rest."

### 6.6. `tasks/models.py`

```python
from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        DONE = 'done', 'Done'
        FAILED = 'failed', 'Failed'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    result = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

**What is each field?**

| Field | Meaning |
|-------|---------|
| `title` | Task title |
| `description` | Description (optional) |
| `email` | User's email (optional) |
| `status` | Task status: pending / processing / done / failed |
| `result` | Processing result (filled when `done`) |
| `created_at` | Creation date (automatic) |
| `updated_at` | Last update date (automatic) |

**`class Status(models.TextChoices)`** — a Django pattern for defining fixed choices. This way, instead of writing `'pending'`, we use `Task.Status.PENDING`. If we ever want to rename it, everything updates automatically.

### 6.7. `tasks/serializers.py`

```python
from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'email',
            'status', 'status_display', 'result',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'result', 'created_at', 'updated_at']
```

**What is a serializer?**

Remember: a **translator** between Python objects and JSON.

- **Output:** Task object (Python) → JSON (for React)
- **Input:** JSON (from React) → Task object (to save in DB)

**`status_display`** — this field is not in the database. It is a computed field returning `"Pending"` (capital P), not `"pending"`. So React does not have to build labels itself.

**`read_only_fields`** — `status` and `result` are read-only. That means the user cannot create a task and set `status: "done"`. They are filled **only after** processing, by Celery.

### 6.8. `tasks/tasks.py` — the heart of the project

```python
import time
from celery import shared_task
from .models import Task


PROCESSING_SECONDS = 10


@shared_task
def process_task(task_id: int) -> str:
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return f"Task {task_id} not found"

    task.status = Task.Status.PROCESSING
    task.save(update_fields=['status', 'updated_at'])

    time.sleep(PROCESSING_SECONDS)

    task.status = Task.Status.DONE
    task.result = f"Processed '{task.title}' successfully."
    task.save(update_fields=['status', 'result', 'updated_at'])

    return f"Task {task_id} done"
```

**Line by line:**

**`@shared_task`** — a decorator. Tells Celery: "this function is a Celery task. From anywhere you call it, run it in a worker."

**`Task.objects.get(id=task_id)`** — fetches the task from the database. Django sends an `id` to the task, and the task uses that ID to find the task.

**`task.status = Task.Status.PROCESSING`** — changes status to `processing`. React sees this on the next poll.

**`task.save(update_fields=[...])`** — updates only the specified fields. This is an optimization: instead of rewriting the whole row, it writes only what changed.

**`time.sleep(PROCESSING_SECONDS)`** — sleeps for 10 seconds. **This is where real work would happen.** If you later want to send an email, replace this line with email code.

**`task.status = Task.Status.DONE`** — changes status to `done`.

**`task.result = f"Processed '{task.title}' successfully."`** — fills the result. React displays this text.

**`return f"Task {task_id} done"`** — this string appears in worker logs. Great for debugging.

### 6.9. `tasks/views.py`

```python
from rest_framework import mixins, viewsets
from .models import Task
from .serializers import TaskSerializer
from .tasks import process_task


class TaskViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        task = serializer.save()
        process_task.delay(task.id)
```

**This file is the bridge between the API and Celery. The most important part:**

**`mixins.CreateModelMixin`** — creates the `POST` endpoint (create task).
**`mixins.ListModelMixin`** — creates `GET /api/tasks/` (list).
**`mixins.RetrieveModelMixin`** — creates `GET /api/tasks/{id}/` (retrieve one).

**Why not use the full `ModelViewSet`?**

Because in this project, the user should not be able to **edit** or **delete** tasks. Only create and view. So we only use three of the seven mixins.

**`perform_create(self, serializer)`** — **the most important line.**

- `serializer.save()` saves the task to the database
- **`process_task.delay(task.id)`** — this is the **magic** line

**What exactly does `process_task.delay(...)` do?**

- It does **not** execute `process_task`
- It puts a **message** in the Redis queue that says "run this task with this `task_id`"
- **Immediately** returns (without waiting)

That means Django responds to the user in milliseconds, even if the processing takes 10 seconds.

**Why `delay()` and not a direct call?**

If we called `process_task(task.id)` directly, it would run **inside Django** and the user would wait 10 seconds. With `.delay()`, it runs **inside a separate worker**.

### 6.10. `tasks/urls.py`

```python
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = router.urls
```

**DRF automatically generates these paths:**

- `GET /api/tasks/`
- `POST /api/tasks/`
- `GET /api/tasks/{id}/`

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
    path('api/', include('tasks.urls')),
]
```

**Three paths:**

- `/admin/` — admin panel
- `/health/` — health endpoint (for Docker healthcheck)
- `/api/` — the API

### 6.12. `tasks/admin.py`

```python
from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'status', 'email', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('title', 'description', 'email')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
```

**Admin panel settings:**

- **`list_display`** — which columns appear in the list
- **`list_filter`** — filter by status
- **`search_fields`** — search
- **`date_hierarchy`** — filter by date
- **`readonly_fields`** — `created_at` and `updated_at` are read-only

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
    },
  },
})
```

**This file plays the "waiter" role, like in Lesson 13.**

In dev, React runs on `5173`, Django on `8000`. Vite sets up a **proxy**:

- React sends a request to `/api/tasks/` (relative path)
- Vite catches it, forwards it to `http://localhost:8000/api/tasks/`
- From the browser's perspective, everything came from `5173` → no CORS error

**In production**, **Nginx** plays this role. It forwards `/api/` to `backend:8000`.

**Result:** React never has to know where Django is. It just calls `/api/...`. Same code in dev and prod.

### 7.2. `src/api.js` — the only connection point

```js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const taskApi = {
  list: async () => {
    const response = await api.get('/tasks/')
    return response.data.results || response.data
  },

  detail: async (id) => {
    const response = await api.get(`/tasks/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/tasks/', data)
    return response.data
  },
}
```

**Three functions:**

- **`list`** — list all tasks (for polling every 2 seconds)
- **`detail`** — one specific task (if needed)
- **`create`** — create a new task (this is the main action)

**Note:** `response.data.results || response.data` — DRF paginates by default. The response is `{results: [...], count: N}`. So we return `results`.

### 7.3. `src/App.jsx` — the heart of the frontend

```jsx
export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const fetchTasks = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const data = await taskApi.list()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(true)

    // Poll every 2 seconds to see status changes
    intervalRef.current = setInterval(() => {
      fetchTasks(false)
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleCreate = async (data) => {
    try {
      setSubmitting(true)
      await taskApi.create(data)
      await fetchTasks(false)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // ... Header, TaskForm, TaskCard list
  )
}
```

**Key sections:**

**`useEffect` with `setInterval`** — **the most important section of this file.**

- Fetches tasks once (`fetchTasks(true)`)
- Every 2 seconds, fetches again (`setInterval`)
- `return () => clearInterval(...)` — when the component unmounts, clears the interval (to prevent memory leaks)

**Why polling?**

Because we do not want to set up WebSockets (we learn that in Lesson 15). For this educational project, polling is enough.

**Why `intervalRef`?**

Because if `useEffect` re-runs (e.g., due to a dependency), a new interval is created. With `ref`, we have access to the previous interval and can clear it.

**`handleCreate`:**

- `setSubmitting(true)` — disables the create button (prevents double-click)
- `taskApi.create(data)` — creates the task
- `fetchTasks(false)` — immediately refreshes the list (without loading spinner, since it takes only a moment)
- `setSubmitting(false)` — re-enables the button

### 7.4. Components — simple and clear

**`TaskForm`** — a form with 3 fields (title, description, email) and a button.

**`TaskCard`** — displays a task:

- Title
- Status label (Pending/Processing/Done with different colors)
- Icon (spinning for Processing)
- Result (when `done`)
- ID and time

**Design note:** For `Processing`, the `Loader2` icon spins with the `animate-spin` class. For `Done`, `CheckCircle2` is green. For `Pending`, `Clock` is gray. **This visual feedback** tells the user "what state is this task in" without reading text.

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

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
```

**Golden note:** This Dockerfile is used **both** for `backend`, **and** for `worker`, **and** for `migrate`. **One Image, three services.**

**Why?** Because their code and packages are identical. Only **the command that runs** differs:

- `backend` → `gunicorn ...`
- `worker` → `celery -A config worker`
- `migrate` → `python manage.py migrate`

**In `compose.yaml`, we specify this difference with `command:`.**

**Important Dockerfile lines:**

- `libpq5` — PostgreSQL client library (psycopg needs it)
- `gosu` — tool for switching users (explained in the entrypoint)
- `useradd appuser` — we create a non-root user (instead of root)
- `chown -R appuser:appuser /app` — give ownership to `appuser`

**`EXPOSE 8000`** — only documentation. It does **not publish** the port. Publishing happens in `compose.yaml` with `ports:`.

### 8.2. `entrypoint.sh` — the startup script

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

**Line by line:**

**`if [ "$(id -u)" = "0" ]`** — if we are running as `root` (`id -u` is zero = root):

**`chown -R appuser:appuser /app/staticfiles`** — give ownership of the volume to `appuser`. **Why?**

Remember from Lesson 11: Docker creates named volumes as `root`, even if the Dockerfile says `appuser`. This is a known issue.

The fix: the container **starts as root**, fixes ownership, then switches to `appuser`.

**`exec gosu appuser "$0" "$@"`** — re-execute yourself as `appuser`.

`gosu` acts like `sudo`: runs a command as a different user. `$0` = this file, `$@` = the original arguments.

**The second time the file runs:**

- `id -u` is no longer `0` (we are `appuser`)
- Skips the `if`
- `migrate` and `collectstatic` run as `appuser`
- `exec "$@"` runs the `CMD` (Gunicorn)

**Why are `migrate` and `collectstatic` in the entrypoint?**

Because they must run **after** the database is up. We cannot run them in the `Dockerfile` (because the database is not available).

**Important note:** Only `backend` and `migrate` run this entrypoint. `worker` also runs it, but since `command:` differs, after `migrate` and `collectstatic` (which `worker` also runs — redundant but harmless) it reaches Celery.

### 8.3. `frontend-react/Dockerfile` — Multi-stage

```dockerfile
# ============================================================
# Stage 1: Build the React app
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

# ============================================================
# Stage 2: Serve the built files with Nginx
# ============================================================
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Same pattern as Lesson 13.**

**Simple recap:**

- **Stage 1** = kitchen: Node.js, npm, vite. Builds React, output goes to `/app/dist/`. **~500 MB.**
- **Stage 2** = box: only Nginx. Copies only `dist` from stage 1. **~50 MB.**

**The key line:**

```dockerfile
FROM nginx:1.27-alpine
```

**This line completely forgets stage 1.** A new image from scratch. None of the build tools are inside.

**Result:** Image is 10x smaller.

### 8.4. `nginx.conf` — the Nginx address book

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

    # React SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → Django
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin → Django
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health → Django
    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        access_log off;
    }
}
```

**This file plays exactly the "waiter" role that Vite proxy played in dev.**

**Line by line:**

**`upstream backend`** — tells Nginx "the backend is at `backend:8000`".

**`try_files $uri $uri/ /index.html`** — **the most important line for React.**

- If a file with that name exists, serve it
- If not, serve `index.html`

Why? Because React SPA routing happens on the browser. If the user goes to `/task/42`, Nginx has no file with that name. If it does not serve `index.html`, it returns 404. With this line, React can handle the route itself.

**`$http_host` vs `$host`:**

- `$host` = domain **without** port (`127.0.0.1`)
- `$http_host` = domain **with** port (`127.0.0.1:8089`)

`$http_host` is correct because it matches the browser's `Origin` (for CSRF).

### 8.5. `compose.yaml` — the orchestrator

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-taskrunner}
      POSTGRES_USER: ${POSTGRES_USER:-taskrunner}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskrunner_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskrunner} -d ${POSTGRES_DB:-taskrunner}"]
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
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8089}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8089}
      POSTGRES_DB: ${POSTGRES_DB:-taskrunner}
      POSTGRES_USER: ${POSTGRES_USER:-taskrunner}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskrunner_dev_password}
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
      retries: 10
      start_period: 20s
    restart: unless-stopped

  worker:
    build:
      context: ./backend-django
    command: celery -A config worker --loglevel=info
    environment: *django_env
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8089:80"
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

**Let's examine the most important parts carefully:**

#### `&django_env` and `*django_env`

```yaml
environment: &django_env
  DEBUG: ...
```

This is a **YAML trick**. `&django_env` means "save this block under the name `django_env`". `*django_env` means "use the same block".

**Why?** Because `backend`, `worker`, and `migrate` all need the same env. Write once, use three times.

#### Why is `migrate` a separate service?

**Three ways exist:**

**Way 1 (wrong):** All three services (`backend`, `worker`, `migrate`) run migrations in their entrypoint.

**Problem:** Three processes try to create the tables at the same time. May hit `table already exists` or `migration is already applied`.

**Way 2 (wrong):** Only `backend` runs migrations, `worker` and `migrate` wait for `backend`.

**Problem:** `backend` runs forever, `worker` must wait for `backend`'s healthcheck, making timing complex.

**Way 3 (correct, our choice):** A **one-shot** service named `migrate`:

- Only runs migrations
- Exits successfully (`Exited (0)`)
- `backend` and `worker` wait for `service_completed_successfully`

**Result:** Migrations run **only once**, before anything else.

**So if `docker compose ps -a` shows `migrate` = `Exited (0)`, this is **correct**, not a bug.**

#### Why doesn't `worker` need `static_files`?

Because it does not run `collectstatic`. It only processes tasks.

#### Why does `frontend` need `static_files` (read-only)?

Because Nginx must serve Django static files (admin CSS). `:ro` means read-only.

#### Startup order:

```text
1. db (healthcheck: pg_isready)
2. redis (healthcheck: redis-cli ping)
3. migrate (depends_on: db healthy) → runs once, exits
4. backend (depends_on: migrate completed, redis healthy)
5. worker (depends_on: migrate completed, redis healthy)
6. frontend (depends_on: backend healthy)
```

---

## 9. How Does the Whole Chain Work? (Full Story)

Let's walk through the whole path together:

### Step 1 — User creates a task

- User opens `http://127.0.0.1:8089/` in the browser
- React shows the page
- User fills the form and clicks "Create task"
- React sends `POST /api/tasks/`

### Step 2 — Nginx catches the request

- Request arrives at `127.0.0.1:8089/api/tasks/`
- Nginx sees `/api/` → forwards to `backend:8000`

### Step 3 — Django saves the task

- Django receives the request
- `TaskViewSet.perform_create` runs
- Task saved with status `pending` to PostgreSQL
- `process_task.delay(task.id)` is called

### Step 4 — Message goes into the queue

- `process_task.delay(...)` puts a **message** in Redis
- Django **immediately** responds: `201 Created`
- React shows the new card with status `pending`

### Step 5 — worker picks the message

- Celery Worker (which has been listening on Redis) picks the message
- Runs `process_task(task_id)`
- Reads the task from the database
- Changes status to `processing`
- Sleeps for 10 seconds

### Step 6 — React sees the new status

- React sends `GET /api/tasks/` every 2 seconds (polling)
- Nginx → Django → PostgreSQL
- Django returns the fresh list with status `processing`
- React shows the card with spinning icon and yellow label

### Step 7 — Task completes

- Worker wakes up after 10 seconds
- Changes status to `done`
- Fills in the result

### Step 8 — React celebrates

- Next poll sees status `done`
- Card shows green checkmark and green result message

**All this happens in one picture:**

```text
React ──► Nginx ──► Django ──► PostgreSQL
                       │
                       └──► Redis ──► Celery Worker ──► PostgreSQL
                                                │
React (polling every 2s) ◄──────────────────────┘
```

---

## 10. Running It

From inside `14-task-runner/`:

```bash
docker compose up --build
```

**Expected:**

```text
 ✔ Container 14-task-runner-db-1        Healthy
 ✔ Container 14-task-runner-redis-1     Healthy
 ✔ Container 14-task-runner-migrate-1   Exited (0)
 ✔ Container 14-task-runner-backend-1   Healthy
 ✔ Container 14-task-runner-worker-1    Started
 ✔ Container 14-task-runner-frontend-1  Started
```

**`migrate` with `Exited (0)` = good.** Remember why.

**Important logs:**

```text
worker-1    | [tasks]
worker-1    |   . tasks.tasks.process_task
worker-1    | [INFO] celery@... ready.
```

If `tasks.tasks.process_task` appears in worker logs, Celery has discovered the task. ✅

---

## 11. Testing

### Test 1 — Health endpoint

```text
http://127.0.0.1:8089/health/
```

**Expected:** `{"status": "ok"}`

### Test 2 — Home page

```text
http://127.0.0.1:8089/
```

**Expected:** the "Task Runner" page with a form and the "No tasks yet" message.

### Test 3 — Create a task

Fill in the form:

- **Title:** `Test background task`
- **Description:** `Should be done in 10 seconds`

Click **Create task**.

**What you should see:**

1. **Immediately:** card with status **Pending**
2. **1-2 seconds later:** status **Processing** (spinning yellow icon)
3. **10 seconds later:** status **Done** (green checkmark)
4. **Green text:** `Processed 'Test background task' successfully.`

**This means everything is working.** 🎉

### Test 4 — Worker logs

```bash
docker compose logs -f worker
```

After creating a task, you should see:

```text
Task tasks.tasks.process_task[abc-123] received
Task tasks.tasks.process_task[abc-123] succeeded in 10.5s: Task 1 done
```

**Line 1:** worker received the message.
**Line 2:** worker finished.

### Test 5 — Image size

```bash
docker images | Select-String "14-task-runner"
```

**Expected:**

```text
14-task-runner-frontend   ~50MB
14-task-runner-backend    ~250MB
```

`frontend` ~50 MB = multi-stage build worked. ✅

---

## 12. Common Problems

### Problem 1 — Tasks stay Pending forever

**Check:**

```bash
docker compose logs worker
```

If you see `Cannot connect to redis://...`, the `REDIS_URL` in `compose.yaml` is wrong.

If worker did not start at all, check `docker compose ps`.

### Problem 2 — Task becomes Processing but never Done

**Check:**

```bash
docker compose logs worker
```

Look for errors like `Database connection failed`. If worker cannot reach DB, check `POSTGRES_HOST: db` in `compose.yaml`.

### Problem 3 — `/health/` shows the React page

**Fix:** `nginx.conf` must have a `location /health/` block (explained in the nginx.conf section).

### Problem 4 — Permission denied on volume

**Fix:** `entrypoint.sh` must use `gosu`.

---

## 13. Summary

### What we learned

**1. Docker mindset — 7 questions:**

1. What are the parts? → services
2. What does each need? → Dockerfile or ready-made Image
3. How do they talk? → Network + service name
4. What data must stay alive? → Volume
5. What settings? → Environment Variables
6. How to build? → Single or Multi-stage
7. Startup order? → depends_on + healthcheck

**2. One Image, several services:**

- `backend`, `worker`, and `migrate` use **one Image**
- Only `command:` in `compose.yaml` differs
- This is a big saving (faster build, less disk)

**3. `migrate` as a one-shot service:**

- Runs migrations, exits
- `backend` and `worker` wait for `service_completed_successfully`
- Prevents conflicts

**4. Celery flow:**

```text
Django ──► Redis (queue) ──► Worker ──► PostgreSQL
   │
   └──► immediately responds to user
```

**5. Nginx as the waiter:**

- `/api/` → backend
- `/admin/` → backend
- `/health/` → backend
- `/static/` → Django static files
- `/` → React

**6. Multi-stage Build:**

- Stage 1: Node.js (build)
- Stage 2: Nginx (serve)
- Size: 500 → 50 MB

### The key takeaway of this lesson

```text
Docker mindset = 7 questions
```

For any project, ask these 7 questions. The answers define everything.

**This is the most valuable thing this course gives you.**

### What comes next

**Lesson 15 — Real-time Chat (WebSocket + Channels + Redis)**

A **completely new project** that:

- Uses WebSocket (instead of HTTP polling)
- Uses Django Channels
- Uses Redis as a Channel Layer
- Uses React with WebSocket
- **Two people can actually chat with each other**

And after that:

- **Lesson 16:** Bookmark Manager (Push/Pull to Docker Hub)
- **Lesson 17:** URL Shortener (CI/CD with GitHub Actions)
- **Lesson 18:** Portfolio (Deploy to VPS + SSL + Domain)
- **Lesson 19:** Vault (Security: Trivy, Secrets, Hardening)
- **Lesson 20:** Log Analyzer (Deep debugging)
- **Lesson 21:** Cheat Sheet + Docker Templates
- **Lesson 22:** Wrap-up + Roadmap

