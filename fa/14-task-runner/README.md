<div align='right' dir='rtl'>

[🇬🇧 English](/en/14-task-runner/README.md)

</div>

# درس ۱۴ — پروژه‌ی فول‌استک با Celery: Task Runner

## مقدمه

خب، الان ۱۳ درس رو با هم گذروندیم و پنج پروژه ساختیم. حالا وقتشه که همه‌چیزهایی که یاد گرفتیم رو **با هم** توی یه پروژه‌ی واقعی‌تر ترکیب کنیم.

توی این درس:

<div align='right' dir='rtl'>

<span dir='rtl'>• **Django** رو دوباره می‌بینیم (از درس [۹](/fa/09-django-docker/README.md))</span> <br>
<span dir='rtl'>• **Celery و Redis** رو دوباره می‌بینیم (از درس [۱۰](/fa/10-celery-redis/README.md))</span> <br>
<span dir='rtl'>• **Nginx** رو دوباره می‌بینیم (از درس [۱۱](/fa/11-nginx/README.md))</span> <br>
<span dir='rtl'>• **React و Multi-stage Build** رو دوباره می‌بینیم (از درس [۱۳](/fa/13-fullstack/README.md))</span> <br>

</div>

و همه‌ی اینا رو با هم توی یه پروژه به اسم **Task Runner** جمع می‌کنیم.

### چرا این درس مهمه؟

تا حالا هر پروژه‌ای که ساختیم، یه گوشه‌ی دنیای Docker رو نشون می‌داد. ولی پروژه‌های واقعی، **همه‌چیز** رو با هم دارن. اگه بخوای یه پروژه‌ی واقعی رو داکری کنی، باید بتونی همه‌ی این قطعات رو کنار هم بذاری.

**هدف اصلی این درس اینه:** بعد از این درس، وقتی با یه پروژه‌ی واقعی روبرو شدی، بدونی از کجا شروع کنی و چطور داکری‌ش کنی.

این ارزشمندترین چیزی است که این دوره بهت می‌ده.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'>• یک پروژه‌ی شش‌سرویسی رو با Docker Compose راه‌اندازی کنی</span> <br>
<span dir='rtl'>• توضیح بدی چرا `migrate` باید یه سرویس جدا باشه</span> <br>
<span dir='rtl'>• توضیح بدی چطور `backend` و `worker` می‌تونن از یه Image مشترک استفاده کنن</span> <br>
<span dir='rtl'>• توضیح بدی چطور یه تسک پس‌زمینه از صفر تا صد اجرا می‌شه</span> <br>
<span dir='rtl'>• **ذهنیت داکری** داشته باشی: بتونی به هر پروژه‌ای نگاه کنی و بفهمی چطور باید داکری‌ش کرد</span> <br>

</div>

---

## ۱. اول، بذار بگم چی می‌سازیم

### داستان پروژه

تصور کن می‌خوای یه کار سنگین انجام بدی. مثلاً پردازش هزاران رکورد داده که ۱۰ ثانیه طول می‌کشه.

اگه این کار رو **داخل** Django انجام بدی، کاربر باید ۱۰ ثانیه معطل بمونه تا جواب بیاد. خیلی بده.

**راه‌حل:** Django فقط **می‌پذیره** و **پیام** می‌ذاره توی صف. یه کارگر جدا (Celery Worker) پیام رو برمی‌داره و پردازش می‌کنه. Django **فوراً** به کاربر می‌گه: «باشه، تو صف قرار گرفت. برو کارت رو بکن، وقتی تموم شد بهت خبر می‌دم.»

<div align='right' dir='rtl'>

<span dir='rtl'>**Task Runner** این الگو رو پیاده می‌کنه:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>1. کاربر یه تسک می‌سازه (عنوان، توضیحات، ایمیل)</span> <br>
<span dir='rtl'>2. تسک با وضعیت `pending` (در انتظار) ذخیره می‌شه</span> <br>
<span dir='rtl'>3. Django پیام می‌ذاره توی صف Redis</span> <br>
<span dir='rtl'>4. Celery Worker پیام رو برمی‌داره</span> <br>
<span dir='rtl'>5. وضعیت <span dir='ltr'>`pending`</span> ← `processing` می‌شه</span> <br>
<span dir='rtl'>6. <span dir='ltr'>Worker</span> ۱۰ ثانیه «کار می‌کنه» (شبیه‌سازی)</span> <br>
<span dir='rtl'>7. وضعیت <span dir='ltr'>`processing`</span> ← `done` می‌شه</span> <br>
<span dir='rtl'>8. React هر ۲ ثانیه صفحه رو به‌روز می‌کنه و **کاربر می‌بینه** وضعیت عوض می‌شه</span> <br>

</div>

**نکته‌ی مهم:** این پروژه کار واقعی انجام نمی‌ده (فقط ۱۰ ثانیه می‌خوابه). ولی الگوی Docker اطرافش **کاملاً واقعیه**. اگه بعداً بخوای به‌جای `sleep` یه ایمیل واقعی بفرستی یا یه PDF تولید کنی، فقط تابع رو عوض می‌کنی. Docker setup دست‌نخورده می‌مونه.

---

## ۲. یادآوری سریع مفاهیم قبلی

قبل از شروع، بذار چند تا مفهوم کلیدی رو **دوباره و ساده** بگم. اگه یادت هست، این یه مرور سریعه. اگه یادت نیست، همین‌جا یاد می‌گیری.

### کانتینر چیه؟

**کانتینر** یه جعبه‌ی ایزوله‌ست که داخلش یه برنامه اجرا می‌شه. مثل یه آکواریوم که ماهی‌ها توش زندگی می‌کنن، بدون اینکه با بیرون قاطی بشن.

هر کانتینر:

<p dir='rtl'>
• فایل‌های خودش رو داره <br>
• پکیج‌های خودش رو داره <br>
• تنظیمات خودش رو داره <br>
• از بقیه‌ی کانتینرها جداست
</p>

**چرا مهمه؟** چون می‌تونی چند تا برنامه‌ی مختلف رو کنار هم اجرا کنی، بدون اینکه به هم تداخل داشته باشن.

<div align='right' dir='rtl'>

### <span dir='rtl'>Image چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Image** یه **قالب** برای ساخت کانتینره. مثل دستور پخت کیک.</span>

</div>

<p dir='rtl'>
• Image = دستور پخت <br>
• Container = کیک پخته‌شده
</p>

از یه Image می‌تونی **چندین** کانتینر بسازی. مثل اینکه از یه دستور پخت می‌تونی چندین کیک بپزی.

<div align='right' dir='rtl'>

### <span dir='rtl'>Volume چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Volume** یه **فضای ذخیره‌سازی بیرون از کانتینره**.</span>

</div>

تصور کن کانتینر یه اتاق اجاره‌ایه. وقتی اتاق رو تحویل می‌دی، هر چیزی که توش گذاشتی، از بین می‌ره. ولی اگه وسایلت رو توی یه انبار بیرون از اتاق بذاری، بعداً هم می‌تونی برشون داری.

<div align='right' dir='rtl'>

<span dir='rtl'>**Volume = انبار بیرون از اتاق.**</span>

</div>

مهم‌ترین کاربردش: دیتابیس. اگه کانتینر دیتابیس رو حذف کنی، بدون Volume همه‌ی داده‌ها می‌رن. با Volume، داده‌ها می‌مونن.

<div align='right' dir='rtl'>

### <span dir='rtl'>Network چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Network** یه **شبکه‌ی خصوصی** بین کانتینرهاست.</span>

</div>

تصور کن چند تا اتاق داری و یه راهرو بینشون. کانتینرها از طریق این راهرو با هم حرف می‌زنن.

**نکته‌ی مهم:** توی یه Network، هر کانتینر با **اسم سرویسش** قابل‌شناساییه. یعنی اگه یه سرویس به اسم `db` داشته باشی، بقیه می‌تونن با `db` بهش وصل بشن (مثل اینکه توی راهرو اسم طرف رو صدا بزنی).

<div align='right' dir='rtl'>

### <span dir='rtl'>Compose چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Compose** یه فایله (`compose.yaml`) که همه‌ی سرویس‌ها رو با هم تعریف می‌کنه. به‌جای اینکه ده‌ها دستور `docker run` بنویسی، همه رو توی یه فایل می‌نویسی و با یه دستور اجراشون می‌کنی:</span>

</div>

```bash
docker compose up
```

<div align='right' dir='rtl'>

### <span dir='rtl'>Celery چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Celery** یه کتابخونه‌ی پایتونه که کارها رو **در پس‌زمینه** اجرا می‌کنه.</span>

</div>

مثل رستوران:

<div align='right' dir='rtl'>

