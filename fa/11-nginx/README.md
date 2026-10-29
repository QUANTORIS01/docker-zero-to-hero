<div align='right' dir='rtl'>

[🇬🇧 English](/en/11-nginx/README.md)

</div>

# درس ۱۱ — Nginx به‌عنوان Reverse Proxy

## مقدمه

توی دو درس قبل، دو پروژه‌ی واقعی ساختیم: یه API مدیریت تسک (TaskFlow) و یه مانیتور URL (URL Monitor). هر دو با Docker و PostgreSQL و در درس دهم با Celery و Redis اجرا شدن.

اما هر دو یه ویژگی مشترک داشتن: **فقط API بودن، بدون ظاهر**. یعنی وقتی توی مرورگر بازشون می‌کردی، یه صفحه‌ی JSON ساده می‌دیدی، نه یه سایت واقعی.

توی این درس، اولین پروژه‌ای رو می‌سازیم که **ظاهر واقعی** داره. یه گالری عکس زیبا با تم تاریک، انیمیشن، و گرید Masonry. یه چیزی که آدم دلش بخواد ازش اسکرین‌شات بگیره.

اما ظاهر زیبا فقط بخش کوچیکی از ماجراست. وقتی یه سایت واقعی می‌سازی، باید این سوال رو بپرسی:

> «چطور فایل‌های CSS و عکس‌ها رو به کاربر برسونم، بدون اینکه سرورم کند بشه؟»

پاسخ این سوال، **Nginx** هست. یه نرم‌افزار جداگانه که کارش اینه که **جلوی** برنامه‌ی جنگو قرار بگیره، درخواست‌ها رو دریافت کنه، بعضی‌ها رو خودش جواب بده، و بقیه رو به جنگو پاس بده.

توی این درس، اولین بار Nginx رو وارد پروژه می‌کنیم و اثرش رو **با چشم خودت** توی DevTools مرورگر می‌بینی.

کدهای کامل پروژه توی مسیر <span dir='ltr'>`projects/11-photo-gallery/`</span> توی ریپو موجوده. توی این درس خط به خط بررسی‌شون می‌کنیم.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'>• توضیح بدی چرا `runserver` برای محیط عملیاتی مناسب نیست</span> <br>
<span dir='rtl'>• توضیح بدی Gunicorn چیه و چرا بهش نیاز داریم</span> <br>
<span dir='rtl'>• توضیح بدی Nginx چیه و چه نقشی توی معماری پروژه داره</span> <br>
<span dir='rtl'>• توضیح بدی Reverse Proxy چیه (با مثال ساده)</span> <br>
<span dir='rtl'>• `collectstatic` رو درک کنی و بدونی چرا لازمه</span> <br>
<span dir='rtl'>• فایل `nginx.conf` بنویسی که فایل‌های CSS و عکس‌ها رو سرو کنه</span> <br>
<span dir='rtl'>• تفاوت `static` و `media` رو توضیح بدی</span> <br>
<span dir='rtl'>• سه سرویس (`db`، `web`، `nginx`) رو با `compose.yaml` هماهنگ کنی</span> <br>
<span dir='rtl'>• با DevTools مرورگر تأیید کنی که Nginx داره کارش رو انجام می‌ده</span> <br>
<span dir='rtl'>• با دو مشکل رایج (Permission و CSRF) آشنا بشی و حلشون کنی</span> <br>
<span dir='rtl'>• تفاوت Docker volume نام‌دار و Bind Mount رو توضیح بدی</span>

</div>

---

## پیش‌نیازها

<div align='right' dir='rtl'>

<span dir='rtl'>• همه‌چیزهای درس [۹](/fa/09-django-docker/README.md) (Dockerfile، compose، entrypoint، django-environ)</span> <br>
<span dir='rtl'>• همه‌چیزهای درس [۱۰](/fa/10-celery-redis/README.md) (چند سرویس، مدیریت volumeها)</span> <br>
<span dir='rtl'>• آشنایی پایه با HTML و CSS (اگه نداری، نگران نباش — کدها آماده‌ست)</span> <br>
<span dir='rtl'>• آشنایی پایه با جنگو</span>

</div>

---

## پروژه‌ای که می‌سازیم — Aurora Gallery

**داستان پروژه:**

یه گالری عکس ساده. از پنل ادمین، عکس آپلود می‌کنی. یه صفحه‌ی عمومی وجود داره که همه‌ی عکس‌ها رو با یه ظاهر حرفه‌ای (تم تاریک، انیمیشن، گرید Masonry) نشون می‌ده.

**چرا این پروژه برای درس Nginx انتخاب شد؟**

چون سه نوع محتوا داره:

<div align='right' dir='rtl'>

<span dir='rtl'>۱. **HTML داینامیک** (صفحه‌ی گالری، صفحه‌ی جزئیات) — از Django میاد</span> <br>
<span dir='rtl'>۲. **CSS استاتیک** (فایل `style.css`) — باید از Nginx بیاد</span> <br>
<span dir='rtl'>۳. **عکس رسانه** (عکس‌های آپلودی) — باید از Nginx بیاد</span>

</div>

توی DevTools مرورگر، می‌تونی ببینی هر کدوم از کجا میان. این چیزی است که درس ۱۱ رو **ملموس** می‌کنه.

**پشته‌ی فناوری:**

<p dir='rtl'>
• Python 3.12 <br>
• Django 5.1.4 <br>
• Gunicorn 23.0.0 <br>
• Nginx 1.27 <br>
• PostgreSQL 16 <br>
• Pillow 11.0.0 (برای پردازش تصویر) <br>
• django-environ 0.14.0
</p>

---

## اول، یه توضیح ساده از مفاهیم جدید

قبل از اینکه وارد کد بشیم، بذار سه مفهوم جدید این درس رو با مثال روزمره توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>Gunicorn چیه؟</span>

</div>

توی درس‌های قبل، از `runserver` استفاده می‌کردیم. حالا می‌خوایم از **Gunicorn** استفاده کنیم. چرا؟

**تصور کن یه رستوران داری با یه آشپز.**

<p dir='rtl'>
• صبح‌ها که مشتری کمه، یه آشپز کافیه. <br>
• شب‌ها که رستوران شلوغ می‌شه، آشپز قفل می‌کنه. مشتری‌ها معطل می‌مونن.
</p>

<div align='right' dir='rtl'>

