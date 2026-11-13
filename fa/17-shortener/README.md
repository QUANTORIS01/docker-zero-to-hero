<div align='right' dir='rtl'>

[🇬🇧 English](/en/17-shortener/README.md)

</div>

# درس ۱۷ — CI/CD با <span dir='ltr'>GitHub Actions</span>: URL Shortener

## مقدمه

تا اینجای دوره، ۱۶ درس با هم گذروندیم و هشت پروژه ساختیم. توی درس ۱۶، یه اتفاق خیلی مهم افتاد: یاد گرفتیم چطور ایمیج‌ها رو به Docker Hub بفرستیم (push) و روی هر سروری ازشون استفاده کنیم (pull).

ولی یه مشکل بزرگ وجود داشت: **همه‌ی این کارها دستی بود!**

فرض کن توی یک تیم واقعی هستی. هر بار که کد رو تغییر می‌دی، باید:
<div align='right' dir='rtl'>

<span dir='rtl'>1. `docker build` بزنی (۲ دقیقه)</span> <br>
<span dir='rtl'>2. `docker tag` بزنی (۵ ثانیه)</span> <br>
<span dir='rtl'>3. `docker push` بزنی (۱ دقیقه)</span> <br>
<span dir='rtl'>4. بری روی سرور، `docker pull` بزنی</span> <br>

</div>

اگه روزی ۲۰ بار کد رو تغییر بدی، این می‌شه **۷۰ دقیقه کار تکراری**! حالا تصور کن توی تیم ۵ نفره هستید، این می‌شه **۵ ساعت در روز** فقط برای کارهای تکراری.

**راه‌حل چیه؟** باید این چرخه رو **خودکار** کنیم. این همون مفهوم **CI/CD** هست. و ابزار قدرتمندی که برای این کار استفاده می‌کنیم، **GitHub Actions** نام داره.

**هدف اصلی این درس:** بعد از این درس، هر بار که کد رو به <span dir='ltr'>GitHub</span> push کنی، **ربات** به‌طور خودکار تست می‌کنه، ایمیج می‌سازه، و به Docker Hub می‌فرسته. تو دیگه هیچ کار دستی انجام نمی‌دی.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:
<div align='right' dir='rtl'>

<span dir='rtl'>• توضیح بدی **CI/CD** چیه و چرا حیاتیه</span> <br>
<span dir='rtl'>• توضیح بدی **GitHub Actions** چیه و چطور کار می‌کنه</span> <br>
<span dir='rtl'>• یه **Workflow** بنویسی که تست کنه و ایمیج بسازه</span> <br>
<span dir='rtl'>• **Matrix Strategy** رو برای build موازی (Backend و Frontend) پیاده کنی</span> <br>
<span dir='rtl'>• **GitHub Secrets** رو برای نگهداری رمزها تنظیم کنی</span> <br>
<span dir='rtl'>• یه پروژه رو با **`compose.prod.yaml`** بدون کد منبع (فقط با Docker) اجرا کنی</span> <br>
<span dir='rtl'>• **ذهنیت داکری** داشته باشی: بدونی کی دستی build کنی، کی خودکار</span> <br>

</div>

---

## ۱. اول، بذار بگم CI/CD چیه؟ (به زبان خیلی ساده)

تصور کن یه کارخانه تولید کیک داری.

**بدون CI/CD (روش قدیمی):**
<div align='right' dir='rtl'>

<span dir='rtl'>• کارگر باید دستی مواد رو مخلوط کنه</span> <br>
<span dir='rtl'>• دستی توی فر بذاره</span> <br>
<span dir='rtl'>• دستی بسته‌بندی کنه</span> <br>
<span dir='rtl'>• دستی به فروشگاه بفرسته</span> <br>
<span dir='rtl'>• هر مرحله ممکنه اشتباه انسانی داشته باشه!</span> <br>

</div>

**با CI/CD (روش مدرن):**
<div align='right' dir='rtl'>

<span dir='rtl'>• کارگر فقط مواد رو توی قیف می‌ریزه</span> <br>
<span dir='rtl'>• **خط تولید خودکار** بقیه کارها رو انجام می‌ده</span> <br>
<span dir='rtl'>• کیک‌ها همیشه یکسان، با کیفیت، و بدون اشتباه انسانی</span> <br>

