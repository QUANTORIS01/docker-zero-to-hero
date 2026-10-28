[🇮🇷 فارسی](/projects/11-photo-gallery/README.fa.md)

# Aurora Gallery

> A visually rich, production-ready Django photo gallery, served by Nginx with Gunicorn and PostgreSQL, all running in Docker.

---

## Overview

Aurora Gallery is a photo gallery application built with Django. It demonstrates how to build a **complete production setup** for a Django app:

- **Gunicorn** as the Python WSGI server (instead of `runserver`)
- **Nginx** as a reverse proxy and static-file server
- **PostgreSQL** for storage
- **Docker Compose** to bring everything up with one command

This is the reference project for **Lesson 11** of the Docker Zero to Hero course.

Unlike the previous two projects (TaskFlow and URL Monitor), which focused on APIs, this project has a **real frontend** — a dark-themed photo gallery with animations, hover effects, and a masonry grid. It gives you something to look at, not just JSON to read.

---

## What Problem Does It Solve?

A Django project running `runserver` is fine for development, but it has three problems in production:

1. **It's slow.** `runserver` is single-threaded and struggles with more than a few concurrent users.
2. **It's insecure.** `runserver` enables debug mode by default, exposing internal details on every error.
3. **It's not designed for static files.** Serving CSS, JavaScript, and uploaded photos through Django means running Python code for what is essentially "read a file and send it". Nginx does this 100x faster.

The solution: put **Nginx** in front of Django. Nginx handles static files directly, and only forwards dynamic requests to Django (running under Gunicorn).

---

## How It Works (Simple Version)

Every request goes through Nginx first:

```text
User  ─►  Nginx (port 8080 on the host)
             │
             ├──► Static file (CSS, JS)?   Nginx serves it directly, from disk.
             │
             ├──► Media file (photos)?     Nginx serves it directly, from disk.
             │
             └──► Anything else?           Nginx forwards it to Gunicorn,
                                           which runs Django.
```

Why does this matter? Because Nginx is a **C program** that serves files with almost no overhead. Django is a **Python program** that has to boot up the whole framework for every request. For static files, this difference is enormous.

---

## Features

- Beautiful dark-themed gallery with a masonry grid
- Hover animations on each photo card (scale, gradient overlay, title slide-up)
- Glassmorphism header (frosted blur effect)
- Google Fonts (Playfair Display + Inter)
- Responsive (3 columns on desktop, 2 on tablet, 1 on mobile)
- Django admin panel with photo preview thumbnails
- Detail page for each photo (image, title, photographer, location, date)
- Health endpoint for Docker and load balancer probes
- Automatic migrations and `collectstatic` on container start
- Non-root user inside the container, with proper volume permissions

---

## Stack

| Component | Version |
|-----------|---------|
| Python | 3.12 |
| Django | 5.1.4 |
| Gunicorn | 23.0.0 |
| Nginx | 1.27 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| Pillow | 11.0.0 |
| django-environ | 0.14.0 |

---

## Quick Start

### 1. Clone the repository

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/11-photo-gallery
```

### 2. Create your environment file

```bash
cp .env.example .env
```

### 3. Build and run everything

```bash
docker compose up --build
```

This builds the Django image, pulls PostgreSQL and Nginx, runs migrations and `collectstatic`, and starts all three services.

### 4. Create an admin user

In a second terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

### 5. Open the app

- Gallery: <http://127.0.0.1:8080/>
- Admin panel: <http://127.0.0.1:8080/admin/>
- Health check: <http://127.0.0.1:8080/health/>

> **Note about the port:** This project uses port **8080** (not 8000 or 9000). The previous lessons use 8000 (TaskFlow) and 9000 (URL Monitor). Keeping ports unique means all three projects can run at the same time.

### 6. Add your first photo

1. Log in to the admin panel.
2. Click **Photos** → **ADD PHOTO**.
3. Fill in the title, upload an image, and save.
4. Go back to the gallery page — your photo is there.

### 7. Verify that Nginx is doing its job

Open the browser DevTools (F12), go to the **Network** tab, and reload the page. Click on `style.css` or any photo you uploaded. In the response headers, look for:

```text
Server: nginx/1.27.x
```

That confirms **Nginx** served the file, not Django. If you saw `gunicorn` in that header, Nginx would not be doing its job.

---

## Project Structure

```text
11-photo-gallery/
├── .dockerignore
├── .env.example
├── Dockerfile
├── compose.yaml
├── entrypoint.sh
├── gunicorn.conf.py
├── manage.py
├── requirements.txt
├── README.md
├── README.fa.md
├── nginx/
│   └── nginx.conf
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── gallery/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── urls.py
    ├── views.py
    ├── migrations/
    │   ├── __init__.py
    │   └── 0001_initial.py
    ├── static/
    │   └── gallery/
    │       └── style.css
    └── templates/
        └── gallery/
            ├── base.html
            ├── photo_detail.html
            └── photo_list.html