<span dir='rtl'>**`runserver`** = همون یه آشپزه. برای تست خوبه، ولی توی شلوغی جواب نمی‌ده.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`Gunicorn`** = یه تیم آشپز که همزمان کار می‌کنن. چند تا `worker` موازی می‌سازه. هر `worker` یه کپی از برنامه‌ی توئه. اگه یکی مشغول باشه، بقیه جواب می‌دن.</span>

</div>

**نکته‌ی فنی مهم:** Gunicorn روی ویندوز native کار نمی‌کنه (چون از <span dir='ltr'>`fork()`</span> استفاده می‌کنه که فقط روی لینوکس هست). برای همین توی Docker اجراش می‌کنیم که لینوکسیه.

<div align='right' dir='rtl'>

### <span dir='rtl'>Nginx چیه؟</span>

</div>

**تصور کن یه ساختمون اداری داری.**

<div align='right' dir='rtl'>

<span dir='rtl'>• جلوی در یه **نگهبان** هست. هر کسی بخواد وارد بشه، اول نگهبان می‌بینه.</span> <br>
<span dir='rtl'>• اگه کسی بخواد بره به **بایگانی** (گرفتن یه کاغذ، یه فایل)، نگهبان خودش می‌ره بایگانی و فایل رو میاره. این کار سریع انجام می‌شه، چون نیازی نیست کارشناس درگیر بشه.</span> <br>
<span dir='rtl'>• اگه کسی بخواد یه کار **تخصصی** بکنه (مثلاً تنظیم قرارداد جدید)، نگهبان می‌فرستدش پیش کارشناس (Django). این کار یه کم طول می‌کشه، ولی نگهبان همچنان آزاده که بقیه‌ی مراجعین رو راه بندازه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Nginx** دقیقاً همین نگهبانه. کارش اینه که:</span>

</div>

۱. **درخواست‌های ثابت** (فایل CSS، عکس، JavaScript) رو **خودش** بده. سریع، بدون اینکه Django رو درگیر کنه.

۲. **درخواست‌های داینامیک** (صفحه‌ی گالری، پنل ادمین) رو به Django بفرسته. Django پردازششون می‌کنه.

چرا این کار مهمه؟

<div align='center' dir='rtl'>

| درخواست |<span dir='rtl'> اگه Nginx نباشه </span>|<span dir='rtl'> اگه Nginx باشه </span>|
|---------|------------------|-----------------|
|<span dir='rtl'> فایل CSS </span>|<span dir='rtl'> Django باید کد پایتون اجرا کنه، فایل رو بخونه، برگردونه </span>|<span dir='rtl'> Nginx مستقیم از دیسک می‌خونه، ۱۰۰ برابر سریع‌تر </span>|
| عکس | همین‌طور | همین‌طور |
| صفحه‌ی گالری |<span dir='rtl'> Django پردازش می‌کنه </span>|<span dir='rtl'> Django پردازش می‌کنه (Nginx فقط پاس می‌ده) </span>|

</div>

**خلاصه:** Nginx سرور Django رو آزاد می‌کنه که فقط به کارهای داینامیک برسه.

<div align='right' dir='rtl'>

### <span dir='rtl'>Reverse Proxy چیه؟</span>

</div>

**تصور کن یه شرکت بزرگ داری.**

<div align='right' dir='rtl'>

<span dir='rtl'>• شماره‌ی تلفن شرکت رو همه می‌دونن: `021-12345678`</span> <br>
<span dir='rtl'>• ولی هر کسی که زنگ می‌زنه، نمی‌تونه مستقیم با مدیرعامل حرف بزنه</span> <br>
<span dir='rtl'>• اول **منشی** جواب می‌ده، بعد تشخیص می‌ده که این تماس برای کیه، و به اون شخص وصل می‌کنه</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Reverse Proxy** هم همینه. یعنی یه **واسطه** که جلوی سرور اصلی قرار می‌گیره و درخواست‌ها رو به سرورهای داخلی پاس می‌ده.</span>

</div>

تفاوت با `proxy` معمولی:

<div align='right' dir='rtl'>

<span dir='rtl'>• **Proxy معمولی** (Forward Proxy) = جلوی **کاربر** قرار می‌گیره. مثل VPN. کاربر می‌خواد به سایت X وصل بشه، اول به proxy وصل می‌شه، proxy می‌ره سایت X رو می‌بینه.</span> <br>
<span dir='rtl'>• **Reverse Proxy** = جلوی **سرور** قرار می‌گیره. کاربر فکر می‌کنه داره با سرور اصلی حرف می‌زنه، ولی در واقع با واسطه داره حرف می‌زنه.</span>

</div>

توی پروژه‌ی ما:

```text
کاربر ──► Nginx (Reverse Proxy) ──► Django
```

کاربر مستقیم با Django حرف نمی‌زنه. اول با Nginx حرف می‌زنه. Nginx تصمیم می‌گیره که این درخواست رو خودش جواب بده یا به Django بفرسته.

<div align='right' dir='rtl'>

### <span dir='rtl'>`collectstatic` چیه؟</span>

</div>

**تصور کن یه کتابخونه داری.**

<div align='right' dir='rtl'>

<span dir='rtl'>• کتاب‌ها توی قفسه‌های مختلف پخش‌ان (توی هر اتاق، توی هر قفسه)</span> <br>
<span dir='rtl'>• وقتی کسی می‌خواد یه کتاب پیدا کنه، باید همه‌ی قفسه‌ها رو بگرده</span> <br>
<span dir='rtl'>• راه بهتر: همه‌ی کتاب‌های مهم رو بیاری توی یه اتاق مرکزی، به‌ترتیب حروف الفبا</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`collectstatic`** همین کار رو با فایل‌های CSS و JS می‌کنه. همه‌ی فایل‌های استاتیک رو از تمام اپ‌ها (فقط `gallery` توی این پروژه، ولی بعداً ممکنه چند تا اپ داشته باشی) جمع می‌کنه و توی یه پوشه‌ی مرکزی می‌ذاره. بعد Nginx از اون پوشه می‌خونه.</span>

</div>

بدون <span dir='ltr'>`collectstatic`</span>، Django توی محیط عملیاتی نمی‌تونه فایل‌های استاتیک رو سرو کنه. چون هر فایل توی پوشه‌ی اپ خودشه و پیدا کردنش کند می‌شه.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>static vs media — تفاوت چیه؟</span>

</div>

این تفاوت خیلی مهمه و ممکنه گیج‌کننده باشه. بذار ساده توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>Static (استاتیک = ثابت)</span>

