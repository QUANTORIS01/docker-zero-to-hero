[🇮🇷 فارسی](/projects/url-monitor/README.fa.md)

# URL Monitor

> A real-world, production-ready Django application that monitors URLs, powered by Celery, Redis, PostgreSQL, and Docker.

---

## What Is This?

URL Monitor is a small but complete Django application that checks whether a list of URLs is reachable, and records the result every 30 seconds. It is the reference project for **Lesson 10** of the Docker Zero to Hero course.

The real purpose of this project is to teach you how **background jobs** and **scheduled tasks** work in a Dockerized setup, using **Celery** and **Redis**. Everything is containerized, so you can run the whole stack with one command.

---

## What Problem Does It Solve?

Imagine you want to keep an eye on your websites. Every 30 seconds, you want to know:

- Is the site up?
- How long did it take to respond?
- If it's down, what was the error?

If you just write this check inside your Django view, **your web server blocks** while the check is running. With 100 users, the server is overloaded. With 1000 URLs, it's completely dead.

The solution: move the checks out of the web server and into a **background worker**. That's exactly what Celery does.

---

## How It Works (Simple Version)

Every 30 seconds, this chain of events happens:

```text
🕐  Celery Beat  —  the clock
     Sends a "run the check now" message every 30 seconds.

        ↓

📮  Redis  —  the queue
     Holds the message until a worker picks it up.

        ↓

👷  Celery Worker  —  the worker
     Picks up the message, checks the URLs, saves the results.

        ↓

💾  PostgreSQL  —  the storage
     Stores every result so you can see the history.
```

Three roles:

1. **Celery Beat** — the clock. It says "run the check now" every 30 seconds.
2. **Redis** — the mailbox. It holds the messages until a worker picks them up.
3. **Celery Worker** — the worker. It takes a message, does the real work (checks URLs), and saves the results.

The **Django web server** is not involved in this chain at all. That's the whole point: it stays free to serve users.

---

## Features

- User-friendly Django admin panel
- REST API to create, list, and delete monitored URLs
- Automatic URL checks every 30 seconds
- Full history of every check (up/down, response time, status code, error message)
- Health endpoint for Docker health checks
- Five Docker services orchestrated with one `compose.yaml`

---

## Stack

| Component | Version |
|-----------|---------|
| Python | 3.12 |
| Django | 5.1.4 |
| Django REST Framework | 3.15.2 |
| Celery | 5.4.0 |
| Redis | 7 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| django-environ | 0.14.0 |
| requests | 2.32.3 |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/10-url-monitor
```

### 2. Create your environment file

```bash
cp .env.example .env
```

### 3. Build and run everything

```bash
docker compose up --build
```

This will build the Django image, pull PostgreSQL and Redis, run migrations, and start all five services.

### 4. Create an admin user

In a second terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

### 5. Open the app

- Admin panel: <http://127.0.0.1:9000/admin/>
- API: <http://127.0.0.1:9000/api/urls/>
- Health check: <http://127.0.0.1:9000/health/>

> **Note about the port:** This project uses port **9000** instead of the usual 8000, so it can run alongside the Lesson 09 project (TaskFlow) which uses 8000. This is a common practice: each project gets its own port.

### 6. Try it!

1. Go to the admin panel and add a URL (for example `https://www.google.com`).
2. Add a fake URL (for example `https://does-not-exist-12345.com`).
3. Wait 30 seconds.
4. Refresh the **Check Results** page. You should see one entry marked "UP" and one marked "DOWN".

---

## Project Structure

```text
url-monitor/
├── .dockerignore
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

---

## Environment Variables

Defined in `.env` (see `.env.example` for the template):

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | — (required) |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `POSTGRES_DB` | Database name | `urlmonitor` |
| `POSTGRES_USER` | Database user | `urlmonitor` |
| `POSTGRES_PASSWORD` | Database password | `urlmonitor_dev_password` |
| `POSTGRES_HOST` | Database host | `db` (in Docker) |
| `POSTGRES_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection URL | `redis://redis:6379/0` (in Docker) |

**Never commit `.env`.** Only `.env.example` belongs in the repository.

---

## The Five Docker Services

This project runs **five separate containers** that work together:

