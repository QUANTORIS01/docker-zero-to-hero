[🇮🇷 فارسی](/projects/13-recipe-book/README.fa.md)

# Recipe Book

> A fullstack recipe management app: React + Django + PostgreSQL + Nginx, all in Docker with a **multi-stage build** that produces a 50 MB frontend image.

---

## Overview

Recipe Book is a fullstack web application for discovering and managing recipes. Each recipe has a title, description, photo, ingredients list, instructions, category, difficulty, prep/cook times, and serving count.

This is the reference project for **Lesson 13** of the Docker Zero to Hero course.

It is the first project in the course that combines **React frontend** and **Django backend** into a single deployable application, served by a single Nginx container. It is also the first project that uses a **multi-stage Docker build** to produce a small production image.

---

## Features

- **Browse recipes** with a beautiful dark-themed grid
- **Search** by title, description, or ingredients
- **Filter** by category (Breakfast, Lunch, Dinner, Dessert, Snack)
- **Detail page** with photo, ingredients list, and step-by-step instructions
- **Django admin** for adding, editing, and deleting recipes
- **Photo upload** with automatic thumbnail preview in the admin
- **Multi-stage Docker build** for the frontend → 10x smaller image
- **CORS + CSRF** properly configured for cross-origin requests
- **Single port** for everything (frontend + API + admin + static + media)

---

## Architecture

Three services work together:

```text
User ──► frontend (Nginx, port 8088)
            │
            ├──► /             ──► React static files (from stage 2)
            ├──► /api/         ──► backend:8000 (Django)
            ├──► /admin/       ──► backend:8000 (Django)
            ├──► /health/      ──► backend:8000 (Django)
            ├──► /static/      ──► static_files volume (Django admin CSS)
            └──► /media/       ──► media_files volume (recipe photos)
```

| Service | Role | Port |
|---------|------|------|
| `db` | PostgreSQL 16 | internal |
| `backend` | Django + Gunicorn | internal 8000 |
| `frontend` | React (built) + Nginx | **8088** (host) |

> **Note about the port:** This project runs on port **8088**. The other projects in this course use 8000 (TaskFlow), 9000 (URL Monitor), 8080 (Photo Gallery), and 3000 (Kanban Board). Keeping ports unique means all five projects can run at the same time.

### Three volumes

| Volume | Written by | Read by | What it holds |
|--------|------------|---------|---------------|
| `postgres_data` | `db` | `db` | Database files |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) | Django admin CSS |
| `media_files` | `backend` (uploads) | `frontend` (Nginx) | Recipe photos |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/13-recipe-book
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

### 4. Create an admin user

In a second terminal:

```bash
docker compose exec backend python manage.py createsuperuser
```

### 5. Open the app

- **Recipe Book:** <http://127.0.0.1:8088/>
- **Admin panel:** <http://127.0.0.1:8088/admin/>
- **API:** <http://127.0.0.1:8088/api/recipes/>
- **Health check:** <http://127.0.0.1:8088/health/>

### 6. Try it!

1. Log in to the admin panel.
2. Click **Recipes** → **ADD RECIPE**.
3. Fill in the title, ingredients, instructions, and upload a photo.
4. Save.
5. Go back to <http://127.0.0.1:8088/> — your recipe is there.

---

## The Multi-stage Build (the key concept)

The frontend Dockerfile has **two stages**:

### Stage 1 — Build (Node.js)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

This stage has Node.js, npm, and vite. It compiles the React source into static HTML/CSS/JS in `/app/dist/`.

**Size: ~500 MB.**

### Stage 2 — Serve (Nginx)

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

This stage only has Nginx. It copies **only the `dist` folder** from stage 1.

**Size: ~50 MB.**

### The result

The final image is **10x smaller** because it contains none of:

- Node.js runtime
- npm package manager
- Source code
- `node_modules` (200+ MB)
- Build tools (vite, esbuild)

Only Nginx + the static files that will be served.

Verify yourself:

```bash
docker images | grep 13-recipe-book
```

You should see the `frontend` image at around 50 MB.

---

## Project Structure

```text
13-recipe-book/
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
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── recipes/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
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
    ├── eslint.config.js
    ├── public/
    │   ├── favicon.svg
    │   └── icons.svg
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Header.jsx
            ├── SearchBar.jsx
            ├── CategoryFilter.jsx
            ├── RecipeCard.jsx
            ├── RecipeDetail.jsx
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
| `CORS_ALLOWED_ORIGINS` | React origins allowed to call the API | `http://localhost:5173,http://localhost:8088` |
| `CSRF_TRUSTED_ORIGINS` | React origins trusted for POST/PUT/DELETE | `http://localhost:5173,http://localhost:8088` |
| `POSTGRES_DB` | Database name | `recipebook` |
| `POSTGRES_USER` | Database user | `recipebook` |
| `POSTGRES_PASSWORD` | Database password | `recipebook_dev_password` |
| `POSTGRES_HOST` | Database host | `localhost` (in `.env`), `db` (in compose) |
| `POSTGRES_PORT` | Database port | `5432` |

**Never commit `.env`.**

### Why two origins for CORS/CSRF?

- `localhost:5173` → Vite dev server (when running React locally with `npm run dev`)
- `localhost:8088` → Nginx (when running the full Docker stack)

Both need to be allowed.

---

## API Endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/health/` | Health check |
| GET / POST | `/api/recipes/` | List / create recipes |
| GET / PUT / PATCH / DELETE | `/api/recipes/{id}/` | Recipe detail |
| GET | `/admin/` | Django admin panel |

### Query parameters for `/api/recipes/`