</div>

### این دو حرف مخفف چی هستن؟

<div align='center' dir='rtl'>

| اصطلاح | معنی | معادل ساده در کارخانه |
|--------|------|------------------------|
| <span dir='ltr'>**CI** (Continuous Integration)</span> |<span dir='rtl'> ادغام مداوم </span>|<span dir='rtl'> هر وقت مواد جدید رسید (کد push شد)، **خودکار** تست کن که خراب نباشه </span>|
| <span dir='ltr'>**CD** (Continuous Delivery/Deployment)</span> |<span dir='rtl'> تحویل مداوم </span>|<span dir='rtl'> اگه تست‌ها پاس شد، **خودکار** کیک رو بپز و بسته‌بندی کن (ایمیج بساز) </span>|

</div>

**به عبارت دیگه:** توی درس ۱۶، تو نقش **کارگر** رو داشتی. توی این درس، تو نقش **مدیر کارخانه** رو داری. خط تولید (GitHub Actions) کارها رو خودش انجام می‌ده.

### تشبیه دقیق‌تر با GitHub

<div align='center' dir='rtl'>

| مرحله در کارخانه | معادل در پروژه ما |
|------------------|-------------------|
|<span dir='rtl'> کارگر مواد رو توی قیف می‌ریزه </span>|<span dir='rtl'> تو `git push` می‌زنی </span>|
|<span dir='rtl'> دستگاه اول (تست) </span>|<span dir='rtl'> <span dir='ltr'>GitHub Actions</span> `python manage.py check` می‌زنه </span>|
|<span dir='rtl'> دستگاه دوم (پخت) </span>|<span dir='rtl'> <span dir='ltr'>GitHub Actions</span> `docker build` می‌زنه </span>|
|<span dir='rtl'> دستگاه سوم (بسته‌بندی و ارسال) </span>|<span dir='rtl'> <span dir='ltr'>GitHub Actions</span> `docker push` می‌زنه به Docker Hub </span>|
|<span dir='rtl'> فروشگاه (محل مصرف) </span>|<span dir='rtl'> سرور production با `docker compose pull` </span>|

</div>

---

<div align='right' dir='rtl'>

## <span dir='rtl'>۲. GitHub Actions چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**GitHub Actions = یه ربات که توی GitHub زندگی می‌کنه.**</span>

</div>

این ربات در یک ماشین مجازی (Ubuntu) اجرا می‌شه که GitHub بهت می‌ده. این ماشین:
<div align='right' dir='rtl'>

<span dir='rtl'>• **کاملاً تمیزه:** هیچ فایلی از سیستم خودت روش نیست</span> <br>
<span dir='rtl'>• **موقتیه:** بعد از اتمام کار، پاک می‌شه (مثل یه اتاق هتل بعد از تحویل)</span> <br>
<span dir='rtl'>• **رایگانه:** برای پروژه‌های <span dir='ltr'>Open Source</span>، GitHub سهمیه‌ی رایگان می‌ده (حتی برای پروژه‌های خصوصی هم ۲۰۰۰ دقیقه در ماه رایگانه)</span> <br>

</div>

### ربات چطور بیدار می‌شه؟

با یه فایل YAML توی پوشه‌ی <span dir='ltr'>`.github/workflows/`</span>. این فایل به GitHub می‌گه:
<div align='right' dir='rtl'>

<span dir='rtl'>• **کی** (on): چه اتفاقی بیفته؟ (<span dir='ltr'>push</span>، <span dir='ltr'>pull request</span>، <span dir='ltr'>tag</span>، ...)</span> <br>
<span dir='rtl'>• **چیکار** (jobs): چه کارهایی انجام بده؟ (تست، <span dir='ltr'>build</span>، <span dir='ltr'>push</span>)</span> <br>

</div>

---

## ۳. معماری پروژه و بازبینی داکررایز

پروژه‌ی این درس یه **URL Shortener** (کوتاه‌کننده لینک) هست. چهار سرویس داره:

```text
┌──────────────────────────────────────────────────┐
│                     کاربر                        │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│          frontend (Nginx، پورت 8092)             │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000                  │
│  /admin/      ──►  backend:8000                  │
│  /health/     ──►  backend:8000                  │
│  /static/     ──►  static_files volume           │
│  /r/{code}/   ──►  backend:8000 (ریدایرکت) ⭐    │
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

قبل از اینکه بریم سراغ CI/CD، بذار **داکررایز کردن** رو با هم مرور کنیم. هدف اینه که چطور یه پروژه رو به کانتینر تبدیل کنیم، ملکه ذهنت بشه.

### ۳.۱. داکررایز کردن بک‌اند (Dockerfile)

فایل `backend-django/Dockerfile`:

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

**مرور خط به خط (خیلی مهم):**
<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>`FROM python:3.12-slim`</span>:** از ایمیج پایه شروع کن. <span dir='ltr'>`slim`</span> یعنی نسخه‌ی کوچک و بهینه (بدون ابزارهای اضافی) — حدود ۱۵۰ مگابایت، در مقابل ۹۰۰ مگابایت نسخه‌ی کامل.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`ENV`</span>:** متغیرهای محیطی برای پایتون. <span dir='ltr'>`PYTHONUNBUFFERED=1`</span> باعث می‌شه لاگ‌ها فوری توی <span dir='ltr'>`docker logs`</span> دیده بشن. <span dir='ltr'>`PIP_NO_CACHE_DIR=1`</span> ایمیج رو کوچک‌تر می‌کنه.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`WORKDIR /app`</span>:** پوشه‌ی کاری. همه‌ی دستورات بعدی این‌جا اجرا می‌شن.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`RUN apt-get`</span>:** نصب <span dir='ltr'>`libpq5`</span> (کتابخانه‌ی PostgreSQL) و <span dir='ltr'>`gosu`</span> (برای تغییر کاربر). خط <span dir='ltr'>`rm -rf`</span> کش رو پاک می‌کنه تا ایمیج کوچک‌تر بشه.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`COPY requirements.txt`</span>:** اول فقط فایل نیازمندی‌ها رو کپی می‌کنیم. **چرا؟** چون Docker هر خط رو کش می‌کنه. اگه کد عوض بشه ولی <span dir='ltr'>`requirements.txt`</span> عوض نشه، مرحله‌ی نصب پکیج دوباره اجرا نمی‌شه (صرفه‌جویی ۲ دقیقه).</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`RUN pip install`</span>:** نصب پکیج‌های پایتون.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`COPY . .`</span>:** کپی بقیه‌ی کدها.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`useradd`</span> و <span dir='ltr'>`USER appuser`</span>:** ساخت کاربر غیر-root برای امنیت. Docker به‌طور پیش‌فرض با root اجرا می‌کنه که خطرناکه.</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`ENTRYPOINT`</span> و <span dir='ltr'>`CMD`</span>:** نقطه‌ی شروع. <span dir='ltr'>`entrypoint.sh`</span> اول <span dir='ltr'>migrate</span> و <span dir='ltr'>collectstatic</span> می‌زنه، بعد <span dir='ltr'>`gunicorn`</span> رو اجرا می‌کنه.</span> <br>

</div>

### ۳.۲. اسکریپت شروع (entrypoint.sh)

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

**چه اتفاقی می‌افته؟**
<div align='right' dir='rtl'>

<span dir='rtl'>1. کانتینر با کاربر `root` شروع می‌شه.</span> <br>
<span dir='rtl'>2. `chown` مالکیت پوشه‌ی `staticfiles` رو به `appuser` می‌ده (چون <span dir='ltr'>Docker</span> volumeها رو با root می‌سازه).</span> <br>
<span dir='rtl'>3. با `gosu` به کاربر `appuser` سوییچ می‌کنه.</span> <br>
<span dir='rtl'>4. `migrate` و `collectstatic` رو با کاربر غیر-root اجرا می‌کنه.</span> <br>
<span dir='rtl'>5. در نهایت `gunicorn` (دستور CMD) رو با `exec` اجرا می‌کنه.</span> <br>

</div>

### ۳.۳. داکررایز کردن فرانت (Multi-stage Build)

فایل `frontend-react/Dockerfile`:

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

**چرا Multi-stage؟**
<div align='right' dir='rtl'>

<span dir='rtl'>• **مرحله اول (`builder`):** Node.js نصب می‌شه، کد React رو build می‌کنه. حجمش <span dir='ltr'>~۵۰۰</span> مگابایته.</span> <br>
<span dir='rtl'>• **مرحله دوم (`final`):** فقط Nginx + فایل‌های کامپایل‌شده. حجمش <span dir='ltr'>~۵۵</span> مگابایته.</span> <br>
<span dir='rtl'>• **نتیجه:** ایمیج نهایی ۱۰ برابر کوچک‌تره، چون Node.js و `node_modules` دور ریخته می‌شن.</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۴. Nginx و ریدایرکت (نکته‌ی کلیدی)</span>

</div>

فایل `frontend-react/nginx.conf`:

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

**نکته‌ی مهم:** بلوک <span dir='ltr'>`location /r/`</span> **قبل از** <span dir='ltr'>`location /`</span> قرار داره. چرا؟ چون Nginx از بالا به پایین چک می‌کنه. اگه <span dir='ltr'>`/r/abc123`</span> بیاد، اول باید به بک‌اند بره (برای ریدایرکت). اگه این بلوک نبود، <span dir='ltr'>`location /`</span> اون رو می‌گرفت و React یه صفحه‌ی 404 نشون می‌داد.

---

## ۴. قلب درس: راه‌اندازی GitHub Actions

حالا بریم سراغ بخش اصلی. می‌خوایم به GitHub بگیم: «هر وقت کد push شد، خودت تست کن و ایمیج بساز.»

### ۴.۱. پیش‌نیازها

**اول: ساخت توکن دسترسی به Docker Hub**

چرا از رمز عبور استفاده نمی‌کنیم؟ چون رمز اصلیت رو نباید جایی بذاری. یه توکن بساز که فقط برای این کار باشه.

<div align='right' dir='rtl'>

1. برو به <span dir='ltr'>`https://hub.docker.com/settings/security`</span> (یا از منوی چپ `Personal access tokens`)
2. روی <span dir='ltr'>`Generate new token`</span> کلیک کن
3. اسمش رو بذار <span dir='ltr'>`github-actions-shortener`</span>
4. دسترسی‌ها: **<span dir='ltr'>Read</span>, <span dir='ltr'>Write</span>, <span dir='ltr'>Delete</span>**
5. روی <span dir='ltr'>`Generate`</span> کلیک کن
6. **توکن رو کپی کن و یه جا ذخیره کن** (فقط یک بار نشون داده می‌شه)

