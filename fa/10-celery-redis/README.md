<div align='right' dir='rtl'>

[🇬🇧 English](/en/10-celery-redis/README.md)

</div>

# درس ۱۰ — پروژه‌ی دوم: Celery + Redis با داکر

## مقدمه

توی درس ۹ یه اپلیکیشن واقعی جنگو ساختیم و یاد گرفتیم چطور با Docker و Compose بالا بیاریمش. اون پروژه یه وب‌سرور ساده بود: کاربر درخواست می‌فرستاد، جنگو جواب می‌داد.

اما خیلی از برنامه‌های واقعی به چیزی بیشتر از این نیاز دارن. گاهی یه کار طولانیه و نمی‌تونیم کاربر رو معطل کنیم. گاهی باید هر چند ثانیه یه کاری انجام بشه، بدون این‌که کسی درخواستی فرستاده باشه.

مثلاً فرض کن می‌خوایم یه برنامه بسازیم که هر ۳۰ ثانیه چک کنه آیا سایت‌های ما بالان یا نه. اگه این چک رو مستقیم داخل Django انجام بدیم، چه اتفاقی می‌افته؟

<p dir='rtl'>
• سرور وب ما مشغول می‌شه تا چک تموم بشه. <br>
• اگه ۱۰۰ تا سایت داشته باشیم، هر ۳۰ ثانیه سرور قفل می‌شه. <br>
• کاربری که همزمان با این چک، از سایت ما بازدید می‌کنه، معطل می‌مونه.
</p>

برای حل این مشکل، باید کارهای سنگین و زمان‌بندی‌شده رو از سرور وب **جدا** کنیم و به یه بخش دیگه بسپاریم. اینجاست که **Celery** و **Redis** وارد می‌شن.

توی این درس، یه پروژه‌ی جدید به اسم **URL Monitor** می‌سازیم و یاد می‌گیریم چطور با Celery، Redis و Docker، کارهای پس‌زمینه و زمان‌بندی‌شده رو اجرا کنیم.

کدهای کامل پروژه توی مسیر <span dir='ltr'>`projects/url-monitor/`</span> توی ریپو موجوده. توی این درس خط به خط بررسی‌شون می‌کنیم.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'>• توضیح بدی چرا کارهای پس‌زمینه و زمان‌بندی‌شده لازم‌اند</span> <br>
<span dir='rtl'>• توضیح بدی Celery چیه و چطور کار می‌کنه</span> <br>
<span dir='rtl'>• توضیح بدی Redis چیه و چرا بهش نیاز داریم</span> <br>
<span dir='rtl'>• تفاوت worker و beat رو توضیح بدی</span> <br>
<span dir='rtl'>• یک اپ جنگو با چند سرویس بنویسی که همگی از یک Image مشترک استفاده می‌کنن</span> <br>
<span dir='rtl'>• تنظیمات Celery رو در پروژه‌ی جنگو پیکربندی کنی</span> <br>
<span dir='rtl'>• یک تسک زمان‌بندی‌شده واقعی بنویسی</span> <br>
<span dir='rtl'>• پنج سرویس رو با `compose.yaml` هماهنگ کنی</span> <br>
<span dir='rtl'>• پروژه رو اجرا کنی و مطمئن شی زنجیره‌ی کار درست کار می‌کنه</span> <br>
<span dir='rtl'>• مشکلات رایج رو عیب‌یابی کنی</span>

</div>

---

## پیش‌نیازها

<p dir='rtl'>
• همه‌ی چیزهایی که توی درس ۹ یاد گرفتیم (Dockerfile، compose، entrypoint، django-environ) <br>
• آشنایی پایه با جنگو (مدل، ویو، مایگریشن) <br>
• آشنایی پایه با Python
</p>

اگه بعضی از این‌ها یادت نیست، نگران نباش. توی درس همه‌چیز رو دوباره ساده توضیح می‌دیم.

---

## پروژه‌ای که می‌سازیم — URL Monitor

**داستان پروژه:**

فرض کن چند تا سایت داری (یا دوست داری سایت‌های مهم رو تحت نظر داشته باشی). می‌خوای بدونی:

<p dir='rtl'>
• آیا سایت الان بالاست؟ <br>
• چقدر طول می‌کشه تا جواب بده؟ <br>
• اگه پایین بود، چه خطایی داشته؟
</p>

می‌خوایم یه برنامه بسازیم که این کار رو **خودکار، هر ۳۰ ثانیه**، بدون این‌که کسی درخواستی بفرسته، انجام بده.

**امکانات پروژه:**

<p dir='rtl'>
• یه پنل ادمین که باهاش URLها رو اضافه یا حذف کنی <br>
• یه API برای ساخت، دیدن و حذف URLها <br>
• یه تاریخچه که ببینی چه زمانی هر سایت چک شده و نتیجه چی بوده <br>
• چک خودکار هر ۳۰ ثانیه <br>
• یه Endpoint سلامت برای Docker health check
</p>

**پشته‌ی فناوری:**

<p dir='rtl'>
• Python 3.12 <br>
• Django 5.1.4 <br>
• Django REST Framework 3.15.2 <br>
• Celery 5.4.0 <br>
• Redis 7 <br>
• PostgreSQL 16 <br>
• django-environ 0.14.0 <br>
• requests 2.32.3
</p>

---

## اول، یه توضیح ساده از Celery

قبل از این‌که وارد کد بشیم، بذار یه مثال روزمره بزنم تا بفهمی Celery چیه.

**تصور کن یه رستوران داری.**

<div align='right' dir='rtl'>

<span dir='rtl'>• **مشتری** میاد و یه غذا سفارش می‌ده.</span> <br>
<span dir='rtl'>• **گارسون** سفارش رو می‌گیره و می‌ذاره روی یه سینی مخصوص. سینی یه ویژگی داره: هر آشپزی آزاد شد، می‌تونه یه سفارش از روش برداره و بپزه.</span> <br>
<span dir='rtl'>• **آشپز** از سینی سفارش برمی‌داره و غذا رو می‌پزه.</span>

</div>

حالا فرض کن رستوران خیلی شلوغ می‌شه. گارسون نمی‌تونه هم سفارش بگیره هم غذا بپزه. پس آشپز و گارسون کارشون جداست. این یعنی **کارها موازی انجام می‌شن** و مشتری معطل نمی‌مونه.

توی برنامه‌نویسی هم دقیقاً همین‌طوره:

<div align='center' dir='rtl'>

