[🇮🇷 فارسی](/fa/10-celery-redis/README.md)

# Lesson 10 — Project Two: Celery + Redis with Docker

## Introduction

In Lesson 09 we built a real Django application and learned how to run it with Docker and Compose. That project was a simple web server: a user sends a request, Django sends a response.

But many real applications need something more than that. Sometimes a task takes a long time and we cannot keep the user waiting. Sometimes we need something to happen every few seconds, without anyone sending a request.

For example, imagine we want to build an app that checks every 30 seconds whether our websites are up or down. What happens if we do that check directly inside Django?

- Our web server becomes busy until the check finishes.
- If we have 100 sites, the server locks up every 30 seconds.
- Any user who tries to load our site at the same time has to wait.

To solve this, we need to move heavy and time-based work **out of** the web server and hand it to a separate part of the system. That is where **Celery** and **Redis** come in.

In this lesson, we build a new project called **URL Monitor** and learn how to run background and scheduled jobs with Celery, Redis, and Docker.

The complete project code is in `projects/url-monitor/` in the repository. In this lesson, we review it line by line.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain why background jobs and scheduled jobs are needed
- Explain what Celery is and how it works
- Explain what Redis is and why we need it
- Distinguish between a worker and beat
- Build a Django app with several services that all share one Image
- Configure Celery inside a Django project
- Write a real scheduled task
- Coordinate six services with `compose.yaml`
- Run the project and confirm the chain works end-to-end
- Troubleshoot common problems

---

## Prerequisites

- Everything we covered in Lesson 09 (Dockerfile, compose, entrypoint, django-environ)
- Basic familiarity with Django (models, views, migrations)
- Basic familiarity with Python

If you have forgotten some of this, do not worry. We will explain everything again, simply.

---

## The Project — URL Monitor

**Story:**

Imagine you have a few websites (or you want to keep an eye on some important ones). You want to know:

- Is the site up right now?
- How long does it take to respond?
- If it is down, what was the error?

We build an app that does this **automatically, every 30 seconds**, without anyone sending a request.

**Features:**

- An admin panel where you add or delete URLs
- An API to create, view, and delete URLs
- A history of when each site was checked and what the result was
- Automatic checks every 30 seconds
- A health endpoint for Docker health checks

**Stack:**

- Python 3.12
- Django 5.1.4
- Django REST Framework 3.15.2
- Celery 5.4.0
- Redis 7
- PostgreSQL 16
- django-environ 0.14.0
- requests 2.32.3

---

## First, a Simple Explanation of Celery

Before we touch any code, let me use a daily-life example so you understand what Celery is.

**Imagine you own a restaurant.**

- A **customer** walks in and orders a dish.
- A **waiter** takes the order and places it on a special tray. The tray has one rule: any chef who is free can pick an order from it and cook it.
- A **chef** picks an order from the tray and cooks the dish.

Now imagine the restaurant gets very busy. The waiter cannot both take orders and cook food. So the waiter and the chef have separate jobs. That means **work happens in parallel**, and customers do not have to wait.

Programming works the same way:

| In a restaurant | In our app | What it does |
|-----------------|------------|--------------|
| Chef | **Celery Worker** | Does the real work (checks a URL) |
| Order tray | **Redis** | Holds messages until a worker picks them up |
| Kitchen bell | **Celery Beat** | Says "it's time to check now" every 30 seconds |
| Waiter | **Django Web** | Answers users, but does not cook |

### Three important terms

- **Celery** is a Python library that lets us run jobs "in the background" and "separately from the main app".
- **Redis** is a separate program whose job is to "hold messages". Celery uses it to pass messages around. In English, this role is called a **Broker** or a **Queue**.
- **Celery Worker** is a separate program that connects to Redis, takes messages, and runs them.
- **Celery Beat** is also a separate program that sends messages on a schedule, for example "run this job every 30 seconds".

### Why does this separation matter?

