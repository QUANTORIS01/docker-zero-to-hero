<div align='right' dir='rtl'>

[🇬🇧 English](/en/09-django-docker/README.md)

</div>

# درس ۹ — داکری‌کردن یک پروژه واقعی جنگو

## مقدمه

در درس‌های قبل با Network، Volume، Image، Container، Docker و Compose آشنا شدیم. اما تمام مثال‌هایی که تا اینجا زدیم، ساده و آموزشی بودن: یک Nginx، یک PostgreSQL، یا یک اپ کوچک.

پروژه‌های واقعی اما این‌طور نیستن. یک اپلیکیشن جنگوی آماده‌ی محیط عملیاتی معمولاً به این چیزها نیاز داره:

<p dir='rtl'>
• یک محیط پایتون با وابستگی‌های دقیق و ثابت‌شده <br>
• دیتابیس PostgreSQL با ذخیره‌سازی پایدار <br>
• اجرای خودکار مایگریشن‌ها هنگام بالا آمدن کانتینر <br>
• کاربر non-root برای رعایت اصول امنیتی <br>
• Healthcheck تا Docker بداند سرویس واقعاً آماده‌ست <br>
• مدیریت متغیرهای محیطی به‌صورت امن و قابل‌تغییر <br>
• یک روند قابل تکرار که هر عضو تیم با یک دستور پروژه رو بالا بیاره
</p>

در این درس، یک پروژه‌ی واقعی جنگو به نام **TaskFlow** می‌سازیم و از صفر داکری می‌کنیم. همه‌ی فایل‌ها در سطح کیفیت محیط عملیاتی نوشته می‌شن، نه نمونه‌ی آموزشی.

در پایان این درس، یک API کامل با Django REST Framework، PostgreSQL، Docker و Docker Compose در اختیار خواهی داشت که در درس‌های بعدی روی همین پایه، Celery، Redis، Nginx و فرانت‌اند رو اضافه می‌کنیم.

---

## آنچه یاد می‌گیری

در پایان این درس می‌توانی:

<div align='right' dir='rtl'>

<span dir='rtl'>• یک ساختار پوشه‌ی حرفه‌ای برای پروژه‌ی جنگو طراحی کنی</span> <br>
<span dir='rtl'>• یک `Dockerfile` حرفه‌ای برای اپلیکیشن پایتون بنویسی</span> <br>
<span dir='rtl'>• هر خط `Dockerfile` را توضیح دهی و دلیل وجودش را بفهمی</span> <br>
<span dir='rtl'>• یک `compose.yaml` بنویسی که جنگو و PostgreSQL را با هم اجرا کند</span> <br>
<span dir='rtl'>• از `entrypoint.sh` برای اجرای خودکار مایگریشن‌ها استفاده کنی</span> <br>
<span dir='rtl'>• متغیرهای محیطی را با `django-environ` مدیریت کنی</span> <br>
<span dir='rtl'>• پروژه را با یک دستور اجرا کنی: `docker compose up --build`</span> <br>
<span dir='rtl'>• API را تست کنی و مشکلات رایج را عیب‌یابی کنی</span>

</div>

---

## پیش‌نیازها

<div align='right' dir='rtl'>

<span dir='rtl'>• Docker و Docker Compose روی سیستم نصب باشن (درس [۲](/fa/02-installation/README.md))</span> <br>
<span dir='rtl'>• با `docker ps`، `docker run` و `docker exec` آشنا باشی (درس [۳](/fa/03-first-container/README.md))</span> <br>
<span dir='rtl'>• مفهوم Image و Dockerfile رو بدونی (درس [۴](/fa/04-docker-images/README.md) و[۵](/fa/05-dockerfile/README.md))</span> <br>
<span dir='rtl'>• با Volume و Network آشنا باشی (درس [۶](/fa/06-docker-volumes/README.md) و [۷](/fa/07-docker-networking/README.md))</span> <br>
<span dir='rtl'>• Compose رو حداقل یک بار استفاده کرده باشی (درس [۸](/fa/08-docker-compose/README.md))</span> <br>
<span dir='rtl'>• آشنایی پایه با Django و Python</span>

</div>

اگر Django رو قبلاً کار نکردی، نگران نباش. همه‌ی کد جنگو توی درس توضیح داده می‌شه و هدف اصلی، **داکری‌کردن** پروژه‌ست، نه یاد دادن جنگو از صفر.

---

## پروژه‌ای که می‌سازیم — TaskFlow

<p dir='rtl'>
TaskFlow یک API مدیریت تسک است. کاربران می‌تونن تسک بسازن، تسک‌ها رو به دسته‌بندی‌ها گروه‌بندی کنن، اولویت و وضعیت هر تسک رو مشخص کنن، و تاریخ سررسید بذارن.
</p>

امکانات پروژه:

<div align='right' dir='rtl'>

<span dir='rtl'>• ثبت‌نام و ورود کاربر (روی Django auth)</span> <br>
<span dir='rtl'>• CRUD کامل تسک‌ها</span> <br>
<span dir='rtl'>• CRUD دسته‌بندی‌ها</span> <br>
<span dir='rtl'>• هر کاربر فقط تسک‌های خودش رو می‌بینه</span> <br>
<span dir='rtl'>• اولویت (low / medium / high) و وضعیت (todo / in_progress / done)</span> <br>
<span dir='rtl'>• تاریخ سررسید اختیاری</span> <br>
<span dir='rtl'>• پنل ادمین جنگو</span> <br>
<span dir='rtl'>• Endpoint سلامت‌سنجی `/health/`</span>