| توی رستوران | توی برنامه‌ی ما | کارش چیه |
|-------------|------------------|----------|
| آشپز | **Celery Worker** |<span dir='rtl'> کار واقعی رو انجام می‌ده (URL رو چک می‌کنه)</span> |
| سینی سفارش‌ها | **Redis** | پیام‌ها رو نگه می‌داره تا آشپز برشون داره |
| زنگ هشدار آشپزخونه | **Celery Beat** | هر ۳۰ ثانیه می‌گه «الان وقت چک کردنه» |
| گارسون | **Django Web** | جواب مشتری رو می‌ده، ولی خودش غذا نمی‌پزه |

</div>

### سه اصطلاح مهم

<div align='right' dir='rtl'>

<span dir='rtl'>• **Celery** یه کتابخونه‌ی پایتونه که بهمون اجازه می‌ده کارها رو «در پس‌زمینه» و «جدا از برنامه‌ی اصلی» اجرا کنیم.</span> <br>
<span dir='rtl'>• **Redis** یه نرم‌افزار جداگانه‌ست که کارش «نگه داشتن پیام‌ها»ست. Celery ازش استفاده می‌کنه که پیام‌ها رو جابه‌جا کنه. این نقش رو به انگلیسی **Broker** (یعنی «واسطه») یا **Queue** (یعنی «صف») می‌گن.</span> <br>
<span dir='rtl'>• **Celery Worker** یه برنامه‌ی جداست که به Redis وصل می‌شه، پیام‌ها رو می‌گیره و اجرا می‌کنه.</span> <br>
<span dir='rtl'>• **Celery Beat** هم یه برنامه‌ی جداست که به‌طور زمان‌بندی‌شده پیام می‌فرسته. مثلاً «هر ۳۰ ثانیه، این کار رو بکن».</span>

</div>

### چرا این جداسازی مهمه؟

<p dir='rtl'>
• اگه یه Worker کرش کنه، سایت اصلی ما سالم می‌مونه. <br>
• می‌تونیم چند تا Worker موازی بالا بیاریم تا کارها سریع‌تر انجام بشن. <br>
• سرور وب ما آزاده که به کاربرهای دیگه جواب بده.
</p>

---

## چطور پروژه کار می‌کنه؟ (به زبان ساده)

هر ۳۰ ثانیه، این زنجیره اتفاق می‌افته:

```text
🕐  Celery Beat — ساعت زنگ‌دار
     هر ۳۰ ثانیه پیام «الان بررسی کن» می‌فرستد.

        ↓

📮  Redis — صندوق پیام
     پیام را نگه می‌دارد تا کارگر آن را بردارد.

        ↓

👷  Celery Worker — کارگر
     پیام را برمی‌دارد، URLها را چک می‌کند، نتیجه را ذخیره می‌کند.

        ↓

💾  PostgreSQL — ذخیره‌سازی
     نتیجه را نگه می‌دارد تا بتوانی تاریخچه را ببینی.
```

**نکته‌ی مهم:** سرور Django اصلاً توی این زنجیره نیست. سرور Django فقط وظیفه داره به کاربرهایی که از سایت بازدید می‌کنن جواب بده. کارهای چک کردن، جدا از این جریان انجام می‌شن.

---

## ساختار پوشه

ساختار پروژه:

```text
url-monitor/
├── .dockerignore
├── .env
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

نکته: یه فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو داریم که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین توی این پروژه فایل جداگانه نداریم.

---

## قدم ۱ — وابستگی‌ها

فایل `requirements.txt`:

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
celery==5.4.0
redis==5.2.1
requests==2.32.3
```

سه تا پکیج جدید نسبت به درس ۹ اضافه شده:

<div align='right' dir='rtl'>

<span dir='rtl'>• **celery** — کتابخونه‌ی اصلی که کارهای پس‌زمینه و زمان‌بندی‌شده رو ممکن می‌کنه.</span> <br>
<span dir='rtl'>• **redis** — کلاینت پایتون برای Redis (Redis یه نرم‌افزار جداست که توی Docker بالا میاد، ولی پایتون برای حرف زدن با اون به این پکیج نیاز داره).</span> <br>
<span dir='rtl'>• **requests** — کتابخونه‌ای برای فرستادن درخواست HTTP. ما ازش استفاده می‌کنیم که URL موردنظر رو چک کنیم (مثل وقتی که مرورگر یه آدرس رو باز می‌کنه).</span>

</div>

---

## قدم ۲ — تنظیمات Celery

<div align='right' dir='rtl'>

### `config/celery.py`

</div>

این فایل، مغز Celery پروژه‌ست. جنگو به‌تنهایی Celery رو نمی‌شناسه، باید بهش معرفی کنیم.

```python
"""
Celery setup for URL Monitor.

This module creates the Celery app and tells it:
- Where the Django settings live
- Which broker to use (Redis)
- What periodic tasks to run on a schedule
"""

import os

from celery import Celery
from celery.schedules import timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# 'urlmonitor' is just a name for this Celery app. It doesn't have to match anything.
app = Celery('urlmonitor')

# Read all CELERY_* settings from Django settings.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Tell Celery to look for tasks in files named `tasks.py` inside every installed app.
app.autodiscover_tasks()


# --------------------------------------------------------------------
# Periodic tasks (the schedule that Celery Beat reads)
# --------------------------------------------------------------------

app.conf.beat_schedule = {
    'check-all-urls-every-30-seconds': {
        'task': 'monitor.tasks.check_all_urls',
        'schedule': timedelta(seconds=30),
    },
}
```

### خط به خط:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`os.environ.setdefault(...)`**</span> — به Celery می‌گیم تنظیمات جنگو رو از `config.settings` بخون.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`app = Celery('urlmonitor')`**</span> — یه نمونه از Celery می‌سازیم. اسمش فقط برای شناسایی توی لاگ‌هاست.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`app.config_from_object('django.conf:settings', namespace='CELERY')`**</span> — به Celery می‌گیم «برو توی تنظیمات جنگو، هر چی با پیشوند <span dir='ltr'>`CELERY_`</span> شروع شد رو بخون و به عنوان تنظیمات خودت در نظر بگیر».</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`app.autodiscover_tasks()`**</span> — به Celery می‌گیم «توی هر اپی که نصب شده، اگه فایلی به اسم `tasks.py` بود، تسک‌های داخلش رو پیدا کن».</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`app.conf.beat_schedule`**</span> — این زمان‌بندی ماست. یعنی «هر ۳۰ ثانیه، تسک `monitor.tasks.check_all_urls` رو اجرا کن».</span>

</div>

نکته‌ی ظریف: `timedelta` رو از `celery.schedules` ایمپورت کردیم، نه از `datetime`. این‌ها با هم فرق دارن. اگه از `datetime` استفاده کنی، Celery خطا می‌ده.

<div align='right' dir='rtl'>

### `config/__init__.py`

</div>

فایل رو باز کن و این رو بذار داخلش:

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

