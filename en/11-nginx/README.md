[🇮🇷 فارسی](/fa/11-nginx/README.md)

# Lesson 11 — Nginx as a Reverse Proxy

## Introduction

In the previous two lessons, we built two real projects: a task-management API (TaskFlow) and a URL monitor (URL Monitor). Both ran with Docker and PostgreSQL, and in Lesson 10 we added Celery and Redis.

But both projects had one thing in common: **they were APIs only, with no visual interface**. When you opened them in a browser, you saw a simple JSON page, not a real website.

In this lesson, we build the first project that has a **real frontend**. A beautiful photo gallery with a dark theme, animations, and a masonry grid. Something worth screenshotting.

But beautiful design is only a small part of the story. When you build a real website, you have to ask:

> "How do I deliver CSS files and photos to the user, without slowing down my server?"

The answer is **Nginx**. A separate piece of software whose job is to sit **in front of** the Django application, receive requests, answer some of them directly, and pass the rest to Django.

In this lesson, we bring Nginx into a project for the first time, and you will see its effect **with your own eyes** in the browser's DevTools.

The complete project code is in `projects/11-photo-gallery/` in the repository. In this lesson, we review it line by line.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain why `runserver` is not suitable for production
- Explain what Gunicorn is and why we need it
- Explain what Nginx is and what role it plays in the architecture
- Explain what a Reverse Proxy is (with a simple analogy)
- Understand `collectstatic` and why it is needed
- Write an `nginx.conf` that serves CSS files and photos
- Explain the difference between `static` and `media`
- Coordinate three services (`db`, `web`, `nginx`) with `compose.yaml`
- Use the browser DevTools to confirm that Nginx is doing its job
- Handle two common problems (Permission and CSRF)
- Explain the difference between a named Docker volume and a bind mount

---

## Prerequisites

- Everything from Lesson [09](/en/09-django-docker/README.md) (Dockerfile, compose, entrypoint, django-environ)
- Everything from Lesson [10](/en/10-celery-redis/README.md) (multi-service, volume management)
- Basic familiarity with HTML and CSS (if not, do not worry — the code is provided)
- Basic familiarity with Django

---

## The Project — Aurora Gallery

**Story:**

A simple photo gallery. From the admin panel, you upload photos. A public page shows all photos with a professional look (dark theme, animations, masonry grid).

**Why was this project chosen for the Nginx lesson?**

Because it has three types of content:

1. **Dynamic HTML** (gallery page, detail page) — comes from Django
2. **Static CSS** (`style.css`) — should come from Nginx
3. **Media photos** (uploaded images) — should come from Nginx

In the browser's DevTools, you can see where each one comes from. This is what makes Lesson 11 **tangible**.

**Stack:**

- Python 3.12
- Django 5.1.4
- Gunicorn 23.0.0
- Nginx 1.27
- PostgreSQL 16
- Pillow 11.0.0 (for image processing)
- django-environ 0.14.0

---

## First, a Simple Explanation of the New Concepts

Before we touch any code, let me explain three new concepts from this lesson with everyday analogies.

### What is Gunicorn?

In previous lessons, we used `runserver`. Now we switch to **Gunicorn**. Why?

**Imagine a restaurant with one chef.**
- In the morning, when there are few customers, one chef is enough.
- In the evening, when the restaurant is busy, that one chef locks up. Customers wait.

**`runserver`** = that one chef. Good for testing, but cannot handle busy hours.

**`Gunicorn`** = a team of chefs working in parallel. It spawns several `worker` processes. Each worker is a copy of your application. If one is busy, the others still respond.

**Important technical note:** Gunicorn does not run natively on Windows (it uses `fork()`, which is Linux-only). That is why we run it inside Docker, which is Linux.

### What is Nginx?

**Imagine an office building.**
- There is a **security guard** at the door. Anyone who wants to enter first meets the guard.
- If someone asks for a **file from the archive** (getting a document, a paper), the guard fetches it directly. This is fast, because no specialist is involved.
- If someone needs **specialized work** (signing a new contract), the guard sends them to a specialist (Django). This takes a bit of time, but the guard remains free to help other visitors.