| Service | Role | Command |
|---------|------|---------|
| `db` | PostgreSQL database | (default PostgreSQL image) |
| `redis` | Message queue | (default Redis image) |
| `migrate` | Runs migrations once and exits | `python manage.py migrate` |
| `web` | Django HTTP server | `python manage.py runserver 0.0.0.0:8000` |
| `worker` | Celery worker (runs tasks) | `celery -A config worker` |
| `beat` | Celery beat (the clock) | `celery -A config beat` |

### Why is `migrate` a separate service?

If `web`, `worker`, and `beat` all ran migrations at startup, they would run **three times at the same time**, which can cause conflicts ("table already exists"). Instead, we use a **one-shot container** (`migrate`) that runs migrations, finishes, and exits. The other services wait for it to complete before starting.

### Why are `worker` and `beat` separate?

They do different jobs:

- **`worker`** does the real work (checks URLs).
- **`beat`** just says "it's time to run the check" every 30 seconds.

If one crashes, the other keeps running. You could also run multiple workers in parallel for speed, but only one beat is needed.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/` | Health check |
| GET / POST | `/api/urls/` | List / create monitored URLs |
| GET / PUT / PATCH / DELETE | `/api/urls/{id}/` | URL detail |
| GET | `/api/checks/` | List all check results (read-only) |
| GET | `/api/checks/{id}/` | Check result detail |
| GET | `/admin/` | Django admin panel |

---

## Common Commands

```bash
# Rebuild and start
docker compose up --build

# See what is running
docker compose ps

# Follow Django logs
docker compose logs -f web

# Follow worker logs (watch tasks run!)
docker compose logs -f worker

# Follow beat logs (watch the clock tick!)
docker compose logs -f beat

# Open a shell inside the Django container
docker compose exec web bash

# Open a shell inside the worker
docker compose exec worker bash

# Open psql
docker compose exec db psql -U urlmonitor -d urlmonitor

# Stop everything (keeps the volume)
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v
```

---

## How to Verify Everything Works

1. **Does the web server work?**
   Open <http://127.0.0.1:9000/health/> — you should see `{"status": "ok"}`.

2. **Does the database work?**
   Open <http://127.0.0.1:9000/api/urls/> — you should see an empty list.

3. **Does Celery see the task?**
   Run `docker compose logs worker | Select-String "check_all_urls"` (or `grep` on Linux/macOS) — you should see the task listed.

4. **Does the whole chain work?**
   Add a URL in the admin panel, wait 30 seconds, refresh **Check Results** — a new entry should appear.

---

## Troubleshooting

### Problem 1: `port is already allocated` or `bind: An attempt was made to access a socket...`

On Windows, port 8000 (and sometimes others) is often reserved by the system. This is a known issue with `WinNAT`, which manages networking for WSL2 and Hyper-V.

**Solution A — Change the port in `compose.yaml`:**

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

Then use `http://127.0.0.1:9000` in your browser.

**Solution B — Free up port 8000 (Windows only):**

Open PowerShell **as Administrator**:

```powershell
net stop winnat
```

In another terminal, run `docker compose up --build`. Once containers are up, run:

```powershell
net start winnat
```

### Problem 2: `worker` does not see the task

If `docker compose logs worker` does not show `monitor.tasks.check_all_urls`, check that:

- `config/__init__.py` imports the Celery app (`from .celery import app as celery_app`).
- `config/celery.py` calls `app.autodiscover_tasks()`.
- `monitor/tasks.py` uses `@shared_task`.

### Problem 3: Migrations do not run

If the `web` service starts but the database is empty, check:

```bash
docker compose logs migrate
```

If `migrate` exited with an error, it will be shown there. The most common cause is a database connection issue.

### Problem 4: Changing `POSTGRES_PASSWORD` has no effect

The official Postgres image initializes the database **only once**. If the `postgres_data` volume already exists, the password does not change. To reset:

```bash
docker compose down -v   # WARNING: all data will be lost
docker compose up --build
```

---

## Production Notes

Before deploying to production:

- [ ] Replace `runserver` with `gunicorn config.wsgi:application`
- [ ] Set `DEBUG=False`
- [ ] Use a real `SECRET_KEY` (not the default)
- [ ] Restrict `ALLOWED_HOSTS` to your real domain
- [ ] Run migrations via a dedicated CI/CD step, not a container
- [ ] Persist the Celery beat schedule to a volume
- [ ] Add authentication to the API (token or JWT)
- [ ] Configure logging aggregation

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 10 — Celery + Redis with Docker**](/en/10-celery-redis/README.md)

See the lesson for a full step-by-step explanation of every file.

---

## License

MIT