این یه ترفند مهمه. وقتی Django شروع می‌کنه، اولین کاری که می‌کنه اینه که `config/__init__.py` رو اجرا کنه. با این کد، Celery هم قبل از هر کار دیگه‌ای آماده می‌شه. بدون این خط، worker و beat ممکنه اجرا نشن.

### تنظیمات Celery در `config/settings.py`

به آخر فایل `settings.py` این بلاک رو اضافه کن:

```python
# --------------------------------------------------------------------
# Celery
# --------------------------------------------------------------------

CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60
```

توضیح هر خط:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`CELERY_BROKER_URL`** — آدرس Redis که Celery ازش به‌عنوان صف استفاده می‌کنه.</span> <br>
<span dir='rtl'>• **`CELERY_RESULT_BACKEND`** — آدرس Redis که نتیجه‌ی هر تسک توش ذخیره می‌شه.</span> <br>
<span dir='rtl'>• **`CELERY_TIMEZONE`** — منطقه‌ی زمانی.</span> <br>
<span dir='rtl'>• **`CELERY_TASK_TRACK_STARTED`** — یعنی Celery به ما گزارش بده که «این تسک شروع شد».</span> <br>
<span dir='rtl'>• **`CELERY_TASK_TIME_LIMIT = 60`** — هر تسک حداکثر ۶۰ ثانیه فرصت داره. اگه بیشتر طول بکشه، Celery متوقفش می‌کنه. این یه سپر امنیتی مهمه تا یه تسک مشکل‌دار کل worker رو قفل نکنه.</span>

</div>

---

## قدم ۳ — مدل‌ها

### مدل چیه؟ (یادآوری ساده)

مدل، یه کلاس پایتونه که **معادل یه جدول توی دیتابیس**ه. جنگو از روی این کلاس‌ها، جدول‌ها رو می‌سازه. لازم نیست SQL بنویسیم.

### فایل `monitor/models.py`

```python
from django.db import models


class MonitoredURL(models.Model):
    """A single URL that we want to monitor."""

    name = models.CharField(max_length=100, help_text="A friendly name, like 'My Blog'")
    url = models.URLField(help_text="The full URL, like https://example.com")
    is_active = models.BooleanField(default=True, help_text="If false, this URL is skipped")
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['name']

    def __str__(self) -> str:
        return f"{self.name} ({self.url})"


class CheckResult(models.Model):
    """The result of a single health check for one URL."""

    monitored_url = models.ForeignKey(
        MonitoredURL,
        on_delete=models.CASCADE,
        related_name='checks',
    )
    is_up = models.BooleanField()
    status_code = models.IntegerField(null=True, blank=True)
    response_time_ms = models.IntegerField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    checked_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-checked_at']
        indexes = [
            models.Index(fields=['monitored_url', 'checked_at']),
        ]

    def __str__(self) -> str:
        state = "UP" if self.is_up else "DOWN"
        return f"{self.monitored_url.name} — {state} at {self.checked_at}"
```

### هر فیلد چیه؟

**جدول `MonitoredURL`** (URLهایی که تحت نظرن):

<div align='center' dir='rtl'>

| فیلد | معنی |
|------|-------|
| `name` |<span dir='rtl'> اسم دلخواه. مثلاً «وبلاگ من». حداکثر ۱۰۰ کاراکتر.</span> |
| `url` |<span dir='rtl'> آدرس کامل. جنگو خودش چک می‌کنه که آدرس معتبر باشه.</span> |
| `is_active` |<span dir='rtl'> `True` یا `False`. اگه `False` بشه، تسک این URL رو نادیده می‌گیره.</span> |
| `created_at` |<span dir='rtl'> تاریخ ساخت. `auto_now_add=True` یعنی «فقط یه بار، همون اول، ثبت کن».</span> |

</div>

**جدول `CheckResult`** (نتیجه‌ی هر بررسی):

<div align='center' dir='rtl'>

| فیلد | معنی |
|------|-------|
| `monitored_url` |<span dir='rtl'> کلید خارجی — یعنی این نتیجه به کدوم URL مربوطه.</span> |
| `is_up` |<span dir='rtl'> آیا سایت بالاست؟ `True` یا `False`.</span> |
| `status_code` |<span dir='rtl'> کد پاسخ HTTP (مثلاً ۲۰۰، ۴۰۴، ۵۰۰). اگه به سرور نرسیدیم، `null` می‌شه. </span>|
| `response_time_ms` |<span dir='rtl'> چقدر طول کشید تا پاسخ بیاد، به میلی‌ثانیه.</span> |
| `error_message` |<span dir='rtl'> اگه خطایی رخ داد، متن خطا. </span>|
| `checked_at` |<span dir='rtl'> زمان چک. خودکار ثبت می‌شه.</span> |

</div>

نکته‌ی `indexes`: یه ایندکس روی `(monitored_url, checked_at)` ساختیم. ایندکس مثل فهرست انتهای کتابه — بدون اون، برای پیدا کردن یه چیز خاص باید کل جدول رو بگردیم. با ایندکس، پیدا کردن خیلی سریع‌تر می‌شه.

---

## قدم ۴ — تسک Celery

### تسک چیه؟

**تسک** یه فانکشن پایتونه که Celery می‌تونه در پس‌زمینه اجراش کنه. یعنی وقتی Django داره به کاربر جواب می‌ده، Celery هم می‌تونه همزمان یه تسک رو جدا اجرا کنه.

### فایل `monitor/tasks.py`

```python
"""
Celery tasks for URL Monitor.

The only task right now is `check_all_urls`, which:
- Reads every active MonitoredURL from the database
- Sends an HTTP GET request to each one
- Records the result (up/down, response time, error) in CheckResult

Celery Beat calls this task every 30 seconds (see config/celery.py).
"""

import time

import requests
from celery import shared_task
from requests.exceptions import RequestException

from .models import CheckResult, MonitoredURL


REQUEST_TIMEOUT = 10


@shared_task
def check_all_urls():
    """Check every active URL once and save the results."""
    urls = MonitoredURL.objects.filter(is_active=True)
    checked_count = 0

    for monitored in urls:
        _check_single_url(monitored)
        checked_count += 1

    return f"Checked {checked_count} URL(s)"


def _check_single_url(monitored: MonitoredURL) -> None:
    """Check one URL and save the result."""
    start = time.perf_counter()

    try:
        response = requests.get(monitored.url, timeout=REQUEST_TIMEOUT)
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        is_up = 200 <= response.status_code < 400

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=is_up,
            status_code=response.status_code,
            response_time_ms=elapsed_ms,
            error_message='' if is_up else f"HTTP {response.status_code}",
        )

    except RequestException as exc:
        elapsed_ms = int((time.perf_counter() - start) * 1000)

        CheckResult.objects.create(
            monitored_url=monitored,
            is_up=False,
            status_code=None,
            response_time_ms=elapsed_ms,
            error_message=str(exc)[:500],
        )
```