</div>

پشته‌ی فناوری:

<p dir='rtl'>
• Python 3.12 <br>
• Django 5.1.4 <br>
• Django REST Framework 3.15.2 <br>
• PostgreSQL 16 <br>
• psycopg (درایور PostgreSQL برای پایتون) 3.2.10 <br>
• django-environ 0.14.0 (برای مدیریت متغیرهای محیطی) <br>
• Gunicorn 23.0.0 (برای محیط عملیاتی)
</p>

در این درس فرانت‌اند نمی‌سازیم. یک API واقعی می‌سازیم که هر فرانت‌اندی (React، Vue، موبایل) بتونه با اون کار کنه.

---

## ساختار پوشه

ساختار کامل پروژه:

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

دو پوشه‌ی اصلی وجود داره:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`config/`</span> — تنظیمات کل پروژه‌ی جنگو (settings، urls ریشه، asgi، wsgi)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`tasks/`</span> — یک اپ جنگو (ماژول ویژگی). در آینده می‌تونی اپ‌های دیگه‌ای مثل `users`، `payments`، `notifications` هم اضافه کنی.</span>

</div>

این جداسازی، یک قرارداد استاندارد جنگو است که در پروژه‌های واقعی به‌خوبی مقیاس می‌گیرد.

---

## چرا این ساختار برای Docker مناسب است

یک پروژه‌ی جنگوی Docker-Friendly، **پیکربندی را از کد جدا نگه می‌دارد**:

<div align='right' dir='rtl'>

<span dir='rtl'>• `requirements.txt` — وابستگی‌های دقیق (Docker می‌تواند این لایه را کش کند)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`.env.example`</span> — الگوی متغیرهای محیطی</span> <br>
<span dir='rtl'>• `entrypoint.sh` — اجرای مایگریشن قبل از بالا آمدن سرور</span> <br>
<span dir='rtl'>• `Dockerfile` — تعریف نحوه‌ی ساخت Image</span> <br>
<span dir='rtl'>• `compose.yaml` — تعریف نحوه‌ی اجرای چند سرویس کنار هم</span>

</div>

نکته‌ی کلیدی: **کد جنگو نمی‌داند که داخل Docker اجرا می‌شود**. تنظیمات را از متغیرهای محیطی می‌خواند. این دقیقاً همان رفتاری است که جنگو در محیط عملیاتی باید داشته باشد.

---

## قدم اول — وابستگی‌ها

فایل `requirements.txt`:

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
gunicorn==23.0.0
django-environ==0.14.0
```

هر خط را بررسی کنیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• `Django==5.1.4` — نسخه‌ی فریم‌ورک. علامت `==` نسخه را قفل می‌کند تا در محیط‌های مختلف دقیقاً همین نسخه نصب شود.</span> <br>
<span dir='rtl'>• `djangorestframework==3.15.2` — لایه‌ای روی جنگو برای ساخت API.</span> <br>
<span dir='rtl'>• `psycopg[binary]==3.2.10` — درایور PostgreSQL برای پایتون. بخش `[binary]` یعنی نسخه‌ی کامپایل‌شده نصب بشود و نیاز به کامپایلر C نباشد.</span> <br>
<span dir='rtl'>• WSGI server — `gunicorn==23.0.0` برای محیط عملیاتی. فعلاً استفاده نمی‌کنیم، ولی از قبل نصبش می‌کنیم تا بعداً آماده باشه.</span> <br>
<span dir='rtl'>• `django-environ==0.14.0` — کتابخانه‌ای برای خواندن متغیرهای محیطی از فایل <span dir='ltr'>`.env`</span>.</span>

</div>

**همیشه نسخه‌ها را قفل کن.** اگر بنویسی `Django` (بدون نسخه)، ممکن است فردا نسخه‌ی جدیدی بیاید و پروژه‌ت بشکند.

---

## قدم دوم — کد جنگو

<div align='right' dir='rtl'>

### <span dir='rtl'>`manage.py`</span>

</div>

فایل مدیریت پروژه:

```python
#!/usr/bin/env python
"""Django's command-line utility for administrative tasks."""
import os
import sys


def main() -> None:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
    try:
        from django.core.management import execute_from_command_line
    except ImportError as exc:
        raise ImportError(
            "Couldn't import Django. Are you sure it's installed and "
            "available on your PYTHONPATH environment variable? Did you "
            "forget to activate a virtual environment?"
        ) from exc
    execute_from_command_line(sys.argv)


if __name__ == '__main__':
    main()
```

این فایل توسط خود جنگو ساخته می‌شود و نیازی به تغییر نداره.

<div align='right' dir='rtl'>

### <span dir='rtl'>`config/settings.py` — نکته‌ی اصلی</span>

</div>

فایل تنظیمات مهم‌ترین فایل این درس است، چون نقطه‌ی اتصال بین جنگو و Docker است:

```python
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