<span dir='rtl'>• **گارسون** (Django) سفارش رو می‌گیره و می‌ذاره توی صف</span> <br>
<span dir='rtl'>• **آشپز** (Celery Worker) از صف سفارش برمی‌داره و غذا می‌پزه</span> <br>
<span dir='rtl'>• گارسون **فوراً** به مشتری می‌گه: «سفارشت ثبت شد»، بدون اینکه منتظر غذا بمونه</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>Redis چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Redis** یه نرم‌افزار جداگانه‌ست که کارش **نگه داشتن پیام‌ها** توی صف.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Django پیام می‌ذاره توی <span dir='ltr'>Redis</span>. Celery Worker از Redis می‌خونه. Redis مثل یه **صندوق پستی مشترک** بینشونه.</span>

</div>

---

## ۳. مهم‌ترین بخش این درس — ذهنیت داکری

این بخش رو **با دقت** بخون. اگه فقط همین بخش رو یاد بگیری، می‌تونی هر پروژه‌ای رو داکری کنی.

### ۷ سؤال ذهنیت داکری

وقتی با هر پروژه‌ای روبرو شدی، این ۷ سؤال رو از خودت بپرس. جواب‌ها همه‌چیز رو مشخص می‌کنن.

---

#### ❓ سؤال ۱ — این پروژه از چند «بخش» تشکیل شده؟

به پروژه نگاه کن. چند تا **بخش مستقل** داره؟

<div align='right' dir='rtl'>

<span dir='rtl'>• **Frontend** داره؟ (React، Vue، HTML)</span> <br>
<span dir='rtl'>• **Backend** داره؟ (Django، Node.js، Spring)</span> <br>
<span dir='rtl'>• **Database** داره؟ (PostgreSQL، MySQL)</span> <br>
<span dir='rtl'>• **Cache یا Queue** داره؟ (Redis، RabbitMQ)</span> <br>
<span dir='rtl'>• **Background Worker** داره؟ (Celery، Sidekiq)</span> <br>
<span dir='rtl'>• **Reverse Proxy** داره؟ (Nginx، Traefik)</span> <br>

</div>

**قانون طلایی:** هر بخش مستقل = یه سرویس = یه کانتینر.

**چرا؟** چون هر بخش، چرخه‌ی زندگی و نیازهای خودش رو داره. اگه همه رو توی یه کانتینر بذاری، اگه یکی کرش کنه، همه از کار می‌افتن.

**برای پروژه‌ی Task Runner:**

<div align='center' dir='rtl'>

| بخش | کانتینر |
|-----|---------|
| Frontend (React) | `frontend` |
| Backend (Django) | `backend` |
| Database (PostgreSQL) | `db` |
| Queue (Redis) | `redis` |
| Worker (Celery) | `worker` |
| Migrations (one-shot) | `migrate` |

</div>

**شش سرویس.**

---

#### ❓ سؤال ۲ — هر بخش برای اجرا چی لازم داره؟

هر بخش رو جدا بررسی کن:

<div align='right' dir='rtl'>

<span dir='rtl'>• **زبان و نسخه‌ی دقیق؟** (Python 3.12، Node.js 22)</span> <br>
<span dir='rtl'>• **چه پکیج‌هایی؟** (Django, Celery, axios)</span> <br>
<span dir='rtl'>• **یا یه Image آماده وجود داره؟** (`postgres:16`، `redis:7-alpine`، `nginx:1.27-alpine`)</span> <br>

</div>

**قانون:** اگه Image آماده هست، ازش استفاده کن (چون تست‌شده و امنه). اگه نه، **خودت Dockerfile بنویس**.

**برای پروژه‌ی Task Runner:**

<div align='center' dir='rtl'>

| سرویس | چی لازم داره |
|--------|----------------|
| `backend` | <span dir='rtl'><span dir='ltr'>Python 3.12</span> + Django + پکیج‌ها ← **Dockerfile**</span> |
| `worker` | <span dir='rtl'>**همون backend** (فقط `command` فرق می‌کنه) ← **از Image backend استفاده می‌کنه**</span> |
| `frontend` | <span dir='rtl'><span dir='ltr'>Node.js (build) + Nginx (serve)</span> ← **Multi-stage Dockerfile**</span> |
| `db` | <span dir='rtl'>Image آماده `postgres:16`</span> |
| `redis` | <span dir='rtl'>Image آماده `redis:7-alpine`</span> |
| `migrate` | <span dir='rtl'>**همون backend** (فقط `command` فرق می‌کنه)</span> |

</div>

**نکته‌ی طلایی:** `worker` نیازی به Dockerfile جدا نداره! چون پکیج‌ها و کدش دقیقاً مثل `backend` هست. فقط دستوری که اجرا می‌شه فرق می‌کنه. این یه صرفه‌جویی بزرگه.

---

#### ❓ سؤال ۳ — این بخش‌ها چطور با هم حرف می‌زنن؟

یه نمودار ذهنی بکش:

<div align='right' dir='rtl'>

<span dir='rtl'>• Backend باید به Database وصل بشه؟ ← از **نام سرویس** `db`</span> <br>
<span dir='rtl'>• Backend باید به Redis وصل بشه؟ ← از **نام سرویس** `redis`</span> <br>
<span dir='rtl'>• Frontend باید به Backend وصل بشه؟ ← از طریق **Nginx proxy**</span> <br>

</div>

**قانون:** همه‌ی این ارتباط‌ها **داخلی** هستند. فقط Frontend از بیرون قابل‌دسترسه.

**برای پروژه‌ی Task Runner:**

```text
کاربر ──► frontend (پورت 8089، از بیرون)
            │
            ├──► /api/  ──► backend:8000 (داخلی)
            │
backend ──► db (داخلی، با نام db)
backend ──► redis (داخلی، با نام redis)
worker  ──► db (داخلی)
worker  ──► redis (داخلی)
```

**نتیجه:** فقط یه سرویس از بیرون دیده می‌شه (`frontend`). بقیه از بیرون **دسترسی ندارن** و این **امنیت** رو بالا می‌بره.

---

#### ❓ سؤال ۴ — چه داده‌ای باید **زنده بمونه**؟

این مهم‌ترین سؤال بعد از سؤال ۱ هست. بپرس: «اگه کانتینر رو حذف کنم، چه چیزی نباید از بین بره؟»

جواب: **Volume** می‌خوای.

**برای پروژه‌ی Task Runner:**

<div align='center' dir='rtl'>

| داده | Volume |
|------|--------|
|<span dir='rtl'> داده‌های PostgreSQL </span>| `postgres_data` |
|<span dir='rtl'> فایل‌های static Django (CSS ادمین) </span>| `static_files` |
| کد پروژه |<span dir='rtl'> **نه** (داخل Image پخته می‌شه) </span>|
|<span dir='rtl'> داده‌های Redis </span>|<span dir='rtl'> **نه** (اختیاری، چون تسک‌ها موقتی‌ان) </span>|

</div>

**چرا <span dir='ltr'>Redis</span> volume نمی‌خواد؟** چون تسک‌ها موقتی‌ان. اگه Redis ری‌استارت بشه و تسک‌های در صف از دست برن، مهم نیست (چون کاربر می‌تونه دوباره بسازه). ولی برای دیتابیس، **همه‌ی** داده‌های کاربر مهمه.

---

#### ❓ سؤال ۵ — چه تنظیماتی باید **قابل‌تغییر** باشه؟

بپرس: «چه چیزهایی باید بتونم بدون تغییر کد، تغییر بدم؟»

<div align='right' dir='rtl'>

<span dir='rtl'>• **رمز دیتابیس** (چون توی محیط عملیاتی امن‌تره)</span> <br>
<span dir='rtl'>• **کلید مخفی Django** (چون نباید توی کد باشه)</span> <br>
<span dir='rtl'>• **آدرس Redis** (چون توی Docker با dev فرق می‌کنه)</span> <br>

</div>

**نتیجه:** همه‌ی اینا رو می‌ذاری توی <span dir='ltr'>`.env`</span> و به‌عنوان **متغیر محیطی** پاس می‌دی.

**قانون مهم:** هر چیزی که **رمز** یا **آدرس** هست، باید توی <span dir='ltr'>`.env`</span> باشه. هرگز توی کد ننویس.

---

#### ❓ سؤال ۶ — چطور باید Build بشه؟

<div align='right' dir='rtl'>

<span dir='rtl'>**Single-stage** (یه مرحله): اگه فقط «نصب کن و اجرا کن» هست. مثل Django.</span>

</div>

```dockerfile
FROM python:3.12-slim
COPY . .
RUN pip install -r requirements.txt
CMD ["gunicorn", ...]
```

<div align='right' dir='rtl'>