### خط به خط چی داره اتفاق می‌افته؟

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`@shared_task`**</span> — یه «دکوراتور» (یه چیزی که بالای یه فانکشن می‌نویسن و رفتارش رو تغییر می‌ده). این دکوراتور به Celery می‌گه: «این فانکشن یه تسک Celery هست».</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`MonitoredURL.objects.filter(is_active=True)`**</span> — از دیتابیس، همه‌ی URLهایی که `is_active=True` هستن رو می‌گیره. `objects.filter` معادل <span dir='ltr'>`SELECT * FROM ... WHERE ...`</span> توی SQLه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`_check_single_url(monitored)`**</span> — برای هر URL، یه فانکشن داخلی صدا می‌زنیم که کار اصلی رو انجام بده. اون `_` اول اسمش یه قرارداد پایتونه که می‌گه «این تابع داخلیه، از بیرون صدا نزن».</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`time.perf_counter()`**</span> — یه ساعت خیلی دقیق. دو بار صداش می‌زنیم: قبل از `requests.get` و بعدش. تفاضل این دو، زمان دقیق پاسخ رو می‌ده.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`requests.get(...)`**</span> — یه درخواست HTTP GET به اون URL می‌فرسته (مثل وقتی که یه صفحه‌ی وب رو توی مرورگر باز می‌کنی). `timeout=10` یعنی «اگه ۱۰ ثانیه گذشت و جوابی نیومد، بی‌خیال شو». **این خیلی مهمه.** بدون `timeout`، اگه یه سایت جواب نده، تسک برای همیشه معلق می‌مونه و worker رو قفل می‌کنه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`200 <= response.status_code <= 400`**</span> — کدهای ۲۰۰ تا ۳۹۹ یعنی «موفق»:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `200` = OK</span> <br>
<span dir='rtl'>• `301` = Redirect (صفحه به یه جای دیگه منتقل شده)</span> <br>
<span dir='rtl'>• `404` = Not Found (پیدا نشد — یعنی سایت بالاست ولی این صفحه وجود نداره)</span> <br>
<span dir='rtl'>• `500` = Internal Server Error (سرور مشکل داره)</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`except RequestException`** — اگه `requests.get` خطا داد (مثلاً اینترنت قطع بود، یا سرور جواب نداد)، این بخش اجرا می‌شه.</span>

</div>

---

## قدم ۵ — API

### سریالایزر (`monitor/serializers.py`)

سریالایزر یه مترجمه: شیء پایتون رو به JSON (برای فرستادن به کاربر) و JSON رو به شیء پایتون (برای ذخیره توی دیتابیس) تبدیل می‌کنه.

```python
from rest_framework import serializers

from .models import CheckResult, MonitoredURL


class MonitoredURLSerializer(serializers.ModelSerializer):
    class Meta:
        model = MonitoredURL
        fields = ['id', 'name', 'url', 'is_active', 'created_at']
        read_only_fields = ['id', 'created_at']


class CheckResultSerializer(serializers.ModelSerializer):
    url_name = serializers.ReadOnlyField(source='monitored_url.name')

    class Meta:
        model = CheckResult
        fields = [
            'id',
            'monitored_url',
            'url_name',
            'is_up',
            'status_code',
            'response_time_ms',
            'error_message',
            'checked_at',
        ]
        read_only_fields = fields
```

نکات مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`ModelSerializer`** — یه نوع سریالایزر که از روی مدل، فیلدها رو خودکار می‌سازه.</span> <br>
<span dir='rtl'>• **`read_only_fields`** — یعنی این فیلدها فقط خونده می‌شن، کاربر نمی‌تونه خودش پرشون کنه.</span> <br>
<span dir='rtl'>• **`url_name`** — یه فیلد اضافیه که توی دیتابیس نیست. به‌جای این‌که فقط `id` اون URL رو برگردونیم، اسمش رو هم برمی‌گردونیم تا خروجی خواناتر باشه.</span>

</div>

### ویوها (`monitor/views.py`)

ویو، کدی است که وقتی کاربر یه URL خاص رو صدا می‌زنه، اجرا می‌شه.

```python
from rest_framework import viewsets

from .models import CheckResult, MonitoredURL
from .serializers import CheckResultSerializer, MonitoredURLSerializer


class MonitoredURLViewSet(viewsets.ModelViewSet):
    queryset = MonitoredURL.objects.all()
    serializer_class = MonitoredURLSerializer


class CheckResultViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = CheckResult.objects.select_related('monitored_url').all()
    serializer_class = CheckResultSerializer
```

<div align='right' dir='rtl'>

<span dir='rtl'>• **`ModelViewSet`** — یه کلاس آماده‌ست که هفت عملیات رایج (لیست، ساخت، دیدن یکی، ویرایش، حذف) رو خودکار می‌سازه.</span> <br>
<span dir='rtl'>• **`ReadOnlyModelViewSet`** — همون، ولی فقط دو تا عملیات: لیست و دیدن یکی. برای `CheckResult` منطقیه چون کاربر نباید بتونه نتیجه رو خودش بسازه (فقط Celery می‌سازه).</span> <br>
<span dir='rtl'>• **`select_related('monitored_url')`** — وقتی می‌خوایم لیست نتایج رو برگردونیم، برای هر نتیجه نیاز داریم اسم URL رو هم داشته باشیم. بدون `select_related`، برای هر نتیجه یه کوئری جدا به دیتابیس می‌رفت. با `select_related`، همه‌چیز توی یه کوئری انجام می‌شه.</span>

</div>

### مسیرها (`monitor/urls.py`)

```python
from rest_framework.routers import DefaultRouter

from .views import CheckResultViewSet, MonitoredURLViewSet

router = DefaultRouter()
router.register(r'urls', MonitoredURLViewSet, basename='url')
router.register(r'checks', CheckResultViewSet, basename='check')

urlpatterns = router.urls
```

<div align='right' dir='rtl'>

<span dir='rtl'>`DefaultRouter` یه چیز آماده‌ست که کار مسیریابی رو خودکار می‌کنه. به‌جای این‌که دستی بنویسیم `/api/urls/`، `/api/urls/1/` و...، فقط می‌گیم <span dir='ltr'>`router.register(...)`</span> و DRF همه‌ی مسیرها رو می‌سازه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`config/urls.py`</span>