# ... INSTALLED_APPS، MIDDLEWARE و TEMPLATES ...

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        'USER': env('POSTGRES_USER'),
        'PASSWORD': env('POSTGRES_PASSWORD'),
        'HOST': env('POSTGRES_HOST'),
        'PORT': env('POSTGRES_PORT'),
        'CONN_MAX_AGE': 60,
    }
}

STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework.authentication.SessionAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
}
```

بیایید خط به خط بخش‌های مهم را بررسی کنیم.

### چرا `django-environ`؟

به‌جای این‌که مقادیر حساس (مثل رمز دیتابیس یا `SECRET_KEY`) را داخل کد بنویسیم، از متغیرهای محیطی می‌خوانیم:

```python
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')
```

خط اول یک شیء `env` می‌سازد. خط دوم، فایل <span dir='ltr'>`.env`</span> را (اگر وجود داشته باشد) می‌خواند و مقادیرش را در دسترس قرار می‌دهد.

### چرا `env.bool` و `env.list`؟

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`env()`</span> مقدار را به‌صورت رشته برمی‌گرداند. اما `DEBUG` باید boolean باشد و `ALLOWED_HOSTS` باید لیست باشد. برای همین از متدهای کمکی استفاده می‌کنیم:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `env.bool('DEBUG', False)` — رشته `"True"` یا `"False"` را به boolean تبدیل می‌کند. اگر متغیر تعریف نشده باشد، مقدار پیش‌فرض `False` استفاده می‌شود.</span> <br>
<span dir='rtl'>• `env.list('ALLOWED_HOSTS', default=[...])` — رشته‌ی جداشده با کاما را به لیست تبدیل می‌کند.</span>

</div>

اگر همه‌چیز را با <span dir='ltr'>`env()`</span> می‌خواندیم، <span dir='ltr'>`DEBUG="False"`</span> به‌عنوان رشته در نظر گرفته می‌شد و در جنگو **همیشه true** در نظر گرفته می‌شد (چون هر رشته‌ی غیرخالی در پایتون true است). این یک باگ امنیتی بسیار رایج است.

### تنظیم `CONN_MAX_AGE`

```python
'CONN_MAX_AGE': 60,
```

این یعنی جنگو اتصال به دیتابیس را تا ۶۰ ثانیه باز نگه می‌دارد و به‌جای باز کردن اتصال جدید در هر درخواست، از اتصال قبلی استفاده می‌کند. این کار performance را در محیط عملیاتی به‌طور چشمگیری بهبود می‌دهد.

---

## قدم سوم — اپ `tasks`

اپ `tasks` شامل مدل‌ها، سریالایزرها و ویوها است. کدهای کامل در ریپو موجود است؛ اینجا فقط مدل‌ها را بررسی می‌کنیم چون از نظر طراحی مهم هستند.

<div align='right' dir='rtl'>

### <span dir='rtl'>`tasks/models.py`</span>

</div>

```python
from django.conf import settings
from django.db import models


class Category(models.Model):
    """A user-defined grouping for tasks."""

    name = models.CharField(max_length=100, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name_plural = 'categories'
        ordering = ['name']

    def __str__(self) -> str:
        return self.name


class Task(models.Model):
    """A single task owned by a user."""

    class Priority(models.TextChoices):
        LOW = 'low', 'Low'
        MEDIUM = 'medium', 'Medium'
        HIGH = 'high', 'High'

    class Status(models.TextChoices):
        TODO = 'todo', 'To Do'
        IN_PROGRESS = 'in_progress', 'In Progress'
        DONE = 'done', 'Done'

    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='tasks',
    )
    category = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='tasks',
    )
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    priority = models.CharField(
        max_length=10,
        choices=Priority.choices,
        default=Priority.MEDIUM,
    )
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.TODO,
    )
    due_date = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', 'status'], name='task_owner_status_idx'),
            models.Index(fields=['owner', 'due_date'], name='task_owner_due_idx'),
        ]

    def __str__(self) -> str:
        return self.title
```

نکات مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>• `owner` با `CASCADE` حذف می‌شود: اگر کاربر حذف بشود، تمام تسک‌هایش هم حذف می‌شوند.</span> <br>
<span dir='rtl'>• `category` با `SET_NULL` حذف می‌شود: اگر دسته‌بندی حذف شود، تسک‌ها باقی می‌مانند ولی `category` آن‌ها `null` می‌شود.</span> <br>
<span dir='rtl'>• `indexes` — دو ایندکس ترکیبی روی `(owner, status)` و `(owner, due_date)` تعریف شده. این ایندکس‌ها کوئری‌های رایج (لیست تسک‌های کاربر بر اساس وضعیت یا تاریخ سررسید) را به‌طور چشمگیری سریع‌تر می‌کنند.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`tasks/views.py`</span>

</div>

```python
from rest_framework import permissions, viewsets

from .models import Category, Task
from .serializers import CategorySerializer, TaskSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = [permissions.IsAuthenticated]


