[🇮🇷 فارسی](/fa/09-django-docker//README.md)

# Lesson 09 — Dockerizing a Real Django Application

## Introduction

In previous lessons, we explored Docker, Images, Containers, Volumes, Networks, and Compose. But all the examples we built so far were simple and educational: an Nginx, a PostgreSQL, or a small app.

Real projects are not like that. A production-ready Django application typically needs:

- A Python environment with pinned dependencies
- A PostgreSQL database with persistent storage
- Automatic migration execution at container start
- A non-root user for security
- A health check so Docker knows when the service is actually ready
- Secure, changeable environment-variable management
- A repeatable workflow that every team member can run with a single command

In this lesson, we will build a real Django project called **TaskFlow** and containerize it from scratch. Every file is written at production quality, not as a toy example.

By the end of this lesson, you will have a complete API built with Django REST Framework, PostgreSQL, Docker, and Docker Compose. In the following lessons, we will build on this foundation to add Celery, Redis, Nginx, and a frontend.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Design a professional directory structure for a Django project
- Write a production-grade `Dockerfile` for a Python application
- Explain every line of the `Dockerfile` and why it exists
- Write a `compose.yaml` that runs Django and PostgreSQL together
- Use `entrypoint.sh` to run migrations automatically
- Manage environment variables with `django-environ`
- Run the project with a single command: `docker compose up --build`
- Test the API and troubleshoot common problems

---

## Prerequisites

- Docker and Docker Compose installed on your system (Lesson [02](/en/02-installation/README.md))
- Familiarity with `docker run`, `docker ps`, and `docker exec` (Lesson [03](/en/03-first-container/README.md))
- Understanding of Images and the Dockerfile (Lesson [04](/en/04-docker-images/README.md) and [05](/en/05-dockerfile/README.md))
- Familiarity with Volumes and Networks (Lesson [06](/en/06-docker-volumes/README.md) and [07](/en/07-docker-networking/README.md))
- Some experience using Compose (Lesson [08](/en/08-docker-compose/README.md))
- Basic familiarity with Django and Python

If you have never worked with Django before, do not worry. All the Django code is explained in the lesson. The main goal is **containerizing** the project, not teaching Django from scratch.

---

## The Project — TaskFlow

TaskFlow is a task-management API. Users can create tasks, group them into categories, set priorities and statuses, and assign due dates.

Project features:

- User registration and login (Django auth)
- Full CRUD for tasks
- Full CRUD for categories
- Each user only sees their own tasks
- Priority (low / medium / high) and status (todo / in_progress / done)
- Optional due date per task
- Django admin panel
- Health-check endpoint `/health/`

Technology stack:

- Python 3.12
- Django 5.1.4
- Django REST Framework 3.15.2
- PostgreSQL 16
- psycopg (PostgreSQL driver for Python) 3.2.10
- django-environ 0.14.0 (for environment management)
- Gunicorn 23.0.0 (for production)

We will not build a frontend in this lesson. We build a real API that any frontend (React, Vue, mobile) can consume.

---

## Directory Structure

The complete project structure:

```text
backend-django/
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── compose.yaml
├── entrypoint.sh
├── manage.py
├── requirements.txt
├── README.md
├── README.fa.md
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tasks/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── urls.py
    ├── views.py
    └── migrations/
        ├── __init__.py
        └── 0001_initial.py
```

Two main directories exist:

- `config/` — the **project-wide** Django configuration (settings, root urls, asgi, wsgi)
- `tasks/` — a Django **app** (a feature module). Later you can add other apps such as `users`, `payments`, or `notifications`.

This separation is a standard Django convention that scales well in real projects.

---

## Why This Structure Works Well With Docker

A Docker-friendly Django project keeps **configuration separate from code**:

- `requirements.txt` — pinned dependencies (Docker can cache this layer)
- `.env.example` — template for environment variables
- `entrypoint.sh` — runs migrations before the server starts
- `Dockerfile` — defines how to build the Image
- `compose.yaml` — defines how to run multiple services together

The key insight: **Django code does not know it is running inside Docker.** It reads configuration from environment variables. This is exactly how production Django should behave.

---

## Step 1 — Dependencies

File `requirements.txt`:

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
gunicorn==23.0.0
django-environ==0.14.0
```

Let's look at each line:

- `Django==5.1.4` — the framework version. The `==` sign pins the version so that every environment installs exactly this version.
- `djangorestframework==3.15.2` — a layer on top of Django for building APIs.
- `psycopg[binary]==3.2.10` — the PostgreSQL driver for Python. The `[binary]` extra means the pre-compiled wheel is installed, so we do not need a C compiler.
- `gunicorn==23.0.0` — the WSGI server for production. We do not use it yet, but install it now so it is ready when we need it.
- `django-environ==0.14.0` — a small library for reading environment variables from a `.env` file.

**Always pin versions.** If you write just `Django` (without a version), a new release could break your project tomorrow.

---

## Step 2 — Django Code

### `manage.py`

The project management entry point:

```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main() -> None:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
```

This file is generated by Django itself and does not need any changes.

### `config/settings.py` — The Key File

The settings file is the most important file in this lesson because it is the connection point between Django and Docker:

```python
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# ... INSTALLED_APPS, MIDDLEWARE, and TEMPLATES ...

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('POSTGRES_USER'),
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST': env('POSTGRES_HOST'),
        'PORT': env('POSTGRES_PORT'),
        'CONN_MAX_AGE': 60,
    }
}

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