</div>

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Lightweight endpoint for Docker healthchecks."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('monitor.urls')),
    path('health/', health_check),
]
```

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>Endpoint</span> `/health/` برای این خوبه که Docker یا Kubernetes یا هر ابزار دیگه‌ای بتونه چک کنه سرویس واقعاً آماده‌ست یا نه.</span>

</div>

### ادمین (`monitor/admin.py`)

```python
from django.contrib import admin

from .models import CheckResult, MonitoredURL


@admin.register(MonitoredURL)
class MonitoredURLAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'url', 'is_active', 'created_at')
    list_filter = ('is_active',)
    search_fields = ('name', 'url')


@admin.register(CheckResult)
class CheckResultAdmin(admin.ModelAdmin):
    list_display = ('id', 'monitored_url', 'is_up', 'status_code', 'response_time_ms', 'checked_at')
    list_filter = ('is_up', 'monitored_url')
    search_fields = ('monitored_url__name', 'monitored_url__url')
    date_hierarchy = 'checked_at'
```

این تنظیمات باعث می‌شن پنل ادمین خواناتر بشه:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`list_display`** — چه ستون‌هایی توی لیست نشون داده بشه</span> <br>
<span dir='rtl'>• **`list_filter`** — فیلترهای کنار صفحه</span> <br>
<span dir='rtl'>• **`search_fields`** — چیزی که بشه باهاش جستجو کرد</span> <br>
<span dir='rtl'>• **`date_hierarchy`** — نوار فیلتر تاریخ</span>

</div>

---

## قدم ۶ — Dockerfile

فایل `Dockerfile`:

```dockerfile
FROM python:3.12-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1

WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .

RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

این تقریباً همون `Dockerfile` درس ۹ است. یه نکته‌ی مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>**`CMD` فقط `runserver` هست** — چون سرویس `web` این رو اجرا می‌کنه. سرویس‌های `worker` و `beat` از همون Image استفاده می‌کنن، ولی توی `compose.yaml` با <span dir='ltr'>`command:`</span> دستورشون رو override می‌کنیم.</span>

</div>

یعنی یه Image، چند دستور مختلف. این یه الگوی مهمه.

---

## قدم ۷ — entrypoint.sh

```sh
#!/bin/sh
set -e

echo "Starting: $*"
exec "$@"
```

خط به خط:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`#!/bin/sh`**</span> — می‌گه این فایل رو با shell لینوکس اجرا کن.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`set -e`**</span> — اگه هر دستوری fail کرد، فوراً متوقف شو.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`echo "Starting: $*"`**</span> — یه پیام چاپ می‌کنه که چه دستوری داره اجرا می‌شه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`exec "$@"`**</span> — **مهم‌ترین خط.** `exec` جایگزین shell می‌شه با دستوری که اومده. این کار باعث می‌شه پروسه‌ی اصلی (مثلاً `runserver` یا `celery`) بشه PID 1 داخل کانتینر، و سیگنال‌های `docker stop` درست بهش برسه.</span>

</div>

### چرا migrate رو از entrypoint حذف کردیم؟

توی درس ۹، `entrypoint.sh` مایگریشن هم اجرا می‌کرد. اما توی این پروژه، سه سرویس (`web`، `worker`، `beat`) از یه Image مشترک استفاده می‌کنن. اگه هر سه‌شون مایگریشن اجرا کنن، به مشکل می‌خوریم (سه تا پروسه همزمان می‌خوان جدول‌ها رو بسازن).

به‌جاش، یه سرویس جدا به اسم `migrate` ساختیم که فقط اون مایگریشن رو انجام می‌ده. توی `compose.yaml` بقیه سرویس‌ها منتظر می‌مونن تا اون تموم بشه.

---

## قدم ۸ — compose.yaml با شش سرویس

این مهم‌ترین قدم این درسه. یاد بگیریم چطور چند سرویس رو با هم هماهنگ کنیم.

فایل `compose.yaml`:

```yaml
services:
  # ----------------------------------------------------------------
  # 1. PostgreSQL — the database
  # ----------------------------------------------------------------
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-urlmonitor}
      POSTGRES_USER: ${POSTGRES_USER:-urlmonitor}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-urlmonitor_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-urlmonitor} -d ${POSTGRES_DB:-urlmonitor}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 2. Redis — the message queue for Celery
  # ----------------------------------------------------------------
  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 3. migrate — runs database migrations once, then exits
  # ----------------------------------------------------------------
  migrate:
    build: .
    command: python manage.py migrate --noinput
    environment: &django_env
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      POSTGRES_DB: ${POSTGRES_DB:-urlmonitor}
      POSTGRES_USER: ${POSTGRES_USER:-urlmonitor}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-urlmonitor_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy

  # ----------------------------------------------------------------
  # 4. web — the Django HTTP server
  # ----------------------------------------------------------------
  web:
    build: .
    environment: *django_env
    ports:
      - "127.0.0.1:9000:8000"
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 5. worker — Celery worker that runs tasks
  # ----------------------------------------------------------------
  worker:
    build: .
    command: celery -A config worker --loglevel=info
    environment: *django_env
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  # ----------------------------------------------------------------
  # 6. beat — Celery beat that schedules tasks
  # ----------------------------------------------------------------
  beat:
    build: .
    command: celery -A config beat --loglevel=info --schedule=/tmp/celerybeat-schedule
    environment: *django_env
    depends_on:
      redis:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### بیایید با هم بررسی کنیم

**چرا شش سرویس و نه پنج؟**

توی README ممکنه خونده باشی «پنج سرویس»، ولی دقیق‌تر که نگاه کنیم شش سرویس داریم. یکی از این شش‌تا (`migrate`) یه کار انجام می‌ده و می‌ره، پنج تای دیگه دائمی‌اند. برای همین بعضی وقتا می‌گن «پنج سرویس دائمی + یه سرویس migrate».

### سرویس `db` (دیتابیس)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`image: postgres:16`**</span> — از Image آماده استفاده می‌کنیم.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`volumes: postgres_data:/var/lib/postgresql/data`**</span> — داده‌ها رو توی یه volume ذخیره می‌کنیم. بدون این، اگه کانتینر رو حذف کنی، همه‌ی داده‌ها می‌رن.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`healthcheck`**</span> — Docker هر ۵ ثانیه `pg_isready` رو اجرا می‌کنه. این یه دستور خود PostgreSQLه که چک می‌کنه «آماده‌ی پذیرش اتصالم یا نه». بدون این، Docker فقط می‌فهمه «کانتینر روشنه» ولی نمی‌فهمه «دیتابیس آماده‌ست».</span> <br>

</div>

### سرویس `redis` (صف پیام)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`image: redis:7-alpine`**</span> — Redis نسخه ۷، روی Alpine (کوچیک و سبک).</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`healthcheck`**</span> — دستور `redis-cli ping` به Redis وصل می‌شه و می‌گه «ping». اگه Redis سالم باشه، جواب `PONG` می‌ده.</span> <br>

</div>

### سرویس `migrate` (مایگریشن یک‌باره)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`command: python manage.py migrate --noinput`**</span> — دستور `CMD` توی Dockerfile رو override می‌کنه. به‌جای <span dir='ltr'>`runserver`</span>، `migrate` رو اجرا می‌کنه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`&django_env`**</span> — این یه **نکته‌ی YAML**ه. علامت `&` یعنی «این بلاک رو با یه اسم ذخیره کن». بعداً با <span dir='ltr'>`*django_env`</span> می‌تونیم همون بلاک رو دوباره استفاده کنیم، بدون تکرار.</span> <br>
<span dir='rtl'>• **بدون <span dir='ltr'>`restart:`</span>** — این سرویس یه کار می‌کنه و می‌ره. نمی‌خوایم دوباره بالا بیاد.</span> <br>

</div>

### سرویس `web` (جنگو)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`ports: "127.0.0.1:9000:8000"`**</span> — پورت ۸۰۰۰ داخل کانتینر رو به پورت ۹۰۰۰ روی `127.0.0.1` (فقط از خود سیستم) نقشه می‌کنیم.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`depends_on: migrate: condition: service_completed_successfully`**</span> — **این خط طلاییه!** یعنی «صبر کن تا سرویس `migrate` با موفقیت تموم بشه، بعد شروع کن». این تضمین می‌کنه جدول‌ها ساخته شدن.</span> <br>

</div>

### سرویس `worker` (کارگر Celery)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`command: celery -A config worker --loglevel=info`**</span> — `CMD` توی Dockerfile رو override می‌کنه. به‌جای <span dir='ltr'>`runserver`</span>، `celery worker` رو اجرا می‌کنه.</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ <span dir='ltr'>**`-A config`**</span> — می‌گه «Celery app رو از `config/celery.py` بخون».</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ <span dir='ltr'>**`worker`**</span> — یعنی «حالت کارگر».</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ <span dir='ltr'>**`--loglevel=info`**</span> — همه‌ی لاگ‌ها رو نشون بده.</span> <br>

</div>

### سرویس `beat` (ساعت زنگ‌دار)

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`command: celery -A config beat --loglevel=info --schedule=/tmp/celerybeat-schedule`**</span> — یعنی «حالت ساعت».</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`--schedule=/tmp/celerybeat-schedule`**</span> — Celery beat یه فایل نیاز داره که توش «آخرین باری که هر تسک اجرا شد» رو ذخیره کنه. به‌طور پیش‌فرض اسمش `celerybeat-schedule` توی پوشه‌ی جاریه. ما می‌ذاریمش توی <span dir='ltr'>`/tmp`</span> که موقع ری‌استارت کانتینر پاک بشه.</span> <br>

</div>

### خلاصه‌ی روابط

```text
db  ◄─── migrate ◄─── web
                       │
                       ├─── worker
                       │
                       └─── beat
         redis ◄───────┘
