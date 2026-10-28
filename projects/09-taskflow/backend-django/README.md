[🇮🇷 فارسی](/projects/09-taskflow/backend-django/README.fa.md)

# TaskFlow — Django Backend

> A production-ready Django REST API for task management, fully Dockerized.

---

## Overview

TaskFlow is a task-management REST API built with Django and Django REST Framework. It serves as the reference backend project for **Lesson 09** of the Docker Zero to Hero course.

The project demonstrates a complete, production-grade Docker setup for a Django application, including:

- A `Dockerfile` with a non-root user and dependency-layer caching
- `docker compose` for orchestrating the app alongside PostgreSQL
- Environment-driven configuration via `django-environ`
- Automatic migrations at container start via `entrypoint.sh`
- A health-check endpoint for infrastructure probes

---

## Features

- **Authentication** — session-based (development), token-ready (production)
- **Task CRUD** — create, read, update, delete tasks
- **Category CRUD** — group tasks under user-defined categories
- **Per-user isolation** — each user only sees their own tasks
- **Priority & status** — low/medium/high priority, todo/in-progress/done status
- **Due dates** — optional due dates for each task
- **Admin panel** — full Django admin integration
- **Health check** — `/health/` endpoint for Docker and load balancer probes

---

## Stack

| Component | Version |
|-----------|---------|
| Python | 3.12 |
| Django | 5.1.4 |
| Django REST Framework | 3.15.2 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| django-environ | 0.14.0 |
| Gunicorn | 23.0.0 (for production) |

---

## Quick Start (Docker)

### 1. Clone the repository

```bash
git clone <https://github.com/QUANTORIS01/docker-zero-to-hero.git>
cd docker-zero-to-hero/projects/09-taskflow/backend-django
```

### 2. Create your environment file

```bash
cp .env.example .env
```

### 3. Build and run

```bash
docker compose up --build
```

### 4. Create an admin user

In a second terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

### 5. Open the app

- Admin: <http://127.0.0.1:8000/admin/>
- API: <http://127.0.0.1:8000/api/tasks/>
- Health: <http://127.0.0.1:8000/health/>

---

## Quick Start (Local, without Docker)

```bash
python -m venv .venv
source .venv/bin/activate        # or: .venv\Scripts\activate on Windows
pip install -r requirements.txt

# ensure PostgreSQL is running locally, then:
python manage.py migrate
python manage.py runserver
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/` | Health check |
| GET / POST | `/api/categories/` | List / create categories |
| GET / PUT / PATCH / DELETE | `/api/categories/{id}/` | Category detail |
| GET / POST | `/api/tasks/` | List / create tasks (user-scoped) |
| GET / PUT / PATCH / DELETE | `/api/tasks/{id}/` | Task detail |
| GET | `/admin/` | Django admin |

---

## Project Structure

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

---

## Environment Variables

Configuration is read from a `.env` file at the project root. Use `.env.example` as the template:

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

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | — (required) |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Database name | `taskflow` |
| `POSTGRES_USER` | Database user | `taskflow` |
| `POSTGRES_PASSWORD` | Database password | `taskflow_dev_password` |
| `POSTGRES_HOST` | Database host | `localhost` |
| `POSTGRES_PORT` | Database port | `5432` |

### A note about `POSTGRES_HOST` in `.env`

`.env.example` sets `POSTGRES_HOST=localhost`. That value is correct when running Django **directly on your machine** (outside Docker), where PostgreSQL is exposed on your own `localhost`.

When running via `docker compose`, the `web` service overrides this variable and uses `POSTGRES_HOST=db`, where `db` is the Compose service name for the PostgreSQL container. You don't need to change anything — the override happens automatically.

**Never commit `.env` to version control.** It contains secrets. Only `.env.example` belongs in the repository.

---

## Docker Details

### Dockerfile

- Base image: `python:3.12-slim`
- Non-root user: `appuser`
- Dependencies (`requirements.txt`) are copied and installed **before** the source code. This lets Docker cache the `pip install` layer and avoid reinstalling packages on every code change.
- `entrypoint.sh` runs migrations before starting the server.
- `runserver` is used for development. In production, replace it with `gunicorn config.wsgi:application`.

### compose.yaml

- `db` service with a named volume and a `pg_isready` healthcheck
- `web` service built from the local `Dockerfile`
- `depends_on: condition: service_healthy` ensures PostgreSQL is fully ready before Django starts
- Port is bound to `127.0.0.1:8000`, keeping the API accessible from the host only

### entrypoint.sh

- Applies pending migrations
- Executes the `CMD` from the Dockerfile

---

## Common Commands

```bash
# Rebuild the image and restart
docker compose up --build

# Follow Django logs
docker compose logs -f web

# Open a shell inside the container
docker compose exec web bash

# Run Django management commands
docker compose exec web python manage.py <command>

# Open psql
docker compose exec db psql -U taskflow -d taskflow

# Stop the project (keeps the volume)
docker compose down

# Stop and remove the volume (WARNING: deletes data)
docker compose down -v
```

---

## Production Notes

Before deploying to production:

- [ ] Replace `runserver` with `gunicorn config.wsgi:application`
- [ ] Set `DEBUG=False`
- [ ] Set `ALLOWED_HOSTS` to the actual domain names
- [ ] Use a real secret key (not the default placeholder)
- [ ] Replace `SessionAuthentication` with `TokenAuthentication` or JWT
- [ ] Serve static files via Nginx or Whitenoise
- [ ] Configure backups for the PostgreSQL volume
- [ ] Bind the published port to `0.0.0.0` only if behind a reverse proxy

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 09 — Dockerizing a Real Django Application**](/en/09-django-docker/README.md)

See the lesson for a full step-by-step walkthrough of every file in this project.

---

## License

MIT