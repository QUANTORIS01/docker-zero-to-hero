<div align='right' dir='rtl'>

[🇬🇧 English](/en/15-chat/README.md)

</div>

# درس ۱۵ — چت real-time با <span dir='ltr'>WebSocket</span>: ChatFlow

## مقدمه

خب، الان ۱۴ درس رو با هم گذروندیم و شش پروژه ساختیم. تا اینجا هر چی ساختیم با **HTTP** کار می‌کرد: درخواست می‌فرستادیم، جواب می‌گرفتیم، تموم. مثل زنگ زدن به یه شرکت: زنگ می‌زنی، سؤال می‌پرسی، جواب می‌گیری، قطع می‌کنی.

ولی خیلی از اپ‌های واقعی این‌طوری کار نمی‌کنن. **چت**، **اعلان لحظه‌ای**، **بازی‌های آنلاین**، **قیمت لحظه‌ای بورس** — این‌ها نمی‌تونن مدام سؤال بپرسن که «خبری هست؟». باید **یه خط باز نگه دارن** و هر لحظه پیام بگیرن.

این خط باز، اسمش **WebSocket** هست. و توی این درس یاد می‌گیریم چطور یه اپ real-time رو داکری کنیم.

### چرا این درس مهمه؟

تا درس ۱۴، همه‌ی پروژه‌ها با همون الگوی «HTTP + Gunicorn» کار می‌کردن. حالا **یه چیز جدید** وارد می‌شه: WebSocket. و WebSocket چند چیز رو عوض می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• **سرور** عوض می‌شه (Daphne به‌جای Gunicorn)</span> <br>
<span dir='rtl'>• **Nginx** باید یه تنظیم خاص داشته باشه</span> <br>
<span dir='rtl'>• **احراز هویت** یه روش متفاوت لازم داره</span> <br>
<span dir='rtl'>• **Redis** یه نقش جدید پیدا می‌کنه</span> <br>

</div>

**هدف اصلی این درس:** بعد از این درس، وقتی یه پروژه‌ی real-time دیدی، بدونی از کجا شروع کنی و چطور داکری‌ش کنی.

این مهارت، دقیقاً همون **ذهنیت داکری** هست که داریم تقویتش می‌کنیم.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'>• توضیح بدی WebSocket چیه و چه فرقی با HTTP داره</span> <br>
<span dir='rtl'>• توضیح بدی چرا برای WebSocket به Daphne نیاز داریم نه Gunicorn</span> <br>
<span dir='rtl'>• توضیح بدی Redis به‌عنوان «Channel Layer» چیکار می‌کنه</span> <br>
<span dir='rtl'>• Nginx رو طوری تنظیم کنی که WebSocket رو پاس بده</span> <br>
<span dir='rtl'>• یه توکن JWT رو از طریق query string به WebSocket بفرستی</span> <br>
<span dir='rtl'>• **ذهنیت داکری** داشته باشی: هر پروژه‌ای دیدی، بفهمی چطور باید داکری‌ش کرد</span> <br>

</div>

---

## ۱. اول، بذار بگم چی می‌سازیم

### داستان پروژه

یه اپ چت ساده، ولی **کاملاً واقعی**:

<div align='right' dir='rtl'>

<span dir='rtl'>1. کاربر `alice` ثبت‌نام می‌کنه</span> <br>
<span dir='rtl'>2. یه اتاق به اسم `general` می‌سازه</span> <br>
<span dir='rtl'>3. وارد اتاق می‌شه — یه خط باز (WebSocket) به سرور وصل می‌شه</span> <br>
<span dir='rtl'>4. پیام می‌فرسته: «سلام!»</span> <br>
<span dir='rtl'>5. `bob` (که تو یه مرورگر دیگه‌ست) هم وارد همون اتاق شده</span> <br>
<span dir='rtl'>6. **بدون اینکه `bob` صفحه رو رفرش کنه**، پیام `alice` رو می‌بینه</span> <br>
<span dir='rtl'>7. `bob` جواب می‌ده: «سلام!»</span> <br>
<span dir='rtl'>8. `alice` هم بلافاصله جواب رو می‌بینه</span> <br>

</div>

**نکته‌ی مهم:** توی درس ۱۴، React هر ۲ ثانیه یه بار می‌پرسید «تسک‌ها عوض شدن؟». این درس **این کار رو نمی‌کنه**. یه خط باز نگه می‌داره و سرور **خودش** پیام می‌فرسته.

### فرق رو با یه مثال ببین

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۴ (polling):** «ببخشید خبری هست؟» — «نه» — «ببخشید خبری هست؟» — «نه» — «ببخشید خبری هست؟» — «آها، یه تسک تموم شد!» ← هر ۲ ثانیه یه سؤال</span> <br>
<span dir='rtl'>• **درس ۱۵ (WebSocket):** «سلام، من گوش می‌دم.» — «باشه.» — «...» — «...» — «یه پیام جدید اومد!» ← خط باز، بدون سؤال تکراری</span> <br>

</div>

---

## ۲. یادآوری سریع — WebSocket چیه؟

قبل از هر چیز، بذار ۴ مفهوم جدید این درس رو به **ساده‌ترین شکل** توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>WebSocket چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**HTTP یه مکالمه‌ی کوتاهه:**</span>

</div>

<p dir='rtl'>
• کلاینت: «سلام، این درخواست رو بده.» <br>
• سرور: «بفرما، این جواب.» <br>
• (تموم. قطع.)
</p>

<div align='right' dir='rtl'>

<span dir='rtl'>**WebSocket یه تلفن بازه:**</span>

</div>

<p dir='rtl'>
• کلاینت: «سلام، یه خط باز کنم؟» <br>
• سرور: «آره، بفرما.» <br>
• (خط باز می‌مونه...) <br>
• کلاینت: «یه پیام.» <br>
• سرور: «گرفتم.» <br>
• سرور: «اینم پیام جدید از یه کاربر دیگه.» <br>
• (خط باز می‌مونه تا یکی قطعش کنه.)
</p>

**تفاوت کلیدی:** توی HTTP، سرور نمی‌تونه بی‌دعوت پیام بفرسته. توی WebSocket، **می‌تونه**.

<div align='right' dir='rtl'>

### <span dir='rtl'>ASGI چیه؟ WSGI چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **WSGI** = استاندارد قدیمی برای پایتون که فقط HTTP رو می‌فهمه. «WSGI» یعنی «Web Server Gateway Interface».</span> <br>
<span dir='rtl'>• **ASGI** = استاندارد جدید که هم HTTP و هم WebSocket رو می‌فهمه. «ASGI» یعنی «Asynchronous Server Gateway Interface».</span> <br>

</div>

**تشبیه ساده:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **WSGI** = یه پستچی که فقط می‌تونه نامه ببره و بیاره. اگه یه روزی بخوای تلفن هم داشته باشی، نمی‌تونه.</span> <br>
<span dir='rtl'>• **ASGI** = یه پستچی که هم نامه می‌بره، هم می‌تونه تلفن وصل کنه. برای کارهای مدرن بهتره.</span> <br>

</div>

**پس برای این درس:**

<p dir='rtl'>
• <span dir='ltr'>Gunicorn</span> ← WSGI ← فقط HTTP ← ❌ برای WebSocket <br>
• <span dir='ltr'>Daphne</span> ← ASGI ← <span dir='ltr'>HTTP</span> + <span dir='ltr'>WebSocket</span> ← ✅ برای WebSocket
</p>

<div align='right' dir='rtl'>

### <span dir='rtl'>Daphne چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Daphne یه سرور ASGIه که پروژه‌ی Django Channels ساخته. مثل Gunicorn، ولی می‌فهمه WebSocket چیه. **اسمش رو از یه شخصیت افسانه‌ای گرفته، ولی این مهم نیست. صرفاً یه اسمه.**</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>Channels چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Django به‌تنهایی WebSocket نمی‌فهمه. **Channels** یه افزونه‌ست که به Django یاد می‌ده WebSocket رو هم بفهمه. یه مفهوم جدید اضافه می‌کنه به اسم **Consumer**.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **View** (که از قبل می‌شناختیم) = هندلر درخواست‌های HTTP</span> <br>
<span dir='rtl'>• **Consumer** (جدید) = هندلر اتصال‌های WebSocket</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>Channel Layer چیه؟</span>

</div>

تصور کن ۱۰۰ نفر توی اتاق `general` هستن. هر کدوم یه WebSocket باز داره. وقتی `alice` پیام می‌فرسته، چطور به **همه‌ی ۱۰۰ نفر** برسه؟

