[🇮🇷 فارسی](/fa/13-fullstack/README.md)

# Lesson 13 — Fullstack Project: React + Django + Multi-stage Build

## Introduction

In the previous lessons, we built four projects:

- **Lesson [09](/en/09-django-docker/README.md):** An API with Django (TaskFlow)
- **Lesson [10](/en/10-celery-redis/README.md):** A URL Monitor with Celery and Redis
- **Lesson [11](/en/11-nginx/README.md):** A photo gallery with HTML and Nginx
- **Lesson [12](/en/12-react/README.md):** A Kanban board with React (frontend only)

Each of those taught something new. But there is one thing we have not experienced yet: **making a frontend and a backend, as two separate programs, talk to each other.**

In Lesson 11, HTML came from Django. That was a single program.

In Lesson 12, there was React but no backend. It was a lonely app.

Now we build something real: **a fullstack application**. That means:

- **React** runs in the user's browser
- **Django** runs on the server
- The two **talk to each other** (through an API)

And we also learn something very important: **Multi-stage Build**. That is, how to shrink a 500 MB image down to 50 MB, without losing anything.

The complete project code is in `projects/13-recipe-book/`.

---

## What You Will Learn

By the end of this lesson, you will be able to:

- Explain what "fullstack" means
- Explain what Multi-stage Build is and why it matters
- Explain how frontend and backend talk to each other
- Explain what CORS and CSRF are
- Build a complete fullstack app with Docker
- Reduce image size by 10x

---

## Prerequisites

- Everything from Lessons 09 through 12
- Node.js installed on your system
- Basic familiarity with React (if not, Lesson 12 covers it)

**If you have never learned anything about Docker up to now, do not worry.** We will explain everything from scratch.

---

## 1. First, a Story — The Fullstack Restaurant

Before any code, let me tell you a story that will help you understand the whole project.

### Imagine you own a restaurant

**1. The dining room**
This is where customers sit, look at the menu, order, and eat. This is what the customer **sees**.

**2. The kitchen**
This is where chefs cook the food. Customers cannot enter. Food only comes out of here.

**3. The pantry**
This is where raw ingredients are kept (meat, vegetables, spices). The chef takes ingredients from here.

**4. The waiter**
This is who moves between the dining room and the kitchen. Takes the order from the customer, brings it to the kitchen, brings the food back, and serves the customer.

### Now let's compare this to our project

| In the restaurant | In our project |
|-------------------|-----------------|
| Dining room | **React** (frontend) |
| Kitchen | **Django** (backend) |
| Pantry | **PostgreSQL** (database) |
| Waiter | **Nginx** (the middleman) |
| Customer | **User** |

### What does this mean?

- The **user** opens the site in their browser (enters the dining room)
- **React** shows the menu, builds the buttons (dining room)
- When the user wants to see recipes, React sends a request
- **Nginx** takes the request and carries it to **Django** (the waiter)
- **Django** fetches data from **PostgreSQL** and prepares it (the chef fetches ingredients from the pantry)
- The answer travels back the same way to **React**
- **React** shows the answer to the user (food arrives at the table)

**Remember this story.** Whenever you feel lost, come back to this restaurant.

---

## 2. Two Big Concepts in This Lesson

### Concept One — What is Fullstack?

**Fullstack** means an application that has **both a frontend and a backend**.

- **Frontend** = what the user sees (React, HTML, CSS)
- **Backend** = what works behind the scenes (Django, database)

A fullstack app is a complete thing that a user can use. Not just an API, not just an empty page.

**Difference from previous lessons:**

- Lesson 09: only backend (the user saw a JSON page)
- Lesson 12: only frontend (no data; everything was in the browser)
- **Lesson 13: both together** (the user sees a real site whose data comes from the database)

### Concept Two — What is Multi-stage Build?

Let me explain this with a simple example.

#### The Cake Story

Imagine you want to bake a cake:

**First way (silly):**
- Rent a whole kitchen: oven, mixer, sieve, everything
- Bake the cake
- **Bring the entire kitchen home with the cake!**
- Now your house is full of ovens and mixers. The volume is huge.

**Second way (smart):**
- Rent a kitchen (stage 1)
- Bake the cake
- **Put only the cake in a box** and bring it home
- Leave the kitchen behind (stage 2)

**Multi-stage Build is exactly the second way.**

### Now in the Docker world

**Without multi-stage:**
- The image contains everything: Node.js (150 MB), npm, source code, `node_modules` (200 MB), build tools
- Final size: **~500 MB**

