<div align='right' dir='rtl'>

[🇬🇧 English](/en/13-fullstack/README.md)

</div>

# درس ۱۳ — پروژه‌ی فول‌استک: React + Django + Multi-stage Build

## مقدمه

توی درس‌های قبل، چهار پروژه ساختیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس [۹](/fa/09-django-docker/README.md):** یه API با <span dir='ltr'>Django</span> (TaskFlow)</span> <br>
<span dir='rtl'>• **درس [۱۰](/fa/10-celery-redis/README.md):** یه مانیتور URL با Celery و Redis</span> <br>
<span dir='rtl'>• **درس [۱۱](/fa/11-nginx/README.md):** یه گالری عکس با HTML و Nginx</span> <br>
<span dir='rtl'>• **درس [۱۲](/fa/12-react/README.md):** یه بورد کانبان با React (فقط فرانت)</span> <br>

</div>

هر کدوم از این‌ها یه چیز جدید یاد داد. ولی یه چیز مهم رو هنوز تجربه نکردیم: **این‌که فرانت‌اند و بک‌اند، به‌عنوان دو برنامه‌ی جدا، با هم حرف بزنن.**

توی درس ۱۱، HTML از سمت Django میومد. یعنی یه برنامه بود.

توی درس ۱۲، React بود ولی هیچ بک‌اندی نبود. یعنی یه برنامه‌ی تنها.

حالا می‌خوایم یه چیز واقعی بسازیم: **یه اپلیکیشن فول‌استک**. یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• **React** توی مرورگر کاربر اجرا می‌شه</span> <br>
<span dir='rtl'>• **Django** روی سرور اجرا می‌شه</span> <br>
<span dir='rtl'>• این دو تا **با هم حرف می‌زنن** (از طریق API)</span> <br>

</div>

و یه چیز دیگه هم یاد می‌گیریم که خیلی مهمه: **Multi-stage Build**. یعنی چطور یه Image بزرگ ۵۰۰ مگابایتی رو به ۵۰ مگابایت برسونیم، بدون اینکه چیزی از دست بره.

کدهای کامل پروژه توی <span dir='ltr'>`projects/13-recipe-book/`</span> هست.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<p dir='rtl'>
• توضیح بدی فول‌استک چیه <br>
• توضیح بدی Multi-stage Build چیه و چرا مهمه <br>
• توضیح بدی فرانت و بک چطور با هم حرف می‌زنن <br>
• توضیح بدی CORS و CSRF چی هستن <br>
• یه اپ فول‌استک کامل با Docker بسازی <br>
• حجم Image رو ۱۰ برابر کم کنی
</p>

---

## پیش‌نیازها

<p dir='rtl'>
• همه‌چیزهای درس ۹ تا ۱۲ <br>
• Node.js روی سیستم نصب باشه <br>
• آشنایی پایه با React (اگه نداری، توی درس ۱۲ توضیح دادیم)
</p>

**اگه تا الان هیچی از Docker یاد نگرفته‌ای، نگران نباش.** همه‌چیز رو از پایه توضیح می‌دم.

---

## ۱. اول یه داستان — رستوران فول‌استک

قبل از هر کد، بذار یه داستان تعریف کنم که کل پروژه رو بفهمی.

### تصور کن یه رستوران داری

**۱. سالن غذا**
اینجا مشتری‌ها می‌شینن، منو رو می‌بینن، سفارش می‌دن، و غذا رو می‌خورن. این چیزیه که مشتری **می‌بینه**.

**۲. آشپزخونه**
اینجا آشپزها غذا درست می‌کنن. مشتری نمی‌تونه وارد بشه. فقط غذا از این‌جا میاد بیرون.

**۳. انبار**
اینجا مواد اولیه نگه‌داری می‌شه (گوشت، سبزیجات، ادویه). آشپز از این‌جا مواد برمی‌داره.

**۴. گارسون**
اینه که بین سالن و آشپزخونه رفت و آمد می‌کنه. سفارش رو از مشتری می‌گیره، می‌بره آشپزخونه، غذا رو می‌آره، به مشتری می‌ده.

### حالا بیایم این رو با پروژه‌ی ما مقایسه کنیم

<div align='center' dir='rtl'>

| توی رستوران | توی پروژه‌ی ما |
|-------------|------------------|
| سالن غذا |<span dir='rtl'> **React** (فرانت‌اند) </span>|
| آشپزخونه |<span dir='rtl'> **Django** (بک‌اند) </span>|
| انبار |<span dir='rtl'> **PostgreSQL** (دیتابیس) </span>|
| گارسون |<span dir='rtl'> **Nginx** (واسطه) </span>|
| مشتری | **کاربر** |

</div>

### یعنی چی؟

<div align='right' dir='rtl'>

<span dir='rtl'>• **کاربر** توی مرورگرش سایت رو باز می‌کنه (وارد سالن می‌شه)</span> <br>
<span dir='rtl'>• **React** منو رو نشون می‌ده، دکمه‌ها رو می‌سازه (سالن غذا)</span> <br>
<span dir='rtl'>• وقتی کاربر می‌خواد دستور پخت‌ها رو ببینه، React یه درخواست می‌فرسته</span> <br>
<span dir='rtl'>• **Nginx** این درخواست رو می‌گیره و می‌بره پیش **Django** (گارسون)</span> <br>
<span dir='rtl'>• **Django** از **PostgreSQL** داده رو می‌گیره، آماده می‌کنه (آشپز از انبار مواد می‌گیره)</span> <br>
<span dir='rtl'>• جواب از همون راه برمی‌گرده به **React**</span> <br>
<span dir='rtl'>• **React** جواب رو نشون کاربر می‌ده (غذا سر میز میاد)</span> <br>

</div>

**این داستان رو یادت باشه.** هر جا گیج شدی، به این رستوران برگرد.

---

## ۲. دو مفهوم بزرگ این درس

### مفهوم اول — Fullstack چیه؟

<div align='right' dir='rtl'>

<span dir='rtl'>**Fullstack** یعنی یه اپلیکیشن که **هم فرانت‌اند داره، هم بک‌اند**.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **فرانت‌اند** = چیزی که کاربر می‌بینه (React، HTML، CSS)</span> <br>
<span dir='rtl'>• **بک‌اند** = چیزی که پشت صحنه کار می‌کنه (Django، دیتابیس)</span> <br>

</div>

یه اپ فول‌استک، یه چیز کامله که کاربر می‌تونه ازش استفاده کنه. نه فقط یه API، نه فقط یه صفحه‌ی خالی.

**تفاوت با درس‌های قبل:**

<div align='right' dir='rtl'>

<span dir='rtl'>• درس ۹: فقط بک‌اند (کاربر صفحه‌ی JSON می‌دید)</span> <br>
<span dir='rtl'>• درس ۱۲: فقط فرانت (هیچ داده‌ای نبود، همه‌چیز توی مرورگر)</span> <br>
<span dir='rtl'>• **درس ۱۳: هر دو با هم** (کاربر یه سایت واقعی می‌بینه که داده‌ها از دیتابیس میان)</span> <br>

</div>

### مفهوم دوم — Multi-stage Build چیه؟

این مفهوم رو با یه مثال ساده توضیح می‌دم.

#### داستان کیک

تصور کن می‌خوای یه کیک بپزی:

**روش اول (احمقانه):**

<div align='right' dir='rtl'>

<span dir='rtl'>• یه آشپزخونه‌ی کامل اجاره می‌کنی: فر، همزن، الک، همه‌چیز</span> <br>
<span dir='rtl'>• کیک رو می‌پزی</span> <br>
<span dir='rtl'>• **کل آشپزخونه رو با کیک می‌بری خونه‌ت!**</span> <br>
<span dir='rtl'>• الان خونه‌ت پر از فر و همزن و الکه. حجمش خیلی زیاده.</span> <br>

</div>

**روش دوم (عاقلانه):**

<div align='right' dir='rtl'>