**جواب:** Redis. هر اتصال یه Consumer داره که به یه **گروه** (group) توی Redis وصله. وقتی پیام میاد، Redis پیام رو به همه‌ی اعضای گروه پخش می‌کنه.

<div align='right' dir='rtl'>

<span dir='rtl'>• هر اتاق = یه گروه توی Redis (مثل `chat_general`)</span> <br>
<span dir='rtl'>• هر WebSocket = یه عضو اون گروه</span> <br>
<span dir='rtl'>• پیام جدید = پخش به همه‌ی اعضا</span> <br>

</div>

**چرا این مهمه؟** اگه سرور چند نمونه (instance) داشته باشه، همه از یه Redis مشترک می‌خونن. یعنی می‌تونی ۱۰۰ سرور داشته باشی و همه با هم هماهنگ باشن.

---

## ۳. ذهنیت داکری — همون ۷ سؤال، ولی با یه سؤال جدید

توی درس ۱۴، ۷ سؤال ذهنیت داکری رو یاد گرفتیم. حالا با **همون ۷ سؤال** به این پروژه نگاه می‌کنیم، فقط این بار یه سؤال هشتم هم اضافه می‌کنیم که مخصوص پروژه‌های real-time هست.

### سؤال ۱ — این پروژه از چند «بخش» تشکیل شده؟

<div align='center' dir='rtl'>

| بخش | کانتینر |
|-----|---------|
| Frontend (React) | `frontend` |
| Backend (Django + Channels) | `backend` |
| Database (PostgreSQL) | `db` |
| Channel Layer (Redis) | `redis` |
| Migrations (one-shot) | `migrate` |

</div>

**پنج سرویس** (درس ۱۴ شش سرویس داشت، چون `worker` هم داشتیم. این‌جا Celery نداریم).

**چرا Redis این‌جاست؟** توی درس ۱۴، Redis صف Celery بود. این‌جا <span dir='ltr'>Redis</span> **Channel Layer** هست. یه ابزار، دو نقش. **این خودش یه درس مهمه:** Redis یه ابزار عمومیه که می‌تونه صف، کش، یا Channel Layer باشه. کاربردش رو کد ما تعیین می‌کنه.

### سؤال ۲ — هر بخش برای اجرا چی لازم داره؟

<div align='center' dir='rtl'>

| سرویس | چی لازم داره |
|--------|----------------|
| `backend` | Python 3.12 + Django + Channels + Daphne ← **Dockerfile** |
| `frontend` | Node.js (build) + Nginx (serve) ← **Multi-stage Dockerfile** |
| `db` |<span dir='rtl'> Image آماده `postgres:16` </span>|
| `redis` |<span dir='rtl'> Image آماده `redis:7-alpine` </span>|
| `migrate` |<span dir='rtl'> **همون backend** (فقط `command` فرق می‌کنه) </span>|

</div>

**نکته:** `migrate` نیازی به Dockerfile جدا نداره. مثل درس ۱۴ از Image بک‌اند استفاده می‌کنه.

### سؤال ۳ — این بخش‌ها چطور با هم حرف می‌زنن؟

```text
کاربر ──► frontend (پورت 8090، از بیرون)
            │
            ├──► /             ──► React
            ├──► /api/         ──► backend:8000 (HTTP)
            ├──► /admin/       ──► backend:8000 (HTTP)
            ├──► /health/      ──► backend:8000 (HTTP)
            ├──► /static/      ──► static_files volume
            └──► /ws/          ──► backend:8000 (WebSocket) ⭐ جدید
backend ──► db (داخلی)
backend ──► redis (داخلی، برای Channel Layer)
```

**نکته‌ی جدید:** مسیر `/ws/` مسیر جداست، چون **پروتکلش فرق داره**. Nginx باید بدونه این مسیر WebSocket هست و با تنظیمات خاص پاس بده.

### سؤال ۴ — چه داده‌ای باید زنده بمونه؟

<div align='center' dir='rtl'>

| داده | Volume |
|------|--------|
|<span dir='rtl'> داده‌های PostgreSQL </span>| `postgres_data` |
|<span dir='rtl'> فایل‌های <span dir='ltr'>static</span> Django (CSS ادمین) </span>| `static_files` |
| کد پروژه |<span dir='rtl'> **نه** (داخل Image) </span>|
|<span dir='rtl'> داده‌های Redis </span>|<span dir='rtl'> **نه** (پیام‌ها توی DB ذخیره می‌شن) </span>|

</div>

**چرا <span dir='ltr'>Redis</span> volume نمی‌خواد؟** چون فقط یه خط ارتباطی موقته. پیام‌های واقعی توی PostgreSQL ذخیره می‌شن. اگه Redis ری‌استارت بشه، فقط اتصال‌های لحظه‌ای قطع می‌شن (کاربر دوباره وصل می‌شه).

### سؤال ۵ — چه تنظیماتی باید قابل‌تغییر باشه؟

<div align='right' dir='rtl'>

<span dir='rtl'>• رمز دیتابیس</span> <br>
<span dir='rtl'>• کلید مخفی Django</span> <br>
<span dir='rtl'>• آدرس Redis (چون بین dev و docker فرق می‌کنه)</span> <br>
<span dir='rtl'>• **عمر توکن JWT** (چون امنیت مهمه)</span> <br>

</div>

**همه توی <span dir='ltr'>`.env`</span>.**

### سؤال ۶ — چطور باید Build بشه؟

<div align='center' dir='rtl'>

| سرویس |<span dir='rtl'> نوع Build </span>|
|--------|-----------|
| `backend` | **Single-stage** (Python) |
| `frontend` | **Multi-stage** (Node.js → Nginx) |
| `db` | آماده |
| `redis` | آماده |
| `migrate` |<span dir='rtl'> **از Image backend** </span>|

</div>

### سؤال ۷ — ترتیب شروع سرویس‌ها چیه؟

```text
1. db (healthcheck: pg_isready)
2. redis (healthcheck: redis-cli ping)
3. migrate (منتظر db healthy) → یک بار اجرا، تموم
4. backend (منتظر migrate completed + redis healthy)
5. frontend (منتظر backend healthy)
```

### 🎯 سؤال ۸ (جدید) — پروتکل چیه؟

**این سؤال مخصوص این درسه.** قبل از هر چیز بپرس: «این پروژه HTTP کار می‌کنه یا WebSocket؟»

<div align='center' dir='rtl'>

| پروتکل | سرور | Nginx |
|--------|------|-------|
|<span dir='rtl'> HTTP فقط </span>| Gunicorn |<span dir='rtl'> `proxy_pass` ساده </span>|
| **HTTP + WebSocket** | **Daphne** |<span dir='rtl'> **`proxy_pass` + هدرهای Upgrade** ⭐ </span>|
|<span dir='rtl'> WebSocket فقط </span>| Daphne | `proxy_pass` + Upgrade |

</div>

**قانون طلایی جدید:** اگه پروژه WebSocket داره، باید:

<div align='right' dir='rtl'>

<span dir='rtl'>1. Gunicorn رو با **Daphne** عوض کنی</span> <br>
<span dir='rtl'>2. Nginx رو با **هدرهای Upgrade** تنظیم کنی</span> <br>
<span dir='rtl'>3. توکن JWT رو از **query string** بفرستی (نه از header)</span> <br>

</div>

اگه یکی از این سه‌تا رو فراموش کنی، WebSocket کار **نمی‌کنه** — یا اصلاً وصل نمی‌شه، یا بعد از چند ثانیه قطع می‌شه. تجربه‌ی تلخ خودمون این بود که هر سه تا مشکل رو یکی‌یکی پیدا کردیم.

### 🎯 خلاصه‌ی ذهنیت داکری این درس

<div align='right' dir='rtl'>

<span dir='rtl'>• **۷ سؤال قبلی** همون‌جوری جواب داده می‌شن</span> <br>
<span dir='rtl'>• **سؤال هشتم (پروتکل)** اضافه می‌شه: WebSocket داری یا نه؟</span> <br>
<span dir='rtl'>• اگه داری، سه چیز عوض می‌شه: سرور، Nginx، احراز هویت</span> <br>

</div>

**همین سه خط، قلب این درسه.** بقیه، جزئیاته.

---

## ۴. معماری پروژه