</div>

فایل‌هایی که **خود تو** به عنوان توسعه‌دهنده ساختی:

<div align='right' dir='rtl'>

<span dir='rtl'>• `style.css` که با دست خودت نوشتی</span> <br>
<span dir='rtl'>• عکس‌های لوگو و آیکون که خودت طراحی کردی</span> <br>
<span dir='rtl'>• فایل‌های JavaScript که خودت نوشتی</span>

</div>

**ویژگی‌ها:**

<div align='right' dir='rtl'>

<span dir='rtl'>• فقط با تغییر کد عوض می‌شن</span> <br>
<span dir='rtl'>• بین همه‌ی کاربران مشترکن (همه یه CSS می‌بینن)</span> <br>
<span dir='rtl'>• با `collectstatic` جمع می‌شن</span> <br>
<span dir='rtl'>• در پوشه‌ی `STATIC_ROOT` (توی این پروژه: <span dir='ltr'>`/app/staticfiles`</span>)</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>Media (رسانه = آپلودی)</span>

</div>

فایل‌هایی که **کاربر** آپلود می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• عکس‌هایی که توی گالری آپلود کردی</span> <br>
<span dir='rtl'>• فایل‌های PDF که کاربر آپلود کرده</span> <br>
<span dir='rtl'>• هر چیزی که از سمت کاربر میاد</span>

</div>

**ویژگی‌ها:**

<div align='right' dir='rtl'>

<span dir='rtl'>• با کار کاربر عوض می‌شن (کاربر جدید، عکس جدید)</span> <br>
<span dir='rtl'>• برای هر کاربر متفاوته</span> <br>
<span dir='rtl'>• با `collectstatic` جمع نمی‌شن (چون از قبل توی `MEDIA_ROOT` جمع شدن)</span> <br>
<span dir='rtl'>• در پوشه‌ی `MEDIA_ROOT` (توی این پروژه: <span dir='ltr'>`/app/media`</span>)</span>

</div>

### مثال

فرض کن یه فروشگاه اینترنتی داری:

<div align='right' dir='rtl'>

<span dir='rtl'>• **Static**: لوگوی فروشگاه، فایل CSS، فایل JavaScript</span> <br>
<span dir='rtl'>• **Media**: عکس محصولاتی که ادمین آپلود کرده</span>

</div>

هر دو باید به کاربر برسن، ولی مدیریتشون متفاوته.

---

## ساختار پوشه

ساختار پروژه:

```text
11-photo-gallery/
├── .dockerignore
├── .env
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

سه فایل جدید نسبت به درس ۱۰:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`gunicorn.conf.py`** — تنظیمات Gunicorn</span> <br>
<span dir='rtl'>• **`nginx/nginx.conf`** — تنظیمات Nginx</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`gallery/static/`**</span> و <span dir='ltr'>**`gallery/templates/`**</span> — فایل‌های ظاهری</span>

</div>

**توجه:** یه فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین توی این پروژه فایل جداگانه نداریم.

---

## قدم ۱ — وابستگی‌ها

فایل `requirements.txt`:

```txt
Django==5.1.4
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
Pillow==11.0.0
```

**دو پکیج جدید:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`gunicorn`** — وب‌سرور پایتون برای محیط عملیاتی</span> <br>
<span dir='rtl'>• **`Pillow`** — کتابخانه‌ی پردازش تصویر. Django برای `ImageField` بهش نیاز داره</span>

</div>

**نکته:** این بار `djangorestframework` رو نیاز نداریم، چون تمرکز روی HTML و Nginxه، نه API.

---

## قدم ۲ — تنظیمات Gunicorn

فایل `gunicorn.conf.py`:

```python
"""
Gunicorn configuration for Photo Gallery.

We use a separate config file (instead of command-line flags) so we can
read values from environment variables, keep the Dockerfile CMD clean,
and still use the "exec form" (which handles signals correctly).

Run with:
    gunicorn -c gunicorn.conf.py config.wsgi:application
"""

import os

bind = f"0.0.0.0:{os.environ.get('PORT', '8000')}"

workers = int(os.environ.get('GUNICORN_WORKERS', '3'))

accesslog = '-'
errorlog = '-'
loglevel = os.environ.get('GUNICORN_LOG_LEVEL', 'info')

