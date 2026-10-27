<div align='right' dir='rtl'>

[🇬🇧 English](/projects/url-monitor/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>URL Monitor — مانیتور URL</span>

</div>

> یک اپلیکیشن واقعی و آماده‌ی محیط عملیاتی با جنگو که URLها را مانیتور می‌کند، با قدرت Celery، Redis، PostgreSQL و Docker.

---

## این پروژه چیست؟

<div align='right' dir='rtl'>

<span dir='rtl'>URL Monitor یک اپلیکیشن کوچک اما کامل جنگو است که بررسی می‌کند آیا یک لیست URL در دسترس است یا نه، و هر ۳۰ ثانیه نتیجه را ثبت می‌کند. این پروژه، پیاده‌سازی مرجع **درس ۱۰** دوره‌ی «داکر از صفر تا صد» است.</span>

</div>

هدف اصلی این پروژه، آموزش **کارهای پس‌زمینه** و **کارهای زمان‌بندی‌شده** در یک محیط داکری‌شده است، با استفاده از **Celery** و **Redis**. همه‌چیز داخل کانتینر است، پس می‌توانی کل استک را با یک دستور اجرا کنی.

---

## این پروژه چه مشکلی را حل می‌کند؟

فرض کن می‌خواهی از سایت‌هایت مراقبت کنی. هر ۳۰ ثانیه دوست داری بدانی:

<p dir='rtl'>
• آیا سایت بالاست؟ <br>
• چقدر طول کشید تا جواب بدهد؟ <br>
• اگر پایین است، خطا چه بوده؟
</p>

اگر این بررسی را مستقیم داخل ویوی جنگو بنویسی، **سرور وب تو قفل می‌شود** تا وقتی که بررسی تمام شود. با ۱۰۰ کاربر، سرور تحت فشار می‌رود. با ۱۰۰۰ URL، کاملاً از کار می‌افتد.

راه‌حل: بررسی‌ها را از سرور وب بیرون ببر و به یک **کارگر پس‌زمینه** بسپار. Celery دقیقاً همین کار را می‌کند.

---

## چطور کار می‌کند؟ (به زبان ساده)

هر ۳۰ ثانیه، این زنجیره اتفاق می‌افتد:

```text
🕐  Celery Beat
     ساعت زنگ‌دار — هر ۳۰ ثانیه پیام «الان بررسی کن» می‌فرستد.

        ↓

📮  Redis
     صف پیام — پیام را نگه می‌دارد تا کارگر آن را بردارد.

        ↓

👷  Celery Worker
     کارگر — پیام را برمی‌دارد، URLها را چک می‌کند، نتیجه را ذخیره می‌کند.

        ↓

💾  PostgreSQL
     ذخیره‌سازی — نتیجه را ذخیره می‌کند تا بتوانی تاریخچه را ببینی.
```

سه نقش اصلی وجود دارد:

<div align='right' dir='rtl'>

<span dir='rtl'>1. **Celery Beat** — ساعت زنگ‌دار. هر ۳۰ ثانیه می‌گوید «الان بررسی کن».</span> <br>
<span dir='rtl'>2. **Redis** — صندوق پیام. پیام‌ها را نگه می‌دارد تا کارگر بیاید و برشان دارد.</span> <br>
<span dir='rtl'>3. **Celery Worker** — کارگر. پیام را برمی‌دارد، کار واقعی (چک کردن URLها) را انجام می‌دهد، و نتیجه را ذخیره می‌کند.</span>

</div>

**سرور وب جنگو** اصلاً در این زنجیره دخالت ندارد. این همان نکته‌ی اصلی است: سرور وب آزاد می‌ماند تا به کاربران سرویس بدهد.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• پنل ادمین جنگو، ساده و کاربردی</span> <br>
<span dir='rtl'>• REST API برای ساخت، لیست و حذف URLهای مانیتورشده</span> <br>
<span dir='rtl'>• چک خودکار URLها هر ۳۰ ثانیه</span> <br>
<span dir='rtl'>• تاریخچه‌ی کامل هر بررسی (بالا/پایین، زمان پاسخ، کد وضعیت، پیام خطا)</span> <br>
<span dir='rtl'>• Endpoint سلامت برای health check داکر</span> <br>
<span dir='rtl'>• پنج سرویس داکر که با یک فایل `compose.yaml` هماهنگ می‌شوند</span>

</div>

---

## پشته‌ی فناوری

<div align='center' dir='rtl'>

| بخش | نسخه |
|-----|------|
| Python | 3.12 |
| Django | 5.1.4 |
| Django REST Framework | 3.15.2 |
| Celery | 5.4.0 |
| Redis | 7 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| django-environ | 0.14.0 |
| requests | 2.32.3 |

</div>

---

## شروع سریع

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/10-url-monitor
```

### ۲. ساخت فایل محیطی

```bash
cp .env.example .env
```

### ۳. ساخت و اجرای همه‌چیز

```bash
docker compose up --build
```

این دستور، Image جنگو را می‌سازد، PostgreSQL و Redis را pull می‌کند، مایگریشن‌ها را اجرا می‌کند، و هر پنج سرویس را بالا می‌آورد.

### ۴. ساخت کاربر ادمین

در یک ترمینال دیگر:

```bash
docker compose exec web python manage.py createsuperuser
```

### ۵. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• پنل ادمین: <span dir='ltr'><http://127.0.0.1:9000/admin/></span></span> <br>
<span dir='rtl'>• API: <span dir='ltr'><http://127.0.0.1:9000/api/urls/></span></span> <br>
<span dir='rtl'>• Health check: <span dir='ltr'><http://127.0.0.1:9000/health/></span></span>

</div>

> **نکته درباره‌ی پورت:** این پروژه از پورت **۹۰۰۰** استفاده می‌کند، نه ۸۰۰۰ معمول. دلیلش این است که بتواند کنار پروژه‌ی درس ۹ (TaskFlow) که روی ۸۰۰۰ است اجرا شود. این یک رویه‌ی رایج است: به هر پروژه یک پورت جدا می‌دهیم.

### ۶. امتحان کن!

<div align='right' dir='rtl'>

<span dir='rtl'>1. به پنل ادمین برو و یک URL اضافه کن (مثلاً `https://www.google.com`).</span> <br>
<span dir='rtl'>2. یک URL الکی هم اضافه کن (مثلاً `https://does-not-exist-12345.com`).</span> <br>
<span dir='rtl'>3. ۳۰ ثانیه صبر کن.</span> <br>
<span dir='rtl'>4. صفحه‌ی **Check Results** را رفرش کن. باید یک ردیف با وضعیت «UP» و یک ردیف با وضعیت «DOWN» ببینی.</span>

</div>

---

## ساختار پروژه

```text
url-monitor/
├── .dockerignore
├── .env.example
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
│   ├── celery.py
│   ├── settings.py
│   ├── urls.py
│   └── wsgi.py
└── monitor/
    ├── __init__.py
    ├── admin.py
    ├── apps.py
    ├── models.py
    ├── serializers.py
    ├── tasks.py
    ├── urls.py
    ├── views.py
    └── migrations/
        ├── __init__.py
        └── 0001_initial.py
```

---

## متغیرهای محیطی

تعریف‌شده در <span dir='ltr'>`.env`</span> (نگاه کن به <span dir='ltr'>`.env.example`</span> برای قالب):

<div align='center' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|-----|---------|
| `SECRET_KEY` | کلید مخفی جنگو | — (الزامی) |
| `DEBUG` | حالت دیباگ | `False` |
| `ALLOWED_HOSTS` | لیست هاست‌های مجاز، جداشده با کاما | `localhost,127.0.0.1` |
| `POSTGRES_DB` | نام دیتابیس | `urlmonitor` |
| `POSTGRES_USER` | کاربر دیتابیس | `urlmonitor` |
| `POSTGRES_PASSWORD` | رمز دیتابیس | `urlmonitor_dev_password` |
| `POSTGRES_HOST` | هاست دیتابیس | <span dir='rtl'>`db` (در Docker)</span> |
| `POSTGRES_PORT` | پورت دیتابیس | `5432` |
| `REDIS_URL` |<span dir='rtl'> آدرس اتصال Redis </span>|<span dir='rtl'> `redis://redis:6379/0` (در Docker)</span> |

</div>

**فایل <span dir='ltr'>`.env`</span> را هرگز کامیت نکن.** فقط <span dir='ltr'>`.env.example`</span> باید در ریپو باشد.

---

## پنج سرویس داکر

این پروژه **پنج کانتینر جدا** را کنار هم اجرا می‌کند:

<div align='center' dir='rtl'>

| سرویس | نقش | دستور |
|-------|-----|-------|
| `db` |<span dir='rtl'> دیتابیس PostgreSQL </span>|<span dir='rtl'> (Image پیش‌فرض PostgreSQL)</span> |
| `redis` | صف پیام |<span dir='rtl'> (Image پیش‌فرض Redis)</span> |
| `migrate` | مایگریشن‌ها را یک بار اجرا می‌کند و می‌رود | `python manage.py migrate` |
| `web` |<span dir='rtl'> سرور HTTP جنگو </span>| `python manage.py runserver 0.0.0.0:8000` |
| `worker` |<span dir='rtl'> کارگر Celery (تسک‌ها را اجرا می‌کند) </span>| `celery -A config worker` |
| `beat` |<span dir='rtl'> ساعت زنگ‌دار Celery </span>| `celery -A config beat` |

</div>

### چرا `migrate` یک سرویس جداست؟

اگر `web`، `worker` و `beat` هر سه همزمان مایگریشن اجرا کنند، **سه بار همزمان** این کار را می‌کنند و ممکن است با خطای «جدول از قبل وجود دارد» مواجه شوند. به‌جای این، از یک **کانتینر یک‌بارمصرف** (`migrate`) استفاده می‌کنیم که مایگریشن‌ها را انجام می‌دهد، تمام می‌شود و می‌رود. بقیه‌ی سرویس‌ها منتظر می‌مانند تا این تمام شود و بعد شروع می‌کنند.

### چرا `worker` و `beat` جدا هستند؟

کارشان متفاوت است:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`worker`** کار واقعی را انجام می‌دهد (URLها را چک می‌کند).</span> <br>
<span dir='rtl'>• **`beat`** فقط هر ۳۰ ثانیه می‌گوید «وقت چک کردن است».</span>

</div>

اگر یکی از کار بیفتد، دیگری سالم می‌ماند. همچنین می‌توانی چند `worker` موازی برای سرعت بیشتر اجرا کنی، اما فقط یک `beat` لازم است.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | `/health/` | بررسی سلامت |
| GET / POST | `/api/urls/` |<span dir='rtl'> لیست / ایجاد URLهای تحت نظر </span>|
| GET / PUT / PATCH / DELETE | `/api/urls/{id}/` |<span dir='rtl'> جزئیات URL </span>|
| GET | `/api/checks/` | لیست همه‌ی نتایج بررسی (فقط خواندنی) |
| GET | `/api/checks/{id}/` | جزئیات نتیجه‌ی یک بررسی |
| GET | `/admin/` | پنل ادمین جنگو |

</div>

---

## دستورات پرکاربرد

```bash
# بازسازی و شروع
docker compose up --build

# دیدن وضعیت سرویس‌ها
docker compose ps

# دنبال کردن لاگ‌های جنگو
docker compose logs -f web

# دنبال کردن لاگ‌های worker (تماشای اجرای تسک‌ها!)
docker compose logs -f worker

# دنبال کردن لاگ‌های beat (تماشای تیک‌تاک ساعت!)
docker compose logs -f beat

# باز کردن shell داخل کانتینر جنگو
docker compose exec web bash

# باز کردن shell داخل worker
docker compose exec worker bash

# باز کردن psql
docker compose exec db psql -U urlmonitor -d urlmonitor

# توقف همه‌چیز (volume حفظ می‌شود)
docker compose down

# توقف و حذف volume (هشدار: همه‌ی داده‌ها پاک می‌شوند)
docker compose down -v
```

---

## چطور مطمئن شویم همه‌چیز کار می‌کند؟

<div align='right' dir='rtl'>

<span dir='rtl'>1. **آیا سرور وب کار می‌کند؟**</span> <br>
  <span dir='rtl' style='margin-right:32px;'> برو به <span dir='ltr'><http://127.0.0.1:9000/health/></span> — باید `{"status": "ok"}` ببینی.</span> <br>

<span dir='rtl'>2. **آیا دیتابیس کار می‌کند؟**</span> <br>
  <span dir='rtl' style='margin-right:32px;'> برو به <span dir='ltr'><http://127.0.0.1:9000/api/urls/></span> — باید یک لیست خالی ببینی.</span> <br>

<span dir='rtl'>3. **آیا Celery تسک را می‌بیند؟**</span> <br>
   <span dir='rtl' style='margin-right:32px;'><span dir='ltr'>`docker compose logs worker | Select-String "check_all_urls"`</span> را اجرا کن (یا `grep` روی لینوکس/مک) — باید اسم تسک را ببینی.</span> <br>

<span dir='rtl'>4. **آیا کل زنجیره کار می‌کند؟**</span> <br>
  <span dir='rtl' style='margin-right:32px;'> یک URL در پنل ادمین اضافه کن، ۳۰ ثانیه صبر کن، **Check Results** را رفرش کن — یک ردیف جدید باید ظاهر شود.</span> <br>

</div>

---

## عیب‌یابی

### مشکل ۱: `port is already allocated` یا <span dir='ltr'>`bind: An attempt was made to access a socket...`</span>

روی ویندوز، پورت ۸۰۰۰ (و گاهی پورت‌های دیگر) اغلب توسط سیستم رزرو می‌شود. این یک مشکل شناخته‌شده با `WinNAT` است که مدیریت شبکه‌ی WSL2 و Hyper-V را بر عهده دارد.

**راه‌حل الف — تغییر پورت در `compose.yaml`:**

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

بعد از این، در مرورگر از `http://127.0.0.1:9000` استفاده کن.

**راه‌حل ب — آزاد کردن پورت ۸۰۰۰ (فقط ویندوز):**

<div align='right' dir='rtl'>

<span dir='rtl'>PowerShell را **با دسترسی Administrator** باز کن:</span>

</div>

```powershell
net stop winnat
```

در یک ترمینال دیگر، `docker compose up --build` را اجرا کن. وقتی کانتینرها بالا آمدند:

```powershell
net start winnat
```

### مشکل ۲: `worker` تسک را نمی‌بیند

اگر `docker compose logs worker` اسم `monitor.tasks.check_all_urls` را نشان نمی‌دهد، این‌ها را چک کن:

<div align='right' dir='rtl'>

<span dir='rtl'>• `config/__init__.py` باید `from .celery import app as celery_app` داشته باشد.</span> <br>
<span dir='rtl'>• `config/celery.py` باید <span dir='ltr'>`app.autodiscover_tasks()`</span> را صدا بزند.</span> <br>
<span dir='rtl'>• `monitor/tasks.py` باید <span dir='ltr'>`@shared_task`</span> داشته باشد.</span>

</div>

### مشکل ۳: مایگریشن‌ها اجرا نمی‌شوند

اگر `web` بالا می‌آید ولی دیتابیس خالی است:

```bash
docker compose logs migrate
```

اگر `migrate` با خطا خارج شده، همان‌جا نشان داده می‌شود. شایع‌ترین دلیل، مشکل اتصال به دیتابیس است.

### مشکل ۴: تغییر `POSTGRES_PASSWORD` اثری ندارد

<div align='right' dir='rtl'>

<span dir='rtl'>Image رسمی Postgres دیتابیس را **فقط یک بار** مقداردهی اولیه می‌کند. اگر volume `postgres_data` از قبل وجود داشته باشد، رمز تغییر نمی‌کند. برای بازنشانی:</span>

</div>

```bash
docker compose down -v   # هشدار: همه‌ی داده‌ها پاک می‌شوند
docker compose up --build
```

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `runserver` را با `gunicorn config.wsgi:application` جایگزین کن</span> <br>
<span dir='rtl'>• [ ] `DEBUG=False` بگذار</span> <br>
<span dir='rtl'>• [ ] از `SECRET_KEY` واقعی استفاده کن (نه مقدار پیش‌فرض)</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` را به دامنه‌ی واقعی محدود کن</span> <br>
<span dir='rtl'>• [ ] مایگریشن‌ها را در یک مرحله‌ی CI/CD جدا اجرا کن، نه در کانتینر</span> <br>
<span dir='rtl'>• [ ] زمان‌بندی Celery beat را در یک volume پایدار ذخیره کن</span> <br>
<span dir='rtl'>• [ ] به API احراز هویت اضافه کن (token یا JWT)</span> <br>
<span dir='rtl'>• [ ] جمع‌آوری لاگ‌ها را پیکربندی کن</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۰ — Celery + Redis با Docker**](/fa/10-celery-redis/README.md)</span>

</div>

درس‌نامه‌ی کامل را در لینک بالا ببین — شامل توضیح خط به خط همه‌ی فایل‌های این پروژه.

---

## لایسنس

<p dir='rtl'>
MIT
</p>