```text
┌──────────────────────────────────────────────────┐
│                    کاربر                           │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│           frontend (Nginx، پورت 8090)             │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000 (HTTP)           │
│  /admin/      ──►  backend:8000 (HTTP)           │
│  /health/     ──►  backend:8000 (HTTP)           │
│  /static/     ──►  static_files volume           │
│  /ws/         ──►  backend:8000 (WebSocket) ⭐  │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│         backend (Django + Daphne، پورت 8000)      │
│                                                  │
│  HTTP: Viewها     WebSocket: Consumerها            │
└─────┬─────────────────────────────────┬──────────┘
      │                                 │
      ▼                                 ▼
┌──────────────┐               ┌──────────────────┐
│      db      │               │      redis       │
│  PostgreSQL  │               │  (channel layer) │
└──────────────┘               └──────────────────┘
```

**پورت‌های دوره:**

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| ۱۳ | Recipe Book | 8088 |
| ۱۴ | Task Runner | 8089 |
| **۱۵** | **ChatFlow** | **8090** |

</div>

---

## ۵. ساختار پوشه‌ها

```text
15-chat/
├── compose.yaml
├── README.md
├── README.fa.md
├── backend-django/
│   ├── .dockerignore
│   ├── .env.example
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── __init__.py
│   │   ├── asgi.py         ← ProtocolTypeRouter
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── chat/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── consumers.py     ← ChatConsumer (WebSocket)
│       ├── middleware.py    ← JWTAuthMiddleware
│       ├── models.py        ← Room, Message
│       ├── routing.py       ← websocket_urlpatterns
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
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Auth.jsx
            ├── ChatRoom.jsx
            └── RoomsList.jsx
```

**یه فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو** همه‌ی پروژه‌ها رو پوشش می‌ده.

---

## ۶. فایل‌های بک‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱. `requirements.txt`</span>

</div>

```txt
Django==5.1.4
djangorestframework==3.15.2
djangorestframework-simplejwt==5.4.0
psycopg[binary]==3.2.10
django-environ==0.14.0
django-cors-headers==4.6.0
channels==4.2.0
channels-redis==4.2.1
daphne==4.1.2
```

**هر پکیج چیه؟**

<div align='center' dir='rtl'>

| پکیج | کارش |
|------|-------|
| <span dir='ltr'>**Django**</span> | فریم‌ورک بک‌اند |
| <span dir='ltr'>**djangorestframework**</span> |<span dir='rtl'> ساخت API </span>|
| <span dir='ltr'>**djangorestframework-simplejwt**</span> |<span dir='rtl'> ⭐ احراز هویت JWT </span>|
| <span dir='ltr'>**psycopg[binary]**</span> |<span dir='rtl'> درایور PostgreSQL </span>|
| <span dir='ltr'>**django-environ**</span> |<span dir='rtl'> خواندن <span dir='ltr'>`.env`</span> </span>|
| <span dir='ltr'>**django-cors-headers**</span> |<span dir='rtl'> اجازه‌ی درخواست از React </span>|
| <span dir='ltr'>**channels**</span> |<span dir='rtl'> ⭐ WebSocket برای Django </span>|
| <span dir='ltr'>**channels-redis**</span> |<span dir='rtl'> ⭐ Channel Layer روی Redis </span>|
| <span dir='ltr'>**daphne**</span> |<span dir='rtl'> ⭐ سرور ASGI </span>|

</div>

**نکته‌ی مهم:** `gunicorn` رو **حذف کردیم**. چرا؟ چون Gunicorn فقط <span dir='ltr'>WSGI</span> (HTTP) رو می‌فهمه. برای <span dir='ltr'>WebSocket</span>، Daphne لازمه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۲. <span dir='ltr'>`.env.example`</span></span>

</div>

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1,backend

# CORS (for React)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8090
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8090

# PostgreSQL
POSTGRES_DB=chatflow
POSTGRES_USER=chatflow
POSTGRES_PASSWORD=chatflow_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis (Channels layer)
REDIS_URL=redis://localhost:6379/0
```

**چرا `localhost` توی <span dir='ltr'>`.env`</span> ولی `db` و `redis` توی `compose.yaml`؟**

چون <span dir='ltr'>`.env`</span> برای اجرای **محلی** (خارج از Docker) است. `compose.yaml` این مقادیر رو override می‌کنه و از اسم سرویس‌ها (`db`، `redis`) استفاده می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۳. `config/settings.py` — بخش‌های مهم</span>

</div>

```python
import environ
from datetime import timedelta
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
env = environ.Env()
environ.Env.read_env(BASE_DIR / '.env')

SECRET_KEY = env('SECRET_KEY')
DEBUG = env.bool('DEBUG', False)
ALLOWED_HOSTS = env.list('ALLOWED_HOSTS', default=['localhost', '127.0.0.1'])

INSTALLED_APPS = [
    'daphne',  # ⭐ باید قبل از staticfiles باشه
    # ... Django
    'rest_framework',
    'corsheaders',
    'channels',  # ⭐ جدید
    'chat',
]

ASGI_APPLICATION = 'config.asgi.application'  # ⭐ جدید

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        # ...
    }
}

# ⭐ جدید: Channel Layer
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}],
        },
    },
}

REST_FRAMEWORK = {
    'DEFAULT_AUTHENTICATION_CLASSES': [
        'rest_framework_simplejwt.authentication.JWTAuthentication',
    ],
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.IsAuthenticated',
    ],
}

SIMPLE_JWT = {
    'ACCESS_TOKEN_LIFETIME': timedelta(hours=1),
    'REFRESH_TOKEN_LIFETIME': timedelta(days=7),
}
```

**مهم‌ترین تغییرات نسبت به درس ۱۴:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`daphne` توی INSTALLED_APPS** — تا `runserver` هم ASGI بشه (برای dev)</span> <br>
<span dir='rtl'>• **`channels` توی INSTALLED_APPS** — فعال‌سازی WebSocket</span> <br>
<span dir='rtl'>• **`ASGI_APPLICATION`** — نقطه‌ی ورود WebSocket</span> <br>
<span dir='rtl'>• **`CHANNEL_LAYERS`** — آدرس Redis</span> <br>
<span dir='rtl'>• **`SIMPLE_JWT`** — احراز هویت با JWT</span> <br>

</div>

**خط مهم: <span dir='ltr'>`'socket_timeout': 20`</span>**

این یه تله‌ی معروفه. `redis-py` نسخه ۸+ به‌طور پیش‌فرض `socket_timeout=5` داره. ولی `channels_redis` از دستور `BRPOP` استفاده می‌کنه که **بلاکینگه** و ۵ ثانیه منتظر پیام می‌مونه. یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• `redis-py` می‌گه: «۵ ثانیه صبر می‌کنم، اگه جواب نیومد قطع می‌کنم.»</span> <br>
<span dir='rtl'>• `channels_redis` می‌گه: «۵ ثانیه صبر می‌کنم که پیامی بیاد.»</span> <br>
<span dir='rtl'>• این دو با هم تصادم می‌کنن ← `Timeout reading from redis:6379`</span> <br>
<span dir='rtl'>• نتیجه: هر اتصال بعد از <span dir='ltr'>~۶</span> ثانیه **قطع می‌شه**</span> <br>

</div>

**راه‌حل:** `socket_timeout: 20` (بزرگ‌تر از ۵ ثانیه). **این باید داخل هر host باشه، نه به‌عنوان کلید جداگانه:**

```python
'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}]
```

اگه اشتباهی بنویسی:

<div align='left' dir='ltr'>

```python
# ❌ اشتباه — این خطا می‌ده: unexpected keyword argument 'socket_timeout'
'hosts': [env('REDIS_URL')], 'socket_timeout': 20
```

</div>

**این تله رو یادت باشه. تجربه‌ی واقعی ما بود.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۴. `config/asgi.py` — نقطه‌ی ورود WebSocket</span>

</div>

```python
import os
from django.core.asgi import get_asgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

# ⭐ اول Django رو کامل راه‌اندازی کن
django_asgi_app = get_asgi_application()

# بعد routingهای Channels رو ایمپورت کن
from channels.routing import ProtocolTypeRouter, URLRouter
from channels.security.websocket import AllowedHostsOriginValidator
from chat.middleware import JWTAuthMiddleware
from chat.routing import websocket_urlpatterns

