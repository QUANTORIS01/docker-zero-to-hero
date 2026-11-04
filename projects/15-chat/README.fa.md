<div align='right' dir='rtl'>

[🇬🇧 English](/projects/15-chat/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>ChatFlow — چت‌فلو</span>

</div>

> یک اپلیکیشن چت real-time فول‌استک: React + Django Channels + WebSocket + Redis + PostgreSQL، همه در Docker. وارد یک اتاق شو و پیام‌ها را **بدون رفرش** ببین.

---

## معرفی

<div align='right' dir='rtl'>

<span dir='rtl'>ChatFlow یک اپلیکیشن چت است که **ارتباط real-time** را در یک محیط واقعی Docker نشان می‌دهد. کاربران ثبت‌نام می‌کنند، وارد اتاق‌های چت می‌شوند، و پیام‌ها **لحظه‌ای** بین همه‌ی کاربران آن اتاق پخش می‌شوند — بدون هیچ رفرشی.</span>

</div>

این پروژه، پیاده‌سازی مرجع **درس ۱۵** دوره‌ی «داکر از صفر تا صد» است.

تفاوت اصلی این درس با درس‌های قبل:

<div align='right' dir='rtl'>

<span dir='rtl'>• **WebSocket به‌جای HTTP polling** — اتصال دائمی دوطرفه</span> <br>
<span dir='rtl'>• **Django Channels** — پشتیبانی از ASGI در Django</span> <br>
<span dir='rtl'>• **Redis به‌عنوان Channel Layer** — پخش پیام بین اتصال‌ها</span> <br>
<span dir='rtl'>• **Daphne به‌جای Gunicorn** — سرور ASGI برای WebSocket</span> <br>
<span dir='rtl'>• **Nginx با پشتیبانی WebSocket** — هدرهای `Upgrade` و `Connection`</span> <br>
<span dir='rtl'>• **JWT برای REST و WebSocket** — احراز هویت یکپارچه</span>

</div>

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **ثبت‌نام و ورود** با <span dir='ltr'>JWT</span> (access + refresh)</span> <br>
<span dir='rtl'>• **ساخت اتاق** و مشاهده لیست اتاق‌ها</span> <br>
<span dir='rtl'>• **چت real-time** با WebSocket</span> <br>
<span dir='rtl'>• **تاریخچه پیام‌ها** در PostgreSQL</span> <br>
<span dir='rtl'>• **پخش پیام بین همه کاربران اتاق** با Redis Channel Layer</span> <br>
<span dir='rtl'>• **Auto-refresh JWT** — توکن منقضی خودکار تمدید می‌شود</span> <br>
<span dir='rtl'>• **پنل ادمین Django** برای مدیریت اتاق‌ها و پیام‌ها</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Multi-stage frontend build**</span> — <span dir='ltr'>Image</span> ۱۰ برابر کوچک‌تر</span> <br>
<span dir='rtl'>• **روی پورت 8090** اجرا می‌شود تا کنار بقیه پروژه‌های دوره کار کند</span>

</div>

---

## معماری

پنج سرویس با هم کار می‌کنند:

```text
کاربر ──► frontend (Nginx، پورت 8090)
            │
            ├──► /             ──► فایل‌های static React
            ├──► /api/         ──► backend:8000 (Django REST)
            ├──► /admin/       ──► backend:8000 (Django admin)
            ├──► /health/      ──► backend:8000
            ├──► /static/      ──► volume static_files
            └──► /ws/          ──► backend:8000 (WebSocket → Daphne)
                        │
                        ▼
                ┌───────────────┐
                │   backend     │  (Django + Daphne)
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌────────┐    ┌──────────┐  ┌──────────┐
    │  db    │    │  redis   │  │ migrate  │
    │(postg.)│    │(channel  │  │(one-shot)│
    │        │    │ layer)   │  │          │
    └────────┘    └──────────┘  └──────────┘
```

<div align='center' dir='rtl'>

| سرویس | نقش | پورت | Image |
|--------|------|------|-------|
| `db` | PostgreSQL 16 | داخلی | `postgres:16` |
| `redis` |<span dir='rtl'> Channel Layer برای WebSocket </span>| داخلی | `redis:7-alpine` |
| `migrate` | مایگریشن‌ها را یک بار می‌زند و می‌رود | — |<span dir='rtl'> از <span dir='ltr'>`./backend-django`</span> </span>|
| `backend` | Django + Daphne (ASGI: HTTP + WebSocket) |<span dir='rtl'> داخلی 8000 </span>|<span dir='rtl'> از <span dir='ltr'>`./backend-django`</span> </span>|
| `frontend` |<span dir='rtl'> React (build شده) + Nginx </span>|<span dir='rtl'> **8090** (روی هاست) </span>|<span dir='rtl'> از <span dir='ltr'>`./frontend-react`</span> </span>|

</div>

> **نکته درباره‌ی پورت:** این پروژه روی پورت **8090** اجرا می‌شود. بقیه پروژه‌های دوره روی 8000 <span dir='ltr'>(TaskFlow)</span>، 9000 <span dir='ltr'>(URL Monitor)</span>، 8080 <span dir='ltr'>(Photo Gallery)</span>، 3000 <span dir='ltr'>(Kanban Board)</span>، 8088 <span dir='ltr'>(Recipe Book)</span>، و 8089 <span dir='ltr'>(Task Runner)</span>. یکتا بودن پورت‌ها یعنی همه می‌توانند همزمان اجرا شوند.

### دو volume

<div align='center' dir='rtl'>

| Volume | نویسنده | خواننده | چه چیزی نگه می‌دارد |
|--------|----------|----------|---------------------|
| `postgres_data` | `db` | `db` | فایل‌های دیتابیس |
| `static_files` | `backend` (`collectstatic`) | `frontend` (Nginx) |<span dir='rtl'> CSS ادمین Django </span>|

</div>

---

## جریان WebSocket

این چیزی است که پروژه را جالب می‌کند. بیایید ببینیم وقتی کاربر پیام می‌فرستد چه اتفاقی می‌افتد:

<div align='right' dir='rtl'>

<span dir='rtl'>1. کاربر در React یک پیام تایپ می‌کند و Enter می‌زند</span> <br>
<span dir='rtl'>2. React پیام را از طریق WebSocket به <span dir='ltr'>`/ws/chat/{room}/?token=<JWT>`</span> می‌فرستد</span> <br>
<span dir='rtl'>3. Nginx درخواست را با هدرهای `Upgrade` به Daphne پاس می‌دهد</span> <br>
<span dir='rtl'>4. `JWTAuthMiddleware` توکن را اعتبارسنجی می‌کند و <span dir='ltr'>`scope['user']`</span> را پر می‌کند</span> <br>
<span dir='rtl'>5. <span dir='ltr'>`ChatConsumer.receive()`</span> پیام را می‌گیرد</span> <br>
<span dir='rtl'>6. پیام در PostgreSQL ذخیره می‌شود</span> <br>
<span dir='rtl'>7. <span dir='ltr'>`channel_layer.group_send()`</span> پیام را به گروه <span dir='ltr'>`chat_<room>`</span> می‌فرستد</span> <br>
<span dir='rtl'>8. Redis پیام را به همه‌ی consumerهای عضو آن گروه پخش می‌کند</span> <br>
<span dir='rtl'>9. هر consumer پیام را از طریق WebSocket به مرورگر خودش می‌فرستد</span> <br>
<span dir='rtl'>10. همه کاربران اتاق پیام را **بدون رفرش** می‌بینند</span>

</div>

**نکته‌ی کلیدی:** Django هرگز block نمی‌شود. WebSocket یک اتصال دائمی است و پیام‌ها از طریق Redis بین همه‌ی نمونه‌های consumer پخش می‌شوند.

### چرا `migrate` سرویس جداست؟

اگر `backend` و `migrate` یک سرویس بودند، دو پروسه همزمان سعی می‌کردند مایگریشن بزنند و تداخل ایجاد می‌شد. به‌جایش، `migrate` یک **کانتینر یک‌بارمصرفه** است که مایگریشن‌ها را می‌زند، با موفقیت خارج می‌شود، و `backend` را آزاد می‌کند.

برای همین `docker compose ps -a` نشانش می‌دهد `Exited (0)` — این رفتار درست است، نه خطا.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Multi-stage Build (مفهوم کلیدی)</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Dockerfile فرانت‌اند از **دو مرحله** استفاده می‌کند:</span>

</div>

### مرحله‌ی ۱ — Build

```dockerfile
FROM node:22-alpine AS builder
# ... نصب وابستگی‌ها، اجرای `npm run build`
```

این مرحله <span dir='ltr'>Node.js</span>، npm، و vite را دارد. React را به فایل‌های static در `/app/dist/` کامپایل می‌کند.

**<span dir='ltr'>~500</span> مگابایت.**

### مرحله‌ی ۲ — Serve

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

این مرحله فقط Nginx دارد. **فقط پوشه‌ی `dist`** را از مرحله‌ی ۱ کپی می‌کند.

**<span dir='ltr'>~50</span> مگابایت.**

### نتیجه

<div align='right' dir='rtl'>

<span dir='rtl'>Image نهایی ۱۰ برابر کوچک‌تر است، چون <span dir='ltr'>Node.js</span>، <span dir='ltr'>npm</span>، `node_modules`، و کد سورس در آن نیست. فقط Nginx + فایل‌های static.</span>

</div>

بررسی کنید:

```bash
docker images | grep 15-chat
```

باید Image `frontend` را حدود ۵۰ مگابایت ببینید.

---

## چرا Daphne و نه Gunicorn؟

<div align='right' dir='rtl'>

<span dir='rtl'>Gunicorn یک **WSGI** server است و فقط HTTP را می‌فهمد. WebSocket یک پروتکل متفاوت است. **Daphne** یک **ASGI** server است که هم HTTP و هم WebSocket را پشتیبانی می‌کند.</span>

</div>

در درس‌های ۹ تا ۱۴ از Gunicorn استفاده کردیم چون فقط HTTP داشتیم. از این درس به بعد، هر پروژه‌ای که WebSocket دارد باید از Daphne (یا Uvicorn) استفاده کند.

---

## شروع سریع

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/15-chat
```

### ۲. ساخت فایل محیطی بک‌اند

```bash
cp backend-django/.env.example backend-django/.env
```

### ۳. ساخت و اجرا

```bash
docker compose up --build
```

اولین build بین ۳ تا ۵ دقیقه طول می‌کشد. buildهای بعدی کش می‌شوند.

### ۴. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• **ChatFlow:** <span dir='ltr'><http://127.0.0.1:8090/></span></span> <br>
<span dir='rtl'>• **پنل ادمین:** <span dir='ltr'><http://127.0.0.1:8090/admin/></span></span> <br>
<span dir='rtl'>• **API:** <span dir='ltr'><http://127.0.0.1:8090/api/rooms/></span></span> <br>
<span dir='rtl'>• **Health check:** <span dir='ltr'><http://127.0.0.1:8090/health/></span></span>

</div>

### ۵. ساخت کاربر ادمین (اختیاری)

```bash
docker compose exec backend python manage.py createsuperuser
```

### ۶. امتحان کنید!

<div align='right' dir='rtl'>

<span dir='rtl'>1. ثبت‌نام کنید (مثلاً <span dir='ltr'>`alice`</span> / `alicepass123`).</span> <br>
<span dir='rtl'>2. یک اتاق بسازید (مثلاً `general`).</span> <br>
<span dir='rtl'>3. وارد اتاق شوید — وضعیت <span dir='ltr'>**● connected**</span> (سبز) را ببینید.</span> <br>
<span dir='rtl'>4. در مرورگر دوم (Incognito) با کاربر دوم (<span dir='ltr'>`bob`</span> / `bobpass123`) وارد شوید.</span> <br>
<span dir='rtl'>5. هر دو در اتاق `general` باشید.</span> <br>
<span dir='rtl'>6. از `alice` پیام بفرستید — **بدون رفرش** در `bob` ظاهر می‌شود. 🎉</span>

</div>

**در ترمینال دیگر، لاگ‌ها را ببینید:**

```bash
docker compose logs -f backend
```

باید ببینید:

```text
WSCONNECTING /ws/chat/general/
WSCONNECT /ws/chat/general/
```

---

## ساختار پروژه

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
│   │   ├── asgi.py          ← ProtocolTypeRouter
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── chat/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── consumers.py      ← ChatConsumer (WebSocket)
│       ├── middleware.py     ← JWTAuthMiddleware
│       ├── models.py         ← Room, Message
│       ├── routing.py        ← websocket_urlpatterns
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

یک فایل <span dir='ltr'>`.gitignore`</span> واحد در ریشه‌ی ریپو هست که همه‌ی پروژه‌ها را پوشش می‌دهد.

---

## متغیرهای محیطی

تعریف‌شده در `backend-django/.env` (نگاه کنید به <span dir='ltr'>`.env.example`</span>):

<div align='right' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|------|---------|
| `SECRET_KEY` | کلید مخفی جنگو |<span dir='rtl'> — (الزامی) </span>|
| `DEBUG` | حالت دیباگ | `True` |
| `ALLOWED_HOSTS` | هاست‌های مجاز، جداشده با کاما | `localhost,127.0.0.1,backend` |
| `CORS_ALLOWED_ORIGINS` |<span dir='rtl'> آدرس‌های React </span>| `http://localhost:5173,http://localhost:8090` |
| `CSRF_TRUSTED_ORIGINS` |<span dir='rtl'> آدرس‌های مورد اعتماد برای POST </span>| `http://localhost:5173,http://localhost:8090` |
| `POSTGRES_DB` | نام دیتابیس | `chatflow` |
| `POSTGRES_USER` | کاربر دیتابیس | `chatflow` |
| `POSTGRES_PASSWORD` | رمز دیتابیس | `chatflow_dev_password` |
| `POSTGRES_HOST` | هاست دیتابیس |<span dir='rtl'> `localhost` (در <span dir='ltr'>`.env`</span>)، `db` (در compose) </span>|
| `POSTGRES_PORT` | پورت دیتابیس | `5432` |
| `REDIS_URL` |<span dir='rtl'> آدرس اتصال Redis </span>|<span dir='rtl'> `redis://localhost:6379/0` (در <span dir='ltr'>`.env`</span>)، `redis://redis:6379/0` (در compose) </span>|

</div>

**فایل <span dir='ltr'>`.env`</span> را هرگز کامیت نکنید.**

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| POST | <span dir='ltr'>`/api/auth/register/`</span> | ثبت‌نام کاربر جدید |
| POST | <span dir='ltr'>`/api/auth/login/`</span> |<span dir='rtl'> ورود، دریافت `access` و `refresh` </span>|
| POST | <span dir='ltr'>`/api/auth/refresh/`</span> |<span dir='rtl'> تمدید access token </span>|
| GET | <span dir='ltr'>`/api/auth/me/`</span> | اطلاعات کاربر جاری |
| GET | <span dir='ltr'>`/api/rooms/`</span> | لیست اتاق‌ها |
| POST | <span dir='ltr'>`/api/rooms/`</span> | ساخت اتاق جدید |
| GET | <span dir='ltr'>`/api/rooms/{slug}/`</span> | جزئیات یک اتاق |
| GET | <span dir='ltr'>`/api/rooms/{slug}/messages/`</span> | تاریخچه پیام‌های اتاق |
| GET | <span dir='ltr'>`/health/`</span> | بررسی سلامت |
| GET | <span dir='ltr'>`/admin/`</span> |<span dir='rtl'> پنل ادمین Django </span>|

</div>

<div align='right' dir='rtl'>

### WebSocket

</div>

```text
ws://127.0.0.1:8090/ws/chat/{room_slug}/?token=<access_token>
```

**فرمت پیام ارسالی (کلاینت ← سرور):**

```json
{ "message": "Hello world!" }
```

**فرمت پیام دریافتی (سرور ← کلاینت):**

```json
{
  "id": 1,
  "message": "Hello world!",
  "author": "alice",
  "created_at": "2026-11-04T12:00:00Z"
}
```

### مثال: ثبت‌نام و ورود

<div align='left' dir='ltr'>

```bash
# ثبت‌نام
curl -X POST http://127.0.0.1:8090/api/auth/register/  -H "Content-Type: application/json"  -d '{"username": "alice", "password": "alicepass123"}'

# ورود
curl -X POST http://127.0.0.1:8090/api/auth/login/  -H "Content-Type: application/json"  -d '{"username": "alice", "password": "alicepass123"}'
```

</div>

پاسخ:

```json
{
  "access": "eyJ...",
  "refresh": "eyJ..."
}
```

---

## حالت توسعه (بدون Docker)

### بک‌اند

```bash
cd backend-django
python -m venv .venv
source .venv/bin/activate        # یا: .venv\Scripts\activate در ویندوز
pip install -r requirements.txt

# PostgreSQL و Redis را لوکال بالا بیاورید، سپس:
python manage.py migrate
python manage.py runserver
```

روی <span dir='ltr'><http://localhost:8000/></span> اجرا می‌شود.

> چون `daphne` در `INSTALLED_APPS` است، `runserver` به‌طور خودکار ASGI (WebSocket) را هم سرو می‌کند.

### فرانت‌اند

```bash
cd frontend-react
npm install
npm run dev
```

روی <span dir='ltr'><http://localhost:5173/></span> اجرا می‌شود. proxy ویت درخواست‌های <span dir='ltr'>`/api`</span> و <span dir='ltr'>`/ws`</span> را به `localhost:8000` پاس می‌دهد.

---

## دستورات پرکاربرد

```bash
# Build و اجرای همه‌چیز
docker compose up --build

# دیدن وضعیت سرویس‌ها (با کد خروج migrate)
docker compose ps -a

# دنبال کردن لاگ بک‌اند (WebSocket handshakes اینجا دیده می‌شوند)
docker compose logs -f backend

# باز کردن shell داخل بک‌اند
docker compose exec backend bash

# باز کردن psql
docker compose exec db psql -U chatflow -d chatflow

# بررسی کانال‌های Redis (دیدن اتاق‌های فعال)
docker compose exec redis redis-cli PUBSUB CHANNELS

# توقف (volume حفظ می‌شود)
docker compose down

# توقف و حذف volumeها (هشدار: داده‌ها پاک می‌شوند)
docker compose down -v
```

---

## عیب‌یابی

### مشکل ۱ — WebSocket بعد از چند ثانیه قطع می‌شود

**علت:** `redis-py` نسخه ۸+ به‌طور پیش‌فرض `socket_timeout=5` دارد، در حالی که `channels_redis` با یک عملیات بلاکینگ ۵ ثانیه‌ای منتظر پیام می‌ماند. این تداخل باعث `Timeout reading from redis:6379` می‌شود.

**راه‌حل:** در <span dir='ltr'>`settings.py`</span>، `socket_timeout` را درون هر host تنظیم کنید (نه به‌عنوان کلید جداگانه):

```python
CHANNEL_LAYERS = {
    'default': {
        'BACKEND': 'channels_redis.core.RedisChannelLayer',
        'CONFIG': {
            'hosts': [{'address': env('REDIS_URL'), 'socket_timeout': 20}],
        },
    },
}
```

### مشکل ۲ — درخواست‌های API با 401 رد می‌شوند

**علت:** access token منقضی شده (عمر ۱ ساعت) و فرانت‌اند مکانیزم refresh ندارد.

**راه‌حل:** در `api.js` یک interceptor برای auto-refresh اضافه کنید (در این پروژه پیاده‌سازی شده). اگر باز هم 401 گرفتید، localStorage را پاک کنید و دوباره لاگین کنید:

```javascript
localStorage.removeItem('access_token')
localStorage.removeItem('refresh_token')
localStorage.removeItem('username')
```

### مشکل ۳ — <span dir='ltr'>`/health/`</span> صفحه‌ی React را نشان می‌دهد

**علت:** Nginx بلوک <span dir='ltr'>`location /health/`</span> ندارد.

**راه‌حل:** در `frontend-react/nginx.conf` اضافه کنید:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### مشکل ۴ — WebSocket handshake شکست می‌خورد

**علت:** Nginx هدرهای `Upgrade` و `Connection` را پاس نمی‌دهد.

**راه‌حل:** در `nginx.conf` بلوک <span dir='ltr'>`/ws/`</span> باید این سه خط را داشته باشد:

```nginx
proxy_http_version 1.1;
proxy_set_header Upgrade $http_upgrade;
proxy_set_header Connection "upgrade";
```

### مشکل ۵ — سرویس `migrate` نشان می‌دهد `Exited (0)`

**این درست است.** سرویس `migrate` یک بار مایگریشن‌ها را می‌زند و می‌رود. یک **کانتینر یک‌بارمصرفه**، نه یک سرویس دائمی.

### مشکل ۶ — پورت 8090 در استفاده است

پورت هاست را عوض کنید:

```yaml
frontend:
  ports:
    - "127.0.0.1:8091:80"
```

بعد از `http://127.0.0.1:8091` استفاده کنید.

---

## اجرا در کنار بقیه‌ی پروژه‌ها

تخصیص پورت‌های دوره:

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۰۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| ۱۳ | Recipe Book | 8088 |
| ۱۴ | Task Runner | 8089 |
| **۱۵** | **ChatFlow** | **8090** |

</div>

همه می‌توانند همزمان اجرا شوند. هر کدام مستقل است؛ توقف یکی روی بقیه اثری ندارد.

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False` بگذارید</span> <br>
<span dir='rtl'>• [ ] از `SECRET_KEY` واقعی استفاده کنید</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` را به دامنه‌ی واقعی ست کنید</span> <br>
<span dir='rtl'>• [ ] `CORS_ALLOWED_ORIGINS` و `CSRF_TRUSTED_ORIGINS` را به `https://yourdomain.com` ست کنید</span> <br>
<span dir='rtl'>• [ ] از HTTPS استفاده کنید (Nginx با گواهی Let's Encrypt) — برای WebSocket، <span dir='ltr'>`wss://`</span></span> <br>
<span dir='rtl'>• [ ] Nginx را طوری تنظیم کنید که هدر `Upgrade` را پاس دهد (همین حالا داریم)</span> <br>
<span dir='rtl'>• [ ] از `uvloop` برای Daphne استفاده کنید (اختیاری، سریع‌تر)</span> <br>
<span dir='rtl'>• [ ] برای `postgres_data` بکاپ تنظیم کنید</span> <br>
<span dir='rtl'>• [ ] از سیستم مدیریت Secret برای اعتبارنامه‌ها استفاده کنید</span> <br>
<span dir='rtl'>• [ ] `static_files` را برای استقرار چندسروره به object storage (S3) منتقل کنید</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۵ — Real-time با <span dir='ltr'>WebSocket</span> + Channels + <span dir='ltr'>Redis</span>**](/fa/15-chat/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