```

There is a `.gitignore` at the repository root that covers all projects. That is why this project does not have one of its own.

---

## Environment Variables

Defined in `.env` (see `.env.example` for the template):

| Variable | Purpose | Default |
|----------|---------|---------|
| `SECRET_KEY` | Django secret key | — (required) |
| `DEBUG` | Debug mode | `False` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `localhost,127.0.0.1` |
| `CSRF_TRUSTED_ORIGINS` | Comma-separated CSRF-trusted origins | `http://localhost:8080,http://127.0.0.1:8080` |
| `POSTGRES_DB` | Database name | `photogallery` |
| `POSTGRES_USER` | Database user | `photogallery` |
| `POSTGRES_PASSWORD` | Database password | `photogallery_dev_password` |
| `POSTGRES_HOST` | Database host | `db` (in Docker) |
| `POSTGRES_PORT` | Database port | `5432` |

**Note about `CSRF_TRUSTED_ORIGINS`:** from Django 4.0 onwards, Django validates the `Origin` header of POST requests. Since the browser sends `http://127.0.0.1:8080` but Django (via Nginx) sees the host as `127.0.0.1`, the CSRF check fails. Adding the origin here tells Django "trust requests that come from this origin".

**Never commit `.env`.**

---

## The Three Docker Services

| Service | Role | Command |
|---------|------|---------|
| `db` | PostgreSQL database | (default PostgreSQL image) |
| `web` | Gunicorn + Django | `gunicorn -c gunicorn.conf.py config.wsgi:application` |
| `nginx` | Reverse proxy + static/media | (default Nginx entrypoint) |

### The three volumes

| Volume | Used by | Holds |
|--------|---------|-------|
| `postgres_data` | `db` | Database files |
| `static_files` | `web` (writes), `nginx` (reads) | `collectstatic` output (CSS) |
| `media_files` | `web` (writes), `nginx` (reads) | Uploaded photos |

### Why share volumes between `web` and `nginx`?

Because Nginx needs to read the files that Django writes. When `collectstatic` runs inside `web`, it puts CSS files into `/app/staticfiles`. When Nginx runs, it reads those files from `/staticfiles`. For that to work, both paths must point to the **same volume**.

Same story for uploaded photos: `web` writes them to `/app/media`, `nginx` reads them from `/media`.

---

## A Note About Volume Permissions

Docker creates named volumes as `root`, regardless of what the Dockerfile sets up. If your container runs as a non-root user (which is a security best practice), Django will not have permission to write to those volumes.

This project solves that with `gosu`:

1. The container **starts as root**.
2. The entrypoint script runs `chown -R appuser:appuser` on `/app/staticfiles` and `/app/media`.
3. The entrypoint **re-executes itself as `appuser`** via `gosu`.
4. From that point on, everything (migrate, collectstatic, gunicorn) runs as the non-root user.

You can see this happening in the `web` service logs:

```text
web-1 | Fixing volume permissions...
web-1 | Applying database migrations...
web-1 | Collecting static files...
web-1 | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
```

---

## How the Request Flow Works

When a browser requests `http://127.0.0.1:8080/`:

