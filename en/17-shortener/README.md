[🇮🇷 فارسی](/fa/17-shortener/README.md)

# Lesson 17 — CI/CD with GitHub Actions: URL Shortener

## Introduction

So far, we have gone through 16 lessons and built eight projects. In Lesson 16, something very important happened: we learned how to push images to Docker Hub and pull them onto any server.

But there was a big problem: **all of this was manual!**

Imagine you are on a real team. Every time you change the code, you have to:
1. Run `docker build` (2 minutes)
2. Run `docker tag` (5 seconds)
3. Run `docker push` (1 minute)
4. Go to the server and run `docker pull`

If you change the code 20 times a day, that is **70 minutes of repetitive work**! Now imagine a team of five doing this. That is **5 hours a day** just on repetitive tasks.

**What is the solution?** We need to **automate** this loop. This is the concept of **CI/CD**. And the powerful tool we use for this is **GitHub Actions**.

**The main goal of this lesson:** after this lesson, every time you push code to GitHub, a **robot** will automatically test it, build the image, and push it to Docker Hub. You will no longer do any of this manually.

---

## What You Will Learn

By the end of this lesson, you will be able to:
- Explain what **CI/CD** is and why it is vital
- Explain what **GitHub Actions** is and how it works
- Write a **Workflow** that tests and builds images
- Implement **Matrix Strategy** for parallel builds (Backend and Frontend)
- Configure **GitHub Secrets** to store passwords securely
- Run a project with **`compose.prod.yaml`** without source code (only Docker)
- Have the **Docker mindset**: know when to build manually and when to automate

---

## 1. First, What is CI/CD? (In Very Simple Terms)

Imagine you own a cake factory.

**Without CI/CD (the old way):**
- A worker manually mixes the ingredients.
- Manually puts it in the oven.
- Manually packages it.
- Manually ships it to the store.
- Every step is prone to human error!

**With CI/CD (the modern way):**
- The worker just pours the ingredients into the hopper.
- An **automated assembly line** does the rest.
- The cakes are always consistent, high-quality, and free of human error.

### What do the two letters stand for?

| Term | Meaning | Simple factory equivalent |
|------|---------|---------------------------|
| **CI** (Continuous Integration) | Continuous merging | Whenever new ingredients arrive (code is pushed), **automatically** test that they aren't broken. |
| **CD** (Continuous Delivery/Deployment) | Continuous delivery | If tests pass, **automatically** bake and package the cake (build the image). |

**In other words:** In Lesson 16, you were the **worker**. In this lesson, you are the **factory manager**. The assembly line (GitHub Actions) does the work.

### A closer analogy with GitHub

| Factory step | Equivalent in our project |
|--------------|---------------------------|
| Worker pours ingredients into the hopper | You run `git push` |
| Machine 1 (Testing) | GitHub Actions runs `python manage.py check` |
| Machine 2 (Baking) | GitHub Actions runs `docker build` |
| Machine 3 (Packaging and shipping) | GitHub Actions runs `docker push` to Docker Hub |
| Store (Consumption) | Production server runs `docker compose pull` |

---

## 2. What is GitHub Actions?

**GitHub Actions is a robot that lives inside GitHub.**

This robot runs on a virtual machine (Ubuntu) that GitHub provides. This machine is:
- **Completely clean:** No files from your local machine are on it.
- **Temporary:** After the job is done, it is destroyed (like a hotel room after checkout).
- **Free:** For open-source projects, GitHub provides a free quota (even for private projects, you get 2,000 free minutes per month).

### How does the robot wake up?

With a YAML file inside the `.github/workflows/` folder. This file tells GitHub:
- **When** (`on`): What event should trigger it? (push, pull request, tag, etc.)
- **What** (`jobs`): What tasks should it perform? (test, build, push)

---

## 3. Project Architecture and Docker Review

The project for this lesson is a **URL Shortener**. It has four services:

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

Before we dive into CI/CD, let's review **Dockerizing** this project. The goal is to burn the process of turning a project into containers into your memory.

### 3.1. Dockerizing the Backend (Dockerfile)

`backend-django/Dockerfile`:

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

RUN mkdir -p /app/staticfiles \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

