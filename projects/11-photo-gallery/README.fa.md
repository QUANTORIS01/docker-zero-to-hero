<div align='right' dir='rtl'>

[🇬🇧 English](/projects/11-photo-gallery/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>Aurora Gallery — گالری عکس</span>

</div>

> یک گالری عکس زیبا و آماده‌ی محیط عملیاتی با جنگو، که توسط Nginx و Gunicorn و PostgreSQL سرو می‌شود، همه در Docker.

---

## معرفی

<div align='right' dir='rtl'>

<span dir='rtl'>Aurora Gallery یک گالری عکس است که با جنگو ساخته شده. هدفش اینه که یک **راه‌اندازی کامل محیط عملیاتی** برای یک اپ جنگو رو نشون بده:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **Gunicorn** به‌عنوان وب‌سرور پایتون (به‌جای `runserver`)</span> <br>
<span dir='rtl'>• **Nginx** به‌عنوان Reverse Proxy و سروکننده‌ی فایل‌های ثابت</span> <br>
<span dir='rtl'>• **PostgreSQL** برای ذخیره‌سازی</span> <br>
<span dir='rtl'>• **Docker Compose** برای بالا آوردن همه با یک دستور</span>

</div>

این پروژه، پیاده‌سازی مرجع **درس ۱۱** دوره‌ی «داکر از صفر تا صد» است.

برخلاف دو پروژه‌ی قبلی (TaskFlow و URL Monitor) که فقط API بودند، این پروژه یک **فرانت‌اند واقعی** داره — یک گالری عکس با تم تاریک، انیمیشن، افکت‌های hover و گرید Masonry. یعنی چیزی برای دیدن، نه فقط JSON برای خوندن.

---

## این پروژه چه مشکلی را حل می‌کند؟

یک پروژه‌ی جنگو که با `runserver` اجرا می‌شه، برای توسعه خوبه، ولی توی محیط عملیاتی سه مشکل داره:

۱. **کنده.** `runserver` تک‌رشته‌ای است و با بیشتر از چند کاربر همزمان، به مشکل می‌خوره.

۲. **ناامنه.** `runserver` به‌طور پیش‌فرض حالت دیباگ رو فعال می‌کنه که جزئیات داخلی رو روی هر خطا نشون می‌ده.

۳. **برای فایل‌های ثابت ساخته نشده.** سرو کردن CSS، JavaScript و عکس‌ها از طریق جنگو یعنی اجرای کد پایتون برای کاری که در اصل «فایل رو بخون و بفرست» است. Nginx این کار رو ۱۰۰ برابر سریع‌تر انجام می‌ده.

راه‌حل: **Nginx** رو جلوی جنگو بذار. Nginx فایل‌های ثابت رو مستقیم سرو می‌کنه و فقط درخواست‌های داینامیک رو به جنگو (که با Gunicorn اجرا می‌شه) پاس می‌ده.

---

## چطور کار می‌کند؟ (به زبان ساده)

هر درخواست اول به Nginx می‌رسه:

```text
کاربر  ─►  Nginx (روی پورت 8080 سیستم)
              │
              ├──► فایل ثابت (CSS، JS)؟   Nginx مستقیم از دیسک می‌دهد.
              │
              ├──► فایل رسانه (عکس)؟      Nginx مستقیم از دیسک می‌دهد.
              │
              └──► هر چیز دیگر؟            Nginx به Gunicorn می‌فرستد،
                                            که جنگو را اجرا می‌کند.
```

چرا این مهمه؟ چون Nginx یک **برنامه‌ی C** است که فایل‌ها رو با تقریباً هیچ سرباری سرو می‌کنه. جنگو یک **برنامه‌ی پایتون** است که برای هر درخواست، کل فریم‌ورک رو بالا می‌آره. برای فایل‌های ثابت، این تفاوت خیلی زیاده.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• گالری زیبا با تم تاریک و گرید Masonry</span> <br>
<span dir='rtl'>• انیمیشن hover روی هر کارت عکس (بزرگ‌شدن، لایه‌ی گرادیانت، بالا آمدن عنوان)</span> <br>
<span dir='rtl'>• هدر شیشه‌ای (افکت بلور یخ‌زده)</span> <br>
<span dir='rtl'>• فونت‌های Google (Playfair Display + Inter)</span> <br>
<span dir='rtl'>• Responsive (۳ ستون دسکتاپ، ۲ ستون تبلت، ۱ ستون موبایل)</span> <br>
<span dir='rtl'>• پنل ادمین جنگو با پیش‌نمایش بندانگشتی عکس</span> <br>
<span dir='rtl'>• صفحه‌ی جزئیات برای هر عکس (عکس، عنوان، عکاس، محل، تاریخ)</span> <br>
<span dir='rtl'>• Endpoint سلامت برای Docker و probe</span> <br>
<span dir='rtl'>• اجرای خودکار مایگریشن و `collectstatic` هنگام شروع کانتینر</span> <br>
<span dir='rtl'>• کاربر non-root داخل کانتینر، با دسترسی درست به volumeها</span>

</div>

---

## پشته‌ی فناوری

<div align='center' dir='rtl'>

| بخش | نسخه |
|-----|------|
| Python | 3.12 |
| Django | 5.1.4 |
| Gunicorn | 23.0.0 |
| Nginx | 1.27 |
| PostgreSQL | 16 |
| psycopg | 3.2.10 |
| Pillow | 11.0.0 |
| django-environ | 0.14.0 |

</div>

---

## شروع سریع

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/11-photo-gallery
```

### ۲. ساخت فایل محیطی

```bash
cp .env.example .env
```

### ۳. ساخت و اجرای همه‌چیز

```bash
docker compose up --build
```

این دستور، Image جنگو رو می‌سازه، PostgreSQL و Nginx رو pull می‌کنه، مایگریشن‌ها و `collectstatic` رو اجرا می‌کنه و هر سه سرویس رو بالا می‌آره.

### ۴. ساخت کاربر ادمین

در یک ترمینال دیگر:

```bash
docker compose exec web python manage.py createsuperuser
```

### ۵. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• گالری: <span dir='ltr'><http://127.0.0.1:8080/></span></span> <br>
<span dir='rtl'>• پنل ادمین: <span dir='ltr'><http://127.0.0.1:8080/admin/></span></span> <br>
<span dir='rtl'>• Health check: <span dir='ltr'><http://127.0.0.1:8080/health/></span></span>

</div>

> **نکته درباره‌ی پورت:** این پروژه از پورت **۸۰۸۰** استفاده می‌کند (نه ۸۰۰۰ یا ۹۰۰۰). پروژه‌های درس ۹ روی ۸۰۰۰ و درس ۱۰ روی ۹۰۰۰ هستند. یکتا بودن پورت‌ها یعنی هر سه پروژه می‌توانند همزمان اجرا شوند.

### ۶. اضافه کردن اولین عکس

<div align='right' dir='rtl'>

<span dir='rtl'>۱. به پنل ادمین لاگین کن.</span> <br>
<span dir='rtl'>۲. روی **Photos** کلیک کن و بعد **ADD PHOTO**.</span> <br>
<span dir='rtl'>۳. عنوان رو پر کن، عکس آپلود کن و ذخیره کن.</span> <br>
<span dir='rtl'>۴. برگرد به صفحه‌ی گالری — عکست اونجاست.</span>

</div>

### ۷. تأیید اینکه Nginx کارش رو انجام می‌ده

<div align='right' dir='rtl'>

<span dir='rtl'>DevTools مرورگر رو باز کن (F12)، برو به تب **Network** و صفحه رو reload کن. روی `style.css` یا هر عکسی که آپلود کردی کلیک کن. توی هدرهای پاسخ، دنبال این بگرد:</span>

</div>

```text
Server: nginx/1.27.x
```

این تأیید می‌کنه که **Nginx** فایل رو سرو کرده، نه جنگو. اگه `gunicorn` توی اون هدر بود، یعنی Nginx کارش رو انجام نمی‌ده.

---

## ساختار پروژه

```text
11-photo-gallery/
├── .dockerignore
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

یک فایل <span dir='ltr'>`.gitignore`</span> در ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین این پروژه فایل جداگانه ندارد.

---

## متغیرهای محیطی

تعریف‌شده در <span dir='ltr'>`.env`</span> (نگاه کن به <span dir='ltr'>`.env.example`</span> برای قالب):

<div align='center' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|-----|---------|
| <span dir='ltr'>`SECRET_KEY` </span>|<span dir='rtl'> کلید مخفی جنگو </span>| — (الزامی) |
| <span dir='ltr'>`DEBUG`</span> |<span dir='rtl'> حالت دیباگ</span> | <span dir='ltr'>`False`</span> |
| <span dir='ltr'>`ALLOWED_HOSTS`</span> |<span dir='rtl'> لیست هاست‌های مجاز، جداشده با کاما </span>| <span dir='ltr'>`localhost,127.0.0.1`</span> |
| <span dir='ltr'>`CSRF_TRUSTED_ORIGINS`</span> |<span dir='rtl'> آدرس‌های مورد اعتماد CSRF، جداشده با کاما </span>| <span dir='ltr'>`http://localhost:8080,http://127.0.0.1:8080` </span>|
| <span dir='ltr'>`POSTGRES_DB` </span>|<span dir='rtl'> نام دیتابیس </span>| <span dir='ltr'>`photogallery`</span> |
| <span dir='ltr'>`POSTGRES_USER` </span>|<span dir='rtl'> کاربر دیتابیس </span>| <span dir='ltr'>`photogallery` </span>|
| <span dir='ltr'>`POSTGRES_PASSWORD` </span>|<span dir='rtl'> رمز دیتابیس </span>| <span dir='ltr'>`photogallery_dev_password` </span>|
| <span dir='ltr'>`POSTGRES_HOST`</span> |<span dir='rtl'> هاست دیتابیس </span>|<span dir='rtl'> `db` (در Docker)</span> |
| <span dir='ltr'>`POSTGRES_PORT`</span> |<span dir='rtl'> پورت دیتابیس </span>| `5432` |

</div>

**نکته درباره‌ی `CSRF_TRUSTED_ORIGINS`:** از جنگو ۴.۰ به بعد، جنگو هدر `Origin` درخواست‌های POST رو بررسی می‌کنه. چون مرورگر `http://127.0.0.1:8080` رو می‌فرسته ولی جنگو (از طریق Nginx) هاست رو `127.0.0.1` می‌بینه، بررسی CSRF شکست می‌خوره. اضافه‌کردن origin به این لیست، به جنگو می‌گه «به درخواست‌هایی که از این آدرس میان اعتماد کن».

**فایل <span dir='ltr'>`.env`</span> را هرگز کامیت نکن.**

---

## سه سرویس داکر

<div align='center' dir='rtl'>

| سرویس | نقش | دستور |
|-------|-----|-------|
| `db` |<span dir='rtl'> دیتابیس PostgreSQL </span>| <span dir='rtl'>(Image پیش‌فرض PostgreSQL) </span>|
| `web` | <span dir='ltr'>Gunicorn + Django </span>| <span dir='ltr'>`gunicorn -c gunicorn.conf.py config.wsgi:application` </span>|
| `nginx` | <span dir='ltr'>Reverse Proxy + static/media </span>|<span dir='rtl'> (entrypoint پیش‌فرض Nginx) </span>|

</div>

### سه volume

<div align='center' dir='rtl'>

| Volume | استفاده‌کننده | چه چیزی نگه می‌داره |
|--------|----------------|----------------------|
| `postgres_data` | `db` | فایل‌های دیتابیس |
| `static_files` |<span dir='rtl'> `web` (می‌نویسه)، `nginx` (می‌خونه) </span>|<span dir='rtl'> خروجی `collectstatic` (CSS) </span>|
| `media_files` |<span dir='rtl'> `web` (می‌نویسه)، `nginx` (می‌خونه)</span> | عکس‌های آپلودی |

</div>

### چرا volume بین `web` و `nginx` مشترکه؟

چون Nginx باید فایل‌هایی رو که جنگو می‌نویسه بخونه. وقتی `collectstatic` داخل `web` اجرا می‌شه، CSSها رو توی <span dir='ltr'>`/app/staticfiles`</span> می‌ذاره. وقتی Nginx اجرا می‌شه، اون‌ها رو از <span dir='ltr'>`/staticfiles`</span> می‌خونه. برای اینکه این کار کنه، هر دو مسیر باید به **همون volume** اشاره کنند.

همین داستان برای عکس‌های آپلودی: `web` اون‌ها رو توی <span dir='ltr'>`/app/media`</span> می‌نویسه، `nginx` از <span dir='ltr'>`/media`</span> می‌خونه.

---

## یک نکته درباره‌ی دسترسی به volumeها

<div align='right' dir='rtl'>

<span dir='rtl'>Docker حجم‌های نام‌دار رو با مالکیت `root` می‌سازه، فارغ از اینکه توی Dockerfile چی تنظیم شده باشه. اگه کانتینر با کاربر non-root اجرا بشه (که یه best practice امنیتی است)، جنگو اجازه‌ی نوشتن توی اون volumeها رو نداره.</span>

</div>

این پروژه با `gosu` حلش می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>۱. کانتینر **با root شروع** می‌شه.</span> <br>
<span dir='rtl'>۲. entrypoint دستور <span dir='ltr'>`chown -R appuser:appuser`</span> رو روی <span dir='ltr'>`/app/staticfiles`</span> و <span dir='ltr'>`/app/media`</span> اجرا می‌کنه.</span> <br>
<span dir='rtl'>۳. entrypoint خودش رو **دوباره با `appuser`** (از طریق `gosu`) اجرا می‌کنه.</span> <br>
<span dir='rtl'>۴. از این به بعد، همه‌چیز <span dir='ltr'>(migrate، collectstatic، gunicorn)</span> با کاربر non-root اجرا می‌شه.</span>

</div>

این رو توی لاگ سرویس `web` می‌بینی:

```text
web-1 | Fixing volume permissions...
web-1 | Applying database migrations...
web-1 | Collecting static files...
web-1 | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
```

---

## جریان درخواست چطور کار می‌کند؟

وقتی مرورگر <span dir='ltr'>`http://127.0.0.1:8080/`</span> رو درخواست می‌ده:

<div align='right' dir='rtl'>

<span dir='rtl'>۱. **Nginx** (در کانتینر `nginx`) درخواست رو روی پورت ۸۰ دریافت می‌کنه.</span> <br>
<span dir='rtl'>۲. مسیر `/` با `/static/` یا `/media/` مطابقت نداره.</span> <br>
<span dir='rtl'>۳. Nginx درخواست رو به `http://web:8000` (Gunicorn، در کانتینر `web`) پاس می‌ده.</span> <br>
<span dir='rtl'>۴. جنگو درخواست رو پردازش می‌کنه، دیتابیس رو برای عکس‌ها می‌پرسه، `photo_list.html` رو رندر می‌کنه و HTML برمی‌گردونه.</span> <br>
<span dir='rtl'>۵. HTML شامل <span dir='ltr'>`<link href="/static/gallery/style.css">`</span> است.</span> <br>
<span dir='rtl'>۶. مرورگر بعدش <span dir='ltr'>`/static/gallery/style.css`</span> رو درخواست می‌ده. این بار با `/static/` مطابقت داره.</span> <br>
<span dir='rtl'>۷. <span dir='ltr'>**Nginx**</span> CSS رو مستقیم سرو می‌کنه، بدون اینکه به جنگو دست بزنه.</span>

</div>

این ارزش اصلی Nginx جلوی جنگوئه: **پروسه‌ی جنگو فقط برای درخواست‌های داینامیک آزاد می‌مونه**.

---

## دستورات پرکاربرد

```bash
# بازسازی و شروع
docker compose up --build

# دیدن وضعیت سرویس‌ها
docker compose ps

# دنبال کردن لاگ‌های جنگو
docker compose logs -f web

# دنبال کردن لاگ‌های Nginx
docker compose logs -f nginx

# باز کردن shell داخل کانتینر جنگو
docker compose exec web bash

# باز کردن shell داخل کانتینر Nginx
docker compose exec nginx sh

# اجرای دستورات مدیریتی جنگو
docker compose exec web python manage.py <command>

# باز کردن psql
docker compose exec db psql -U photogallery -d photogallery

# توقف همه‌چیز (volume حفظ می‌شود)
docker compose down

# توقف و حذف volume (هشدار: همه‌ی داده‌ها پاک می‌شوند)
docker compose down -v
```

---

## عیب‌یابی

### مشکل ۱: CSRF verification failed هنگام لاگین به ادمین

خطا:

```text
Origin checking failed - http://127.0.0.1:8080 does not match any trusted origins.
```

**علت:** از جنگو ۴.۰ به بعد، جنگو هدر `Origin` درخواست‌های POST رو بررسی می‌کنه. وقتی پشت Nginx روی یه پورت غیراستاندارد اجرا می‌شه، جنگو به‌طور پیش‌فرض به اون پورت اعتماد نمی‌کنه.

**راه‌حل:** `CSRF_TRUSTED_ORIGINS` رو به `settings.py` اضافه کن:

```python
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)
```

و به <span dir='ltr'>`.env`</span> اضافه کن:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

همچنین در `nginx.conf` این خط رو:

```nginx
proxy_set_header Host $host;
```

به این تغییر بده:

```nginx
proxy_set_header Host $http_host;
```

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`$host`</span> شماره‌ی پورت رو حذف می‌کنه؛ <span dir='ltr'>`$http_host`</span> نگهش می‌داره. این باعث می‌شه هدر `Host` با `Origin` مرورگر یکی بشه.</span>

</div>

### مشکل ۲: <span dir='ltr'>`PermissionError: [Errno 13] Permission denied: '/app/media/photos'`</span>

**علت:** Docker حجم‌های نام‌دار رو با مالکیت `root` می‌سازه. کاربر <span dir='ltr'>non-root</span> `appuser` داخل کانتینر نمی‌تونه توشون بنویسه.

**راه‌حل:** از `gosu` در entrypoint استفاده کن تا مالکیت volumeها رو قبل از سوییچ کاربر درست کنه. بخش «یک نکته درباره‌ی دسترسی به volumeها» رو ببین.

### مشکل ۳: فایل‌های static خطای 404 می‌دهند

**علت:** `collectstatic` اجرا نشده، یا Nginx به <span dir='ltr'>volume</span> <span dir='ltr'>`static_files`</span> mount نشده.

**بررسی:**

```bash
docker compose logs web | grep collectstatic
docker compose exec nginx ls /staticfiles
```

هر دو باید فایل نشون بدن. اگه یکی خالی بود، یا `entrypoint.sh` دستور `collectstatic` رو اجرا نمی‌کنه، یا volume درست mount نشده.

### مشکل ۴: عکس‌های آپلودی نمایش داده نمی‌شوند

**علت:** شبیه مشکل ۳، ولی برای media.

**بررسی:**

```bash
docker compose exec web ls /app/media/photos
docker compose exec nginx ls /media/photos
```

هر دو باید عکس رو نشون بدن. اگه `web` داره ولی `nginx` نداره، <span dir='ltr'>volume</span> `media_files` در `compose.yaml` درست مشترک نشده.

### مشکل ۵: `port is already allocated`

پورت ۸۰۸۰ روی هاست استفاده می‌شه.

**راه‌حل:** پورت هاست رو در `compose.yaml` عوض کن:

```yaml
nginx:
  ports:
    - "127.0.0.1:8081:80"
```

بعد از `http://127.0.0.1:8081` استفاده کن.

روی ویندوز، اگه پورت توسط سیستم رزرو شده (نه واقعاً توسط یه پروسه استفاده می‌شه)، موقتاً WinNAT رو متوقف کن:

```powershell
net stop winnat
```

کانتینرها رو بالا بیار، بعد:

```powershell
net start winnat
```

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False` بگذار</span> <br>
<span dir='rtl'>• [ ] از `SECRET_KEY` واقعی استفاده کن (نه مقدار پیش‌فرض placeholder)</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` رو به دامنه‌ی واقعی ست کن</span> <br>
<span dir='rtl'>• [ ] `CSRF_TRUSTED_ORIGINS` رو به `https://yourdomain.com` ست کن</span> <br>
<span dir='rtl'>• [ ] از HTTPS استفاده کن (Nginx با گواهی Let's Encrypt)</span> <br>
<span dir='rtl'>• [ ] از سیستم مدیریت Secret واقعی استفاده کن (Vault، AWS Secrets Manager)</span> <br>
<span dir='rtl'>• [ ] تعداد workerهای Gunicorn رو بر اساس هسته‌های CPU زیاد کن</span> <br>
<span dir='rtl'>• [ ] زمان‌بندی Celery beat رو در volume پایدار ذخیره کن (اگه استفاده می‌شه)</span> <br>
<span dir='rtl'>• [ ] جمع‌آوری لاگ‌ها رو تنظیم کن</span> <br>
<span dir='rtl'>• [ ] Rate limiting در Nginx اضافه کن</span> <br>
<span dir='rtl'>• [ ] برای volume `postgres_data` بکاپ تنظیم کن</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۱ — Nginx به‌عنوان Reverse Proxy**](/fa/11-nginx/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