<span dir='rtl'>• یه آشپزخونه اجاره می‌کنی (مرحله‌ی ۱)</span> <br>
<span dir='rtl'>• کیک رو می‌پزی</span> <br>
<span dir='rtl'>• **فقط کیک رو توی یه جعبه می‌ذاری** و می‌بری</span> <br>
<span dir='rtl'>• آشپزخونه رو ترک می‌کنی (مرحله‌ی ۲)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Multi-stage Build دقیقاً روش دوم هست.**</span>

</div>

### حالا توی دنیای Docker

**بدون multi-stage:**

<div align='right' dir='rtl'>

<span dir='rtl'>• Image شامل همه‌چیزه: Node.js (۱۵۰ مگابایت)، npm، کد سورس، `node_modules` (۲۰۰ مگابایت)، ابزارهای build</span> <br>
<span dir='rtl'>• حجم نهایی: **<span dir='ltr'>~۵۰۰</span> مگابایت**</span> <br>

</div>

**با multi-stage:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **مرحله‌ی ۱ (آشپزخونه):** Node.js، npm، vite، کد سورس. این‌جا React رو بیلد می‌کنه.</span> <br>
<span dir='rtl'>• **مرحله‌ی ۲ (جعبه):** فقط Nginx + خروجی بیلد. هیچ ابزاری نیست.</span> <br>
<span dir='rtl'>• حجم نهایی: **<span dir='ltr'>~۵۰</span> مگابایت**</span> <br>

</div>

**نتیجه:** <span dir='ltr'>Image</span> ۱۰ برابر کوچیک‌تره! یعنی:

<p dir='rtl'>
• سریع‌تر deploy می‌شه <br>
• پهنای باند کمتری مصرف می‌کنه <br>
• سطح حمله‌ی امنیتی کمتره <br>
• توی سرور فضای کمتری می‌گیره
</p>

---

## ۳. چطور فرانت و بک با هم حرف می‌زنن؟ (مهم‌ترین بخش)

این بخش رو با یه مثال خیلی ساده توضیح می‌دم. **این مهم‌ترین بخش کل این درسه.**

### داستان نامه‌رسانی

تصور کن می‌خوای به یه دوستت نامه بفرستی:

**۱. تو نامه رو می‌نویسی**

<p dir='rtl'>
• اسم دوستت رو می‌نویسی <br>
• آدرسش رو می‌نویسی <br>
• نامه رو می‌ذاری توی پاکت
</p>

**۲. نامه‌رسان پاکت رو می‌گیره**

<p dir='rtl'>
• می‌بینه آدرس چیه <br>
• می‌فهمه باید کجا ببره
</p>

**۳. نامه‌رسان نامه رو به دوستت می‌رسونه**

<p dir='rtl'>
• دوستت نامه رو می‌خونه <br>
• جواب می‌نویسه <br>
• به نامه‌رسان می‌ده
</p>

**۴. نامه‌رسان جواب رو برمی‌گردونه**

<p dir='rtl'>
• جواب رو به تو می‌رسونه
</p>

<div align='right' dir='rtl'>

<span dir='rtl'>**React و Django دقیقاً همین‌طورن.**</span>

</div>

### توی پروژه‌ی ما

**مرحله ۱: React درخواست می‌نویسه**

کاربر توی مرورگرش می‌ره به <span dir='ltr'>`http://127.0.0.1:8088/`</span>. React صفحه رو نشون می‌ده. ولی React هیچ داده‌ای نداره (چون کد React فقط ظاهره، نه داده).

برای همین React یه درخواست می‌فرسته:

```text
GET /api/recipes/
```

**این یعنی:** «آهای هر کسی که می‌شنوه، من لیست دستور پخت‌ها رو می‌خوام.»

**مرحله ۲: Nginx درخواست رو می‌گیره**

<p dir='rtl'>
Nginx جلوی در ورودیه. هر درخواستی که میاد، اول به Nginx می‌رسه.
</p>

<p dir='rtl'>
Nginx یه دفترچه داره که توش نوشته:
</p>

<div align='center' dir='rtl'>

|<span dir='rtl'> آدرس (URL) </span>| بره پیش کی؟ |
|-------------|--------------|
|<span dir='rtl'> `/` (صفحه اصلی) </span>|<span dir='rtl'> React (خودم سرو می‌کنم)</span> |
| <span dir='ltr'>`/api/...`</span> |<span dir='rtl'> Django (برو پیش بک‌اند) </span>|
| <span dir='ltr'>`/admin/...`</span> | Django |
| <span dir='ltr'>`/health/...`</span> | Django |
| <span dir='ltr'>`/static/...`</span> |<span dir='rtl'> فایل‌های static (از دیسک) </span>|
| <span dir='ltr'>`/media/...`</span> | عکس‌ها (از دیسک) |

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Nginx می‌بینه درخواست به <span dir='ltr'>`/api/recipes/`</span> هست. دفترچه رو نگاه می‌کنه. می‌بینه <span dir='ltr'>`/api/`</span> یعنی بره پیش Django.</span>

</div>

**مرحله ۳: Nginx درخواست رو به Django پاس می‌ده**

<div align='right' dir='rtl'>

<span dir='rtl'>Nginx درخواست رو می‌فرسته به <span dir='ltr'>`http://backend:8000/api/recipes/`</span> (این آدرس داخلیه، توی شبکه‌ی Docker).</span>

</div>

**مرحله ۴: Django داده رو آماده می‌کنه**

<p dir='rtl'>
Django درخواست رو می‌گیره. می‌گه: «کاربر لیست دستور پخت‌ها رو می‌خواد.»
</p>

<p dir='rtl'>
Django به PostgreSQL وصل می‌شه. می‌پرسه: «همه‌ی دستور پخت‌ها رو بده.»
</p>

<p dir='rtl'>
PostgreSQL همه‌ی دستور پخت‌ها رو برمی‌گردونه.
</p>

<p dir='rtl'>
Django این‌ها رو به JSON تبدیل می‌کنه:
</p>

```json
{
  "count": 1,
  "results": [
    {
      "id": 1,
      "title": "Spaghetti Carbonara",
      "category_display": "Dinner",
      "total_time_minutes": 25
    }
  ]
}
```

**مرحله ۵: Django جواب رو به Nginx می‌ده**

<p dir='rtl'>
Django این JSON رو به Nginx برمی‌گردونه.
</p>

**مرحله ۶: Nginx جواب رو به React می‌ده**

<p dir='rtl'>
<span dir='ltr'>Nginx</span> JSON رو به React برمی‌گردونه.
</p>

**مرحله ۷: React داده رو نشون می‌ده**

<p dir='rtl'>
<span dir='ltr'>React</span> JSON رو می‌گیره. کارت‌های دستور پخت رو می‌سازه و به کاربر نشون می‌ده.
</p>

### کل این ماجرا در یک نگاه

```text
کاربر ──► React ──► Nginx ──► Django ──► PostgreSQL
  │         │         │         │            │
  │         │         │         │            │
  │         │         │         │            └─► همه‌ی دستور پخت‌ها
  │         │         │         │
  │         │         │         └─► JSON
  │         │         │
  │         │         └─► JSON
  │         │
  │         └─► JSON
  │
  └─► صفحه‌ی زیبا
```

### چرا این جداسازی مهمه؟

**۱. امنیت:** دیتابیس هیچ‌وقت مستقیم به اینترنت وصل نیست. فقط Django می‌تونه بهش دسترسی داشته باشه.

**۲. سرعت:** Nginx برای فایل‌های static خیلی سریعه. اگه Django می‌خواست فایل CSS رو هم سرو کنه، کند می‌شد.

**۳. مقیاس‌پذیری:** می‌تونیم چند تا Django داشته باشیم، ولی یه Nginx جلوشون. (توی درس‌های بعدی)

**۴. توسعه‌ی جدا:** فرانت‌اند رو یه تیم می‌سازه، بک‌اند رو یه تیم دیگه. بدون درگیری.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>۴. CORS و CSRF — دو نگهبان امنیتی</span>

</div>

قبل از اینکه وارد کد بشیم، باید دو مفهوم امنیتی رو بفهمی.