**Line-by-line review (very important):**
- **`FROM python:3.12-slim`:** Start from a base image. `slim` means the smaller, optimized version (about 150MB, versus 900MB for the full version).
- **`ENV`:** Environment variables for Python. `PYTHONUNBUFFERED=1` makes logs appear immediately in `docker logs`. `PIP_NO_CACHE_DIR=1` keeps the image smaller.
- **`WORKDIR /app`:** The working directory. All subsequent commands run here.
- **`RUN apt-get`:** Install `libpq5` (PostgreSQL client library) and `gosu` (for switching users). The `rm -rf` line clears the cache to keep the image small.
- **`COPY requirements.txt`:** We copy only the requirements file first. **Why?** Because Docker caches every layer. If the code changes but `requirements.txt` does not, the package installation step is not re-run (saving 2 minutes).
- **`RUN pip install`:** Install Python packages.
- **`COPY . .`:** Copy the rest of the code.
- **`useradd` and `USER appuser`:** Create a non-root user for security. Docker runs as root by default, which is dangerous.
- **`ENTRYPOINT` and `CMD`:** The starting point. `entrypoint.sh` runs migrations and collectstatic first, then executes `gunicorn`.

### 3.2. Entrypoint Script (entrypoint.sh)

```sh
#!/bin/sh
set -e

if [ "$(id -u)" = "0" ]; then
    echo "Fixing volume permissions..."
    chown -R appuser:appuser /app/staticfiles
    exec gosu appuser "$0" "$@"
fi

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Collecting static files..."
python manage.py collectstatic --noinput

echo "Starting: $*"
exec "$@"
```

**What happens here?**
1. The container starts as the `root` user.
2. `chown` gives ownership of the `staticfiles` folder to `appuser` (because Docker creates volumes as root).
3. It switches to the `appuser` using `gosu`.
4. It runs `migrate` and `collectstatic` as a non-root user.
5. Finally, it executes the `CMD` (`gunicorn`) using `exec`.

### 3.3. Dockerizing the Frontend (Multi-stage Build)

`frontend-react/Dockerfile`:

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**Why Multi-stage?**
- **Stage 1 (`builder`):** Installs Node.js, builds the React code. Size: ~500 MB.
- **Stage 2 (`final`):** Only Nginx + the compiled files. Size: ~55 MB.
- **Result:** The final image is 10x smaller because Node.js and `node_modules` are discarded.

### 3.4. Nginx and Redirects (Key Note)

`frontend-react/nginx.conf`:

```nginx
upstream backend { server backend:8000; }

server {
    listen 80;
    
    location /r/ {
        proxy_pass http://backend;
        # ...
    }
    
    location /api/ {
        proxy_pass http://backend;
    }
    
    location / {
        try_files $uri $uri/ /index.html;
    }
}
```

**Important note:** The `location /r/` block is placed **before** `location /`. Why? Because Nginx matches from top to bottom. If a request comes for `/r/abc123`, it must go to the backend first (for redirecting). If this block were missing, `location /` would catch it, and React would show a 404 page.

---

## 4. The Heart of the Lesson: Setting up GitHub Actions

Now let's get to the main part. We want to tell GitHub: "Every time code is pushed, test it and build the image yourself."

### 4.1. Prerequisites

**First: Create a Docker Hub Access Token**

Why not use your password? Because you should never put your main password anywhere. Create a token just for this purpose.

1. Go to `https://hub.docker.com/settings/security` (or from the left menu: `Personal access tokens`).
2. Click `Generate new token`.
3. Name it `github-actions-shortener`.
4. Permissions: **Read, Write, Delete**.
5. Click `Generate`.
6. **Copy the token and save it somewhere** (it is shown only once).

**Second: Store the Token in GitHub Secrets**

1. Go to your repo on GitHub.
2. `Settings` → `Secrets and variables` → `Actions`.
3. Click `New repository secret`.
4. Create two Secrets:
   - `DOCKERHUB_USERNAME`: Your Docker Hub username.
   - `DOCKERHUB_TOKEN`: The token you just created.

**Why Secrets?** Because these are passwords. If you write them in a code file, anyone can see them. GitHub Secrets are encrypted and are masked as `***` in Actions logs.

### 4.2. Directory Structure

The `.github/workflows/` folder must be at the **root of the repository**, not inside the project folder. Why? Because GitHub only recognizes this folder.

```text
docker-zero-to-hero/                 ← repo root
├── .github/
│   └── workflows/
│       └── ci-shortener.yml         ← CI/CD file
└── projects/
    └── 17-shortener/
        ├── backend-django/
        ├── frontend-react/
        ├── compose.yaml
        └── compose.prod.yaml
```

### 4.3. Writing the Workflow File

`.github/workflows/ci-shortener.yml`:

```yaml
name: CI — Shortener

on:
  push:
    branches: [main]
    paths:
      - 'projects/17-shortener/**'
      - '.github/workflows/ci-shortener.yml'
  pull_request:
    branches: [main]
    paths:
      - 'projects/17-shortener/**'
  workflow_dispatch:

env:
  PROJECT_DIR: projects/17-shortener
  IMAGE_PREFIX: ${{ secrets.DOCKERHUB_USERNAME }}/shortener

jobs:
  test:
    name: Test backend
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-python@v5
        with:
          python-version: '3.12'
          cache: 'pip'
      - run: pip install -r requirements.txt
        working-directory: ${{ env.PROJECT_DIR }}/backend-django
      - run: python manage.py check
        working-directory: ${{ env.PROJECT_DIR }}/backend-django
        env:
          SECRET_KEY: ci-test
          DEBUG: "False"
          POSTGRES_DB: test
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_HOST: localhost
          POSTGRES_PORT: "5432"

  build:
    name: Build ${{ matrix.image }}
    runs-on: ubuntu-latest
    needs: test
    if: github.event_name != 'pull_request'
    strategy:
      fail-fast: false
      matrix:
        include:
          - image: backend
            context: ./backend-django
          - image: frontend
            context: ./frontend-react
    steps:
      - uses: actions/checkout@v4
      - uses: docker/setup-buildx-action@v3
      - uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - uses: docker/metadata-action@v5
        id: meta
        with:
          images: ${{ env.IMAGE_PREFIX }}-${{ matrix.image }}
          tags: |
            type=ref,event=branch
            type=semver,pattern={{version}}
            type=sha,format=short
            type=raw,value=latest,enable={{is_default_branch}}
      - uses: docker/build-push-action@v6
        with:
          context: ${{ env.PROJECT_DIR }}/${{ matrix.context }}
          push: true
          tags: ${{ steps.meta.outputs.tags }}
          labels: ${{ steps.meta.outputs.labels }}
          cache-from: type=gha
          cache-to: type=gha,mode=max
```

### 4.4. Line-by-Line Explanation (The Most Important Part)

Let's dissect this file together.

**The `on` section: When should it run?**
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'projects/17-shortener/**'
```
- `push` on the `main` branch.
- `paths`: Only if the changes are inside `projects/17-shortener/`. **Why?** Because our repo has 10 projects. If we change code in project 9, this workflow should not run.
- `**` means any file at any depth.
- `pull_request`: Also runs to test before a merge.
- `workflow_dispatch`: A manual button in the GitHub UI to trigger the workflow manually.

**The `env` section: Shared variables**
```yaml
env:
  PROJECT_DIR: projects/17-shortener
  IMAGE_PREFIX: ${{ secrets.DOCKERHUB_USERNAME }}/shortener
```
- `PROJECT_DIR`: So if we move the project path, we only change it in one place.
- `IMAGE_PREFIX`: The image name on Docker Hub.
- `${{ secrets.DOCKERHUB_USERNAME }}`: Reads the Secret value from GitHub.

**Job 1: `test`**
```yaml
test:
  name: Test backend
  runs-on: ubuntu-latest
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-python@v5
      with:
        python-version: '3.12'
        cache: 'pip'
    - run: pip install -r requirements.txt
      working-directory: ${{ env.PROJECT_DIR }}/backend-django
    - run: python manage.py check
```
- `runs-on: ubuntu-latest`: We get a cloud Ubuntu machine from GitHub.
- `actions/checkout@v4`: Downloads the repo code onto the machine. (Without this, the machine is empty!)
- `actions/setup-python@v5`: Installs Python 3.12. `cache: 'pip'` caches packages between runs (from 1 minute to 5 seconds).
- `pip install`: Installs requirements.
- `python manage.py check`: Django health check. If there is an import error, missing migration, or config error, this step fails.
- `env`: Environment variables for the test. Without these, `settings.py` (which reads from `.env`) would error out.

**Job 2: `build`**
```yaml
build:
  name: Build ${{ matrix.image }}
  runs-on: ubuntu-latest
  needs: test
  if: github.event_name != 'pull_request'
  strategy:
    fail-fast: false
    matrix:
      include:
        - image: backend
          context: ./backend-django
        - image: frontend
          context: ./frontend-react
```
- `needs: test`: **The most important line!** Job `build` only runs after `test` passes. If tests fail, `build` is skipped → **broken code is never built.**
- `if: github.event_name != 'pull_request'`: On a PR, only run tests, not build. Why? Because a PR hasn't been merged yet. Pushing an image from a PR pollutes Docker Hub.
- `strategy: matrix`: A great trick. Instead of writing two separate Jobs (one for backend, one for frontend), we write one Job that runs **in parallel for two cases**. Result: **half the time**.
- `fail-fast: false`: If backend fails, keep running frontend.

**Steps of Job 2**
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: docker/setup-buildx-action@v3
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
```
- `setup-buildx-action`: Installs Buildx. Needed for layer caching (5x faster).
- `login-action`: Logs into Docker Hub. Without this, it cannot push.