timeout = int(os.environ.get('GUNICORN_TIMEOUT', '30'))
```

### هر تنظیم چیه؟

<div align='center' dir='rtl'>

| تنظیم | معنی | چرا |
|--------|-------|------|
| `bind` | آدرس و پورت |<span dir='rtl'> `0.0.0.0` یعنی «همه‌ی رابط‌های شبکه» (لازم برای Docker) </span>|
| `workers` | تعداد پروسه‌های موازی |<span dir='rtl'> ۳ تا برای این پروژه کافیه </span>|
| `accesslog` |<span dir='rtl'> `-` یعنی «به stdout» </span>|<span dir='rtl'> برای اینکه `docker logs` بتونه ببینه </span>|
| `errorlog` |<span dir='rtl'> `-` یعنی «به stderr» </span>| برای خطاها |
| `loglevel` | سطح لاگ |<span dir='rtl'> `info` یعنی لاگ‌های معمولی </span>|
| `timeout` |<span dir='rtl'> اگه یه worker بیشتر از این معلق بمونه، می‌کشش </span>|<span dir='rtl'> ۳۰ ثانیه </span>|

</div>

---

## قدم ۳ — تنظیمات Nginx

فایل `nginx/nginx.conf`:

```nginx
upstream django {
    server web:8000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location /static/ {
        alias /staticfiles/;
        expires 30d;
        add_header Cache-Control "public, immutable";
        access_log off;
    }

    location /media/ {
        alias /media/;
        expires 7d;
        add_header Cache-Control "public";
        access_log off;
    }

    location / {
        proxy_pass http://django;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_redirect off;
    }
}
```

### بیایید خط به خط ببینیم

<div align='right' dir='rtl'>

<span dir='ltr'>**`upstream django { server web:8000; }`**</span>

</div>

یه اسم مستعار برای سرویس <span dir='ltr'>Django</span>. `web` اسم سرویس توی `compose.yaml` است. Nginx توی شبکه‌ی Docker با همین اسم می‌تونه بهش وصل بشه (Docker یه DNS داخلی داره که اسم سرویس‌ها رو به IP تبدیل می‌کنه).

<div align='right' dir='rtl'>

<span dir='ltr'>**`listen 80;`**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Nginx روی پورت ۸۰ داخل کانتینر گوش می‌ده. توی `compose.yaml` این پورت رو به ۸۰۸۰ روی هاست نقشه می‌کنیم.</span>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`client_max_body_size 20M;`**</span>

</div>

پیش‌فرض Nginx، حجم آپلود رو ۱ مگابایت محدود می‌کنه. برای عکس‌ها این کمه. ۲۰ مگابایت انتخاب معقولیه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`location /static/`</span> و <span dir='ltr'>`location /media/`**</span>

</div>

هر درخواستی که با `/static/` یا `/media/` شروع بشه، Nginx خودش از پوشه‌های `staticfiles` و `media` (داخل کانتینر nginx) سرو می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`expires 30d;`**</span>

</div>

مرورگر ۳۰ روز فایل رو کش می‌کنه. یعنی اگه کاربر بار دوم بیاد، مرورگر از کش خودش می‌خونه، نه از سرور.

<div align='right' dir='rtl'>

<span dir='ltr'>**`access_log off;`**</span>

</div>

برای هر بار که فایل لود می‌شه، لاگ ننویس. این کار لاگ‌ها رو کم‌حجم‌تر می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`location /`**</span>

</div>

هر درخواست دیگه‌ای (صفحه‌ی گالری، پنل ادمین) به Django فرستاده می‌شه.

**هدرهای `proxy_set_header`**

وقتی Nginx درخواست رو به Django پاس می‌ده، این هدرها رو اضافه می‌کنه تا Django بدونه درخواست از کجا اومده:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`Host`**</span> — اسم دامنه (یا IP) که کاربر زده. <span dir='ltr'>`$http_host`</span> پورت رو نگه می‌داره (مهم برای CSRF).</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`X-Real-IP`**</span> — IP واقعی کاربر (Nginx اینجاست، بدون این هدر Django فقط <span dir='ltr'>IP</span> Nginx رو می‌بینه).</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`X-Forwarded-For`**</span> — زنجیره‌ی IPها (برای وقتی چند تا پروکسی هست).</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`X-Forwarded-Proto`**</span> — کاربر با `http` اومده یا `https`؟</span>

</div>

---

## قدم ۴ — Dockerfile با `gosu`

فایل `Dockerfile`:

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

### تفاوت‌های مهم با درس‌های قبل

<div align='right' dir='rtl'>

<span dir='rtl'>**۱. `gosu` نصب می‌شه:**</span>

</div>

```dockerfile
&& apt-get install -y --no-install-recommends libpq5 gosu
```

<div align='right' dir='rtl'>

<span dir='rtl'>`gosu` یه ابزار کوچیکه که مثل `sudo` عمل می‌کنه ولی ساده‌تره. بهمون اجازه می‌ده یه دستور رو با یه کاربر دیگه اجرا کنیم. توی قدم بعد توضیح می‌دم چرا لازمش داریم.</span>

</div>

**۲. خط `USER appuser` حذف شده:**

توی درس‌های ۹ و ۱۰ داشتیم. این بار **حذفش کردیم**. چرا؟

چون می‌خوایم کانتینر با `root` شروع بشه، مالکیت volumeها رو درست کنه، بعد به `appuser` سوییچ کنه. اگه از همون اول `appuser` باشیم، نمی‌تونیم `chown` کنیم.

<div align='right' dir='rtl'>

<span dir='rtl'>**۳. `CMD` با Gunicorn:**</span>

</div>

```dockerfile
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
```

به‌جای <span dir='ltr'>`runserver`</span>. <span dir='ltr'>`-c gunicorn.conf.py`</span> یعنی «تنظیمات رو از این فایل بخون». `config.wsgi:application` یعنی «اپلیکیشن WSGI رو از `config/wsgi.py` بگیر».

**چرا فرم آرایه (`[...]`)؟**

اگه می‌نوشتیم `CMD gunicorn -c gunicorn.conf.py config.wsgi:application` (بدون آرایه)، Docker یه shell اجرا می‌کرد که Gunicorn رو اجرا کنه. اون‌وقت Gunicorn PID 2 می‌شد و shell PID 1. سیگنال‌های `docker stop` به shell می‌رسیدن، نه Gunicorn.

با آرایه، Gunicorn مستقیم PID 1 می‌شه. این مهمه برای اینکه `docker stop` درست کار کنه.

---

## قدم ۵ — entrypoint.sh با `gosu`

فایل `entrypoint.sh`:

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

### این فایل یه داستان داره — بذار تعریف کنم

اولش یه مشکل پیش اومد که خیلی رایجه. بذار بگم چرا این فایل این‌طوری نوشته شده.

**مشکل اول (Volume Permission):**

توی `compose.yaml` این خط رو داریم:

```yaml
web:
  volumes:
    - media_files:/app/media
