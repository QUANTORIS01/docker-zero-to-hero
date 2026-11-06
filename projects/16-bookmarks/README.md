[🇮🇷 فارسی](/projects/16-bookmarks/README.fa.md)

# Bookmark Manager — The Docker Registry Project

> A production-ready bookmark manager: React + Django + PostgreSQL, all in Docker, focused on **sharing images through Docker Hub**.

---

## Why this lesson is different

Until now, every image lived only on your machine. If a teammate wanted to run the project, they had to clone the code and rebuild everything.

**This lesson changes that.** A new concept enters: the **Docker Registry** — a cloud store for images. Push once, and anyone, anywhere can run it with `docker pull` — **no code, no Python, no Node.**

This is the reference project for **Lesson 16** of the Docker Zero to Hero course.

---

## Features

- **Register / login** with JWT
- **Full CRUD** for bookmarks (URL, title, description, tags)
- **Global search** across title/URL/description/tags
- **Tag filter** and top-tags stats
- **Per-user data isolation** (each user sees only their own bookmarks)
- **Django admin** for management
- **Two compose files:** one for development (`build:`), one for production (`image:` from Docker Hub)
- **Multi-stage frontend build** (React → Nginx, ~55MB)
- **Runs on port `8091`** so it can run alongside the other course projects

---

## Architecture

Four services:

```text
User ──► frontend (Nginx, port 8091)
            │
            ├──► /             ──► React static files
            ├──► /api/         ──► backend:8000
            ├──► /admin/       ──► backend:8000
            ├──► /health/      ──► backend:8000
            └──► /static/      ──► static_files volume
                        │
                        ▼
                ┌───────────────┐
                │   backend     │  (Django + Gunicorn)
                └───────┬───────┘
                        │
                        ▼
                ┌───────────────┐
                │      db       │  (PostgreSQL 16)
                └───────────────┘
```

| Service | Role | Port | Image |
|---------|------|------|-------|
| `backend` | Django + Gunicorn | internal 8000 | `mcsrayan/bookmarks-backend:1.0.0` ⭐ |
| `frontend` | React + Nginx | **8091** | `mcsrayan/bookmarks-frontend:1.0.0` ⭐ |
| `db` | PostgreSQL 16 | internal | `postgres:16` (not pushed) |
| `migrate` | Runs migrations, then exits | — | same as backend |

> **Teaching note:** `db` is not pushed because **it is not our image — it is a ready-made tool.** Only images containing **our code** get pushed.

---

## The two compose files

This project ships **two compose files.** Their difference is one word:

| Section | `compose.yaml` (dev) | `compose.prod.yaml` (production) |
|---------|----------------------|----------------------------------|
| `migrate` | `build: ./backend-django` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0`** |
| `backend` | `build: ./backend-django` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0`** |
| `frontend` | `build: ./frontend-react` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0`** |
| `db` | `image: postgres:16` | `image: postgres:16` (unchanged) |

**Why it matters:** `compose.prod.yaml` has **no source code**. If a server has only this file and a `.env`, it runs the whole app without any source code.

---

## Quick Start (development, with build)

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/16-bookmarks

# Backend environment
cp backend-django/.env.example backend-django/.env

# Compose environment (for prod)
cp .env.example .env
# Then edit .env and set DOCKERHUB_USERNAME to your username

# Build and run
docker compose up --build
```

Open: <http://127.0.0.1:8091/>

---

## Publishing images (Push)

### 1. Docker Hub account

If you don't have one: <https://hub.docker.com/signup>

### 2. Login

```bash
docker login
# Username: <your-username>
# Password: <password or personal access token>
```

### 3. Tag

```bash
docker tag 16-bookmarks-backend:latest $DOCKERHUB_USERNAME/bookmarks-backend:1.0.0
docker tag 16-bookmarks-frontend:latest $DOCKERHUB_USERNAME/bookmarks-frontend:1.0.0
```

> `docker tag` does not build anything — it creates a new name (alias) for the same image.

### 4. Push

```bash
docker push $DOCKERHUB_USERNAME/bookmarks-backend:1.0.0
docker push $DOCKERHUB_USERNAME/bookmarks-frontend:1.0.0
```

### 5. Verify

Open in the browser:

```
https://hub.docker.com/r/$DOCKERHUB_USERNAME/bookmarks-backend
https://hub.docker.com/r/$DOCKERHUB_USERNAME/bookmarks-frontend
```

---

## Running on a clean machine (Pull)

