[🇮🇷 فارسی](/fa/16-bookmarks/README.md)

# Lesson 16 — Docker Registry: Sharing Images Through Docker Hub

## Introduction

We have gone through 15 lessons and built seven projects. In all of them, one thing was common: **every image we built lived only on our own machine.** Nobody else could use it.

Imagine you want to hand your project to a teammate. They would need to:

- Receive the entire codebase (or `git clone` it)
- Have Docker installed
- Run `docker compose up --build` themselves
- Wait for pip, npm, build, and everything else to finish

**That means anyone who wants to run the project needs the full development toolchain.**

But that is not how it works. In the real world, production servers have **only Docker.** No Python, no Node, no source code. Just Docker.

**The question:** How do you run a project on a blank server without the source code?

**The answer:** with a **Docker Registry**. And that is exactly what this lesson is about.

### Why is this lesson important?

Everything we have learned so far lived **inside our own machine's boundaries**. This lesson **breaks that boundary.** We will learn how to store images in a cloud warehouse called **Docker Hub**, making them usable from anywhere in the world.

This is a **paradigm shift**. It is like the difference between carrying a file on a USB stick and putting it in Google Drive. Both work, but the second is **more scalable, more shareable, and more professional.**

**The main goal of this lesson:** after it, you will know how to move an application from your laptop to a server anywhere in the world, without sending a single source file.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain what a **Docker Registry** is and how it differs from Docker Hub
- Explain why images need **tags** and how they work
- **Log in** to Docker Hub
- **Tag** your images so they can be pushed
- **Push** images to Docker Hub
- **Pull** images on a clean machine and run the project without source code
- Explain why we need **two compose files**
- Publish a new image version **without stopping the service**
- Have the **Docker mindset**: know when to use code, when to use a ready-made image, and when to use your own image from a Registry

---

## 1. First, What Is a Registry?

Before anything else, let me explain in the simplest possible way.

### What is a Registry?

Imagine a **large warehouse** where Docker images are stored. Anyone with the right credentials can pull from it and use what is inside. That warehouse is called a **Registry**.

**Simple analogies:**

| Everyday thing | Docker equivalent |
|----------------|-------------------|
| Google Drive / OneDrive | Registry |
| File | Image |
| Folder | Repository |
| File version (`report-v1.docx`) | Tag |
| `Upload` | `docker push` |
| `Download` | `docker pull` |

Which means:

- **Image** → a file (say, a Word report)
- **Repository** → a folder (say, "Monthly Reports")
- **Tag** → a file version (`v1`, `v2`, `final`)
- **Registry** → Google Drive / OneDrive
- **Push** → upload
- **Pull** → download

### What is Docker Hub?

**Docker Hub** is the most popular Registry in the world. A cloud service that:

- Is **free** (for Public projects)
- Is **hosted** by Docker (the company)
- Lives at `hub.docker.com`
- Hosts millions of images from developers worldwide

**When you run `docker pull postgres:16`, you are actually downloading from Docker Hub.** We have been using it all along — maybe without thinking about it.

### Other Registries

**Docker Hub is not the only option.** There are other Registries too:

| Registry | Owned by | Description |
|----------|----------|-------------|
| **Docker Hub** | Docker | Free, public, most popular |
| **GitHub Container Registry (GHCR)** | GitHub | Great if you use GitHub |
| **AWS ECR** | Amazon | For AWS projects |
| **Azure Container Registry (ACR)** | Microsoft | For Azure |
| **Google Artifact Registry** | Google | For GCP |
| **Harbor** | CNCF | Installable on your own server |

**Key point:** a Registry is a **standard**. Any Registry that follows the OCI (Open Container Initiative) standard works with Docker. Docker can push and pull from whatever Registry you point it at.

**So "Docker Hub" is just one example, not the whole concept.**

### How do you set up your own Registry?

You can run a Registry on **your own server** too. Companies often do this for internal projects, giving them:

- Code never leaves the company
- Full control over versions
- Fast downloads (over the internal network)

There is even an official image called `registry:2` that is a complete Registry. Start it once, and everyone on the team uses it.

---

## 2. Where Did Registry Come From? Why Do We Need It?

Let's walk through a real scenario.

### Without a Registry

Imagine a three-person team:

- **You** — wrote the code
- **Mary** — QA, needs to test
- **Reza** — DevOps, needs to deploy

**Without a Registry:**

- Mary has to clone the code, run `docker compose up --build`, and wait 10 minutes
- Reza has to go to the server, clone the code, build again, and wait another 10 minutes
- Every time you change a line, both of them have to rebuild
- If some package is missing on Mary's system, she gets an error
- The three of you may see different results because your systems differ

**That is a nightmare.**

### With a Registry

**With a Registry:**

- You run `docker build` once
- You run `docker push` once
- Mary just runs `docker pull` and `docker up` — **20 seconds**
- Reza does the same on the server — **20 seconds**
- All three of you run the **exact same environment**
- Nobody needs Python, Node, or any other dev tool

**This means:**

- ✅ **Speed:** push once, pull thousands of times
- ✅ **Consistent environment:** the same image works everywhere
- ✅ **No dev tools required:** just Docker
- ✅ **Guaranteed reproducibility:** the exact version is the same everywhere