```

<div align='right' dir='rtl'>

<span dir='rtl'>Docker یه volume به اسم `media_files` می‌سازه. **مشکل:** Docker همیشه volumeها رو با مالکیت `root` می‌سازه، حتی اگه توی `Dockerfile` گفته باشی مالکش `appuser` باشه. چون volume روی پوشه‌ی Image سوار می‌شه و مالکیت خودش رو تحمیل می‌کنه.</span>

</div>

نتیجه: کاربر `appuser` نمی‌تونه توی <span dir='ltr'>`/app/media`</span> بنویسه. Django خطای `PermissionError` می‌ده.

**راه‌حل:**

کانتینر با `root` شروع می‌شه. `entrypoint.sh` مالکیت رو درست می‌کنه. بعد به `appuser` سوییچ می‌کنه.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='ltr'>**`if [ "$(id -u)" = "0" ]`**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`id -u` شناسه‌ی عددی کاربر جاری رو برمی‌گردونه. `root` همیشه `0` است. این خط می‌گه: «اگه الان با root اجرا می‌شیم...»</span>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`chown -R appuser:appuser /app/staticfiles /app/media`**</span>

</div>

مالکیت این دو پوشه و همه‌ی محتواشون رو به `appuser` می‌ده. <span dir='ltr'>`-R`</span> یعنی «به‌صورت بازگشتی، همه‌ی زیرپوشه‌ها و فایل‌ها».

<div align='right' dir='rtl'>

<span dir='ltr'>**`exec gosu appuser "$0" "$@"`**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`gosu` این فایل <span dir='ltr'>(`$0`)</span> رو با همون آرگومان‌های اصلی <span dir='ltr'>(`$@`)</span> دوباره اجرا می‌کنه، ولی این بار با کاربر <span dir='ltr'>`appuser`</span>. `exec` باعث می‌شه پروسه‌ی فعلی جایگزین بشه (نه اینکه یه پروسه‌ی جدید ساخته بشه).</span>

</div>

**بار دوم که فایل اجرا می‌شه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• `id -u` دیگه `0` نیست (چون `appuser` هستیم)</span> <br>
<span dir='rtl'>• از بلوک `if` رد می‌شه</span> <br>
<span dir='rtl'>• `migrate` و `collectstatic` و `gunicorn` با `appuser` اجرا می‌شن</span>

</div>

**خط `collectstatic`:**

```sh
python manage.py collectstatic --noinput
```

همه‌ی فایل‌های CSS رو از <span dir='ltr'>`gallery/static/`</span> جمع می‌کنه و توی <span dir='ltr'>`/app/staticfiles/`</span> می‌ذاره. این پوشه به <span dir='ltr'>`nginx`</span> mount می‌شه.

**نکته:** `collectstatic` توی `entrypoint.sh` اجرا می‌شه، نه توی `Dockerfile`. چرا؟ چون موقع <span dir='ltr'>`docker build`</span>، `settings.py` لود می‌شه و به دیتابیس نیاز پیدا می‌کنه. ولی موقع build، دیتابیس در دسترس نیست. برای همین `collectstatic` رو بعد از بالا آمدن دیتابیس اجرا می‌کنیم.

---

## قدم ۶ — `compose.yaml` با سه سرویس

فایل `compose.yaml`:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-photogallery}
      POSTGRES_USER: ${POSTGRES_USER:-photogallery}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-photogallery_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-photogallery} -d ${POSTGRES_DB:-photogallery}"]
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
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8080,http://127.0.0.1:8080}
      POSTGRES_DB: ${POSTGRES_DB:-photogallery}
      POSTGRES_USER: ${POSTGRES_USER:-photogallery}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-photogallery_dev_password}
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

  nginx:
    image: nginx:1.27-alpine
    ports:
      - "127.0.0.1:8080:80"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
      - static_files:/staticfiles:ro
      - media_files:/media:ro
    depends_on:
      web:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
  media_files:
```

### بیایید با هم بررسی کنیم

**سه volume:**

<div align='center' dir='rtl'>

| Volume | استفاده‌کننده | چه چیزی نگه می‌داره |
|--------|----------------|----------------------|
| `postgres_data` |<span dir='rtl'> فقط `db` </span>| دیتابیس |
| `static_files` |<span dir='rtl'> `web` (می‌نویسه) و `nginx` (می‌خونه) </span>|<span dir='rtl'> فایل‌های CSS </span>|
| `media_files` |<span dir='rtl'> `web` (می‌نویسه) و `nginx` (می‌خونه) </span>| عکس‌های آپلودی |

</div>

**چرا volume بین `web` و `nginx` مشترکه؟**

چون Nginx باید فایل‌هایی رو که Django می‌نویسه بخونه. `web` می‌نویسه، `nginx` می‌خونه. برای همین هر دو به یه volume وصلن.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`:ro`</span> یعنی چی؟**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`read-only` = فقط خواندنی. Nginx فقط می‌خونه، نمی‌نویسه. این یه محافظته: اگه یه باگ توی nginx باعث بشه بخواد بنویسه، اجازه نداره.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`nginx.conf` چطور وصل می‌شه؟**</span>

</div>

```yaml
- ./nginx/nginx.conf:/etc/nginx/conf.d/default.conf:ro
```

فایل `nginx.conf` روی سیستم تو رو می‌ذاره جای فایل پیش‌فرض Nginx. یعنی اگه بخوای تنظیمات رو عوض کنی، فقط فایل رو ویرایش می‌کنی و `docker compose restart nginx` می‌زنی. لازم نیست Image رو دوباره build کنی.

<div align='right' dir='rtl'>

<span dir='rtl'>**healthcheck `web`:**</span>

</div>

```yaml
healthcheck:
  test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"]
```

چون Image پایتون `curl` نداره، از خود پایتون استفاده می‌کنیم. اگه جواب بده، سرویس سالمه.

<div align='right' dir='rtl'>

<span dir='rtl'>**`depends_on`:**</span>

</div>

```yaml
nginx:
  depends_on:
    web:
      condition: service_healthy
```

<div align='right' dir='rtl'>

<span dir='rtl'>Nginx صبر می‌کنه تا `web` واقعاً آماده بشه (یعنی healthcheck پاس بشه)، بعد شروع می‌کنه. این یه قدم فراتر از درس‌های قبلیه.</span>

</div>

---

## قدم ۷ — تنظیمات `settings.py` (اضافه‌های مهم)

توی `config/settings.py`، این‌ها رو اضافه کن:

```python
# بعد از ALLOWED_HOSTS:
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)

# بعد از STATIC_URL:
STATIC_ROOT = BASE_DIR / 'staticfiles'

# بعد از MEDIA_URL:
MEDIA_ROOT = BASE_DIR / 'media'
```

### این سه خط چی کار می‌کنن؟

<div align='right' dir='rtl'>

<span dir='rtl'>**`CSRF_TRUSTED_ORIGINS`** — یه مفهوم امنیتی. توضیح کامل توی «مشکل دوم» می‌دم.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`STATIC_ROOT`** — پوشه‌ای که `collectstatic` همه‌ی فایل‌های CSS رو توش جمع می‌کنه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`MEDIA_ROOT`** — پوشه‌ای که عکس‌های آپلودی توش ذخیره می‌شن.</span>

</div>

---

## قدم ۸ — اجرا

از داخل <span dir='ltr'>`projects/11-photo-gallery/`</span>:

```bash
docker compose up --build
```

### چی انتظار داری ببینی:

**مرحله‌ی اول:**

```text
[+] Running 4/4
 ✔ db Pulled
 ✔ nginx Pulled
 ✔ web Building
```

**مرحله‌ی دوم (build web):**

```text
 => [1/7] FROM python:3.12-slim
 => [2/7] WORKDIR /app
 => [3/7] RUN apt-get update ...
 => [4/7] COPY requirements.txt .
 => [5/7] RUN pip install -r requirements.txt
 => [6/7] COPY . .
 => [7/7] RUN mkdir -p ... useradd ...
 => exporting to image
```

**مرحله‌ی سوم (شروع سرویس‌ها):**