<span dir='rtl'>**Multi-stage** (چند مرحله): اگه یه مرحله‌ی **Build** داره که ابزارهای خاصی می‌خواد. مثل React که باید با Node.js بیلد بشه.</span>

</div>

```dockerfile
# مرحله ۱: ساخت
FROM node:22-alpine AS builder
RUN npm run build

# مرحله ۲: اجرا
FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
```

**برای پروژه‌ی Task Runner:**

<div align='center' dir='rtl'>

| سرویس | نوع Build |
|--------|-----------|
| `backend` | Single-stage |
| `worker` |<span dir='rtl'> **از Image backend استفاده می‌کنه — Build جدا نداره** </span>|
| `frontend` | **Multi-stage** (Node.js → Nginx) |
| `db` | آماده |
| `redis` | آماده |
| `migrate` |<span dir='rtl'> **از Image backend** </span>|

</div>

---

#### ❓ سؤال ۷ — ترتیب شروع سرویس‌ها چیه؟

بعضی سرویس‌ها **قبل از** بقیه باید آماده بشن:

<div align='right' dir='rtl'>

<span dir='rtl'>• دیتابیس باید **اول** آماده بشه</span> <br>
<span dir='rtl'>• مایگریشن باید **بعد از** دیتابیس</span> <br>
<span dir='rtl'>• Backend باید **بعد از** مایگریشن</span> <br>
<span dir='rtl'>• Worker باید **بعد از** مایگریشن و Redis</span> <br>
<span dir='rtl'>• Frontend باید **بعد از** Backend</span> <br>

</div>

**نتیجه:** از `depends_on` با `condition` استفاده می‌کنی.

**برای پروژه‌ی Task Runner:**

```text
1. db (healthcheck)
2. redis (healthcheck)
3. migrate (منتظر db)
4. backend (منتظر migrate + redis)
5. worker (منتظر migrate + redis)
6. frontend (منتظر backend)
```

---

### 🎯 ذهنیت داکری رو حفظ کن

هر جا گیر کردی، این ۷ سؤال رو بپرس. **همیشه** جواب می‌گیری.

اینا سرمایه‌ی اصلی این دوره‌ست.

---

## ۴. معماری پروژه

حالا که ۷ سؤال رو جواب دادیم، بیایم معماری نهایی رو ببینیم:

```text
┌─────────────────────────────────────────────────────┐
│                     کاربر                             │
│              (مرورگر روی سیستم تو)                      │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│             frontend (Nginx, port 8089)             │
│                                                     │
│  دفترچه:                                              │
│  /            ──►  React static files               │
│  /api/        ──►  backend:8000                     │
│  /admin/      ──►  backend:8000                     │
│  /health/     ──►  backend:8000                     │
│  /static/     ──►  static_files volume              │
└──────────────────────┬──────────────────────────────┘
                       │
                       ▼
┌─────────────────────────────────────────────────────┐
│               backend (Django + Gunicorn)           │
│                    port 8000                        │
└──────┬───────────────────────────────────┬──────────┘
       │                                   │
       ▼                                   ▼
┌──────────────┐                   ┌──────────────────┐
│      db      │                   │      redis       │
│  PostgreSQL  │                   │  (صف پیام)        │
└──────────────┘                   └────────┬─────────┘
                                            │
                                            ▼
                                   ┌──────────────────┐
                                   │     worker       │
                                   │  (Celery)        │
                                   └────────┬─────────┘
                                            │
                                            ▼
                                      (به db وصل)
```

**شش سرویس، هر کدوم یه نقش.**

**پورت‌های دوره:**

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| ۱۳ | Recipe Book | 8088 |
| **۱۴** | **Task Runner** | **8089** |

</div>

**چرا ۸۰۸۹؟** چون ۸۰۸۸ مال درس ۱۳ بود. **هر پروژه باید پورت یکتا داشته باشه** تا بتونن همزمان اجرا بشن.

---

## ۵. ساختار پوشه‌ها

```text
14-task-runner/
├── compose.yaml              ← همه‌چیز رو به هم وصل می‌کنه
├── README.md
├── README.fa.md
├── backend-django/           ← بک‌اند Django
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
│   │   ├── celery.py
│   │   ├── settings.py
│   │   ├── urls.py
│   │   └── wsgi.py
│   └── tasks/
│       ├── __init__.py
│       ├── admin.py
│       ├── apps.py
│       ├── models.py
│       ├── serializers.py
│       ├── tasks.py
│       ├── urls.py
│       ├── views.py
│       └── migrations/
│           ├── __init__.py
│           └── 0001_initial.py
└── frontend-react/           ← فرانت‌اند React
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

**یه فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو** هست که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین هر پروژه <span dir='ltr'>`.gitignore`</span> جداگانه نداره.

---

## ۶. فایل‌های بک‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱. `requirements.txt`</span>

</div>

```txt
Django==5.1.4
djangorestframework==3.15.2
psycopg[binary]==3.2.10
django-environ==0.14.0
gunicorn==23.0.0
django-cors-headers==4.6.0
celery==5.4.0
redis==5.2.1
```

**هر پکیج چیه؟**

<div align='center' dir='rtl'>

| پکیج | کارش |
|------|-------|
| <span dir='ltr'>**Django**</span> | فریم‌ورک بک‌اند |
| <span dir='ltr'>**djangorestframework**</span> |<span dir='rtl'> برای ساختن API </span>|
| <span dir='ltr'>**psycopg[binary]**</span> |<span dir='rtl'> درایور PostgreSQL </span>|
| <span dir='ltr'>**django-environ**</span> |<span dir='rtl'> خواندن <span dir='ltr'>`.env`</span> </span>|
| <span dir='ltr'>**gunicorn**</span> |<span dir='rtl'> وب‌سرور پایتون (برای production) </span>|
| <span dir='ltr'>**django-cors-headers**</span> |<span dir='rtl'> اجازه‌ی درخواست از React </span>|
| <span dir='ltr'>**celery**</span> | **جدید: کارهای پس‌زمینه** |
| <span dir='ltr'>**redis**</span> |<span dir='rtl'> **جدید: کلاینت Redis برای Celery** </span>|

</div>

**نکته:** `Pillow` رو حذف کردیم چون توی این پروژه عکسی آپلود نمی‌کنیم. فقط چیزهایی که لازم داریم رو نگه می‌داریم. این یه اصل مهمه: Image کوچیک‌تر، سریع‌تر، امن‌تر.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۲. <span dir='ltr'>`.env.example`</span></span>

</div>

```dotenv
# Django
SECRET_KEY=change-me-to-a-long-random-string
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1

# CORS (for React)
CORS_ALLOWED_ORIGINS=http://localhost:5173,http://localhost:8089
CSRF_TRUSTED_ORIGINS=http://localhost:5173,http://localhost:8089

# PostgreSQL
POSTGRES_DB=taskrunner
POSTGRES_USER=taskrunner
POSTGRES_PASSWORD=taskrunner_dev_password
POSTGRES_HOST=localhost
POSTGRES_PORT=5432

# Redis / Celery
REDIS_URL=redis://localhost:6379/0
```

**چرا `POSTGRES_HOST=localhost` توی <span dir='ltr'>`.env`</span> ولی `db` توی `compose.yaml`؟**

چون توی <span dir='ltr'>`.env`</span>، برای اجرای **محلی** (خارج از Docker) تنظیم شده. توی `compose.yaml`، برای اجرای **داخل Docker**، از `db` استفاده می‌کنیم (چون اسم سرویس دیتابیسه). `compose.yaml` این مقدار رو override می‌کنه.

**چرا `REDIS_URL` هم همین‌طور؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• توی <span dir='ltr'>`.env`: `redis://localhost:6379/0`</span> (برای اجرای محلی)</span> <br>
<span dir='rtl'>• توی `compose.yaml`: `redis://redis:6379/0` (چون اسم سرویس `redis` هست)</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۳. `config/settings.py` — بخش‌های مهم</span>

</div>

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
    # ... جنگو و پکیج‌ها
    'rest_framework',
    'corsheaders',
    'tasks',
]

MIDDLEWARE = [
    # ... 
    'corsheaders.middleware.CorsMiddleware',  # قبل از CommonMiddleware
    'django.middleware.common.CommonMiddleware',
    # ...
]

DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.postgresql',
        'NAME': env('POSTGRES_DB'),
        # ...
    }
}

CORS_ALLOWED_ORIGINS = env.list('CORS_ALLOWED_ORIGINS', default=[...])
CSRF_TRUSTED_ORIGINS = env.list('CSRF_TRUSTED_ORIGINS', default=[...])