**With multi-stage:**
- **Stage 1 (kitchen):** Node.js, npm, vite, source code. Builds React here.
- **Stage 2 (box):** Only Nginx + build output. No tools at all.
- Final size: **~50 MB**

**Result:** The image is 10x smaller! That means:

- Faster to deploy
- Less bandwidth consumption
- Smaller attack surface
- Less disk space on the server

---

## 3. How Do Frontend and Backend Talk? (the most important part)

This section is very important. **This is the most important part of this whole lesson.** Let me explain with a very simple example.

### The Letter Story

Imagine you want to send a letter to a friend:

**1. You write the letter**
- Write your friend's name
- Write their address
- Put the letter in an envelope

**2. The mail carrier picks up the envelope**
- Looks at the address
- Figures out where to deliver

**3. The mail carrier delivers the letter to your friend**
- Your friend reads it
- Writes a reply
- Hands it back to the mail carrier

**4. The mail carrier brings the reply back**
- Brings it to you

**React and Django work exactly this way.**

### In our project

**Step 1: React writes a request**

The user opens `http://127.0.0.1:8088/` in their browser. React shows the page. But React has no data (because the React code is only the appearance, not the data).

So React sends a request:

```text
GET /api/recipes/
```

**This means:** "Hey, whoever is listening, I want the list of recipes."

**Step 2: Nginx catches the request**

Nginx stands at the entrance. Any request that comes in, first reaches Nginx.

Nginx has a notebook that says:

| URL path | Where should it go? |
|----------|---------------------|
| `/` (main page) | React (I serve it myself) |
| `/api/...` | Django (go to the backend) |
| `/admin/...` | Django |
| `/health/...` | Django |
| `/static/...` | Static files (from disk) |
| `/media/...` | Photos (from disk) |

Nginx sees the request is to `/api/recipes/`. Checks the notebook. It says `/api/` means go to Django.

**Step 3: Nginx passes the request to Django**

Nginx forwards the request to `http://backend:8000/api/recipes/` (this is an internal address, inside the Docker network).

**Step 4: Django prepares the data**

Django receives the request. It says: "The user wants the list of recipes."

Django connects to PostgreSQL. Asks: "Give me all recipes."

PostgreSQL returns all recipes.

Django converts them to JSON:

```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "title": "Spaghetti Carbonara",
      "category_display": "Dinner",
      "total_time_minutes": 25
    }
  ]
}
```

**Step 5: Django returns the response to Nginx**

Django sends this JSON back to Nginx.

**Step 6: Nginx returns the response to React**

Nginx sends the JSON back to React.

**Step 7: React displays the data**

React receives the JSON. Builds the recipe cards and shows them to the user.

### The whole journey at a glance

```text
User ──► React ──► Nginx ──► Django ──► PostgreSQL
  │        │        │         │            │
  │        │        │         │            │
  │        │        │         │            └─► All recipes
  │        │        │         │
  │        │        │         └─► JSON
  │        │        │
  │        │        └─► JSON
  │        │
  │        └─► JSON
  │
  └─► Beautiful page
```

### Why does this separation matter?

**1. Security:** The database is never directly on the internet. Only Django can reach it.

**2. Speed:** Nginx is very fast for static files. If Django had to serve CSS too, it would be slow.

**3. Scalability:** We can have several Django backends, with one Nginx in front. (In later lessons.)

**4. Independent development:** One team builds the frontend, another team builds the backend. No conflicts.

---

## 4. CORS and CSRF — Two Security Guards

Before we touch code, you must understand two security concepts.

### What is CORS?

**Imagine:** React runs on `localhost:5173`. Django runs on `localhost:8000`. These are two different addresses (two different ports).

The browser has a rule: **"If a program from one address wants to connect to another address, it must first ask permission from the destination server."**

**CORS** (Cross-Origin Resource Sharing) is a mechanism that tells Django: "Allow requests from these addresses."

Without CORS, React cannot talk to Django. You will see a `CORS error` in the browser.

### What is CSRF?

**CSRF** (Cross-Site Request Forgery) is a type of attack:

- You are logged in to your bank
- A malicious site sends a hidden request to the bank
- The bank thinks you are making the request

To prevent this, Django uses a hidden token. A user can only send a request if they include that token.

In fullstack apps, React runs on a different origin. Django must know that this origin is trusted. This is where `CSRF_TRUSTED_ORIGINS` comes in.

**Important note:** In our project, because we use **Nginx as a reverse proxy**, both React and Django are served from the same address (`localhost:8088`). So CORS and CSRF cause less trouble. But we still configure them properly so they work in development mode too (when you run React separately).

---

## 5. The Final Architecture