class TaskViewSet(viewsets.ModelViewSet):
    serializer_class = TaskSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Task.objects.filter(owner=self.request.user).select_related('category')

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)
```

نکات مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>• `TaskViewSet.get_queryset` — همیشه تسک‌ها را به کاربر لاگین‌کرده محدود می‌کند. این کار **جداسازی داده‌ی بین کاربران** را تضمین می‌کند.</span> <br>
<span dir='rtl'>• `perform_create` — هنگام ساخت تسک، `owner` را به‌طور خودکار به کاربر جاری ست می‌کند. کاربر نمی‌تواند `owner` دیگری را جعل کند.</span> <br>
<span dir='rtl'>• `select_related('category')` — با یک کوئری SQL، اطلاعات دسته‌بندی را هم می‌خواند. اگر این نبود، برای هر تسک یک کوئری جداگانه به دیتابیس می‌رفت (مشکل N+1).</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`config/urls.py`</span>

</div>

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    """Lightweight endpoint for Docker healthchecks and load balancers."""
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('tasks.urls')),
    path('health/', health_check),
]
```

<div align='right' dir='rtl'>

<span dir='rtl'>Endpoint <span dir='ltr'>`/health/`</span> نقش مهمی در Docker و محیط عملیاتی دارد: probe‌ها (Docker healthcheck، Kubernetes liveness probe، Load balancer) با این endpoint می‌فهمند سرویس واقعاً آماده‌ست یا نه.</span>

</div>

---

## قدم چهارم — Dockerfile

حالا به بخش اصلی این درس می‌رسیم. فایل `Dockerfile`:

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

بیایید خط به خط بررسی کنیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>`FROM python:3.12-slim`</span>

</div>

از Image رسمی پایتون شروع می‌کنیم. نسخه‌ی `slim` از نسخه‌ی کامل Debian کوچک‌تر است ولی همه‌چیز لازم برای پایتون را دارد.

**چرا `3.12`؟** نسخه‌ی پیشنهادی برای Django 5.1.

**چرا `alpine` نه؟** Alpine از `musl` به‌جای `glibc` استفاده می‌کند. بعضی از پکیج‌های پایتون (به‌ویژه `psycopg` و پکیج‌هایی که از C استفاده می‌کنند) روی Alpine باید از سورس کامپایل شوند. این کار build را کند و شکننده می‌کند. `slim` انتخاب امن‌تر است.

### متغیرهای محیطی

```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
```

هر کدام چه کاری می‌کند:

<div align='center' dir='rtl'>

| متغیر | کار | چرا لازم داریم |
|-------|-----|----------------|
| `PYTHONDONTWRITEBYTECODE=1` |<span dir='rtl'> فایل <span dir='ltr'>`.pyc`</span> ننویس </span>| <span dir='rtl'>Image را تمیز نگه می‌دارد، از مشکلات ownership بین host و container جلوگیری می‌کند</span> |
| `PYTHONUNBUFFERED=1` |<span dir='rtl'> stdout/stderr را بافر نکن </span>|<span dir='rtl'> لاگ‌ها بلافاصله در `docker logs` دیده می‌شوند </span>|
| `PIP_NO_CACHE_DIR=1` |<span dir='rtl'> pip دانلودها را کش نکن</span> |<span dir='rtl'> Image کوچک‌تر </span>|
| `PIP_DISABLE_PIP_VERSION_CHECK=1` |<span dir='rtl'> چک آپدیت pip غیرفعال </span>|<span dir='rtl'> Build سریع‌تر و لاگ تمیزتر </span>|

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`WORKDIR /app`</span>

</div>

پوشه‌ی کاری داخل کانتینر. همه‌ی `COPY`، `RUN` و `CMD` بعدی از <span dir='ltr'>`/app`</span> اجرا می‌شوند.