<div align='right' dir='rtl'>

### <span dir='rtl'>CORS چیه؟</span>

</div>

**تصور کن:** React روی `localhost:5173` اجراست. Django روی `localhost:8000`. این‌ها دو آدرس متفاوتن (دو پورت متفاوت).

مرورگر یه قانون داره: **«اگه برنامه‌ای از یه آدرس بخواد به آدرس دیگه وصل بشه، اول باید از سرور مقصد اجازه بگیره.»**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**CORS**</span> (Cross-Origin Resource Sharing) یه مکانیزمه که به Django می‌گه: «به درخواست‌هایی که از این آدرس‌ها میان اجازه بده.»</span>

</div>

بدون <span dir='ltr'>CORS</span>، React نمی‌تونه با Django حرف بزنه. توی مرورگر خطای `CORS error` می‌بینی.

<div align='right' dir='rtl'>

### <span dir='rtl'>CSRF چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**CSRF**</span> (Cross-Site Request Forgery) یه نوع حمله‌ست:</span>

</div>

<p dir='rtl'>
• تو به سایت بانک لاگین کردی <br>
• سایت مخرب یه درخواست مخفی به بانک می‌فرسته <br>
• بانک فکر می‌کنه تو داری این کار رو می‌کنی
</p>

برای جلوگیری، Django از یه توکن مخفی استفاده می‌کنه. کاربر فقط با اون توکن می‌تونه درخواست بفرسته.

توی اپ‌های فول‌استک، React روی یه origin جدا اجراست. Django باید بدونه که این origin قابل‌اعتماده. این‌جا `CSRF_TRUSTED_ORIGINS` وارد می‌شه.

**نکته‌ی مهم:** توی پروژه‌ی ما، چون از **Nginx به‌عنوان Reverse Proxy** استفاده می‌کنیم، React و Django هر دو از یه آدرس (`localhost:8088`) سرو می‌شن. پس CORS و CSRF کمتر دردسر دارن. ولی بازم درست تنظیمشون می‌کنیم که برای حالت توسعه (وقتی React رو جدا اجرا می‌کنی) هم کار کنن.

---

## ۵. معماری نهایی

حالا که مفاهیم رو فهمیدی، بذار معماری رو ببینیم:

```text
┌─────────────────────────────────────────────────────┐
│                     کاربر                            │
│              (مرورگر روی سیستم تو)                    │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             frontend (Nginx, port 8088)             │
│                                                     │
│  دفترچه‌ی آدرس‌ها:                                    │
│  /            ──►  React static files               │
│  /api/        ──►  backend:8000                     │
│  /admin/      ──►  backend:8000                     │
│  /health/     ──►  backend:8000                     │
│  /static/     ──►  static_files volume              │
│  /media/      ──►  media_files volume               │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               backend (Django + Gunicorn)           │
│                    port 8000                        │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               db (PostgreSQL 16)                    │
│                     port 5432                       │
└─────────────────────────────────────────────────────┘
```

سه سرویس. یه volume مشترک بین backend و frontend (برای CSS و عکس‌ها).

**پورت‌های پروژه‌های دوره:**

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| **۱۳** | **Recipe Book** | **8088** |

</div>

این‌طوری هر پنج پروژه می‌تونن همزمان اجرا بشن، بدون تداخل.

---

## ۶. ساختار پوشه‌ها

```text
13-recipe-book/
├── compose.yaml            ← orchestrator (همه‌چیز رو به هم وصل می‌کنه)
├── README.md
├── README.fa.md
├── backend-django/         ← بک‌اند Django
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
└── frontend-react/         ← فرانت‌اند React
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

**یه فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو هست** که همه‌ی پروژه‌ها رو پوشش می‌ده.

**نکته:** <span dir='ltr'>`backend-django/`</span> و <span dir='ltr'>`frontend-react/`</span> کاملاً مستقلن. یعنی می‌تونی فقط بک‌اند رو اجرا کنی (برای تست API) یا فقط فرانت رو (با `npm run dev`). ولی برای تجربه‌ی کامل، از Docker Compose استفاده می‌کنی که هر دو رو با هم بالا می‌آره.

---

## ۷. فایل‌های بک‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۱. `backend-django/requirements.txt`</span>

</div>

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
Pillow==11.0.0
django-cors-headers==4.6.0
```

**هر پکیج چیه؟**

<div align='center' dir='rtl'>

| پکیج | کارش |
|------|-------|
| <span dir='ltr'>**Django**</span> | فریم‌ورک اصلی |
| <span dir='ltr'>**djangorestframework**</span> |<span dir='rtl'> برای ساختن API </span>|
| <span dir='ltr'>**psycopg[binary]**</span> |<span dir='rtl'> درایور PostgreSQL </span>|
| <span dir='ltr'>**django-environ**</span> |<span dir='rtl'> خواندن <span dir='ltr'>`.env`</span> </span>|
| <span dir='ltr'>**gunicorn**</span> |<span dir='rtl'> وب‌سرور پایتون (برای production) </span>|
| <span dir='ltr'>**Pillow**</span> |<span dir='rtl'> پردازش تصویر (برای `ImageField`) </span>|
| <span dir='ltr'>**django-cors-headers**</span> |<span dir='rtl'> **جدید: اجازه‌ی درخواست از React** </span>|

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`django-cors-headers` جدیده چون React از یه آدرس دیگه به API وصل می‌شه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۲. `backend-django/.env.example`</span>

</div>

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (for React frontend)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8088
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8088

# PostgreSQL
POSTGRES_DB=recipebook
POSTGRES_USER=recipebook
POSTGRES_PASSWORD=recipebook_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432
```

**چرا دو تا آدرس برای CORS؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`localhost:5173`</span> = Vite dev server (توسعه، وقتی React رو با `npm run dev` اجرا می‌کنی)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`localhost:8088`</span> = Nginx (وقتی کل استک رو با Docker اجرا می‌کنی)</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۳. `backend-django/config/settings.py` — بخش‌های مهم</span>

</div>

فایل خیلی بزرگه، فقط بخش‌های مهم رو توضیح می‌دم:

```python
import environ
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    # ...
    'rest_framework',
    'corsheaders',      # ← جدید
    'recipes',
]

MIDDLEWARE = [
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'corsheaders.middleware.CorsMiddleware',   # ← باید قبل از CommonMiddleware باشه
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    # ...
]

# CORS — اجازه به React برای صدا زدن API
CORS_ALLOWED_ORIGINS = env.list(
    'CORS_ALLOWED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:8088'],
)

# CSRF — اعتماد به React برای درخواست‌های تغییردهنده
CSRF_TRUSTED_ORIGINS = env.list(
    'CSRF_TRUSTED_ORIGINS',
    default=['http://localhost:5173', 'http://localhost:8088'],
)

# Media files (photos)
MEDIA_URL = 'media/'
MEDIA_ROOT = BASE_DIR / 'media'

# Static files (admin CSS)
STATIC_URL = 'static/'
STATIC_ROOT = BASE_DIR / 'staticfiles'
```

**مهم‌ترین تغییرات:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`corsheaders` توی `INSTALLED_APPS`** — فعال‌کردن پکیج</span> <br>
<span dir='rtl'>• **`CorsMiddleware` قبل از `CommonMiddleware`** — ترتیب مهمه! اگه برعکس باشه، خطا می‌ده</span> <br>
<span dir='rtl'>• **`CORS_ALLOWED_ORIGINS`** — به Django می‌گه React از این آدرس‌ها می‌تونه وصل بشه</span> <br>
<span dir='rtl'>• **`CSRF_TRUSTED_ORIGINS`** — به Django می‌گه به درخواست‌های تغییردهنده از این آدرس‌ها اعتماد کن</span> <br>
<span dir='rtl'>• **`MEDIA_URL` و `MEDIA_ROOT`** — برای عکس‌های غذا</span> <br>
<span dir='rtl'>• **`STATIC_URL` و `STATIC_ROOT`** — برای CSS ادمین</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۴. `backend-django/config/urls.py`</span>

</div>

```python
from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('recipes.urls')),
]