Now that you understand the concepts, let's look at the architecture:

```text
┌─────────────────────────────────────────────────────┐
│                     User                            │
│              (browser on your machine)              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             frontend (Nginx, port 8088)             │
│                                                     │
│  Address notebook:                                  │
│  /            ──►  React static files               │
│  /api/        ──►  backend:8000                     │
│  /admin/      ──►  backend:8000                     │
│  /health/     ──►  backend:8000                     │
│  /static/     ──►  static_files volume              │
│  /media/      ──►  media_files volume               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               backend (Django + Gunicorn)           │
│                    port 8000                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               db (PostgreSQL 16)                    │
│                     port 5432                       │
└─────────────────────────────────────────────────────┘
```

Three services. A shared volume between backend and frontend (for CSS and photos).

**Ports of the course projects:**

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| **13** | **Recipe Book** | **8088** |

This means all five projects can run at the same time, without conflicts.

---

## 6. Directory Structure

```text
13-recipe-book/
├── compose.yaml            ← orchestrator (wires everything together)
├── README.md
├── README.fa.md
├── backend-django/         ← Django backend
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
└── frontend-react/         ← React frontend
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

**There is a single `.gitignore` at the repository root** covering all projects.

**Note:** `backend-django/` and `frontend-react/` are completely independent. That means you can run just the backend (for testing the API) or just the frontend (with `npm run dev`). But for the full experience, use Docker Compose, which brings both up together.

---

## 7. Backend Files — Line by Line

### 7.1. `backend-django/requirements.txt`

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
Pillow==11.0.0
django-cors-headers==4.6.0
```

**What is each package?**

| Package | Its job |
|---------|---------|
| **Django** | The main framework |
| **djangorestframework** | For building APIs |
| **psycopg[binary]** | PostgreSQL driver |
| **django-environ** | Reading `.env` |
| **gunicorn** | Python web server (for production) |
| **Pillow** | Image processing (for `ImageField`) |
| **django-cors-headers** | **New: allow requests from React** |

`django-cors-headers` is new because React will connect to the API from a different address.

### 7.2. `backend-django/.env.example`

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (for React frontend)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8088
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8088

# PostgreSQL
POSTGRES_DB=recipebook
POSTGRES_USER=recipebook
POSTGRES_PASSWORD=recipebook_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**Why two addresses for CORS?**

- `localhost:5173` = Vite dev server (development, when you run React with `npm run dev`)
- `localhost:8088` = Nginx (when the whole stack runs with Docker)

### 7.3. `backend-django/config/settings.py` — the important parts

The file is huge, so I will only explain the important parts:

```python
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',      # ← new
    'recipes',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',   # ← must be before CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]

# CORS — allow React to call the API
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:8088'],
)

# CSRF — trust React for mutating requests
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:8088'],
)

# Media files (photos)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Static files (admin CSS)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

**The most important changes:**

- **`corsheaders` in `INSTALLED_APPS`** — activates the package
- **`CorsMiddleware` before `CommonMiddleware`** — the order matters! If reversed, it errors
- **`CORS_ALLOWED_ORIGINS`** — tells Django that React may connect from these addresses
- **`CSRF_TRUSTED_ORIGINS`** — tells Django to trust mutating requests from these addresses
- **`MEDIA_URL` and `MEDIA_ROOT`** — for recipe photos
- **`STATIC_URL` and `STATIC_ROOT`** — for admin CSS

### 7.4. `backend-django/config/urls.py`

```python
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('recipes.urls')),
]

# In development, Django serves media files itself.
# In production, Nginx handles this.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**Three main paths:**

- `/admin/` — Django admin panel
- `/health/` — health check endpoint (for Docker healthcheck)
- `/api/` — the API (wired to `recipes/urls.py`)

**The `if settings.DEBUG` block:** In development, Django serves photos itself. In production, Nginx handles it.

### 7.5. `backend-django/recipes/models.py`

```python
from django.db import models


class Recipe(models.Model):
    class Category(models.TextChoices):
        BREAKFAST = 'breakfast', 'Breakfast'
        LUNCH = 'lunch', 'Lunch'
        DINNER = 'dinner', 'Dinner'
        DESSERT = 'dessert', 'Dessert'
        SNACK = 'snack', 'Snack'

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ingredients = models.TextField()
    instructions = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.DINNER)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.EASY)
    prep_time_minutes = models.PositiveIntegerField(default=0)
    cook_time_minutes = models.PositiveIntegerField(default=0)
    servings = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to='recipes/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title

    @property
    def total_time_minutes(self) -> int:
        return self.prep_time_minutes + self.cook_time_minutes
```