```text
 ✔ Container 11-photo-gallery-db-1     Started
 ✔ Container 11-photo-gallery-db-1     Healthy
 ✔ Container 11-photo-gallery-web-1    Started
 ✔ Container 11-photo-gallery-web-1    Healthy
 ✔ Container 11-photo-gallery-nginx-1  Started
```

**مرحله‌ی چهارم (لاگ‌های زنده):**

```text
db-1     | ... database system is ready to accept connections
web-1    | Fixing volume permissions...
web-1    | Applying database migrations...
web-1    | Collecting static files...
web-1    | 128 static files copied to '/app/staticfiles'.
web-1    | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
web-1    | [INFO] Starting gunicorn 23.0.0
web-1    | [INFO] Listening at: http://0.0.0.0:8000
nginx-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
```

**اگه این خط‌ها رو دیدی، موفق شدی!** 🎉

---

## قدم ۹ — تست

### تست ۱ — Endpoint سلامت

```text
http://127.0.0.1:8080/health/
```

باید `{"status": "ok"}` ببینی.

### تست ۲ — صفحه‌ی اصلی گالری

```text
http://127.0.0.1:8080/
```

باید صفحه‌ی «Aurora Gallery» رو ببینی:

<div align='right' dir='rtl'>

<span dir='rtl'>• هدر شیشه‌ای بالا</span> <br>
<span dir='rtl'>• تیتر بزرگ با گرادیانت بنفش-فیروزه‌ای</span> <br>
<span dir='rtl'>• پیام «The gallery is empty»</span>

</div>

### تست ۳ — تأیید اینکه CSS از Nginx میاد (مهم‌ترین تست!)

این تست، کل درس رو توجیه می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>۱. `F12` بزن (DevTools باز بشه)</span> <br>
<span dir='rtl'>۲. برو به تب **Network**</span> <br>
<span dir='rtl'>۳. صفحه رو reload کن</span> <br>
<span dir='rtl'>۴. دنبال `style.css` بگرد و روش کلیک کن</span> <br>
<span dir='rtl'>۵. توی **Response Headers**، دنبال `Server` بگرد</span>

</div>

باید ببینی:

```text
Server: nginx/1.27.x
```

**اگه `Server: gunicorn` بود، یعنی Nginx کارش رو انجام نمی‌ده.** ولی اگه `nginx` بود، عالیه.

**چرا این مهمه؟** چون تأیید می‌کنه که Nginx داره CSS رو سرو می‌کنه، نه Django. یعنی معماری‌مون درسته.

### تست ۴ — ساخت کاربر ادمین

توی یه ترمینال دیگه:

```bash
docker compose exec web python manage.py createsuperuser
```

### تست ۵ — ورود به پنل ادمین

```text
http://127.0.0.1:8080/admin/
```

با یوزر و رمزت لاگین کن.

**اگه خطای CSRF گرفتی، نگران نباش — توی «مشکل دوم» حلش می‌کنیم.**

### تست ۶ — آپلود عکس

توی پنل ادمین:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**Photos**</span> ← **ADD PHOTO**</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Title**</span>: `My First Photo`</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Image**</span>: یه عکس انتخاب کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**SAVE**</span></span>

</div>

**اگه خطای Permission گرفتی، نگران نباش — توی «مشکل اول» حلش می‌کنیم.**

### تست ۷ — تماشای عکس

برگرد به:

```text
http://127.0.0.1:8080/
```

باید عکست رو توی یه کارت زیبا ببینی. با موس روش نگه دار:

<p dir='rtl'>
• عکس کمی بزرگ می‌شه <br>
• یه لایه‌ی تیره از پایین ظاهر می‌شه <br>
• عنوان عکس از پایین بالا میاد <br>
• یه درخشش بنفش دور کارت ایجاد می‌شه
</p>

### تست ۸ — تأیید اینکه عکس‌ها هم از Nginx میاد

دوباره `F12`، تب Network، صفحه رو reload کن. این بار دنبال عکسی که آپلود کردی بگرد (آدرسش با `/media/` شروع می‌شه). روش کلیک کن. توی Response Headers:

```text
Server: nginx/1.27.x
```

**عالیه!** یعنی Nginx هم CSS رو سرو می‌کنه، هم عکس‌ها رو. 🎯

---

## مشکل اول — خطای Permission هنگام آپلود عکس

### چه اتفاقی می‌افته؟

وقتی عکس آپلود می‌کنی، این خطا رو می‌بینی:

```text
PermissionError: [Errno 13] Permission denied: '/app/media/photos'
```

### چرا این خطا میاد؟

یادت باشه توی `compose.yaml` گفتیم:

```yaml
web:
  volumes:
    - media_files:/app/media
```

<div align='right' dir='rtl'>

<span dir='rtl'>Docker یه volume به اسم `media_files` می‌سازه. ولی **Docker همه‌ی volumeها رو با مالکیت `root` می‌سازه**، فارغ از اینکه توی `Dockerfile` چی گفته باشی.</span>

</div>

نتیجه:


<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/app/media`</span> داخل کانتینر، مالکش `root` است</span> <br>
<span dir='rtl'>• Django با `appuser` اجرا می‌شه</span> <br>
<span dir='rtl'>• `appuser` نمی‌تونه فایل بنویسه</span> <br>
<span dir='rtl'>• خطای Permission</span>

</div>

### راه‌حل

از `gosu` استفاده می‌کنیم. کانتینر با `root` شروع می‌شه، مالکیت رو درست می‌کنه، بعد به `appuser` سوییچ می‌کنه. کدش توی `entrypoint.sh` هست که بالا توضیح دادیم.

**نتیجه توی لاگ:**

```text
web-1 | Fixing volume permissions...
web-1 | Applying database migrations...
web-1 | Collecting static files...
web-1 | Starting: gunicorn ...
```

خط اول نشون می‌ده که `entrypoint.sh` با root اجرا شده و مالکیت رو درست کرده. ✅

---

## مشکل دوم — خطای CSRF هنگام لاگین به ادمین

### چه اتفاقی می‌افته؟

وقتی یوزر و پسورد رو می‌زنی، این خطا:

```text
Forbidden (403)
CSRF verification failed. Request aborted.