Let's walk through the important parts.

### Why `django-environ`?

Instead of hard-coding sensitive values (like the database password or `SECRET_KEY`) inside the code, we read them from environment variables:

```python
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')
```

The first line creates an `env` object. The second line reads the `.env` file (if present) and makes its values available.

### Why `env.bool` and `env.list`?

`env()` returns a value as a string. But `DEBUG` needs to be a boolean and `ALLOWED_HOSTS` needs to be a list. That is why we use helper methods:

- `env.bool('DEBUG', False)` — converts the string `"True"` or `"False"` into a boolean. If the variable is not defined, the default `False` is used.
- `env.list('ALLOWED_HOSTS', default=[...])` — converts a comma-separated string into a list.

If we read everything with `env()`, then `DEBUG="False"` would be treated as a string and Django would **always treat it as True** (because any non-empty string is truthy in Python). This is a very common security bug.

### `CONN_MAX_AGE`

```python
'CONN_MAX_AGE': 60,
```

This means Django keeps the database connection open for up to 60 seconds, reusing it across requests instead of opening a new connection each time. This dramatically improves performance in production.

---

## Step 3 — The `tasks` App

The `tasks` app contains models, serializers, and views. The complete code is in the repository. Here we only review the models since they matter from a design perspective.

### `tasks/models.py`

```python
from django.conf import settings
from django.db import models


class Category(models.Model):
    """A user-defined grouping for tasks."""

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Task(models.Model):
    """A single task owned by a user."""

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status'], name='task_owner_status_idx'),
            models.Index(fields=['owner', 'due_date'], name='task_owner_due_idx'),
        ]

    def __str__(self) -> str:
        return self.title
```

Key points:

- `owner` uses `CASCADE`: if a user is deleted, all their tasks are deleted too.
- `category` uses `SET_NULL`: if a category is deleted, tasks remain but their `category` becomes `null`.
- `indexes` — two composite indexes are defined on `(owner, status)` and `(owner, due_date)`. These indexes make common queries (a user's tasks filtered by status or due date) significantly faster.

### `tasks/views.py`

```python
from rest_framework import permissions, viewsets

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user).select_related('category')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

Key points:

- `TaskViewSet.get_queryset` — always restricts tasks to the logged-in user. This guarantees **data isolation between users**.
- `perform_create` — automatically sets `owner` to the current user when creating a task. Users cannot forge another user's ownership.
- `select_related('category')` — fetches category data in the same SQL query. Without it, each task would trigger a separate database query (the N+1 problem).

### `config/urls.py`

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Lightweight endpoint for Docker healthchecks and load balancers."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('health/', health_check),
]
```

The `/health/` endpoint plays an important role in Docker and production: probes (Docker health checks, Kubernetes liveness probes, load balancers) use this endpoint to know whether the service is actually ready.

---

## Step 4 — Dockerfile

Now we reach the core of this lesson. The `Dockerfile`:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

Let's go through it line by line.

### `FROM python:3.12-slim`

We start from the official Python Image. The `slim` variant is smaller than the full Debian image but still has everything Python needs.

**Why `3.12`?** It is the recommended version for Django 5.1.

**Why not `alpine`?** Alpine uses `musl` instead of `glibc`. Some Python packages (especially `psycopg` and packages that use C) must be compiled from source on Alpine. This makes the build slow and fragile. `slim` is the safer choice.

### Environment Variables

```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
```

What each one does:

| Variable | What it does | Why we need it |
|----------|--------------|----------------|
| `PYTHONDONTWRITEBYTECODE=1` | Does not write `.pyc` files | Keeps the Image clean and avoids ownership issues between host and container |
| `PYTHONUNBUFFERED=1` | Does not buffer stdout/stderr | Logs appear immediately in `docker logs` |
| `PIP_NO_CACHE_DIR=1` | Does not cache pip downloads | Smaller Image |
| `PIP_DISABLE_PIP_VERSION_CHECK=1` | Disables pip update check | Faster builds and cleaner logs |

### `WORKDIR /app`

The working directory inside the container. All following `COPY`, `RUN`, and `CMD` instructions run from `/app`.

### Installing system packages

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
```

We install the PostgreSQL client library (`libpq5`). The `psycopg` driver needs it at runtime.

- `--no-install-recommends` — skips optional packages we do not need.
- `rm -rf /var/lib/apt/lists/*` — cleans the apt cache; saves about 30 MB.

### `COPY requirements.txt .`

We copy **only** `requirements.txt`. This is a deliberate decision.

Docker builds Images layer by layer, and each layer is cached. If we copied all the code first, **any** code change would invalidate the `pip install` layer, forcing pip to reinstall all dependencies.

By copying `requirements.txt` first, the `pip install` layer remains cached until `requirements.txt` itself changes.

### `RUN pip install --no-cache-dir -r requirements.txt`

Installs dependencies. `--no-cache-dir` prevents pip from caching downloads inside the Image.

### `COPY . .`

Now we copy the rest of the project (settings, apps, `manage.py`, etc.).

### Creating a non-root user

```dockerfile
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser
```

By default, containers run as `root`. This is dangerous: if an attacker compromises the application, they have root access inside the container and may be able to escape to the host.

We create a non-root user named `appuser`, give it ownership of `/app`, make `entrypoint.sh` executable, and switch to it with `USER appuser`.

An important detail: `chmod +x /app/entrypoint.sh` runs **before** `USER appuser`, because after switching, the `appuser` user might not have permission to change permissions.

### `EXPOSE 8000`

Declares that the app listens on port 8000. **It does not publish the port on the host.** Publishing happens in `compose.yaml` via the `ports:` key.

### `ENTRYPOINT` and `CMD`

```dockerfile
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

- `ENTRYPOINT` always runs when the container starts.
- `CMD` provides default arguments that can be overridden at runtime.

Our entrypoint first runs migrations, then executes whatever is in `CMD`.

In production, replace `runserver` with `gunicorn config.wsgi:application --bind 0.0.0.0:8000`.

---

## Step 5 — entrypoint.sh

File `entrypoint.sh`:

```sh
#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
```

Line by line:

- `#!/bin/sh` — we use a standard POSIX shell (always available in `slim` Images).
- `set -e` — if any command fails, stop immediately. If `migrate` fails, the server does not start against a half-migrated database.
- `migrate --noinput` — applies migrations to the database. `--noinput` prevents any interactive prompt (because there is no one in the container to answer questions).
- `exec "$@"` — replaces the shell with the `CMD` command. This is critical: it makes the Django process PID 1 inside the container, so `docker stop` signals reach it properly. Without `exec`, the signal goes to the shell, and Django may not shut down gracefully.

Important: `entrypoint.sh` must have Unix line endings (LF), not Windows (CRLF). The `chmod +x` in the `Dockerfile` ensures it works, but if you created the file on Windows, make sure it is saved with Unix line endings.

---

## Step 6 — .dockerignore

File `.dockerignore`:

```text
__pycache__/
*.py[cod]
*.egg-info/
.env
.env.*
!.env.example
.venv/
venv/
.git/
.gitignore
.vscode/
.idea/
*.sqlite3
.DS_Store
README.md
.pytest_cache/
.coverage
htmlcov/
```

Why it matters:

- `.env` must **never** be sent to the Docker daemon (it contains secrets).
- `.git/` can be hundreds of megabytes. Excluding it from the Build Context makes the build much faster.
- `__pycache__` and `.venv` are useless inside the Image.
- `README.md` is not needed inside the Image either.

The line `!.env.example` is an exception: it un-ignores this file so that if you ever need it, it is included in the context.

---

## Step 7 — Environment Variables

File `.env.example`:

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=taskflow
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=taskflow_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

Then copy it on your system:

```bash
cp .env.example .env
```

**Never commit `.env`.** It is in `.gitignore`.

### A note about `POSTGRES_HOST`

`.env.example` sets `POSTGRES_HOST=localhost`. This value is correct when you run Django **directly on your machine** (outside Docker) with PostgreSQL reachable on your own `localhost`.

When you use `docker compose`, the `web` service overrides this value and sends `POSTGRES_HOST=db` (`db` is the name of the PostgreSQL service in Compose). So you do not need to change `.env` — the override happens automatically.

### A note about `ALLOWED_HOSTS`

The format of this variable matters. It must be **without quotes** and **comma-separated**:

```dotenv
ALLOWED_HOSTS=localhost,127.0.0.1
```

If you use quotes (like `'localhost', '127.0.0.1'`), `env.list()` will treat the quotes as part of the values, and Django will not recognize them as valid hostnames.

### A security note

Values inside `.env.example` are only for development. For production:

- Replace `SECRET_KEY` with a long random value (at least 50 characters)
- Set `DEBUG` to `False`
- Change the PostgreSQL password to a strong one
- Use a Secret management system like Vault, AWS Secrets Manager, or Docker Secrets

---

## Step 8 — compose.yaml

File `compose.yaml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-taskflow}
      POSTGRES_USER: ${POSTGRES_USER:-taskflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskflow_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskflow} -d ${POSTGRES_DB:-taskflow}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  web:
    build: .
    environment:
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      POSTGRES_DB: ${POSTGRES_DB:-taskflow}
      POSTGRES_USER: ${POSTGRES_USER:-taskflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskflow_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### The `db` service

- `image: postgres:16` — the official PostgreSQL 16 Image.
- `POSTGRES_DB`, `POSTGRES_USER`, `POSTGRES_PASSWORD` — used **only on the first initialization of the volume**. If you change them later, since the database already exists, no change is applied.
- `volumes: postgres_data:/var/lib/postgresql/data` — persists the data outside the container.
- `healthcheck` — `pg_isready` runs every 5 seconds. This is how Compose knows the database is **actually** ready, not just that the container is running.
- `restart: unless-stopped` — restarts the container on crash or host reboot.

**Syntax `${VAR:-default}`** — means "if `VAR` is set in the environment, use it; otherwise use `default`."

### The `web` service

- `build: .` — build the Image from the Dockerfile in this directory.
- `environment` — configuration passed to Django. All of these are read in `settings.py` via `os.environ`.
- `POSTGRES_HOST: db` — the service name `db` is used as the hostname inside the Compose network. This overrides `.env`.
- `ports: "127.0.0.1:8000:8000"` — binds only to loopback. A security best practice for local development: the API is not exposed to your LAN.
- `depends_on: db: condition: service_healthy` — **the most important line.** It tells Compose to wait until `pg_isready` succeeds before starting `web`. Without this, `migrate` might run before PostgreSQL is ready, and the container will crash on startup.

### The `volumes` section

```yaml
volumes:
  postgres_data:
```

This declares the named volume. Compose creates it with a project-name prefix (for example, `backend-django_postgres_data`).

---

## Step 9 — Build and Run

From inside the `backend-django/` directory:

```bash
docker compose up --build
```

What happens:

1. Docker reads `compose.yaml`.
2. It builds the `web` Image from the `Dockerfile`.
3. It pulls the `postgres:16` Image (if not cached).
4. It creates the `postgres_data` volume.
5. It starts `db` and waits for the health check.
6. Once `db` is ready, it starts `web`; `entrypoint.sh` runs → `migrate` → `runserver`.

You should see output like:

```text
db-1   | ... database system is ready to accept connections
web-1  | Applying database migrations...
web-1  | Operations to perform:
web-1  |   Apply all migrations: admin, auth, contenttypes, sessions, tasks
web-1  | ...
web-1  | Starting server...
web-1  | Watching for file changes with StatReloader
web-1  | Listening on TCP address 0.0.0.0:8000
```

---

## Step 10 — Create an Admin User

In another terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

Follow the prompts. Then open:

```text
http://127.0.0.1:8000/admin/
```

Log in with the superuser credentials. You can now create tasks and categories from the admin panel.

---

## Step 11 — Test the API

The simplest way to test is to use the browsable DRF API. First log in to the admin panel, then open:

```text
http://127.0.0.1:8000/api/tasks/
```

You should see the DRF API page with a form for creating a new task.

To test the health endpoint:

```bash
curl http://127.0.0.1:8000/health/
```

It should return `{"status": "ok"}`.

Note: in this lesson we use `SessionAuthentication` because we do not have a frontend yet. In later lessons, when we add a React frontend, we will switch to `TokenAuthentication` or JWT.

---

## Useful Commands

| Command | What it does |
|---------|--------------|
| `docker compose up --build` | Build and start all services |
| `docker compose up -d` | Start in background |
| `docker compose ps` | Show service status |
| `docker compose logs -f web` | Follow Django logs |
| `docker compose exec web bash` | Open a shell inside the Django container |
| `docker compose exec web python manage.py shell` | Open the Django shell |
| `docker compose exec db psql -U taskflow -d taskflow` | Open psql |
| `docker compose down` | Stop and remove containers (keeps the volume) |
| `docker compose down -v` | **DANGER:** also removes the volume |

---

## Common Problems

### Problem 1 — `web` crashes with "connection refused" to `db`

The database is not ready yet. We handled this with `depends_on: condition: service_healthy`. If you removed that block, add it back.

### Problem 2 — "permission denied" when writing to `/app`

This happens if you mount the project directory into the container (`volumes: - .:/app`) while running as a non-root user. The host files have a different UID than `appuser`.

Fix: either do not mount the code (rebuild the Image on every change), or run the container with your host UID:

```yaml
user: "${UID}:${GID}"
```

### Problem 3 — Changing `POSTGRES_PASSWORD` has no effect

The official Postgres Image initializes the database **only once**. If the `postgres_data` volume already exists, the password does not change. To reset:

```bash
docker compose down -v   # WARNING: all data is deleted
docker compose up --build
```

### Problem 4 — `migrate` throws a "no such table" error

You have not committed the migration files. Make sure `tasks/migrations/0001_initial.py` exists. If you changed the model, run this on your own system (not inside the container):

```bash
python manage.py makemigrations
```

And commit the new files.

### Problem 5 — Port 8000 is already in use

Another process or Compose project is using port 8000. Change the host port:

```yaml
ports:
  - "127.0.0.1:8001:8000"
```

### Problem 6 — `env.list('ALLOWED_HOSTS')` fails or hosts are rejected

The format of `ALLOWED_HOSTS` in `.env` must be **without quotes** and **comma-separated**:

```dotenv
ALLOWED_HOSTS=localhost,127.0.0.1
```

Not `'localhost', '127.0.0.1'` and not `["localhost", "127.0.0.1"]`.

---

## Exercises

1. Run `docker compose up --build` and confirm the API is reachable at `http://127.0.0.1:8000/api/tasks/`.
2. Open a shell inside the `web` container and run `python manage.py check`.
3. Stop the stack with `docker compose down` and confirm the database volume still exists using `docker volume ls`.
4. Start the stack again with `docker compose up -d` and confirm your data (users, tasks) is still there.
5. **Challenge:** Add a new endpoint `GET /api/stats/` that returns the total number of tasks for the logged-in user. Rebuild the Image and test it.

---

## Summary

In this lesson, we learned:

- How to structure a real Django project for Docker
- How to write a production-grade `Dockerfile` with:
  - a `slim` base Image
  - layered caching for `pip install`
  - a non-root user
  - an entrypoint script
- How to write a `compose.yaml` with:
  - two services (`web` and `db`)
  - a named volume for database persistence
  - a healthcheck and `depends_on: condition: service_healthy`
  - environment variables from `.env`
- How to use `django-environ` to read environment variables
- How to run migrations inside the container
- How to test and troubleshoot the stack

The workflow you now have:

```text
compose.yaml + Dockerfile + .env
              │
              ▼
       docker compose up
              │
              ▼
       web (Django) ──► db (PostgreSQL)
```

---

## Next Lesson

**Lesson 10 — A New Project: Celery + Redis with Docker**

In the next lesson, we start a new project where we run background tasks and scheduled tasks with Celery and Redis. We will learn:

- How Redis works as a broker
- What Celery worker and Celery beat are, and why each is a separate container
- How to write a real background job
- How to manage multiple services together in `compose.yaml`