**What is a model?** A Python class that is the **equivalent of a database table**. Django builds the table from this class.

**Important fields:**

| Field | What it is |
|-------|------------|
| `title` | Recipe title |
| `description` | Short description |
| `ingredients` | Ingredients (one per line) |
| `instructions` | Cooking steps (one per line) |
| `category` | Category (breakfast, lunch, dinner...) |
| `difficulty` | Difficulty |
| `photo` | Recipe photo |
| `prep_time_minutes` | Prep time |
| `cook_time_minutes` | Cook time |

**`@property total_time_minutes`** — a computed field. Not stored in the database, but returned whenever needed (prep + cook).

**`upload_to='recipes/%Y/%m/'`** — photos go into `media/recipes/2025/10/` (year/month). This way, thousands of photos do not pile up in one folder.

### 7.6. `backend-django/recipes/serializers.py`

```python
from rest_framework import serializers
from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'ingredients', 'instructions',
            'category', 'category_display',
            'difficulty', 'difficulty_display',
            'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes',
            'servings', 'photo', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**What is a serializer?** A **translator**:

- **Outward:** Python object → JSON (to send to React)
- **Inward:** JSON (from React) → Python object (to save into the database)

**`category_display` and `difficulty_display`** — why did we add them?

`category` stores `'breakfast'`. React wants to see `'Breakfast'` (with capital B). Django handles this translation using `get_category_display`. This way, React does not have to build the label itself.

**`photo`** — Django automatically turns `ImageField` into a URL. React receives a path like `/media/recipes/.../photo.jpg`, not the raw file.

### 7.7. `backend-django/recipes/views.py`

```python
from rest_framework import filters, viewsets
from .models import Recipe
from .serializers import RecipeSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'ingredients']
    ordering_fields = ['created_at', 'title', 'prep_time_minutes']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        if category:
            queryset = queryset.filter(category=category)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        return queryset
```

**What is `ModelViewSet`?** A ready-made class that generates **six endpoints** automatically:

- `GET /api/recipes/` — list all
- `POST /api/recipes/` — create one
- `GET /api/recipes/{id}/` — retrieve one
- `PUT /api/recipes/{id}/` — full update
- `PATCH /api/recipes/{id}/` — partial update
- `DELETE /api/recipes/{id}/` — delete one

**Filters:**

- `SearchFilter` — when React sends `?search=pasta`, it searches `title`, `description`, `ingredients`
- `OrderingFilter` — when React sends `?ordering=title`, it sorts

**`get_queryset`** — when React sends `?category=dinner`, it filters.

**Result:** With one `ModelViewSet` plus a few filter lines, React can:

- Search
- Filter
- Sort

All from **the same endpoint**, using query parameters.

### 7.8. `backend-django/recipes/urls.py`

```python
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')

urlpatterns = router.urls
```

**`DefaultRouter`** — a DRF helper that builds routes automatically. Instead of writing `/api/recipes/`, `/api/recipes/1/`, etc. by hand, we just say `router.register(...)`.

**Result:** DRF generates these paths:

- `/api/recipes/`
- `/api/recipes/{id}/`

### 7.9. `backend-django/recipes/admin.py`

```python
from django.contrib import admin
from django.utils.html import format_html
from .models import Recipe


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'title', 'category', 'difficulty', 'total_time_minutes', 'created_at')
    list_filter = ('category', 'difficulty')
    search_fields = ('title', 'description', 'ingredients')
    date_hierarchy = 'created_at'

    @admin.display(description='Photo')
    def thumbnail(self, obj):
        if not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="height:50px;width:50px;object-fit:cover;border-radius:6px;" />',
            obj.photo.url,
        )
```

This makes the admin panel nicer:

- **`list_display`** — which columns appear in the list (with a photo preview)
- **`list_filter`** — filters on the side
- **`search_fields`** — search
- **`thumbnail`** — a custom column showing a small image preview

`format_html` is a safe Django utility that builds HTML without XSS risk.

---

## 8. Frontend Files — Line by Line

### 8.1. `frontend-react/package.json`

```json
{
  "name": "frontend-react",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.x.x",
    "lucide-react": "^0.x.x",
    "react": "^19.x.x",
    "react-dom": "^19.x.x"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.x.x",
    "@vitejs/plugin-react": "^4.x.x",
    "tailwindcss": "^4.x.x",
    "vite": "^6.x.x"
  }
}
```

**Differences from Lesson 12:**

- `axios` added (for sending requests to Django)
- `@dnd-kit` and its packages removed (not needed here)

### 8.2. `frontend-react/vite.config.js`

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
```