# In development, Django serves media files itself.
# In production, Nginx handles this.
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
```

**سه مسیر اصلی:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/admin/`</span> — پنل ادمین Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/health/`</span> — Endpoint سلامت (برای Docker healthcheck)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/api/`</span> — API (به `recipes/urls.py` وصل می‌شه)</span> <br>

</div>

**بخش <span dir='ltr'>`if settings.DEBUG`:</span>** توی حالت توسعه، Django خودش عکس‌ها رو سرو می‌کنه. توی <span dir='ltr'>production</span>، Nginx این کار رو می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۵. `backend-django/recipes/models.py`</span>

</div>

```python
from django.db import models


class Recipe(models.Model):
    class Category(models.TextChoices):
        BREAKFAST = 'breakfast', 'Breakfast'
        LUNCH = 'lunch', 'Lunch'
        DINNER = 'dinner', 'Dinner'
        DESSERT = 'dessert', 'Dessert'
        SNACK = 'snack', 'Snack'

    class Difficulty(models.TextChoices):
        EASY = 'easy', 'Easy'
        MEDIUM = 'medium', 'Medium'
        HARD = 'hard', 'Hard'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    ingredients = models.TextField()
    instructions = models.TextField()
    category = models.CharField(max_length=20, choices=Category.choices, default=Category.DINNER)
    difficulty = models.CharField(max_length=10, choices=Difficulty.choices, default=Difficulty.EASY)
    prep_time_minutes = models.PositiveIntegerField(default=0)
    cook_time_minutes = models.PositiveIntegerField(default=0)
    servings = models.PositiveIntegerField(default=1)
    photo = models.ImageField(upload_to='recipes/%Y/%m/', blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self) -> str:
        return self.title

    @property
    def total_time_minutes(self) -> int:
        return self.prep_time_minutes + self.cook_time_minutes
```

**مدل چیه؟** یه کلاس پایتونه که **معادل یه جدول توی دیتابیس**ه. Django خودش از روی این کلاس، جدول می‌سازه.

**فیلدهای مهم:**

<div align='center' dir='rtl'>

| فیلد | چیه |
|-------|------|
| `title` | عنوان دستور پخت |
| `description` | توضیح کوتاه |
| `ingredients` | مواد لازم (هر خط یه ماده) |
| `instructions` | مراحل پخت (هر خط یه مرحله) |
| `category` | دسته‌بندی (صبحانه، ناهار، شام...) |
| `difficulty` | سختی |
| `photo` | عکس غذا |
| `prep_time_minutes` | زمان آماده‌سازی |
| `cook_time_minutes` | زمان پخت |

</div>

<div align='right' dir='rtl'>

<span  dir='rtl'>**<span dir='ltr'>`@property total_time_minutes`</span>** — یه فیلد محاسباتی. توی دیتابیس ذخیره نمی‌شه، ولی هر وقت لازم شد، جمع prep + cook رو برمی‌گردونه.</span>

</div>

<div align='right' dir='rtl'>

<span  dir='rtl'>**<span dir='ltr'>`upload_to='recipes/%Y/%m/'`</span>** — عکس‌ها توی <span dir='ltr'>`media/recipes/2025/10/`</span> ذخیره می‌شن (ساله/ماهه). این‌طوری هزاران عکس توی یه پوشه جمع نمی‌شن.</span>

</div>

<div align='right' dir='rtl'>

### <span  dir='rtl'>۷.۶. `backend-django/recipes/serializers.py`</span>

</div>

```python
from rest_framework import serializers
from .models import Recipe


class RecipeSerializer(serializers.ModelSerializer):
    category_display = serializers.CharField(source='get_category_display', read_only=True)
    difficulty_display = serializers.CharField(source='get_difficulty_display', read_only=True)

    class Meta:
        model = Recipe
        fields = [
            'id', 'title', 'description', 'ingredients', 'instructions',
            'category', 'category_display',
            'difficulty', 'difficulty_display',
            'prep_time_minutes', 'cook_time_minutes', 'total_time_minutes',
            'servings', 'photo', 'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']
```

**سریالایزر چیه؟** یه **مترجم**:

<div align='right' dir='rtl'>

<span dir='rtl'>• **به سمت بیرون:** شیء پایتون ← JSON (برای فرستادن به React)</span> <br>
<span dir='rtl'>• **به سمت داخل:** JSON (از React) ← شیء پایتون (برای ذخیره در دیتابیس)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`category_display` و `difficulty_display`** — چرا اضافه کردیم؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`category` مقدار `'breakfast'` رو ذخیره می‌کنه. React می‌خواد `'Breakfast'` (با B بزرگ) ببینه. Django این تبدیل رو با `get_category_display` انجام می‌ده. این‌طوری React لازم نیست خودش label بسازه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`photo`** — جنگو خودش `ImageField` رو به URL تبدیل می‌کنه. React آدرس <span dir='ltr'>`/media/recipes/.../photo.jpg`</span> می‌گیره، نه فایل خام.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۷. `backend-django/recipes/views.py`</span>

</div>

```python
from rest_framework import filters, viewsets
from .models import Recipe
from .serializers import RecipeSerializer


class RecipeViewSet(viewsets.ModelViewSet):
    queryset = Recipe.objects.all()
    serializer_class = RecipeSerializer
    filter_backends = [filters.SearchFilter, filters.OrderingFilter]
    search_fields = ['title', 'description', 'ingredients']
    ordering_fields = ['created_at', 'title', 'prep_time_minutes']
    ordering = ['-created_at']

    def get_queryset(self):
        queryset = super().get_queryset()
        category = self.request.query_params.get('category')
        difficulty = self.request.query_params.get('difficulty')
        if category:
            queryset = queryset.filter(category=category)
        if difficulty:
            queryset = queryset.filter(difficulty=difficulty)
        return queryset
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`ModelViewSet` چیه؟** یه کلاس آماده که **شش اندپوینت** رو خودکار می‌سازه:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`GET /api/recipes/`</span> — لیست همه</span> <br>
<span dir='rtl'>• <span dir='ltr'>`POST /api/recipes/`</span> — ساخت یکی</span> <br>
<span dir='rtl'>• <span dir='ltr'>`GET /api/recipes/{id}/`</span> — دیدن یکی</span> <br>
<span dir='rtl'>• <span dir='ltr'>`PUT /api/recipes/{id}/`</span> — ویرایش کامل</span> <br>
<span dir='rtl'>• <span dir='ltr'>`PATCH /api/recipes/{id}/`</span> — ویرایش جزئی</span> <br>
<span dir='rtl'>• <span dir='ltr'>`DELETE /api/recipes/{id}/`</span> — حذف یکی</span> <br>

</div>

**فیلترها:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`SearchFilter`</span> — وقتی React `?search=pasta` می‌فرسته، توی `title`، `description`، `ingredients` جستجو می‌کنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>`OrderingFilter`</span> — وقتی React `?ordering=title` می‌فرسته، مرتب می‌کنه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`get_queryset`** — وقتی <span dir='ltr'>React</span> <span dir='ltr'>`?category=dinner`</span> می‌فرسته، فیلتر می‌کنه.</span>

</div>

**نتیجه:** با یه `ModelViewSet` و چند خط فیلتر، React می‌تونه:

<p dir='rtl'>
• جستجو کنه <br>
• فیلتر کنه <br>
• مرتب کنه
</p>

همه از **همون یه endpoint** با query parameter.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۸. `backend-django/recipes/urls.py`</span>

</div>

```python
from rest_framework.routers import DefaultRouter
from .views import RecipeViewSet

router = DefaultRouter()
router.register(r'recipes', RecipeViewSet, basename='recipe')

urlpatterns = router.urls
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`DefaultRouter`** — یه ابزار DRF که مسیرها رو خودکار می‌سازه. به‌جای نوشتن دستی <span dir='ltr'>`/api/recipes/`</span>، <span dir='ltr'>`/api/recipes/1/`</span>، و...، فقط می‌گیم <span dir='ltr'>`router.register(...)`</span>.</span>