```

یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• `db` قبل از `migrate` آماده می‌شه.</span> <br>
<span dir='rtl'>• `migrate` قبل از `web` و `worker` تموم می‌شه.</span> <br>
<span dir='rtl'>• `redis` قبل از `web`، `worker` و `beat` آماده می‌شه.</span>

</div>

---

## قدم ۹ — اجرا

از داخل پوشه‌ی <span dir='ltr'>`projects/url-monitor/`</span>:

```bash
docker compose up --build
```

چه اتفاقی می‌افته:

<div align='right' dir='rtl'>

<span dir='rtl'>1. <span dir='ltr'>Docker Image</span> `web` رو از `Dockerfile` می‌سازه (این Image رو `worker` و `beat` هم استفاده می‌کنن).</span> <br>
<span dir='rtl'>2. <span dir='ltr'>Image</span> `postgres:16` و `redis:7-alpine` رو pull می‌کنه (اگه کش نشده باشن).</span> <br>
<span dir='rtl'>3. <span dir='ltr'>volume</span> `postgres_data` رو می‌سازه.</span> <br>
<span dir='rtl'>4. سرویس `db` رو بالا می‌آره و منتظر healthcheck می‌مونه.</span> <br>
<span dir='rtl'>5. سرویس `redis` رو بالا می‌آره و منتظر healthcheck می‌مونه.</span> <br>
<span dir='rtl'>6. سرویس `migrate` رو اجرا می‌کنه. این سرویس مایگریشن‌ها رو انجام می‌ده و می‌ره.</span> <br>
<span dir='rtl'>7. سرویس `web`، `worker` و `beat` رو بالا می‌آره.</span>

</div>

خروجی باید چیزی شبیه این باشه:

```text
url-monitor-db-1      | ... database system is ready to accept connections
url-monitor-redis-1   | ... Ready to accept connections
url-monitor-migrate-1 | Operations to perform:
url-monitor-migrate-1 |   Apply all migrations: admin, auth, contenttypes, sessions, monitor
url-monitor-migrate-1 | Running migrations:
url-monitor-migrate-1 |   Applying contenttypes.0001_initial... OK
url-monitor-migrate-1 |   ...
url-monitor-migrate-1 |   Applying monitor.0001_initial... OK
url-monitor-migrate-1 exited with code 0
url-monitor-worker-1  | [tasks]
url-monitor-worker-1  |   . monitor.tasks.check_all_urls
url-monitor-worker-1  | [...] celery@... ready.
url-monitor-beat-1    | beat: Starting...
url-monitor-web-1     | Starting development server at http://0.0.0.0:8000/
```

نکته‌های مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`migrate-1 exited with code 0`**</span> — این **خوبه**! یعنی migrate کارش رو کرد و رفت.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`worker-1 | . monitor.tasks.check_all_urls`**</span> — Celery تسک ما رو کشف کرده. عالیه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`worker-1 | ready`**</span> — worker آماده‌ست.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`beat-1 | beat: Starting...`**</span> — ساعت شروع به کار کرده.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`web-1 | Starting development server`**</span> — جنگو بالا اومده.</span>

</div>

---

## قدم ۱۰ — چرا پورت ۹۰۰۰ و نه ۸۰۰۰؟

توی `compose.yaml` نوشتیم:

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

یعنی پورت ۹۰۰۰ روی سیستم خودت به پورت ۸۰۰۰ داخل کانتینر وصل می‌شه. ولی چرا از ۸۰۰۰ مستقیم استفاده نکردیم؟

**دلیل:** روی ویندوز (و بعضی سیستم‌های دیگه)، پورت‌های خاصی توسط سیستم رزرو می‌شن و Docker نمی‌تونه ازشون استفاده کنه. معمولاً پورت ۸۰۰۰ یکی از این‌هاست.

اگه موقع اجرا خطای `port is already allocated` یا <span dir='ltr'>`bind: An attempt was made to access a socket...`</span> دیدی، یعنی همینه. این یه مشکل شناخته‌شده در ویندوزه که مربوط به سرویسی به اسم `WinNAT` هست که شبکه‌ی WSL2 و Hyper-V رو مدیریت می‌کنه.

**راه‌حل‌ها:**

**راه‌حل الف (ساده‌ترین) — پورت رو عوض کن:**

```yaml
ports:
  - "127.0.0.1:9000:8000"
