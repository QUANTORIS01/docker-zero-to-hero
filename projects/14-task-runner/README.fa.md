<div align='right' dir='rtl'>

[🇬🇧 English](/projects/14-task-runner/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>Task Runner — تسک رانر</span>

</div>

> یک پردازشگر تسک فول‌استک: React + Django + Celery + Redis + PostgreSQL، همه در Docker. یه تسک بساز، و ببین چطور از <span dir='ltr'>Pending</span> ← <span dir='ltr'>Processing</span> ← <span dir='ltr'>Done</span> توی زمان واقعی حرکت می‌کنه.

---

## معرفی

<div align='right' dir='rtl'>

<span dir='rtl'>Task Runner یه اپلیکیشن فول‌استکه که **پردازش تسک‌های پس‌زمینه** رو در یه محیط واقعی Docker نشون می‌ده. کاربران از طریق رابط وب تسک می‌سازن؛ بک‌اند اون‌ها رو توی صف Redis قرار می‌ده؛ یه Celery Worker از صف برمی‌داره، ۱۰ ثانیه کار شبیه‌سازی می‌کنه، و وضعیت رو به‌روزرسانی می‌کنه.</span>

</div>

این پروژه، پیاده‌سازی مرجع **درس ۱۴** دوره‌ی «داکر از صفر تا صد» است.

همه‌چیز رو از درس‌های قبل با هم ترکیب می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۹:** Django + PostgreSQL</span> <br>
<span dir='rtl'>• **درس ۱۰:** Celery + Redis</span> <br>
<span dir='rtl'>• **درس ۱۱:** Nginx + volume permissions + gosu</span> <br>
<span dir='rtl'>• **درس ۱۳:** فول‌استک React + Django + Multi-stage Build</span>

</div>

نتیجه، یه اپلیکیشن **شش سرویسیه** که نشون می‌ده چطور یه سیستم واقعی production، یه HTTP server، یه کارگر پس‌زمینه، یه صف پیام، یه دیتابیس، و یه reverse proxy رو با هم هماهنگ می‌کنه.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• **ساخت تسک** با عنوان، توضیحات، و ایمیل اختیاری</span> <br>
<span dir='rtl'>• **تماشای پردازش تسک در زمان واقعی** (UI هر ۲ ثانیه polling می‌کنه)</span> <br>
<span dir='rtl'>• **تغییر وضعیت:** `done` ← `processing` ← `pending`</span> <br>
<span dir='rtl'>• **Celery Worker** تسک‌ها رو مستقل از Django اجرا می‌کنه</span> <br>
<span dir='rtl'>• **Redis** تسک‌ها رو بین Django و worker صف می‌کنه</span> <br>
<span dir='rtl'>• **پنل ادمین Django** برای مشاهده و مدیریت تسک‌ها</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Multi-stage frontend build**</span> ← <span dir='ltr'>Image</span> ۱۰ برابر کوچیک‌تر</span> <br>
<span dir='rtl'>• **روی پورت ۸۰۸۹** اجرا می‌شه تا کنار بقیه‌ی پروژه‌های دوره کار کنه</span>

</div>

---

## معماری

شش سرویس با هم کار می‌کنن:

```text
کاربر ──► frontend (Nginx، پورت 8089)
            │
            ├──► /             ──► فایل‌های static React
            ├──► /api/         ──► backend:8000 (Django)
            ├──► /admin/       ──► backend:8000 (Django)
            ├──► /health/      ──► backend:8000 (Django)
            └──► /static/      ──► volume static_files
                        │
                        ▼
                ┌───────────────┐
                │   backend     │  (Django + Gunicorn)
                └───────┬───────┘
                        │
          ┌─────────────┼─────────────┐
          │             │             │
          ▼             ▼             ▼
    ┌────────┐    ┌──────────┐  ┌──────────┐
    │  db    │    │  redis   │  │ migrate  │
    │(postg.)│    │ (صف)     │  │(one-shot)│
    └────────┘    └────┬─────┘  └──────────┘
                       │
                       ▼
                  ┌──────────┐
                  │  worker  │  (Celery)
                  └──────────┘
```

<div align='center' dir='rtl'>

| سرویس | نقش | پورت | Image |
|--------|------|------|-------|
| `db` | PostgreSQL 16 | داخلی | <span dir='ltr'>`postgres:16`</span> |
| `redis` |<span dir='rtl'> صف پیام برای Celery </span>| داخلی | <span dir='ltr'>`redis:7-alpine`</span> |
| `migrate` | مایگریشن‌ها رو یک بار می‌زنه و می‌ره | — |<span dir='rtl'> از <span dir='ltr'>`./backend-django`</span> </span>|
| `backend` | Django + Gunicorn (HTTP API) |<span dir='rtl'> داخلی ۸۰۰۰ |<span dir='rtl'> از <span dir='ltr'>`./backend-django`</span> </span>|
| `worker` |<span dir='rtl'> کارگر Celery (تسک‌ها رو اجرا می‌کنه) </span>| — |<span dir='rtl'> **همون Image `backend`** </span>|
| `frontend` |<span dir='rtl'> React (build شده) + Nginx </span>|<span dir='rtl'> **۸۰۸۹** (روی هاست) </span>|<span dir='rtl'> از <span dir='ltr'>`./frontend-react`</span> </span>|

</div>

> **نکته درباره‌ی پورت:** این پروژه روی پورت **۸۰۸۹** اجرا می‌شه. بقیه‌ی پروژه‌های دوره روی ۸۰۰۰ <span dir='ltr'>(TaskFlow)</span>، ۹۰۰۰ <span dir='ltr'>(URL Monitor)</span>، ۸۰۸۰ <span dir='ltr'>(Photo Gallery)</span>، ۳۰۰۰ <span dir='ltr'>(Kanban Board)</span>، و ۸۰۸۸ <span dir='ltr'>(Recipe Book)</span>. یکتا بودن پورت‌ها یعنی هر شش پروژه می‌تونن همزمان اجرا بشن.

### دو volume

<div align='center' dir='rtl'>

| Volume | نویسنده | خواننده | چی نگه می‌داره |
|--------|----------|----------|-----------------|
| `postgres_data` | `db` | `db` | فایل‌های دیتابیس |
| `static_files` | <span dir='ltr'>`backend` (`collectstatic`)</span> | <span dir='ltr'>`frontend` (Nginx)</span> |<span dir='rtl'> CSS ادمین Django </span>|

</div>

---

## جریان Celery

اینه که پروژه رو جالب می‌کنه. بیایم ببینیم وقتی کاربر یه تسک می‌سازه چه اتفاقی می‌افته:

<div align='right' dir='rtl'>


<span dir='rtl'>1. کاربر توی React روی "Create task" کلیک می‌کنه</span> <br>
<span dir='rtl'>2. React یه POST به /api/tasks/ می‌فرسته ← Nginx ← backend</span> <br>
<span dir='rtl'>3. Django تسک رو با وضعیت "pending" توی PostgreSQL ذخیره می‌کنه</span> <br>
<span dir='rtl'>4. <span dir='ltr'>Django</span> `process_task.delay(task.id)` رو صدا می‌زنه← پیام توی Redis</span> <br>
<span dir='rtl'>5. Django فوراً 201 Created برمی‌گردونه (کاربر تسک رو می‌بینه)</span> <br>
<span dir='rtl'>6. React شروع به <span dir='ltr'>polling /api/tasks/</span> هر ۲ ثانیه می‌کنه</span> <br>
<span dir='rtl'>7. در این بین، Celery Worker پیام رو از Redis برمی‌داره</span> <br>
<span dir='rtl'>8. Worker وضعیت رو به "processing" تغییر می‌ده</span> <br>
<span dir='rtl'>9. <span dir='ltr'>Worker</span> ۱۰ ثانیه می‌خوابه (شبیه‌سازی کار)</span> <br>
<span dir='rtl'>10. Worker وضعیت رو به "done" تغییر می‌ده و نتیجه رو پر می‌کنه</span> <br>
<span dir='rtl'>11. polling بعدی React، وضعیت جدید رو می‌بینه</span> <br>
<span dir='rtl'>12. UI از <span dir='ltr'>Pending</span> ← <span dir='ltr'>Processing</span> ← <span dir='ltr'>Done</span> به‌روز می‌شه</span>

</div>

**نکته‌ی کلیدی:** Django هرگز block نمی‌شه. توی میلی‌ثانیه به کاربر جواب می‌ده. ۱۰ ثانیه کار **بیرون** از Django، توی worker انجام می‌شه. اگه worker کرش کنه، API سالم می‌مونه.

### چرا `migrate` سرویس جداست؟

اگه <span dir='ltr'>`backend`</span>، <span dir='ltr'>`worker`</span>، و `migrate` یه سرویس بودن، سه پروسه همزمان سعی می‌کردن مایگریشن بزنن، که باعث تداخل می‌شد. به‌جاش، `migrate` یه **کانتینر یک‌بارمصرفه** که مایگریشن‌ها رو می‌زنه، با موفقیت خارج می‌شه، و بقیه رو آزاد می‌کنه که شروع کنن.

برای همین `docker compose ps -a` نشونش می‌ده <span dir='ltr'>`Exited (0)`</span> — این رفتار درسته، نه خطا.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Multi-stage Build (مفهوم کلیدی)</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Dockerfile فرانت‌اند از **دو مرحله** استفاده می‌کنه:</span>

</div>

### مرحله‌ی ۱ — Build

```dockerfile
FROM node:22-alpine AS builder
# ... install deps, run `npm run build`
```

این مرحله Node.js، <span dir='ltr'>npm</span>، و vite رو داره. React رو به فایل‌های static توی `/app/dist/` کامپایل می‌کنه.

**<span dir='ltr'>~۵۰۰</span> مگابایت.**

### مرحله‌ی ۲ — Serve

```dockerfile
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

این مرحله فقط Nginx داره. **فقط پوشه‌ی `dist`** رو از مرحله‌ی ۱ کپی می‌کنه.

**<span dir='ltr'>~۵۰</span> مگابایت.**

### نتیجه

<div align='right' dir='rtl'>

<span dir='rtl'>Image نهایی ۱۰ برابر کوچیک‌تره، چون <span dir='ltr'>Node.js</span>، <span dir='ltr'>npm</span>، <span dir='ltr'>`node_modules`</span>، و کد سورس توش نیست. فقط Nginx + فایل‌های static.</span>

</div>

بررسی کن:

```bash
docker images | grep 14-task-runner
```

باید <span dir='ltr'>Image</span> `frontend` رو حدود ۵۰ مگابایت ببینی.

---

## چرا پردازش «شبیه‌سازی‌شده»؟

کار worker توی این پروژه اینه که **۱۰ ثانیه بخوابه و تسک رو done کنه**. ایمیل واقعی نمی‌فرسته، PDF واقعی تولید نمی‌کنه، یا به API خارجی وصل نمی‌شه.

**این عمدیه.** تمرکز درس ۱۴ روی **الگوهای Docker** هست، نه روی یه عملیات تجاری خاص. تابع `process_task` می‌تونه با هر کار واقعی جایگزین بشه:

```python
# به‌جای time.sleep(10)، می‌تونی:
# - ایمیل از طریق SMTP یا SendGrid بفرستی
# - یه گزارش PDF تولید کنی
# - عکس آپلودی رو resize کنی
# - به یه API خارجی وصل شی
# - یه job مایگریشن یا پاک‌سازی دیتابیس اجرا کنی
```

معماری Docker اطرافش (Redis، worker، backend، Nginx) **دقیقاً همون** می‌مونه. اینم کل نکته: وقتی الگو رو یاد بگیری، هر کار واقعی رو می‌تونی توش بذاری.

**مثال‌های واقعی که دقیقاً همین الگو رو دنبال می‌کنن:**

<p dir='rtl'>
• ارسال ایمیل تأیید سفارش بعد از خرید <br>
• تولید PDF فاکتور ماهانه <br>
• پردازش آپلود ویدیو <br>
• اعلان توی Slack وقتی یه deployment تموم شد <br>
• چرخش کلیدهای رمزنگاری طبق زمان‌بندی
</p>

<p dir='rtl'>
Docker setup عوض نمی‌شه. فقط بدنه‌ی تابع عوض می‌شه.
</p>

---

## شروع سریع

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/14-task-runner
```

### ۲. ساخت فایل محیطی بک‌اند

```bash
cp backend-django/.env.example backend-django/.env
```

### ۳. ساخت و اجرا

```bash
docker compose up --build
```

اولین build بین ۳ تا ۵ دقیقه طول می‌کشه. buildهای بعدی کش می‌شن.

### ۴. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='rtl'>• **Task Runner:** <span dir='ltr'><http://127.0.0.1:8089/></span></span> <br>
<span dir='rtl'>• **پنل ادمین:** <span dir='ltr'><http://127.0.0.1:8089/admin/></span></span> <br>
<span dir='rtl'>• **API:** <span dir='ltr'><http://127.0.0.1:8089/api/tasks/></span></span> <br>
<span dir='rtl'>• **Health check:** <span dir='ltr'><http://127.0.0.1:8089/health/></span></span>

</div>

### ۵. ساخت کاربر ادمین (اختیاری)

```bash
docker compose exec backend python manage.py createsuperuser
```

### ۶. امتحان کن!

<div align='right' dir='rtl'>

<span dir='rtl'>۱. عنوان تسک رو پر کن (مثلاً «Test background task»).</span> <br>
<span dir='rtl'>۲. روی **Create task** بزن.</span> <br>
<span dir='rtl'>۳. کارت رو فوراً با وضعیت **Pending** ببین.</span> <br>
<span dir='rtl'>۴. توی ۱-۲ ثانیه، به **Processing** تغییر می‌کنه (آیکن چرخان).</span> <br>
<span dir='rtl'>۵. بعد از ۱۰ ثانیه، به **Done** تغییر می‌کنه (تیک سبز).</span> <br>
<span dir='rtl'>۶. یه پیام نتیجه‌ی سبز زیرش ظاهر می‌شه.</span>

</div>

**توی ترمینال دیگه، لاگ‌ها رو ببین:**

```bash
docker compose logs -f worker
```

می‌بینی:

```text
Task tasks.tasks.process_task[abc-123] received
Task tasks.tasks.process_task[abc-123] succeeded in 10.5s: Task 1 done
```

---

## ساختار پروژه

```text
14-task-runner/
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
│   │   ├── celery.py       ← تنظیمات Celery
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py       ← مدل Task
│       ├── serializers.py
│       ├── tasks.py        ← تسک Celery
│       ├── urls.py
│       ├── views.py        ← Endpointهای API
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
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Header.jsx
            ├── TaskForm.jsx
            ├── TaskCard.jsx
            └── Loading.jsx
```

یه فایل <span dir='ltr'>`.gitignore`</span> واحد در ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده.

---

## متغیرهای محیطی

تعریف‌شده در <span dir='ltr'>`backend-django/.env`</span> (نگاه کن به <span dir='ltr'>`.env.example`</span>):

<div align='center' dir='rtl'>

| متغیر | هدف | پیش‌فرض |
|-------|------|---------|
| `SECRET_KEY` | کلید مخفی جنگو | — (الزامی) |
| `DEBUG` | حالت دیباگ | `True` |
| `ALLOWED_HOSTS` | هاست‌های مجاز، جداشده با کاما | <span dir='ltr'>`localhost,127.0.0.1`</span> |
| `CORS_ALLOWED_ORIGINS` |<span dir='rtl'> آدرس‌های React </span>| <span dir='ltr'>`http://localhost:5173,http://localhost:8089`</span> |
| `CSRF_TRUSTED_ORIGINS` |<span dir='rtl'> آدرس‌های مورد اعتماد برای POST </span>| <span dir='ltr'>`http://localhost:5173,http://localhost:8089`</span> |
| `POSTGRES_DB` | نام دیتابیس | `taskrunner` |
| `POSTGRES_USER` | کاربر دیتابیس | `taskrunner` |
| `POSTGRES_PASSWORD` | رمز دیتابیس | `taskrunner_dev_password` |
| `POSTGRES_HOST` | هاست دیتابیس |<span dir='rtl'> `localhost` (در <span dir='ltr'>`.env`</span>)، `db` (در compose) </span>|
| `POSTGRES_PORT` | پورت دیتابیس | `5432` |
| `REDIS_URL` |<span dir='rtl'> آدرس اتصال Redis </span>|<span dir='rtl'> <span dir='ltr'>`redis://localhost:6379/0`</span> (در <span dir='ltr'>`.env`</span>)، <span dir='ltr'>`redis://redis:6379/0`</span> (در compose) </span>|

</div>

**فایل <span dir='ltr'>`.env`</span> رو هرگز کامیت نکن.**

---

<div align='right' dir='rtl'>

## <span dir='rtl'>Endpointهای API</span>

</div>

<div align='center' dir='rtl'>

| متد | مسیر | توضیح |
|-----|------|-------|
| GET | <span dir='ltr'>`/health/`</span> | بررسی سلامت |
| GET | <span dir='ltr'>`/api/tasks/`</span> | لیست همه‌ی تسک‌ها |
| POST | <span dir='ltr'>`/api/tasks/`</span> |<span dir='rtl'> ساخت تسک جدید (Celery job رو dispatch می‌کنه) </span>|
| GET | <span dir='ltr'>`/api/tasks/{id}/`</span> | دیدن یک تسک |
| GET | <span dir='ltr'>`/admin/`</span> |<span dir='rtl'> پنل ادمین Django </span>|

</div>

### مثال: ساخت تسک

```bash
curl -X POST http://127.0.0.1:8089/api/tasks/ \
  -H "Content-Type: application/json" \
  -d '{"title": "Send newsletter", "description": "To all subscribers"}'
```

پاسخ (201 Created):

```json
{
  "id": 1,
  "title": "Send newsletter",
  "description": "To all subscribers",
  "email": "",
  "status": "pending",
  "status_display": "Pending",
  "result": "",
  "created_at": "2025-10-31T12:00:00Z",
  "updated_at": "2025-10-31T12:00:00Z"
}
```

ده ثانیه بعد:

```bash
curl http://127.0.0.1:8089/api/tasks/1/
```

پاسخ نشون می‌ده <span dir='ltr'>`"status": "done"`</span> و <span dir='ltr'>`"result": "Processed 'Send newsletter' successfully."`</span>.

---

## حالت توسعه (بدون Docker)

### بک‌اند

```bash
cd backend-django
python -m venv .venv
source .venv/bin/activate        # یا: .venv\Scripts\activate در ویندوز
pip install -r requirements.txt

# PostgreSQL و Redis رو لوکال بالا بیار، سپس:
python manage.py migrate
python manage.py runserver
```

روی <span dir='ltr'><http://localhost:8000/></span> اجرا می‌شه.

<div align='right' dir='rtl'>

<span dir='rtl'>**Celery worker رو توی یه ترمینال دیگه بالا بیار:**</span>

</div>

```bash
cd backend-django
source .venv/bin/activate
celery -A config worker --loglevel=info
```

### فرانت‌اند

```bash
cd frontend-react
npm install
npm run dev
```

روی <span dir='ltr'><http://localhost:5173/></span> اجرا می‌شه. proxy ویت درخواست‌های <span dir='ltr'>`/api`</span> رو به `localhost:8000` پاس می‌ده.

---

## دستورات پرکاربرد

```bash
# Build و اجرای همه‌چیز
docker compose up --build

# دیدن وضعیت سرویس‌ها (با کد خروج migrate)
docker compose ps -a

# دنبال کردن لاگ بک‌اند
docker compose logs -f backend

# دنبال کردن لاگ worker (جالب‌ترین لاگ‌ها!)
docker compose logs -f worker

# باز کردن shell داخل بک‌اند
docker compose exec backend bash

# باز کردن shell داخل worker
docker compose exec worker bash

# باز کردن psql
docker compose exec db psql -U taskrunner -d taskrunner

# بررسی کلیدهای Redis (دیدن صف Celery)
docker compose exec redis redis-cli keys '*'

# توقف (volume حفظ می‌شه)
docker compose down

# توقف و حذف volumeها (هشدار: داده‌ها پاک می‌شن)
docker compose down -v
```

---

## عیب‌یابی

### مشکل ۱ — <span dir='ltr'>`/health/`</span> به‌جای <span dir='ltr'>`{"status": "ok"}`</span> صفحه‌ی React رو نشون می‌ده

**علت:** Nginx بلاک <span dir='ltr'>`location /health/`</span> نداره.

**راه‌حل:** توی `frontend-react/nginx.conf` اضافه کن:

```nginx
location /health/ {
    proxy_pass http://backend;
    proxy_set_header Host $http_host;
}
```

### مشکل ۲ — تسک‌ها برای همیشه Pending می‌مونن

**علت:** Celery worker در حال اجرا نیست یا به Redis وصل نمی‌شه.

**بررسی:**

```bash
docker compose logs worker
```

دنبال خطاهایی مثل <span dir='ltr'>`Cannot connect to redis://...`</span> یا `ModuleNotFoundError` بگرد. مطمئن شو `worker` توی `docker compose ps` با وضعیت `Up` هست.

### مشکل ۳ — لاگ worker پیام رو نشون می‌ده ولی وضعیت عوض نمی‌شه

**علت:** worker به PostgreSQL وصل نمی‌شه.

**بررسی:**

```bash
docker compose logs worker | grep -i "database\|error"
```

مطمئن شو `POSTGRES_HOST: db` برای سرویس `worker` توی `compose.yaml` هست.

### مشکل ۴ — سرویس `migrate` نشون می‌ده `Exited (0)`

**این درسته.** سرویس `migrate` یه بار مایگریشن‌ها رو می‌زنه و می‌ره. یه **کانتینر یک‌بارمصرفه**، نه یه سرویس دائمی.

### مشکل ۵ — CSRF verification failed هنگام لاگین به ادمین

**راه‌حل:** مطمئن شو `CSRF_TRUSTED_ORIGINS` توی <span dir='ltr'>`.env`</span> شامل `http://127.0.0.1:8089` هست:

```dotenv
CSRF_TRUSTED_ORIGINS=http://localhost:8089,http://127.0.0.1:8089
```

### مشکل ۶ — پورت ۸۰۸۹ در استفاده است

پورت هاست رو عوض کن:

```yaml
frontend:
  ports:
    - "127.0.0.1:8090:80"
```

بعد از `http://127.0.0.1:8090` استفاده کن.

---

## اجرا در کنار بقیه‌ی پروژه‌ها

تخصیص پورت‌های دوره:

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۰۹ | TaskFlow | ۸۰۰۰ |
| ۱۰ | URL Monitor | ۹۰۰۰ |
| ۱۱ | Photo Gallery | ۸۰۸۰ |
| ۱۲ | Kanban Board | ۳۰۰۰ |
| ۱۳ | Recipe Book | ۸۰۸۸ |
| **۱۴** | **Task Runner** | **۸۰۸۹** |

</div>

هر شش‌تا می‌تونن همزمان اجرا بشن. هر کدوم مستقله؛ توقف یکی روی بقیه اثری نداره.

---

## نکات محیط عملیاتی

قبل از استقرار در محیط تولید:

<div align='right' dir='rtl'>

<span dir='rtl'>• [ ] `DEBUG=False` بگذار</span> <br>
<span dir='rtl'>• [ ] از `SECRET_KEY` واقعی استفاده کن</span> <br>
<span dir='rtl'>• [ ] `ALLOWED_HOSTS` رو به دامنه‌ی واقعی ست کن</span> <br>
<span dir='rtl'>• [ ] `CORS_ALLOWED_ORIGINS` و `CSRF_TRUSTED_ORIGINS` رو به `https://yourdomain.com` ست کن</span> <br>
<span dir='rtl'>• [ ] از HTTPS استفاده کن (Nginx با گواهی Let's Encrypt)</span> <br>
<span dir='rtl'>• [ ] تعداد workerهای Gunicorn و همزمانی Celery رو بر اساس هسته‌های CPU زیاد کن</span> <br>
<span dir='rtl'>• [ ] `time.sleep` رو با کار واقعی جایگزین کن</span> <br>
<span dir='rtl'>• [ ] Celery monitoring (Flower) و مدیریت خطا (`autoretry_for`) اضافه کن</span> <br>
<span dir='rtl'>• [ ] برای `postgres_data` بکاپ تنظیم کن</span> <br>
<span dir='rtl'>• [ ] `CELERY_TASK_ALWAYS_EAGER = False` بگذار (پیش‌فرض؛ فقط در تست‌ها `True` باشه)</span> <br>
<span dir='rtl'>• [ ] از سیستم مدیریت Secret برای اعتبارنامه‌ها استفاده کن</span> <br>
<span dir='rtl'>• [ ] `static_files` رو برای استقرار چندسروره به object storage (S3) منتقل کن</span>

</div>

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۴ — Fullstack + Celery + Redis**](/fa/14-task-runner/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
