<div align='right' dir='rtl'>

[🇬🇧 English](/projects/taskflow/backend-django/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>TaskFlow — بک‌اند جنگو</span>

</div>

> یک API واقعی مدیریت تسک با Django REST Framework، به‌طور کامل داکری‌شده.

---

## معرفی

<p dir='rtl'>
TaskFlow یک API مدیریت تسک است که با Django و Django REST Framework ساخته شده. این پروژه، پیاده‌سازی مرجع درس ۰۹ دوره‌ی «داکر از صفر تا صد» است.
</p>

هدف این پروژه، نشان‌دادن یک راه‌اندازی کامل در سطح محیط عملیاتی برای یک اپلیکیشن جنگو با Docker است، شامل:

<div align='right' dir='rtl'>

<span dir='rtl'>• یک `Dockerfile` با کاربر non-root و کش لایه‌ای وابستگی‌ها</span> <br>
<span dir='rtl'>• `docker compose` برای هم‌راه‌اندازی برنامه با PostgreSQL</span> <br>
<span dir='rtl'>• پیکربندی مبتنی بر متغیر محیطی با `django-environ`</span> <br>
<span dir='rtl'>• اجرای خودکار مایگریشن‌ها هنگام بالا آمدن کانتینر با `entrypoint.sh`</span> <br>
<span dir='rtl'>• یک Endpoint سلامت‌سنجی برای probeهای زیرساختی</span>

</div>

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **احراز هویت** — مبتنی بر Session (برای توسعه)، آماده برای Token (تولید)</span> <br>
<span dir='rtl'>• **CRUD تسک** — ایجاد، خواندن، بروزرسانی، حذف</span> <br>
<span dir='rtl'>• **CRUD دسته‌بندی** — گروه‌بندی تسک‌ها در دسته‌های کاربر</span> <br>
<span dir='rtl'>• **جداسازی کاربر** — هر کاربر فقط تسک‌های خودش را می‌بیند</span> <br>
<span dir='rtl'>• **اولویت و وضعیت** — اولویت low/medium/high، وضعیت todo/in-progress/done</span> <br>
<span dir='rtl'>• **تاریخ سررسید** — تاریخ سررسید اختیاری برای هر تسک</span> <br>
<span dir='rtl'>• **پنل ادمین** — یکپارچه با Django admin</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Health check** — endpoint `/health/`</span> برای probe</span>

</div>

---

## پشته‌ی فناوری

<div align='center' dir='rtl'>

| بخش | نسخه |
|-----|------|
| Python | 3.12 |
| Django | 5.1.4 |
| Django REST Framework | 3.15.2 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| django-environ | 0.14.0 |
| Gunicorn | 23.0.0 (برای تولید) |

</div>

---

## شروع سریع (با Docker)

### ۱. کلون ریپو

```bash
git clone <https://github.com/QUANTORIS01/docker-zero-to-hero.git>
cd docker-zero-to-hero/projects/taskflow/backend-django
```

### ۲. ساخت فایل محیطی

```bash
cp .env.example .env
```

### ۳. ساخت و اجرا

```bash
docker compose up --build
```

### ۴. ساخت کاربر ادمین

در یک ترمینال دیگر:

```bash
docker compose exec web python manage.py createsuperuser
```

### ۵. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• پنل ادمین: <span dir='ltr'><http://127.0.0.1:8000/admin/></span></span> <br>
<span dir='rtl'>• API: <span dir='ltr'><http://127.0.0.1:8000/api/tasks/></span></span> <br>
<span dir='rtl'>• Health: <span dir='ltr'><http://127.0.0.1:8000/health/></span></span>

</div>

---

## شروع سریع (بدون Docker)

```bash
python -m venv .venv
source .venv/bin/activate        # یا: .venv\Scripts\activate در ویندوز
pip install -r requirements.txt

# مطمئن شو PostgreSQL محلی در حال اجراست، سپس:
python manage.py migrate
python manage.py runserver
```

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/health/` </span>| بررسی سلامت |
| <span dir='ltr'>GET / POST </span>| <span dir='ltr'>`/api/categories/` </span>| لیست / ایجاد دسته‌بندی |
| <span dir='ltr'>GET / PUT / PATCH / DELETE </span>| <span dir='ltr'>`/api/categories/{id}/` </span>| جزئیات دسته‌بندی |
| <span dir='ltr'>GET / POST </span>| <span dir='ltr'>`/api/tasks/`</span> | لیست / ایجاد تسک (محدود به کاربر) |
| <span dir='ltr'>GET / PUT / PATCH / DELETE </span>| <span dir='ltr'>`/api/tasks/{id}/` </span>| جزئیات تسک |
| <span dir='ltr'>GET </span>| <span dir='ltr'>`/admin/` </span>| Django admin |

</div>

---

## ساختار پروژه

```text
backend-django/
├── .dockerignore
├── .env.example
├── .gitignore
├── Dockerfile
├── compose.yaml
├── entrypoint.sh
├── manage.py
├── requirements.txt
├── README.md
├── README.fa.md
├── config/
│   ├── __init__.py
│   ├── asgi.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── tasks/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── urls.py
    ├── views.py
    └── migrations/
        ├── __init__.py
        └── 0001_initial.py
```

---

## متغیرهای محیطی

پیکربندی از فایل <span dir='ltr'>`.env`</span> در ریشه‌ی پروژه خونده می‌شه. از <span dir='ltr'>`.env.example`</span> به‌عنوان قالب استفاده کن:

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# PostgreSQL
POSTGRES_DB=taskflow
POSTGRES_USER=taskflow
POSTGRES_PASSWORD=taskflow_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

<div align='center' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|-----|---------|
| `SECRET_KEY` | کلید مخفی جنگو | — (الزامی) |
| `DEBUG` | حالت دیباگ | `False` |
| `ALLOWED_HOSTS` | لیست هاست‌های مجاز، جداشده با کاما | `localhost,127.0.0.1` |
| `POSTGRES_DB` | نام دیتابیس | `taskflow` |
| `POSTGRES_USER` | کاربر دیتابیس | `taskflow` |
| `POSTGRES_PASSWORD` | رمز دیتابیس | `taskflow_dev_password` |
| `POSTGRES_HOST` | هاست دیتابیس | `localhost` |
| `POSTGRES_PORT` | پورت دیتابیس | `5432` |

</div>

### یک نکته درباره‌ی `POSTGRES_HOST` در <span dir='ltr'>`.env`</span>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`.env.example`</span> مقدار `POSTGRES_HOST=localhost` رو داره. این مقدار وقتی درسته که جنگو رو **مستقیم روی سیستم خودت** (بیرون از داکر) اجرا می‌کنی و PostgreSQL روی `localhost` خودت در دسترسه.</span>

</div>

وقتی از `docker compose` استفاده می‌کنی، سرویس `web` این متغیر رو override می‌کنه و از `POSTGRES_HOST=db` استفاده می‌کنه؛ `db` نام سرویس PostgreSQL توی Compose است. لازم نیست چیزی رو تغییر بدی — این override خودکار اتفاق می‌افته.

**فایل <span dir='ltr'>`.env`</span> را هرگز کامیت نکن.** حاوی اطلاعات محرمانه‌ست. فقط <span dir='ltr'>`.env.example`</span> باید توی ریپو باشه.

---

## جزئیات Docker

<div align='right' dir='rtl'>

### <span dir='rtl'>Dockerfile</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• ایمیج پایه: `python:3.12-slim`</span> <br>
<span dir='rtl'>• کاربر non-root: `appuser`</span> <br>
<span dir='rtl'>• وابستگی‌ها (`requirements.txt`) **قبل از** سورس کد کپی و نصب می‌شن. این کار باعث می‌شه Docker لایه‌ی `pip install` رو کش کنه و با هر تغییر کد، پکیج‌ها دوباره نصب نشن.</span> <br>
<span dir='rtl'>• `entrypoint.sh` مایگریشن‌ها رو قبل از بالا آمدن سرور اجرا می‌کنه.</span> <br>
<span dir='rtl'>• `runserver` برای توسعه استفاده می‌شه. در محیط عملیاتی با `gunicorn config.wsgi:application` جایگزین کن.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>compose.yaml</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• سرویس `db` با volume نام‌دار و `pg_isready` healthcheck</span> <br>
<span dir='rtl'>• سرویس `web` از Dockerfile محلی ساخته می‌شه</span> <br>
<span dir='rtl'>• `depends_on: condition: service_healthy` اطمینان می‌ده PostgreSQL قبل از شروع جنگو کاملاً آماده‌ست</span> <br>
<span dir='rtl'>• پورت به `127.0.0.1:8000` bind شده تا API فقط از خود سیستم در دسترس باشه</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>entrypoint.sh</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• مایگریشن‌های pending را اعمال می‌کند</span> <br>
<span dir='rtl'>• `CMD` تعریف‌شده در Dockerfile را اجرا می‌کند</span>

</div>

---

## دستورات پرکاربرد

```bash
# بازسازی ایمیج و ری‌استارت
docker compose up --build

# دنبال کردن لاگ‌های جنگو
docker compose logs -f web

# باز کردن shell داخل کانتینر
docker compose exec web bash

# اجرای دستورات مدیریتی جنگو
docker compose exec web python manage.py <command>

# باز کردن psql
docker compose exec db psql -U taskflow -d taskflow

# توقف پروژه (volume حفظ می‌شود)
docker compose down

# توقف و حذف volume (هشدار: داده‌ها پاک می‌شود)
docker compose down -v
```

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `runserver` را با `gunicorn config.wsgi:application` جایگزین کن</span> <br>
<span dir='rtl'>• [ ] `DEBUG=False` بگذار</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` را به دامنه‌های واقعی ست کن</span> <br>
<span dir='rtl'>• [ ] از کلید مخفی واقعی استفاده کن (نه مقدار پیش‌فرض placeholder)</span> <br>
<span dir='rtl'>• [ ] `SessionAuthentication` را با `TokenAuthentication` یا JWT جایگزین کن</span> <br>
<span dir='rtl'>• [ ] فایل‌های استاتیک را با Nginx یا Whitenoise سرو کن</span> <br>
<span dir='rtl'>• [ ] برای volume PostgreSQL بکاپ تنظیم کن</span> <br>
<span dir='rtl'>• [ ] پورت منتشر شده را فقط در صورت وجود reverse proxy به `0.0.0.0` bind کن</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۰۹ — داکری‌کردن یک پروژه واقعی جنگو**](../../../fa/09-django-docker/README.md)</span>

</div>

درسنامه‌ی کامل را در لینک بالا ببین — شامل توضیح خط به خط همه‌ی فایل‌های این پروژه.

---

## لایسنس

<p dir='rtl'>
MIT
</p>
