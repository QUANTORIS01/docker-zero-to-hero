[🇮🇷 فارسی](/projects/17-shortener/README.fa.md)

# URL Shortener — CI/CD with GitHub Actions

> A URL shortener that builds, tests, and ships **itself**: React + Django + PostgreSQL, all in Docker, powered by **GitHub Actions**.

---

## Why is this lesson different?

Until Lesson 16, everything was **manual**:

1. `docker build`
2. `docker tag`
3. `docker push` to Docker Hub
4. On the server, `docker compose pull`

**This lesson automates the whole loop.** You just `git push` — GitHub Actions does the rest.

This is the reference project for **Lesson 17** of the Docker Zero to Hero course.

---

## Features

- **Register / login** with JWT
- **Shorten any URL** into a 7-character random code (~3.5 trillion combinations)
- **302 redirect** to the original URL
- **Atomic click counter** (`F('clicks') + 1`)
- **Optional expiration** — expired links return 410 Gone
- **Custom HTML error pages** (not raw DRF JSON)
- **Search** in URL and short code
- **Django admin** for management
- **CI/CD with GitHub Actions** — build, test, push automatically ⭐
- **Two compose files:** one for dev (`build:`), one for production (`image:`)
- **Runs on port `8092`**

---

## Architecture

Four services:

```text
┌──────────────────────────────────────────────────┐
│                      User                        │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              frontend (Nginx, port 8092)         │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000                  │
│  /admin/      ──►  backend:8000                  │
│  /health/     ──►  backend:8000                  │
│  /static/     ──►  static_files volume           │
│  /r/{code}/   ──►  backend:8000 (redirect) ⭐    │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│         backend (Django + Gunicorn)              │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              db (PostgreSQL 16)                  │
└──────────────────────────────────────────────────┘
```

| Service | Role | Port | Image pushed |
|---------|------|------|--------------|
| `backend` | Django API | internal 8000 | `<username>/shortener-backend` ⭐ |
| `frontend` | React + Nginx | **8092** | `<username>/shortener-frontend` ⭐ |
| `db` | PostgreSQL 16 | internal | `postgres:16` (not pushed) |
| `migrate` | One-shot | — | same as backend |

---

## ⭐ CI/CD Flow (the heart of the lesson)

When you `git push`:

```text
┌─────────────┐
│  Developer  │
└──────┬──────┘
       │ git push
       ▼
┌─────────────┐
│   GitHub    │
└──────┬──────┘
       │ trigger
       ▼
┌─────────────────────────────────────────┐
│       GitHub Actions (robot)            │
│                                         │
│  1. test    → Django checks ✅          │
│  2. build   → Docker image (matrix)     │
│  3. push    → Docker Hub                │
└──────┬──────────────────────────────────┘
       │
       ▼
┌─────────────┐
│ Docker Hub  │
└──────┬──────┘
       │ pull
       ▼
┌─────────────┐
│  Production │
└─────────────┘
```

**Result:** no manual work. Every `git push` produces a new image in Docker Hub.

### Pipeline at a glance

| Trigger | Jobs | Result |
|---------|------|--------|
| Push to `main` | `test` → `build` (backend) + `build` (frontend) | image tags `main`, `latest`, `sha-*` |
| Pull Request | `test` (only) | tests without push |
| Tag `v1.0.0` | `test` → `build` | image tags `1.0.0`, `1.0` |

---

## The two compose files

| Section | `compose.yaml` (dev) | `compose.prod.yaml` (prod) |
|---------|----------------------|----------------------------|
| `migrate` | `build: ./backend-django` | `image: <username>/shortener-backend:latest` |
| `backend` | `build: ./backend-django` | `image: <username>/shortener-backend:latest` |
| `frontend` | `build: ./frontend-react` | `image: <username>/shortener-frontend:latest` |
| `db` | `image: postgres:16` | `image: postgres:16` (same) |

**`compose.prod.yaml` has no source code.** Only Docker + `.env` is required.

---

## Quick Start (development)

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/17-shortener

# .env for backend
cp backend-django/.env.example backend-django/.env

# .env for compose.prod
cp .env.example .env
# Then set DOCKERHUB_USERNAME to your username

# Build and run
docker compose up --build
```

Open: <http://127.0.0.1:8092/>

---

## Running in Production (no code)

On a server, only this is needed:

```bash
mkdir shortener-prod && cd shortener-prod
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/17-shortener/compose.prod.yaml
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/17-shortener/.env.example
cp .env.example .env
# Edit .env and set DOCKERHUB_USERNAME

docker compose -f compose.prod.yaml up
```

**Docker automatically:**
- Pulls `postgres:16`
- Pulls `<username>/shortener-backend:latest`
- Pulls `<username>/shortener-frontend:latest`

In the log:

```text
 ✔ shortener-backend Pulled
 ✔ shortener-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**Without a single line of code.**

---

## Configuring GitHub Actions

### 1. Docker Hub account

If you don't have one: <https://hub.docker.com/signup>

### 2. Personal Access Token

- Docker Hub → Account Settings → **Personal access tokens**
- **Generate new token** named `github-actions`
- Permissions: **Read, Write, Delete**
- **Copy the token** (shown only once)

### 3. GitHub Secrets

In the repo → Settings → Secrets and variables → Actions:

| Secret | Value |
|--------|-------|
| `DOCKERHUB_USERNAME` | your Docker Hub username |
| `DOCKERHUB_TOKEN` | the token from step 2 |

### 4. Test

From the **repo root** (`docker-zero-to-hero/`):

```bash
git add .github/workflows/ci-shortener.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

Open the Actions tab. You should see:

```text
✅ CI — Shortener / Test backend
✅ CI — Shortener / Build backend
✅ CI — Shortener / Build frontend
```

**🎉 From now on, every `git push` builds and pushes automatically.**

---

## Project Structure

```text
docker-zero-to-hero/                 ← repo root
├── .github/
│   └── workflows/
│       └── ci-shortener.yml         ← CI/CD pipeline (at repo root!)
└── projects/
    ├── ...
    └── 17-shortener/
        ├── .env                     ← gitignored (real username)
        ├── .env.example             ← committed
        ├── compose.yaml             ← local dev
        ├── compose.prod.yaml        ← production (no build)
        ├── README.md
        ├── README.fa.md
        ├── backend-django/
        │   ├── Dockerfile
        │   ├── entrypoint.sh
        │   ├── requirements.txt
        │   ├── config/
        │   └── shortener/
        └── frontend-react/
            ├── Dockerfile
            ├── nginx.conf
            └── src/
```

**Note:** the CI/CD file (`.github/workflows/ci-shortener.yml`) lives at the **repo root**, not inside `17-shortener/`. GitHub Actions only recognizes the `.github/` folder at the repo root.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Login → `access` + `refresh` |
| POST | `/api/auth/refresh/` | Renew token |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/urls/` | List / create |
| GET | `/api/urls/?q=github` | Search |
| GET/PATCH/DELETE | `/api/urls/{id}/` | CRUD |
| GET | `/api/urls/stats/` | Stats |
| GET | `/r/{code}/` | 302 redirect |
| GET | `/health/` | Health check |

---

## 🧠 Technical Debt (acknowledged)

This is a **Docker / CI-CD teaching project**, not a Django best-practices project. A few shortcuts were taken deliberately:

### 1. HTML in views instead of templates

`RedirectView` returns the 404 and 410 error pages as **inline HTML strings**, not template files.

**What proper Django looks like:**

```text
shortener/
└── templates/
    └── shortener/
        ├── error_404.html
        └── error_410.html
```

```python
from django.shortcuts import render

def get(self, request, code):
    try:
        link = ShortURL.objects.get(short_code=code)
    except ShortURL.DoesNotExist:
        return render(request, 'shortener/error_404.html', status=404)
    ...
```

**Why we took the shortcut:**
- Keeps the file tree small and focused on Docker
- No need to configure `TEMPLATES` for two static pages
- Single-file diff is easier to follow

**What it costs:**
- HTML is not reusable
- A designer cannot edit pages without touching Python
- No template inheritance or auto-escaping

**Production TODO:** move into `templates/shortener/error_*.html`.

### 2. `HttpResponse` vs `Response`

- **`Response`** (DRF) → uses renderers (Browsable API, JSON)
- **`HttpResponse`** (Django) → direct, no renderer

For user-facing URLs like `/r/`, `HttpResponse` is correct.
For APIs like `/api/`, `Response` is correct.

---

## Common Problems

### `TLS handshake timeout` while building

**Cause:** Docker Hub is often unreachable from Iran.

**Fix:** turn on a VPN, or configure a Registry Mirror (Docker Desktop → Settings → Docker Engine):

```json
{
  "registry-mirrors": [
    "https://docker.iranserver.com",
    "https://docker.arvancloud.ir"
  ]
}
```

### `apt-get update` takes forever

**Cause:** `deb.debian.org` is slow from Iran (30 kB/s).

**Fix:** turn on a VPN. **In this project, a VPN alone was enough** — no Dockerfile change required.

### Pipeline fails on GitHub Actions

**Common causes:**

| Symptom | Cause | Fix |
|---------|-------|-----|
| `requirements.txt not found` | Project not pushed | `git push` the project |
| `unauthorized: authentication required` | Secrets missing | GitHub Secrets → `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` |
| `denied: requested access` | Token lacks permission | Generate new token with Read+Write+Delete |
| `failed to solve: python:3.12-slim` | TLS to Docker Hub | GitHub Actions can reach Docker Hub — look elsewhere |

### `migrate` shows `Exited (0)`

**This is correct.** It is a one-shot service.

### `/r/{code}/` shows the Browsable API

**Cause:** `RedirectView` returns `Response` instead of `HttpResponse`.

**Fix:** use `HttpResponse` with `content_type='text/html'`.

---

## Production Notes

- [ ] `DEBUG=False`
- [ ] Real `SECRET_KEY`
- [ ] `ALLOWED_HOSTS` set to the real domain
- [ ] `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` set to `https://yourdomain.com`
- [ ] HTTPS with Nginx (Let's Encrypt)
- [ ] `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` only in GitHub Secrets
- [ ] Use exact versions in `compose.prod.yaml` (not `latest`)
- [ ] Backups for `postgres_data`
- [ ] (TODO) move HTML into `templates/shortener/error_*.html`

---

## Related Lessons

- [**Lesson 17 — CI/CD with GitHub Actions**](/en/17-shortener/README.md)

---

## License

MIT
