[🇮🇷 فارسی](/projects/14-task-runner/README.fa.md)

# Task Runner

> A fullstack task processor: React + Django + Celery + Redis + PostgreSQL, all in Docker. Create a task, watch it move from Pending → Processing → Done in real time.

---

## Overview

Task Runner is a fullstack application that demonstrates **background job processing** in a realistic Docker setup. Users create tasks through a web UI; the backend queues them in Redis; a Celery worker picks them up, simulates work for 10 seconds, and updates the status.

This is the reference project for **Lesson 14** of the Docker Zero to Hero course.

It combines everything from the previous lessons:

- **Lesson 09:** Django + PostgreSQL
- **Lesson 10:** Celery + Redis
- **Lesson 11:** Nginx + volume permissions + gosu
- **Lesson 13:** Fullstack React + Django + Multi-stage Build

The result is a **six-service** application that shows how a real production system coordinates an HTTP server, a background worker, a message queue, a database, and a reverse proxy.

---

## Features

- **Create tasks** with a title, description, and optional email
- **Watch tasks process in real time** (the UI polls every 2 seconds)
- **Status transitions:** `pending` → `processing` → `done`
- **Celery worker** handles jobs independently from Django
- **Redis** queues jobs between Django and the worker
- **Django admin** for viewing and managing tasks
- **Multi-stage frontend build** → 10x smaller image
- **Runs on port 8089** so it can run alongside the other course projects

---

## Architecture

Six services work together:

```text
User ──► frontend (Nginx, port 8089)
            │
            ├──► /             ──► React static files
            ├──► /api/         ──► backend:8000 (Django)
            ├──► /admin/       ──► backend:8000 (Django)
            ├──► /health/      ──► backend:8000 (Django)
            └──► /static/      ──► static_files volume
                        │
                        ▼
                ┌───────────────┐
                │   backend     │  (Django + Gunicorn)
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌────────┐    ┌──────────┐  ┌──────────┐
    │  db    │    │  redis   │  │ migrate  │
    │(postg.)│    │ (queue)  │  │(one-shot)│
    └────────┘    └────┬─────┘  └──────────┘
                       │
                       ▼
                  ┌──────────┐
                  │  worker  │  (Celery)
                  └──────────┘
```

| Service | Role | Port | Image |
|---------|------|------|-------|
| `db` | PostgreSQL 16 | internal | `postgres:16` |
| `redis` | Message queue for Celery | internal | `redis:7-alpine` |
| `migrate` | Runs migrations once, then exits | — | built from `./backend-django` |
| `backend` | Django + Gunicorn (HTTP API) | internal 8000 | built from `./backend-django` |
| `worker` | Celery worker (runs tasks) | — | **same image as `backend`** |
| `frontend` | React (built) + Nginx | **8089** (host) | built from `./frontend-react` |

> **Note about the port:** This project runs on port **8089**. The other course projects use 8000 (TaskFlow), 9000 (URL Monitor), 8080 (Photo Gallery), 3000 (Kanban Board), and 8088 (Recipe Book). Unique ports mean all six can run at the same time.

### Two volumes

| Volume | Written by | Read by | What it holds |
|--------|------------|---------|---------------|
| `postgres_data` | `db` | `db` | Database files |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) | Django admin CSS |

---

## The Celery Flow

This is what makes the project interesting. Let's trace what happens when a user creates a task:

```text
1. User clicks "Create task" in React
2. React POSTs to /api/tasks/ via Nginx → backend
3. Django saves the Task to PostgreSQL with status="pending"
4. Django calls `process_task.delay(task.id)` → puts a message in Redis
5. Django returns 201 Created immediately (the user sees the task appear)
6. React starts polling /api/tasks/ every 2 seconds
7. Meanwhile, the Celery worker picks the message from Redis
8. Worker updates status to "processing"
9. Worker sleeps for 10 seconds (simulated work)
10. Worker updates status to "done" and fills in the result
11. The next poll from React sees the new status
12. UI updates from Pending → Processing → Done
```