### نصب پکیج‌های سیستمی

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 \
    && rm -rf /var/lib/apt/lists/*
```

کتابخانه‌ی کلاینت PostgreSQL (`libpq5`) را نصب می‌کنیم. درایور `psycopg` در زمان اجرا به آن نیاز دارد.

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`--no-install-recommends`</span> — پکیج‌های اختیاری که نیاز نداریم نصب نمی‌شوند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`rm -rf /var/lib/apt/lists/*`</span> — کش apt را پاک می‌کند؛ حدود ۳۰ مگابایت صرفه‌جویی.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='ltr'>`COPY requirements.txt .`</span>

</div>

**فقط** `requirements.txt` را کپی می‌کنیم. این یک تصمیم عمدی است.

<div align='right' dir='rtl'>

<span dir='rtl'>Docker Image را لایه به لایه می‌سازد و هر لایه کش می‌شود. اگر همه‌ی کد را اول کپی کنیم، **هر** تغییر در کد، لایه‌ی `pip install` را باطل می‌کند و pip مجبور می‌شود همه‌ی وابستگی‌ها را دوباره نصب کند.</span>

</div>

با کپی اول `requirements.txt`، لایه‌ی `pip install` تا زمانی که خود `requirements.txt` تغییر نکند از کش استفاده می‌کند.

<div align='right' dir='rtl'>

### <span dir='ltr'>`RUN pip install --no-cache-dir -r requirements.txt`</span>

</div>

وابستگی‌ها را نصب می‌کند. <span dir='ltr'>`--no-cache-dir`</span> از کش کردن دانلودهای pip داخل Image جلوگیری می‌کند.

<div align='right' dir='rtl'>

### <span dir='ltr'>`COPY . .`</span>

</div>

حالا بقیه‌ی پروژه (settings، اپ‌ها، `manage.py` و...) را کپی می‌کنیم.

### ساخت کاربر non-root

```dockerfile
RUN useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser
```

به‌صورت پیش‌فرض، کانتینرها با کاربر `root` اجرا می‌شوند. این خطرناک است: اگر مهاجم اپلیکیشن را هک کند، داخل کانتینر دسترسی root دارد و ممکن است بتواند به میزبان فرار کند.

ما یک کاربر non-root به نام `appuser` می‌سازیم، مالکیت <span dir='ltr'>`/app`</span> را به آن می‌دهیم، `entrypoint.sh` را اجراپذیر می‌کنیم و با `USER appuser` به آن سوییچ می‌کنیم.

نکته‌ی مهم: `chmod +x /app/entrypoint.sh` **قبل از** `USER appuser` اجرا می‌شود، چون بعد از سوییچ، کاربر `appuser` ممکن است اجازه‌ی تغییر permission را نداشته باشد.

<div align='right' dir='rtl'>

### <span dir='rtl'>`EXPOSE 8000`</span>

</div>

اعلام می‌کند که اپ روی پورت ۸۰۰۰ گوش می‌دهد. **پورت را روی میزبان منتشر نمی‌کند.** انتشار در `compose.yaml` با کلید <span dir='ltr'>`ports:`</span> انجام می‌شود.

<div align='right' dir='rtl'>

### <span dir='rtl'>`ENTRYPOINT` و `CMD`</span>

</div>

```dockerfile
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["python", "manage.py", "runserver", "0.0.0.0:8000"]
```

<div align='right' dir='rtl'>

<span dir='rtl'>• `ENTRYPOINT` همیشه هنگام شروع کانتینر اجرا می‌شود.</span> <br>
<span dir='rtl'>• `CMD` آرگومان‌های پیش‌فرضی است که می‌شود هنگام اجرا override کرد.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>entrypoint ما ابتدا مایگریشن‌ها را اجرا می‌کند، سپس هر چیزی که در `CMD` است را اجرا می‌کند.</span>

</div>

در محیط عملیاتی، `runserver` را با `gunicorn config.wsgi:application --bind 0.0.0.0:8000` جایگزین می‌کنیم.

---

## قدم پنجم — entrypoint.sh

فایل `entrypoint.sh`:

```sh
#!/bin/sh
set -e

echo "Applying database migrations..."
python manage.py migrate --noinput

echo "Starting server..."
exec "$@"
```

خط به خط:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`#!/bin/sh`</span> — از یک shell استاندارد POSIX استفاده می‌کنیم (همیشه در Imageهای `slim` موجود است).</span> <br>
<span dir='rtl'>• `set -e` — اگر هر دستوری fail کرد، فوراً متوقف شو. اگر `migrate` شکست بخورد، سرور با دیتابیس نیمه‌مهاجرت اجرا نمی‌شود.</span> <br>
<span dir='rtl'>• `migrate --noinput` — مایگریشن‌ها را روی دیتابیس اعمال می‌کند. <span dir='ltr'>`--noinput`</span> جلوی هر تعامل تعاملی را می‌گیرد (چون در کانتینر کسی نیست که به سؤال جواب بدهد).</span> <br>
<span dir='rtl'>• <span dir='ltr'>`exec "$@"`</span> — shell را با دستور `CMD` جایگزین می‌کند. این بسیار مهم است: باعث می‌شود پروسه‌ی جنگو PID 1 داخل کانتینر شود و سیگنال‌های `docker stop` درست به آن برسند. بدون `exec`، سیگنال به shell می‌رسد و جنگو ممکن است به‌درستی متوقف نشود.</span>

</div>

نکته‌ی مهم: فایل `entrypoint.sh` باید خط‌پایان Unix (LF) داشته باشد، نه Windows (CRLF). در `Dockerfile` با `chmod +x` این تضمین می‌شود، ولی اگر روی ویندوز فایل را ساختی، مطمئن شو در حالت Unix save شده.

---

## قدم ششم — <span dir='ltr'>.dockerignore</span>

فایل <span dir='ltr'>`.dockerignore`</span>:

```text
__pycache__/
*.py[cod]
*.egg-info/
.env
.env.*
!.env.example
.venv/
venv/
.git/
.gitignore
.vscode/
.idea/
*.sqlite3
.DS_Store
README.md
.pytest_cache/
.coverage
htmlcov/
```

چرا مهم است:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`.env`</span> **هرگز** نباید به Docker daemon فرستاده شود (حاوی اطلاعات محرمانه است).</span> <br>
<span dir='rtl'>• <span dir='ltr'>`.git/`</span> می‌تواند صدها مگابایت باشد. حذف آن از build، Build Context را بسیار سریع‌تر می‌کند.</span> <br>
<span dir='rtl'>• `__pycache__` و <span dir='ltr'>`.venv`</span> داخل Image بی‌استفاده‌اند.</span> <br>
<span dir='rtl'>• `README.md` هم لازم نیست داخل Image باشد.</span>

</div>

خط <span dir='ltr'>`!.env.example`</span> یک استثناست: این فایل را از ignore خارج می‌کند تا اگر روزی به آن نیاز داشتی داخل context باشد.

---

## قدم هفتم — متغیرهای محیطی

فایل <span dir='ltr'>`.env.example`</span>:

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

سپس روی سیستم خودت آن را کپی کن:

```bash
cp .env.example .env
```

**فایل <span dir='ltr'>`.env`</span> را هرگز کامیت نکن.** آن را در <span dir='ltr'>`.gitignore`</span> قرار داده‌ایم.

### نکته‌ی مهم درباره‌ی `POSTGRES_HOST`

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`.env.example`</span> مقدار `POSTGRES_HOST=localhost` دارد. این مقدار وقتی درست است که Django را **مستقیم روی سیستم خودت** (بیرون از Docker) اجرا کنی و PostgreSQL روی `localhost` خودت در دسترس باشد.</span>

</div>

وقتی از `docker compose` استفاده می‌کنی، سرویس `web` این مقدار را override می‌کند و `POSTGRES_HOST=db` می‌فرستد (`db` نام سرویس PostgreSQL در Compose است). یعنی نیازی نیست فایل <span dir='ltr'>`.env`</span> را تغییر بدهی — override به‌طور خودکار اتفاق می‌افتد.

### نکته‌ی مهم درباره‌ی `ALLOWED_HOSTS`

فرمت این متغیر مهم است. باید **بدون کوتیشن** و **با کاما جدا شده** باشد:

```dotenv
ALLOWED_HOSTS=localhost,127.0.0.1
```

اگر کوتیشن بگذاری (مثل `'localhost', '127.0.0.1'`)، <span dir='ltr'>`env.list()`</span> کوتیشن‌ها را بخشی از مقادیر در نظر می‌گیرد و جنگو آن‌ها را به‌عنوان hostname معتبر نمی‌شناسد.

### نکته‌ی امنیتی

مقادیر داخل <span dir='ltr'>`.env.example`</span> فقط برای محیط توسعه هستند. برای محیط عملیاتی:

<div align='right' dir='rtl'>

<span dir='rtl'>• `SECRET_KEY` را با یک مقدار تصادفی طولانی (حداقل ۵۰ کاراکتر) عوض کن</span> <br>
<span dir='rtl'>• `DEBUG` را `False` کن</span> <br>
<span dir='rtl'>• رمز PostgreSQL را به یک رمز قوی تغییر بده</span> <br>
<span dir='rtl'>• از سیستم مدیریت Secret مثل Vault، AWS Secrets Manager، یا Docker Secrets استفاده کن</span>

</div>

---

## قدم هشتم — compose.yaml

فایل `compose.yaml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-taskflow}
      POSTGRES_USER: ${POSTGRES_USER:-taskflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskflow_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskflow} -d ${POSTGRES_DB:-taskflow}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  web:
    build: .
    environment:
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      POSTGRES_DB: ${POSTGRES_DB:-taskflow}
      POSTGRES_USER: ${POSTGRES_USER:-taskflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskflow_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
    ports:
      - "127.0.0.1:8000:8000"
    depends_on:
      db:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
```

### سرویس `db`

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`image: postgres:16`</span> — Image رسمی PostgreSQL 16.</span> <br>
<span dir='rtl'>• `POSTGRES_PASSWORD`، `POSTGRES_USER`، `POSTGRES_DB` — **فقط هنگام اولین مقداردهی volume** استفاده می‌شوند. اگر بعداً این‌ها را تغییر دهی، چون دیتابیس از قبل ساخته شده، تغییری اعمال نمی‌شود.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`volumes: postgres_data:/var/lib/postgresql/data`</span> — داده را خارج از کانتینر پایدار می‌کند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`healthcheck`</span> — هر ۵ ثانیه `pg_isready` اجرا می‌شود. Compose این‌طوری می‌فهمد دیتابیس **واقعاً** آماده است، نه فقط این‌که کانتینر روشن است.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`restart: unless-stopped`</span> — در صورت crash یا ری‌استارت میزبان، کانتینر را دوباره بالا می‌آورد.</span>

</div>

**سینتکس <span dir='ltr'>`${VAR:-default}`</span>** — یعنی «اگر `VAR` در محیط ست شده بود از آن استفاده کن، وگرنه از `default`».

### سرویس `web`

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`build: .`</span> — Image را از Dockerfile موجود در همین پوشه بساز.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`environment`</span> — پیکربندی که به جنگو پاس داده می‌شود. همه‌ی این مقادیر در `settings.py` از طریق `os.environ` خوانده می‌شوند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`POSTGRES_HOST: db`</span> — نام سرویس `db` به‌عنوان hostname در شبکه‌ی Compose استفاده می‌شود. این مقدار <span dir='ltr'>`.env`</span> را override می‌کند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`ports: "127.0.0.1:8000:8000"`</span> — فقط به loopback bind می‌شود. یک best practice امنیتی برای توسعه‌ی محلی است: API روی شبکه‌ی محلی شما (LAN) در دسترس نیست.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`depends_on: db: condition: service_healthy`</span> — **مهم‌ترین خط.** به Compose می‌گوید قبل از شروع `web` صبر کند تا `pg_isready` موفق شود. بدون این خط، ممکن است `migrate` قبل از آماده شدن PostgreSQL اجرا شود و کانتینر هنگام شروع crash کند.</span>

</div>

### بخش `volumes`

```yaml
volumes:
  postgres_data:
```

این volume نام‌دار را تعریف می‌کند. Compose آن را با پیشوند نام پروژه می‌سازد (مثلاً `backend-django_postgres_data`).

---

## قدم نهم — ساخت و اجرا

از داخل پوشه‌ی <span dir='ltr'>`backend-django/`</span>:

```bash
docker compose up --build
```

چه اتفاقی می‌افتد:

<div align='right' dir='rtl'>

<span dir='rtl'>1. Docker فایل `compose.yaml` را می‌خواند.</span> <br>
<span dir='rtl'>2. <span dir='ltr'>Image</span> سرویس `web` را از `Dockerfile` می‌سازد.</span> <br>
<span dir='rtl'>3. <span dir='ltr'>Image</span> `postgres:16` را pull می‌کند (اگر کش نشده باشد).</span> <br>
<span dir='rtl'>4. <span dir='ltr'>volume</span> `postgres_data` را می‌سازد.</span> <br>
<span dir='rtl'>5. سرویس `db` را بالا می‌آورد و منتظر healthcheck می‌ماند.</span> <br>
<span dir='rtl'>6. بعد از آماده شدن `db`، سرویس `web` را بالا می‌آورد؛ `entrypoint.sh` اجرا می‌شود ← `runserver` ← `migrate`.</span>

</div>

خروجی باید چیزی شبیه این باشد:

```text
db-1   | ... database system is ready to accept connections
web-1  | Applying database migrations...
web-1  | Operations to perform:
web-1  |   Apply all migrations: admin, auth, contenttypes, sessions, tasks
web-1  | ...
web-1  | Starting server...
web-1  | Watching for file changes with StatReloader
web-1  | Listening on TCP address 0.0.0.0:8000
```

---

## قدم دهم — ساخت کاربر ادمین

در یک ترمینال دیگر:

```bash
docker compose exec web python manage.py createsuperuser
```

از دستورات خواسته‌شده پیروی کن. سپس باز کن:

```text
http://127.0.0.1:8000/admin/
```

با اطلاعات superuser وارد شو. الان می‌توانی از پنل ادمین تسک و دسته‌بندی بسازی.

---

## قدم یازدهم — تست API

ساده‌ترین راه تست، استفاده از API مرورپذیر DRF است. اول در پنل admin لاگین کن، سپس باز کن:

```text
http://127.0.0.1:8000/api/tasks/
```

باید صفحه‌ی API مربوط به DRF با فرم ثبت تسک جدید را ببینی.

برای تست Endpoint سلامت:

```bash
curl http://127.0.0.1:8000/health/
```

باید `{"status": "ok"}` برگرداند.

نکته: در این درس از `SessionAuthentication` استفاده می‌کنیم، چون هنوز فرانت‌اند نداریم. در درس‌های آینده که فرانت‌اند React اضافه می‌شود، به `TokenAuthentication` یا JWT سوییچ می‌کنیم.

---

## دستورات پرکاربرد

<div align='center' dir='rtl'>

| دستور | چه کاری می‌کند |
|-------|-----------------|
| <span dir='ltr'>`docker compose up --build`</span> | <span dir='rtl'>Build و اجرای همه‌ی سرویس‌ها</span> |
| <span dir='ltr'>`docker compose up -d`</span> | اجرا در پس‌زمینه |
| <span dir='ltr'>`docker compose ps`</span> | وضعیت سرویس‌ها |
| <span dir='ltr'>`docker compose logs -f web`</span> | دنبال کردن لاگ جنگو |
| <span dir='ltr'>`docker compose exec web bash`</span> |<span dir='rtl'> باز کردن shell داخل کانتینر جنگو </span>|
| <span dir='ltr'>`docker compose exec web python manage.py shell`</span> |<span dir='rtl'> باز کردن shell خود جنگو</span> |
| <span dir='ltr'>`docker compose exec db psql -U taskflow -d taskflow`</span> |<span dir='rtl'> باز کردن psql</span> |
| <span dir='ltr'>`docker compose down`</span> |<span dir='rtl'> توقف و حذف کانتینرها (volume را نگه می‌دارد) </span>|
| <span dir='ltr'>`docker compose down -v`</span> | <span dir='rtl'>**خطر:** volume را هم حذف می‌کند</span> |

</div>

---

## مشکلات رایج

### مشکل اول — `web` با خطای «connection refused» به <span dir='ltr'>`db`</span> crash می‌کند

دیتابیس هنوز آماده نیست. ما این را با <span dir='ltr'>`depends_on: condition: service_healthy`</span> حل کرده‌ایم. اگر آن بلاک را حذف کردی، دوباره اضافه کن.

### مشکل دوم — «permission denied» هنگام نوشتن در <span dir='ltr'>`/app`</span>

این وقتی رخ می‌دهد که پوشه‌ی پروژه را به کانتینر mount کنی (<span dir='ltr'>`volumes: - .:/app`</span>) در حالی که با کاربر non-root اجرا می‌شوی. فایل‌های میزبان UID متفاوتی با `appuser` دارند.

راه‌حل: یا کد را mount نکن (با هر تغییر، Image را دوباره build کن)، یا کانتینر را با UID میزبانت اجرا کن:

```yaml
user: "${UID}:${GID}"
```

### مشکل سوم — تغییر `POSTGRES_PASSWORD` اثری ندارد

<div align='right' dir='rtl'>

<span dir='rtl'>Image رسمی Postgres دیتابیس را **فقط یک بار** مقداردهی اولیه می‌کند. اگر <span dir='ltr'>volume</span> `postgres_data` از قبل وجود داشته باشد، رمز تغییر نمی‌کند. برای بازنشانی:</span>

</div>

```bash
docker compose down -v   # هشدار: همه‌ی داده‌ها پاک می‌شود
docker compose up --build
```

### مشکل چهارم — `migrate` خطای «no such table» می‌دهد

فایل‌های مایگریشن را کامیت نکرده‌ای. مطمئن شو `tasks/migrations/0001_initial.py` وجود دارد. اگر مدل را تغییر داده‌ای، روی سیستم خودت (نه داخل کانتینر) این را اجرا کن:

```bash
python manage.py makemigrations
```

و فایل‌های جدید را کامیت کن.

### مشکل پنجم — پورت ۸۰۰۰ در استفاده است

یک پروسه یا پروژه‌ی Compose دیگر از پورت ۸۰۰۰ استفاده می‌کند. پورت میزبان را عوض کن:

```yaml
ports:
  - "127.0.0.1:8001:8000"
```

### مشکل ششم — `env.list('ALLOWED_HOSTS')` خطا می‌دهد یا هاست‌ها رد می‌شوند

فرمت `ALLOWED_HOSTS` در <span dir='ltr'>`.env`</span> باید **بدون کوتیشن** و **با کاما جدا شده** باشد:

```dotenv
ALLOWED_HOSTS=localhost,127.0.0.1
```

نه `'localhost', '127.0.0.1'` و نه `["localhost", "127.0.0.1"]`.

---

## تمرین‌ها

<div align='right' dir='rtl'>

<span dir='rtl'>1. <span dir='ltr'>`docker compose up --build`</span> را اجرا کن و مطمئن شو API در <span dir='ltr'>`http://127.0.0.1:8000/api/tasks/`</span> در دسترس است.</span> <br>
<span dir='rtl'>2. یک shell داخل کانتینر `web` باز کن و `python manage.py check` را اجرا کن.</span> <br>
<span dir='rtl'>3. با <span dir='ltr'>`docker compose down`</span> استک را متوقف کن و با `docker volume ls` مطمئن شو volume دیتابیس هنوز وجود دارد.</span> <br>
<span dir='rtl'>4. با <span dir='ltr'>`docker compose up -d`</span> دوباره بالا بیاور و مطمئن شو داده‌ها (کاربران، تسک‌ها) هنوز سر جایشان هستند.</span> <br>
<span dir='rtl'>5. **چالش:** یک Endpoint جدید <span dir='ltr'>`GET /api/stats/`</span> اضافه کن که تعداد کل تسک‌های کاربر لاگین‌کرده را برگرداند. Image را دوباره build کن و تست کن.</span>

</div>

---

## جمع‌بندی

در این درس یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• چطور یک پروژه‌ی واقعی جنگو را برای Docker ساختاردهی کنیم.</span> <br>
<span dir='rtl'>• چطور یک `Dockerfile` حرفه‌ای بنویسیم با:</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ Image پایه‌ی `slim`</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ کش لایه‌ای برای `pip install`</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ کاربر non-root</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ اسکریپت entrypoint</span> <br>
<span dir='rtl'>• چطور یک `compose.yaml` بنویسیم با:</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ دو سرویس (`web` و `db`)</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ volume نام‌دار برای پایداری دیتابیس</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ healthcheck و `depends_on: condition: service_healthy`</span> <br>
  <span dir='rtl' style='margin-right:32px;'>⁌ متغیرهای محیطی از <span dir='ltr'>`.env`</span></span> <br>
<span dir='rtl'>• چطور از `django-environ` برای خواندن متغیرهای محیطی استفاده کنیم.</span> <br>
<span dir='rtl'>• چطور مایگریشن‌ها را داخل کانتینر اجرا کنیم.</span> <br>
<span dir='rtl'>• چطور استک را تست و عیب‌یابی کنیم.</span>

</div>

جریان کاری که الان داری:

```text
compose.yaml + Dockerfile + .env
              │
              ▼
       docker compose up
              │
              ▼
       web (Django) ──► db (PostgreSQL)
```

---

## درس بعدی

**درس ۱۰ — پروژه‌ی جدید: Celery + Redis با Docker**

در درس بعد، یک پروژه‌ی جدید شروع می‌کنیم که در آن تسک‌های پس‌زمینه و تسک‌های زمان‌بندی‌شده را با Celery و Redis اجرا می‌کنیم. یاد می‌گیریم:

<div align='right' dir='rtl'>

<span dir='rtl'>• Redis چطور به‌عنوان broker کار می‌کند</span> <br>
<span dir='rtl'>• Celery worker و Celery beat چیست و چرا هر کدام یک کانتینر جدا هستند</span> <br>
<span dir='rtl'>• چطور یک job واقعی بنویسیم که در پس‌زمینه اجرا شود</span> <br>
<span dir='rtl'>• چطور در `compose.yaml` چندین سرویس را با هم مدیریت کنیم</span>

</div>