</div>

**دوم: ذخیره توکن در GitHub Secrets**

<div align='right' dir='rtl'>

<span dir='rtl'>1. برو به ریپوی خودت در GitHub</span> <br>
<span dir='rtl'>2. <span dir='ltr'>`Settings`</span> ← <span dir='ltr'>`Secrets and variables`</span> ← <span dir='ltr'>`Actions`</span></span> <br>
<span dir='rtl'>3. روی `New repository secret` کلیک کن</span> <br>
<span dir='rtl'>4. دو تا Secret بساز:</span> <br>
   <span dir='rtl' style='margin-right:32px'>⁌ `DOCKERHUB_USERNAME`: نام کاربری Docker Hub تو</span> <br>
   <span dir='rtl' style='margin-right:32px'>⁌ `DOCKERHUB_TOKEN`: توکنی که ساختی</span> <br>

</div>

**چرا Secrets؟** چون این‌ها رمز هستن. اگه توی فایل کد بنویسی، هر کسی می‌تونه ببیننه. GitHub Secrets رمزنگاری‌شده‌ست و توی لاگ‌های Actions هم به‌صورت `***` نشون داده می‌شه.

### ۴.۲. ساختار پوشه‌ها

پوشه‌ی <span dir='ltr'>`.github/workflows/`</span> باید در **ریشه‌ی ریپو** باشه، نه داخل پوشه‌ی پروژه. چرا؟ چون GitHub فقط این پوشه رو می‌شناسه.

```text
docker-zero-to-hero/                 ← ریشه‌ی ریپو
├── .github/
│   └── workflows/
│       └── ci-shortener.yml         ← فایل CI/CD
└── projects/
    └── 17-shortener/
        ├── backend-django/
        ├── frontend-react/
        ├── compose.yaml
        └── compose.prod.yaml
```

