<div align='right' dir='rtl'>

[🇬🇧 English](/projects/16-bookmarks/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>Bookmark Manager — پروژه‌ی Docker Registry</span>

</div>


> یک بوکمارک‌منیجر آماده‌ی محیط عملیاتی: React + Django + PostgreSQL، همه در Docker، با تمرکز روی **انتشار ایمیج‌ها از طریق Docker Hub**.

---

## چرا این درس متفاوت است؟

تا الان همه‌ی ایمیج‌ها فقط روی سیستم خودمان بودند. اگر همکارت می‌خواست پروژه را اجرا کند، باید کل کد را clone می‌کرد و خودش build می‌زد.

**این درس این را تغییر می‌دهد.** یک مفهوم جدید وارد می‌شود: **Docker Registry** — یک انبار ابری برای ایمیج‌ها. کافی است ایمیج را یک بار push کنی، بعد هر کسی از هر جایی فقط با `docker pull` آن را اجرا می‌کند — **بدون نیاز به کد، بدون Python، بدون Node.**

این پروژه، پیاده‌سازی مرجع **درس ۱۶** از دوره‌ی «داکر از صفر تا صد» است.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **ثبت‌نام / ورود** با JWT</span> <br>
<span dir='rtl'>• **CRUD کامل بوکمارک‌ها** (URL، عنوان، توضیحات، تگ‌ها)</span> <br>
<span dir='rtl'>• **جستجوی سراسری** در عنوان/URL/توضیحات/تگ‌ها</span> <br>
<span dir='rtl'>• **فیلتر بر اساس تگ** و آمار تگ‌های برتر</span> <br>
<span dir='rtl'>• **جداسازی داده** بین کاربران (هر کاربر فقط بوکمارک‌های خودش)</span> <br>
<span dir='rtl'>• **پنل ادمین Django**</span> <br>
<span dir='rtl'>• **دو فایل compose:** یکی برای توسعه (با <span dir='ltr'>`build:`</span>)، یکی برای production (با <span dir='ltr'>`image:`</span> از Docker Hub)</span> <br>
<span dir='rtl'>• **Multi-stage frontend build** (<span dir='ltr'>React</span> → Nginx، ~۵۵MB)</span> <br>
<span dir='rtl'>• **روی پورت `8091`** اجرا می‌شود تا کنار بقیه‌ی پروژه‌های دوره کار کند</span>

</div>

---

## معماری

چهار سرویس:

```text
کاربر ──► frontend (Nginx، پورت 8091)
            │
            ├──► /             ──► React static files
            ├──► /api/         ──► backend:8000
            ├──► /admin/       ──► backend:8000
            ├──► /health/      ──► backend:8000
            └──► /static/      ──► volume static_files
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

<div align='center' dir='rtl'>

| سرویس | نقش | پورت | Image |
|--------|------|------|-------|
| `backend` | Django + Gunicorn |<span dir='rtl'> داخلی 8000 </span>| `mcsrayan/bookmarks-backend:1.0.0` ⭐ |
| `frontend` | React + Nginx | **8091** | `mcsrayan/bookmarks-frontend:1.0.0` ⭐ |
| `db` | PostgreSQL 16 | داخلی |<span dir='rtl'> `postgres:16` (push نمی‌شود) </span>|
| `migrate` | مهاجرت‌ها، سپس خارج می‌شود | — |<span dir='rtl'> همان backend </span>|

</div>

> **نکته‌ی آموزشی:** `db` را push نمی‌کنیم چون **ایمیج ما نیست، یک ابزار آماده‌ست**. فقط ایمیج‌هایی که **کد خودمان** را دارند push می‌شوند.

---

## دو فایل Compose

این پروژه **دو فایل compose** دارد. تفاوتشان در یک کلمه است:

<div align='center' dir='rtl'>

| بخش | `compose.yaml` (dev) | `compose.prod.yaml` (production) |
|-----|----------------------|----------------------------------|
| `migrate` | `build: ./backend-django` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0`** |
| `backend` | `build: ./backend-django` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0`** |
| `frontend` | `build: ./frontend-react` | **`image: ${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0`** |
| `db` | `image: postgres:16` |<span dir='rtl'> `image: postgres:16` (یکسان) </span>|

</div>

**چرا این مهم است؟** چون `compose.prod.yaml` **کد ندارد**. اگر سرور فقط این فایل و <span dir='ltr'>`.env`</span> را داشته باشد، بدون هیچ کد منبعی پروژه را اجرا می‌کند.

---

## شروع سریع (توسعه، با build)

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/16-bookmarks

# ساخت فایل محیطی بک‌اند
cp backend-django/.env.example backend-django/.env

# ساخت فایل محیطی compose (برای prod)
cp .env.example .env
# سپس در .env مقدار DOCKERHUB_USERNAME را به username خودت تغییر بده

# build و اجرا
docker compose up --build
```

باز کن: <span dir='ltr'><http://127.0.0.1:8091/></span>

---

## انتشار ایمیج‌ها (Push)

### ۱. حساب Docker Hub

اگر نداری، رایگان بساز: <https://hub.docker.com/signup>

### ۲. لاگین

```bash
docker login
# Username: <your-username>
# Password: <رمز یا personal access token>
```

<div align='right' dir='rtl'>

### <span dir='rtl'>۳. Tag زدن</span>

</div>

```bash
docker tag 16-bookmarks-backend:latest $DOCKERHUB_USERNAME/bookmarks-backend:1.0.0
docker tag 16-bookmarks-frontend:latest $DOCKERHUB_USERNAME/bookmarks-frontend:1.0.0
```

<div align='right' dir='rtl'>

> <span dir='rtl'>`docker tag` هیچ چیزی build نمی‌کند — فقط یک نام جدید (alias) برای همان ایمیج می‌سازد.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۴. Push</span>

</div>

```bash
docker push $DOCKERHUB_USERNAME/bookmarks-backend:1.0.0
docker push $DOCKERHUB_USERNAME/bookmarks-frontend:1.0.0
```

### ۵. تأیید

در مرورگر باز کن:

```
https://hub.docker.com/r/$DOCKERHUB_USERNAME/bookmarks-backend
https://hub.docker.com/r/$DOCKERHUB_USERNAME/bookmarks-frontend
```

---

## اجرا روی ماشین تمیز (Pull)

فرض کن سرور تازه‌ای داری. **هیچ کدی نداری.** فقط Docker نصب است.

```bash
mkdir bookmarks-prod && cd bookmarks-prod
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/16-bookmarks/compose.prod.yaml
curl -O https://raw.githubusercontent.com/QUANTORIS01/docker-zero-to-hero/main/projects/16-bookmarks/.env.example
cp .env.example .env
# ویرایش .env و ست کردن DOCKERHUB_USERNAME

docker compose -f compose.prod.yaml up
```

<div align='right' dir='rtl'>

<span dir='rtl'>**Docker به‌طور خودکار:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>1. <span dir='ltr'>`postgres:16`</span> را از <span dir='ltr'>Docker Hub</span> pull می‌کند</span> <br>
<span dir='rtl'>2. <span dir='ltr'>`${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0`</span> را از <span dir='ltr'>Docker Hub</span> pull می‌کند</span> <br>
<span dir='rtl'>3. <span dir='ltr'>`${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0`</span> را از <span dir='ltr'>Docker Hub</span> pull می‌کند</span>

</div>

در لاگ می‌بینی:

```text
 ✔ bookmarks-backend Pulled
 ✔ bookmarks-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**بدون یک خط کد. بدون Python. بدون Node.**

---

## به‌روزرسانی نسخه

وقتی کد را تغییر دادی:

```bash
# ۱. build مجدد
docker compose -f compose.yaml build backend

# ۲. tag با نسخه‌ی جدید
docker tag 16-bookmarks-backend:latest $DOCKERHUB_USERNAME/bookmarks-backend:1.0.1

# ۳. push
docker push $DOCKERHUB_USERNAME/bookmarks-backend:1.0.1

# ۴. تغییر compose.prod.yaml
# از 1.0.0 به 1.0.1 در قسمت image:

# ۵. روی سرور production
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

> **قانون طلایی:** در `compose.prod.yaml` **هرگز از `latest` استفاده نکن.** همیشه از نسخه‌ی دقیق (`1.0.0`، `1.0.1`) استفاده کن تا محیط قابل‌پیش‌بینی باشد.

---

## ساختار پروژه

```text
16-bookmarks/
├── .env                    ← gitignored (username واقعی)
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
│   ├── config/             ← پروژه‌ی Django
│   └── bookmarks/          ← اپ (مدل، سریالایزر، ویو)
└── frontend-react/
    ├── Dockerfile          ← multi-stage (node → nginx)
    ├── nginx.conf
    ├── package.json
    └── src/                ← React + Tailwind
```

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | <span dir='ltr'>`/api/auth/register/`</span> | ثبت‌نام |
| POST | <span dir='ltr'>`/api/auth/login/`</span> |<span dir='rtl'> ورود ← <span dir='ltr'>`access`</span> + `refresh` </span>|
| POST | <span dir='ltr'>`/api/auth/refresh/`</span> | تمدید توکن |
| GET | <span dir='ltr'>`/api/auth/me/`</span> | اطلاعات کاربر جاری |
| GET/POST | <span dir='ltr'>`/api/bookmarks/`</span> | لیست / ساخت |
| GET | <span dir='ltr'>`/api/bookmarks/?q=python`</span> | جستجو |
| GET | <span dir='ltr'>`/api/bookmarks/?tag=django`</span> | فیلتر تگ |
| GET/PUT/PATCH/DELETE | <span dir='ltr'>`/api/bookmarks/{id}/`</span> | CRUD |
| GET | <span dir='ltr'>`/api/bookmarks/stats/`</span> | آمار |
| GET | <span dir='ltr'>`/health/`</span> | بررسی سلامت |

</div>

---

## متغیرهای محیطی

<div align='right' dir='rtl'>

### <span dir='rtl'><span dir='ltr'>`backend-django/.env`</span> (Django)</span>

</div>

<div align='center' dir='rtl'>

| متغیر | هدف |
|--------|------|
| <span dir='ltr'>`SECRET_KEY`</span> | کلید مخفی جنگو |
| <span dir='ltr'>`DEBUG`</span> | حالت دیباگ |
| <span dir='ltr'>`ALLOWED_HOSTS`</span> | هاست‌های مجاز |
| <span dir='ltr'>`POSTGRES_*`</span> | اتصال دیتابیس |

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'><span dir='ltr'>`.env`</span> (Compose)</span>

</div>

<div align='center' dir='rtl'>

| متغیر | هدف |
|--------|------|
| `DOCKERHUB_USERNAME` |<span dir='rtl'> username Docker Hub — برای pull از compose.prod.yaml </span>|

</div>

---

## مشکلات رایج

### خطای `TLS handshake timeout` هنگام build/pull

**علت:** Docker Hub از ایران معمولاً در دسترس نیست.

**راه‌حل‌ها:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. **VPN روشن کن** (ساده‌ترین راه)</span> <br>
<span dir='rtl'>2. یا **Registry Mirror** تنظیم کن: <span dir='ltr'>Docker Desktop</span> ← <span dir='ltr'>Settings</span> ← <span dir='ltr'>Docker Engine</span> ← <span dir='ltr'>`registry-mirrors`</span> با آینه‌های ایرانی</span> <br>
<span dir='rtl'>3. یا **DNS** را در Docker Desktop روی `8.8.8.8` بگذار</span>

</div>

### خطای `unauthorized: authentication required`

<div align='right' dir='rtl'>

<span dir='rtl'>`docker login` را دوباره بزن.</span>

</div>

### خطای `denied: requested access to the resource is denied`

<div align='right' dir='rtl'>

<span dir='rtl'>• `DOCKERHUB_USERNAME` با username واقعی حساب یکی نیست</span> <br>
<span dir='rtl'>• یا `docker login` نکردی</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`migrate` نشان می‌دهد `Exited (0)`</span>

</div>

**این درست است.** یک سرویس یک‌بارمصرفه است.

### پورت 8091 در استفاده است

در `compose.yaml` یا `compose.prod.yaml` پورت را به `8092` تغییر بده.

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False`</span> <br>
<span dir='rtl'>• [ ] `SECRET_KEY` واقعی و طولانی</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` به دامنه‌ی واقعی</span> <br>
<span dir='rtl'>• [ ] `CORS_ALLOWED_ORIGINS` و `CSRF_TRUSTED_ORIGINS` به `https://yourdomain.com`</span> <br>
<span dir='rtl'>• [ ] HTTPS با <span dir='ltr'>Nginx</span> (Let's Encrypt)</span> <br>
<span dir='rtl'>• [ ] `DOCKERHUB_USERNAME` در <span dir='ltr'>`.env`</span> واقعی (نه در گیت)</span> <br>
<span dir='rtl'>• [ ] در `compose.prod.yaml` از نسخه‌ی دقیق استفاده کن (نه `latest`)</span> <br>
<span dir='rtl'>• [ ] بکاپ برای `postgres_data`</span> <br>
<span dir='rtl'>• [ ] از Docker Secrets یا یک سیستم مدیریت Secret برای رمزها</span>

</div>

---

## درس‌های مرتبط

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۶ — <span dir='ltr'>Docker Registry</span>: Push و Pull از Docker Hub**](/fa/16-bookmarks/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