### A more concrete example

Imagine you own a café.

**Without a Registry:** every branch has to bake its own bread and cakes. Every branch needs ovens, mixers, everything. Different branches may taste different.

**With a Registry:** you have a central kitchen. Each branch just receives ready-made cakes and sells them. Every branch tastes the same, without needing any baking equipment.

**That is exactly what happens with Docker Registry.**

---

## 3. Key Concepts of This Lesson (in Very Plain Language)

Five new terms appear in this lesson. Let me explain each in the simplest possible way.

### 3.1. Image — a recap

**An image = a ready-to-run package.**

Imagine a DVD with a game pre-installed on it. Put it in the drive, and the game runs. **An image is exactly that:** a single file that bundles everything — the operating system, packages, and application code.

**Difference from container:** an image is a **template**. A container is a **running instance** of that template. From one image you can spawn 100 containers, or none.

### 3.2. Repository — new concept

**A Repository = a folder inside a Registry that holds one image (and its tags).**

Example: `library/postgres` is a repository holding all versions of the PostgreSQL image.

Difference from a Git repository:

- **Git Repository** → stores source code
- **Docker Repository** → stores an image

**The name is the same, but they are completely different things.**

### 3.3. Tag — new concept

**A Tag = a version label.**

Every image can have multiple versions. Each version has a name, called a Tag.

**Example:**

```
postgres:16         ← Postgres version 16
postgres:15         ← Postgres version 15
postgres:latest     ← most recent
postgres:16-alpine  ← version 16, Alpine-based (smaller)
```

**Golden rule:** tags are **mutable.** You can re-point a tag to a new image. For example, `latest` always points to the newest version.

**But that is a trap.** Because `latest` can change tomorrow. In production, **always use an exact version** (`1.0.0`, `1.0.1`). We will do the same.

### 3.4. Registry — new concept

**A Registry = a server that holds repositories.**

Docker Hub, GHCR, AWS ECR — they are all Registries.

**How you address an image inside a Registry:**

```
<registry>/<username>/<repository>:<tag>
```

For example:

```
docker.io/mcsrayan/bookmarks-backend:1.0.0
```

If you drop the registry, Docker defaults to `docker.io` (Docker Hub):

```
mcsrayan/bookmarks-backend:1.0.0
```

### 3.5. Push and Pull — new verbs

| Action | Meaning | Command |
|--------|---------|---------|
| **Push** | Send the image from your machine to the Registry | `docker push <image>` |
| **Pull** | Bring the image from the Registry to your machine | `docker pull <image>` |

**Analogy:**

- **Push** = upload to Google Drive
- **Pull** = download from Google Drive

---

## 4. The Docker Mindset — Question Nine Is Added

In Lesson 14 we learned 7 questions. In Lesson 15, an 8th (protocol) was added. Now, in Lesson 16, question 9:

### 🎯 Question 9 — Where do you keep the images?

After answering questions 1 through 8, ask yourself: **"Are these images only for me, or shared with others?"**

| Situation | Answer |
|-----------|--------|
| Only for me, local only | No Registry needed; `build:` is enough |
| Shared with a team | A Registry (Docker Hub or GHCR) |
| Production deployment | **Always** a Registry (never build on the server) |
| Open-source library | Docker Hub (public) |

**Golden rule:**

> **Build once, pull everywhere.**

If you build on every new server, you waste time and resources every time. Also, each build may differ slightly (dependency versions drift). With a Registry, **every environment runs the exact same thing.**

### 4.1. Mental diagram for this lesson

```text
Your machine (developer)
    │
    │ docker build
    ▼
Image (local)
    │
    │ docker tag
    ▼
Image (tagged for registry)
    │
    │ docker push
    ▼
Docker Hub
    │
    │ docker pull (anyone, anywhere)
    ▼
Server / teammate / production
    │
    │ docker run or docker compose up
    ▼
Container (running)
```

**This diagram alone is the summary of the whole lesson.** The rest is detail.

---

## 5. Project Architecture

This project is a simple **Bookmark Manager**: React + Django + PostgreSQL. Like Lessons 13 and 14, it has four services:

```text
┌──────────────────────────────────────────────────┐
│                      User                        │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              frontend (Nginx, port 8091)         │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000 (HTTP)           │
│  /admin/      ──►  backend:8000 (HTTP)           │
│  /health/     ──►  backend:8000 (HTTP)           │
│  /static/     ──►  static_files volume           │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│        backend (Django + Gunicorn, port 8000)    │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              db (PostgreSQL 16)                  │
└──────────────────────────────────────────────────┘
```

**Course ports:**

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| 13 | Recipe Book | 8088 |
| 14 | Task Runner | 8089 |
| 15 | ChatFlow | 8090 |
| **16** | **Bookmarks** | **8091** |

### 5.1. The key difference of this project

**This project has two compose files:**

- **`compose.yaml`** → for development (with `build:`)
- **`compose.prod.yaml`** → for production (with `image:` from Docker Hub)

| Service | `compose.yaml` (dev) | `compose.prod.yaml` (prod) |
|---------|----------------------|----------------------------|
| `migrate` | `build: ./backend-django` | `image: <username>/bookmarks-backend:1.0.0` |
| `backend` | `build: ./backend-django` | `image: <username>/bookmarks-backend:1.0.0` |
| `frontend` | `build: ./frontend-react` | `image: <username>/bookmarks-frontend:1.0.0` |
| `db` | `image: postgres:16` | `image: postgres:16` |