Imagine a fresh server. **No source code. Only Docker installed.**

```bash
mkdir bookmarks-prod && cd bookmarks-prod
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/16-bookmarks/compose.prod.yaml
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/16-bookmarks/.env.example
cp .env.example .env
# Edit .env and set DOCKERHUB_USERNAME

docker compose -f compose.prod.yaml up
```

**Docker automatically:**
1. Pulls `postgres:16` from Docker Hub
2. Pulls `${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0` from Docker Hub
3. Pulls `${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0` from Docker Hub

In the logs:

```text
 ✔ bookmarks-backend Pulled
 ✔ bookmarks-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**No source code. No Python. No Node.**

---

## Version bumping

When you change the code:

```bash
# 1. Rebuild
docker compose -f compose.yaml build backend

# 2. Tag with the new version
docker tag 16-bookmarks-backend:latest $DOCKERHUB_USERNAME/bookmarks-backend:1.0.1

# 3. Push
docker push $DOCKERHUB_USERNAME/bookmarks-backend:1.0.1

# 4. Edit compose.prod.yaml
# Change 1.0.0 to 1.0.1 in the image: line

# 5. On the production server
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

> **Golden rule:** in `compose.prod.yaml` **never use `latest`.** Always use an exact version (`1.0.0`, `1.0.1`) to keep environments predictable.

---

## Project structure

```text
16-bookmarks/
├── .env                    ← gitignored (real username)
├── .env.example            ← committed (placeholder)
├── compose.yaml            ← local dev (build:)
├── compose.prod.yaml       ← production (image:)
├── README.md
├── README.fa.md
├── backend-django/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── .env.example
│   ├── requirements.txt
│   ├── config/             ← Django project
│   └── bookmarks/          ← app (model, serializer, views)
└── frontend-react/
    ├── Dockerfile          ← multi-stage (node → nginx)
    ├── nginx.conf
    ├── package.json
    └── src/                ← React + Tailwind
```

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/auth/register/` | Register |
| POST | `/api/auth/login/` | Login → `access` + `refresh` |
| POST | `/api/auth/refresh/` | Renew token |
| GET | `/api/auth/me/` | Current user |
| GET/POST | `/api/bookmarks/` | List / create |
| GET | `/api/bookmarks/?q=python` | Search |
| GET | `/api/bookmarks/?tag=django` | Tag filter |
| GET/PUT/PATCH/DELETE | `/api/bookmarks/{id}/` | CRUD |
| GET | `/api/bookmarks/stats/` | Stats |
| GET | `/health/` | Health check |

---

## Environment variables

### `backend-django/.env` (Django)

| Variable | Purpose |
|----------|---------|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | Debug mode |
| `ALLOWED_HOSTS` | Allowed hosts |
| `POSTGRES_*` | DB connection |

### `.env` (Compose)

| Variable | Purpose |
|----------|---------|
| `DOCKERHUB_USERNAME` | Your Docker Hub username — used by compose.prod.yaml to pull images |

---

## Troubleshooting

### `TLS handshake timeout` while building/pulling

**Cause:** Docker Hub is often unreachable from Iran.

**Fixes:**
1. **Use a VPN** (simplest)
2. Configure a **Registry Mirror**: Docker Desktop → Settings → Docker Engine → `registry-mirrors` with Iranian mirrors
3. Set **DNS** in Docker Desktop to `8.8.8.8`

### `unauthorized: authentication required`

Run `docker login` again.

### `denied: requested access to the resource is denied`

- `DOCKERHUB_USERNAME` doesn't match your real account
- Or you didn't `docker login`

### `migrate` shows `Exited (0)`

**This is correct.** It is a one-shot service.

### Port 8091 is already in use

Change the port to `8092` in `compose.yaml` or `compose.prod.yaml`.

---

## Production notes

Before deploying to production:

- [ ] `DEBUG=False`
- [ ] Real, long `SECRET_KEY`
- [ ] `ALLOWED_HOSTS` set to real domain
- [ ] `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` set to `https://yourdomain.com`
- [ ] HTTPS with Nginx (Let's Encrypt)
- [ ] `DOCKERHUB_USERNAME` in real `.env` (not in git)
- [ ] Exact version in `compose.prod.yaml` (not `latest`)
- [ ] Backups for `postgres_data`
- [ ] Use Docker Secrets or a proper secrets manager

---

## Related Lessons

- [**Lesson 16 — Docker Registry: Push and Pull from Docker Hub**](/en/16-bookmarks/README.md)

---

## License

MIT