```

بعدش توی مرورگر از `http://127.0.0.1:9000` استفاده کن.

**راه‌حل ب — پورت ۸۰۰۰ رو آزاد کن (فقط ویندوز):**

<div align='right' dir='rtl'>

<span dir='rtl'>PowerShell رو **با دسترسی Administrator** باز کن و بزن:</span>

</div>

```powershell
net stop winnat
```

بعد توی یه پنجره‌ی PowerShell دیگه (بدون نیاز به ادمین)، از پوشه‌ی پروژه:

```powershell
docker compose up --build
```

وقتی کانتینرها بالا اومدن، برگرد به پنجره‌ی ادمین و بزن:

```powershell
net start winnat
```

**راه‌حل ج — ببین کدوم پورت‌ها رزرو شدن:**

<p dir='rtl'>
PowerShell با ادمین:
</p>

```powershell
netsh interface ipv4 show excludedportrange protocol=tcp
```

این لیست پورت‌هایی رو نشون می‌ده که ویندوز رزرو کرده. اگه ۸۰۰۰ توی یکی از بازه‌ها بود، یعنی مشکل از همینه.

**درس مهم:** توی دنیای واقعی، معمولاً به هر پروژه یه پورت جدا می‌دیم که تداخل نداشته باشن. مثلاً:

<div align='right' dir='rtl'>

<span dir='rtl'>• پروژه‌ی درس ۹ روی ۸۰۰۰</span> <br>
<span dir='rtl'>• پروژه‌ی درس ۱۰ روی ۹۰۰۰</span>

</div>

این یه عادت خوبه.

---

## تست پروژه

### تست ۱ — Endpoint سلامت

توی مرورگر باز کن:

```text
http://127.0.0.1:9000/health/
```

باید ببینی:

```json
{"status": "ok"}
```

### تست ۲ — صفحه‌ی API

```text
http://127.0.0.1:9000/api/urls/
```

باید صفحه‌ی DRF با یه لیست خالی ببینی.

### تست ۳ — ساخت کاربر ادمین

در یه ترمینال دیگه:

```bash
docker compose exec web python manage.py createsuperuser
```

یه <span dir='ltr'>username</span>، email (می‌تونی خالی بذاری) و password بذار.

### تست ۴ — ورود به پنل ادمین

```text
http://127.0.0.1:9000/admin/
```

با یوزر و رمزت لاگین کن.

### تست ۵ — ساخت URL اول (یه سایت واقعی)

توی پنل ادمین، بخش <span dir='ltr'>**Monitored URLs**</span> ← **ADD MONITORED URL**:

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>Name</span>:** `Google`</span> <br>
<span dir='rtl'>• **<span dir='ltr'>URL</span>:** `https://www.google.com`</span> <br>
<span dir='rtl'>• **<span dir='ltr'>Is active</span>:** ✅</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**SAVE** بزن.</span>

</div>

### تست ۶ — ساخت URL دوم (یه سایت الکی)

دوباره ADD MONITORED URL بزن:

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>Name</span>:** `Fake Site`</span> <br>
<span dir='rtl'>• **<span dir='ltr'>URL</span>:** `https://this-site-does-not-exist-12345.com`</span> <br>
<span dir='rtl'>• **<span dir='ltr'>Is active</span>:** ✅</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**SAVE** بزن.</span>

</div>

### تست ۷ — تماشای جادو

**۳۰ تا ۴۵ ثانیه صبر کن.** بعد برو به **Check Results** توی پنل ادمین.

باید دو ردیف ببینی:

<div align='right' dir='rtl'>

<span dir='rtl'>• یه ردیف برای `Google` با <span dir='ltr'>`is_up = True`</span>، <span dir='ltr'>`status_code = 200`</span>، <span dir='ltr'>`response_time_ms = یه عدد`</span></span> <br>
<span dir='rtl'>• یه ردیف برای `Fake Site` با <span dir='ltr'>`is_up = False`</span>، <span dir='ltr'>`status_code = خالی`</span>، <span dir='ltr'>`error_message = یه متن خطا`</span></span>

</div>

اگه این دو ردیف رو دیدی، **یعنی کل زنجیره کار می‌کنه**: beat تسک رو صف کرد ← worker اجراش کرد ← نتیجه توی دیتابیس ذخیره شد.

### تست ۸ — تماشای لاگ‌ها

توی ترمینالی که `docker compose up` توشه، هر ۳۰ ثانیه باید این خط‌ها رو ببینی:

```text
url-monitor-beat-1    | Scheduler: Sending due task check-all-urls-every-30-seconds (monitor.tasks.check_all_urls)
url-monitor-worker-1  | Task monitor.tasks.check_all_urls[...] received
url-monitor-worker-1  | Task monitor.tasks.check_all_urls[...] succeeded in 2.3s: Checked 2 URL(s)
```

خط اول از `beat` میاد: «الان وقتشه، تسک رو به صف بذار».
خط دوم از `worker` میاد: «تسک رو دریافت کردم».
خط سوم از `worker` میاد: «تموم شد، ۲ تا URL رو چک کردم».

---

## دستورات پرکاربرد

<div align='center' dir='rtl'>

| دستور | چه کاری می‌کند |
|-------|-----------------|
| <span dir='ltr'>`docker compose up --build`</span> |<span dir='rtl'> Build و اجرای همه‌ی سرویس‌ها</span> |
| <span dir='ltr'>`docker compose up -d`</span> |<span dir='rtl'> اجرا در پس‌زمینه</span> |
| <span dir='ltr'>`docker compose ps`</span> |<span dir='rtl'> وضعیت سرویس‌ها</span> |
| <span dir='ltr'>`docker compose logs -f web`</span> |<span dir='rtl'> دنبال کردن لاگ جنگو </span>|
| <span dir='ltr'>`docker compose logs -f worker`</span> |<span dir='rtl'> دنبال کردن لاگ worker </span>|
| <span dir='ltr'>`docker compose logs -f beat`</span> |<span dir='rtl'> دنبال کردن لاگ beat</span> |
| <span dir='ltr'>`docker compose exec web bash`</span> |<span dir='rtl'> باز کردن shell داخل کانتینر جنگو</span> |
| <span dir='ltr'>`docker compose exec worker bash` </span>|<span dir='rtl'> باز کردن shell داخل worker</span> |
| <span dir='ltr'>`docker compose exec db psql -U urlmonitor -d urlmonitor`</span> |<span dir='rtl'> باز کردن psql </span>|
| <span dir='ltr'>`docker compose down`</span> |<span dir='rtl'> توقف و حذف کانتینرها (volume را نگه می‌دارد)</span> |
| <span dir='ltr'>`docker compose down -v` </span>|<span dir='rtl'> **خطر:** volume را هم حذف می‌کند </span>|