**Why is `db` the same in both?** Because it is not our image; it is a ready-made image that already lives on Docker Hub. **Only images that contain our code get pushed.**

---

## 6. Directory Structure

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
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── bookmarks/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
└── frontend-react/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Auth.jsx
            ├── BookmarkForm.jsx
            ├── BookmarkCard.jsx
            └── BookmarkList.jsx
```

**Two `compose` files** at the root. `compose.prod.yaml` **does not contain any source code** — only the names of images hosted on Docker Hub.

---

## 7. Backend Code — Line by Line

### 7.1. `requirements.txt`

```txt
Django==5.1.4
djangorestframework==3.15.2
djangorestframework-simplejwt==5.4.0
psycopg[binary]==3.2.10
django-environ==0.14.0
django-cors-headers==4.6.0
gunicorn==23.0.0
```

**What is this file?** A list of Python packages the project needs. Docker reads it and installs everything.

**Why a separate file?** Because `pip install -r requirements.txt` becomes a fixed command, and Docker can **cache** the install layer. If only code changes and this file is untouched, pip is never re-run.

**What is each package?**

| Package | Purpose |
|---------|---------|
| `Django==5.1.4` | Backend framework. The `==` pins the version |
| `djangorestframework==3.15.2` | A layer on top of Django for building APIs |
| `djangorestframework-simplejwt==5.4.0` | JWT authentication |
| `psycopg[binary]==3.2.10` | PostgreSQL driver. The `[binary]` extra installs a pre-compiled wheel (no C compiler needed) |
| `django-environ==0.14.0` | Reads values from a `.env` file |
| `django-cors-headers==4.6.0` | Enables CORS (React on a different port) |
| `gunicorn==23.0.0` | Production web server (instead of `runserver`) |

**Important note:** `channels`, `daphne`, and `celery` are **absent.** Because this project:

- Has no WebSocket (that was Lesson 15)
- Has no Celery (that was Lesson 14)

It is plain HTTP. **Docker mindset:** only the tools you need. Not one extra byte. **Every package you do not add means a smaller image, a faster build, and a smaller attack surface.**

### 7.2. `bookmarks/models.py`

```python
from django.conf import settings
from django.db import models


class Bookmark(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks',
    )
    url = models.URLField(max_length=500)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['owner', 'tags']),
        ]

    def __str__(self) -> str:
        return self.title
