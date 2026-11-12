<div align='right' dir='rtl'>

[🇬🇧 English](/projects/17-shortener/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>URL Shortener — کوتاه‌کننده‌ی لینک با CI/CD</span>

</div>

> یک سرویس کوتاه‌کننده‌ی لینک که **کاملاً خودکار** ساخته، تست، و منتشر می‌شود: React + Django + PostgreSQL، همه در Docker، با **GitHub Actions** به عنوان موتور CI/CD.

---

## چرا این درس متفاوت است؟

تا درس ۱۶، همه‌ی کارها را **دستی** انجام می‌دادیم:

<div align='right' dir='rtl'>

<span dir='rtl'>1. `docker build` می‌زدیم</span> <br>
<span dir='rtl'>2. `docker tag` می‌زدیم</span> <br>
<span dir='rtl'>3. `docker push` می‌زدیم به Docker Hub</span> <br>
<span dir='rtl'>4. روی سرور `docker compose pull` می‌زدیم</span> <br>

</div>

**این درس، این چرخه را خودکار می‌کند.** فقط `git push` می‌زنی — ربات GitHub Actions بقیه‌ی کارها را انجام می‌دهد.

این پروژه، پیاده‌سازی مرجع **درس ۱۷** از دوره‌ی «داکر از صفر تا صد» است.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **ثبت‌نام / ورود** با JWT</span> <br>
<span dir='rtl'>• **ساخت لینک کوتاه** از URL طولانی</span> <br>
<span dir='rtl'>• **کد کوتاه تصادفی** (۷ کاراکتری، <span dir='ltr'>~۳.۵</span> تریلیون ترکیب)</span> <br>
<span dir='rtl'>• **ریدایرکت ۳۰۲** به لینک اصلی</span> <br>
<span dir='rtl'>• **شمارش کلیک اتمیک** (با <span dir='ltr'>`F('clicks') + 1`</span>)</span> <br>
<span dir='rtl'>• **تاریخ انقضا (اختیاری)** — لینک‌های منقضی ۴۱۰ می‌دهند</span> <br>
<span dir='rtl'>• **صفحه‌های خطای قشنگ** (HTML به جای JSON خام)</span> <br>
<span dir='rtl'>• **جستجو** در URL و کد کوتاه</span> <br>
<span dir='rtl'>• **پنل ادمین Django**</span> <br>
<span dir='rtl'>• **CI/CD با <span dir='ltr'>GitHub Actions</span>** — <span dir='ltr'>build</span>، <span dir='ltr'>test</span>، <span dir='ltr'>push</span> خودکار ⭐</span> <br>
<span dir='rtl'>• **دو فایل <span dir='ltr'>compose</span>:** یکی برای dev (با <span dir='ltr'>`build:`</span>)، یکی برای production (با <span dir='ltr'>`image:`</span>)</span> <br>
<span dir='rtl'>• **روی پورت `8092`** اجرا می‌شود</span> <br>

</div>

---

## معماری

چهار سرویس:

```text
┌──────────────────────────────────────────────────┐
│                     کاربر                          │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│          frontend (Nginx، پورت 8092)              │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000                  │
│  /admin/      ──►  backend:8000                  │
│  /health/     ──►  backend:8000                  │
│  /static/     ──►  static_files volume           │
│  /r/{code}/   ──►  backend:8000 (ریدایرکت) ⭐      │
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

<div align='center' dir='rtl'>

| سرویس | نقش | Port |<span dir='rtl'> Image که push می‌شود </span>|
|--------|------|------|----------------------|
| <span dir='ltr'>`backend`</span> | <span dir='ltr'>Django API</span> |<span dir='rtl'> داخلی 8000 </span>| <span dir='ltr'>`<username>/shortener-backend`</span> ⭐ |
| <span dir='ltr'>`frontend`</span> | <span dir='ltr'>React + Nginx</span> | **8092** | <span dir='ltr'>`<username>/shortener-frontend`</span> ⭐ |
| <span dir='ltr'>`db`</span> | <span dir='ltr'>PostgreSQL 16</span> | داخلی |<span dir='rtl'> `postgres:16` (push نمی‌شود) </span>|
| <span dir='ltr'>`migrate`</span> | یک‌بارمصرفه | — |<span dir='rtl'> همان backend </span>|

</div>

---

## ⭐ جریان CI/CD (قلب درس)

اینه که پروژه را خاص می‌کند. وقتی `git push` می‌زنی:

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
│ Docker Hub  │  ← images with multiple tags
└──────┬──────┘
       │ pull
       ▼
┌─────────────┐
│  Production │
└─────────────┘
```

**نتیجه:** بدون هیچ کار دستی، هر `git push` یک نسخه‌ی جدید از image در Docker Hub تولید می‌کند.

<div align='right' dir='rtl'>

### <span dir='rtl'>Pipeline در یک نگاه</span>

</div>

<div align='center' dir='rtl'>

| Trigger | Jobs | نتیجه |
|---------|------|-------|
|<span dir='rtl'> Push به `main` </span>| `test` → `build` (backend) + `build` (frontend) |<span dir='rtl'> image با تگ <span dir='ltr'>`main`</span>, <span dir='ltr'>`latest`</span>, <span dir='ltr'>`sha-*`</span> </span>|
| Pull Request |<span dir='rtl'> `test` (فقط) </span>|<span dir='rtl'> تست بدون push </span>|
| Tag `v1.0.0` | `test` → `build` |<span dir='rtl'> image با تگ `1.0.0`, `1.0` </span>|

</div>

---

## دو فایل Compose

<div align='center' dir='rtl'>

| بخش | <span dir='ltr'>`compose.yaml`</span> (dev) | <span dir='ltr'>`compose.prod.yaml`</span> (production) |
|-----|----------------------|----------------------------------|
| <span dir='ltr'>`migrate`</span> | <span dir='ltr'>`build: ./backend-django`</span> | <span dir='ltr'>`image: <username>/shortener-backend:latest`</span> |
| <span dir='ltr'>`backend`</span> | <span dir='ltr'>`build: ./backend-django`</span> | <span dir='ltr'>`image: <username>/shortener-backend:latest`</span> |
| <span dir='ltr'>`frontend`</span> | <span dir='ltr'>`build: ./frontend-react`</span> | <span dir='ltr'>`image: <username>/shortener-frontend:latest`</span> |
| <span dir='ltr'>`db`</span> | <span dir='ltr'>`image: postgres:16`</span> |<span dir='rtl'> <span dir='ltr'>`image: postgres:16`</span> (یکسان) </span>|

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`compose.prod.yaml` هیچ کدی ندارد.** فقط Docker و <span dir='ltr'>`.env`</span> لازم است.</span>

</div>

---

## شروع سریع (توسعه)

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/17-shortener

# .env برای backend
cp backend-django/.env.example backend-django/.env

# .env برای compose.prod
cp .env.example .env
# سپس DOCKERHUB_USERNAME را با username خودت تنظیم کن

# build و اجرا
docker compose up --build
```

باز کن: <span dir='ltr'><http://127.0.0.1:8092/></span>

---

## اجرا در Production (بدون کد)

روی سرور، فقط این‌ها لازم است:

```bash
mkdir shortener-prod && cd shortener-prod
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/17-shortener/compose.prod.yaml
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/17-shortener/.env.example
cp .env.example .env
# ویرایش .env و ست کردن DOCKERHUB_USERNAME

docker compose -f compose.prod.yaml up
```

<div align='right' dir='rtl'>

<span dir='rtl'>**Docker به‌طور خودکار:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`postgres:16`</span> را pull می‌کند</span> <br>
<span dir='rtl'>• <span dir='ltr'>`<username>/shortener-backend:latest`</span> را pull می‌کند</span> <br>
<span dir='rtl'>• <span dir='ltr'>`<username>/shortener-frontend:latest`</span> را pull می‌کند</span>

</div>

در لاگ:

```text
 ✔ shortener-backend Pulled
 ✔ shortener-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**بدون یک خط کد.**

---

## تنظیم GitHub Actions

### ۱. حساب Docker Hub

اگر نداری: <span dir='ltr'><https://hub.docker.com/signup></span>

<div align='right' dir='rtl'>

### <span dir='rtl'>۲. Personal Access Token</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>Docker Hub</span> ← <span dir='ltr'>Account Settings</span> ← <span dir='ltr'>**Personal access tokens**</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>**Generate new token**</span> با نام <span dir='ltr'>`github-actions`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>Permissions</span>: **<span dir='ltr'>Read</span>, <span dir='ltr'>Write</span>, <span dir='ltr'>Delete</span>**</span> <br>
<span dir='rtl'>• **توکن را کپی کن** (فقط یک‌بار نشان داده می‌شود)</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۳. GitHub Secrets</span>

</div>

در <span dir='ltr'>repo</span> ← <span dir='ltr'>Settings</span> ← <span dir='ltr'>Secrets and variables</span> ← <span dir='ltr'>Actions</span>:

<div align='center' dir='rtl'>

| Secret | مقدار |
|--------|-------|
| `DOCKERHUB_USERNAME` |<span dir='rtl'> username واقعی Docker Hub </span>|
| `DOCKERHUB_TOKEN` |<span dir='rtl'> توکن ساخته‌شده در قدم ۲ </span>|

</div>

### ۴. تست

از **ریشه‌ی ریپو** (<span dir='ltr'>`docker-zero-to-hero/`</span>):

```bash
git add .github/workflows/ci-shortener.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

تب Actions را باز کن. باید ببینی:

```text
✅ CI — Shortener / Test backend
✅ CI — Shortener / Build backend
✅ CI — Shortener / Build frontend
```

**🎉 از این به بعد، هر `git push` پروژه را خودکار build و push می‌کند.**

---

## ساختار پروژه

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

**نکته:** فایل <span dir='ltr'>CI/CD</span> (<span dir='ltr'>`.github/workflows/ci-shortener.yml`</span>) در **ریشه‌ی ریپو** است، نه داخل <span dir='ltr'>`17-shortener/`</span>. GitHub Actions فقط پوشه‌ی <span dir='ltr'>`.github/`</span> ریشه را می‌شناسد.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/register/`</span> |<span dir='rtl'> ثبت‌نام </span>|
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/login/`</span> |<span dir='rtl'> ورود ← <span dir='ltr'>`access`</span> + `refresh` </span>|
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/refresh/`</span> |<span dir='rtl'> تمدید توکن </span>|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/auth/me/`</span> |<span dir='rtl'> کاربر جاری </span>|
| <span dir='ltr'>GET/POST</span> | <span dir='ltr'>`/api/urls/`</span> |<span dir='rtl'> لیست / ساخت </span>|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/urls/?q=github`</span> |<span dir='rtl'> جستجو </span>|
| <span dir='ltr'>GET/PATCH/DELETE</span> | <span dir='ltr'>`/api/urls/{id}/`</span> | CRUD |
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/urls/stats/`</span> |<span dir='rtl'> آمار </span>|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/r/{code}/`</span> |<span dir='rtl'> ریدایرکت ۳۰۲ </span>|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/health/`</span> |<span dir='rtl'> بررسی سلامت </span>|

</div>

---

## 🧠 بدهی فنی آگاهانه (Technical Debt)

این پروژه یک **پروژه‌ی آموزش Docker و CI/CD** است، نه یک پروژه‌ی آموزش Django. بنابراین چند تصمیم عمداً shortcut شده است:

<div align='right' dir='rtl'>

### <span dir='rtl'>۱. HTML درون view به جای template</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`RedirectView` صفحه‌های خطای 404 و 410 را به‌صورت **رشته‌ی HTML داخلی** برمی‌گرداند، نه فایل template.</span>

</div>

**روش درست در Django:**

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

**چرا shortcut زدیم:**

<div align='right' dir='rtl'>

<span dir='rtl'>• فایل‌های پروژه کم می‌مانند و تمرکز روی Docker حفظ می‌شود</span> <br>
<span dir='rtl'>• نیازی به تنظیم `TEMPLATES` برای دو صفحه‌ی static نیست</span> <br>
<span dir='rtl'>• diff ساده‌تر برای مطالعه</span>

</div>

**هزینه‌اش:**

<p dir='rtl'>
• HTML قابل استفاده مجدد نیست <br>
• طراح نمی‌تواند صفحه‌ها را بدون دست زدن به Python ویرایش کند <br>
• وراثت template و auto-escaping از دست می‌رود
</p>

<div align='right' dir='rtl'>

<span dir='rtl'>**TODO در production:** انتقال به <span dir='ltr'>`templates/shortener/error_*.html`</span>.</span>

</div>

### ۲. تفاوت `HttpResponse` و `Response`

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`Response`**</span> (DRF) ← از rendererها استفاده می‌کند (<span dir='ltr'>Browsable API</span>، JSON)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`HttpResponse`**</span> (Django) ← مستقیم به مرورگر، بدون renderer</span>

</div>

برای URLهای کاربر (مثل <span dir='ltr'>`/r/`</span>)، <span dir='ltr'>`HttpResponse`</span> درست است.
برای APIها (مثل <span dir='ltr'>`/api/`</span>)، <span dir='ltr'>`Response`</span> درست است.

---

## مشکلات رایج

<div align='right' dir='rtl'>

### <span dir='rtl'>`TLS handshake timeout` در build</span>

</div>

**علت:** Docker Hub از ایران معمولاً در دسترس نیست.

**راه‌حل:** VPN روشن کن، یا Registry Mirror تنظیم کن (<span dir='ltr'>Docker Desktop</span> ← <span dir='ltr'>Settings</span> ← <span dir='ltr'>Docker Engine</span>):

```json
{
  "registry-mirrors": [
    "https://docker.iranserver.com",
    "https://docker.arvancloud.ir"
  ]
}
```

<div align='right' dir='rtl'>

### <span dir='rtl'>`apt-get update` خیلی طول می‌کشد</span>

</div>

**علت:** `deb.debian.org` از ایران کند است (<span dir='ltr'>30 kB/s</span>).

**راه‌حل:** VPN روشن کن. **در این پروژه، فقط VPN کافی بود** — هیچ تغییری در Dockerfile لازم نبود.

<div align='right' dir='rtl'>

### <span dir='rtl'>Pipeline در GitHub Actions fail می‌شود</span>

</div>

**علت‌های رایج:**

<div align='center' dir='rtl'>

| علامت | علت | راه‌حل |
|--------|-----|--------|
| <span dir='ltr'>`requirements.txt not found`</span> |<span dir='rtl'> پروژه push نشده </span>|<span dir='rtl'> `git push` پروژه </span>|
| <span dir='ltr'>`unauthorized: authentication required`</span> |<span dir='rtl'> Secrets تنظیم نشده </span>|<span dir='rtl'> <span dir='ltr'>GitHub Secrets</span> ← <span dir='ltr'>`DOCKERHUB_USERNAME`</span> و `DOCKERHUB_TOKEN` </span>|
| <span dir='ltr'>`denied: requested access`</span> |<span dir='rtl'> توکن permission ندارد </span>|<span dir='rtl'> توکن جدید با <span dir='ltr'>Read</span>+<span dir='ltr'>Write</span>+<span dir='ltr'>Delete</span> </span>|
| <span dir='ltr'>`failed to solve: python:3.12-slim`</span> |<span dir='rtl'> TLS به Docker Hub </span>|<span dir='rtl'> GitHub Actions server به Docker Hub دسترسی دارد، پس مشکل جای دیگریست </span>|

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`migrate` نشان می‌دهد `Exited (0)`</span>

</div>

**این درست است.** سرویس یک‌بارمصرفه است.

<div align='right' dir='rtl'>

### <span dir='rtl'><span dir='ltr'>`/r/{code}/`</span> صفحه‌ی Browsable API نشان می‌دهد</span>

</div>

**علت:** در `RedirectView` از `Response` به‌جای `HttpResponse` استفاده شده.

**راه‌حل:** `HttpResponse` با <span dir='ltr'>`content_type='text/html'`</span>.

---

## نکات Production

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False`</span> <br>
<span dir='rtl'>• [ ] `SECRET_KEY` واقعی</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` به دامنه‌ی واقعی</span> <br>
<span dir='rtl'>• [ ] `CORS_ALLOWED_ORIGINS` و `CSRF_TRUSTED_ORIGINS` به <span dir='ltr'>`https://yourdomain.com`</span></span> <br>
<span dir='rtl'>• [ ] HTTPS با <span dir='ltr'>Nginx</span> (Let's Encrypt)</span> <br>
<span dir='rtl'>• [ ] `DOCKERHUB_USERNAME` و `DOCKERHUB_TOKEN` فقط در GitHub Secrets</span> <br>
<span dir='rtl'>• [ ] در `compose.prod.yaml` از نسخه‌ی دقیق استفاده کن (نه `latest`)</span> <br>
<span dir='rtl'>• [ ] بکاپ برای `postgres_data`</span> <br>
<span dir='rtl'>• [ ] (TODO) انتقال HTML به <span dir='ltr'>`templates/shortener/error_*.html`</span></span>

</div>

---

## درس‌های مرتبط

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۷ — CI/CD با GitHub Actions**](/fa/17-shortener/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