application = ProtocolTypeRouter({
    'http': django_asgi_app,
    'websocket': AllowedHostsOriginValidator(
        JWTAuthMiddleware(URLRouter(websocket_urlpatterns))
    ),
})
```

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`get_asgi_application()`**</span> — Django رو راه‌اندازی می‌کنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`ProtocolTypeRouter`**</span> — یه روتر که بر اساس پروتکل تصمیم می‌گیره کجا بره</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`'http'`**</span> — درخواست‌های HTTP ← میرن به Django معمولی</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`'websocket'`**</span> — اتصال‌های WebSocket ← میرن به مسیر مخصوص</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`AllowedHostsOriginValidator`**</span> — چک می‌کنه Origin مرورگر معتبره</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`JWTAuthMiddleware`**</span> — توکن رو چک می‌کنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`URLRouter`**</span> — بر اساس URL به Consumer درست وصل می‌کنه</span> <br>

</div>

**نکته‌ی حیاتی: ترتیب importها**

اگه <span dir='ltr'>`from chat.routing import ...`</span> رو **قبل از** <span dir='ltr'>`get_asgi_application()`</span> بنویسی، Django apps هنوز لود نشدن و به خطای `AppRegistryNotReady` می‌خوری. **همیشه اول Django، بعد Channels.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۵. `chat/models.py`</span>

</div>

```python
from django.conf import settings
from django.db import models
from django.utils.text import slugify


class Room(models.Model):
    name = models.CharField(max_length=100, unique=True)
    slug = models.SlugField(max_length=120, unique=True, blank=True)
    created_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='created_rooms',
    )
    created_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)


class Message(models.Model):
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='messages')
    author = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='messages',
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['created_at']
```

**فیلدها:**

<div align='center' dir='rtl'>

| مدل | فیلد | معنی |
|-----|------|-------|
| Room | `name` |<span dir='rtl'> اسم اتاق (مثلاً «general») </span>|
| Room | `slug` |<span dir='rtl'> نسخه‌ی URL-friendly (مثلاً «general») — برای مسیر WebSocket </span>|
| Room | `created_by` | سازنده |
| Message | `room` | پیام مال کدوم اتاقه |
| Message | `author` | فرستنده |
| Message | `content` | متن پیام |

</div>

**چرا `slug` جدا از `name`؟** چون توی URL، فاصله و کاراکترهای خاص نمی‌شه داشت. `slugify` فاصله‌ها رو به `-` تبدیل می‌کنه. مثلاً `My Room!` می‌شه `my-room`. **این تصمیم مهمه چون توی مسیر WebSocket استفاده می‌شه.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۶. `chat/consumers.py` — قلب WebSocket</span>

</div>

```python
import json
from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncWebsocketConsumer
from .models import Message, Room


class ChatConsumer(AsyncWebsocketConsumer):

    async def connect(self):
        user = self.scope['user']
        if not user.is_authenticated:
            await self.close(code=4401)  # unauthorized
            return

        self.room_slug = self.scope['url_route']['kwargs']['room_slug']
        self.room_group_name = f'chat_{self.room_slug}'

        room = await self._get_room(self.room_slug)
        if room is None:
            await self.close(code=4404)  # not found
            return

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        if hasattr(self, 'room_group_name'):
            await self.channel_layer.group_discard(
                self.room_group_name, self.channel_name,
            )

    async def receive(self, text_data):
        data = json.loads(text_data)
        content = (data.get('message') or '').strip()
        if not content:
            return

        user = self.scope['user']
        message = await self._save_message(user, self.room_slug, content)

        await self.channel_layer.group_send(
            self.room_group_name,
            {
                'type': 'chat_message',
                'id': message.id,
                'content': content,
                'author': user.username,
                'created_at': message.created_at.isoformat(),
            },
        )

    async def chat_message(self, event):
        await self.send(text_data=json.dumps({
            'id': event['id'],
            'message': event['content'],
            'author': event['author'],
            'created_at': event['created_at'],
        }))

    @database_sync_to_async
    def _get_room(self, slug):
        return Room.objects.filter(slug=slug).first()

    @database_sync_to_async
    def _save_message(self, user, room_slug, content):
        room = Room.objects.get(slug=room_slug)
        return Message.objects.create(room=room, author=user, content=content)
```

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`AsyncWebsocketConsumer`**</span> — کلاس پایه برای <span dir='ltr'>WebSocket</span> (async)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`connect()`**</span> — وقتی کاربر وصل می‌شه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`disconnect()`**</span> — وقتی قطع می‌شه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`receive()`**</span> — وقتی پیامی از کاربر می‌رسه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`chat_message()`**</span> — وقتی پیامی از گروه می‌رسه</span> <br>

</div>

**سه متد اصلی:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`connect()`</span>:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>1. چک می‌کنه کاربر لاگینه (اگه نه، قطع با کد 4401)</span> <br>
<span dir='rtl'>2. `room_slug` رو از URL می‌خونه</span> <br>
<span dir='rtl'>3. اسم گروه رو می‌سازه: `chat_general`</span> <br>
<span dir='rtl'>4. چک می‌کنه اتاق وجود داره</span> <br>
<span dir='rtl'>5. **عضو گروه می‌شه** — این خط کلیدیه</span> <br>
<span dir='rtl'>6. اتصال رو قبول می‌کنه (`accept`)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`receive()`</span>:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>1. JSON رو parse می‌کنه</span> <br>
<span dir='rtl'>2. متن رو استخراج می‌کنه</span> <br>
<span dir='rtl'>3. پیام رو توی PostgreSQL ذخیره می‌کنه</span> <br>
<span dir='rtl'>4. **پیام رو به گروه می‌فرسته** — این خط جادوییه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`chat_message()`</span>:**</span>

</div>

این متد وقتی صدا زده می‌شه که `group_send` پیامی به این گروه بفرسته. پیام رو به مرورگر کاربر می‌فرسته.

**نکته‌ی مهم: `database_sync_to_async`**

عملیات دیتابیس (مثل `Room.objects.get`) **sync** هستن. ولی consumerها **async** هستن. برای پل زدن بین این دو، از این دکوراتور استفاده می‌کنیم. اگه مستقیم صدا بزنی، خطای `SynchronousOnlyOperation` می‌گیری.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۷. `chat/middleware.py` — احراز هویت WebSocket</span>

</div>

```python
from urllib.parse import parse_qs
from channels.db import database_sync_to_async
from channels.middleware import BaseMiddleware
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AnonymousUser
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.tokens import AccessToken


@database_sync_to_async
def _get_user(token):
    try:
        access = AccessToken(token)
        return get_user_model().objects.get(id=access['user_id'])
    except (TokenError, KeyError, get_user_model().DoesNotExist):
        return AnonymousUser()


class JWTAuthMiddleware(BaseMiddleware):
    async def __call__(self, scope, receive, send):
        query = parse_qs(scope.get('query_string', b'').decode())
        token = query.get('token', [None])[0]

        scope['user'] = await _get_user(token) if token else AnonymousUser()
        return await super().__call__(scope, receive, send)
```

**این فایل، راه‌حل یه محدودیت مرورگره:**

**مرورگر نمی‌تونه برای WebSocket هدر سفارشی بفرسته.** یعنی نمی‌تونی مثل HTTP بگی `Authorization: Bearer xyz`. مرورگر WebSocket API فقط URL قبول می‌کنه.

**پس توکن رو از کجا بفرستیم؟** از **query string**:

```text
ws://127.0.0.1:8090/ws/chat/general/?token=<JWT>
```

**این middleware:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. <span dir='ltr'>`scope['query_string']`</span> رو می‌خونه</span> <br>
<span dir='rtl'>2. توکن رو از query استخراج می‌کنه</span> <br>
<span dir='rtl'>3. با `AccessToken` اعتبارسنجی می‌کنه</span> <br>
<span dir='rtl'>4. کاربر رو از دیتابیس می‌خونه</span> <br>
<span dir='rtl'>5. <span dir='ltr'>`scope['user']`</span> رو پر می‌کنه</span> <br>

</div>

**بدون این middleware، <span dir='ltr'>`self.scope['user']`</span> همیشه `AnonymousUser` هست و <span dir='ltr'>`connect()`</span> قطع می‌کنه.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۸. `chat/routing.py`</span>

</div>

```python
from django.urls import re_path
from . import consumers

websocket_urlpatterns = [
    re_path(r'^ws/chat/(?P<room_slug>[\w-]+)/$', consumers.ChatConsumer.as_asgi()),
]
```

**این یه تصمیم خیلی مهمه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• الگوی <span dir='ltr'>URL: `/ws/chat/{room_slug}/`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>`[\w-]+`</span> یعنی حروف، اعداد، خط زیر، و خط تیره</span> <br>
<span dir='rtl'>• <span dir='ltr'>`room_slug`</span> **از URL به consumer** پاس داده می‌شه</span> <br>

</div>

**چرا <span dir='ltr'>`/ws/`</span> جدا از <span dir='ltr'>`/api/`</span>؟** چون Nginx باید بدونه این مسیر WebSocket هست و با تنظیمات خاص پاس بده.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۹. <span dir='ltr'>`chat/views.py`</span> — API معمولی</span>

</div>

```python
from rest_framework import generics, mixins, permissions, viewsets
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView
from .models import Message, Room
from .serializers import (
    MessageSerializer, RegisterSerializer, RoomSerializer, UserSerializer,
)