Origin checking failed - http://127.0.0.1:8080 does not match any trusted origins.
```

### چرا این خطا میاد؟

<div align='right' dir='rtl'>

<span dir='rtl'>**CSRF چیه؟** یه نوع حمله‌ست. تصور کن به سایت بانک خودت لاگین کردی. بدون اینکه خارج بشی، یه سایت مخرب باز می‌کنی. اون سایت مخرب یه درخواست مخفی به بانک می‌فرسته که «پول به حساب X واریز کن». چون هنوز لاگینی، بانک فکر می‌کنه تو داری این کار رو می‌کنی.</span>

</div>

برای جلوگیری از این حمله، Django از یه مکانیزم به اسم **CSRF Token** استفاده می‌کنه. هر فرم، یه توکن مخفی داره که فقط خود Django می‌شناسه.

از Django 4.0 به بعد، یه لایه‌ی امنیتی جدید اضافه شده: **Origin Checking**. یعنی Django چک می‌کنه که درخواست از کدوم آدرس اومده. اگه آدرس با لیست مجازها نخونه، ردش می‌کنه.

**مشکل ما:**

<div align='right' dir='rtl'>

<span dir='rtl'>• تو از `http://127.0.0.1:8080` به سایت وصل می‌شی</span> <br>
<span dir='rtl'>• مرورگرت `Origin: http://127.0.0.1:8080` رو به Django می‌فرسته</span> <br>
<span dir='rtl'>• ولی <span dir='ltr'>Nginx</span> `Host: 127.0.0.1` رو می‌فرسته (بدون پورت)</span> <br>
<span dir='rtl'>• Django این دو رو مقایسه می‌کنه: `127.0.0.1:8080` با `127.0.0.1` — **فرق دارن**</span> <br>
<span dir='rtl'>• برای همین رد می‌کنه</span> <br>

</div>

### راه‌حل — دو کار لازمه

**۱. اضافه‌کردن `CSRF_TRUSTED_ORIGINS` به `settings.py`:**

```python
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:8080', 'http://127.0.0.1:8080'],
)
```

و به <span dir='ltr'>`.env`</span>:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8080,http://127.0.0.1:8080
```

**۲. اصلاح `nginx.conf`:**

این خط:

```nginx
proxy_set_header Host $host;
```

رو به این تغییر بده:

```nginx
proxy_set_header Host $http_host;
```

**تفاوت <span dir='ltr'>`$host`</span> و <span dir='ltr'>`$http_host`</span>:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`$host`</span> = اسم دامنه، **بدون** پورت (`127.0.0.1`)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`$http_host`</span> = اسم دامنه **با** پورت (`127.0.0.1:8080`)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`$http_host`</span> درسته چون با `Origin` مرورگر مطابقت داره.</span>

</div>

**بعد از این دو تغییر:**

```bash
docker compose down
docker compose up --build
```

الان می‌تونی به ادمین لاگین کنی.

**نکته:** این خطا فقط توی محیط توسعه با پورت غیراستاندارد پیش میاد. توی محیط عملیاتی که دامنه‌ت پورت نداره (مثلاً `https://mygallery.com`)، فرقی نمی‌کنه. ولی این تنظیمات از الان برای محیط عملیاتی هم آماده‌ست.

---

## یک نکته‌ی مهم درباره‌ی volume و bind mount

این سوال ممکنه برات پیش بیاد: «عکس‌هایی که آپلود کردم کجان؟ چرا توی پوشه‌ی پروژه نیستن؟»

### چرا <span dir='ltr'>`media/`</span> توی پوشه‌ی پروژه نیست؟

چون از **volume نام‌دار** استفاده کردیم:

```yaml
volumes:
  - media_files:/app/media
```

<p dir='rtl'>
<span dir='ltr'>Docker</span> volumeهای نام‌دار رو توی محل ذخیره‌سازی خودش نگه می‌داره، نه توی پوشه‌ی پروژه. روی ویندوز، با Docker Desktop، مسیر واقعی داخل WSL2 virtual disk هست.
</p>

### چرا این طراحی بهتره؟

**تفکر کلیدی: کد ≠ داده**

<div align='right' dir='rtl'>

<span dir='rtl'>• **کد** (settings.py، views.py، templates) ← توی Image</span> <br>
<span dir='rtl'>• **داده** (عکس‌های آپلودی، دیتابیس) ← توی volumeهای جدا</span> <br>

</div>

سه دلیل مهم:

**۱. پاک‌سازی آسان:** `docker compose down -v` همه‌ی داده‌ها رو یکجا پاک می‌کنه، بدون اینکه کد رو دست بزنه.

**۲. بکاپ‌گیری منظم:** فقط `media_files` رو بکاپ می‌گیری، بدون اینکه کد رو قاطی کنی.

**۳. قابل‌حمل بین سیستم‌ها:** اگه یه روزی روی سرور واقعی راه بندازی، <span dir='ltr'>`media/`</span> روی یه storage جدا (مثلاً S3) قرار می‌گیره. این طرز فکر از الان تمرین می‌شه.

### اگه بخوای عکس‌ها توی پوشه باشن (توصیه نمی‌کنم)

از **Bind Mount** استفاده کن:

```yaml
web:
  volumes:
    - ./media:/app/media
nginx:
  volumes:
    - ./media:/media:ro
```

الان <span dir='ltr'>`media/`</span> توی پوشه‌ی پروژه ساخته می‌شه. ولی:

<div align='right' dir='rtl'>

<span dir='rtl'>• روی ویندوز کندتره (بین NTFS و WSL2 ترجمه می‌کنه)</span> <br>
<span dir='rtl'>• اگه <span dir='ltr'>`.gitignore`</span> کامل نباشه، عکس‌ها به Git می‌رن</span> <br>
<span dir='rtl'>• توی محیط عملیاتی استاندارد نیست</span> <br>

</div>

**تفاوت volume نام‌دار و bind mount:**

<div align='center' dir='rtl'>

| ویژگی | <span dir='rtl'>Volume نام‌دار </span>| Bind Mount |
|--------|----------------|------------|
| کجا ذخیره می‌شه |<span dir='rtl'> توی محل Docker</span> | توی پوشه‌ای که خودت انتخاب می‌کنی |
| مدیریت | Docker | خودت |
| سرعت (روی ویندوز) | سریع | کندتر |
| مناسب محیط عملیاتی | ✅ |<span dir='rtl'> ❌ (معمولاً) </span>|
| مناسب توسعه |<span dir='rtl'> ⚠️ (دیدن فایل‌ها سخت‌تره) </span>| ✅ |

</div>

---

## دستورات پرکاربرد

<div align='center' dir='rtl'>