**Generating Tags (metadata)**
```yaml
- uses: docker/metadata-action@v5
  id: meta
  with:
    images: ${{ env.IMAGE_PREFIX }}-${{ matrix.image }}
    tags: |
      type=ref,event=branch
      type=semver,pattern={{version}}
      type=sha,format=short
      type=raw,value=latest,enable={{is_default_branch}}
```
This step automatically generates tags:
| Trigger | Generated tags |
|--------|-----------|
| Push to `main` | `main`, `latest`, `sha-a1b2c3d` |
| Tag `v1.0.0` | `1.0.0`, `1.0` |

**Final Step: Build and Push**
```yaml
- uses: docker/build-push-action@v6
  with:
    context: ${{ env.PROJECT_DIR }}/${{ matrix.context }}
    push: true
    tags: ${{ steps.meta.outputs.tags }}
    labels: ${{ steps.meta.outputs.labels }}
    cache-from: type=gha
    cache-to: type=gha,mode=max
```
- `context`: The project path (different for backend and frontend).
- `push: true`: After building, push to Docker Hub.
- `cache-from` and `cache-to`: Use GitHub Actions cache (first run 3 mins, subsequent runs 30 seconds).

### 4.5. Testing and Seeing the Result

Now push the file:
```bash
git add .github/workflows/ci-shortener.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

Go to the **Actions** tab in your repo.

**Expected:** You will see three Jobs:
```text
✅ CI — Shortener / Test backend
✅ CI — Shortener / Build backend
✅ CI — Shortener / Build frontend
```

**Once they are green, go to Docker Hub:**
`https://hub.docker.com/r/<username>/shortener-backend/tags`

**Expected:** You will see several new tags (`main`, `latest`, `sha-...`).

---

## 5. What to do in Production?

After the images are on Docker Hub, how do we use them on the production server?

The `compose.prod.yaml` file is exactly like `compose.yaml`, but:
- `build:` is removed → replaced by `image:`
- `image: <username>/shortener-backend:latest`

```yaml
services:
  backend:
    image: ${DOCKERHUB_USERNAME}/shortener-backend:latest
    # ...
  frontend:
    image: ${DOCKERHUB_USERNAME}/shortener-frontend:latest
    # ...
```

**Real test:**
1. Delete the code from the server (simulate a clean server).
2. Keep only `compose.prod.yaml` and `.env`.
3. Run `docker compose -f compose.prod.yaml up`.
4. **You should see:** `✔ shortener-backend Pulled` and `✔ shortener-frontend Pulled`.
5. The project starts without a single line of code. ✅

---

## 6. Summary

### What we learned

**1. Docker mindset — Question 10 was added:**
1 to 8. (Same as previous questions)
9. **Where do images live?** → Registry
10. **Who pushes the images?** → **GitHub Actions robot** ⭐

**2. What is GitHub Actions?**
- A robot that lives on GitHub.
- Configured with `.github/workflows/*.yml`.
- Runs on a clean Ubuntu machine.

**3. Three main sections of a Workflow:**
- **`on`:** When it runs
- **`jobs`:** What tasks it performs
- **`steps`:** How each Job is performed

**4. Matrix Strategy:**
- Instead of two separate Jobs, one Job with two `include`s.
- Result: parallel build → half the time.

**5. Secrets:**
- Never write passwords in code.
- Store them in GitHub Settings → Secrets.
- Access them in workflow via `${{ secrets.NAME }}`.

**6. Difference between `compose.yaml` and `compose.prod.yaml`:**
| Section | dev | prod |
|---------|-----|------|
| `build:` | ✅ | ❌ |
| `image:` | ❌ | ✅ |
| Needs code | ✅ | ❌ |

### Golden rule of this lesson:

**"Build once (GitHub Actions), pull everywhere (production)."**

With GitHub Actions, this rule becomes **automatic**.

### What comes next

**Lesson 18 — Portfolio (Deploy to VPS + SSL + Domain)**

A new project that:
- Deploys to a real server (VPS).
- Gets a custom domain.
- Installs SSL with Let's Encrypt.
- **The project goes fully online from scratch.**

And after that:
- **Lesson 19:** Vault (Security: Trivy, Secrets, Hardening)
- **Lesson 20:** Log Analyzer (Deep debugging)
- **Lesson 21:** Cheat Sheet + Docker Templates
- **Lesson 22:** Wrap-up + Roadmap