class LoginView(TokenObtainPairView):
    permission_classes = [permissions.AllowAny]


class RegisterView(generics.CreateAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [permissions.AllowAny]


class MeView(APIView):
    permission_classes = [permissions.IsAuthenticated]
    def get(self, request):
        return Response(UserSerializer(request.user).data)


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.all().select_related('created_by')
    serializer_class = RoomSerializer
    permission_classes = [permissions.IsAuthenticated]
    lookup_field = 'slug'

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)


class MessageViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    serializer_class = MessageSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        room_slug = self.kwargs.get('room_slug')
        return Message.objects.filter(room__slug=room_slug).select_related('author')
```

**این‌جا هیچ چیز جدیدی نیست — همه HTTP هستن.** تنها تغییر: `RoomViewSet` از `slug` استفاده می‌کنه (نه `id`)، تا URL با WebSocket هماهنگ باشه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱۰. `chat/urls.py`</span>

</div>

```python
from django.urls import include, path
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenRefreshView
from .views import LoginView, MeView, MessageViewSet, RegisterView, RoomViewSet

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')

urlpatterns = [
    path('auth/register/', RegisterView.as_view(), name='register'),
    path('auth/login/', LoginView.as_view(), name='login'),
    path('auth/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('auth/me/', MeView.as_view(), name='me'),
    path('rooms/<slug:room_slug>/messages/',
         MessageViewSet.as_view({'get': 'list'}), name='room-messages'),
    path('', include(router.urls)),
]
```

**مسیرهای API:**

<div align='center' dir='rtl'>

| متد | مسیر |
|-----|------|
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/register/`</span> |
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/login/`</span> |
| <span dir='ltr'>POST</span> | <span dir='ltr'>`/api/auth/refresh/`</span> |
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/auth/me/`</span> |
| <span dir='ltr'>GET/POST</span> | <span dir='ltr'>`/api/rooms/`</span> |
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/rooms/{slug}/`</span> |
| <span dir='ltr'>GET</span> | <span dir='ltr'>`/api/rooms/{slug}/messages/`</span> |

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱۱. `config/urls.py`</span>

</div>

```python
from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path


def health_check(request):
    return JsonResponse({'status': 'ok'})


urlpatterns = [
    path('admin/', admin.site.urls),
    path('health/', health_check),
    path('api/', include('chat.urls')),
]
```

**سه مسیر HTTP.** مسیرهای WebSocket این‌جا نیستن — توی `config/asgi.py` تعریف می‌شن. **این جداسازی مهمه:** URLconf معمولی برای <span dir='ltr'>HTTP</span>، URLRouter برای WebSocket.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱۲. `chat/admin.py`</span>

</div>

```python
from django.contrib import admin
from .models import Message, Room


@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ('id', 'name', 'slug', 'created_by', 'created_at')
    search_fields = ('name',)
    readonly_fields = ('created_at',)


@admin.register(Message)
class MessageAdmin(admin.ModelAdmin):
    list_display = ('id', 'room', 'author', 'content', 'created_at')
    list_filter = ('room',)
    search_fields = ('content',)
    date_hierarchy = 'created_at'
```

**مثل درس‌های قبل، پنل ادمین برای مدیریت.**

---

## ۷. فایل‌های فرانت‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۱. `vite.config.js` — پل ارتباطی dev</span>

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
      '/ws': {
        target: 'ws://localhost:8000',
        ws: true,
      },
    },
  },
})
```

**تغییر نسبت به درس ۱۴:** بلوک <span dir='ltr'>`/ws`</span> اضافه شد. <span dir='ltr'>`ws: true`</span> یعنی «این مسیر WebSocket هست، آپ‌گرید کن».

**توی <span dir='ltr'>production</span>**، Nginx همین نقش رو با هدرهای `Upgrade` بازی می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۲. `src/api.js` — تنها جای اتصال + auto-refresh</span>

</div>

```js
import axios from 'axios'

const api = axios.create({ baseURL: '/api' })

// Request: token رو خودکار بذار
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response: اگه 401 شد، یه بار refresh کن و دوباره امتحان کن
let refreshPromise = null
function handleAuthFailure() {
  localStorage.removeItem('access_token')
  localStorage.removeItem('refresh_token')
  localStorage.removeItem('username')
  window.location.reload()
}

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    const status = error.response?.status
    if (status === 401 && !original._retry && !original.url.includes('/auth/refresh')) {
      const refresh = localStorage.getItem('refresh_token')
      if (!refresh) {
        handleAuthFailure()
        return Promise.reject(error)
      }
      original._retry = true
      try {
        if (!refreshPromise) {
          refreshPromise = axios.post('/api/auth/refresh/', { refresh })
            .finally(() => { refreshPromise = null })
        }
        const { data } = await refreshPromise
        localStorage.setItem('access_token', data.access)
        original.headers.Authorization = `Bearer ${data.access}`
        return api(original)
      } catch (e) {
        handleAuthFailure()
        return Promise.reject(e)
      }
    }
    return Promise.reject(error)
  }
)

// API surface
export const authApi = {
  register: async (username, password) => {
    const res = await api.post('/auth/register/', { username, password })
    return res.data
  },
  login: async (username, password) => {
    const res = await api.post('/auth/login/', { username, password })
    return res.data
  },
}

export const roomApi = {
  list: async () => {
    const res = await api.get('/rooms/')
    return res.data
  },
  create: async (name) => {
    const res = await api.post('/rooms/', { name })
    return res.data
  },
}

export const messageApi = {
  list: async (roomSlug) => {
    const res = await api.get(`/rooms/${roomSlug}/messages/`)
    return res.data
  },
}
```

**بخش‌های کلیدی:**

<div align='right' dir='rtl'>

<span dir='rtl'>**۱. Request interceptor:** توکن رو خودکار از localStorage می‌خونه و به هدر `Authorization` می‌ذاره. **دیگه لازم نیست هر تابع `token` رو پاس بده.**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۲. Response interceptor:** اگه پاسخ `401` بود (توکن منقضی)، یه بار refresh می‌کنه و درخواست رو دوباره می‌فرسته.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۳. `refreshPromise`:** اگه ۵ درخواست همزمان 401 بگیرن، **فقط یکی** refresh می‌کنه، بقیه منتظر همون promise می‌مونن. **این جلوگیری از یه باگ خیلی رایج:** چند refresh همزمان که race condition ایجاد می‌کنن.</span>

</div>

**چرا این مهمه؟** چون `ACCESS_TOKEN_LIFETIME` یک ساعته. اگه interceptor نداشته باشی، **بعد از یک ساعت، کاربر از اپ خارج می‌شه و نمی‌فهمه چرا.** ما این رو تجربه کردیم و این راه‌حل رو گذاشتیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۳. `src/components/Auth.jsx`</span>

</div>

فرم لاگین/ثبت‌نام ساده. مثل درس‌های قبل. توکن دریافتی رو به `App` پاس می‌ده.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۴. `src/components/RoomsList.jsx`</span>

</div>

لیست اتاق‌ها + فرم ساخت اتاق. از `roomApi` استفاده می‌کنه. **بدون `token` پاس دادن** — interceptor خودش اضافه می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۵. `src/components/ChatRoom.jsx` — قلب WebSocket فرانت</span>

</div>

```jsx
export default function ChatRoom({ room, username, onBack }) {
  const [messages, setMessages] = useState([])
  const [input, setInput] = useState('')
  const [connected, setConnected] = useState(false)
  const wsRef = useRef(null)
  const messagesEndRef = useRef(null)

  // ۱. تاریخچه رو با HTTP بگیر
  useEffect(() => {
    messageApi.list(room.slug).then((data) => setMessages(data.results || data))
  }, [room.slug])

  // ۲. WebSocket وصل شو
  useEffect(() => {
    const token = localStorage.getItem('access_token')
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
    const url = `${protocol}//${window.location.host}/ws/chat/${room.slug}/?token=${token}`
    const ws = new WebSocket(url)
    wsRef.current = ws

    ws.onopen = () => setConnected(true)
    ws.onclose = () => setConnected(false)
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data)
      setMessages((prev) => [...prev, {
        id: data.id,
        content: data.message,
        author: { username: data.author },
        created_at: data.created_at,
      }])
    }

    return () => ws.close()
  }, [room.slug])

  // ۳. هر پیام جدید، اسکرول کن پایین
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSend = (e) => {
    e.preventDefault()
    const text = input.trim()
    if (!text || wsRef.current?.readyState !== WebSocket.OPEN) return
    wsRef.current.send(JSON.stringify({ message: text }))
    setInput('')
  }

  return ( /* فرم + لیست پیام‌ها + وضعیت اتصال */ )
}
```

**سه چیز مهم:**

**۱. عنوان URL:**

```js
const url = `${protocol}//${window.location.host}/ws/chat/${room.slug}/?token=${token}`
```

<div align='right' dir='rtl'>

<span dir='rtl'>• `protocol` = <span dir='ltr'>`ws:`</span> یا <span dir='ltr'>`wss:`</span> (بر اساس HTTP/HTTPS)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`host`</span> = `127.0.0.1:8090` (همون دامنه‌ی <span dir='ltr'>frontend</span> — Nginx مسیر <span dir='ltr'>`/ws/`</span> رو به backend پاس می‌ده)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`token`</span> = از localStorage</span> <br>

</div>

**۲. تاریخچه با HTTP، پیام‌های جدید با WebSocket**

این یه الگوی خیلی مهمه:

<div align='right' dir='rtl'>

<span dir='rtl'>• **تاریخچه** رو با <span dir='ltr'>`GET /api/rooms/{slug}/messages/`</span> می‌گیریم (HTTP)</span> <br>
<span dir='rtl'>• **پیام‌های جدید** رو با WebSocket می‌گیریم</span> <br>

</div>

**چرا؟** چون تاریخچه ممکنه هزاران پیام باشه، ولی WebSocket فقط برای پیام‌های **از الان به بعد** مناسبه.

<div align='right' dir='rtl'>

<span dir='rtl'>**۳. `useEffect` cleanup**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`return () => ws.close()`</span> — وقتی کامپوننت از صفحه برداشته می‌شه، WebSocket رو قطع می‌کنه. **بدون این، هر بار که کاربر اتاق رو عوض کنه، یه اتصال یتیم می‌مونه.**</span>

</div>

---

## ۸. فایل‌های Docker — قلب پروژه

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۱. `backend-django/Dockerfile`</span>

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

RUN mkdir -p /app/staticfiles \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh

USER appuser
EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]
```