**This file reveals the most important detail in this lesson.**

**What is `proxy`?**

In development mode, React runs on `localhost:5173`, Django runs on `localhost:8000`. If React tries to connect to Django directly, the browser throws a CORS error.

**Solution:** Vite sets up a proxy. That means:

- React sends a request to `/api/recipes/` (a relative path)
- Vite catches it, converts it to `http://localhost:8000/api/recipes/`
- From the browser's perspective, everything came from `localhost:5173` (so no CORS needed)

**Why does this matter?** Because React always works with relative paths. The same code works in dev and prod.

In production, **Nginx** plays this role. It forwards `/api/` to the backend.

**Result:** React never has to know where Django is. It just calls `/api/...`.

### 8.3. `frontend-react/src/api.js` — the connection point

```js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const recipeApi = {
  list: async (params = {}) => {
    const response = await api.get('/recipes/', { params })
    return response.data.results || response.data
  },

  detail: async (id) => {
    const response = await api.get(`/recipes/${id}/`)
    return response.data
  },
}

export default api
```

**This file is the only place we talk to Django.** Anywhere else we need data, we use this.

**`baseURL: '/api'`** — every request starts with `/api`. That is, `api.get('/recipes/')` becomes `GET /api/recipes/`.

**`list`** — list recipes. `params` can carry `search`, `category`, `difficulty`.