</div>

**نتیجه:** DRF خودش این مسیرها رو می‌سازه:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/api/recipes/`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>`/api/recipes/{id}/`</span></span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۹. `backend-django/recipes/admin.py`</span>

</div>

```python
from django.contrib import admin
from django.utils.html import format_html
from .models import Recipe


@admin.register(Recipe)
class RecipeAdmin(admin.ModelAdmin):
    list_display = ('thumbnail', 'title', 'category', 'difficulty', 'total_time_minutes', 'created_at')
    list_filter = ('category', 'difficulty')
    search_fields = ('title', 'description', 'ingredients')
    date_hierarchy = 'created_at'

    @admin.display(description='Photo')
    def thumbnail(self, obj):
        if not obj.photo:
            return '—'
        return format_html(
            '<img src="{}" style="height:50px;width:50px;object-fit:cover;border-radius:6px;" />',
            obj.photo.url,
        )
```

این تنظیمات پنل ادمین رو زیباتر می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`list_display`** — چه ستون‌هایی توی لیست دیده بشن (با پیش‌نمایش عکس)</span> <br>
<span dir='rtl'>• **`list_filter`** — فیلتر کنار صفحه</span> <br>
<span dir='rtl'>• **`search_fields`** — جستجو</span> <br>
<span dir='rtl'>• **`thumbnail`** — یه ستون سفارشی برای پیش‌نمایش عکس</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`format_html` یه ابزار امن جنگوئه که HTML رو بدون خطر XSS می‌سازه.</span>

</div>

---

## ۸. فایل‌های فرانت‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۱. `frontend-react/package.json`</span>

</div>

```json
{
  "name": "frontend-react",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  },
  "dependencies": {
    "axios": "^1.x.x",
    "lucide-react": "^0.x.x",
    "react": "^19.x.x",
    "react-dom": "^19.x.x"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.x.x",
    "@vitejs/plugin-react": "^4.x.x",
    "tailwindcss": "^4.x.x",
    "vite": "^6.x.x"
  }
}
```

**تفاوت با درس ۱۲:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`axios`</span> اضافه شده (برای فرستادن درخواست به Django)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`@dnd-kit`</span> و پکیج‌هاش حذف شدن (لازم نیستن)</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۲. `frontend-react/vite.config.js`</span>

</div>

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    proxy: {
      '/api': 'http://localhost:8000',
      '/media': 'http://localhost:8000',
    },
  },
})
```

**این فایل مهم‌ترین قسمت این درس رو نشون می‌ده.**

<div align='right' dir='rtl'>

<span dir='rtl'>**`proxy` چیه؟**</span>

</div>

توی حالت توسعه، React روی `localhost:5173` اجراست، Django روی `localhost:8000`. اگه React بخواد به Django وصل بشه، مرورگر CORS error می‌ده.

**راه‌حل:** Vite یه proxy راه می‌ندازه. یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• React درخواست به `/api/recipes/` می‌فرسته (آدرس نسبی)</span> <br>
<span dir='rtl'>• Vite این رو می‌گیره، تبدیل می‌کنه به <span dir='ltr'>`http://localhost:8000/api/recipes/`</span></span> <br>
<span dir='rtl'>• از دید مرورگر، همه‌چیز از `localhost:5173` میاد (پس CORS لازم نیست)</span> <br>

</div>

**چرا این مهمه؟** چون React همیشه با آدرس‌های نسبی کار می‌کنه. یعنی کد یکسان در dev و prod کار می‌کنه.

توی <span dir='ltr'>prod</span>، **Nginx** همین نقش رو بازی می‌کنه. یعنی `/api/` رو به backend پاس می‌ده.

**نتیجه:** React هیچ‌وقت نمی‌دونه Django کجاست. فقط <span dir='ltr'>`/api/...`</span> صدا می‌زنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۳. `frontend-react/src/api.js` — نقطه‌ی اتصال</span>

</div>

```js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const recipeApi = {
  list: async (params = {}) => {
    const response = await api.get('/recipes/', { params })
    return response.data.results || response.data
  },

  detail: async (id) => {
    const response = await api.get(`/recipes/${id}/`)
    return response.data
  },
}

export default api
```

**این فایل، تنها جاییه که با Django حرف می‌زیم.** هر جای دیگه‌ای که داده بخوایم، از این استفاده می‌کنیم.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`baseURL: '/api'`</span>** — هر درخواست با <span dir='ltr'>`/api`</span> شروع می‌شه. یعنی <span dir='ltr'>`api.get('/recipes/')`</span> می‌شه <span dir='ltr'>`GET /api/recipes/`</span>.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`list`** — لیست دستور پخت‌ها. `params` می‌تونه <span dir='ltr'>`search`</span>، <span dir='ltr'>`category`</span>، <span dir='ltr'>`difficulty`</span> داشته باشه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`response.data.results || response.data`</span>** — DRF به‌طور پیش‌فرض صفحه‌بندی می‌کنه. جواب این‌طوری میاد:</span>

</div>

```json
{
  "count": 5,
  "next": null,
  "previous": null,
  "results": [...]
}
```

پس `results` رو برمی‌گردونیم. `||` هم برای اطمینان (اگه صفحه‌بندی خاموش بود).

<div align='right' dir='rtl'>

<span dir='rtl'>**`detail`** — جزئیات یه دستور پخت.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۴. `frontend-react/src/App.jsx` — قلب فرانت</span>

</div>

```jsx
import { useEffect, useState } from 'react'
import Header from './components/Header'
import SearchBar from './components/SearchBar'
import CategoryFilter from './components/CategoryFilter'
import RecipeCard from './components/RecipeCard'
import RecipeDetail from './components/RecipeDetail'
import Loading from './components/Loading'
import { recipeApi } from './api'

export default function App() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('')
  const [selectedRecipe, setSelectedRecipe] = useState(null)

  useEffect(() => {
    let cancelled = false
    setLoading(true)

    const params = {}
    if (search) params.search = search
    if (category) params.category = category

    recipeApi
      .list(params)
      .then(data => {
        if (!cancelled) setRecipes(data)
      })
      .catch(err => {
        if (!cancelled) setError(err.message)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [search, category])

  const handleSelectRecipe = async (id) => {
    try {
      const recipe = await recipeApi.detail(id)
      setSelectedRecipe(recipe)
    } catch (err) {
      setError(err.message)
    }
  }

  return (
    <div className="min-h-screen">
      <Header />

      {selectedRecipe ? (
        <RecipeDetail recipe={selectedRecipe} onBack={() => setSelectedRecipe(null)} />
      ) : (
        <main className="max-w-7xl mx-auto px-6 py-8">
          <h1 className="text-4xl font-bold text-white mb-8">Recipe Book</h1>

          <div className="flex gap-4 mb-8">
            <SearchBar value={search} onChange={setSearch} />
            <CategoryFilter value={category} onChange={setCategory} />
          </div>

          {loading ? (
            <Loading />
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recipes.map(recipe => (
                <RecipeCard
                  key={recipe.id}
                  recipe={recipe}
                  onClick={() => handleSelectRecipe(recipe.id)}
                />
              ))}
            </div>
          )}
        </main>
      )}
    </div>
  )
}
```

**هر بخش چیه؟**

<div align='right' dir='rtl'>

<span dir='rtl'>**Stateها:**</span>

</div>

<div align='center' dir='rtl'>

| State | چیه |
|--------|------|
| `recipes` | لیست دستور پخت‌ها |
| `loading` | آیا در حال لود هستیم؟ |
| `error` | پیام خطا |
| `search` | متن جستجو |
| `category` | دسته‌بندی انتخاب‌شده |
| `selectedRecipe` | دستور پختی که کاربر باز کرده |

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`useEffect`** — هر بار که `search` یا `category` تغییر کرد، این effect اجرا می‌شه و از API درخواست می‌فرسته.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`cancelled`** — یه الگوی مهم. اگه کاربر سریع تایپ کنه، چند درخواست موازی می‌ره. اگه درخواست قدیمی بعد از جدید برگرده، ممکنه data قدیمی نمایش داده بشه. با `cancelled`، جواب‌های قدیمی نادیده گرفته می‌شن.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`handleSelectRecipe`** — وقتی کاربر روی یه کارت کلیک می‌کنه، این تابع صدا زده می‌شه. `id` می‌گیره، جزئیات کامل رو از API می‌گیره، توی `selectedRecipe` می‌ذاره.</span>