### ۴.۳. نوشتن فایل Workflow

فایل <span dir='ltr'>`.github/workflows/ci-shortener.yml`</span>:

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

### ۴.۴. توضیح خط به خط (مهم‌ترین بخش درس)

بذار این فایل رو با هم کالبدشکافی کنیم.

**بخش `on`: چه زمانی اجرا بشه؟**
```yaml
on:
  push:
    branches: [main]
    paths:
      - 'projects/17-shortener/**'
```
<div align='right' dir='rtl'>

<span dir='rtl'>• `push` روی شاخه‌ی `main`.</span> <br>
<span dir='rtl'>• `paths`: فقط اگه تغییرات توی پوشه‌ی <span dir='ltr'>`projects/17-shortener/`</span> باشه. **چرا؟** چون ریپوی ما ۱۰ پروژه داره. اگه کد پروژه ۹ رو تغییر بدیم، این workflow نباید اجرا بشه.</span> <br>
<span dir='rtl'>• `**` یعنی هر فایلی در هر عمقی.</span> <br>
<span dir='rtl'>• `pull_request`: برای تست شدن قبل از merge هم اجرا می‌شه.</span> <br>
<span dir='rtl'>• `workflow_dispatch`: یه دکمه‌ی دستی در GitHub UI که می‌تونی هر وقت خواستی workflow رو اجرا کنی.</span> <br>

</div>

**بخش `env`: متغیرهای مشترک**
```yaml
env:
  PROJECT_DIR: projects/17-shortener
  IMAGE_PREFIX: ${{ secrets.DOCKERHUB_USERNAME }}/shortener
```
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`PROJECT_DIR`</span>: برای اینکه اگه مسیر پروژه رو جابجا کردیم، فقط یک جا تغییر بدیم.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`IMAGE_PREFIX`</span>: اسم ایمیج در Docker Hub.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`${{ secrets.DOCKERHUB_USERNAME }}`</span>: مقدار Secret رو از GitHub می‌خونه.</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Job اول: `test` (تست)**</span>

</div>

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
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`runs-on: ubuntu-latest`</span>: یه ماشین ابری Ubuntu از GitHub می‌گیریم.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`actions/checkout@v4`</span>: کد ریپو رو روی ماشین دانلود می‌کنه. (بدون این، ماشین خالیه!)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`actions/setup-python@v5`</span>: پایتون 3.12 نصب می‌کنه. <span dir='ltr'>`cache: 'pip'`</span> باعث می‌شه پکیج‌ها بین اجراها کش بشن (از ۱ دقیقه به ۵ ثانیه).</span> <br>
<span dir='rtl'>• <span dir='ltr'>`pip install`</span>: نصب نیازمندی‌ها.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`python manage.py check`</span>: تست سلامت کد جنگو. اگه خطایی توی <span dir='ltr'>import</span>، migration یا تنظیمات باشه، این مرحله fail می‌شه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`env`</span>: متغیرهای محیطی برای تست. بدون این‌ها، <span dir='ltr'>`settings.py`</span> که از <span dir='ltr'>`.env`</span> می‌خونه، خطا می‌ده.</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Job دوم: `build` (ساخت و push)**</span>

</div>

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
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`needs: test`</span>: **مهم‌ترین خط!** Job `build` فقط بعد از موفقیت `test` اجرا می‌شه. اگه تست fail بشه، build اجرا نمی‌شه ← **کد خراب هیچ‌وقت build نمی‌شه.**</span> <br>
<span dir='rtl'>• <span dir='ltr'>`if: github.event_name != 'pull_request'`</span>: روی PR، فقط تست اجرا می‌شه، نه build. چرا؟ چون PR هنوز merge نشده. push کردن image از <span dir='ltr'>PR</span>، Docker Hub رو آلوده می‌کنه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`strategy: matrix`</span>: این یه ترفند عالیه. به‌جای اینکه دو Job جدا بنویسیم (یکی برای backend، یکی برای frontend)، یه Job می‌نویسیم که **موازی برای دو حالت** اجرا می‌شه. نتیجه: **زمان نصف**.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`fail-fast: false`</span>: اگه بک‌اند fail شد، فرانت‌اند باز ادامه بده.</span> <br>