**`response.data.results || response.data`** — DRF paginates by default. The response looks like:

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [...]
}
```

So we return `results`. The `||` is a safety net (in case pagination is disabled).

**`detail`** — details for one recipe.

### 8.4. `frontend-react/src/App.jsx` — the heart of the frontend

```jsx
import { useEffect, useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import RecipeCard from './components/RecipeCard'
import RecipeDetail from './components/RecipeDetail'
import Loading from './components/Loading'
import { recipeApi } from './api'

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const params = {}
    if (search) params.search = search
    if (category) params.category = category

    recipeApi
      .list(params)
      .then(data => {
        if (!cancelled) setRecipes(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [search, category])

  const handleSelectRecipe = async (id) => {
    try {
      const recipe = await recipeApi.detail(id)
      setSelectedRecipe(recipe)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {selectedRecipe ? (
        <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Recipe Book</h1>

          <div className="flex gap-4 mb-8">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter value={category} onChange={setCategory} />
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleSelectRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
```

**What is each part?**

**States:**

| State | What it is |
|-------|------------|
| `recipes` | Array of recipes |
| `loading` | Are we currently loading? |
| `error` | Error message |
| `search` | Search text |
| `category` | Selected category |
| `selectedRecipe` | The recipe the user opened |

**`useEffect`** — every time `search` or `category` changes, this effect fires and sends a request to the API.

**`cancelled`** — an important pattern. If the user types quickly, several parallel requests go out. If an older request comes back after a newer one, stale data could show. With `cancelled`, stale responses are ignored.

**`handleSelectRecipe`** — when the user clicks a card, this fires. It takes an `id`, fetches the full details, and puts them in `selectedRecipe`.

**Rendering:**

- If `selectedRecipe` is set → detail page
- Otherwise → list page with a recipe grid

### 8.5. The components

There are seven components, all simple:

- **`Header`** — the top bar with a chef icon
- **`SearchBar`** — the search field
- **`CategoryFilter`** — the category buttons
- **`RecipeCard`** — each recipe card (photo, title, priority pill)
- **`RecipeDetail`** — detail page (big photo, ingredients, steps)
- **`Loading`** — the spinner

Each component lives in its own file, imported by `App.jsx`. This is a standard pattern.

**`RecipeCard` and `RecipeDetail`** are the most important. In `RecipeDetail`, the ingredients and steps are converted to arrays with `.split('\n')`:

```jsx
{recipe.ingredients
  .split('\n')
  .filter(item => item.trim())
  .map((item, i) => (
    <li key={i}>{item}</li>
  ))}
```

Because the user enters ingredients line-by-line in the admin, we show them line-by-line here too.

---

## 9. Docker Files — The Heart of the Project

### 9.1. `backend-django/Dockerfile`

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

**This is the same Dockerfile as Lesson 11, with one difference:**

- **`gosu` added** — so the entrypoint can fix volume permissions
- **`CMD` uses Gunicorn** — not `runserver`

**Why `gosu`?** Remember from Lesson 11: Docker creates named volumes as `root`. For `appuser` to write to them, the entrypoint first runs as root to fix ownership, then drops to `appuser`.

### 9.2. `backend-django/entrypoint.sh`

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

**Line by line:**

- **`if [ "$(id -u)" = "0" ]`** — if we are running as root...
- **`chown -R appuser:appuser /app/staticfiles /app/media`** — give ownership of volumes to `appuser`
- **`exec gosu appuser "$0" "$@"`** — re-execute yourself as `appuser`
- **`migrate`** — apply migrations
- **`collectstatic`** — collect admin CSS
- **`exec "$@"`** — run the main command (Gunicorn)

### 9.3. `frontend-react/Dockerfile` — **the heart of this lesson**

```dockerfile
# ============================================================
# Stage 1: Build the React app
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ============================================================
# Stage 2: Serve the built files with Nginx
# ============================================================
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**This file is the magic of this lesson. Let me explain line by line:**

**`FROM node:22-alpine AS builder`** — starts stage 1. We name it `builder` (the kitchen).

**`RUN npm ci`** — installs packages. `ci` is faster and more reproducible than `install`.

**`RUN npm run build`** — builds React. Output goes to `/app/dist/` (HTML/CSS/JS files).

**`FROM nginx:1.27-alpine`** — **the magic line.** Starts stage 2. **It completely forgets `builder`.** A new image from scratch with Nginx.

**`COPY --from=builder /app/dist /usr/share/nginx/html`** — **the real magic.** It copies only the `dist` folder from stage 1. Nothing else (Node.js, `node_modules`, source code) is copied.

**`CMD ["nginx", "-g", "daemon off;"]`** — runs Nginx in the foreground. `daemon off` means "do not run as a daemon, stay as PID 1". Without this, Nginx exits quickly.

**The size comparison:**

| Stage | Size |
|-------|------|
| Stage 1 (`builder`) | ~500 MB |
| **Stage 2 (final)** | **~50 MB** |

Stage 1 **is not in the final image.** Only stage 2 remains. That is 10x smaller!

### 9.4. `frontend-react/nginx.conf` — the Nginx notebook

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    root /usr/share/nginx/html;
    index index.html;

    # React static files + SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → Django
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin → Django
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check → Django
    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static files
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
    }

    # Recipe photos
    location /media/ {
        alias /app/media/;
        expires 7d;
    }
}
```

**This file does exactly what the Vite proxy did in dev, but for production.**

**Line by line:**

- **`upstream backend`** — tells Nginx "the backend is at `backend:8000`" (inside the Docker network)
- **`listen 80`** — Nginx listens on port 80 inside the container (Docker maps container port 80 to host port 8088)
- **`try_files $uri $uri/ /index.html`** — **the most important line for React.** If a file with that name exists, serve it. If not, serve `index.html`. This is what makes React SPA routing work.
- **`location /api/`** — API requests go to Django
- **`location /admin/`** — admin panel goes to Django
- **`location /health/`** — health endpoint goes to Django
- **`location /static/`** — Django static files from disk
- **`location /media/`** — recipe photos from disk

**`$http_host` vs `$host`:**

- `$host` = domain without port (`127.0.0.1`)
- `$http_host` = domain with port (`127.0.0.1:8088`)

`$http_host` is correct because it matches the browser's `Origin` (for CSRF).

### 9.5. `compose.yaml` — the orchestrator

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-recipebook}
      POSTGRES_USER: ${POSTGRES_USER:-recipebook}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-recipebook_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-recipebook} -d ${POSTGRES_DB:-recipebook}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  backend:
    build:
      context: ./backend-django
    environment:
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8088}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8088}
      POSTGRES_DB: ${POSTGRES_DB:-recipebook}
      POSTGRES_USER: ${POSTGRES_USER:-recipebook}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-recipebook_dev_password}
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

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8088:80"
    volumes:
      - static_files:/app/staticfiles:ro
      - media_files:/app/media:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
  media_files:
```

**Three services:**

| Service | What | Why |
|---------|------|-----|
| `db` | PostgreSQL | Data |
| `backend` | Django + Gunicorn | Logic |
| `frontend` | Nginx + React build | Appearance + Reverse Proxy |

**Three volumes:**

| Volume | Written by | Read by | What it holds |
|--------|------------|---------|---------------|
| `postgres_data` | `db` | `db` | Database |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) | Admin CSS |
| `media_files` | `backend` (uploads) | `frontend` (Nginx) | Recipe photos |

**Key point:** `static_files` and `media_files` are shared between `backend` and `frontend`. Why?

- Django with `collectstatic` puts static files in `/app/staticfiles`
- When a user uploads a photo, Django puts it in `/app/media`
- Nginx (in `frontend`) reads from these volumes and serves them

**`:ro`** — read-only. Nginx only reads, never writes.

**`depends_on` with `condition`:**

- `backend` waits for `db` to be healthy
- `frontend` waits for `backend` to be healthy

This ensures everything comes up in the right order.

---

## 10. Running It

From inside `13-recipe-book/`:

```bash
docker compose up --build
```

### What you should see

**Build backend:**

```text
 => [1/7] FROM python:3.12-slim
 => [2/7] WORKDIR /app
 => [3/7] RUN apt-get update ...
 => [4/7] COPY requirements.txt .
 => [5/7] RUN pip install -r requirements.txt
 => [6/7] COPY . .
 => [7/7] RUN mkdir -p ... useradd ...
 => naming to docker.io/library/13-recipe-book-backend
```

**Build frontend — this one matters:**

```text
 => [stage-1 1/6] FROM node:22-alpine AS builder
 => [stage-1 2/6] WORKDIR /app
 => [stage-1 3/6] COPY package*.json ./
 => [stage-1 4/6] RUN npm ci
 => [stage-1 5/6] COPY . .
 => [stage-1 6/6] RUN npm run build
 ✓ built in 4.20s
 => [stage-2 1/4] FROM nginx:1.27-alpine
 => [stage-2 2/4] COPY --from=builder /app/dist /usr/share/nginx/html
 => [stage-2 3/4] COPY nginx.conf /etc/nginx/conf.d/default.conf
 => naming to docker.io/library/13-recipe-book-frontend
```

**Notice `stage-1` and `stage-2`.** Two separate stages. Stage 2 copies only `dist` from stage 1.

**Start:**

```text
 ✔ Container 13-recipe-book-db-1        Healthy
 ✔ Container 13-recipe-book-backend-1   Healthy
 ✔ Container 13-recipe-book-frontend-1  Started
```

**Logs:**

```text
backend-1   | Fixing volume permissions...
backend-1   | Applying database migrations...
backend-1   | Collecting static files...
backend-1   | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
frontend-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
```

---

## 11. Testing — Five Important Tests

### Test 1 — Health endpoint

```text
http://127.0.0.1:8088/health/
```

You should see:

```json
{"status": "ok"}
```

If this works, Nginx is connected to backend. ✅

### Test 2 — Home page

```text
http://127.0.0.1:8088/
```

You should see the "Recipe Book" page with a dark theme:

- Header with a chef icon
- Search field
- Category buttons
- "No recipes found" message (no recipes yet)

**If you see this page, React is being served through Nginx.** ✅

### Test 3 — API directly

```text
http://127.0.0.1:8088/api/recipes/
```

You should see the DRF page with an empty list.

**If this works, Nginx is proxying `/api/` to the backend.** ✅

### Test 4 — Create an admin user

In another terminal:

```bash
docker compose exec backend python manage.py createsuperuser
```

Enter a username, email (can be blank), and password.

Then go to `http://127.0.0.1:8088/admin/` and log in.

### Test 5 — Upload a recipe

In the admin panel:

- **Recipes** → **ADD RECIPE**
- Fill in:
  - **Title:** `Spaghetti Carbonara`
  - **Ingredients:** (one per line)
    ```text
    400g spaghetti
    200g pancetta
    4 egg yolks
    100g parmesan
    Black pepper
    ```
  - **Instructions:**
    ```text
    Boil pasta in salted water
    Fry pancetta until crispy
    Mix eggs with parmesan
    Combine everything off heat
    Serve immediately
    ```
  - **Category:** Dinner
  - **Difficulty:** Medium
  - **Prep time:** 10
  - **Cook time:** 15
  - **Servings:** 4
  - **Photo:** pick a file

Click **SAVE**.

Go back to `http://127.0.0.1:8088/`. You should see the Spaghetti Carbonara card. Click on it. The detail page opens with ingredients and steps.

### Test 6 — The real magic: image size

```bash
docker images | Select-String "13-recipe-book"
```

You should see something like:

```text
13-recipe-book-frontend   latest   ...   ~50MB
13-recipe-book-backend    latest   ...   ~250MB
```

**Note:** `frontend` is only **~50 MB** (not 500!). That means multi-stage build worked correctly.

**Comparison:**

- Without multi-stage: ~500 MB
- With multi-stage: **~50 MB**

**10x smaller!** 🎯

---

## 12. Common Problems

### Problem 1 — `/health/` shows the React page instead of `{"status": "ok"}`

**Cause:** Nginx has no `location /health/` block, so the request falls to `location /` and React's `index.html` is served.

**Fix:** Add `location /health/` to `nginx.conf`:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### Problem 2 — CSRF verification failed when logging in

**Cause:** Django 4.0+ validates the `Origin` header. Requests from `127.0.0.1:8088` are rejected.

**Fix:** Set `CSRF_TRUSTED_ORIGINS` in `.env`:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8088,http://127.0.0.1:8088
```

And in `nginx.conf`, use `$http_host` (not `$host`).

### Problem 3 — Permission denied when uploading photos

**Cause:** Docker creates named volumes as `root`. `appuser` cannot write.

**Fix:** `entrypoint.sh` must use `gosu` (explained above).

### Problem 4 — Photos do not load

**Check:**

```bash
docker compose exec backend ls /app/media/recipes/
docker compose exec frontend ls /app/media/recipes/
```

Both should show the photo. If one is empty, the `media_files` volume is broken.

### Problem 5 — Port 8088 is already in use

Change the host port:

```yaml
frontend:
  ports:
    - "127.0.0.1:8089:80"
```

### Problem 6 — Frontend image is too large

**Check:**

```bash
docker images | grep 13-recipe-book-frontend
```

If it is more than 100 MB, multi-stage build did not run correctly. Run `docker compose build frontend` and look for `stage-1` and `stage-2` in the output.

---

## 13. Running Alongside Other Projects

This project uses port **8088** so it can run alongside the others:

| Lesson | Project | Port |
|--------|---------|------|
| 09 | TaskFlow | 8000 |
| 10 | URL Monitor | 9000 |
| 11 | Photo Gallery | 8080 |
| 12 | Kanban Board | 3000 |
| **13** | **Recipe Book** | **8088** |

You can run all of them at once:

```bash
cd projects/09-taskflow/backend-django && docker compose up -d
cd projects/10-url-monitor && docker compose up -d
cd projects/11-photo-gallery && docker compose up -d
cd projects/12-react-kanban && docker compose up -d
cd projects/13-recipe-book && docker compose up -d
```

Then visit them all:

- TaskFlow API: `http://127.0.0.1:8000/api/tasks/`
- URL Monitor: `http://127.0.0.1:9000/api/urls/`
- Photo Gallery: `http://127.0.0.1:8080/`
- Kanban Board: `http://127.0.0.1:3000/`
- Recipe Book: `http://127.0.0.1:8088/`

**Each project is completely independent.** Stopping one does not affect the others.

---

## 14. Summary

### What we learned

**1. What is fullstack?**
- Frontend (React) + backend (Django), working together
- They communicate through an API
- Like a restaurant: dining room + kitchen + waiter

**2. What is Multi-stage Build?**
- Two stages in the Dockerfile
- Stage 1 (kitchen): build tools, Node.js, builds React
- Stage 2 (box): only Nginx + build output
- Result: image 10x smaller (~50 MB instead of ~500 MB)

**3. How do frontend and backend talk?**
- React sends a request to `/api/...` (relative path)
- Nginx catches it, forwards to `backend:8000`
- Django responds
- Response travels back the same way

**4. What are CORS and CSRF?**
- **CORS** = the guard at the entrance. Allows cross-origin requests
- **CSRF** = a secret handshake. Prevents attacks

**5. Project structure**
- `backend-django/` — independent backend
- `frontend-react/` — independent frontend
- `compose.yaml` — wires everything together

### The key takeaway of this lesson

```text
User ──► React ──► Nginx ──► Django ──► PostgreSQL
  ▲                                  │
  │                                  │
  └──────────── JSON ────────────────┘

And in the Dockerfile:

Stage 1 (Node.js + build) ──► dist/
                                  │
                                  ▼
Stage 2 (Nginx + dist)     ← only 50 MB
```

### What comes next

In the next lesson, we build a **completely new project** that includes:

- React + Django + **Celery + Redis**
- That is: not only frontend and backend, but background work too
- A full **Task Runner** with email sending (simulated) and scheduled reports

And the lessons after that:

- **Lesson 15:** Real-time chat (WebSocket + Channels + Redis)
- **Lesson 16:** Bookmark Manager (Push/Pull to Docker Hub)
- **Lesson 17:** URL Shortener (CI/CD with GitHub Actions)
- **Lesson 18:** Portfolio (Deploy to VPS + SSL + Domain)
- **Lesson 19:** Vault (Security: Trivy, Secrets, Hardening)
- **Lesson 20:** Log Analyzer (Deep debugging)
- **Lesson 21:** Cheat Sheet + Docker Templates
- **Lesson 22:** Wrap-up + Roadmap