</div>

---

## مشکلات رایج

### مشکل اول — `port is already allocated` یا `bind: An attempt was made to access a socket`

این مشکل توی ویندوز رایجه. راه‌حل‌ها رو توی قدم ۱۰ توضیح دادیم.

### مشکل دوم — `worker` تسک رو نمی‌بینه

اگه `docker compose logs worker` اسم `monitor.tasks.check_all_urls` رو نشون نداد، اینا رو چک کن:

<div align='right' dir='rtl'>

<span dir='rtl'>• `config/__init__.py` باید `from .celery import app as celery_app` داشته باشه.</span> <br>
<span dir='rtl'>• `config/celery.py` باید <span dir='ltr'>`app.autodiscover_tasks()`</span> رو صدا بزنه.</span> <br>
<span dir='rtl'>• `monitor/tasks.py` باید <span dir='ltr'>`@shared_task`</span> داشته باشه.</span>

</div>

### مشکل سوم — مایگریشن‌ها اجرا نمی‌شن

اگه `web` بالا میاد ولی دیتابیس خالیه:

```bash
docker compose logs migrate
```

اگه `migrate` با خطا خارج شده، اونجا نشون داده می‌شه. شایع‌ترین دلیل، مشکل اتصال به دیتابیس است.

### مشکل چهارم — تغییر `POSTGRES_PASSWORD` اثری ندارد

<div align='right' dir='rtl'>

<span dir='rtl'>Image رسمی Postgres دیتابیس رو **فقط یک بار** مقداردهی اولیه می‌کنه. اگه <span dir='ltr'>volume</span> `postgres_data` از قبل وجود داشته باشه، رمز تغییر نمی‌کنه. برای بازنشانی:</span>

</div>

```bash
docker compose down -v   # هشدار: همه‌ی داده‌ها پاک می‌شه
docker compose up --build
```

### مشکل پنجم — `beat` تسک رو صف نمی‌کنه

اگه لاگ `beat` هیچ خطی نشون نمی‌ده، ممکنه فایل `config/celery.py` درست لود نشده باشه. چک کن که `app.conf.beat_schedule` درست تعریف شده.

### مشکل ششم — worker تسک رو اجرا می‌کنه ولی نتیجه توی دیتابیس ذخیره نمی‌شه

اگه worker لاگ «succeeded» می‌ده ولی `Check Results` خالیه، ممکنه worker به یه دیتابیس دیگه وصل باشه. چک کن `POSTGRES_HOST` توی `worker` هم `db` باشه (نه `localhost`).

---

## تمرین‌ها

<div align='right' dir='rtl'>

<span dir='rtl'>1. `docker compose up --build` رو اجرا کن و مطمئن شو API در <span dir='ltr'>`http://127.0.0.1:9000/api/urls/`</span> در دسترسه.</span> <br>
<span dir='rtl'>2. توی پنل ادمین یه URL اضافه کن و ببین بعد از ۳۰ ثانیه، نتیجه‌اش توی Check Results ظاهر می‌شه.</span> <br>
<span dir='rtl'>3. `docker compose logs -f worker` رو اجرا کن و لاگ‌های تسک‌ها رو به‌صورت زنده تماشا کن.</span> <br>
<span dir='rtl'>4. `docker compose stop worker` بزن. ببین `beat` همچنان پیام می‌فرسته، ولی کسی اجراشون نمی‌کنه. بعد `docker compose start worker` بزن و ببین صف دوباره پر می‌شه.</span> <br>
<span dir='rtl'>5. **چالش:** یه تسک جدید تعریف کن که هر ۵ دقیقه یه پیام ساده چاپ کنه. توی `config/celery.py` اضافه‌اش کن و مطمئن شو worker می‌بینش.</span>

</div>

---

## جمع‌بندی

در این درس یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• چرا به کارهای پس‌زمینه و زمان‌بندی‌شده نیاز داریم.</span> <br>
<span dir='rtl'>• Celery چیه و چطور کار می‌کنه (یادت باشه: رستوران!).</span> <br>
<span dir='rtl'>• Redis چیه و چرا بهش نیاز داریم.</span> <br>
<span dir='rtl'>• تفاوت `worker` و `beat` چیه.</span> <br>
<span dir='rtl'>• چطور یه اپ جنگو رو با چند سرویس بنویسیم که همگی از یه Image مشترک استفاده می‌کنن.</span> <br>
<span dir='rtl'>• چطور `migrate` رو به یه سرویس یک‌باره جدا کنیم تا بقیه سرویس‌ها منتظرش بمونن.</span> <br>
<span dir='rtl'>• چطور تنظیمات Celery رو در پروژه پیکربندی کنیم.</span> <br>
<span dir='rtl'>• چطور یه تسک زمان‌بندی‌شده واقعی بنویسیم.</span> <br>
<span dir='rtl'>• چطور شش سرویس رو با `compose.yaml` هماهنگ کنیم.</span> <br>
<span dir='rtl'>• چطور پروژه رو تست و عیب‌یابی کنیم.</span>

</div>

**نکته‌ی کلیدی این درس:**

```text
کاربر ← Django Web ← (جواب سریع)
                            │
                            │ "این کار رو در پس‌زمینه انجام بده"
                            ▼
                       Redis (صف)
                            │
                            ▼
                    Celery Worker ← انجام کار
                            │
                            ▼
                    Celery Beat (زمان‌بند)
```

این الگو توی خیلی از پروژه‌های واقعی استفاده می‌شه: ارسال ایمیل، پردازش تصویر، تولید گزارش، چک کردن سلامت سرویس‌ها و خیلی چیزهای دیگه.

---

## درس بعدی

**درس ۱۱ — Nginx به‌عنوان Reverse Proxy**

در درس بعد یاد می‌گیریم:

<p dir='rtl'>
• Nginx چیه و چرا بهش نیاز داریم <br>
• چطور درخواست‌ها رو از Nginx به Django بفرستیم <br>
• چطور فایل‌های استاتیک رو با Nginx سرو کنیم <br>
• چطور Nginx رو با Docker Compose اضافه کنیم
</p>