| Parameter | Example | Effect |
|-----------|---------|--------|
| `?search=` | `?search=pasta` | Searches title, description, and ingredients |
| `?category=` | `?category=dinner` | Filters by category |
| `?difficulty=` | `?difficulty=easy` | Filters by difficulty |
| `?ordering=` | `?ordering=title` | Sorts by field (prefix `-` for descending) |

### Example

```bash
curl "http://127.0.0.1:8088/api/recipes/?search=pasta&category=dinner"
```

---

## Development Mode (without Docker)

Running React and Django separately is useful for hot reload during development.

### Backend

```bash
cd backend-django
python -m venv .venv
source .venv/bin/activate        # or: .venv\Scripts\activate on Windows
pip install -r requirements.txt

# ensure PostgreSQL is running locally, then:
python manage.py migrate
python manage.py runserver
```

Runs at <http://localhost:8000/>.

### Frontend

```bash
cd frontend-react
npm install
npm run dev
```

Runs at <http://localhost:5173/>. Vite's proxy in `vite.config.js` forwards `/api` and `/media` to `localhost:8000`, so no CORS setup is needed in dev.

---

## Common Commands

```bash
# Build and start everything
docker compose up --build

# See service status
docker compose ps

# Follow backend logs
docker compose logs -f backend

# Follow frontend (Nginx) logs
docker compose logs -f frontend

# Open a shell in the backend
docker compose exec backend bash

# Run Django management commands
docker compose exec backend python manage.py <command>

# Open psql
docker compose exec db psql -U recipebook -d recipebook

# Stop (keeps volumes)
docker compose down

# Stop and remove volumes (WARNING: deletes data)
docker compose down -v
```

---

## Troubleshooting

### Problem 1 — `/health/` shows the React page instead of `{"status": "ok"}`

**Cause:** Nginx does not have a `location /health/` block, so the request falls through to `location /` and serves React's `index.html`.

**Fix:** Add this block to `frontend-react/nginx.conf`:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

Then restart: `docker compose up --build`.

### Problem 2 — CSRF verification failed when logging in to admin

**Cause:** Django 4.0+ validates the `Origin` header of POST requests. Requests from `http://127.0.0.1:8088` are rejected because the origin is not trusted.

**Fix:** Ensure `CSRF_TRUSTED_ORIGINS` is set in `backend-django/.env`:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8088,http://127.0.0.1:8088
```

And in `nginx.conf`, use `proxy_set_header Host $http_host;` (with `$http_host`, not `$host`).

### Problem 3 — Permission denied when uploading a photo

**Cause:** Docker creates named volumes as `root`. The non-root `appuser` inside the backend container cannot write to them.

**Fix:** The `entrypoint.sh` uses `gosu` to fix permissions on first run. Verify it contains:

```sh
if [ "$(id -u)" = "0" ]; then
    chown -R appuser:appuser /app/staticfiles /app/media
    exec gosu appuser "$0" "$@"
fi
```

### Problem 4 — Photos do not load

**Check:**

```bash
docker compose exec backend ls /app/media/recipes/
docker compose exec frontend ls /app/media/recipes/
```

Both should show the photo. If the backend has it but the frontend does not, the `media_files` volume is not shared in `compose.yaml`.

### Problem 5 — Port 8088 is in use

Change the host port in `compose.yaml`:

```yaml
frontend:
  ports:
    - "127.0.0.1:8089:80"
```

Then use `http://127.0.0.1:8089`.

On Windows, if the port is reserved by the system (not actually used by a process), stop WinNAT temporarily:

```powershell
net stop winnat
```

Start the containers, then:

```powershell
net start winnat
```

### Problem 6 — Frontend image is unexpectedly large

**Cause:** You may have forgotten to `docker compose build` after editing the Dockerfile, or the build failed and an older image is still being used.

**Check:**

```bash
docker images | grep 13-recipe-book-frontend
```

The frontend image should be around 50 MB. If it is much larger, the multi-stage build did not run correctly. Look for `stage-1` and `stage-2` in the build output:

```bash
docker compose build frontend
```

---

## Running Alongside Other Lessons

This project is designed to run alongside the previous projects in the course:

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| **13** | **Recipe Book** | **8088** |

You can start all five at the same time:

```bash
cd projects/09-taskflow/backend-django && docker compose up -d
cd projects/10-url-monitor && docker compose up -d
cd projects/11-photo-gallery && docker compose up -d
cd projects/12-react-kanban && docker compose up -d
cd projects/13-recipe-book && docker compose up -d
```

Then visit:

- TaskFlow API: <http://127.0.0.1:8000/api/tasks/>
- URL Monitor: <http://127.0.0.1:9000/api/urls/>
- Photo Gallery: <http://127.0.0.1:8080/>
- Kanban Board: <http://127.0.0.1:3000/>
- Recipe Book: <http://127.0.0.1:8088/>

Each project is completely independent. Stopping one does not affect the others.

---

## Production Notes

Before deploying to production:

- [ ] Set `DEBUG=False` in `backend-django/.env`
- [ ] Use a real `SECRET_KEY`
- [ ] Set `ALLOWED_HOSTS` to your real domain
- [ ] Set `CORS_ALLOWED_ORIGINS` and `CSRF_TRUSTED_ORIGINS` to `https://yourdomain.com`
- [ ] Use HTTPS (Nginx with a Let's Encrypt certificate)
- [ ] Increase Gunicorn workers based on CPU cores
- [ ] Configure backups for `postgres_data` and `media_files`
- [ ] Use a secret-management system for credentials

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 13 — Fullstack + Multi-stage Build**](/projects/13-recipe-book/README.fa.md)

---

## License

MIT