| دستور | چه کاری می‌کند |
|-------|-----------------|
| <span dir='ltr'>`docker compose up --build` </span>|<span dir='rtl'> Build و اجرای همه‌ی سرویس‌ها </span>|
| <span dir='ltr'>`docker compose up -d` </span>| اجرا در پس‌زمینه |
| <span dir='ltr'>`docker compose ps` </span>| وضعیت سرویس‌ها |
| <span dir='ltr'>`docker compose logs -f web` </span>| دنبال کردن لاگ جنگو |
| <span dir='ltr'>`docker compose logs -f nginx` </span>|<span dir='rtl'> دنبال کردن لاگ Nginx </span>|
| <span dir='ltr'>`docker compose exec web bash` </span>|<span dir='rtl'> باز کردن shell داخل کانتینر جنگو </span>|
| <span dir='ltr'>`docker compose exec nginx sh` </span>|<span dir='rtl'> باز کردن shell داخل Nginx </span>|
| <span dir='ltr'>`docker compose exec db psql -U photogallery -d photogallery` </span>|<span dir='rtl'> باز کردن psql </span>|
| <span dir='ltr'>`docker compose down` </span>|<span dir='rtl'> توقف و حذف کانتینرها (volume را نگه می‌دارد) </span>|
| <span dir='ltr'>`docker compose down -v` </span>|<span dir='rtl'> **خطر:** volume را هم حذف می‌کند </span>|

</div>

---

## مشکلات رایج

### مشکل اول — `port is already allocated`

پورت ۸۰۸۰ روی هاست استفاده می‌شه.

**راه‌حل:** پورت رو عوض کن:

```yaml
nginx:
  ports:
    - "127.0.0.1:8081:80"
```

بعد از `http://127.0.0.1:8081` استفاده کن.

### مشکل دوم — فایل‌های static خطای 404 می‌دهند

**علت:** `collectstatic` اجرا نشده، یا Nginx به volume وصل نشده.

**بررسی:**

```bash
docker compose logs web | grep collectstatic
docker compose exec nginx ls /staticfiles
```

اگه خالی بود، `entrypoint.sh` یا `collectstatic` یا volume mount مشکل داره.

### مشکل سوم — عکس‌های آپلودی نمایش داده نمی‌شوند

**علت:** مشابه مشکل قبلی، ولی برای media.

**بررسی:**

```bash
docker compose exec web ls /app/media/photos
docker compose exec nginx ls /media/photos
```

اگه `web` داره ولی `nginx` نداره، volume `media_files` درست مشترک نشده.

---

## تمرین‌ها

<div align='right' dir='rtl'>

<span dir='rtl'>۱. <span dir='ltr'>`docker compose up --build`</span> رو اجرا کن و مطمئن شو هر سه سرویس بالان.</span> <br>

<span dir='rtl'>۲. یه کاربر ادمین بساز و لاگین کن.</span> <br>

<span dir='rtl'>۳. یه عکس آپلود کن. اگه خطای Permission گرفتی، `entrypoint.sh` رو بررسی کن.</span> <br>

<span dir='rtl'>۴. با <span dir='rtl'>`F12` ← <span dir='rtl'>Network</span> ← <span dir='rtl'>`style.css`</span> ← <span dir='rtl'>Response Headers</span> ← <span dir='rtl'>`Server`</span> رو چک کن. باید `nginx` باشه.</span> <br>

<span dir='rtl'>۵. یه عکس آپلود کن، توی Network، هدر `Server` عکس رو چک کن. باید `nginx` باشه.</span> <br>

<span dir='rtl'>۶. <span dir='ltr'>`docker compose exec web ls /app/media/photos`</span> رو اجرا کن. باید عکس‌هایی که آپلود کردی رو ببینی.</span> <br>

<span dir='rtl'>۷. <span dir='ltr'>`docker volume inspect 11-photo-gallery_media_files`</span> رو بزن. `Mountpoint` رو ببین.</span> <br>

<span dir='rtl'>۸. **چالش:** یه صفحه‌ی «About» به گالری اضافه کن. مسیر `/about/` تعریف کن، یه ویو بساز، یه قالب HTML جدید با <span dir='ltr'>`{% extends 'gallery/base.html' %}`</span>. تست کن که از طریق Nginx هم کار می‌کنه.</span> <br>

</div>

---

## جمع‌بندی

در این درس یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• **Gunicorn** چیه و چرا `runserver` برای محیط عملیاتی مناسب نیست.</span> <br>
<span dir='rtl'>• **Nginx** چیه و چه نقشی توی معماری پروژه داره.</span> <br>
<span dir='rtl'>• **Reverse Proxy** چیه (با مثال نگهبان و بایگانی).</span> <br>
<span dir='rtl'>• **collectstatic** چیه و چرا لازمه.</span> <br>
<span dir='rtl'>• تفاوت **static** و **media**.</span> <br>
<span dir='rtl'>• چطور `nginx.conf` بنویسیم که فایل‌های CSS و عکس‌ها رو سرو کنه.</span> <br>
<span dir='rtl'>• چطور `gosu` به ما کمک می‌کنه مالکیت volumeها رو درست کنیم.</span> <br>
<span dir='rtl'>• چطور CSRF رو برای محیط پشت Nginx تنظیم کنیم.</span> <br>
<span dir='rtl'>• تفاوت **volume نام‌دار** و **bind mount**.</span> <br>

</div>

**نکته‌ی کلیدی این درس:**

```text
کاربر ──► Nginx (نگهبان)
              │
              ├──► فایل CSS؟ خودم می‌دم (سریع)
              │
              ├──► عکس؟ خودم می‌دم (سریع)
              │
              └──► صفحه‌ی داینامیک؟ به Django می‌فرستم
                       │
                       ▼
                   Gunicorn + Django
```

این دقیقاً همون معماری محیط عملیاتیه که توی شرکت‌های واقعی استفاده می‌شه.

---

## درس بعدی

**درس ۱۲ — پروژه‌ی فرانت‌اند: React با Docker**

توی درس بعد، اولین پروژه‌ی **فرانت‌اند** رو می‌سازیم. یه اپلیکیشن React که با Docker اجرا می‌شه. یاد می‌گیریم:

<p dir='rtl'>
• React چیه و چطور با Docker کار می‌کنه <br>
• تفاوت development server و production build <br>
• چطور یه اپ React رو به یه وب‌سرور استاتیک تبدیل کنیم <br>
• چطور React رو با Nginx سرو کنیم
</p>