# تنظیمات Celery
CELERY_BROKER_URL = env('REDIS_URL')
CELERY_RESULT_BACKEND = env('REDIS_URL')
CELERY_TIMEZONE = 'UTC'
CELERY_TASK_TRACK_STARTED = True
CELERY_TASK_TIME_LIMIT = 60
```

**مهم‌ترین تغییرات نسبت به درس ۱۳:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`CELERY_BROKER_URL`** — به Celery می‌گه Redis کجاست</span> <br>
<span dir='rtl'>• **`CELERY_RESULT_BACKEND`** — نتیجه‌ی هر تسک رو توی Redis ذخیره می‌کنه</span> <br>
<span dir='rtl'>• **`CELERY_TASK_TIME_LIMIT = 60`** — هر تسک حداکثر ۶۰ ثانیه. اگه بیشتر طول بکشه، خودکار می‌کشش. این یه **سپر امنیتی** مهمه.</span> <br>

</div>

**چرا `CELERY_TASK_TIME_LIMIT` مهمه؟**

فرض کن یه تسک بی‌نهایت می‌خوابه (مثلاً به یه API وصل می‌شه که جواب نمی‌ده). اگه محدودیت زمانی نباشه، اون worker برای همیشه قفل می‌مونه و هیچ تسک دیگه‌ای نمی‌تونه اجرا کنه.

با محدودیت ۶۰ ثانیه، Celery هر ۶۰ ثانیه یه بار پروسه‌های گیرکرده رو می‌کشه. worker آزاد می‌مونه برای بقیه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۴. `config/celery.py` — قلب Worker</span>

</div>

```python
import os
from celery import Celery

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')

app = Celery('taskrunner')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
```

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`os.environ.setdefault(...)`**</span> — به Celery می‌گه تنظیمات جنگو رو از `config.settings` بخون.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`app = Celery('taskrunner')`**</span> — یه نمونه از Celery می‌سازه. اسمش فقط برای شناسایی توی لاگ‌هاست.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`app.config_from_object('django.conf:settings', namespace='CELERY')`**</span> — به Celery می‌گه: «برو توی تنظیمات جنگو، هر چی با پیشوند <span dir='ltr'>`CELERY_`</span> شروع شد رو بخون و به‌عنوان تنظیمات خودت در نظر بگیر».</span>

</div>

این یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• `CELERY_BROKER_URL` توی `settings.py` ← به دست `CELERY_BROKER_URL` توی Celery می‌رسه</span> <br>
<span dir='rtl'>• `CELERY_RESULT_BACKEND` توی `settings.py` ← به دست `CELERY_RESULT_BACKEND` توی Celery می‌رسه</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`app.autodiscover_tasks()`**</span> — به Celery می‌گه: «توی هر اپ جنگو (که توی `INSTALLED_APPS` هست)، اگه فایلی به اسم `tasks.py` بود، تسک‌های داخلش رو پیدا کن».</span>

</div>

**نتیجه:** ما یه `tasks/tasks.py` می‌سازیم که تسک اصلی توشه. Celery خودش پیداش می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۵. `config/__init__.py`</span>

</div>

```python
from .celery import app as celery_app

__all__ = ('celery_app',)
```

**چرا این خط مهمه؟**

وقتی Django شروع می‌کنه، اولین کاری که می‌کنه اینه که `config/__init__.py` رو اجرا کنه. این فایل، Celery رو **قبل از هر چیز دیگه** آماده می‌کنه.

بدون این خط، Celery ممکنه دیرتر بیدار بشه و بعضی تسک‌ها رو نشناسه.

**ترجمه به زبان ساده:** «ای Django، وقتی بیدار شدی، اول Celery رو بیدار کن، بعد بقیه‌ی کارها.»

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۶. `tasks/models.py`</span>

</div>

```python
from django.db import models


class Task(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        PROCESSING = 'processing', 'Processing'
        DONE = 'done', 'Done'
        FAILED = 'failed', 'Failed'

    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    email = models.EmailField(blank=True)
    status = models.CharField(
        max_length=20,
        choices=Status.choices,
        default=Status.PENDING,
    )
    result = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
```

**هر فیلد چیه؟**

<div align='center' dir='rtl'>

| فیلد | معنی |
|------|-------|
| `title` | عنوان تسک |
| `description` | توضیحات (اختیاری) |
| `email` | ایمیل کاربر (اختیاری) |
| `status` |<span dir='rtl'> وضعیت تسک: <span dir='ltr'>pending</span> / <span dir='ltr'>processing</span> / <span dir='ltr'>done</span> / <span dir='ltr'>failed</span> </span>|
| `result` |<span dir='rtl'> نتیجه‌ی پردازش (بعد از done پر می‌شه) </span>|
| `created_at` | تاریخ ساخت (خودکار) |
| `updated_at` | تاریخ آخرین تغییر (خودکار) |

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`class Status(models.TextChoices)`** — یه الگوی جنگو برای تعریف گزینه‌های ثابت. با این کار، به‌جای نوشتن `'pending'`، از `Task.Status.PENDING` استفاده می‌کنیم. اگه یه روزی بخوایم اسمش رو عوض کنیم، همه‌جا خودکار عوض می‌شه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۷. `tasks/serializers.py`</span>

</div>

```python
from rest_framework import serializers
from .models import Task


class TaskSerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source='get_status_display', read_only=True)

    class Meta:
        model = Task
        fields = [
            'id', 'title', 'description', 'email',
            'status', 'status_display', 'result',
            'created_at', 'updated_at',
        ]
        read_only_fields = ['id', 'status', 'result', 'created_at', 'updated_at']
```

**سریالایزر چیه؟**

یادت باشه: **مترجم** بین شیء پایتون و JSON.

<div align='right' dir='rtl'>

<span dir='rtl'>• **خروجی:** شیء Task (پایتون) ← JSON (برای React)</span> <br>
<span dir='rtl'>• **ورودی:** JSON (از React) ← شیء Task (برای ذخیره در DB)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`status_display`** — این فیلد توی دیتابیس نیست. یه فیلد محاسباتیه که `"Pending"` (با P بزرگ) رو برمی‌گردونه، نه `"pending"`. برای این‌که React مجبور نباشه خودش label بسازه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`read_only_fields`**</span> — `status` و `result` فقط خونده می‌شن. یعنی کاربر نمی‌تونه تسک بسازه و بگه <span dir='ltr'>`status: "done"`</span>. فقط **بعد از** پردازش، توسط Celery پر می‌شن.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۸. `tasks/tasks.py` — قلب پروژه</span>

</div>

```python
import time
from celery import shared_task
from .models import Task


PROCESSING_SECONDS = 10


@shared_task
def process_task(task_id: int) -> str:
    try:
        task = Task.objects.get(id=task_id)
    except Task.DoesNotExist:
        return f"Task {task_id} not found"

    task.status = Task.Status.PROCESSING
    task.save(update_fields=['status', 'updated_at'])

    time.sleep(PROCESSING_SECONDS)

    task.status = Task.Status.DONE
    task.result = f"Processed '{task.title}' successfully."
    task.save(update_fields=['status', 'result', 'updated_at'])

    return f"Task {task_id} done"
```

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`@shared_task`**</span> — یه دکوراتور. به Celery می‌گه: «این فانکشن یه تسک Celery هست. از هر جایی صدا بزنی، توی worker اجراش کن.»</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`Task.objects.get(id=task_id)`**</span> — تسک رو از دیتابیس می‌گیره. Django یه شناسه (`id`) می‌فرسته به تسک، و تسک با اون شناسه تسک رو پیدا می‌کنه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`task.status = Task.Status.PROCESSING`**</span> — وضعیت رو به `processing` تغییر می‌ده. React این رو توی polling بعدی می‌بینه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`task.save(update_fields=[...])`**</span> — فقط فیلدهای مشخص‌شده رو به‌روزرسانی می‌کنه. این یه optimization هست: به‌جای اینکه کل رکورد رو دوباره بنویسه، فقط چیزی که تغییر کرد رو می‌نویسه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`time.sleep(PROCESSING_SECONDS)`**</span> — ۱۰ ثانیه می‌خوابه. **اینجا کار واقعی انجام می‌شه.** اگه یه روزی بخوای ایمیل بفرستی، این خط رو با کد ایمیل عوض می‌کنی.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`task.status = Task.Status.DONE`**</span> — وضعیت رو به `done` تغییر می‌ده.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`task.result = f"Processed '{task.title}' successfully."`**</span> — نتیجه رو پر می‌کنه. React این متن رو نشون می‌ده.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`return f"Task {task_id} done"`**</span> — این رشته توی لاگ worker دیده می‌شه. برای دیباگ عالیه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۹. `tasks/views.py`</span>

</div>

```python
from rest_framework import mixins, viewsets
from .models import Task
from .serializers import TaskSerializer
from .tasks import process_task