</div>

**رندر:**

<div align='right' dir='rtl'>

<span dir='rtl'>• اگه `selectedRecipe` هست ← صفحه‌ی جزئیات</span> <br>
<span dir='rtl'>• وگرنه ← صفحه‌ی لیست با گرید دستور پخت‌ها</span> <br>

</div>

### ۸.۵. کامپوننت‌ها

هفت کامپوننت هست، همه ساده:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`Header`** — نوار بالای صفحه با آیکن آشپز</span> <br>
<span dir='rtl'>• **`SearchBar`** — فیلد جستجو</span> <br>
<span dir='rtl'>• **`CategoryFilter`** — دکمه‌های دسته‌بندی</span> <br>
<span dir='rtl'>• **`RecipeCard`** — کارت هر دستور پخت (عکس، عنوان، برچسب اولویت)</span> <br>
<span dir='rtl'>• **`RecipeDetail`** — صفحه‌ی جزئیات (عکس بزرگ، مواد، مراحل)</span> <br>
<span dir='rtl'>• **`Loading`** — اسپینر</span> <br>

</div>

هر کامپوننت رو توی فایل جداگانه ساختیم و از <span dir='ltr'>`App.jsx`</span> import کردیم. این یه الگوی استاندارده.

<div align='right' dir='rtl'>

<span dir='rtl'>**`RecipeCard` و `RecipeDetail`** مهم‌ترین‌ها هستن. توی `RecipeDetail`، مواد و مراحل با <span dir='ltr'>`.split('\n')`</span> به آرایه تبدیل می‌شن:</span>

</div>

```jsx
{recipe.ingredients
  .split('\n')
  .filter(item => item.trim())
  .map((item, i) => (
    <li key={i}>{item}</li>
  ))}
```

چون کاربر توی ادمین مواد رو خط‌به‌خط وارد می‌کنه، این‌جا هم هر خط رو یه آیتم جداگانه نشون می‌دیم.

---

## ۹. فایل‌های Docker — قلب پروژه

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۱. `backend-django/Dockerfile`</span>

</div>

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

**این همون Dockerfile درس ۱۱ هست، با یه تفاوت:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`gosu` اضافه شد** — برای اینکه entrypoint بتونه مالکیت volumeها رو درست کنه</span> <br>
<span dir='rtl'>• **`CMD` با Gunicorn** — نه `runserver`</span> <br>

</div>

**چرا `gosu`؟** یادت باشه توی درس ۱۱ توضیح دادیم: Docker حجم‌های نام‌دار رو با `root` می‌سازه. برای اینکه `appuser` بتونه توشون بنویسه، entrypoint اول با root مالکیت رو درست می‌کنه، بعد به `appuser` سوییچ می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۲. `backend-django/entrypoint.sh`</span>

</div>

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

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`if [ "$(id -u)" = "0" ]`**</span> — اگه با root اجرا می‌شیم...</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`chown -R appuser:appuser /app/staticfiles /app/media`**</span> — مالکیت volumeها رو به `appuser` بده</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`exec gosu appuser "$0" "$@"`**</span> — خودت رو با `appuser` دوباره اجرا کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`migrate`**</span> — مایگریشن‌ها رو اعمال کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`collectstatic`**</span> — CSS ادمین رو جمع کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`exec "$@"`**</span> — دستور اصلی (Gunicorn) رو اجرا کن</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۳. `frontend-react/Dockerfile` — **قلب این درس**</span>

</div>

```dockerfile
# ============================================================
# Stage 1: Build the React app
# ============================================================
FROM node:22-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

RUN npm run build

# ============================================================
# Stage 2: Serve the built files with Nginx
# ============================================================
FROM nginx:1.27-alpine

COPY --from=builder /app/dist /usr/share/nginx/html

COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

**این فایل، جادوی main این درسه. بذار خط به خط توضیح بدم:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`FROM node:22-alpine AS builder`**</span> — شروع مرحله‌ی ۱. اسمش رو می‌ذاریم `builder` (آشپزخونه).</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`RUN npm ci`**</span> — پکیج‌ها رو نصب می‌کنه. `ci` سریع‌تر و قابل‌اعتمادتر از `install` هست.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`RUN npm run build`**</span> — React رو بیلد می‌کنه. خروجی می‌ره توی <span dir='ltr'>`/app/dist/`</span> (فایل‌های HTML/CSS/JS).</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`FROM nginx:1.27-alpine`**</span> — **خط جادویی.** شروع مرحله‌ی ۲. **builder رو کاملاً فراموش می‌کنه.** Image جدید از صفر با Nginx.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`COPY --from=builder /app/dist /usr/share/nginx/html`**</span> — **این جادوی اصلیه.** فقط پوشه‌ی `dist` رو از مرحله‌ی ۱ کپی می‌کنه. هیچ‌چیز دیگه‌ای (<span dir='ltr'>Node.js</span>، `node_modules`، کد سورس) کپی نمی‌شه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`CMD ["nginx", "-g", "daemon off;"]`**</span> — Nginx رو در foreground اجرا می‌کنه. `daemon off` یعنی «به‌عنوان daemon اجرا نشو، بذار PID 1 باشم». بدون این خط، Nginx سریع می‌میره.</span>

</div>

**نتیجه‌ی مقایسه:**

<div align='center' dir='rtl'>

| مرحله | حجم |
|--------|------|
| Stage 1 (`builder`) | <span dir='ltr'>~۵۰۰</span> مگابایت |
| **Stage 2 (نهایی)** | **<span dir='ltr'>~۵۰</span> مگابایت** |

</div>

مرحله‌ی ۱ **توی Image نهایی نیست.** فقط مرحله‌ی ۲ می‌مونه. این ۱۰ برابر کوچیک‌تره!

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۴. `frontend-react/nginx.conf` — دفترچه‌ی Nginx</span>

</div>

```nginx
upstream backend {
    server backend:8000;
}

server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    root /usr/share/nginx/html;
    index index.html;

    # React static files + SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # API → Django
    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Admin → Django
    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Health check → Django
    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static files
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
    }

    # Recipe photos
    location /media/ {
        alias /app/media/;
        expires 7d;
    }
}
```

**این فایل دقیقاً همون کاری رو می‌کنه که Vite proxy توی dev می‌کرد، ولی برای production.**

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`upstream backend`**</span> — به Nginx می‌گه «backend روی `backend:8000` هست» (توی شبکه‌ی Docker)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`listen 80`**</span> — Nginx روی پورت ۸۰ داخل کانتینر گوش می‌ده (Docker پورت ۸۰ کانتینر رو به ۸۰۸۸ هاست map می‌کنه)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`try_files $uri $uri/ /index.html`**</span> — **مهم‌ترین خط برای React.** اگه فایل با اون اسم هست، بده. اگه نیست، `index.html` رو بده. این باعث می‌شه React SPA routing کار کنه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /api/`**</span> — درخواست‌های API به Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /admin/`**</span> — پنل ادمین به Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /health/`**</span> — Endpoint سلامت به Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /static/`**</span> — فایل‌های <span dir='ltr'>static</span> Django از دیسک</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /media/`**</span> — عکس‌های غذا از دیسک</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`$http_host`</span> vs <span dir='ltr'>`$host`</span>:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`$host`</span> = دامنه بدون پورت (`127.0.0.1`)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`$http_host`</span> = دامنه با پورت (`127.0.0.1:8088`)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`$http_host`</span> درسته چون با `Origin` مرورگر مطابقت داره (برای CSRF).</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۵. `compose.yaml` — orchestrator</span>