**The key insight:** Django never blocks. It answers the user in milliseconds. The 10-second work happens **outside** Django, in the worker. If the worker crashes, the API stays up.

### Why is `migrate` a separate service?

If `backend`, `worker`, and `migrate` were the same service, three processes would try to run migrations at the same time, causing conflicts. Instead, `migrate` is a **one-shot container** that runs migrations, exits successfully, and lets the others start.

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
docker images | grep 14-task-runner
```

You should see the `frontend` image at around 50 MB.

---

## Why "Simulated" Processing?

The worker's job in this project is to **sleep for 10 seconds and mark the task as done**. It does not send a real email, generate a real PDF, or call any external API.

**This is intentional.** The focus of Lesson 14 is on **Docker patterns**, not on a specific business operation. The `process_task` function can be replaced with any real work:

```python
# Instead of time.sleep(10), you could:
# - Send an email via SMTP or SendGrid
# - Generate a PDF report
# - Resize an uploaded image
# - Call a third-party API
# - Run a database migration or cleanup job
```

The Docker architecture around it (Redis, worker, backend, Nginx) stays **exactly the same**. That's the whole point: once you learn the pattern, you can plug in any real job.

**Real-world examples that follow this exact pattern:**

- Send an order confirmation email after checkout
- Generate a monthly invoice PDF
- Process a video upload
- Notify a Slack channel when a deployment finishes
- Rotate encryption keys on a schedule

The Docker setup does not change. Only the function body changes.

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/14-task-runner
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

- **Task Runner:** <http://127.0.0.1:8089/>
- **Admin panel:** <http://127.0.0.1:8089/admin/>
- **API:** <http://127.0.0.1:8089/api/tasks/>
- **Health check:** <http://127.0.0.1:8089/health/>

### 5. Create an admin user (optional)

```bash
docker compose exec backend python manage.py createsuperuser
```

### 6. Try it!

1. Fill in the task title (e.g., "Test background task").
2. Click **Create task**.
3. Watch the card appear immediately with status **Pending**.
4. Within 1-2 seconds, it changes to **Processing** (spinning icon).
5. After 10 seconds, it changes to **Done** (green checkmark).
6. A green result message appears below.

**Watch the logs in another terminal:**

```bash
docker compose logs -f worker
```

You will see:

```text
Task tasks.tasks.process_task[abc-123] received
Task tasks.tasks.process_task[abc-123] succeeded in 10.5s: Task 1 done
```

---

## Project Structure

```text
14-task-runner/
├── compose.yaml
├── README.md
├── README.fa.md
├── backend-django/
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
│   │   ├── celery.py       ← Celery setup
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py       ← Task model
│       ├── serializers.py
│       ├── tasks.py        ← Celery task
│       ├── urls.py
│       ├── views.py        ← API endpoints
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

There is a single `.gitignore` at the repository root covering all projects.

---

## Environment Variables

Defined in `backend-django/.env` (see `.env.example`):

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | — (required) |
| `DEBUG` | Debug mode | `True` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `CORS_ALLOWED_ORIGINS` | React origins | `http://localhost:5173,http://localhost:8089` |
| `CSRF_TRUSTED_ORIGINS` | Trusted origins for POST | `http://localhost:5173,http://localhost:8089` |
| `POSTGRES_DB` | Database name | `taskrunner` |
| `POSTGRES_USER` | Database user | `taskrunner` |
| `POSTGRES_PASSWORD` | Database password | `taskrunner_dev_password` |
| `POSTGRES_HOST` | Database host | `localhost` (in `.env`), `db` (in compose) |
| `POSTGRES_PORT` | Database port | `5432` |
| `REDIS_URL` | Redis connection URL | `redis://localhost:6379/0` (in `.env`), `redis://redis:6379/0` (in compose) |