1. **Nginx** (in the `nginx` container) receives the request on port 80.
2. The path `/` does not match `/static/` or `/media/`.
3. Nginx forwards the request to `http://web:8000` (Gunicorn, in the `web` container).
4. Django handles the request, queries the database for photos, renders `photo_list.html`, and returns HTML.
5. The HTML includes `<link href="/static/gallery/style.css">`.
6. The browser then requests `/static/gallery/style.css`. This time it matches `/static/`.
7. **Nginx** serves the CSS directly, without touching Django.

This is the core value of Nginx in front of Django: **the Django process is freed up for dynamic requests only**.

---

## Common Commands

```bash
# Build and start
docker compose up --build

# See what is running
docker compose ps

# Follow Django logs
docker compose logs -f web

# Follow Nginx logs
docker compose logs -f nginx

# Open a shell inside the Django container
docker compose exec web bash

# Open a shell inside the Nginx container
docker compose exec nginx sh

# Run Django management commands
docker compose exec web python manage.py <command>

# Open psql
docker compose exec db psql -U photogallery -d photogallery

# Stop everything (keeps volumes)
docker compose down

# Stop and remove volumes (WARNING: deletes all data)
docker compose down -v
```

---

## Troubleshooting

### Problem 1: CSRF verification failed on admin login

Error:

```text
Origin checking failed - http://127.0.0.1:8080 does not match any trusted origins.
```

**Cause:** Django 4.0+ validates the `Origin` header of POST requests. When running behind Nginx on a non-standard port, Django does not trust the port by default.

**Fix:** Add `CSRF_TRUSTED_ORIGINS` to `settings.py`:

```python
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)
```

And add it to `.env`:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

Also, in `nginx.conf`, change:

```nginx
proxy_set_header Host $host;
```

to:

```nginx
proxy_set_header Host $http_host;
```

`$host` drops the port number; `$http_host` keeps it. This makes the `Host` header match the browser's `Origin`.

### Problem 2: `PermissionError: [Errno 13] Permission denied: '/app/media/photos'`

**Cause:** Docker creates named volumes as `root`. The non-root `appuser` inside the container cannot write to them.

**Fix:** Use `gosu` in the entrypoint to fix volume permissions before switching users. See the "A Note About Volume Permissions" section above.

### Problem 3: Static files show 404

**Cause:** `collectstatic` did not run, or Nginx is not mounted to the `static_files` volume.

**Check:**

```bash
docker compose logs web | grep collectstatic
docker compose exec nginx ls /staticfiles
```

Both should show files. If either is empty, `entrypoint.sh` may not be running `collectstatic`, or the volume is not mounted.

### Problem 4: Uploaded photos do not appear

**Cause:** Similar to Problem 3, but for media files.

**Check:**

```bash
docker compose exec web ls /app/media/photos
docker compose exec nginx ls /media/photos
```

Both should show the photo. If `web` has it but `nginx` does not, the `media_files` volume is not shared correctly in `compose.yaml`.

### Problem 5: `port is already allocated`

Port 8080 is in use on the host.

**Fix:** Change the host port in `compose.yaml`:

```yaml
nginx:
  ports:
    - "127.0.0.1:8081:80"
```

Then use `http://127.0.0.1:8081`.

On Windows, if the port is reserved by the system (not actually used by a process), stop WinNAT temporarily:

```powershell
net stop winnat
```

Start the containers, then:

```powershell
net start winnat
```

---

## Production Notes

Before deploying to production:

- [ ] Set `DEBUG=False`
- [ ] Use a real `SECRET_KEY` (not the default placeholder)
- [ ] Set `ALLOWED_HOSTS` to your real domain
- [ ] Set `CSRF_TRUSTED_ORIGINS` to `https://yourdomain.com`
- [ ] Use HTTPS (Nginx with a certificate from Let's Encrypt)
- [ ] Use a real secret-management system (Vault, AWS Secrets Manager)
- [ ] Increase Gunicorn workers based on CPU cores
- [ ] Persist Celery beat schedule if applicable
- [ ] Add logging aggregation
- [ ] Add rate limiting in Nginx
- [ ] Configure backups for the `postgres_data` volume

---

## Related Lessons

This project is the reference implementation for:

- [**Lesson 11 — Nginx as a Reverse Proxy**](../../en/11-nginx/README.md)

---

## License

MIT