**Nginx** is exactly that guard. Its job is to:

1. **Serve static requests** (CSS files, images, JavaScript) **itself**. Fast, without involving Django.

2. **Forward dynamic requests** (gallery page, admin panel) to Django. Django processes them.

Why does this matter?

| Request | Without Nginx | With Nginx |
|---------|---------------|------------|
| CSS file | Django has to run Python code, read the file, return it | Nginx reads it from disk directly, 100x faster |
| Photo | Same | Same |
| Gallery page | Django processes it | Django processes it (Nginx just passes it through) |

**Bottom line:** Nginx frees up the Django server to focus only on dynamic work.

### What is a Reverse Proxy?

**Imagine a large company.**
- Everyone knows the company's phone number: `555-1234`
- But anyone who calls cannot directly reach the CEO
- First the **receptionist** answers, then figures out who the call is for and connects them

A **Reverse Proxy** is the same idea. It is an **intermediary** that sits in front of the main server and forwards requests to internal servers.

Difference from a regular proxy:
- **Forward Proxy** sits in front of the **user**. Like a VPN. The user wants to reach site X, first connects to the proxy, the proxy fetches site X.
- **Reverse Proxy** sits in front of the **server**. The user thinks they are talking to the main server, but they are actually talking to an intermediary.

In our project:

```text
User ──► Nginx (Reverse Proxy) ──► Django
```

The user does not talk to Django directly. They talk to Nginx first. Nginx decides whether to answer the request itself or send it to Django.

### What is `collectstatic`?

**Imagine you own a library.**
- Books are scattered across different shelves (in each room, on each shelf)
- When someone wants a book, they have to search every shelf
- Better approach: gather all important books in one central room, alphabetically sorted

**`collectstatic`** does the same thing with CSS and JS files. It collects all static files from all apps (just `gallery` in this project, but you may have several apps later) into a central folder. Then Nginx reads from that folder.

Without `collectstatic`, Django cannot serve static files in production. Because each file lives in its own app's folder, and finding them is slow.

---

## static vs media — What is the Difference?

This distinction is very important and can be confusing. Let me explain simply.

### Static

Files that **you** created as a developer:
- `style.css` that you wrote by hand
- Logo images and icons you designed
- JavaScript files you wrote

**Properties:**
- Change only when you change the code
- Shared by all users (everyone sees the same CSS)
- Collected by `collectstatic`
- Stored in `STATIC_ROOT` (in this project: `/app/staticfiles`)

### Media

Files that the **user** uploads:
- Photos uploaded to the gallery
- PDFs uploaded by users
- Anything that comes from the user side

**Properties:**
- Change as the user works (new user, new photo)
- Different for each user
- Not collected by `collectstatic` (they are already in `MEDIA_ROOT`)
- Stored in `MEDIA_ROOT` (in this project: `/app/media`)

### Example

Imagine an online store:

- **Static**: store logo, CSS file, JavaScript file
- **Media**: product photos uploaded by the admin

Both must reach the user, but they are managed differently.

---

## Directory Structure

The project structure:

```text
11-photo-gallery/
├── .dockerignore
├── .env
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

Three new files compared to Lesson 10:

- **`gunicorn.conf.py`** — Gunicorn configuration
- **`nginx/nginx.conf`** — Nginx configuration
- **`gallery/static/`** and **`gallery/templates/`** — presentation files

**Note:** There is a `.gitignore` at the repository root that covers all projects. That is why this project does not have one of its own.

---

## Step 1 — Dependencies

File `requirements.txt`:

```txt
Django==5.1.4
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
Pillow==11.0.0
```

**Two new packages:**

- **`gunicorn`** — Python WSGI server for production
- **`Pillow`** — image processing library. Django needs it for `ImageField`

**Note:** We do not need `djangorestframework` this time, because the focus is on HTML and Nginx, not APIs.

---

## Step 2 — Gunicorn Configuration

File `gunicorn.conf.py`:

```python
"""
Gunicorn configuration for Photo Gallery.

We use a separate config file (instead of command-line flags) so we can
read values from environment variables, keep the Dockerfile CMD clean,
and still use the "exec form" (which handles signals correctly).

Run with:
    gunicorn -c gunicorn.conf.py config.wsgi:application
"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

workers = int(os.environ.get('GUNICORN_WORKERS', '3'))

accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

timeout = int(os.environ.get('GUNICORN_TIMEOUT', '30'))
```

### What is each setting?

| Setting | Meaning | Why |
|---------|---------|-----|
| `bind` | Address and port | `0.0.0.0` means "all network interfaces" (needed for Docker) |
| `workers` | Number of parallel processes | 3 is fine for this project |
| `accesslog` | `-` means "to stdout" | So `docker logs` can see them |
| `errorlog` | `-` means "to stderr" | For errors |
| `loglevel` | Log level | `info` means normal logs |
| `timeout` | If a worker hangs longer than this, kill it | 30 seconds |

---

## Step 3 — Nginx Configuration

File `nginx/nginx.conf`:

```nginx
upstream django {
    server web:8000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location /static/ {
        alias /staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /media/ {
        alias /media/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    location / {
        proxy_pass http://django;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

### Let's walk through it line by line

**`upstream django { server web:8000; }`**

An alias for the Django service. `web` is the name of the service in `compose.yaml`. Nginx, inside the Docker network, can reach it by name (Docker has an internal DNS that turns service names into IPs).

**`listen 80;`**

Nginx listens on port 80 inside the container. In `compose.yaml`, we map that to 8080 on the host.

**`client_max_body_size 20M;`**

By default, Nginx limits uploads to 1 MB. That is too small for photos. 20 MB is reasonable.

**`location /static/` and `location /media/`**

Any request starting with `/static/` or `/media/` is served by Nginx from the `staticfiles` and `media` folders (inside the nginx container).

**`expires 30d;`**

The browser caches the file for 30 days. If the user returns, the browser serves from cache, not the server.

**`access_log off;`**

Do not log every file load. This keeps the logs smaller.

**`location /`**

Any other request (gallery page, admin panel) is forwarded to Django.

**The `proxy_set_header` headers**

When Nginx forwards the request to Django, it adds these headers so Django knows where the request came from:

- **`Host`** — the domain name (or IP) the user used. `$http_host` keeps the port (important for CSRF).
- **`X-Real-IP`** — the real client IP (Nginx is here, so without this header Django only sees Nginx's IP).
- **`X-Forwarded-For`** — the chain of IPs (for when multiple proxies are involved).
- **`X-Forwarded-Proto`** — whether the user came via `http` or `https`.

---

## Step 4 — Dockerfile with `gosu`

File `Dockerfile`:

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

RUN mkdir -p /app/staticfiles /app/media \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
```

### Important differences from previous lessons

**1. `gosu` is installed:**

```dockerfile
&& apt-get install -y --no-install-recommends libpq5 gosu
```

`gosu` is a small tool that acts like `sudo` but simpler. It lets us run a command as another user. We will see why we need it in the next step.

**2. The `USER appuser` line is removed:**

We had it in Lessons 09 and 10. This time we **removed** it. Why?

Because we want the container to start as `root`, fix the volume ownership, and then switch to `appuser`. If we were `appuser` from the start, we could not `chown`.

**3. `CMD` uses Gunicorn:**

```dockerfile
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
```

Instead of `runserver`. `-c gunicorn.conf.py` means "read settings from this file". `config.wsgi:application` means "get the WSGI application from `config/wsgi.py`".

**Why the array form (`[...]`)?**

If we wrote `CMD gunicorn -c gunicorn.conf.py config.wsgi:application` (without the array), Docker would run a shell that runs Gunicorn. Then Gunicorn would be PID 2 and the shell would be PID 1. The `docker stop` signals would reach the shell, not Gunicorn.

With the array form, Gunicorn becomes PID 1 directly. This is important so `docker stop` works correctly.

---

## Step 5 — entrypoint.sh with `gosu`

File `entrypoint.sh`:

```sh
#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
    echo "Fixing volume permissions..."
    chown -R appuser:appuser /app/staticfiles /app/media
    exec gosu appuser "$0" "$@"
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting: $*"
exec "$@"
```

### This file has a story — let me tell it

We hit a problem early on that is very common. Let me explain why this file is written this way.

**Problem 1 (Volume Permission):**

In `compose.yaml` we have:

```yaml
web:
  volumes:
    - media_files:/app/media
```

Docker creates a volume called `media_files`. **The problem:** Docker always creates volumes with `root` ownership, even if the Dockerfile says it should be owned by `appuser`. Because the volume mounts on top of the Image folder and imposes its own ownership.

Result: the `appuser` user cannot write to `/app/media`. Django throws a `PermissionError`.

**Solution:**

The container starts as `root`. `entrypoint.sh` fixes ownership. Then switches to `appuser`.

**Line by line:**

**`if [ "$(id -u)" = "0" ]`**

`id -u` returns the numeric ID of the current user. `root` is always `0`. This line says: "if we are running as root..."

**`chown -R appuser:appuser /app/staticfiles /app/media`**

Gives ownership of these two folders (and everything in them) to `appuser`. `-R` means "recursively, all subfolders and files".

**`exec gosu appuser "$0" "$@"`**

`gosu` re-executes this file (`$0`) with the same original arguments (`$@`), but this time as `appuser`. `exec` replaces the current process (rather than spawning a new one).

**The second time the file runs:**
- `id -u` is no longer `0` (we are `appuser`)
- The `if` block is skipped
- `migrate`, `collectstatic`, and `gunicorn` run as `appuser`

**The `collectstatic` line:**

```sh
python manage.py collectstatic --noinput
```

Collects all CSS files from `gallery/static/` and puts them in `/app/staticfiles/`. This folder is mounted to `nginx`.

**Note:** `collectstatic` runs in `entrypoint.sh`, not in `Dockerfile`. Why? Because at `docker build` time, `settings.py` is loaded and requires the database. But at build time, the database is not available. So we run `collectstatic` after the database is up.

---

## Step 6 — `compose.yaml` with Three Services

File `compose.yaml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-photogallery}
      POSTGRES_USER: ${POSTGRES_USER:-photogallery}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-photogallery_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-photogallery} -d ${POSTGRES_DB:-photogallery}"]
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
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8080,http://127.0.0.1:8080}
      POSTGRES_DB: ${POSTGRES_DB:-photogallery}
      POSTGRES_USER: ${POSTGRES_USER:-photogallery}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-photogallery_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
    volumes:
      - static_files:/app/staticfiles
      - media_files:/app/media
    depends_on:
      db:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 20s
    restart: unless-stopped

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - static_files:/staticfiles:ro
      - media_files:/media:ro
    depends_on:
      web:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
  media_files:
```

### Let's review together

**Three volumes:**

| Volume | Used by | What it holds |
|--------|---------|---------------|
| `postgres_data` | only `db` | Database |
| `static_files` | `web` (writes), `nginx` (reads) | CSS files |
| `media_files` | `web` (writes), `nginx` (reads) | Uploaded photos |

**Why is the volume shared between `web` and `nginx`?**

Because Nginx needs to read the files Django writes. `web` writes, `nginx` reads. So both connect to the same volume.

**What does `:ro` mean?**

`read-only`. Nginx only reads, never writes. This is a safeguard: if a bug in nginx tries to write, it cannot.

**How is `nginx.conf` connected?**

```yaml
- ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

The `nginx.conf` file on your system replaces the default Nginx config. So if you want to change settings, you edit the file and run `docker compose restart nginx`. No need to rebuild the Image.

**The `web` healthcheck:**

```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"]
```

Since the Python Image does not have `curl`, we use Python itself. If it responds, the service is healthy.

**`depends_on`:**

```yaml
nginx:
  depends_on:
    web:
      condition: service_healthy
```

Nginx waits until `web` is truly ready (healthcheck passes), then starts. This is a step beyond the previous lessons.

---

## Step 7 — `settings.py` (important additions)

In `config/settings.py`, add these:

```python
# After ALLOWED_HOSTS:
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)

# After STATIC_URL:
STATIC_ROOT = BASE_DIR / 'staticfiles'

# After MEDIA_URL:
MEDIA_ROOT = BASE_DIR / 'media'
```

### What do these three lines do?

**`CSRF_TRUSTED_ORIGINS`** — a security concept. Full explanation in "Problem 2".

**`STATIC_ROOT`** — the folder where `collectstatic` puts all CSS files.

**`MEDIA_ROOT`** — the folder where uploaded photos are stored.

---

## Step 8 — Running It

From inside `projects/11-photo-gallery/`:

```bash
docker compose up --build
```

### What you should see:

**Stage 1:**

```text
[+] Running 4/4
 ✔ db Pulled
 ✔ nginx Pulled
 ✔ web Building
```

**Stage 2 (build web):**

```text
 => [1/7] FROM python:3.12-slim
 => [2/7] WORKDIR /app
 => [3/7] RUN apt-get update ...
 => [4/7] COPY requirements.txt .
 => [5/7] RUN pip install -r requirements.txt
 => [6/7] COPY . .
 => [7/7] RUN mkdir -p ... useradd ...
 => exporting to image
```

**Stage 3 (starting services):**

```text
 ✔ Container 11-photo-gallery-db-1     Started
 ✔ Container 11-photo-gallery-db-1     Healthy
 ✔ Container 11-photo-gallery-web-1    Started
 ✔ Container 11-photo-gallery-web-1    Healthy
 ✔ Container 11-photo-gallery-nginx-1  Started
```

**Stage 4 (live logs):**

```text
db-1     | ... database system is ready to accept connections
web-1    | Fixing volume permissions...
web-1    | Applying database migrations...
web-1    | Collecting static files...
web-1    | 128 static files copied to '/app/staticfiles'.
web-1    | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
web-1    | [INFO] Starting gunicorn 23.0.0
web-1    | [INFO] Listening at: http://0.0.0.0:8000
nginx-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
```

**If you see these lines, you succeeded!** 🎉

---

## Step 9 — Testing

### Test 1 — Health endpoint

```text
http://127.0.0.1:8080/health/
```

You should see `{"status": "ok"}`.

### Test 2 — Gallery home page

```text
http://127.0.0.1:8080/
```

You should see the "Aurora Gallery" page:
- Glassmorphism header at the top
- Big gradient title
- "The gallery is empty" message

### Test 3 — Confirm CSS comes from Nginx (the most important test!)

This test justifies the entire lesson:

1. Press `F12` (open DevTools)
2. Go to the **Network** tab
3. Reload the page
4. Find `style.css` and click on it
5. In the **Response Headers**, look for `Server`

You should see:

```text
Server: nginx/1.27.x
```

**If you saw `Server: gunicorn`, Nginx is not doing its job.** If you saw `nginx`, great.

**Why is this important?** Because it confirms that Nginx is serving the CSS, not Django. Our architecture is correct.

### Test 4 — Create an admin user

In another terminal:

```bash
docker compose exec web python manage.py createsuperuser
```

### Test 5 — Log in to the admin panel

```text
http://127.0.0.1:8080/admin/
```

Log in with your credentials.

**If you get a CSRF error, do not worry — we fix it in "Problem 2".**

### Test 6 — Upload a photo

In the admin panel:
- **Photos** → **ADD PHOTO**
- **Title**: `My First Photo`
- **Image**: pick a file
- **SAVE**

**If you get a Permission error, do not worry — we fix it in "Problem 1".**

### Test 7 — See the photo

Go back to:

```text
http://127.0.0.1:8080/
```

You should see your photo in a beautiful card. Hover over it:
- The image scales up
- A dark overlay appears from the bottom
- The title slides up
- A purple glow appears around the card

### Test 8 — Confirm photos come from Nginx

Press `F12` again, Network tab, reload the page. This time find the photo you uploaded (its URL starts with `/media/`). Click on it. In Response Headers:

```text
Server: nginx/1.27.x
```

**Excellent!** Nginx is serving both CSS and photos. 🎯

---

## Problem 1 — Permission Error When Uploading Photos

### What happens?

When you upload a photo, you see:

```text
PermissionError: [Errno 13] Permission denied: '/app/media/photos'
```

### Why does this happen?

Remember in `compose.yaml` we said:

```yaml
web:
  volumes:
    - media_files:/app/media
```

Docker creates a volume called `media_files`. But **Docker always creates volumes with `root` ownership**, regardless of what the `Dockerfile` says.

Result:
- `/app/media` inside the container is owned by `root`
- Django runs as `appuser`
- `appuser` cannot write to it
- Permission error

### The fix

We use `gosu`. The container starts as `root`, fixes ownership, then switches to `appuser`. The code is in `entrypoint.sh`, which we explained above.

**Result in logs:**

```text
web-1 | Fixing volume permissions...
web-1 | Applying database migrations...
web-1 | Collecting static files...
web-1 | Starting: gunicorn ...
```

The first line shows that `entrypoint.sh` ran as root and fixed ownership. ✅

---

## Problem 2 — CSRF Error When Logging In

### What happens?

When you enter your username and password, you see:

```text
Forbidden (403)
CSRF verification failed. Request aborted.

Origin checking failed - http://127.0.0.1:8080 does not match any trusted origins.
```

### Why does this happen?

**What is CSRF?** A type of attack. Imagine you logged in to your bank. Without logging out, you open a malicious site. That malicious site sends a hidden request to the bank: "transfer money to account X". Because you are still logged in, the bank thinks you are making the request.

To prevent this attack, Django uses a mechanism called **CSRF Token**. Each form has a hidden token that only Django knows.

Since Django 4.0, an additional layer of security was added: **Origin Checking**. Django checks which origin the request came from. If the origin is not in the trusted list, it is rejected.

**Our problem:**

- You access the site from `http://127.0.0.1:8080`
- Your browser sends `Origin: http://127.0.0.1:8080` to Django
- But Nginx sends `Host: 127.0.0.1` (without the port)
- Django compares them: `127.0.0.1:8080` vs `127.0.0.1` — **they differ**
- So it rejects the request

### The fix — two changes needed

**1. Add `CSRF_TRUSTED_ORIGINS` to `settings.py`:**

```python
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)
```

And to `.env`:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

**2. Fix `nginx.conf`:**

This line:

```nginx
proxy_set_header Host $host;
```

Change it to:

```nginx
proxy_set_header Host $http_host;
```

**Difference between `$host` and `$http_host`:**

- `$host` = domain name **without** port (`127.0.0.1`)
- `$http_host` = domain name **with** port (`127.0.0.1:8080`)

`$http_host` is correct because it matches the browser's `Origin`.

**After both changes:**

```bash
docker compose down
docker compose up --build
```

Now you can log in to the admin.

**Note:** This error only occurs in development with a non-standard port. In production, your domain does not have a port (e.g., `https://mygallery.com`), so it does not matter. But we set this up now so it is ready for production too.

---

## An Important Note About Volumes and Bind Mounts

You might ask: "Where are the photos I uploaded? Why are they not in the project folder?"

### Why is `media/` not in the project folder?

Because we used a **named volume**:

```yaml
volumes:
  - media_files:/app/media
```

Docker keeps named volumes in its own storage, not in the project folder. On Windows with Docker Desktop, the real path is inside the WSL2 virtual disk.

### Why is this design better?

**Key insight: code ≠ data**

- **Code** (settings.py, views.py, templates) → inside the Image
- **Data** (uploaded photos, database) → in separate volumes

Three important reasons:

**1. Easy cleanup:** `docker compose down -v` removes all data at once, without touching the code.

**2. Clean backups:** you back up only `media_files`, without mixing code into it.

**3. Portable between systems:** if you deploy to a real server someday, `media/` lives on a separate storage (like S3). This mindset is practiced now.

### If you want photos in the project folder (not recommended)

Use a **bind mount**:

```yaml
web:
  volumes:
    - ./media:/app/media
nginx:
  volumes:
    - ./media:/media:ro
```

Now `media/` is created in the project folder. But:

- On Windows, this is slower (translation between NTFS and WSL2)
- If `.gitignore` is not perfect, photos could end up in Git
- Not standard in production

**Difference between named volume and bind mount:**

| Feature | Named Volume | Bind Mount |
|---------|--------------|------------|
| Where it is stored | Inside Docker storage | In the folder you choose |
| Managed by | Docker | You |
| Speed (on Windows) | Fast | Slower |
| Suitable for production | ✅ | ❌ (usually) |
| Suitable for development | ⚠️ (harder to inspect files) | ✅ |

---

## Common Commands

| Command | What it does |
|---------|--------------|
| `docker compose up --build` | Build and start all services |
| `docker compose up -d` | Start in background |
| `docker compose ps` | Show service status |
| `docker compose logs -f web` | Follow Django logs |
| `docker compose logs -f nginx` | Follow Nginx logs |
| `docker compose exec web bash` | Open a shell inside the Django container |
| `docker compose exec nginx sh` | Open a shell inside Nginx |
| `docker compose exec db psql -U photogallery -d photogallery` | Open psql |
| `docker compose down` | Stop and remove containers (keeps the volume) |
| `docker compose down -v` | **DANGER:** also removes the volume |

---

## Common Problems

### Problem 1 — `port is already allocated`

Port 8080 is in use on the host.

**Fix:** Change the port:

```yaml
nginx:
  ports:
    - "127.0.0.1:8081:80"
```

Then use `http://127.0.0.1:8081`.

### Problem 2 — Static files return 404

**Cause:** `collectstatic` did not run, or Nginx is not mounted to the volume.

**Check:**

```bash
docker compose logs web | grep collectstatic
docker compose exec nginx ls /staticfiles
```

If empty, `entrypoint.sh` or `collectstatic` or the volume mount is the issue.

### Problem 3 — Uploaded photos do not appear

**Cause:** Same as the previous problem, but for media.

**Check:**

```bash
docker compose exec web ls /app/media/photos
docker compose exec nginx ls /media/photos
```

If `web` has it but `nginx` does not, the `media_files` volume is not shared correctly.

---

## Exercises

1. Run `docker compose up --build` and confirm all three services are up.

2. Create an admin user and log in.

3. Upload a photo. If you get a Permission error, check `entrypoint.sh`.

4. Press `F12` → Network → `style.css` → Response Headers → check `Server`. It should be `nginx`.

5. Upload a photo, then in Network, check the photo's `Server` header. It should be `nginx`.

6. Run `docker compose exec web ls /app/media/photos`. You should see the photos you uploaded.

7. Run `docker volume inspect 11-photo-gallery_media_files`. Look at `Mountpoint`.

8. **Challenge:** add an "About" page to the gallery. Define a route `/about/`, build a view, create a new HTML template with `{% extends 'gallery/base.html' %}`. Test that it works through Nginx too.

---

## Summary

In this lesson, we learned:

- What **Gunicorn** is and why `runserver` is not suitable for production.
- What **Nginx** is and what role it plays in the architecture.
- What a **Reverse Proxy** is (with the guard/archive analogy).
- What **collectstatic** is and why it is needed.
- The difference between **static** and **media**.
- How to write `nginx.conf` to serve CSS files and photos.
- How `gosu` helps us fix volume ownership.
- How to configure CSRF for running behind Nginx.
- The difference between a **named volume** and a **bind mount**.

**The key picture of this lesson:**

```text
User ──► Nginx (the guard)
             │
             ├──► CSS file?        I serve it myself (fast).
             │
             ├──► Photo?           I serve it myself (fast).
             │
             └──► Dynamic page?    I forward it to Django.
                                      │
                                      ▼
                                  Gunicorn + Django
```

This is the exact production architecture used in real companies.

---

## Next Lesson

**Lesson 12 — Frontend Project: React with Docker**

In the next lesson, we build the first **frontend project**: a React app running in Docker. We will learn:

- What React is and how it works with Docker
- The difference between a development server and a production build
- How to turn a React app into a static web server
- How to serve React with Nginx
  