</div>

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-recipebook}
      POSTGRES_USER: ${POSTGRES_USER:-recipebook}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-recipebook_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-recipebook} -d ${POSTGRES_DB:-recipebook}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  backend:
    build:
      context: ./backend-django
    environment:
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8088}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8088}
      POSTGRES_DB: ${POSTGRES_DB:-recipebook}
      POSTGRES_USER: ${POSTGRES_USER:-recipebook}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-recipebook_dev_password}
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

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8088:80"
    volumes:
      - static_files:/app/staticfiles:ro
      - media_files:/app/media:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
  media_files:
```

**سه سرویس:**

<div align='center' dir='rtl'>

| سرویس | چی | چرا |
|--------|----|-----|
| `db` | PostgreSQL | داده |
| `backend` | Django + Gunicorn | منطق |
| `frontend` | Nginx + React build |<span dir='rtl'> ظاهر + Reverse Proxy </span>|

</div>

**سه volume:**

<div align='center' dir='rtl'>

| Volume | نوشته شده توسط | خوانده شده توسط | چیه |
|--------|------------------|-------------------|------|
| `postgres_data` | `db` | `db` | دیتابیس |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) |<span dir='rtl'> CSS ادمین </span>|
| `media_files` | `backend` (uploads) | `frontend` (Nginx) | عکس غذاها |

</div>

**نکته‌ی کلیدی:** `static_files` و `media_files` بین `backend` و `frontend` مشترکن. چرا؟

<div align='right' dir='rtl'>

<span dir='rtl'>• Django با `collectstatic` فایل‌های static رو توی <span dir='ltr'>`/app/staticfiles`</span> می‌ذاره</span> <br>
<span dir='rtl'>• Django وقتی کاربر عکس آپلود می‌کنه، توی <span dir='ltr'>`/app/media`</span> می‌ذاره</span> <br>
<span dir='rtl'>• Nginx (توی `frontend`) از همین volumeها می‌خونه و سرو می‌کنه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`:ro`</span>** — <span dir='ltr'>read-only</span>. Nginx فقط می‌خونه، نمی‌نویسه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`depends_on` با `condition`:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `backend` صبر می‌کنه تا `db` سالم بشه</span> <br>
<span dir='rtl'>• `frontend` صبر می‌کنه تا `backend` سالم بشه</span> <br>

</div>

این تضمین می‌کنه همه‌چیز به ترتیب درست بالا بیاد.

---

## ۱۰. اجرا

از داخل <span dir='ltr'>`13-recipe-book/`</span>:

```bash
docker compose up --build
```

### چی انتظار داری ببینی

**مرحله‌ی build backend:**

```text
 => [1/7] FROM python:3.12-slim
 => [2/7] WORKDIR /app
 => [3/7] RUN apt-get update ...
 => [4/7] COPY requirements.txt .
 => [5/7] RUN pip install -r requirements.txt
 => [6/7] COPY . .
 => [7/7] RUN mkdir -p ... useradd ...
 => naming to docker.io/library/13-recipe-book-backend
```

**مرحله‌ی build frontend — این مهمه:**

```text
 => [stage-1 1/6] FROM node:22-alpine AS builder
 => [stage-1 2/6] WORKDIR /app
 => [stage-1 3/6] COPY package*.json ./
 => [stage-1 4/6] RUN npm ci
 => [stage-1 5/6] COPY . .
 => [stage-1 6/6] RUN npm run build
 ✓ built in 4.20s
 => [stage-2 1/4] FROM nginx:1.27-alpine
 => [stage-2 2/4] COPY --from=builder /app/dist /usr/share/nginx/html
 => [stage-2 3/4] COPY nginx.conf /etc/nginx/conf.d/default.conf
 => naming to docker.io/library/13-recipe-book-frontend
```

**دقت کن به `stage-1` و `stage-2`.** دو مرحله‌ی جدا. مرحله‌ی دوم فقط از مرحله‌ی اول `dist` رو کپی کرد.

**مرحله‌ی start:**

```text
 ✔ Container 13-recipe-book-db-1        Healthy
 ✔ Container 13-recipe-book-backend-1   Healthy
 ✔ Container 13-recipe-book-frontend-1  Started
```

**مرحله‌ی لاگ:**

```text
backend-1   | Fixing volume permissions...
backend-1   | Applying database migrations...
backend-1   | Collecting static files...
backend-1   | Starting: gunicorn -c gunicorn.conf.py config.wsgi:application
frontend-1  | /docker-entrypoint.sh: Configuration complete; ready for start up
```

---

## ۱۱. تست — پنج تست مهم

### تست ۱ — Endpoint سلامت

```text
http://127.0.0.1:8088/health/
```

باید ببینی:

```json
{"status": "ok"}
```

اگه این کار کرد، Nginx به backend وصل شده. ✅

### تست ۲ — صفحه‌ی اصلی

```text
http://127.0.0.1:8088/
```

باید صفحه‌ی «Recipe Book» با تم تاریک ببینی:

<p dir='rtl'>
• هدر با آیکن آشپز <br>
• فیلد جستجو <br>
• دکمه‌های دسته‌بندی <br>
• پیام «No recipes found» (چون هنوز دستور پختی نیست)
</p>

**اگه این صفحه رو دیدی، React از طریق Nginx سرو می‌شه.** ✅

### تست ۳ — API مستقیم

```text
http://127.0.0.1:8088/api/recipes/
```

باید صفحه‌ی DRF با یه لیست خالی ببینی.

**اگه این کار کرد، Nginx داره `/api/` رو به backend پروکسی می‌کنه.** ✅

### تست ۴ — ساخت کاربر ادمین

توی ترمینال دیگه:

```bash
docker compose exec backend python manage.py createsuperuser
```

یه <span dir='ltr'>username</span>، email (خالی)، و password بذار.

بعد به <span dir='ltr'>`http://127.0.0.1:8088/admin/`</span> برو و لاگین کن.

### تست ۵ — آپلود دستور پخت

توی پنل ادمین:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**Recipes**</span> ← **ADD RECIPE**</span> <br>
<span dir='rtl'>• پر کن:</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Title</span>:** `Spaghetti Carbonara`</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Ingredients</span>:** (هر خط یه ماده)</span> <br>

    ```
    400g spaghetti
    200g pancetta
    4 egg yolks
    100g parmesan
    Black pepper
    ```

  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Instructions</span>:**</span> <br>
  
    ```
    Boil pasta in salted water
    Fry pancetta until crispy
    Mix eggs with parmesan
    Combine everything off heat
    Serve immediately
    ```
  
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Category</span>:** Dinner</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Difficulty</span>:** Medium</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Prep time</span>:** 10</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Cook time</span>:** 15</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Servings</span>:** 4</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ **<span dir='ltr'>Photo</span>:** یه عکس انتخاب کن</span> <br>

<span dir='rtl'>**SAVE** بزن.</span> <br>

</div>

برگرد به <span dir='ltr'>`http://127.0.0.1:8088/`</span>. باید کارت اسپاگتی کاربونارا رو ببینی. روی کارت کلیک کن. صفحه‌ی جزئیات با مواد و مراحل باز می‌شه.

### تست ۶ — جادوی اصلی: حجم Image

```bash
docker images | Select-String "13-recipe-book"
```

باید چیزی شبیه این ببینی:

```text
13-recipe-book-frontend   latest   ...   ~50MB
13-recipe-book-backend    latest   ...   ~250MB
```

**دقت کن:** `frontend` فقط **<span dir='ltr'>~۵۰</span> مگابایت** است (نه ۵۰۰!). این یعنی multi-stage build درست کار کرده.

**مقایسه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• بدون multi-stage: <span dir='ltr'>~۵۰۰</span> مگابایت</span> <br>
<span dir='rtl'>• با multi-stage: **<span dir='ltr'>~۵۰</span> مگابایت**</span> <br>

</div>

**۱۰ برابر کوچیک‌تر!** 🎯

---

## ۱۲. مشکلات رایج