</div>

**مراحل Job دوم (Stepها)**
```yaml
steps:
  - uses: actions/checkout@v4
  - uses: docker/setup-buildx-action@v3
  - uses: docker/login-action@v3
    with:
      username: ${{ secrets.DOCKERHUB_USERNAME }}
      password: ${{ secrets.DOCKERHUB_TOKEN }}
```
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`setup-buildx-action`</span>: ابزار Buildx رو نصب می‌کنه. برای کش لایه‌ها (که ۵ برابر سریع‌تر می‌کنه) لازمه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`login-action`</span>: به Docker Hub وصل می‌شه. بدون این، نمی‌تونه push کنه.</span> <br>

</div>

**تولید تگ‌ها (metadata)**
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
<div align='right' dir='rtl'>

این Step تگ‌ها رو خودکار تولید می‌کنه:
<div align='center' dir='rtl'>

| تریگر | تگ خودکار |
|--------|-----------|
|<span dir='rtl'> Push به `main` </span>| <span dir='ltr'>`main`</span>, <span dir='ltr'>`latest`</span>, <span dir='ltr'>`sha-a1b2c3d`</span> |
| Tag `v1.0.0` | `1.0.0`, `1.0` |

</div>

</div>

**آخرین <span dir='ltr'>Step</span>: <span dir='ltr'>Build</span> و Push**
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
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`context`</span>: مسیر پروژه (برای بک‌اند و فرانت‌اند متفاوته).</span> <br>
<span dir='rtl'>• <span dir='ltr'>`push: true`</span>: بعد از build، به Docker Hub بفرست.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`cache-from`</span> و `cache-to`: از کش GitHub Actions استفاده کن (بار اول ۳ دقیقه، بارهای بعد ۳۰ ثانیه).</span> <br>

</div>

### ۴.۵. تست و دیدن نتیجه

حالا فایل رو push کن:
```bash
git add .github/workflows/ci-shortener.yml
git commit -m "ci: add GitHub Actions workflow"
git push
```

برو به تب **Actions** در ریپو.

**انتظار:** سه Job رو می‌بینی:
<div align='center' dir='rtl'>

```text
✅ CI — Shortener / Test backend
✅ CI — Shortener / Build backend
✅ CI — Shortener / Build frontend
```

</div>

**وقتی سبز شدن، برو Docker Hub:**
<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`https://hub.docker.com/r/<username>/shortener-backend/tags`</span></span>

**انتظار:** چند تگ جدید می‌بینی (<span dir='ltr'>`main`</span>, <span dir='ltr'>`latest`</span>, <span dir='ltr'>`sha-...`</span>).

</div>

---

## ۵. حالا در Production چیکار کنیم؟

بعد از این‌که ایمیج‌ها توی Docker Hub رفتن، روی سرور production چطور ازشون استفاده کنیم؟

فایل <span dir='ltr'>`compose.prod.yaml`</span> دقیقاً مثل <span dir='ltr'>`compose.yaml`</span> هست، ولی:
<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`build:`</span> حذف شده ← <span dir='ltr'>`image:`</span> جاش اومده</span> <br>
<span dir='rtl'>• <span dir='ltr'>`image: <username>/shortener-backend:latest`</span></span> <br>

</div>

```yaml
services:
  backend:
    image: ${DOCKERHUB_USERNAME}/shortener-backend:latest
    # ...
  frontend:
    image: ${DOCKERHUB_USERNAME}/shortener-frontend:latest
    # ...
```

**تست واقعی:**
<div align='right' dir='rtl'>

<span dir='rtl'>1. کد رو از سرور پاک کن (شبیه‌سازی سرور تمیز).</span> <br>
<span dir='rtl'>2. فقط <span dir='ltr'>`compose.prod.yaml`</span> و <span dir='ltr'>`.env`</span> رو نگه دار.</span> <br>
<span dir='rtl'>3. <span dir='ltr'>`docker compose -f compose.prod.yaml up`</span> بزن.</span> <br>
<span dir='rtl'>4. **باید ببینی:** <span dir='ltr'>`✔ shortener-backend Pulled`</span> و <span dir='ltr'>`✔ shortener-frontend Pulled`</span>.</span> <br>
<span dir='rtl'>5. پروژه بدون یک خط کد بالا میاد. ✅</span> <br>