class TaskViewSet(
    mixins.CreateModelMixin,
    mixins.ListModelMixin,
    mixins.RetrieveModelMixin,
    viewsets.GenericViewSet,
):
    queryset = Task.objects.all()
    serializer_class = TaskSerializer

    def perform_create(self, serializer):
        task = serializer.save()
        process_task.delay(task.id)
```

**این فایل، پل بین API و Celery هست. مهم‌ترین بخش:**

<div align='right' dir='rtl'>

<span dir='rtl'>**`mixins.CreateModelMixin`**</span> — اندپوینت `POST` رو می‌سازه (ساخت تسک).</span><br>
<span dir='rtl'>**`mixins.ListModelMixin`**</span> — اندپوینت <span dir='ltr'>`GET /api/tasks/`</span> رو می‌سازه (لیست).</span><br>
<span dir='rtl'>**`mixins.RetrieveModelMixin`**</span> — اندپوینت <span dir='ltr'>`GET /api/tasks/{id}/`</span> رو می‌سازه.</span><br>

</div>

**چرا از `ModelViewSet` کامل استفاده نکردیم؟**

چون توی این پروژه، کاربر نباید بتونه تسک رو **ویرایش** یا **حذف** کنه. فقط بسازه و ببینه. پس فقط سه mixin از هفت‌تا رو استفاده کردیم.

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`perform_create(self, serializer)`**</span> — **مهم‌ترین خط.**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`serializer.save()`</span> تسک رو توی دیتابیس ذخیره می‌کنه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`process_task.delay(task.id)`**</span> — این خط **جادویی** است</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`process_task.delay(...)`</span> دقیقاً چیکار می‌کنه؟**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• تسک `process_task` رو **اجرا نمی‌کنه**</span> <br>
<span dir='rtl'>• یه **پیام** توی صف Redis می‌ذاره که «این تسک رو با این `task_id` اجرا کن»</span> <br>
<span dir='rtl'>• **فوراً** برمی‌گرده (بدون انتظار)</span> <br>

</div>

یعنی Django توی میلی‌ثانیه به کاربر جواب می‌ده، حتی اگه پردازش ۱۰ ثانیه طول بکشه.

**چرا <span dir='ltr'>`delay()`</span> و نه صدا زدن مستقیم؟**

اگه <span dir='ltr'>`process_task(task.id)` رو صدا می‌زدیم، توی **خود Django** اجرا می‌شد و کاربر ۱۰ ثانیه معطل می‌شد. با <span dir='ltr'>`.delay()`</span>، توی **worker جدا** اجرا می‌شه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱۰. `tasks/urls.py`</span>

</div>

```python
from rest_framework.routers import DefaultRouter
from .views import TaskViewSet

router = DefaultRouter()
router.register(r'tasks', TaskViewSet, basename='task')

urlpatterns = router.urls
```

<div align='right' dir='rtl'>

<span dir='rtl'>**DRF خودکار این مسیرها رو می‌سازه:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`GET /api/tasks/`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>`POST /api/tasks/`</span></span> <br>
<span dir='rtl'>• <span dir='ltr'>`GET /api/tasks/{id}/`</span></span> <br>

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
    path('api/', include('tasks.urls')),
]
```

**سه مسیر:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/admin/`</span> — پنل ادمین</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/health/`</span> — endpoint سلامت (برای Docker healthcheck)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/api/`</span> — API</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۶.۱۲. `tasks/admin.py`</span>

</div>

```python
from django.contrib import admin
from .models import Task


@admin.register(Task)
class TaskAdmin(admin.ModelAdmin):
    list_display = ('id', 'title', 'status', 'email', 'created_at', 'updated_at')
    list_filter = ('status',)
    search_fields = ('title', 'description', 'email')
    date_hierarchy = 'created_at'
    readonly_fields = ('created_at', 'updated_at')
```

**تنظیمات پنل ادمین:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`list_display`**</span> — چه ستون‌هایی توی لیست نشون داده بشن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`list_filter`**</span> — فیلتر بر اساس وضعیت</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`search_fields`**</span> — جستجو</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`date_hierarchy`**</span> — فیلتر بر اساس تاریخ</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`readonly_fields`**</span> — `created_at` و `updated_at` فقط خونده می‌شن</span> <br>

</div>

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
    },
  },
})
```

**این فایل، مثل درس ۱۳، نقش «گارسون» رو بازی می‌کنه.**

توی <span dir='ltr'>dev</span>، React روی `5173` اجراست، Django روی `8000`. Vite یه **proxy** راه می‌ندازه:

<div align='right' dir='rtl'>

<span dir='rtl'>• React درخواست به <span dir='ltr'>`/api/tasks/`</span> می‌فرسته (آدرس نسبی)</span> <br>
<span dir='rtl'>• Vite می‌گیره، می‌فرسته به <span dir='ltr'>`http://localhost:8000/api/tasks/`</span></span> <br>
<span dir='rtl'>• از دید مرورگر، همه‌چیز از `5173` میاد ← CORS error نمی‌ده</span> <br>

</div>

**توی <span dir='ltr'>production</span>**، **Nginx** همین نقش رو بازی می‌کنه. یعنی <span dir='ltr'>`/api/`</span> رو به `backend:8000` پاس می‌ده.

**نتیجه:** React هیچ‌وقت نمی‌دونه Django کجاست. فقط <span dir='ltr'>`/api/...`</span> صدا می‌زنه. کد یکسان توی dev و prod.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۲. `src/api.js` — تنها جای اتصال</span>

</div>

```js
import axios from 'axios'

const api = axios.create({
  baseURL: '/api',
})

export const taskApi = {
  list: async () => {
    const response = await api.get('/tasks/')
    return response.data.results || response.data
  },

  detail: async (id) => {
    const response = await api.get(`/tasks/${id}/`)
    return response.data
  },

  create: async (data) => {
    const response = await api.post('/tasks/', data)
    return response.data
  },
}
```

**سه تابع:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`list`** — لیست همه‌ی تسک‌ها (برای polling هر ۲ ثانیه)</span> <br>
<span dir='rtl'>• **`detail`** — یه تسک خاص (اگه لازم شد)</span> <br>
<span dir='rtl'>• **`create`** — ساخت تسک جدید (این همون کار اصلیه)</span> <br>

</div>

**نکته:** <span dir='ltr'>`response.data.results || response.data`</span> — DRF به‌طور پیش‌فرض صفحه‌بندی می‌کنه. جواب <span dir='ltr'>`{results: [...], count: N}`</span> هست. پس `results` رو برمی‌گردونیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۳. `src/App.jsx` — قلب فرانت</span>

</div>

```jsx
export default function App() {
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState(null)
  const intervalRef = useRef(null)

  const fetchTasks = async (showLoading = false) => {
    try {
      if (showLoading) setLoading(true)
      const data = await taskApi.list()
      setTasks(data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      if (showLoading) setLoading(false)
    }
  }

  useEffect(() => {
    fetchTasks(true)

    // Poll every 2 seconds to see status changes
    intervalRef.current = setInterval(() => {
      fetchTasks(false)
    }, 2000)

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current)
    }
  }, [])

  const handleCreate = async (data) => {
    try {
      setSubmitting(true)
      await taskApi.create(data)
      await fetchTasks(false)
      return true
    } catch (err) {
      setError(err.message)
      return false
    } finally {
      setSubmitting(false)
    }
  }

  return (
    // ... Header, TaskForm, لیست TaskCardها
  )
}
```

**بخش‌های کلیدی:**

<div align='right' dir='rtl'>

<span dir='rtl'>**`useEffect` با `setInterval`** — **مهم‌ترین بخش این فایل.**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• یه بار، تسک‌ها رو می‌گیره (با <span dir='ltr'>`fetchTasks(true)`</span>)</span> <br>
<span dir='rtl'>• بعد هر ۲ ثانیه، دوباره تسک‌ها رو می‌گیره (`setInterval`)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`return () => clearInterval(...)`</span> — وقتی کامپوننت unmount می‌شه، interval رو پاک می‌کنه (برای جلوگیری از memory leak)</span> <br>

</div>

**چرا polling؟**

چون ما نمی‌خوایم WebSocket راه بندازیم (که درس ۱۵ یاد می‌گیریم). برای این پروژه‌ی آموزشی، polling ساده کافیه.

**چرا `intervalRef`؟**

چون اگه `useEffect` دوباره اجرا بشه (مثلاً به‌خاطر یه dependency)، interval جدید ساخته می‌شه. با `ref`، به interval قبلی دسترسی داریم و می‌تونیم پاکش کنیم.

<div align='right' dir='rtl'>