### مشکل ۱ — <span dir='ltr'>`/health/`</span> به‌جای <span dir='ltr'>`{"status": "ok"}`</span> صفحه‌ی React رو نشون می‌ده

**علت:** Nginx بلاک <span dir='ltr'>`location /health/`</span> نداره، پس درخواست به <span dir='ltr'>`location /`</span> می‌افته و <span dir='ltr'>`index.html`</span> React رو سرو می‌کنه.

**راه‌حل:** بلاک <span dir='ltr'>`location /health/`</span> رو به `nginx.conf` اضافه کن:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### مشکل ۲ — CSRF verification failed هنگام لاگین

**علت:** جنگو ۴.۰+ هدر `Origin` رو بررسی می‌کنه. درخواست از `127.0.0.1:8088` رد می‌شه.

**راه‌حل:** `CSRF_TRUSTED_ORIGINS` رو توی <span dir='ltr'>`.env`</span> ست کن:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8088,http://127.0.0.1:8088
```

و توی `nginx.conf`، از <span dir='ltr'>`$http_host`</span> استفاده کن (نه <span dir='ltr'>`$host`</span>).

### مشکل ۳ — Permission denied هنگام آپلود عکس

**علت:** Docker حجم‌های نام‌دار رو با `root` می‌سازه. `appuser` نمی‌تونه بنویسه.

**راه‌حل:** `entrypoint.sh` باید از `gosu` استفاده کنه (توضیح داده شده).

### مشکل ۴ — عکس‌ها لود نمی‌شن

**بررسی:**

```bash
docker compose exec backend ls /app/media/recipes/
docker compose exec frontend ls /app/media/recipes/
```

هر دو باید عکس رو نشون بدن. اگه یکی خالی بود، <span dir='ltr'>volume</span> `media_files` مشکل داره.

### مشکل ۵ — پورت ۸۰۸۸ در استفاده است

پورت هاست رو عوض کن:

```yaml
frontend:
  ports:
    - "127.0.0.1:8089:80"
```

### مشکل ۶ — Image فرانت‌اند بزرگه

**بررسی:**

```bash
docker images | grep 13-recipe-book-frontend
```

اگه بیشتر از ۱۰۰ مگابایته، multi-stage build درست اجرا نشده. `docker compose build frontend` بزن و توی خروجی دنبال `stage-1` و `stage-2` بگرد.

---

## ۱۳. اجرا در کنار بقیه‌ی پروژه‌ها

این پروژه روی پورت **۸۰۸۸** طراحی شده که کنار بقیه اجرا بشه:

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| **۱۳** | **Recipe Book** | **8088** |

</div>

می‌تونی همه رو همزمان بالا بیاری:

```bash
cd projects/09-taskflow/backend-django && docker compose up -d
cd projects/10-url-monitor && docker compose up -d
cd projects/11-photo-gallery && docker compose up -d
cd projects/12-react-kanban && docker compose up -d
cd projects/13-recipe-book && docker compose up -d
```

و همه رو از مرورگر ببینی:

<div align='right' dir='rtl'>

<span dir='rtl'>• TaskFlow API: <span dir='ltr'>`http://127.0.0.1:8000/api/tasks/`</span></span> <br>
<span dir='rtl'>• URL Monitor: <span dir='ltr'>`http://127.0.0.1:9000/api/urls/`</span></span> <br>
<span dir='rtl'>• Photo Gallery: <span dir='ltr'>`http://127.0.0.1:8080/`</span></span> <br>
<span dir='rtl'>• Kanban Board: <span dir='ltr'>`http://127.0.0.1:3000/`</span></span> <br>
<span dir='rtl'>• Recipe Book: <span dir='ltr'>`http://127.0.0.1:8088/`</span></span> <br>

</div>

**هر پروژه کاملاً مستقله.** توقف یکی روی بقیه اثری نداره.

---

## ۱۴. جمع‌بندی

### چیزهایی که یاد گرفتیم

<div align='right' dir='rtl'>

<span dir='rtl'>**۱. Fullstack چیه؟**</span>

</div>

<p dir='rtl'>
• فرانت‌اند (React) + بک‌اند (Django) که با هم کار می‌کنن <br>
• از طریق API با هم حرف می‌زنن <br>
• مثل رستوران: سالن غذا + آشپزخونه + گارسون
</p>

<div align='right' dir='rtl'>

<span dir='rtl'>**۲. Multi-stage Build چیه؟**</span>

</div>

<p dir='rtl'>
• دو مرحله در Dockerfile <br>
• مرحله‌ی اول (آشپزخونه): ابزار <span dir='ltr'>build</span>، <span dir='ltr'>Node.js</span>، <span dir='ltr'>React</span> رو بیلد می‌کنه <br>
• مرحله‌ی دوم (جعبه): فقط Nginx + خروجی بیلد <br>
• نتیجه: <span dir='ltr'>Image</span> ۱۰ برابر کوچیک‌تر (<span dir='ltr'>~۵۰</span> مگابایت به‌جای <span dir='ltr'>~۵۰۰</span>)
</p>

**۳. چطور فرانت و بک حرف می‌زنن؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• React درخواست به <span dir='ltr'>`/api/...`</span> می‌فرسته (آدرس نسبی)</span> <br>
<span dir='rtl'>• Nginx می‌گیره، به `backend:8000` پاس می‌ده</span> <br>
<span dir='rtl'>• Django جواب می‌ده</span> <br>
<span dir='rtl'>• جواب از همون راه برمی‌گرده</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۴. CORS و CSRF چی هستن؟**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **CORS** = نگهبان در ورودی. اجازه‌ی درخواست cross-origin</span> <br>
<span dir='rtl'>• **CSRF** = دست دادن مخفی. برای جلوگیری از حمله</span> <br>

</div>

**۵. ساختار پروژه**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`backend-django/`</span> — بک‌اند مستقل</span> <br>
<span dir='rtl'>• <span dir='ltr'>`frontend-react/`</span> — فرانت‌اند مستقل</span> <br>
<span dir='rtl'>• `compose.yaml` — همه‌چیز رو به هم وصل می‌کنه</span> <br>

</div>

### نکته‌ی کلیدی این درس

```text
کاربر ──► React ──► Nginx ──► Django ──► PostgreSQL
  ▲                                  │
  │                                  │
  └──────────── JSON ────────────────┘

و در Dockerfile:

Stage 1 (Node.js + build) ──► dist/
                                  │
                                  ▼
Stage 2 (Nginx + dist)     ← فقط ۵۰ مگابایت
```

### آنچه در ادامه می‌آید

توی درس بعد، یه **پروژه‌ی کاملاً جدید** می‌سازیم که:

<div align='right' dir='rtl'>

<span dir='rtl'>• React + Django + **Celery + Redis**</span> <br>
<span dir='rtl'>• یعنی: علاوه بر فرانت و بک، کارهای پس‌زمینه هم داره</span> <br>
<span dir='rtl'>• یه **Task Runner** کامل با ارسال ایمیل (شبیه‌سازی‌شده) و گزارش‌های زمان‌بندی‌شده</span> <br>

</div>

و درس‌های بعدی به ترتیب:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۵:** چت real-time (WebSocket + Channels + Redis)</span> <br>
<span dir='rtl'>• **درس ۱۶:** Bookmark Manager (Push/Pull به Docker Hub)</span> <br>
<span dir='rtl'>• **درس ۱۷:** URL Shortener (CI/CD با GitHub Actions)</span> <br>
<span dir='rtl'>• **درس ۱۸:** Portfolio (Deploy به VPS + SSL + Domain)</span> <br>
<span dir='rtl'>• **درس ۱۹:** Vault (Security: Trivy، Secrets، Hardening)</span> <br>
<span dir='rtl'>• **درس ۲۰:** Log Analyzer (Debugging عمیق)</span> <br>
<span dir='rtl'>• **درس ۲۱:** Cheat Sheet + Docker Templates</span> <br>
<span dir='rtl'>• **درس ۲۲:** Wrap-up + نقشه‌ی راه ادامه</span> <br>

</div>

