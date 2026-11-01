<div align='right' dir='rtl'>

[🇬🇧 English](/projects/13-recipe-book/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>Recipe Book — کتاب دستور پخت</span>

</div>

> یه اپلیکیشن فول‌استک برای مدیریت دستور پخت: React + Django + PostgreSQL + Nginx، همه توی Docker، با **multi-stage build** که یه Image فرانت‌اند ۵۰ مگابایتی می‌سازه.

---

## معرفی

<p dir='rtl'>
Recipe Book یه اپلیکیشن فول‌استک برای کشف و مدیریت دستور پخته. هر دستور پخت یه عنوان، توضیحات، عکس، لیست مواد لازم، مراحل پخت، دسته‌بندی، سختی، زمان آماده‌سازی/پخت، و تعداد نفرات داره.
</p>

این پروژه، پیاده‌سازی مرجع **درس ۱۳** دوره‌ی «داکر از صفر تا صد» است.

این اولین پروژه‌ی دوره‌ست که **فرانت‌اند React** و **بک‌اند Django** رو در یه اپلیکیشن قابل‌استقرار ترکیب می‌کنه، و با یه کانتینر Nginx سرو می‌شه. همچنین اولین پروژه‌ایه که از **multi-stage Docker build** استفاده می‌کنه تا یه Image کوچیک تولید کنه.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **مرور دستور پخت‌ها** با یه گرید زیبا و تم تاریک</span> <br>
<span dir='rtl'>• **جستجو** توی عنوان، توضیحات، و مواد لازم</span> <br>
<span dir='rtl'>• **فیلتر** بر اساس دسته‌بندی (صبحانه، ناهار، شام، دسر، میان‌وعده)</span> <br>
<span dir='rtl'>• **صفحه‌ی جزئیات** با عکس، لیست مواد، و مراحل پخت</span> <br>
<span dir='rtl'>• **پنل ادمین Django** برای افزودن، ویرایش، و حذف دستور پخت</span> <br>
<span dir='rtl'>• **آپلود عکس** با پیش‌نمایش بندانگشتی توی ادمین</span> <br>
<span dir='rtl'>• **Multi-stage Docker build** برای فرانت‌اند ← <span dir='ltr'>Image</span> ۱۰ برابر کوچیک‌تر</span> <br>
<span dir='rtl'>• **CORS و CSRF** به‌درستی تنظیم‌شده برای درخواست‌های cross-origin</span> <br>
<span dir='rtl'>• **یه پورت واحد** برای همه‌چیز (فرانت + API + ادمین + static + media)</span>

</div>

---

## معماری

سه سرویس با هم کار می‌کنن:

```text
کاربر ──► frontend (Nginx، پورت 8088)
            │
            ├──► /             ──► فایل‌های static React (از stage 2)
            ├──► /api/         ──► backend:8000 (Django)
            ├──► /admin/       ──► backend:8000 (Django)
            ├──► /health/      ──► backend:8000 (Django)
            ├──► /static/      ──► volume static_files (CSS ادمین Django)
            └──► /media/       ──► volume media_files (عکس‌های غذا)
```

<div align='center' dir='rtl'>

| سرویس | نقش | پورت |
|--------|------|------|
| <span dir='ltr'>`db`</span> | <span dir='ltr'>PostgreSQL 16</span> |<span dir='rtl'> داخلی </span>|
| <span dir='ltr'>`backend`</span> | <span dir='ltr'>Django + Gunicorn</span> |<span dir='rtl'> داخلی ۸۰۰۰ </span>|
| <span dir='ltr'>`frontend`</span> | <span dir='rtl'>React (build شده) + Nginx </span>| <span dir='rtl'>**۸۰۸۸** (روی هاست) </span>|

</div>

> **نکته درباره‌ی پورت:** این پروژه روی پورت **۸۰۸۸** اجرا می‌شه. بقیه‌ی پروژه‌های این دوره روی ۸۰۰۰ <span dir='ltr'>(TaskFlow)</span>، ۹۰۰۰ <span dir='ltr'>(URL Monitor)</span>، ۸۰۸۰ <span dir='ltr'>(Photo Gallery)</span>، و ۳۰۰۰ <span dir='ltr'>(Kanban Board)</span> هستن. یکتا بودن پورت‌ها یعنی هر پنج پروژه می‌تونن همزمان اجرا بشن.

### سه volume

<div align='center' dir='rtl'>

| Volume | نویسنده | خواننده | چه چیزی نگه می‌داره |
|--------|----------|----------|----------------------|
| <span dir='ltr'>`postgres_data`</span> | <span dir='ltr'>`db`</span> | <span dir='ltr'>`db`</span> |<span dir='rtl'> فایل‌های دیتابیس </span>|
| <span dir='ltr'>`static_files`</span> | <span dir='ltr'>`backend` (`collectstatic`)</span> | <span dir='ltr'>`frontend` (Nginx)</span> | <span dir='rtl'>CSS ادمین Django </span>|
| <span dir='ltr'>`media_files`</span> | <span dir='rtl'>`backend` (آپلودها) </span>| <span dir='ltr'>`frontend` (Nginx)</span> |<span dir='rtl'> عکس‌های غذا </span>|

</div>

---

## شروع سریع

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/13-recipe-book
```

### ۲. ساخت فایل محیطی بک‌اند

```bash
cp backend-django/.env.example backend-django/.env
```

### ۳. ساخت و اجرای همه‌چیز

```bash
docker compose up --build
```

اولین build بین ۳ تا ۵ دقیقه طول می‌کشه. buildهای بعدی کش می‌شن.

### ۴. ساخت کاربر ادمین

در یک ترمینال دیگر:

```bash
docker compose exec backend python manage.py createsuperuser
```

### ۵. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>Recipe Book</span>:** <span dir='ltr'><http://127.0.0.1:8088/></span></span> <br>
<span dir='rtl'>• **پنل ادمین:** <span dir='ltr'><http://127.0.0.1:8088/admin/></span></span> <br>
<span dir='rtl'>• **<span dir='ltr'>API</span>:** <span dir='ltr'><http://127.0.0.1:8088/api/recipes/></span></span> <br>
<span dir='rtl'>• **<span dir='ltr'>Health check</span>:** <span dir='ltr'><http://127.0.0.1:8088/health/></span></span>

</div>

### ۶. امتحان کن!

<div align='right' dir='rtl'>

<span dir='rtl'>۱. به پنل ادمین لاگین کن.</span> <br>
<span dir='rtl'>۲. روی <span dir='ltr'>**Recipes**</span> ← **ADD RECIPE** بزن.</span> <br>
<span dir='rtl'>۳. عنوان، مواد لازم، مراحل پخت، و عکس رو پر کن.</span> <br>
<span dir='rtl'>۴. Save بزن.</span> <br>
<span dir='rtl'>۵. برگرد به <span dir='ltr'><http://127.0.0.1:8088/></span> — دستور پختت اونجاست.</span>

</div>

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Multi-stage Build (مهم‌ترین مفهوم)</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Dockerfile فرانت‌اند **دو مرحله** داره:</span>

</div>

### مرحله‌ی ۱ — Build (Node.js)

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build
```

این مرحله <span dir='ltr'>Node.js</span>، npm، و vite رو داره. کد React رو به فایل‌های static (HTML/CSS/JS) توی `/app/dist/` کامپایل می‌کنه.

**حجم: <span dir='ltr'>~۵۰۰</span> مگابایت.**

### مرحله‌ی ۲ — Serve (Nginx)

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
```

این مرحله فقط Nginx داره. **فقط پوشه‌ی `dist`** رو از مرحله‌ی ۱ کپی می‌کنه.

**حجم: <span dir='ltr'>~۵۰</span> مگابایت.**

### نتیجه

<div align='right' dir='rtl'>

<span dir='rtl'>Image نهایی **۱۰ برابر کوچیک‌تره**، چون هیچ‌کدوم از این‌ها توش نیست:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• Node.js runtime</span> <br>
<span dir='rtl'>• npm package manager</span> <br>
<span dir='rtl'>• کد سورس</span> <br>
<span dir='rtl'>• `node_modules` (۲۰۰+ مگابایت)</span> <br>
<span dir='rtl'>• ابزارهای build (vite، esbuild)</span>

</div>

فقط Nginx + فایل‌های static که سرو می‌شن.

خودت چک کن:

```bash
docker images | grep 13-recipe-book
```

باید ببینی <span dir='ltr'>Image</span> `frontend` حدود ۵۰ مگابایته.

---

## ساختار پروژه

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

یه فایل <span dir='ltr'>`.gitignore`</span> واحد در ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده.

---

## متغیرهای محیطی

تعریف‌شده در <span dir='ltr'>`backend-django/.env`</span> (نگاه کن به <span dir='ltr'>`.env.example`</span>):

<div align='center' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|------|---------|
| <span dir='ltr'>`SECRET_KEY`</span> | کلید مخفی جنگو | — (الزامی) |
| <span dir='ltr'>`DEBUG`</span> | حالت دیباگ | `True` |
| <span dir='ltr'>`ALLOWED_HOSTS`</span> | هاست‌های مجاز، جداشده با کاما | <span dir='ltr'>`localhost,127.0.0.1`</span> |
| <span dir='ltr'>`CORS_ALLOWED_ORIGINS`</span> |<span dir='rtl'> آدرس‌های React که می‌تونن API رو صدا بزنن </span>| <span dir='ltr'>`http://localhost:5173,http://localhost:8088`</span> |
| <span dir='ltr'>`CSRF_TRUSTED_ORIGINS`</span> |<span dir='rtl'> آدرس‌های React مورد اعتماد برای POST/PUT/DELETE </span>| <span dir='ltr'>`http://localhost:5173,http://localhost:8088`</span> |
| <span dir='ltr'>`POSTGRES_DB`</span> | نام دیتابیس | `recipebook` |
| <span dir='ltr'>`POSTGRES_USER`</span> | کاربر دیتابیس | `recipebook` |
| <span dir='ltr'>`POSTGRES_PASSWORD`</span> | رمز دیتابیس | `recipebook_dev_password` |
| <span dir='ltr'>`POSTGRES_HOST`</span> | هاست دیتابیس |<span dir='rtl'> `localhost` (در <span dir='ltr'>`.env`</span>)، `db` (در compose) </span>|
| <span dir='ltr'>`POSTGRES_PORT`</span> | پورت دیتابیس | `5432` |

</div>

**فایل <span dir='ltr'>`.env`</span> رو هرگز کامیت نکن.**

### چرا دو تا origin برای CORS/CSRF؟

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`localhost:5173`</span> ← Vite dev server (وقتی React رو لوکال با `npm run dev` اجرا می‌کنی)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`localhost:8088`</span> ← Nginx (وقتی کل استک Docker رو اجرا می‌کنی)</span>

</div>

هر دو باید مجاز باشن.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/health/`</span> | بررسی سلامت |
| <span dir='ltr'>GET</span> / <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/recipes/`</span> | لیست / ساخت دستور پخت |
| <span dir='ltr'>GET</span> / <span dir='ltr'>PUT</span> / <span dir='ltr'>PATCH</span> / <span dir='ltr'>DELETE</span> | <span dir='ltr'>`/api/recipes/{id}/`</span> | جزئیات دستور پخت |
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/admin/`</span> |<span dir='rtl'> پنل ادمین Django </span>|

</div>

### پارامترهای query برای <span dir='ltr'>`/api/recipes/`</span>

<div align='center' dir='rtl'>

| پارامتر | مثال | اثر |
|---------|------|-----|
| <span dir='ltr'>`?search=`</span> | <span dir='ltr'>`?search=pasta`</span> | جستجو در عنوان، توضیحات، مواد لازم |
| <span dir='ltr'>`?category=`</span> | <span dir='ltr'>`?category=dinner`</span> | فیلتر بر اساس دسته‌بندی |
| <span dir='ltr'>`?difficulty=`</span> | <span dir='ltr'>`?difficulty=easy`</span> | فیلتر بر اساس سختی |
| <span dir='ltr'>`?ordering=`</span> | <span dir='ltr'>`?ordering=title`</span> |<span dir='rtl'> مرتب‌سازی بر اساس فیلد (پیشوند `-` برای نزولی) </span>|

</div>

### مثال

```bash
curl "http://127.0.0.1:8088/api/recipes/?search=pasta&category=dinner"
```

---

## حالت توسعه (بدون Docker)

اجرای جداگانه‌ی React و Django برای hot reload توی توسعه مفیده.

### بک‌اند

```bash
cd backend-django
python -m venv .venv
source .venv/bin/activate        # یا: .venv\Scripts\activate در ویندوز
pip install -r requirements.txt

# مطمئن شو PostgreSQL محلی در حال اجراست، سپس:
python manage.py migrate
python manage.py runserver
```

روی <span dir='ltr'><http://localhost:8000/></span> اجرا می‌شه.

### فرانت‌اند

```bash
cd frontend-react
npm install
npm run dev
```

روی <span dir='ltr'><http://localhost:5173/></span> اجرا می‌شه. proxy ویت توی `vite.config.js` درخواست‌های <span dir='ltr'>`/api`</span> و <span dir='ltr'>`/media`</span> رو به <span dir='ltr'>`localhost:8000`</span> پاس می‌ده، پس توی dev نیازی به CORS نیست.

---

## دستورات پرکاربرد

```bash
# Build و اجرای همه‌چیز
docker compose up --build

# دیدن وضعیت سرویس‌ها
docker compose ps

# دنبال کردن لاگ بک‌اند
docker compose logs -f backend

# دنبال کردن لاگ فرانت (Nginx)
docker compose logs -f frontend

# باز کردن shell داخل بک‌اند
docker compose exec backend bash

# اجرای دستورات مدیریتی Django
docker compose exec backend python manage.py <command>

# باز کردن psql
docker compose exec db psql -U recipebook -d recipebook

# توقف (volume حفظ می‌شه)
docker compose down

# توقف و حذف volumeها (هشدار: داده‌ها پاک می‌شن)
docker compose down -v
```

---

## عیب‌یابی

### مشکل ۱ — <span dir='ltr'>`/health/`</span> به‌جای <span dir='ltr'>`{"status": "ok"}`</span> صفحه‌ی React رو نشون می‌ده

**علت:** Nginx یه بلاک <span dir='ltr'>`location /health/`</span> نداره، پس درخواست به <span dir='ltr'>`location /`</span> می‌افته و `index.html` React رو سرو می‌کنه.

**راه‌حل:** این بلاک رو به `frontend-react/nginx.conf` اضافه کن:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
    proxy_set_header X-Real-IP $remote_addr;
}
```

بعد restart کن: <span dir='ltr'>`docker compose up --build`</span>.

### مشکل ۲ — CSRF verification failed هنگام لاگین به ادمین

**علت:** از جنگو ۴.۰ به بعد، جنگو هدر `Origin` درخواست‌های POST رو بررسی می‌کنه. درخواست‌های از <span dir='ltr'>`http://127.0.0.1:8088`</span> رد می‌شن چون origin قابل‌اعتماد نیست.

**راه‌حل:** مطمئن شو `CSRF_TRUSTED_ORIGINS` توی <span dir='ltr'>`backend-django/.env`</span> هست:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8088,http://127.0.0.1:8088
```

و توی `nginx.conf`، از <span dir='ltr'>`proxy_set_header Host $http_host;`</span> استفاده کن (<span dir='ltr'>`$http_host`</span>، نه <span dir='ltr'>`$host`</span>).

### مشکل ۳ — Permission denied هنگام آپلود عکس

**علت:** Docker حجم‌های نام‌دار رو با کاربر `root` می‌سازه. کاربر <span dir='ltr'>non-root</span> `appuser` داخل کانتینر بک‌اند نمی‌تونه توشون بنویسه.

**راه‌حل:** `entrypoint.sh` از `gosu` استفاده می‌کنه تا مالکیت رو توی اجرای اول درست کنه. بررسی کن که این بلاک رو داره:

```sh
if [ "$(id -u)" = "0" ]; then
    chown -R appuser:appuser /app/staticfiles /app/media
    exec gosu appuser "$0" "$@"
fi
```

### مشکل ۴ — عکس‌ها لود نمی‌شن

**بررسی:**

```bash
docker compose exec backend ls /app/media/recipes/
docker compose exec frontend ls /app/media/recipes/
```

هر دو باید عکس رو نشون بدن. اگه بک‌اند داره ولی فرانت نداره، <span dir='ltr'>volume</span> `media_files` توی `compose.yaml` به اشتراک گذاشته نشده.

### مشکل ۵ — پورت ۸۰۸۸ در استفاده است

پورت هاست رو توی `compose.yaml` عوض کن:

```yaml
frontend:
  ports:
    - "127.0.0.1:8089:80"
```

بعد از `http://127.0.0.1:8089` استفاده کن.

روی ویندوز، اگه پورت توسط سیستم رزرو شده (نه واقعاً توسط یه پروسه استفاده می‌شه)، موقتاً WinNAT رو متوقف کن:

```powershell
net stop winnat
```

کانتینرها رو بالا بیار، بعد:

```powershell
net start winnat
```

### مشکل ۶ — Image فرانت‌اند به‌طور غیرمنتظره بزرگه

**علت:** شاید بعد از ویرایش <span dir='ltr'>Dockerfile</span> `docker compose build` نزدی، یا build شکست خورده و یه Image قدیمی هنوز استفاده می‌شه.

**بررسی:**

```bash
docker images | grep 13-recipe-book-frontend
```

<div align='right' dir='rtl'>

<span dir='rtl'>Image فرانت‌اند باید حدود ۵۰ مگابایت باشه. اگه خیلی بزرگ‌تره، multi-stage build درست اجرا نشده. توی خروجی build دنبال `stage-1` و `stage-2` بگرد:</span>

</div>

```bash
docker compose build frontend
```

---

## اجرا در کنار بقیه‌ی درس‌ها

این پروژه طوری طراحی شده که کنار پروژه‌های قبلی دوره اجرا بشه:

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۰۹ | TaskFlow | ۸۰۰۰ |
| ۱۰ | URL Monitor | ۹۰۰۰ |
| ۱۱ | Photo Gallery | ۸۰۸۰ |
| ۱۲ | Kanban Board | ۳۰۰۰ |
| **۱۳** | **Recipe Book** | **۸۰۸۸** |

</div>

می‌تونی هر پنج‌تا رو همزمان بالا بیاری:

```bash
cd projects/09-taskflow/backend-django && docker compose up -d
cd projects/10-url-monitor && docker compose up -d
cd projects/11-photo-gallery && docker compose up -d
cd projects/12-react-kanban && docker compose up -d
cd projects/13-recipe-book && docker compose up -d
```

بعد سر بزن به:

<div align='right' dir='rtl'>

<span dir='rtl'>• TaskFlow API: <span dir='ltr'><http://127.0.0.1:8000/api/tasks/></span></span> <br>
<span dir='rtl'>• URL Monitor: <span dir='ltr'><http://127.0.0.1:9000/api/urls/></span></span> <br>
<span dir='rtl'>• Photo Gallery: <span dir='ltr'><http://127.0.0.1:8080/></span></span> <br>
<span dir='rtl'>• Kanban Board: <span dir='ltr'><http://127.0.0.1:3000/></span></span> <br>
<span dir='rtl'>• Recipe Book: <span dir='ltr'><http://127.0.0.1:8088/></span></span>

</div>

هر پروژه کاملاً مستقله. توقف یکی روی بقیه اثری نداره.

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False` توی `backend-django/.env` بگذار</span> <br>
<span dir='rtl'>• [ ] از `SECRET_KEY` واقعی استفاده کن</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` رو به دامنه‌ی واقعی ست کن</span> <br>
<span dir='rtl'>• [ ] `CORS_ALLOWED_ORIGINS` و `CSRF_TRUSTED_ORIGINS` رو به `https://yourdomain.com` ست کن</span> <br>
<span dir='rtl'>• [ ] از HTTPS استفاده کن (Nginx با گواهی Let's Encrypt)</span> <br>
<span dir='rtl'>• [ ] تعداد workerهای Gunicorn رو بر اساس هسته‌های CPU زیاد کن</span> <br>
<span dir='rtl'>• [ ] برای `postgres_data` و `media_files` بکاپ تنظیم کن</span> <br>
<span dir='rtl'>• [ ] از سیستم مدیریت Secret برای اعتبارنامه‌ها استفاده کن</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۳ — Fullstack + Multi-stage Build**](/projects/13-recipe-book/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