<span dir='rtl'>**`handleCreate`:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `setSubmitting(true)` — دکمه‌ی ساخت رو غیرفعال می‌کنه (جلوگیری از دو بار کلیک)</span> <br>
<span dir='rtl'>• `taskApi.create(data)` — تسک رو می‌سازه</span> <br>
<span dir='rtl'>• `fetchTasks(false)` — لیست رو فوراً به‌روزرسانی می‌کنه (بدون loading spinner، چون فقط چند ثانیه طول می‌کشه)</span> <br>
<span dir='rtl'>• `setSubmitting(false)` — دکمه رو دوباره فعال می‌کنه</span> <br>

</div>

### ۷.۴. کامپوننت‌ها — ساده و شفاف

<div align='right' dir='rtl'>

<span dir='rtl'>**`TaskForm`** — فرم با ۳ فیلد (عنوان، توضیحات، ایمیل) و یه دکمه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`TaskCard`** — نمایش یه تسک:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• عنوان</span> <br>
<span dir='rtl'>• برچسب وضعیت (<span dir='ltr'>Pending</span>/<span dir='ltr'>Processing</span>/<span dir='ltr'>Done</span> با رنگ مختلف)</span> <br>
<span dir='rtl'>• آیکن (چرخان برای Processing)</span> <br>
<span dir='rtl'>• نتیجه (اگه `done` شد)</span> <br>
<span dir='rtl'>• شناسه و زمان</span> <br>

</div>

**نکته‌ی طراحی:** برای `Processing`، آیکن `Loader2` با کلاس `animate-spin` می‌چرخه. برای <span dir='ltr'>`Done`</span>، `CheckCircle2` سبز. برای <span dir='ltr'>`Pending`</span>، `Clock` خاکستری. **این بازخورد بصری** به کاربر می‌گه «این تسک الان چه وضعی داره» بدون نیاز به خوندن متن.

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

EXPOSE 8000

ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "-c", "gunicorn.conf.py", "config.wsgi:application"]
```

**نکته‌ی طلایی:** این Dockerfile **هم** برای `backend`، **هم** برای `worker`، **هم** برای `migrate` استفاده می‌شه. **یه Image، سه سرویس.**

**چرا؟** چون کد و پکیج‌های هر سه تاشون یکسانه. فقط **دستوری که اجرا می‌شه** فرق می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• `backend` ← <span dir='ltr'>`gunicorn ...`</span></span> <br>
<span dir='rtl'>• `worker` ← <span dir='ltr'>`celery -A config worker`</span></span> <br>
<span dir='rtl'>• `migrate` ← <span dir='ltr'>`python manage.py migrate`</span></span> <br>

</div>

**در `compose.yaml`، این تفاوت رو با <span dir='ltr'>`command:`</span> مشخص می‌کنیم.**

**فایل‌های مهم Dockerfile:**

<div align='right' dir='rtl'>

<span dir='rtl'>• `libpq5` — کتابخانه‌ی PostgreSQL (psycopg بهش نیاز داره)</span> <br>
<span dir='rtl'>• `gosu` — ابزار برای سوییچ کاربر (توضیحش توی entrypoint)</span> <br>
<span dir='rtl'>• `useradd appuser` — یه کاربر non-root می‌سازیم (به‌جای root)</span> <br>
<span dir='rtl'>• `chown -R appuser:appuser /app` — مالکیت همه‌چیز رو به `appuser` می‌دیم</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`EXPOSE 8000`** — فقط مستندسازی. پورت رو **منتشر نمی‌کنه**. انتشار توی `compose.yaml` با <span dir='ltr'>`ports:`</span> انجام می‌شه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۲. `entrypoint.sh` — اسکریپت شروع</span>

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

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`if [ "$(id -u)" = "0" ]`</span>** — اگه با کاربر `root` اجرا می‌شیم (`id -u` صفر = root):</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`chown -R appuser:appuser /app/staticfiles`</span>** — مالکیت volume رو به `appuser` بده. **چرا؟**</span>

</div>

یادت باشه از درس ۱۱: Docker حجم‌های نام‌دار رو با `root` می‌سازه، حتی اگه Dockerfile بگه `appuser`. این یه مشکل شناخته‌شده‌ست.

راه‌حل: کانتینر **با root شروع می‌شه**، مالکیت رو درست می‌کنه، بعد به `appuser` سوییچ می‌کنه.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`exec gosu appuser "$0" "$@"`</span>** — خودت رو با `appuser` دوباره اجرا کن.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`gosu` مثل `sudo` عمل می‌کنه: یه دستور رو با کاربر دیگه اجرا می‌کنه. <span dir='ltr'>`$0`</span> = همین فایل، <span dir='ltr'>`$@`</span> = آرگومان‌های اصلی.</span>

</div>

**بار دوم که فایل اجرا می‌شه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`id -u`</span> دیگه `0` نیست (چون `appuser` هستیم)</span> <br>
<span dir='rtl'>• از `if` رد می‌شه</span> <br>
<span dir='rtl'>• `migrate` و `collectstatic` با `appuser` اجرا می‌شن</span> <br>
<span dir='rtl'>• <span dir='ltr'>`exec "$@"`</span> دستور `CMD` (Gunicorn) رو اجرا می‌کنه</span> <br>

</div>

**چرا `migrate` و `collectstatic` توی entrypoint هستن؟**

چون **بعد از** بالا آمدن دیتابیس باید اجرا بشن. توی `Dockerfile` نمی‌تونیم اجراشون کنیم (چون دیتابیس در دسترس نیست).

**نکته‌ی مهم:** فقط سرویس `backend` و `migrate` این entrypoint رو اجرا می‌کنن. سرویس `worker` هم اجراش می‌کنه، ولی چون <span dir='ltr'>`command:`</span> متفاوته، بعد از migrate و collectstatic (که worker هم اجرا می‌کنه، که بیهوده است ولی ضرری نداره) به Celery می‌رسه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۳. `frontend-react/Dockerfile` — <span dir='ltr'>Multi-stage</span></span>

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

**همون الگوی درس ۱۳.**

**یادآوری ساده:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **مرحله‌ی ۱** = آشپزخونه: <span dir='ltr'>Node.js</span>، <span dir='ltr'>npm</span>، <span dir='ltr'>vite</span>. <span dir='ltr'>React</span> رو بیلد می‌کنه، خروجی می‌ره <span dir='ltr'>`/app/dist/`</span>. **<span dir='ltr'>~۵۰۰</span> مگابایت.**</span> <br>
<span dir='rtl'>• **مرحله‌ی ۲** = جعبه: فقط Nginx. فقط `dist` رو از مرحله‌ی ۱ کپی می‌کنه. **<span dir='ltr'>~۵۰</span> مگابایت.**</span> <br>

</div>

**خط کلیدی:**

```dockerfile
FROM nginx:1.27-alpine
```

**این خط، مرحله‌ی ۱ رو کاملاً فراموش می‌کنه.** Image جدید از صفر. هیچ‌کدوم از ابزارهای build توش نیست.

**نتیجه:** <span dir='ltr'>Image</span> ۱۰ برابر کوچیک‌تر.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۴. `nginx.conf` — دفترچه‌ی Nginx</span>

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

    # React SPA
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

    # Health → Django
    location /health/ {
        proxy_pass http://backend;
        proxy_set_header Host $http_host;
        proxy_set_header X-Real-IP $remote_addr;
    }

    # Django static
    location /static/ {
        alias /app/staticfiles/;
        expires 30d;
        access_log off;
    }
}
```

**این فایل، دقیقاً همون نقش گارسون رو بازی می‌کنه که توی <span dir='ltr'>dev</span>، Vite proxy بازی می‌کرد.**

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>**`upstream backend`** — به Nginx می‌گه «backend روی `backend:8000` هست».</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`try_files $uri $uri/ /index.html`</span>** — **مهم‌ترین خط برای React.**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• اگه فایل با اون اسم هست، بده</span> <br>
<span dir='rtl'>• اگه نیست، `index.html` رو بده</span> <br>

</div>

چرا؟ چون React SPA روتینگ سمت مرورگره. اگه کاربر بره به <span dir='ltr'>`/task/42`</span>، Nginx فایلی به این اسم نداره. اگه `index.html` رو نده، 404 می‌شه. با این خط، React می‌تونه خودش route رو مدیریت کنه.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`$http_host`</span> vs <span dir='ltr'>`$host`</span>:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`$host`</span> = دامنه **بدون** پورت (`127.0.0.1`)</span> <br>
<span dir='rtl'>• <span dir='ltr'>`$http_host`</span> = دامنه **با** پورت (`127.0.0.1:8089`)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`$http_host`</span> درسته چون با `Origin` مرورگر مطابقت داره (برای CSRF).</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۵. `compose.yaml` — <span dir='ltr'>orchestrator</span></span>