```

**What is this file?** It defines the Bookmark data model. Django generates the database table from it.

**Line by line:**

- **`owner = models.ForeignKey(...)`** — every bookmark belongs to a user. `on_delete=CASCADE` means: if the user is deleted, their bookmarks go too. `related_name='bookmarks'` lets you write `user.bookmarks.all()`
- **`url = models.URLField(max_length=500)`** — the site URL. Django validates that it starts with `http://` or `https://`
- **`title = models.CharField(max_length=200)`** — the title, at most 200 characters
- **`description = models.TextField(blank=True)`** — optional description. `blank=True` means it can be empty (form won't error)
- **`tags = models.CharField(max_length=200, blank=True)`** — tags as a comma-separated string (`"python,django,web"`)
- **`created_at = models.DateTimeField(auto_now_add=True)`** — creation time. `auto_now_add` sets it **only on the first save**
- **`updated_at = models.DateTimeField(auto_now=True)`** — last-modified time. `auto_now` updates it **on every save**
- **`ordering = ['-created_at']`** — newest first by default. `-` means descending
- **`indexes = [...]`** — two compound indexes: one for the fast list (`owner, -created_at`), one for fast tag filtering (`owner, tags`)

**Why is `tags` so simple?** Because the focus of this lesson is **Docker Registry**, not advanced data modeling. If you want proper tags (a separate table with `ManyToMany`), you can. We keep it simple so your mind stays free for the real topic.

### 7.3. `bookmarks/views.py`

```python
class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Bookmark.objects.filter(owner=self.request.user)

        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(url__icontains=q)
                | Q(description__icontains=q)
                | Q(tags__icontains=q)
            )

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__icontains=tag)

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        ...
```

**What is this file?** It defines the API logic.

**Line by line:**

- **`class BookmarkViewSet(viewsets.ModelViewSet)`** — a ViewSet that auto-generates full CRUD (List/Create/Retrieve/Update/Delete)
- **`serializer_class = BookmarkSerializer`** — tells it to use this serializer to convert model instances to JSON
- **`permission_classes = [permissions.IsAuthenticated]`** — every request must carry a JWT, or 401
- **`filter(owner=self.request.user)`** — **the most important security line.** Always scoped to the current user. Even if someone guesses another user's URL, they see nothing
- **`?q=`** — search across four fields using `icontains` (case-insensitive). `|` means OR
- **`?tag=`** — filter by tag
- **`perform_create`** — sets `owner` automatically. Users cannot forge it
- **`@action(detail=False)`** — an extra endpoint: `GET /api/bookmarks/stats/` returning the total count and top tags

The remaining backend files (`serializers.py`, `urls.py`, `settings.py`, `admin.py`) follow standard Django patterns. Full explanations are available in the GitHub repo.

---

## 8. Frontend Code — Line by Line

### 8.1. `src/api.js`

```js
const api = axios.create({ baseURL: '/api' })

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let refreshPromise = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      // ... (refresh logic)
    }
    return Promise.reject(error)
  }
)

export const bookmarkApi = {
  list: async (params = {}) => (await api.get('/bookmarks/', { params })).data,
  create: async (data) => (await api.post('/bookmarks/', data)).data,
  remove: async (id) => { await api.delete(`/bookmarks/${id}/`) },
  stats: async () => (await api.get('/bookmarks/stats/')).data,
}
```

**What is this file?** All HTTP calls to the backend go through here.

**Line by line:**

- **`axios.create({ baseURL: '/api' })`** — creates an axios instance where every path starts with `/api`. `api.get('/bookmarks/')` → `GET /api/bookmarks/`
- **`api.interceptors.request.use(...)`** — runs before every request. Reads the token from localStorage and puts it in the `Authorization` header. **You no longer need to pass `token` to every function**
- **`api.interceptors.response.use(...)`** — runs after every response. On a 401 (expired token), it tries to renew with `refresh_token` and re-sends the original request
- **`refreshPromise`** — if 5 requests get 401 at the same time, only **one** refresh runs. The rest wait for the same promise. This prevents a very common bug: **multiple simultaneous refreshes racing each other**

**Why is this interceptor essential?** Because `ACCESS_TOKEN_LIFETIME` is one hour. Without the interceptor, **after one hour the user is silently logged out and can't tell why.** We hit this problem and added the fix.

### 8.2. `src/components/BookmarkList.jsx`

```jsx
const [bookmarks, setBookmarks] = useState([])
const [q, setQ] = useState('')
const [tag, setTag] = useState('')
const [stats, setStats] = useState({ total: 0, top_tags: [] })

const fetchAll = useCallback(async () => {
  const [list, st] = await Promise.all([
    bookmarkApi.list({ q, tag }),
    bookmarkApi.stats(),
  ])
  setBookmarks(list.results || list)
  setStats(st)
}, [q, tag])

useEffect(() => { fetchAll() }, [fetchAll])
```

**Line by line:**

- **`useState`** — component state: bookmark list, search text, active tag, stats
- **`useCallback(fn, [q, tag])`** — **memoizes** `fetchAll`. It is only rebuilt when `q` or `tag` change. This helps `useEffect` know when to run
- **`Promise.all([...])`** — fires both requests **in parallel**. If done serially (two `await`s one after another), it would take twice as long. `Promise.all` starts both at once and waits for both
- **`list.results || list`** — DRF paginates by default. The response is `{count, next, previous, results}`. So we return `results`. If pagination is off, a plain array comes back. This line handles both
- **`useEffect(() => { fetchAll() }, [fetchAll])`** — runs whenever `fetchAll` changes. The result: **live search** — each keystroke triggers a fetch

The other frontend files (`Auth.jsx`, `BookmarkForm.jsx`, `BookmarkCard.jsx`) are simple and follow standard React patterns. Full explanations are in the GitHub repo.

---

## 9. Docker Files — The Heart of the Project

### 9.1. `backend-django/Dockerfile` — Full Line-by-Line

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

**What is this file?** A recipe for the Docker image. Docker reads it line by line and builds the image. **Every line is a layer** — and layers get cached.

**Full detail:**

#### `FROM python:3.12-slim` — the base image

**`FROM` means:** "start from this image."

- **`python:3.12`** — Ubuntu + full Python: **~900 MB** (includes the C compiler and build tools)
- **`python:3.12-slim`** — Debian + essential Python: **~150 MB**
- **`python:3.12-alpine`** — Alpine + Python: **~50 MB**, but it causes trouble

**Why `slim`?** Our project does not need a C compiler. `psycopg[binary]` is pre-compiled. So `slim` is enough — **six times smaller.**

**Why not `alpine`?** Alpine uses `musl` instead of `glibc`. Many Python packages (especially C-based ones) must be compiled from source on Alpine → **build takes minutes longer + higher chance of failure**.

**Why `3.12`?** `Django 5.1` is best aligned with `3.12`.

#### `ENV` — environment variables

```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
```

**`ENV` means:** "define an environment variable." The variables are visible to every process in the container.

**The `\` character** means the line continues. `ENV` can span multiple lines without creating multiple layers.

**What each variable does:**

| Variable | Effect | Why we need it |
|----------|--------|----------------|
| `PYTHONDONTWRITEBYTECODE=1` | Do not create `.pyc` files | Clean image, no ownership issues |
| `PYTHONUNBUFFERED=1` | Do not buffer stdout | Logs appear **immediately** in `docker logs`. Without this, the last logs before a crash are lost |
| `PIP_NO_CACHE_DIR=1` | pip does not cache | Smaller image (100–200 MB less) |
| `PIP_DISABLE_PIP_VERSION_CHECK=1` | Skip the pip version check | Faster build, cleaner logs, works in restricted networks |

**Why all in one `ENV`?** Each `ENV` creates its own layer. With `\`, they share a single layer → **smaller image**.

#### `WORKDIR /app` — working directory

**Means:** "change the working directory to `/app`. Create it if missing."

From here on, every `RUN`, `COPY`, `CMD` runs inside `/app`.

**Difference from `RUN cd /app`:** `cd` only affects that one layer; the next layer is back in `/`. `WORKDIR` affects **all subsequent layers.**

#### Installing system packages

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 gosu \
    && rm -rf /var/lib/apt/lists/*
```

**`RUN` means:** "execute this inside the container being built." The result is baked into the image.

**Line by line:**

- **`apt-get update`** — fetches the list of available packages from Debian and stores it in `/var/lib/apt/lists/`. **Without it, `apt-get install` has no idea what to install.** This line requires **network** — if the network is slow or blocked, this becomes the slowest part of the build
- **`apt-get install -y`** — `-y` answers "yes" to every prompt. Without it, `apt` may ask a question and the build **hangs forever**
- **`--no-install-recommends`** — install only the essential packages, not recommended ones. Otherwise the image **doubles in size** for nothing
- **`libpq5`** — the PostgreSQL client library. `psycopg[binary]` usually bundles it inside its wheel, but in some cases (SSL, specific versions) it is needed on the system. **Installing it costs nothing and is a safety net**
- **`gosu`** — a tool that lets `entrypoint.sh` drop privileges. **Details in section 9.2**
- **`rm -rf /var/lib/apt/lists/*`** — removes the package lists. **Saves 20–30 MB.** Without it, the image is **needlessly bigger**

**Why all joined with `&&`?** Docker creates a layer per `RUN`. If they were three separate `RUN`s, the middle layer (which contains the lists) **would still live in the image**, even if `rm` deleted them. With `&&` they are **one layer** → only the final state is stored.

#### Copying and installing Python packages

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

**Why `requirements.txt` first, then code?** **This is one of the most important Dockerfile tricks.**

**If the order were wrong:**

```dockerfile
COPY . .                              # code + requirements.txt
RUN pip install -r requirements.txt   # install
```

Every time you **touch a single code line**, the `COPY . .` layer is invalidated → `pip install` **runs again** → **2 minutes of waiting** for packages that never changed!

**With the right order:**

```dockerfile
COPY requirements.txt .              # only requirements.txt
RUN pip install -r requirements.txt   # install (this layer is cached)
COPY . .                              # rest of the code
```

As long as `requirements.txt` **has not changed**, the `pip install` layer **comes from the cache**. Only `COPY . .` re-runs → **5 seconds**.

**`COPY requirements.txt .`** — copies the file from the build context to `/app/requirements.txt` (because `WORKDIR /app`).

**`COPY . .`** — copies all project files. **But files listed in `.dockerignore` are excluded** — `.env`, `__pycache__`, `.venv`, `.git` are all removed.

#### Creating a non-root user

```dockerfile
RUN mkdir -p /app/staticfiles \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh
```

**Four things:**

- **`mkdir -p /app/staticfiles`** — creates the Django static folder. `-p` means "create parents if missing"
- **`useradd --create-home --shell /bin/bash appuser`** — creates a user named `appuser`. `--create-home` creates `/home/appuser`. `--shell /bin/bash` gives it `bash`
- **`chown -R appuser:appuser /app`** — gives `appuser` ownership of everything under `/app`. `-R` is recursive
- **`chmod +x /app/entrypoint.sh`** — makes `entrypoint.sh` executable. Without this, Docker errors with `permission denied`

**Why a new user?**

By default, Docker runs everything as `root`. **Root inside a container = potential root on the host.** If an attacker compromises the code and has root, they **can reach other containers, host files, and in the worst case, the host itself.**

With `appuser` (non-root), even if compromised, they **have limited access.**

**Critical note:** `chmod +x` runs **before** `USER appuser`. Because after switching to `appuser`, they **do not have permission to change permissions on root-owned files.**

#### `USER appuser` — switch user

**From this line, all commands run as `appuser`** (not root).

| Before `USER appuser` | After `USER appuser` |
|------------------------|----------------------|
| `root` | `appuser` |

**Why after the other `RUN`s?** Because installing apt, pip, chown, chmod **require root.** Pattern:

1. Root-required work (install, chown, chmod)
2. Switch to a regular user
3. Runtime work (run the app)

#### `EXPOSE 8000` — documentation

**Only documentation.** It does **not open** any port.

It says "this image will listen on port 8000." For `docker inspect` and documentation.

The **real port opening** happens in `compose.yaml` via `ports:`.

#### `ENTRYPOINT` and `CMD` — entrypoint

```dockerfile
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

**Two commands, two roles:**

| Command | Role |
|---------|------|
| `ENTRYPOINT` | **Always runs** — the entrypoint |
| `CMD` | **Default arguments** — can be overridden |

**In practice:** `docker run <image>` → Docker runs: `entrypoint.sh gunicorn --bind 0.0.0.0:8000 --workers 3 config.wsgi:application`

`entrypoint.sh` handles prep (migrate, collectstatic), then `exec gunicorn ...`.

**Can `CMD` be overridden?** **Yes!** In `compose.yaml`:

```yaml
migrate:
  build: ./backend-django
  command: python manage.py migrate --noinput   # ← overrides CMD
```

Here Docker runs `entrypoint.sh`, but with `python manage.py migrate` instead of `gunicorn`. **Result:** the same image powers both `backend` and `migrate`. **Big savings.**

**Why `["..."]` (exec form) instead of `...` (shell form)?**

- **Shell form** (`CMD gunicorn ...`) → Docker runs `sh -c "gunicorn ..."`. A shell sits in the middle. Docker's signals (SIGTERM) reach the shell, not `gunicorn`. Result: **no graceful shutdown** — it may wait 10 seconds and then get force-killed
- **Exec form** (`CMD ["gunicorn", ...]`) → direct. Signals reach `gunicorn`. **Graceful shutdown works**

**Golden rule:** always use **exec form** for `ENTRYPOINT` and `CMD`.

**`gunicorn` arguments:**

| Parameter | Meaning |
|-----------|---------|
| `--bind 0.0.0.0:8000` | Listen on all interfaces, port 8000. `0.0.0.0` = "reachable from anywhere" |
| `--workers 3` | 3 worker processes (handles 3 concurrent requests) |
| `config.wsgi:application` | WSGI entry point: file `config/wsgi.py`, object `application` |

**Why `gunicorn` and not `runserver`?** `runserver` is dev-only. Single worker, no signal handling, no performance. **In production, always `gunicorn`.**

### 9.2. `entrypoint.sh` — line by line

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

**What is this file?** The container startup script. Before running the main command (`CMD`), it does prep.

**Line by line:**

- **`#!/bin/sh`** — shebang. Tells the system "run this with `/bin/sh`." `/bin/sh` is always present in `slim` images
- **`set -e`** — if any command fails (non-zero exit), **stop the entire script**. Without this, if `migrate` fails, the script continues and `gunicorn` starts against a half-migrated DB. **Catastrophe**
- **`if [ "$(id -u)" = "0" ]`** — checks whether we are running as root (`id -u` is 0 for root). Why? Because Docker creates named volumes (`static_files`) as `root`, even if the `Dockerfile` says `appuser` — **this is a known issue**
- **`chown -R appuser:appuser /app/staticfiles`** — gives `appuser` ownership of the volume. Without this, `collectstatic` fails with `permission denied`
- **`exec gosu appuser "$0" "$@"`** — **this line is magic.** Re-executes itself as `appuser`:
  - `gosu` acts like `sudo`: runs a command as a different user
  - `$0` = this file (`entrypoint.sh`)
  - `$@` = the original arguments (`CMD`)

  Result: `entrypoint.sh` re-runs as `appuser`. But this time `id -u` is not 0 (we are `appuser`) → the `if` is skipped

**On the second run:**

1. `id -u` is no longer 0 → skips the `if`
2. `python manage.py migrate` runs (as `appuser`)
3. `python manage.py collectstatic` runs (as `appuser`)
4. `exec "$@"` runs the `CMD` (gunicorn)

**Why `migrate` in the entrypoint, not the Dockerfile?** Because it must run after the database is up. In the `Dockerfile`, the DB is not available.

**Why `exec "$@"` and not just `"$@"`?** `exec` makes `gunicorn` **PID 1** (the main process). Without `exec`, `gunicorn` becomes a child of `sh`, and Docker's signals go to `sh`, not `gunicorn` → **graceful shutdown breaks**.

### 9.3. `frontend-react/Dockerfile` — Multi-stage

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

**What is this file?** A **multi-stage build** — a technique that lets you shrink the final image dramatically.

**Two stages:**

**Stage 1 — `builder`:**

- **`FROM node:22-alpine AS builder`** — start from Node.js and name it `builder`
- **`COPY package.json package-lock.json* ./`** — copy only dependency manifests
- **`RUN npm ci || npm install`** — `npm ci` is faster and deterministic but needs `package-lock.json`. If missing, fall back to `npm install`
- **`COPY . .`** — the rest of the code
- **`RUN npm run build`** — compile React into static files (`dist/`)

**This stage's size: ~500 MB** (Node.js + npm + `node_modules` + code + `dist`).

**Stage 2 — `final`:**

- **`FROM nginx:1.27-alpine`** — ⭐ **This line completely forgets stage 1.** A new image from scratch
- **`COPY --from=builder /app/dist /usr/share/nginx/html`** — copies **only** the `dist` folder from the previous stage
- **`COPY nginx.conf /etc/nginx/conf.d/default.conf`** — Nginx config

**Final size: ~55 MB.** No Node.js, no `node_modules`, no source code. **Just Nginx + static files.**

**Result: a 10x smaller image.** ✅

**Why `daemon off;` in `CMD`?**

`nginx -g "daemon off;"` means "run Nginx in the foreground, not as a daemon." If it were a daemon, Nginx would fork immediately and the parent would exit → Docker would think the container exited. `daemon off` keeps Nginx as **PID 1**.

### 9.4. `frontend-react/nginx.conf` — line by line

```nginx
upstream backend { server backend:8000; }

server {
    listen 80;

    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://backend; }
    location /admin/ { proxy_pass http://backend; }
    location /health/ { proxy_pass http://backend; }
    location /static/ { alias /app/staticfiles/; }
}
```

**What is this file?** Nginx acts as a **reverse proxy.** The browser sends a request to Nginx; Nginx decides where it goes.

**Line by line:**

- **`upstream backend { server backend:8000; }`** — defines a name `backend` pointing to `backend:8000`. `backend` is the service name in compose
- **`listen 80`** — listen on port 80
- **`location /`** — everything else
  - → `try_files $uri $uri/ /index.html` — if a file exists at this path, serve it. If not, serve `index.html`. **This is critical for SPA routing** — React manages its own routes
- **`location /api/`** — API requests
  - → `proxy_pass http://backend` — forward to the backend
- **`location /admin/`** — Django admin → backend
- **`location /health/`** — health check → backend
- **`location /static/`** — Django static files (admin CSS)
  - → `alias /app/staticfiles/` — read from this folder. **`alias` instead of `root`** because we want the path direct

**Difference from Lesson 15:** no `/ws/` block, no `Upgrade` headers. **Because the protocol is plain HTTP, the Nginx config is plain too.**

---

## 10. Now the Core of the Lesson: The Docker Hub Workflow

### 10.1. Create a Docker Hub account

1. Go to `https://hub.docker.com/signup`
2. Enter Username, Email, Password
3. Confirm

**Important:** Username must be **lowercase**. Otherwise `docker push` fails.

### 10.2. `docker login`

```bash
docker login
```

Successful output:

```text
Login Succeeded
```

**This stores a token** in `~/.docker/config.json`. Until you log out, every `push` is automatically authenticated.

### 10.3. `docker tag` — renaming the image

You currently have two images:

```bash
docker images
```

```
16-bookmarks-backend    latest
16-bookmarks-frontend   latest
```

**These names cannot be pushed.** Docker Hub only accepts names in the form:

```
<username>/<repo>:<tag>
```

For example `mcsrayan/bookmarks-backend:1.0.0`.

**So `docker tag` = "create a new name (alias) for the same image."** Nothing is rebuilt, just a name is added.

```bash
docker tag 16-bookmarks-backend:latest mcsrayan/bookmarks-backend:1.0.0
docker tag 16-bookmarks-frontend:latest mcsrayan/bookmarks-frontend:1.0.0
```

**Verify:**

```bash
docker images | grep bookmarks
```

You will see each image listed **twice** — once under the local name, once under the Docker Hub name. But **the same Image ID** — **one file, two names.**

**Why `1.0.0` and not `latest`?**

| Tag | When to use |
|-----|-------------|
| `latest` | Ambiguous — can change any minute |
| `1.0.0` | Exact version — predictable |
| `1.0.1` | Next version (bug fix) |
| `dev` | Active development |

**Golden rule:** for production, use an exact version. `latest` is a trap because **it is not predictable.**

### 10.4. `docker push`

```bash
docker push mcsrayan/bookmarks-backend:1.0.0
docker push mcsrayan/bookmarks-frontend:1.0.0
```

**Sample output:**

```text
The push refers to repository [docker.io/mcsrayan/bookmarks-backend]
...
1.0.0: digest: sha256:... size: 1426
```

**Time:** depends on upload speed. First push takes 1–3 minutes; subsequent pushes are faster (only new layers go).

**Why are subsequent pushes faster?** Docker recognizes layers. If a layer was already pushed, it is skipped. **Only differences go.**

### 10.5. Verify

Open in your browser:

```
https://hub.docker.com/r/mcsrayan/bookmarks-backend
```

You will see:

- Repository: `bookmarks-backend`
- Tag: `1.0.0`
- Size: `~250 MB`
- A `docker pull` command ready to copy-paste

**This image now lives in the cloud. Anyone, anywhere can pull it.**

---

## 11. `compose.prod.yaml` — No Code, Just Images

### 11.1. Create `.env.example`

```env
DOCKERHUB_USERNAME=your-dockerhub-username
```

### 11.2. Create `.env` (real, gitignored)

```env
DOCKERHUB_USERNAME=mcsrayan
```

**Why gitignored?** Because anyone who clones the repo must supply their own username. Username in git = pain.

### 11.3. `compose.prod.yaml`

```yaml
services:
  db:
    image: postgres:16
    # ... (unchanged from compose.yaml)

  migrate:
    image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0
    command: python manage.py migrate --noinput
    environment: &django_env
      # ... (same env as before)
    depends_on:
      db: { condition: service_healthy }

  backend:
    image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0
    environment: *django_env
    volumes:
      - static_files:/app/staticfiles
    depends_on:
      migrate: { condition: service_completed_successfully }

  frontend:
    image: ${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0
    ports:
      - "127.0.0.1:8091:80"
    volumes:
      - static_files:/app/staticfiles:ro
    depends_on:
      backend: { condition: service_healthy }

volumes:
  postgres_data:
  static_files:
```

**Two differences from `compose.yaml`:**

1. **`image:` instead of `build:`** — pulled from Docker Hub
2. **`${DOCKERHUB_USERNAME}`** — read from `.env`

**Important:** `compose.prod.yaml` **contains no code.** If you delete all the source, this file still works. **That means you can copy just this file and `.env` to a server and run the project.**

### 11.4. Real test (simulating a clean server)

**Step 1 — remove all local images:**

```bash
docker compose -f compose.yaml down -v
docker rmi 16-bookmarks-backend:latest 16-bookmarks-frontend:latest
docker rmi mcsrayan/bookmarks-backend:1.0.0 mcsrayan/bookmarks-frontend:1.0.0
```

**Step 2 — start with `compose.prod.yaml`:**

```bash
docker compose -f compose.prod.yaml up
```

**Output:**

```text
 ✔ bookmarks-backend Pulled
 ✔ bookmarks-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**Two `Pulled` lines** = congratulations! The images came from Docker Hub, not from local code. **The project ran without source code.**

**Step 3 — test:**

- `http://127.0.0.1:8091/` → login form
- Register → works

---

## 12. Versioning and Updates

Assume you find a bug and fix it. How do you ship the update?

### 12.1. Rebuild

```bash
docker compose -f compose.yaml build backend
```

### 12.2. Tag with the new version

```bash
docker tag 16-bookmarks-backend:latest mcsrayan/bookmarks-backend:1.0.1
```

### 12.3. Push

```bash
docker push mcsrayan/bookmarks-backend:1.0.1
```

### 12.4. Edit `compose.prod.yaml`

```yaml
# from 1.0.0 to 1.0.1
backend:
  image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.1
```

### 12.5. On the production server

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

**Note:** `up -d` (detached) replaces old services with new ones. If the image changed, it re-pulls and brings it up.

**Golden rule:**

> **Never use `latest` in production.** Or one morning you will wake up and find the service running an unknown version.

---

## 13. Common Problems

### 13.1. `TLS handshake timeout` while building/pulling

**Cause:** Docker Hub is often unreachable from Iran.

**Fixes (in order):**

1. **Turn on a VPN** — simplest. In this project, we just enabled a VPN and the build worked without any other change
2. **Configure a Registry Mirror:** Docker Desktop → Settings → Docker Engine → add:

```json
{
  "registry-mirrors": [
    "https://docker.iranserver.com",
    "https://docker.arvancloud.ir"
  ]
}
```

3. **Set DNS** to `8.8.8.8`: Docker Desktop → Settings → Resources → Network

### 13.2. `unauthorized: authentication required`

```bash
docker login
```

### 13.3. `denied: requested access to the resource is denied`

- The username in `docker tag` does not match your real account
- Or you did not `docker login`

### 13.4. `migrate` shows `Exited (0)`

**This is correct.** `migrate` is a one-shot service. It runs, then exits. `backend` waits for `service_completed_successfully`.

### 13.5. `apt-get update` takes forever

**Cause:** `deb.debian.org` is very slow from Iran (30 kB/s or even timeout).

**Fixes:**

1. **Turn on a VPN** — in this project, that alone was enough (no changes to the Dockerfile)
2. **If you have no VPN**, add the following line **before** `apt-get` in the Dockerfile (Iranian mirror):

```dockerfile
RUN sed -i 's|deb.debian.org|mirror.iranserver.com|g' /etc/apt/sources.list.d/debian.sources
```

**Important:** the project's file does **not** include this line, because it worked under VPN. Add the line if you are working without a VPN.

---

## 14. Summary

### What we learned

**1. The Docker mindset — 9 questions:**

1. What are the parts? → services
2. What does each need? → Dockerfile / ready-made image / image from a Registry
3. How do they talk? → Network + service name
4. What data must stay alive? → Volume
5. What settings? → Environment Variables
6. How to build? → Single / Multi-stage
7. Startup order? → depends_on + healthcheck
8. **What is the protocol?** → HTTP / WebSocket
9. **Where do the images live?** → Registry ⭐

**2. Registry = Google Drive for images**

- Push = upload
- Pull = download
- Tag = version
- Repository = folder

**3. Golden rule:**

> **Build once, pull everywhere.**

**4. Tag ≠ Latest**

- Use exact versions in production (`1.0.0`)
- `latest` is not predictable

**5. Two compose files:**

- `compose.yaml` — for development (`build:`)
- `compose.prod.yaml` — for production (`image:`)

**6. `.env` gitignored:**

- Usernames and passwords live in `.env`
- Only `.env.example` goes into git
- The pattern works everywhere

**7. Real test:**

- Remove the images
- Run `compose.prod.yaml up`
- If it pulls from Docker Hub and starts, **the entire cycle works** ✅

### The key takeaway of this lesson

```text
Registry = the bridge between developer and production
```

**Without a Registry:**

- Every server needs the dev toolchain
- Every build wastes time and resources
- Environments may differ

**With a Registry:**

- Every server needs only Docker
- Build once, pull thousands of times
- Environments are identical

**This is the most valuable thing this lesson gives you.**

### What comes next

**Lesson 17 — URL Shortener (CI/CD with GitHub Actions)**

A new project where:

- You push code to GitHub
- GitHub Actions builds **automatically**
- Pushes **automatically** to Docker Hub
- Deploys **automatically** to a server

**Meaning: what you did manually in Lesson 16 now happens automatically.**

And after that:

- **Lesson 18:** Portfolio (Deploy to VPS + SSL + Domain)
- **Lesson 19:** Vault (Security: Trivy, Secrets, Hardening)
- **Lesson 20:** Log Analyzer (Deep debugging)
- **Lesson 21:** Cheat Sheet + Docker Templates
- **Lesson 22:** Wrap-up + Roadmap