**Never commit `.env`.**

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/` | Health check |
| GET | `/api/tasks/` | List all tasks |
| POST | `/api/tasks/` | Create a new task (dispatches Celery job) |
| GET | `/api/tasks/{id}/` | Retrieve one task |
| GET | `/admin/` | Django admin panel |

### Example: create a task

```bash
curl -X POST http://127.0.0.1:8089/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Send newsletter", "description": "To all subscribers"}'
```

Response (201 Created):

```json
{
  "id": 1,
  "title": "Send newsletter",
  "description": "To all subscribers",
  "email": "",
  "status": "pending",
  "status_display": "Pending",
  "result": "",
  "created_at": "2025-10-31T12:00:00Z",
  "updated_at": "2025-10-31T12:00:00Z"
}
```

Ten seconds later:

```bash
curl http://127.0.0.1:8089/api/tasks/1/
```

Response shows `"status": "done"` and `"result": "Processed 'Send newsletter' successfully."`.

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

**Start the Celery worker in another terminal:**

```bash
cd backend-django
source .venv/bin/activate
celery -A config worker --loglevel=info
```

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Runs at <http://localhost:5173/>. Vite's proxy forwards `/api` to `localhost:8000`.

---

## Common Commands

```bash
# Build and start everything
docker compose up --build

# See service status (including migrate's exit code)
docker compose ps -a

# Follow backend logs
docker compose logs -f backend

# Follow worker logs (the most interesting ones!)
docker compose logs -f worker

# Open a shell in the backend
docker compose exec backend bash

# Open a shell in the worker
docker compose exec worker bash

# Open psql
docker compose exec db psql -U taskrunner -d taskrunner

# Inspect Redis keys (see the Celery queue)
docker compose exec redis redis-cli keys '*'

# Stop (keeps volumes)
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

---

## Troubleshooting

### Problem 1 — `/health/` shows the React page instead of `{"status": "ok"}`

**Cause:** Nginx has no `location /health/` block.

**Fix:** Add to `frontend-react/nginx.conf`:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### Problem 2 — Tasks stay in Pending forever

**Cause:** The Celery worker is not running or cannot connect to Redis.

**Check:**

```bash
docker compose logs worker
```

Look for errors like `Cannot connect to redis://...` or `ModuleNotFoundError`. Ensure `worker` is listed in `docker compose ps` with status `Up`.

### Problem 3 — Worker logs show task received but status never changes

**Cause:** The worker cannot connect to PostgreSQL.

**Check:**

```bash
docker compose logs worker | grep -i "database\|error"
```

Verify `POSTGRES_HOST: db` is set for the `worker` service in `compose.yaml`.

### Problem 4 — `migrate` service shows `Exited (0)`

**This is correct.** The `migrate` service runs migrations once and exits. It is a **one-shot container**, not a long-running service.

### Problem 5 — CSRF verification failed when logging in to admin

**Fix:** Ensure `CSRF_TRUSTED_ORIGINS` in `.env` includes `http://127.0.0.1:8089`:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8089,http://127.0.0.1:8089
```

### Problem 6 — Port 8089 is already in use

Change the host port:

```yaml
frontend:
  ports:
    - "127.0.0.1:8090:80"
```

Then use `http://127.0.0.1:8090`.

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
| **14** | **Task Runner** | **8089** |

All six can run at once. Each is independent; stopping one does not affect the others.

---

## Production Notes

Before deploying to production:

- [ ] Set `DEBUG=False`
- [ ] Use a real `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your real domain
- [ ] Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to `https://yourdomain.com`
- [ ] Use HTTPS (Nginx with a Let's Encrypt certificate)
- [ ] Increase Gunicorn workers and Celery worker concurrency based on CPU cores
- [ ] Replace `time.sleep` with real work
- [ ] Add Celery monitoring (Flower) and failure handling (`autoretry_for`)
- [ ] Configure backups for `postgres_data`
- [ ] Add `CELERY_TASK_ALWAYS_EAGER = False` (default; only set to `True` in tests)
- [ ] Use a secret-management system for credentials
- [ ] Consider moving `static_files` to object storage (S3) for multi-server deployments

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 14 — Fullstack + Celery + Redis**](/en/14-task-runner/README.md)

---

## License

MIT