</div>

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB:-taskrunner}
      POSTGRES_USER: ${POSTGRES_USER:-taskrunner}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskrunner_dev_password}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ${POSTGRES_USER:-taskrunner} -d ${POSTGRES_DB:-taskrunner}"]
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
      ALLOWED_HOSTS: ${ALLOWED_HOSTS:-localhost,127.0.0.1}
      CORS_ALLOWED_ORIGINS: ${CORS_ALLOWED_ORIGINS:-http://localhost:8089}
      CSRF_TRUSTED_ORIGINS: ${CSRF_TRUSTED_ORIGINS:-http://localhost:8089}
      POSTGRES_DB: ${POSTGRES_DB:-taskrunner}
      POSTGRES_USER: ${POSTGRES_USER:-taskrunner}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD:-taskrunner_dev_password}
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
      retries: 10
      start_period: 20s
    restart: unless-stopped

  worker:
    build:
      context: ./backend-django
    command: celery -A config worker --loglevel=info
    environment: *django_env
    depends_on:
      migrate:
        condition: service_completed_successfully
      redis:
        condition: service_healthy
    restart: unless-stopped

  frontend:
    build:
      context: ./frontend-react
    ports:
      - "127.0.0.1:8089:80"
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

**بذار مهم‌ترین بخش‌ها رو با دقت بررسی کنیم:**

<div align='right' dir='rtl'>

#### <span dir='rtl'><span dir='ltr'>`&django_env`</span> و <span dir='ltr'>`*django_env`</span></span>

</div>

```yaml
environment: &django_env
  DEBUG: ...
```

این یه **ترفند YAML**ه. <span dir='ltr'>`&django_env`</span> یعنی «این بلاک رو با اسم `django_env` ذخیره کن». <span dir='ltr'>`*django_env`</span> یعنی «همون بلاک رو استفاده کن».

**چرا؟** چون `backend`، `worker` و `migrate` همه env یکسان می‌خوان. با این ترفند، یه بار می‌نویسی، سه جا استفاده می‌کنی.

#### چرا `migrate` سرویس جداست؟

**سه راه وجود داره:**

**راه ۱ (اشتباه):** هر سه سرویس (`backend`، `worker`، `migrate`) توی entrypoint مایگریشن بزنن.

**مشکل:** سه پروسه همزمان سعی می‌کنن جدول‌ها رو بسازن. ممکنه با خطای `table already exists` یا `migration is already applied` مواجه بشن.

**راه ۲ (اشتباه):** فقط `backend` مایگریشن بزنه، `worker` و `migrate` منتظر `backend` باشن.

**مشکل:** `backend` همیشه در حال اجراست، `worker` باید منتظر <span dir='ltr'>`healthcheck`</span> `backend` بمونه، که زمان‌بندی رو پیچیده می‌کنه.

**راه ۳ (درست، انتخاب ما):** یه سرویس **یک‌بارمصرف** به اسم `migrate`:

<div align='right' dir='rtl'>

<span dir='rtl'>• فقط مایگریشن می‌زنه</span> <br>
<span dir='rtl'>• با موفقیت خارج می‌شه (<span dir='ltr'>`Exited (0)`</span>)</span> <br>
<span dir='rtl'>• `backend` و `worker` منتظر `service_completed_successfully` می‌مونن</span> <br>

</div>

**نتیجه:** مایگریشن **فقط یه بار** اجرا می‌شه، قبل از هر چیز دیگه.

**پس اگه <span dir='ltr'>`docker compose ps -a`</span> نشون داد <span dir='ltr'>`migrate`</span> = `Exited (0)`، این **درسته**، نه باگ.**

#### چرا `worker` به `static_files` نیاز نداره؟

چون `collectstatic` رو اجرا نمی‌کنه. اون فقط تسک‌ها رو پردازش می‌کنه.

#### چرا `frontend` به `static_files` نیاز داره (read-only)؟

چون Nginx باید فایل‌های static Django (CSS ادمین) رو سرو کنه. <span dir='ltr'>`:ro`</span> یعنی read-only، فقط می‌خونه.

#### ترتیب شروع:

```text
1. db (healthcheck: pg_isready)
2. redis (healthcheck: redis-cli ping)
3. migrate (depends_on: db healthy) → یک بار اجرا، تموم
4. backend (depends_on: migrate completed, redis healthy)
5. worker (depends_on: migrate completed, redis healthy)
6. frontend (depends_on: backend healthy)
```

---

## ۹. چطور کل زنجیره کار می‌کنه؟ (داستان کامل)

بذار یه بار کل مسیر رو با هم ببینیم:

### مرحله ۱ — کاربر تسک می‌سازه

<div align='right' dir='rtl'>

<span dir='rtl'>• کاربر توی مرورگر <span dir='ltr'>`http://127.0.0.1:8089/`</span> رو باز می‌کنه</span> <br>
<span dir='rtl'>• React صفحه رو نشون می‌ده</span> <br>
<span dir='rtl'>• کاربر فرم رو پر می‌کنه و روی «Create task» می‌زنه</span> <br>
<span dir='rtl'>• React درخواست <span dir='ltr'>`POST /api/tasks/`</span> می‌فرسته</span> <br>

</div>

### مرحله ۲ — Nginx درخواست رو می‌گیره

<div align='right' dir='rtl'>

<span dir='rtl'>• درخواست به <span dir='ltr'>`127.0.0.1:8089/api/tasks/`</span> می‌رسه</span> <br>
<span dir='rtl'>• Nginx می‌بینه <span dir='ltr'>`/api/`</span> ← می‌فرسته به `backend:8000`</span> <br>

</div>

### مرحله ۳ — Django تسک رو ذخیره می‌کنه

<div align='right' dir='rtl'>

<span dir='rtl'>• Django درخواست رو می‌گیره</span> <br>
<span dir='rtl'>• `TaskViewSet.perform_create` اجرا می‌شه</span> <br>
<span dir='rtl'>• تسک با وضعیت `pending` توی PostgreSQL ذخیره می‌شه</span> <br>
<span dir='rtl'>• `process_task.delay(task.id)` صدا زده می‌شه</span> <br>

</div>

### مرحله ۴ — پیام توی صف می‌ره

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`process_task.delay(...)`</span> یه **پیام** توی Redis می‌ذاره</span> <br>
<span dir='rtl'>• Django **فوراً** جواب می‌ده: `201 Created`</span> <br>
<span dir='rtl'>• React کارت جدید رو با وضعیت `pending` نشون می‌ده</span> <br>

</div>

### مرحله ۵ — worker پیام رو می‌گیره

<div align='right' dir='rtl'>

<span dir='rtl'>• Celery Worker (که از قبل توی Redis گوش می‌داد) پیام رو می‌گیره</span> <br>
<span dir='rtl'>• <span dir='ltr'>`process_task(task_id)`</span> رو اجرا می‌کنه</span> <br>
<span dir='rtl'>• تسک رو از دیتابیس می‌خونه</span> <br>
<span dir='rtl'>• وضعیت رو به `processing` تغییر می‌ده</span> <br>
<span dir='rtl'>• ۱۰ ثانیه `sleep` می‌کنه</span> <br>

</div>

### مرحله ۶ — React وضعیت جدید رو می‌بینه

<div align='right' dir='rtl'>

<span dir='rtl'>• React هر ۲ ثانیه <span dir='ltr'>`GET /api/tasks/`</span> می‌فرسته (polling)</span> <br>
<span dir='rtl'>• <span dir='ltr'>Nginx</span> ← Django ← <span dir='ltr'>PostgreSQL</span></span> <br>
<span dir='rtl'>• Django لیست جدید رو با وضعیت `processing` برمی‌گردونه</span> <br>
<span dir='rtl'>• React کارت رو با آیکن چرخان و برچسب زرد نشون می‌ده</span> <br>

</div>

### مرحله ۷ — تسک تموم می‌شه

<div align='right' dir='rtl'>

<span dir='rtl'>• worker بعد از ۱۰ ثانیه بیدار می‌شه</span> <br>
<span dir='rtl'>• وضعیت رو به `done` تغییر می‌ده</span> <br>
<span dir='rtl'>• نتیجه رو پر می‌کنه</span> <br>

</div>

### مرحله ۸ — React جشن می‌گیره

<div align='right' dir='rtl'>

<span dir='rtl'>• polling بعدی، وضعیت `done` رو می‌بینه</span> <br>
<span dir='rtl'>• کارت با تیک سبز و متن نتیجه‌ی سبز نشون داده می‌شه</span> <br>

</div>

**کل این ماجرا، توی یه چیز:**

```text
React ──► Nginx ──► Django ──► PostgreSQL
                       │
                       └──► Redis ──► Celery Worker ──► PostgreSQL
                                             │
React (polling هر ۲ ثانیه) ◄────────────────────┘
```

---

## ۱۰. اجرا

از داخل <span dir='ltr'>`14-task-runner/`</span>:

```bash
docker compose up --build
```

**انتظار:**

```text
 ✔ Container 14-task-runner-db-1        Healthy
 ✔ Container 14-task-runner-redis-1     Healthy
 ✔ Container 14-task-runner-migrate-1   Exited (0)
 ✔ Container 14-task-runner-backend-1   Healthy
 ✔ Container 14-task-runner-worker-1    Started
 ✔ Container 14-task-runner-frontend-1  Started
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`migrate` با `Exited (0)` = خوبه.** یادت باشه چرا.</span>

</div>

**لاگ‌های مهم:**

```text
worker-1    | [tasks]
worker-1    |   . tasks.tasks.process_task
worker-1    | [INFO] celery@... ready.
```

اگر `tasks.tasks.process_task` توی لاگ worker هست، یعنی Celery تسک رو پیدا کرده. ✅

---

## ۱۱. تست

### تست ۱ — Endpoint سلامت

```text
http://127.0.0.1:8089/health/
```

**انتظار:** <span dir='ltr'>`{"status": "ok"}`</span>

### تست ۲ — صفحه‌ی اصلی

```text
http://127.0.0.1:8089/
```

**انتظار:** صفحه‌ی «Task Runner» با فرم و پیام «No tasks yet».

### تست ۳ — ساخت تسک

فرم رو پر کن:

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>Title</span>:** `Test background task`</span> <br>
<span dir='rtl'>• **<span dir='ltr'>Description</span>:** `Should be done in 10 seconds`</span> <br>

</div>

روی **Create task** بزن.

**باید ببینی:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. **فوراً:** کارت با وضعیت **Pending**</span> <br>
<span dir='rtl'>2. **۱-۲ ثانیه بعد:** وضعیت **Processing** (آیکن چرخان زرد)</span> <br>
<span dir='rtl'>3. **۱۰ ثانیه بعد:** وضعیت **Done** (تیک سبز)</span> <br>
<span dir='rtl'>4. **متن سبز:** <span dir='ltr'>`Processed 'Test background task' successfully.`</span></span> <br>

</div>

**این یعنی همه‌چیز داره کار می‌کنه.** 🎉

### تست ۴ — لاگ worker

```bash
docker compose logs -f worker
```

بعد از ساخت تسک، باید ببینی:

```text
Task tasks.tasks.process_task[abc-123] received
Task tasks.tasks.process_task[abc-123] succeeded in 10.5s: Task 1 done
```

**خط اول:** worker پیام رو گرفت.
**خط دوم:** worker تموم کرد.

### تست ۵ — حجم Image

```bash
docker images | Select-String "14-task-runner"
```

**انتظار:**

```text
14-task-runner-frontend   ~50MB
14-task-runner-backend    ~250MB
```

<div align='right' dir='rtl'>

<span dir='rtl'>`frontend` <span dir='ltr'>~۵۰</span> مگابایت = multi-stage build کار کرد. ✅</span>

</div>

---

## ۱۲. مشکلات رایج

### مشکل ۱ — تسک‌ها برای همیشه Pending می‌مونن

**بررسی:**

```bash
docker compose logs worker
```

اگه خطای <span dir='ltr'>`Cannot connect to redis://...`</span> دیدی، `REDIS_URL` توی `compose.yaml` مشکل داره.

اگه worker اصلاً بالا نیومده، `docker compose ps` رو ببین.

### مشکل ۲ — تسک Processing می‌شه ولی Done نمی‌شه

**بررسی:**

```bash
docker compose logs worker
```

دنبال خطاهایی مثل `Database connection failed` بگرد. اگه worker به DB وصل نمی‌شه، `POSTGRES_HOST: db` توی `compose.yaml` رو چک کن.

### مشکل ۳ — `/health/` صفحه‌ی React رو نشون می‌ده

**راه‌حل:** `nginx.conf` باید بلاک <span dir='ltr'>`location /health/`</span> داشته باشه (توضیح توی بخش nginx.conf).

### مشکل ۴ — Permission denied روی volume

**راه‌حل:** `entrypoint.sh` باید `gosu` داشته باشه.

---

## ۱۳. جمع‌بندی

### چیزهایی که یاد گرفتیم

**۱. ذهنیت داکری — ۷ سؤال:**

<p dir='rtl'>
1. اجزا چیه؟← سرویس‌ها <br>
2. هر کدوم چی لازم دارن؟ ←Dockerfile یا Image آماده <br>
3. چطور حرف می‌زنن؟ ←Network + نام سرویس <br>
4. داده چی زنده بمونه؟ ←Volume <br>
5. تنظیمات چی؟ ←Environment Variables <br>
6. چطور Build بشه؟ ←Single یا Multi-stage <br>
7. ترتیب شروع؟ ←depends_on + healthcheck
</p>

**۲. یک Image، چند سرویس:**

<div align='right' dir='rtl'>

<span dir='rtl'>• `backend` و `worker` و `migrate` از **یه Image** استفاده می‌کنن</span> <br>
<span dir='rtl'>• فقط <span dir='ltr'>`command:`</span> توی `compose.yaml` فرق می‌کنه</span> <br>
<span dir='rtl'>• این صرفه‌جویی بزرگه (build سریع‌تر، دیسک کمتر)</span> <br>

</div>

**۳. سرویس `migrate` یک‌بارمصرف:**

<div align='right' dir='rtl'>

<span dir='rtl'>• مایگریشن می‌زنه، خارج می‌شه</span> <br>
<span dir='rtl'>• `backend` و `worker` منتظر `service_completed_successfully`</span> <br>
<span dir='rtl'>• از تداخل جلوگیری می‌کنه</span> <br>

</div>

**۴. جریان Celery:**

```text
Django ──► Redis (صف) ──► Worker ──► PostgreSQL
   │
   └──► فوراً جواب کاربر
```

<div align='right' dir='rtl'>

<span dir='rtl'>**۵. Nginx به‌عنوان گارسون:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`/api/`</span> ← backend</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/admin/`</span> ← backend</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/health/`</span> ← backend</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/static/`</span> ← فایل‌های Django</span> <br>
<span dir='rtl'>• <span dir='ltr'>`/`</span> ← React</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۶. Multi-stage Build:**</span>

</div>

<p dir='rtl'>
• <span dir='ltr'>Stage 1</span>: Node.js (build) <br>
• <span dir='ltr'>Stage 2</span>: Nginx (serve) <br>
• حجم: ۵۰۰ ← ۵۰ مگابایت
</p>

### نکته‌ی کلیدی این درس

```text
ذهنیت داکری = ۷ سؤال
```

هر پروژه‌ای که دیدی، این ۷ سؤال رو بپرس. جواب‌ها همه‌چیز رو مشخص می‌کنن.

**این ارزشمندترین چیزیه که این دوره بهت داده.**

### آنچه در ادامه می‌آید

**درس ۱۵ — چت real-time (WebSocket + Channels + Redis)**

یه پروژه‌ی **کاملاً جدید** که:

<div align='right' dir='rtl'>

<span dir='rtl'>• WebSocket داره (به‌جای HTTP polling)</span> <br>
<span dir='rtl'>• Django Channels داره</span> <br>
<span dir='rtl'>• Redis به‌عنوان Channel Layer</span> <br>
<span dir='rtl'>• React با WebSocket</span> <br>
<span dir='rtl'>• **دو نفر واقعاً می‌تونن با هم چت کنن**</span> <br>

</div>

و بعد از اون:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۶:** <span dir='ltr'>Bookmark Manager</span> (Push/Pull به Docker Hub)</span> <br>
<span dir='rtl'>• **درس ۱۷:** <span dir='ltr'>URL Shortener</span> (CI/CD با GitHub Actions)</span> <br>
<span dir='rtl'>• **درس ۱۸:** <span dir='ltr'>Portfolio</span> (Deploy به <span dir='ltr'>VPS</span> + SSL + <span dir='ltr'>Domain</span>)</span> <br>
<span dir='rtl'>• **درس ۱۹:** <span dir='ltr'>Vault</span> (<span dir='ltr'>Security</span>: <span dir='ltr'>Trivy</span>، Secrets، <span dir='ltr'>Hardening</span>)</span> <br>
<span dir='rtl'>• **درس ۲۰:** <span dir='ltr'>Log Analyzer</span> (Debugging عمیق)</span> <br>
<span dir='rtl'>• **درس ۲۱:** <span dir='ltr'>Cheat Sheet</span> + Docker Templates</span> <br>
<span dir='rtl'>• **درس ۲۲:** Wrap-up + نقشه‌ی راه</span> <br>

</div>