**نکته‌ی طلایی:** این Dockerfile **هم** برای `backend`، **هم** برای `migrate` استفاده می‌شه. فقط `command` توی `compose.yaml` فرق می‌کنه.

**تفاوت کلیدی با درس ۱۴:**

```dockerfile
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]   ← درس ۱۴
CMD ["daphne", "-b", "0.0.0.0", "-p", "8000", "config.asgi:application"]  ← این درس
```

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**Gunicorn**</span> فقط <span dir='ltr'>WSGI</span> ← فقط HTTP ← ❌ <span dir='ltr'>WebSocket</span> نمی‌فهمه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Daphne**</span> <span dir='ltr'>ASGI</span> ← HTTP + <span dir='ltr'>WebSocket</span> ← ✅</span> <br>

</div>

**بقیه‌ی <span dir='ltr'>Dockerfile</span> (<span dir='ltr'>libpq5</span>، gosu، <span dir='ltr'>useradd</span>، chown) دقیقاً مثل درس ۱۴ هستن.** اگه توضیحشون یادت نیست، یه بار دیگه درس ۱۴ رو بخون.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۲. `entrypoint.sh`</span>

</div>

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

**دقیقاً همون entrypoint درس ۱۴.** چرا؟ چون:

<div align='right' dir='rtl'>

<span dir='rtl'>• همون مشکل permission روی <span dir='ltr'>volume</span> `static_files` رو داریم</span> <br>
<span dir='rtl'>• همون مشکل `migrate` قبل از بالا اومدن سرور</span> <br>
<span dir='rtl'>• همون `collectstatic` برای CSS ادمین</span> <br>

</div>

**این یه درس مهمه:** الگوی حل مشکل، از پروتکل مستقل است. مشکل WebSocket نیست، مشکل **volume** و **migrate** هست — همون‌هایی که توی درس ۱۴ حل کردیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۳. <span dir='ltr'>`frontend-react/Dockerfile`</span> — Multi-stage</span>

</div>

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**دقیقاً همون الگوی درس ۱۳ و ۱۴.** Image نهایی ~۵۰ مگابایت.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۴. `nginx.conf` — مهم‌ترین تفاوت این درس</span>

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

    location / {
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    location /admin/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # ⭐⭐⭐ این بلوک، کلید WebSocket ⭐⭐⭐
    location /ws/ {
        proxy_pass http://backend;

        # سه خط حیاتی
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";

        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # اتصال طولانیه — timeout رو زیاد کن
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }

    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        access_log off;
    }
}
```

**سه خط حیاتی برای WebSocket:**

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

**چرا این سه خط؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• مرورگر برای WebSocket یه درخواست HTTP می‌فرسته با هدر `Upgrade: websocket`</span> <br>
<span dir='rtl'>• این یه «دعوت به ارتقا»ست: «هی سرور، این HTTP رو به WebSocket تبدیل کن»</span> <br>
<span dir='rtl'>• Nginx **به‌طور پیش‌فرض** این هدر رو پاس نمی‌ده — یعنی به backend می‌گه «یه HTTP معمولی»</span> <br>
<span dir='rtl'>• نتیجه: backend هم یه HTTP معمولی جواب می‌ده، WebSocket بسته می‌شه</span> <br>
<span dir='rtl'>• با این سه خط: Nginx هدر رو پاس می‌ده، backend آپ‌گرید رو قبول می‌کنه، تونل دوطرفه باز می‌شه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`proxy_read_timeout 3600s`:** بدون این، اتصال بعد از ۶۰ ثانیه (پیش‌فرض Nginx) قطع می‌شه. ۳۶۰۰ ثانیه (یک ساعت) کافیه.</span>

</div>

**تفاوت با <span dir='ltr'>`/api/`</span>:** <span dir='ltr'>`location /api/`</span> فقط `proxy_pass` داره، بدون Upgrade. **چرا؟** چون HTTP آپ‌گرید نمی‌خواد. اگه `Upgrade` رو برای <span dir='ltr'>`/api/`</span> هم بذاری، Nginx گیج می‌شه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۵. <span dir='ltr'>`compose.yaml`</span> — orchestrator</span>

</div>

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-chatflow}
      POSTGRES_USER: ${POSTGRES_USER:-chatflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatflow_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-chatflow} -d ${POSTGRES_DB:-chatflow}"]
      interval: 5s
      timeout: 5s
      retries: 10
      start_period: 10s
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 5s
      timeout: 3s
      retries: 5
    restart: unless-stopped

  migrate:
    build:
      context: ./backend-django
    command: python manage.py migrate --noinput
    environment: &django_env
      DEBUG: ${DEBUG:-True}
      SECRET_KEY: ${SECRET_KEY:-dev-only-insecure-change-me}
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1,backend}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8090}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8090}
      POSTGRES_DB: ${POSTGRES_DB:-chatflow}
      POSTGRES_USER: ${POSTGRES_USER:-chatflow}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-chatflow_dev_password}
      POSTGRES_HOST: db
      POSTGRES_PORT: "5432"
      REDIS_URL: redis://redis:6379/0
    depends_on:
      db:
        condition: service_healthy

  backend:
    build:
      context: ./backend-django
    environment: *django_env
    volumes:
      - static_files:/app/staticfiles
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://localhost:8000/health/')"]
      interval: 5s
      timeout: 3s
      retries: 12
      start_period: 20s
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8090:80"
    volumes:
      - static_files:/app/staticfiles:ro
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  postgres_data:
  static_files:
```

**تفاوت با درس ۱۴:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`worker` حذف شد** — این پروژه Celery نداره</span> <br>
<span dir='rtl'>• **همون <span dir='ltr'>`&django_env`</span> و <span dir='ltr'>`*django_env`</span>** — یه env برای دو سرویس (<span dir='ltr'>migrate</span>، backend)</span> <br>
<span dir='rtl'>• **همون <span dir='ltr'>`static_files`</span> volume** — بین backend و frontend مشترک</span> <br>
<span dir='rtl'>• **همون `depends_on` و `healthcheck`** — همون ترتیب</span> <br>

</div>

**پس چی تغییر کرد؟** فقط:

<div align='right' dir='rtl'>

<span dir='rtl'>1. `redis` حالا Channel Layer هست (نقشش عوض شد، ولی image همونه)</span> <br>
<span dir='rtl'>2. `backend` حالا Daphne اجرا می‌کنه (از `CMD` توی Dockerfile)</span> <br>
<span dir='rtl'>3. `worker` حذف شد</span> <br>