</div>

---

## ۶. جمع‌بندی

### چیزهایی که یاد گرفتیم

**۱. ذهنیت داکری — سؤال دهم اضافه شد:**
<div align='right' dir='rtl'>

<span dir='rtl'>1 تا ۸. (همون سؤالات قبل)</span> <br>
<span dir='rtl'>9. **ایمیج‌ها کجا نگهداری می‌شن؟** ← Registry</span> <br>
<span dir='rtl'>10. **چه کسی ایمیج‌ها رو push می‌کنه؟** ← **ربات GitHub Actions** ⭐</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۲. GitHub Actions چیه؟**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• یه ربات که توی GitHub زندگی می‌کنه.</span> <br>
<span dir='rtl'>• با فایل <span dir='ltr'>`.github/workflows/*.yml`</span> تنظیم می‌شه.</span> <br>
<span dir='rtl'>• روی یه ماشین Ubuntu تمیز اجرا می‌شه.</span> <br>

</div>

**۳. سه بخش اصلی یه Workflow:**
<div align='right' dir='rtl'>

<span dir='rtl'>• **`on`:** کی اجرا بشه</span> <br>
<span dir='rtl'>• **`jobs`:** چه کارهایی انجام بده</span> <br>
<span dir='rtl'>• **`steps`:** هر Job چطور انجام بشه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۴. Matrix Strategy:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• به‌جای دو Job جدا، یه Job با دو `include`.</span> <br>
<span dir='rtl'>• نتیجه: build موازی ← زمان نصف.</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۵. Secrets:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• رمزها توی فایل نمی‌نویسی.</span> <br>
<span dir='rtl'>• توی <span dir='ltr'>GitHub Settings</span> ← Secrets.</span> <br>
<span dir='rtl'>• توی workflow با <span dir='ltr'>`${{ secrets.NAME }}`</span>.</span> <br>

</div>

**۶. تفاوت `compose.yaml` و `compose.prod.yaml`:**
<div align='center' dir='rtl'>

| بخش | dev | prod |
|-----|-----|------|
| <span dir='ltr'>`build:`</span> | ✅ | ❌ |
| <span dir='ltr'>`image:`</span> | ❌ | ✅ |
| نیاز به کد | ✅ | ❌ |

</div>

### قانون طلایی این درس:

<div align='center' dir='rtl'>

**«کد رو یه جا build کن (GitHub Actions)، همه‌جا pull کن (production).»**

</div>

با GitHub Actions، این قانون **خودکار** می‌شه.

### آنچه در ادامه می‌آید

**درس ۱۸ — <span dir='ltr'>Portfolio</span> (Deploy به <span dir='ltr'>VPS</span> + <span dir='ltr'>SSL</span> + <span dir='ltr'>Domain</span>)**

یه پروژه‌ی جدید که:
<div align='right' dir='rtl'>

<span dir='rtl'>• روی یه سرور واقعی (VPS) دیپلوی می‌شه.</span> <br>
<span dir='rtl'>• دامنه‌ی اختصاصی می‌گیره.</span> <br>
<span dir='rtl'>• گواهی SSL با Let's Encrypt نصب می‌شه.</span> <br>
<span dir='rtl'>• **پروژه از صفر تا صد آنلاین می‌شه.**</span> <br>

</div>

و بعد از اون:
<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۹:** <span dir='ltr'>Vault</span> (<span dir='ltr'>Security</span>: <span dir='ltr'>Trivy</span>، <span dir='ltr'>Secrets</span>، <span dir='ltr'>Hardening</span>)</span> <br>
<span dir='rtl'>• **درس ۲۰:** <span dir='ltr'>Log Analyzer</span> (Debugging عمیق)</span> <br>
<span dir='rtl'>• **درس ۲۱:** <span dir='ltr'>Cheat Sheet</span> + Docker Templates</span> <br>
<span dir='rtl'>• **درس ۲۲:** <span dir='ltr'>Wrap-up</span> + نقشه‌ی راه</span> <br>

</div>