- If a worker crashes, our main site stays up.
- We can run several workers in parallel to get work done faster.
- Our web server stays free to answer other users.

---

## How the Project Works (in Plain English)

Every 30 seconds, this chain of events happens:

```text
🕐  Celery Beat — the clock
     Sends a "check now" message every 30 seconds.

        ↓

📮  Redis — the queue
     Holds the message until a worker picks it up.

        ↓

👷  Celery Worker — the worker
     Picks up the message, checks the URLs, saves the results.

        ↓

💾  PostgreSQL — the storage
     Stores every result so you can see the history.
```

**Key point:** the Django web server is not in this chain at all. Django is only responsible for answering users who visit the site. The checks happen completely separately.

---

## Directory Structure

The project structure:

```text
url-monitor/
├── .dockerignore
├── .env
├── .env.example
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
│   ├── celery.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── monitor/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── tasks.py
    ├── urls.py
    ├── views.py
    └── migrations/
        ├── __init__.py
        └── 0001_initial.py
```

Note: there is a `.gitignore` at the repository root that covers all projects. That is why this project does not have one of its own.

---

## Step 1 — Dependencies

File `requirements.txt`:

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
celery==5.4.0
redis==5.2.1
requests==2.32.3
```

Three new packages compared to Lesson 09:

- **celery** — the main library that makes background and scheduled work possible.
- **redis** — the Python client for Redis (Redis is a separate program that runs in Docker, but Python needs this package to talk to it).
- **requests** — a library for sending HTTP requests. We use it to check a URL (just like a browser loading a page).

---

## Step 2 — Celery Configuration

### `config/celery.py`

This file is the brain of Celery in our project. Django on its own does not know Celery; we have to introduce them.

```python
"""
Celery setup for URL Monitor.

This module creates the Celery app and tells it:
- Where the Django settings live
- Which broker to use (Redis)
- What periodic tasks to run on a schedule
"""

import os

from celery import Celery
from celery.schedules import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 'urlmonitor' is just a name for this Celery app. It doesn't have to match anything.
app = Celery('urlmonitor')

# Read all CELERY_* settings from Django settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tell Celery to look for tasks in files named `tasks.py` inside every installed app.
app.autodiscover_tasks()


# --------------------------------------------------------------------
# Periodic tasks (the schedule that Celery Beat reads)
# --------------------------------------------------------------------

app.conf.beat_schedule = {
    'check-all-urls-every-30-seconds': {
        'task': 'monitor.tasks.check_all_urls',
        'schedule': timedelta(seconds=30),
    },
}
```

### Line by line

- **`os.environ.setdefault(...)`** — tells Celery to read Django settings from `config.settings`.
- **`app = Celery('urlmonitor')`** — creates a Celery instance. The name is only used in logs.
- **`app.config_from_object('django.conf:settings', namespace='CELERY')`** — tells Celery: "go into Django's settings, read every key that starts with `CELERY_`, and treat them as your own settings".
- **`app.autodiscover_tasks()`** — tells Celery: "inside every installed app, if there is a file named `tasks.py`, register its tasks".
- **`app.conf.beat_schedule`** — this is our schedule. It says: "run `monitor.tasks.check_all_urls` every 30 seconds".

A subtle detail: we imported `timedelta` from `celery.schedules`, not from `datetime`. These are different. If you use the one from `datetime`, Celery raises an error.

### `config/__init__.py`

Open the file and put this inside:

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

This is an important trick. When Django starts, the first thing it does is execute `config/__init__.py`. With this code, Celery is prepared before anything else runs. Without this line, worker and beat may fail to start.

### Celery settings in `config/settings.py`

Add this block to the end of `settings.py`:

```python
# --------------------------------------------------------------------
# Celery
# --------------------------------------------------------------------

CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60
```

Each line explained:

- **`CELERY_BROKER_URL`** — the Redis address Celery uses as a queue.
- **`CELERY_RESULT_BACKEND`** — the Redis address where the result of each task is stored.
- **`CELERY_TIMEZONE`** — the time zone.
- **`CELERY_TASK_TRACK_STARTED`** — report to us when a task starts.
- **`CELERY_TASK_TIME_LIMIT = 60`** — each task has at most 60 seconds. If it takes longer, Celery stops it. This is an important safety net so a hung task cannot lock up the entire worker.

---

## Step 3 — Models

### What is a model? (A quick reminder)

A model is a Python class that **acts as a table in the database**. Django builds the tables from these classes, so we do not need to write SQL.

### File `monitor/models.py`

```python
from django.db import models


class MonitoredURL(models.Model):
    """A single URL that we want to monitor."""

    name = models.CharField(max_length=100, help_text="A friendly name, like 'My Blog'")
    url = models.URLField(help_text="The full URL, like https://example.com")
    is_active = models.BooleanField(default=True, help_text="If false, this URL is skipped")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.url})"


class CheckResult(models.Model):
    """The result of a single health check for one URL."""

    monitored_url = models.ForeignKey(
        MonitoredURL,
        on_delete=models.CASCADE,
        related_name='checks',
    )
    is_up = models.BooleanField()
    status_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['monitored_url', 'checked_at']),
        ]

    def __str__(self) -> str:
        state = "UP" if self.is_up else "DOWN"
        return f"{self.monitored_url.name} — {state} at {self.checked_at}"
```

### What is each field?

**Table `MonitoredURL`** (URLs being monitored):

| Field | Meaning |
|-------|---------|
| `name` | A friendly name. For example, "My Blog". Up to 100 characters. |
| `url` | The full address. Django validates that it is a proper URL. |
| `is_active` | `True` or `False`. When `False`, the task skips this URL. |
| `created_at` | Creation date. `auto_now_add=True` means: "set it once, at creation time". |

**Table `CheckResult`** (the result of each check):

| Field | Meaning |
|-------|---------|
| `monitored_url` | Foreign key — which URL this result belongs to. |
| `is_up` | Is the site up? `True` or `False`. |
| `status_code` | HTTP response code (200, 404, 500...). `null` if we never reached the server. |
| `response_time_ms` | How long the response took, in milliseconds. |
| `error_message` | If there was an error, the message. |
| `checked_at` | When the check happened. Set automatically. |

Note about `indexes`: we added an index on `(monitored_url, checked_at)`. An index is like the alphabetical list at the back of a book. Without it, finding one specific item means scanning the whole table. With it, finding is much faster.

---

## Step 4 — The Celery Task

### What is a task?

A **task** is a Python function that Celery can run in the background. So while Django is answering a user, Celery can be running a task on the side.

### File `monitor/tasks.py`

```python
"""
Celery tasks for URL Monitor.

The only task right now is `check_all_urls`, which:
- Reads every active MonitoredURL from the database
- Sends an HTTP GET request to each one
- Records the result (up/down, response time, error) in CheckResult

Celery Beat calls this task every 30 seconds (see config/celery.py).
"""

import time

import requests
from celery import shared_task
from requests.exceptions import RequestException

from .models import CheckResult, MonitoredURL


REQUEST_TIMEOUT = 10


@shared_task
def check_all_urls():
    """Check every active URL once and save the results."""
    urls = MonitoredURL.objects.filter(is_active=True)
    checked_count = 0

    for monitored in urls:
        _check_single_url(monitored)
        checked_count += 1

    return f"Checked {checked_count} URL(s)"


def _check_single_url(monitored: MonitoredURL) -> None:
    """Check one URL and save the result."""
    start = time.perf_counter()

    try:
        response = requests.get(monitored.url, timeout=REQUEST_TIMEOUT)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        is_up = 200 <= response.status_code < 400

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=is_up,
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            error_message='' if is_up else f"HTTP {response.status_code}",
        )

    except RequestException as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=False,
            status_code=None,
            response_time_ms=elapsed_ms,
            error_message=str(exc)[:500],
        )