</div>

**این درس مهمه:** بخش زیادی از compose، از درس ۱۴ کپی شده. **ذهنیت داکری یعنی این:** الگوها تکرار می‌شن. اگه یه بار یاد بگیری، بار بعد فقط تفاوت‌ها رو تنظیم می‌کنی.

---

## ۹. جریان WebSocket — از صفر تا صد

بذار یه بار کل ماجرا رو ببینیم.

### مرحله ۱ — کاربر لاگین می‌کنه

<div align='right' dir='rtl'>

<span dir='rtl'>• کاربر توی مرورگر <span dir='ltr'>`http://127.0.0.1:8090/`</span> رو باز می‌کنه</span> <br>
<span dir='rtl'>• فرم رو پر می‌کنه و روی «Register» می‌زنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>`POST /api/auth/register/`</span> ← <span dir='ltr'>Nginx</span> ← Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>`POST /api/auth/login/`</span> ← <span dir='ltr'>Nginx</span> ← Django</span> <br>
<span dir='rtl'>• Django دو توکن برمی‌گردونه: `access` (۱ ساعت) و `refresh` (۷ روز)</span> <br>
<span dir='rtl'>• فرانت‌اند توکن‌ها رو توی `localStorage` ذخیره می‌کنه</span> <br>

</div>

### مرحله ۲ — کاربر وارد یه اتاق می‌شه

<div align='right' dir='rtl'>

<span dir='rtl'>• React روی یه اتاق کلیک می‌کنه</span> <br>
<span dir='rtl'>• **اول** تاریخچه رو با <span dir='ltr'>`GET /api/rooms/{slug}/messages/`</span> می‌گیره (HTTP)</span> <br>
<span dir='rtl'>• **بعد** WebSocket رو باز می‌کنه: <span dir='ltr'>`ws://.../ws/chat/{slug}/?token=<access>`</span></span> <br>
<span dir='rtl'>• Nginx هدرهای `Upgrade` رو پاس می‌ده</span> <br>
<span dir='rtl'>• `JWTAuthMiddleware` توکن رو اعتبارسنجی می‌کنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>`ChatConsumer.connect()`</span> اجرا می‌شه</span> <br>
<span dir='rtl'>• کاربر به گروه <span dir='ltr'>`chat_{slug}`</span> توی Redis اضافه می‌شه</span> <br>
<span dir='rtl'>• <span dir='ltr'>`accept()`</span> — اتصال برقرار شد ✅</span> <br>

</div>

### مرحله ۳ — کاربر پیام می‌فرسته

<div align='right' dir='rtl'>

<span dir='rtl'>• کاربر Enter می‌زنه</span> <br>
<span dir='rtl'>• React: <span dir='ltr'>`ws.send(JSON.stringify({ message: "سلام!" }))`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>`ChatConsumer.receive()`</span> اجرا می‌شه</span> <br>
<span dir='rtl'>• پیام توی PostgreSQL ذخیره می‌شه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`group_send()`**</span> به گروه <span dir='ltr'>`chat_{slug}`</span> — این خط کلیدیه</span> <br>

</div>

### مرحله ۴ — Redis پیام رو پخش می‌کنه

<div align='right' dir='rtl'>

<span dir='rtl'>• Redis به همه‌ی consumerهایی که عضو <span dir='ltr'>`chat_{slug}`</span> هستن پیام می‌ده</span> <br>
<span dir='rtl'>• **حتی اگه `alice` و `bob` روی دو سرور مختلف باشن**، بازم کار می‌کنه</span> <br>
<span dir='rtl'>• این یعنی **مقیاس‌پذیری:** می‌تونی ۱۰۰ سرور داشته باشی، همه با یه Redis</span> <br>

</div>

### مرحله ۵ — همه پیام رو می‌بینن

<div align='right' dir='rtl'>

<span dir='rtl'>• هر `ChatConsumer` متد <span dir='ltr'>`chat_message()`</span> رو صدا می‌زنه</span> <br>
<span dir='rtl'>• پیام رو به WebSocket کاربر خودش می‌فرسته</span> <br>
<span dir='rtl'>• React پیام رو به لیست اضافه می‌کنه</span> <br>
<span dir='rtl'>• **هیچ رفرشی لازم نیست** ✅</span> <br>

</div>

**کل این ماجرا:**

```text
React ──► Nginx ──► Daphne ──► PostgreSQL (ذخیره)
                        │
                        └──► Redis (پخش) ──► همه‌ی Consumerها ──► React (همه‌ی مرورگرها)
```

---

## ۱۰. اجرا

از داخل <span dir='ltr'>`15-chat/`</span>:

```bash
docker compose up --build
```

**انتظار:**

```text
 ✔ Container 15-chat-db-1        Healthy
 ✔ Container 15-chat-redis-1     Healthy
 ✔ Container 15-chat-migrate-1   Exited (0)
 ✔ Container 15-chat-backend-1   Healthy
 ✔ Container 15-chat-frontend-1  Started
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`migrate` با `Exited (0)` = خوبه.** (یادت باشه چرا.)</span>

</div>

**لاگ‌های مهم بک‌اند:**

```text
backend-1  | Starting: daphne -b 0.0.0.0 -p 8000 config.asgi:application
backend-1  | INFO     Listening on TCP address 0.0.0.0:8000
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`Daphne` توی لاگ، یعنی درست بالا اومده.** ✅</span>

</div>

---

## ۱۱. تست

### تست ۱ — Endpoint سلامت

```text
http://127.0.0.1:8090/health/
```

**انتظار:** <span dir='ltr'>`{"status": "ok"}`</span>

### تست ۲ — صفحه‌ی اصلی

```text
http://127.0.0.1:8090/
```

**انتظار:** فرم لاگین با عنوان «ChatFlow».

### تست ۳ — ثبت‌نام اولین کاربر

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>Username</span>: `alice`</span> <br>
<span dir='rtl'>• <span dir='ltr'>Password</span>: `alicepass123`</span> <br>

</div>

**انتظار:** ورود به صفحه‌ی لیست اتاق‌ها.

### تست ۴ — ساخت اتاق

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>New room name</span>: `general`</span> <br>

</div>

**انتظار:** اتاق <span dir='ltr'>`#general`</span> با <span dir='ltr'>`0 messages`</span>.

### تست ۵ — وارد شدن به اتاق

روی <span dir='ltr'>`#general`</span> کلیک کن.

**انتظار:**

<div align='right' dir='rtl'>

<span dir='rtl'>• هدر: <span dir='ltr'>`#general  ● connected`</span> (سبز)</span> <br>
<span dir='rtl'>• متن: <span dir='ltr'>`No messages yet. Say hi! 👋`</span></span> <br>

</div>

### تست ۶ — ارسال پیام

پیام: <span dir='ltr'>`Hello world!`</span>

**انتظار:** پیام در سمت راست (آبی) ظاهر می‌شه.

### تست ۷ — ⭐ تست واقعی WebSocket (دو مرورگر)

**این تست، مهم‌ترین تست این درسه:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. مرورگر دوم (Incognito) ← <span dir='ltr'>`http://127.0.0.1:8090/`</span></span> <br>
<span dir='rtl'>2. ثبت‌نام: <span dir='ltr'>`bob`</span> / `bobpass123`</span> <br>
<span dir='rtl'>3. وارد اتاق <span dir='ltr'>`#general`</span> بشه</span> <br>
<span dir='rtl'>4. `bob` پیام بفرسته: <span dir='ltr'>`Hi alice!`</span></span> <br>

</div>

**چی باید بشه؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• `bob` پیام خودش رو سمت راست (آبی) می‌بینه</span> <br>
<span dir='rtl'>• `alice` (توی مرورگر اول، هنوز توی اتاق `general` هست) **بدون رفرش** پیام `bob` رو می‌بینه</span> <br>
<span dir='rtl'>• همین‌طور برعکس</span> <br>

</div>

**اگه این کار کرد، یعنی WebSocket درست کار می‌کنه.** 🎉

### تست ۸ — لاگ WebSocket

```bash
docker compose logs -f backend
```

بعد از اتصال، باید ببینی:

```text
WSCONNECTING /ws/chat/general/
WSCONNECT /ws/chat/general/
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`WSCONNECT` یعنی اتصال کامل شد.** ✅</span>

</div>

### تست ۹ — کانال‌های Redis

```bash
docker compose exec redis redis-cli PUBSUB CHANNELS
```

**انتظار:**

```text
chat_general
```

یعنی Redis گروه `chat_general` رو می‌شناسه. ✅

---

## ۱۲. مشکلات رایج

### مشکل ۱ — WebSocket بعد از چند ثانیه قطع می‌شه ⭐ مهم‌ترین مشکل

**علت:** `redis-py` نسخه ۸+ به‌طور پیش‌فرض `socket_timeout=5` داره. `channels_redis` از دستور `BRPOP` استفاده می‌کنه که **بلاکینگه** و ۵ ثانیه منتظر پیام می‌مونه. این دو با هم تصادم می‌کنن ← `Timeout reading from redis:6379`.

**علامت:** توی لاگ backend می‌بینی:

```text
redis.exceptions.TimeoutError: Timeout reading from redis:6379
```

**راه‌حل:** توی <span dir='ltr'>`settings.py`</span>، `socket_timeout` رو **داخل هر host** بذار:

```python
'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}]
```

**نه** به‌عنوان کلید جداگانه:

<div align='left' dir='ltr'>

```python
# ❌ اشتباه — خطا: unexpected keyword argument 'socket_timeout'
'hosts': [env('REDIS_URL')], 'socket_timeout': 20
```

</div>

**این تله رو تجربه کردیم و این راه‌حل رو پیدا کردیم.**

### مشکل ۲ — درخواست‌های API بعد از یک ساعت 401 می‌دن

**علت:** access token منقضی شده (عمرش ۱ ساعته). **فرانت‌اند، interceptor auto-refresh نداره.**

**راه‌حل:** توی <span dir='ltr'>`api.js`</span>، interceptor رو پیاده کن (که کردیم). اگه بازم 401 گرفتی، localStorage رو پاک کن:

```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('username')
```

بعد لاگین کن.

### مشکل ۳ — <span dir='ltr'>`/health/`</span> صفحه‌ی React رو نشون می‌ده

**علت:** Nginx بلوک <span dir='ltr'>`location /health/`</span> نداره.

**راه‌حل:** `nginx.conf` رو چک کن. باید <span dir='ltr'>`proxy_pass http://backend`</span> داشته باشه.

### مشکل ۴ — WebSocket handshake شکست می‌خوره

**علت:** Nginx هدرهای `Upgrade` و `Connection` رو پاس نمی‌ده.

**راه‌حل:** بلوک <span dir='ltr'>`/ws/`</span> توی `nginx.conf` باید این سه خط رو داشته باشه:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### مشکل ۵ — `migrate` نشون می‌ده `Exited (0)`

**این درسته.** `migrate` یه سرویس یک‌بارمصرفه. مایگریشن می‌زنه، خارج می‌شه. `backend` منتظر `service_completed_successfully` می‌مونه.

### مشکل ۶ — پورت 8090 در استفاده است

```yaml
frontend:
  ports:
    - "127.0.0.1:8091:80"
```

بعد `http://127.0.0.1:8091` استفاده کن.

---

## ۱۳. جمع‌بندی

### چیزهایی که یاد گرفتیم

**۱. ذهنیت داکری — ۸ سؤال:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. اجزا چیه؟ ← سرویس‌ها</span> <br>
<span dir='rtl'>2. هر کدوم چی لازم دارن؟ ← Dockerfile یا Image آماده</span> <br>
<span dir='rtl'>3. چطور حرف می‌زنن؟ ← Network + نام سرویس</span> <br>
<span dir='rtl'>4. داده چی زنده بمونه؟ ← Volume</span> <br>
<span dir='rtl'>5. تنظیمات چی؟ ← Environment Variables</span> <br>
<span dir='rtl'>6. چطور Build بشه؟ ← Single یا Multi-stage</span> <br>
<span dir='rtl'>7. ترتیب شروع؟ ← <span dir='ltr'>depends_on</span> + healthcheck</span> <br>
<span dir='rtl'>8. **پروتکل چیه؟** ← HTTP یا WebSocket؟ ⭐</span> <br>

</div>

**۲. سه تغییر کلیدی وقتی WebSocket داری:**

<div align='center' dir='rtl'>

| # | چی عوض می‌شه | چرا |
|---|--------------|------|
| ۱ |<span dir='rtl'> **Daphne به‌جای Gunicorn** </span>|<span dir='rtl'> Gunicorn فقط <span dir='ltr'>WSGI</span> (HTTP)، <span dir='ltr'>Daphne ASGI</span> (<span dir='ltr'>HTTP</span> + WS) </span>|
| ۲ |<span dir='rtl'> **Nginx هدر Upgrade** </span>|<span dir='rtl'> برای تبدیل HTTP به WebSocket </span>|
| ۳ |<span dir='rtl'> **JWT از query string** </span>|<span dir='rtl'> مرورگر WebSocket نمی‌تونه هدر بفرسته </span>|

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۳. Redis دو نقش داره:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• توی درس ۱۴: صف Celery (پیام‌ها برای worker)</span> <br>
<span dir='rtl'>• توی درس ۱۵: Channel Layer (پیام‌ها برای همه‌ی consumerها)</span> <br>
<span dir='rtl'>• **همون image، همون config، نقش متفاوت — کاربردش رو کد ما تعیین می‌کنه**</span> <br>

</div>

**۴. جریان WebSocket:**

```text
React ──► Nginx ──► Daphne ──► PostgreSQL (ذخیره)
                        │
                        └──► Redis (پخش) ──► همه‌ی consumerها ──► همه‌ی مرورگرها
```

<div align='right' dir='rtl'>

<span dir='rtl'>**۵. Nginx به‌عنوان گارسون:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/api/`</span> ← <span dir='ltr'>backend</span> (HTTP)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/admin/`</span> ← <span dir='ltr'>backend</span> (HTTP)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/health/`</span> ← <span dir='ltr'>backend</span> (HTTP)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/static/`</span> ← فایل‌های Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/`</span> ← React</span> <br>
<span dir='rtl'>• **<span dir='ltr'>`/ws/`</span> ← <span dir='ltr'>backend</span> (<span dir='ltr'>WebSocket</span> + Upgrade)** ⭐</span> <br>

</div>

**۶. الگوهای مشترک با درس ۱۴:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>Multi-stage build</span> (<span dir='ltr'>Node</span> ← Nginx)</span> <br>
<span dir='rtl'>• `migrate` یک‌بارمصرفه</span> <br>
<span dir='rtl'>• `gosu` برای permission volume</span> <br>
<span dir='rtl'>• <span dir='ltr'>`&django_env`</span> توی compose</span> <br>
<span dir='rtl'>• <span dir='ltr'>`depends_on`</span> + `healthcheck`</span> <br>

</div>

### نکته‌ی کلیدی این درس

**ذهنیت داکری = ۸ سؤال**

سؤال هشتم (پروتکل) رو اضافه کردیم. هر پروژه‌ای دیدی، اول بپرس: «HTTP یا WebSocket؟» اگه WebSocket بود، سه چیز رو عوض کن: سرور، Nginx، احراز هویت.

**این ارزشمندترین چیزیه که این دوره بهت می‌ده.**

### آنچه در ادامه می‌آید

**درس ۱۶ — Bookmark Manager (Push/Pull به Docker Hub)**

یه پروژه‌ی جدید که:

<div align='right' dir='rtl'>

<span dir='rtl'>• Image رو با tag می‌سازیم</span> <br>
<span dir='rtl'>• به <span dir='ltr'>Docker Hub</span> push می‌کنیم</span> <br>
<span dir='rtl'>• از <span dir='ltr'>Docker Hub</span> pull می‌کنیم</span> <br>
<span dir='rtl'>• **یاد می‌گیریم چطور Image رو به اشتراک بذاریم**</span> <br>

</div>

و بعد از اون:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۷:** URL Shortener (CI/CD با GitHub Actions)</span> <br>
<span dir='rtl'>• **درس ۱۸:** Portfolio (Deploy به <span dir='ltr'>VPS</span> + SSL + <span dir='ltr'>Domain</span>)</span> <br>
<span dir='rtl'>• **درس ۱۹:** <span dir='ltr'>Vault</span> (<span dir='ltr'>Security</span>: <span dir='ltr'>Trivy</span>، Secrets، <span dir='ltr'>Hardening</span>)</span> <br>
<span dir='rtl'>• **درس ۲۰:** Log Analyzer (Debugging عمیق)</span> <br>
<span dir='rtl'>• **درس ۲۱:** <span dir='ltr'>Cheat Sheet</span> + Docker Templates</span> <br>
<span dir='rtl'>• **درس ۲۲:** Wrap-up + نقشه‌ی راه</span> <br>

</div>