```

### Line by line

**`@shared_task`** — a "decorator" (something written above a function that changes its behavior). This decorator tells Celery: "this function is a Celery task".

**`MonitoredURL.objects.filter(is_active=True)`** — gets all URLs marked as active from the database. This is equivalent to `SELECT * FROM ... WHERE ...` in SQL.

**`_check_single_url(monitored)`** — for each URL, we call an internal helper. The leading underscore in the name is a Python convention meaning "internal use".

**`time.perf_counter()`** — a very precise clock. We call it twice: before `requests.get` and after. The difference is the exact response time.

**`requests.get(...)`** — sends an HTTP GET request to the URL (like opening a webpage in a browser). `timeout=10` means: "if 10 seconds pass without a response, give up". **This is critical.** Without a `timeout`, a URL that never responds would hang the task forever and lock up the worker.

**`200 <= response.status_code < 400`** — codes from 200 to 399 count as "successful":
- `200` = OK
- `301` = Redirect
- `404` = Not Found
- `500` = Internal Server Error

**`except RequestException`** — if `requests.get` raises (internet down, no response, etc.), this branch handles it.

---

## Step 5 — The API

### Serializers (`monitor/serializers.py`)

A serializer is a translator: it turns a Python object into JSON (to send to the user) and JSON into a Python object (to save into the database).

```python
from rest_framework import serializers

from .models import CheckResult, MonitoredURL


class MonitoredURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredURL
        fields = ['id', 'name', 'url', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CheckResultSerializer(serializers.ModelSerializer):
    url_name = serializers.ReadOnlyField(source='monitored_url.name')

    class Meta:
        model = CheckResult
        fields = [
            'id',
            'monitored_url',
            'url_name',
            'is_up',
            'status_code',
            'response_time_ms',
            'error_message',
            'checked_at',
        ]
        read_only_fields = fields
```

Key points:

- **`ModelSerializer`** — a serializer type that auto-builds fields from a model.
- **`read_only_fields`** — these fields are read-only; the user cannot set them.
- **`url_name`** — an extra field that is not in the database. Instead of just returning the URL's `id`, we also return its name so the output is friendlier.

### Views (`monitor/views.py`)

A view is the code that runs when a user hits a specific URL.

```python
from rest_framework import viewsets

from .models import CheckResult, MonitoredURL
from .serializers import CheckResultSerializer, MonitoredURLSerializer


class MonitoredURLViewSet(viewsets.ModelViewSet):
    queryset = MonitoredURL.objects.all()
    serializer_class = MonitoredURLSerializer


class CheckResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckResult.objects.select_related('monitored_url').all()
    serializer_class = CheckResultSerializer
```

- **`ModelViewSet`** — a ready-made class that generates seven common operations (list, create, retrieve, update, partial-update, delete).
- **`ReadOnlyModelViewSet`** — same, but only two: list and retrieve. For `CheckResult`, this is correct, since the user must not create results — only Celery does.
- **`select_related('monitored_url')`** — when listing results, we need the URL name for each one. Without `select_related`, every result would trigger a separate database query. With it, everything is fetched in a single query.

### URLs (`monitor/urls.py`)

```python
from rest_framework.routers import DefaultRouter

from .views import CheckResultViewSet, MonitoredURLViewSet

router = DefaultRouter()
router.register(r'urls', MonitoredURLViewSet, basename='url')
router.register(r'checks', CheckResultViewSet, basename='check')

urlpatterns = router.urls
```

`DefaultRouter` generates routes automatically. Instead of writing `/api/urls/`, `/api/urls/1/`, etc. by hand, we simply say `router.register(...)` and DRF does the rest.

### `config/urls.py`

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Lightweight endpoint for Docker healthchecks."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('monitor.urls')),
    path('health/', health_check),
]
```

The `/health/` endpoint lets Docker (or Kubernetes, or any other tool) check whether the service is actually ready.

### Admin (`monitor/admin.py`)

```python
from django.contrib import admin

from .models import CheckResult, MonitoredURL


@admin.register(MonitoredURL)
class MonitoredURLAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'url', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'url')


@admin.register(CheckResult)
class CheckResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'monitored_url', 'is_up', 'status_code', 'response_time_ms', 'checked_at')
    list_filter = ('is_up', 'monitored_url')
    search_fields = ('monitored_url__name', 'monitored_url__url')
    date_hierarchy = 'checked_at'
```

These settings make the admin panel nicer:

- **`list_display`** — which columns appear in the list
- **`list_filter`** — filters on the right side
- **`search_fields`** — fields you can search
- **`date_hierarchy`** — a date filter bar at the top

---

## Step 6 — Dockerfile

File `Dockerfile`:

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

This is nearly the same as the Lesson 09 `Dockerfile`. One important point:

**`CMD` is just `runserver`** — because the `web` service is the one that runs this. The `worker` and `beat` services use the same Image, but override the command via `command:` in `compose.yaml`.

That is: **one Image, several commands.** This is a pattern worth remembering.

---

## Step 7 — entrypoint.sh

```sh
#!/bin/sh
set -e

echo "Starting: $*"
exec "$@"
```

Line by line:

- **`#!/bin/sh`** — tells the system to run this with the Linux shell.
- **`set -e`** — if any command fails, stop immediately.
- **`echo "Starting: $*"`** — prints which command is being executed.
- **`exec "$@"`** — **the most important line.** `exec` replaces the shell with the given command. This makes the main process (like `runserver` or `celery`) PID 1 inside the container, so `docker stop` signals reach it properly.

### Why did we remove `migrate` from the entrypoint?

In Lesson 09, `entrypoint.sh` also ran migrations. But in this project, three services (`web`, `worker`, `beat`) share the same Image. If all three ran migrations, they would conflict (three processes trying to build the same tables).

Instead, we have a separate `migrate` service that runs the migrations once. In `compose.yaml`, the other services wait for it to finish.

---

## Step 8 — compose.yaml with Six Services

This is the most important step of this lesson. Let's learn how to coordinate several services.

File `compose.yaml`:

```yaml
services:
  # ----------------------------------------------------------------
  # 1. PostgreSQL — the database
  # ----------------------------------------------------------------
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-urlmonitor}
      POSTGRES_USER: ${POSTGRES_USER:-urlmonitor}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-urlmonitor_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-urlmonitor} -d ${POSTGRES_DB:-urlmonitor}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 2. Redis — the message queue for Celery
  # ----------------------------------------------------------------
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 3. migrate — runs database migrations once, then exits
  # ----------------------------------------------------------------
  migrate:
    build: .
    command: python manage.py migrate --noinput
    environment: &django_env
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      POSTGRES_DB: ${POSTGRES_DB:-urlmonitor}
      POSTGRES_USER: ${POSTGRES_USER:-urlmonitor}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-urlmonitor_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy

  # ----------------------------------------------------------------
  # 4. web — the Django HTTP server
  # ----------------------------------------------------------------
  web:
    build: .
    environment: *django_env
    ports:
      - "127.0.0.1:9000:8000"
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 5. worker — Celery worker that runs tasks
  # ----------------------------------------------------------------
  worker:
    build: .
    command: celery -A config worker --loglevel=info
    environment: *django_env
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 6. beat — Celery beat that schedules tasks
  # ----------------------------------------------------------------
  beat:
    build: .
    command: celery -A config beat --loglevel=info --schedule=/tmp/celerybeat-schedule
    environment: *django_env
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### Let's review together

**Why six services and not five?**

You might have seen "five services" in the README. Strictly speaking, we have six. One of them (`migrate`) does its work and exits; the other five run continuously. Some people say "five long-running services plus one migrate service". Both are correct.

### The `db` service (database)

- **`image: postgres:16`** — we use the official Image.
- **`volumes: postgres_data:/var/lib/postgresql/data`** — data lives in a volume. Without this, deleting the container would delete the data.
- **`healthcheck`** — Docker runs `pg_isready` every 5 seconds. This is a Postgres command that checks "am I ready to accept connections?". Without it, Docker would only know "the container is running", not "the database is ready".

### The `redis` service (message queue)

- **`image: redis:7-alpine`** — Redis 7, on Alpine (small and light).
- **`healthcheck`** — `redis-cli ping` connects to Redis and says "ping". If Redis is healthy, it responds `PONG`.

### The `migrate` service (one-shot migration)

- **`command: python manage.py migrate --noinput`** — overrides the `CMD` from the Dockerfile. Instead of `runserver`, it runs `migrate`.
- **`&django_env`** — a **YAML trick**. The `&` sign means "save this block under a name". Later we can use `*django_env` to reuse the exact same block, without duplication.
- **No `restart:`** — this service does its job and exits. We do not want it to restart.

### The `web` service (Django)

- **`ports: "127.0.0.1:9000:8000"`** — maps port 8000 inside the container to port 9000 on `127.0.0.1` (only reachable from this machine).
- **`depends_on: migrate: condition: service_completed_successfully`** — **the golden line!** It says: "wait until `migrate` exits successfully, then start". This guarantees the tables exist.

### The `worker` service (Celery worker)

- **`command: celery -A config worker --loglevel=info`** — overrides the `CMD` from the Dockerfile. Instead of `runserver`, it runs `celery worker`.
  - **`-A config`** — "load the Celery app from `config/celery.py`".
  - **`worker`** — "worker mode".
  - **`--loglevel=info`** — show all logs.

### The `beat` service (the clock)

- **`command: celery -A config beat --loglevel=info --schedule=/tmp/celerybeat-schedule`** — "beat mode".
- **`--schedule=/tmp/celerybeat-schedule`** — Celery beat needs a file to store "when each task last ran". By default this is `celerybeat-schedule` in the current directory. We put it in `/tmp` so it is wiped when the container restarts.

### Summary of relationships

```text
db  ◄─── migrate ◄─── web
                       │
                       ├─── worker
                       │
                       └─── beat
         redis ◄───────┘
```

Meaning:
- `db` must be healthy before `migrate`.
- `migrate` must finish before `web` and `worker`.
- `redis` must be healthy before `web`, `worker`, and `beat`.

---

## Step 9 — Running It

From inside `projects/url-monitor/`:

```bash
docker compose up --build
```

What happens:

1. Docker builds the `web` Image from the `Dockerfile` (the same Image is used by `worker` and `beat`).
2. It pulls `postgres:16` and `redis:7-alpine` (if not cached).
3. It creates the `postgres_data` volume.
4. It starts the `db` service and waits for the healthcheck.
5. It starts the `redis` service and waits for the healthcheck.
6. It runs the `migrate` service once; it applies migrations and exits.
7. It starts `web`, `worker`, and `beat`.

You should see something like:

```text
url-monitor-db-1      | ... database system is ready to accept connections
url-monitor-redis-1   | ... Ready to accept connections
url-monitor-migrate-1 | Operations to perform:
url-monitor-migrate-1 |   Apply all migrations: admin, auth, contenttypes, sessions, monitor
url-monitor-migrate-1 | Running migrations:
url-monitor-migrate-1 |   Applying contenttypes.0001_initial... OK
url-monitor-migrate-1 |   ...
url-monitor-migrate-1 |   Applying monitor.0001_initial... OK
url-monitor-migrate-1 exited with code 0
url-monitor-worker-1  | [tasks]
url-monitor-worker-1  |   . monitor.tasks.check_all_urls
url-monitor-worker-1  | [...] celery@... ready.
url-monitor-beat-1    | beat: Starting...
url-monitor-web-1     | Starting development server at http://0.0.0.0:8000/
```

Important notes:

- **`migrate-1 exited with code 0`** — this is **good**! It means migrate did its job and exited.
- **`worker-1 | . monitor.tasks.check_all_urls`** — Celery found our task. Great.
- **`worker-1 | ready`** — worker is ready.
- **`beat-1 | beat: Starting...`** — the clock is ticking.
- **`web-1 | Starting development server`** — Django is up.

---

## Step 10 — Why Port 9000 and Not 8000?

In `compose.yaml` we wrote:

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

This maps port 9000 on your host to port 8000 inside the container. But why not use 8000 directly?

**Reason:** on Windows (and some other systems), certain ports are reserved by the system and Docker cannot use them. Port 8000 is one of the usual suspects.

If you see `port is already allocated` or `bind: An attempt was made to access a socket...`, that is the cause. This is a well-known Windows issue related to `WinNAT`, the service that manages networking for WSL2 and Hyper-V.

**Solutions:**

**Option A (simplest) — change the port:**

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

Then use `http://127.0.0.1:9000` in your browser.

**Option B — free port 8000 (Windows only):**

Open PowerShell **as Administrator**:

```powershell
net stop winnat
```

In another PowerShell window (no admin needed), from the project folder:

```powershell
docker compose up --build
```

Once containers are up, go back to the admin window:

```powershell
net start winnat
```

**Option C — see which ports are reserved:**

PowerShell as admin:

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

This lists ports reserved by Windows. If 8000 is inside one of the ranges, that is the cause.

**Lesson:** in the real world, it is common to give each project its own port. For example:
- Lesson 09 project on 8000
- Lesson 10 project on 9000

That is a healthy habit.

---

## Testing the Project

### Test 1 — Health endpoint

Open in your browser:

```text
http://127.0.0.1:9000/health/
```

You should see:

```json
{"status": "ok"}
```

### Test 2 — The API page

```text
http://127.0.0.1:9000/api/urls/
```

You should see the DRF page with an empty list.

### Test 3 — Create an admin user

In another terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

Enter a username, email (can be blank), and a password.

### Test 4 — Log in to the admin panel

```text
http://127.0.0.1:9000/admin/
```

Log in with your credentials.

### Test 5 — Add your first URL (a real site)

In the admin panel, **Monitored URLs** → **ADD MONITORED URL**:

- **Name:** `Google`
- **URL:** `https://www.google.com`
- **Is active:** ✅

Click **SAVE**.

### Test 6 — Add a second URL (a fake site)

Click ADD MONITORED URL again:

- **Name:** `Fake Site`
- **URL:** `https://this-site-does-not-exist-12345.com`
- **Is active:** ✅

Click **SAVE**.

### Test 7 — Watch the magic

**Wait 30 to 45 seconds.** Then go to **Check Results** in the admin panel.

You should see two rows:

- One for `Google` with `is_up = True`, `status_code = 200`, `response_time_ms = some number`
- One for `Fake Site` with `is_up = False`, `status_code = blank`, `error_message = some error text`

If you see these two rows, **the whole chain works**: beat queued the task → worker ran it → the result was saved to the database.

### Test 8 — Watch the logs

In the terminal where `docker compose up` is running, every 30 seconds you should see:

```text
url-monitor-beat-1    | Scheduler: Sending due task check-all-urls-every-30-seconds (monitor.tasks.check_all_urls)
url-monitor-worker-1  | Task monitor.tasks.check_all_urls[...] received
url-monitor-worker-1  | Task monitor.tasks.check_all_urls[...] succeeded in 2.3s: Checked 2 URL(s)
```

The first line is from `beat`: "it's time, put the task in the queue".
The second is from `worker`: "task received".
The third is from `worker`: "done, checked 2 URLs".

---

## Useful Commands

| Command | What it does |
|---------|--------------|
| `docker compose up --build` | Build and start all services |
| `docker compose up -d` | Start in background |
| `docker compose ps` | Show service status |
| `docker compose logs -f web` | Follow Django logs |
| `docker compose logs -f worker` | Follow worker logs |
| `docker compose logs -f beat` | Follow beat logs |
| `docker compose exec web bash` | Open a shell inside the Django container |
| `docker compose exec worker bash` | Open a shell inside the worker |
| `docker compose exec db psql -U urlmonitor -d urlmonitor` | Open psql |
| `docker compose down` | Stop and remove containers (keeps the volume) |
| `docker compose down -v` | **DANGER:** also removes the volume |

---

## Common Problems

### Problem 1 — `port is already allocated` or `bind: An attempt was made to access a socket`

This is common on Windows. Solutions are in Step 10.

### Problem 2 — `worker` does not see the task

If `docker compose logs worker` does not show `monitor.tasks.check_all_urls`, check:

- `config/__init__.py` must contain `from .celery import app as celery_app`
- `config/celery.py` must call `app.autodiscover_tasks()`
- `monitor/tasks.py` must contain `@shared_task`

### Problem 3 — Migrations do not run

If `web` starts but the database is empty:

```bash
docker compose logs migrate
```

If `migrate` exited with an error, it is shown there. The most common cause is a database connection issue.

### Problem 4 — Changing `POSTGRES_PASSWORD` has no effect

The official Postgres Image initializes the database **only once**. If the `postgres_data` volume already exists, the password does not change. To reset:

```bash
docker compose down -v   # WARNING: all data will be lost
docker compose up --build
```

### Problem 5 — `beat` does not queue tasks

If the `beat` logs show nothing, the `config/celery.py` file might not be loading. Verify that `app.conf.beat_schedule` is properly defined.

### Problem 6 — Worker runs tasks but nothing is saved

If `worker` logs "succeeded" but `Check Results` is empty, the worker might be connecting to a different database. Verify that `POSTGRES_HOST` for `worker` is `db` (not `localhost`).

---

## Exercises

1. Run `docker compose up --build` and confirm the API is reachable at `http://127.0.0.1:9000/api/urls/`.
2. Add a URL in the admin panel and confirm a result appears in Check Results after 30 seconds.
3. Run `docker compose logs -f worker` and watch the task logs in real time.
4. Run `docker compose stop worker`. Notice that `beat` keeps sending messages but nothing runs them. Then `docker compose start worker` and see the queue drain.
5. **Challenge:** define a new task that prints a simple message every 5 minutes. Add it in `config/celery.py` and verify the worker picks it up.

---

## Summary

In this lesson, we learned:

- Why we need background and scheduled jobs
- What Celery is and how it works (remember the restaurant!)
- What Redis is and why we need it
- The difference between `worker` and `beat`
- How to build a Django app with several services sharing one Image
- How to make `migrate` a separate one-shot service so other services wait for it
- How to configure Celery inside a project
- How to write a real scheduled task
- How to coordinate six services with `compose.yaml`
- How to test and troubleshoot the stack

**The key picture of this lesson:**

```text
User ─► Django Web ─► (fast reply)
                            │
                            │ "run this in the background"
                            ▼
                        Redis (queue)
                            │
                            ▼
                     Celery Worker ─► does the work
                            │
                            ▼
                     Celery Beat (the clock)
```

This pattern is used in many real projects: sending emails, processing images, generating reports, monitoring services, and much more.

---

## Next Lesson

**Lesson 11 — Nginx as a Reverse Proxy**

In the next lesson, we will learn:

- What Nginx is and why we need it
- How to send requests from Nginx to Django
- How to serve static files with Nginx
- How to add Nginx to Docker Compose

