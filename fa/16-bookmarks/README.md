<div align='right' dir='rtl'>

[🇬🇧 English](/en/16-bookmarks/README.md)

</div>

# درس ۱۶ — Docker Registry: به‌اشتراک‌گذاری ایمیج‌ها از طریق Docker Hub

## مقدمه

تا الان ۱۵ درس با هم گذروندیم و هفت پروژه ساختیم. توی همه‌ی این پروژه‌ها، یه چیز مشترک بود: **هر ایمیجی که می‌ساختیم، فقط روی سیستم خودمون بود.** هیچ‌کسی جز ما نمی‌تونست ازش استفاده کنه.

فرض کن می‌خوای پروژه‌ت رو به همکارت بدی. باید:

<div align='right' dir='rtl'>

<span dir='rtl'>• کل کد رو براش بفرستی (یا <span dir='ltr'>`git clone`</span> کنه)</span> <br>
<span dir='rtl'>• Docker روی سیستمش نصب باشه</span> <br>
<span dir='rtl'>• خودش <span dir='ltr'>`docker compose up --build`</span> بزنه</span> <br>
<span dir='rtl'>• صبر کنه تا pip و npm و build و ... تموم بشن</span> <br>

</div>

**این یعنی هر کسی که می‌خواد پروژه رو اجرا کنه، باید همه‌ی ابزارهای development رو داشته باشه.**

ولی اینطوری نمی‌شه! توی دنیای واقعی، سرورهای production **فقط Docker دارن.** نه Python، نه Node، نه کد منبع. فقط Docker.

**سؤال:** چطور می‌شه یه پروژه رو روی یه سرور خالی بالا آورد، بدون اینکه کدش رو داشته باشیم؟

**جواب:** با **Docker Registry**. و این درس، درست درباره‌ی همینه.

### چرا این درس مهمه؟

تا الان هر چی یاد گرفتیم، توی **مرز سیستم خودمون** بود. این درس، **مرز رو می‌شکنه.** یاد می‌گیریم چطور ایمیج‌ها رو توی یه انبار ابری به اسم **Docker Hub** بذاریم، تا از هر جای دنیا قابل استفاده باشن.

این یه **تغییر پارادایم** بزرگه. مثل تفاوت بین این‌که فایل رو روی فلش داشته باشی، یا توی Google Drive بذاری. هر دو راه جواب می‌ده، ولی دومی **مقیاس‌پذیرتر، مشترک‌پذیرتر، و حرفه‌ای‌تره.**

**هدف اصلی این درس:** بعد از این درس، بدونی چطور یه اپلیکیشن رو از روی لپ‌تاپ خودت به یه سرور در هر نقطه‌ی دنیا منتقل کنی، بدون اینکه حتی یه فایل کد بفرستی.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'>• توضیح بدی **Docker Registry** چیه و چه فرقی با Docker Hub داره</span> <br>
<span dir='rtl'>• توضیح بدی چرا ایمیج‌ها نیاز به **tag** دارن و چطور کار می‌کنن</span> <br>
<span dir='rtl'>• به <span dir='ltr'>Docker Hub</span> **login** کنی</span> <br>
<span dir='rtl'>• به ایمیج‌هات **tag** بزنی تا قابل push بشن</span> <br>
<span dir='rtl'>• ایمیج‌ها رو **push** کنی به Docker Hub</span> <br>
<span dir='rtl'>• روی یه سیستم تمیز، ایمیج‌ها رو **pull** کنی و پروژه رو بدون کد بالا بیاری</span> <br>
<span dir='rtl'>• توضیح بدی چرا به **دو فایل compose** نیاز داریم</span> <br>
<span dir='rtl'>• نسخه‌ی جدید ایمیج رو **بدون توقف سرویس** منتشر کنی</span> <br>
<span dir='rtl'>• **ذهنیت داکری** داشته باشی: بدونی کِی از کد، کِی از ایمیج آماده، و کِی از ایمیج خودت توی Registry استفاده کنی</span> <br>

</div>

---

## ۱. اول، بذار بگم Registry چیه

قبل از هر چیز، بذار ساده‌ترین شکل ممکن توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>Registry چیه؟</span>

</div>

تصور کن یه **انبار بزرگ** داری که توش ایمیج‌های Docker نگه‌داری می‌شن. هر کسی که ایمیج رو در اختیار داره، می‌تونه ازش استفاده کنه. این انبار اسمش **Registry** هست.

**تشبیه‌های ساده:**

<div align='center' dir='rtl'>

| چیز روزمره | معادل داکری |
|-------------|--------------|
| <span dir='ltr'>Google Drive / OneDrive</span> | <span dir='ltr'>Registry</span> |
|<span dir='rtl'> فایل </span>| <span dir='ltr'>Image</span> |
|<span dir='rtl'> پوشه </span>| <span dir='ltr'>Repository</span> |
|<span dir='rtl'> نسخه‌ی فایل (<span dir='ltr'>`report-v1.docx`</span>) </span>| <span dir='ltr'>Tag</span> |
| <span dir='ltr'>`Upload`</span> | <span dir='ltr'>`docker push`</span> |
| <span dir='ltr'>`Download`</span> | <span dir='ltr'>`docker pull`</span> |

</div>

یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**Image**</span> ← یه فایل (مثلاً گزارش Word)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Repository**</span> ← یه پوشه (مثلاً «گزارش‌های ماهانه»)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Tag**</span> ← نسخه‌ی فایل (مثلاً <span dir='ltr'>`v1`</span>، <span dir='ltr'>`v2`</span>، <span dir='ltr'>`final`</span>)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Registry**</span> ← Google Drive / OneDrive</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Push**</span> ← آپلود</span> <br>
<span dir='rtl'>• <span dir='ltr'>**Pull**</span> ← دانلود</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>Docker Hub چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Docker Hub** معروف‌ترین Registry دنیاست. یه سرویس ابریه که:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **رایگانه** (برای پروژه‌های Public)</span> <br>
<span dir='rtl'>• **میزبانی می‌شه** توسط Docker (شرکت اصلی)</span> <br>
<span dir='rtl'>• آدرسش `hub.docker.com` هست</span> <br>
<span dir='rtl'>• توش میلیون‌ها ایمیج از توسعه‌دهنده‌های سراسر دنیاست</span> <br>

</div>

**وقتی `docker pull postgres:16` می‌زنی، در واقع داری از Docker Hub دانلود می‌کنی.** تا الان هم ازش استفاده می‌کردیم، فقط شاید بهش فکر نکرده بودیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>Registryهای دیگه</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Docker Hub تنها گزینه نیست.** Registryهای دیگه‌ای هم هستن:</span>

</div>

<div align='center' dir='rtl'>

| Registry | مال کیه؟ | توضیح |
|-----------|---------|-------|
| <span dir='ltr'>**Docker Hub**</span> | Docker |<span dir='rtl'> رایگان، عمومی، معروف‌ترین </span>|
| <span dir='ltr'>**GitHub Container Registry (GHCR)**</span> | GitHub |<span dir='rtl'> اگه از GitHub استفاده می‌کنی، عالیه </span>|
| <span dir='ltr'>**AWS ECR**</span> | Amazon |<span dir='rtl'> برای پروژه‌های AWS </span>|
| <span dir='ltr'>**Azure Container Registry (ACR)**</span> | Microsoft |<span dir='rtl'> برای Azure </span>|
| <span dir='ltr'>**Google Artifact Registry**</span> | Google |<span dir='rtl'> برای GCP </span>|
| <span dir='ltr'>**Harbor**</span> | CNCF |<span dir='rtl'> نصب‌شدنی روی سرور خودت </span>|

</div>

**نکته‌ی مهم:** Registry یه **استاندارد**ه. یعنی هر Registry که از استاندارد <span dir='ltr'>OCI</span> (Open Container Initiative) پیروی کنه، با Docker کار می‌کنه. Docker از هر Registry که بهش بگی، pull و push می‌کنه.

**پس «Docker Hub» فقط یه نمونه‌ست، نه کل مفهوم.**

### یه Registry با چه چیزهایی می‌شه ساخت؟

یه Registry رو می‌شه روی **سرور خودت** هم بالا آورد. مثلاً برای پروژه‌های داخلی یه شرکت، یه Registry خصوصی می‌سازن. اینطوری:

<div align='right' dir='rtl'>

<span dir='rtl'>• کد از شرکت بیرون نمی‌ره</span> <br>
<span dir='rtl'>• کنترل کامل روی نسخه‌ها داری</span> <br>
<span dir='rtl'>• سرعت دانلود بالاست (چون از داخل شبکه‌ست)</span> <br>

</div>

حتی یه ایمیج رسمی به اسم `registry:2` هست که خودش یه Registry کامل هست. یه بار بالا می‌آری، بقیه استفاده می‌کنن.

---

<div align='right' dir='rtl'>

## <span dir='rtl'>۲. Registry از کجا اومد؟ چرا بهش نیاز داریم؟</span>

</div>

بذار یه سناریوی واقعی رو با هم ببینیم.

### بدون Registry

تصور کن یه تیم سه نفره‌اید:

<div align='right' dir='rtl'>

<span dir='rtl'>• **تو** — کد رو نوشتی</span> <br>
<span dir='rtl'>• **مریم** — QA، باید تست کنه</span> <br>
<span dir='rtl'>• **رضا** — DevOps، باید روی سرور دیپلوی کنه</span> <br>

</div>

**بدون Registry:**

<div align='right' dir='rtl'>

<span dir='rtl'>• مریم باید کد رو بگیره، خودش `docker compose up --build` بزنه، ۱۰ دقیقه صبر کنه</span> <br>
<span dir='rtl'>• رضا باید بره روی سرور، کد رو clone کنه، دوباره build کنه، ۱۰ دقیقه صبر کنه</span> <br>
<span dir='rtl'>• تو هر بار کد رو عوض می‌کنی، هردو باید از نو build کنن</span> <br>
<span dir='rtl'>• اگه یه package لازم باشه که روی سیستم مریم نصب نیست، ارور می‌گیره</span> <br>
<span dir='rtl'>• هر سه نفر ممکنه نتیجه‌ی متفاوتی ببینن (چون سیستم‌هاشون فرق داره)</span> <br>

</div>

**این کابوسه.**

### با Registry

**با Registry:**

<div align='right' dir='rtl'>

<span dir='rtl'>• تو یه بار `docker build` می‌زنی</span> <br>
<span dir='rtl'>• یه بار `docker push` می‌زنی</span> <br>
<span dir='rtl'>• مریم فقط `docker pull` می‌کنه، `docker up` می‌کنه — **۲۰ ثانیه**</span> <br>
<span dir='rtl'>• رضا هم همین‌طور، روی سرور — **۲۰ ثانیه**</span> <br>
<span dir='rtl'>• هر سه نفر **دقیقاً همون محیط** رو دارن</span> <br>
<span dir='rtl'>• هیچ‌کسی نیاز به <span dir='ltr'>Python</span>، <span dir='ltr'>Node</span>، یا هیچ ابزار development دیگه نداره</span> <br>

</div>

**این یعنی:**

<div align='right' dir='rtl'>

<span dir='rtl'>• ✅ **سرعت:** push یه بار، pull هزار بار</span> <br>
<span dir='rtl'>• ✅ **یکسانی محیط:** همون Image همه‌جا کار می‌کنه</span> <br>
<span dir='rtl'>• ✅ **عدم نیاز به ابزار dev:** فقط Docker کافیه</span> <br>
<span dir='rtl'>• ✅ **تضمین قابل‌تکرار بودن:** نسخه‌ی دقیق، همه‌جا یکسان</span> <br>

</div>

### یه مثال ملموس‌تر

تصور کن یه کافه داری.

**بدون Registry:** هر شعبه باید خودش نون و کیک بپزه. همه‌ی ابزارها (فر، خمیرزن، ...) باید توی هر شعبه باشن. هر شعبه ممکنه طعم متفاوتی بده.

**با Registry:** یه آشپزخونه‌ی مرکزی داری. هر شعبه فقط کیک آماده رو می‌گیره و می‌فروشه. همه‌ی شعبه‌ها طعم یکسان، بدون نیاز به تجهیزات آشپزی.

**دقیقاً همین اتفاق برای Docker Registry می‌افته.**

---

## ۳. مفاهیم کلیدی این درس (به زبان خیلی ساده)

پنج اصطلاح جدید توی این درس می‌بینیم که بذار یک‌به‌یک ساده توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۱. Image (ایمیج) — یادآوری</span>

</div>

**ایمیج = یه بسته‌ی آماده‌ی اجرا.**

تصور کن یه DVD داری که توش یه بازی نصبه، همه‌چیز آماده. DVD رو می‌ذاری توی دستگاه، بازی اجرا می‌شه. **ایمیج هم دقیقاً همینه:** یه فایل بسته‌بندی‌شده که همه‌چیز داخلشه — سیستم عامل، پکیج‌ها، کد برنامه.

**فرق با کانتینر:** ایمیج، **قالب**ه. کانتینر، **نمونه‌ی در حال اجرا**ی همون قالبه. از یه ایمیج می‌تونی ۱۰۰ تا کانتینر بسازی، یا هیچی.

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۲. Repository (ریپازیتوری) — مفهوم جدید</span>

</div>

**ریپازیتوری = یه پوشه توی Registry که یه ایمیج رو نگه می‌داره.**

مثال: `library/postgres` یه ریپازیتوریه که همه‌ی نسخه‌های ایمیج Postgres رو نگه می‌داره.

فرق با ریپازیتوری Git:

<div align='right' dir='rtl'>

<span dir='rtl'>• **Git Repository** ← کد رو نگه می‌داره</span> <br>
<span dir='rtl'>• **Docker Repository** ← ایمیج رو نگه می‌داره</span> <br>

</div>

**اسمشون یکیه، ولی کاملاً متفاوتن.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۳. Tag (تگ) — مفهوم جدید</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Tag = برچسب نسخه.**</span>

</div>

هر ایمیج می‌تونه چند نسخه داشته باشه. هر نسخه یه اسم داره به اسم Tag.

**مثال:**

```
postgres:16         ← Postgres نسخه ۱۶
postgres:15         ← Postgres نسخه ۱۵
postgres:latest     ← آخرین نسخه
postgres:16-alpine  ← نسخه ۱۶، Alpine-based (کوچک‌تر)
```

**قانون طلایی:** تگ‌ها **قابل‌تغییر** هستن. یعنی می‌شه یه تگ رو به یه ایمیج جدید اشاره داد. مثلاً `latest` همیشه به جدیدترین نسخه اشاره می‌کنه.

**ولی این یه تله‌ست.** چون `latest` ممکنه فردا عوض بشه. برای production، **همیشه از نسخه‌ی دقیق استفاده کن** (`1.0.0`، `1.0.1`). ما هم همین کار رو می‌کنیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۴. Registry (رجیستری) — مفهوم جدید</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Registry = یه سرور که Repositoryها رو نگه می‌داره.**</span>

</div>

<p dir='rtl'>
<span dir='ltr'>Docker Hub</span>، <span dir='ltr'>GHCR</span>، <span dir='ltr'>AWS ECR</span> — همه Registry هستن.
</p>

**نحوه‌ی آدرس‌دهی به یه ایمیج در Registry:**

```
<registry>/<username>/<repository>:<tag>
```

مثلاً:

```
docker.io/mcsrayan/bookmarks-backend:1.0.0
```

اگه registry حذف بشه، Docker پیش‌فرض <span dir='ltr'>`docker.io`</span> (Docker Hub) رو فرض می‌کنه:

```
mcsrayan/bookmarks-backend:1.0.0
```

<div align='right' dir='rtl'>

### <span dir='rtl'>۳.۵. Push و Pull — افعال جدید</span>

</div>

<div align='center' dir='rtl'>

| عمل | معنی | دستور |
|------|-------|--------|
| **Push** |<span dir='rtl'> ایمیج رو از سیستم خودت به Registry بفرست </span>| <span dir='ltr'>`docker push <image>`</span> |
| **Pull** |<span dir='rtl'> ایمیج رو از Registry به سیستم خودت بیار </span>| <span dir='ltr'>`docker pull <image>`</span> |

</div>

**تشبیه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **Push** = آپلود فایل به Google Drive</span> <br>
<span dir='rtl'>• **Pull** = دانلود فایل از Google Drive</span> <br>

</div>

---

## ۴. ذهنیت داکری — سؤال نهم اضافه می‌شه

توی درس ۱۴، ۷ سؤال یاد گرفتیم. توی درس ۱۵، سؤال هشتم (پروتکل) اضافه شد. حالا توی درس ۱۶، سؤال نهم:

### 🎯 سؤال ۹ — ایمیج‌ها رو کجا نگه‌داری؟

بعد از این‌که به سؤالات ۱ تا ۸ جواب دادی، این سؤال رو بپرس: **«این ایمیج‌ها فقط برای خودم هستن، یا با دیگران به اشتراک گذاشته می‌شن؟»**

<div align='center' dir='rtl'>

| موقعیت | جواب |
|--------|-------|
|<span dir='rtl'> فقط برای خودم، فقط local </span>|<span dir='rtl'> Registry لازم نیست، <span dir='ltr'>`build:`</span> کافیه </span>|
|<span dir='rtl'> تیم به اشتراک می‌ذاره </span>|<span dir='rtl'> یه <span dir='ltr'>Registry</span> (Docker Hub یا GHCR) </span>|
| Production deployment |<span dir='rtl'> **حتماً** Registry (هیچ‌وقت روی سرور build نکن) </span>|
|<span dir='rtl'> کتابخانه‌ی open source </span>| <span dir='ltr'>Docker Hub</span> (Public) |

</div>

**قانون طلایی:**

> **کد رو یه جا build کن، همه‌جا pull کن.**

اگه روی هر سرور جدید build کنی، هر بار **زمان و منابع** هدر می‌ره. علاوه بر این، هر build ممکنه کمی متفاوت باشه (dependency versionها عوض می‌شن، ...). با Registry، **همه‌ی محیط‌ها دقیقاً یه چیز رو اجرا می‌کنن.**

### ۴.۱. نمودار ذهنی این درس

```text
سیستم تو (developer)
    │
    │ docker build
    ▼
Image (local)
    │
    │ docker tag
    ▼
Image (tagged for registry)
    │
    │ docker push
    ▼
Docker Hub
    │
    │ docker pull (هر کسی، هر جا)
    ▼
سرور / همکار / production
    │
    │ docker run یا docker compose up
    ▼
Container (در حال اجرا)
```

**همین یه نمودار، خلاصه‌ی کل درسه.** بقیه، جزئیاته.

---

## ۵. معماری پروژه

این پروژه یه **Bookmark Manager** ساده‌ست: React + Django + PostgreSQL. مثل درس‌های ۱۳ و ۱۴، چهار سرویس:

```text
┌──────────────────────────────────────────────────┐
│                    کاربر                           │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│           frontend (Nginx، پورت 8091)             │
│                                                  │
│  /            ──►  React static files            │
│  /api/        ──►  backend:8000 (HTTP)           │
│  /admin/      ──►  backend:8000 (HTTP)           │
│  /health/     ──►  backend:8000 (HTTP)           │
│  /static/     ──►  static_files volume           │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│         backend (Django + Gunicorn، پورت 8000)    │
└───────────────────────┬──────────────────────────┘
                        │
                        ▼
┌──────────────────────────────────────────────────┐
│              db (PostgreSQL 16)                  │
└──────────────────────────────────────────────────┘
```

**پورت‌های دوره:**

<div align='center' dir='rtl'>

| درس | پروژه | پورت |
|-----|--------|------|
| ۰۹ | TaskFlow | 8000 |
| ۱۰ | URL Monitor | 9000 |
| ۱۱ | Photo Gallery | 8080 |
| ۱۲ | Kanban Board | 3000 |
| ۱۳ | Recipe Book | 8088 |
| ۱۴ | Task Runner | 8089 |
| ۱۵ | ChatFlow | 8090 |
| **۱۶** | **Bookmarks** | **8091** |

</div>

### ۵.۱. تفاوت کلیدی این پروژه

**این پروژه دو فایل compose داره:**

<div align='right' dir='rtl'>

<span dir='rtl'>• **`compose.yaml`** ← برای توسعه (با <span dir='ltr'>`build:`</span>)</span> <br>
<span dir='rtl'>• **`compose.prod.yaml`** ← برای production (با <span dir='ltr'>`image:`</span> از Docker Hub)</span> <br>

</div>

<div align='center' dir='rtl'>

| سرویس | <span dir='ltr'>`compose.yaml` (dev)</span> | <span dir='ltr'>`compose.prod.yaml` (prod)</span> |
|--------|----------------------|----------------------------|
| `migrate` | <span dir='ltr'>`build: ./backend-django`</span> | <span dir='ltr'>`image: <username>/bookmarks-backend:1.0.0`</span> |
| `backend` | <span dir='ltr'>`build: ./backend-django`</span> | <span dir='ltr'>`image: <username>/bookmarks-backend:1.0.0`</span> |
| `frontend` | <span dir='ltr'>`build: ./frontend-react`</span> | <span dir='ltr'>`image: <username>/bookmarks-frontend:1.0.0`</span> |
| `db` | <span dir='ltr'>`image: postgres:16`</span> | <span dir='ltr'>`image: postgres:16`</span> |

</div>

**چرا `db` توی هر دو یکسانه؟** چون ایمیج خودمون نیست، یه ایمیج آماده‌ست که از قبل روی Docker Hub هست. **فقط ایمیج‌هایی که کد خودمون رو دارن، push می‌شن.**

---

## ۶. ساختار پوشه‌ها

```text
16-bookmarks/
├── .env                    ← gitignored (username واقعی)
├── .env.example            ← committed (placeholder)
├── compose.yaml            ← local dev (build:)
├── compose.prod.yaml       ← production (image:)
├── README.md
├── README.fa.md
├── backend-django/
│   ├── Dockerfile
│   ├── entrypoint.sh
│   ├── .env.example
│   ├── .dockerignore
│   ├── requirements.txt
│   ├── manage.py
│   ├── config/
│   │   ├── settings.py
│   │   ├── urls.py
│   │   ├── wsgi.py
│   │   └── asgi.py
│   └── bookmarks/
│       ├── models.py
│       ├── serializers.py
│       ├── views.py
│       ├── urls.py
│       ├── admin.py
│       └── migrations/
└── frontend-react/
    ├── Dockerfile
    ├── nginx.conf
    ├── package.json
    ├── vite.config.js
    ├── index.html
    └── src/
        ├── main.jsx
        ├── App.jsx
        ├── index.css
        ├── api.js
        └── components/
            ├── Auth.jsx
            ├── BookmarkForm.jsx
            ├── BookmarkCard.jsx
            └── BookmarkList.jsx
```

**دو فایل `compose`** توی ریشه. `compose.prod.yaml` **کد رو نداره** — فقط اسم ایمیج‌هایی که توی Docker Hub هستن.

---

## ۷. کد بک‌اند — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۱. `requirements.txt`</span>

</div>

```txt
Django==5.1.4
djangorestframework==3.15.2
djangorestframework-simplejwt==5.4.0
psycopg[binary]==3.2.10
django-environ==0.14.0
django-cors-headers==4.6.0
gunicorn==23.0.0
```

**این فایل چیه؟** لیست پکیج‌های پایتونی که پروژه لازم داره. Docker این فایل رو می‌خونه و همه رو نصب می‌کنه.

**چرا توی فایل جدا؟** چون `pip install -r requirements.txt` یه دستور ثابت می‌شه، و Docker می‌تونه لایه‌ی نصب رو **کش** کنه. اگه فقط کد تغییر کرد و این فایل دست‌نخورده موند، pip دوباره اجرا نمی‌شه.

**هر پکیج چیه؟**

<div align='center' dir='rtl'>

| پکیج | کارش |
|------|-------|
| <span dir='ltr'>`Django==5.1.4`</span> |<span dir='rtl'> فریم‌ورک بک‌اند. علامت `==` نسخه رو قفل می‌کنه </span>|
| <span dir='ltr'>`djangorestframework==3.15.2`</span> |<span dir='rtl'> لایه‌ای روی Django برای ساختن API </span>|
| <span dir='ltr'>`djangorestframework-simplejwt==5.4.0`</span> |<span dir='rtl'> احراز هویت با توکن JWT </span>|
| <span dir='ltr'>`psycopg[binary]==3.2.10`</span> |<span dir='rtl'> درایور PostgreSQL. بخش <span dir='ltr'>`[binary]`</span> یعنی نسخه‌ی کامپایل‌شده نصب بشه (بدون نیاز به کامپایلر C) </span>|
| <span dir='ltr'>`django-environ==0.14.0`</span> |<span dir='rtl'> خواندن مقادیر از فایل <span dir='ltr'>`.env`</span> </span>|
| <span dir='ltr'>`django-cors-headers==4.6.0`</span> |<span dir='rtl'> اجازه‌ی CORS (وقتی React از دامنه/پورت دیگری درخواست می‌ده) </span>|
| <span dir='ltr'>`gunicorn==23.0.0`</span> |<span dir='rtl'> وب‌سرور production (به‌جای `runserver` که فقط برای dev است) </span>|

</div>

**نکته‌ی مهم:** <span dir='ltr'>`channels`</span>، <span dir='ltr'>`daphne`</span>، <span dir='ltr'>`celery`</span> **نمی‌بینیم.** چون این پروژه:

<div align='right' dir='rtl'>

<span dir='rtl'>• WebSocket نداره (اون مال درس ۱۵ بود)</span> <br>
<span dir='rtl'>• Celery نداره (اون مال درس ۱۴ بود)</span> <br>

</div>

فقط یه HTTP ساده‌ست. **ذهنیت داکری:** ابزار فقط به اندازه‌ی نیاز. نه یه ذره بیشتر. **هر پکیجی که اضافه نکنی، ایمیجت کوچیک‌تره، سریع‌تر build می‌شه، و سطح حمله امنیتی کمتره.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۲. `bookmarks/models.py`</span>

</div>

```python
from django.conf import settings
from django.db import models


class Bookmark(models.Model):
    owner = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='bookmarks',
    )
    url = models.URLField(max_length=500)
    title = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    tags = models.CharField(max_length=200, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['owner', '-created_at']),
            models.Index(fields=['owner', 'tags']),
        ]

    def __str__(self) -> str:
        return self.title
```

**این فایل چیه؟** مدل داده‌ی بوکمارک رو تعریف می‌کنه. Django از این مدل، جدول دیتابیس می‌سازه.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`owner = models.ForeignKey(...)`**</span> — هر بوکمارک به یه کاربر تعلق داره. <span dir='ltr'>`on_delete=CASCADE`</span> یعنی اگه کاربر حذف بشه، بوکمارک‌هاش هم حذف می‌شن. <span dir='ltr'>`related_name='bookmarks'`</span> یعنی از سمت کاربر می‌تونی <span dir='ltr'>`user.bookmarks.all()`</span> بزنی</span>

<span dir='rtl'>• <span dir='ltr'>**`url = models.URLField(max_length=500)`**</span> — آدرس سایت. Django خودش اعتبارسنجی می‌کنه که با <span dir='ltr'>`http://`</span> یا <span dir='ltr'>`https://`</span> شروع بشه</span>

<span dir='rtl'>• <span dir='ltr'>**`title = models.CharField(max_length=200)`**</span> — عنوان، حداکثر ۲۰۰ کاراکتر</span>

<span dir='rtl'>• <span dir='ltr'>**`description = models.TextField(blank=True)`**</span> — توضیح اختیاری. <span dir='ltr'>`blank=True`</span> یعنی می‌تونه خالی باشه (فرم بدون خطا)</span>

<span dir='rtl'>• <span dir='ltr'>**`tags = models.CharField(max_length=200, blank=True)`**</span> — تگ‌ها به‌صورت رشته‌ی کاماجدا (<span dir='ltr'>`"python,django,web"`</span>)</span>

<span dir='rtl'>• <span dir='ltr'>**`created_at = models.DateTimeField(auto_now_add=True)`**</span> — زمان ساخت. <span dir='ltr'>`auto_now_add`</span> یعنی فقط **بار اول** که رکورد ساخته می‌شه تنظیم می‌شه</span>

<span dir='rtl'>• <span dir='ltr'>**`updated_at = models.DateTimeField(auto_now=True)`**</span> — زمان آخرین ویرایش. <span dir='ltr'>`auto_now`</span> یعنی **هر بار save** به‌روز می‌شه</span>

<span dir='rtl'>• <span dir='ltr'>**`ordering = ['-created_at']`**</span> — به‌طور پیش‌فرض جدیدترین‌ها اول. `-` یعنی نزولی</span>

<span dir='rtl'>• <span dir='ltr'>**`indexes = [...]`**</span> — دو ایندکس ترکیبی: یکی برای لیست سریع (<span dir='ltr'>`owner, -created_at`</span>)، یکی برای فیلتر سریع تگ (<span dir='ltr'>`owner, tags`</span>)</span>

</div>

**چرا `tags` ساده‌ست؟** چون تمرکز این درس روی **Docker Registry** است، نه روی مدل‌سازی پیشرفته. اگه بخوای تگ‌ها جدی‌تر باشن (جدول جداگانه با `ManyToMany`)، می‌شه. الان ساده نگه می‌داریم تا ذهن آزاد باشه برای موضوع اصلی درس.

<div align='right' dir='rtl'>

### <span dir='rtl'>۷.۳. `bookmarks/views.py`</span>

</div>

```python
class BookmarkViewSet(viewsets.ModelViewSet):
    serializer_class = BookmarkSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = Bookmark.objects.filter(owner=self.request.user)

        q = self.request.query_params.get('q')
        if q:
            qs = qs.filter(
                Q(title__icontains=q)
                | Q(url__icontains=q)
                | Q(description__icontains=q)
                | Q(tags__icontains=q)
            )

        tag = self.request.query_params.get('tag')
        if tag:
            qs = qs.filter(tags__icontains=tag)

        return qs

    def perform_create(self, serializer):
        serializer.save(owner=self.request.user)

    @action(detail=False, methods=['get'])
    def stats(self, request):
        ...
```

**این فایل چیه؟** منطق API رو تعریف می‌کنه.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`class BookmarkViewSet(viewsets.ModelViewSet)`**</span> — یه ViewSet که خودکار CRUD کامل <span dir='ltr'>(List/Create/Retrieve/Update/Delete)</span> رو می‌سازه</span>

<span dir='rtl'>• <span dir='ltr'>**`serializer_class = BookmarkSerializer`**</span> — می‌گه از این سریالایزر برای تبدیل مدل به JSON استفاده کن</span>

<span dir='rtl'>• <span dir='ltr'>**`permission_classes = [permissions.IsAuthenticated]`**</span> — هر درخواستی باید توکن JWT داشته باشه، وگرنه 401</span>

<span dir='rtl'>• <span dir='ltr'>**`filter(owner=self.request.user)`**</span> — **مهم‌ترین خط امنیتی.** همیشه به کاربر جاری محدود است. حتی اگه کسی URL کاربر دیگه رو حدس بزنه، هیچ داده‌ای نمی‌بینه</span>

<span dir='rtl'>• <span dir='ltr'>**`?q=`**</span> — جستجو در چهار فیلد با <span dir='ltr'>`icontains`</span> (case-insensitive). `|` یعنی OR</span>

<span dir='rtl'>• <span dir='ltr'>**`?tag=`**</span> — فیلتر بر اساس تگ</span>

<span dir='rtl'>• <span dir='ltr'>**`perform_create`**</span> — `owner` رو خودکار ست می‌کنه. کاربر نمی‌تونه جعل کنه</span>

<span dir='rtl'>• <span dir='ltr'>**`@action(detail=False)`**</span> — یه اندپوینت اضافی: <span dir='ltr'>`GET /api/bookmarks/stats/`</span> که تعداد کل و تگ‌های برتر رو برمی‌گردونه</span>

</div>

بقیه‌ی فایل‌های بک‌اند (<span dir='ltr'>`serializers.py`، `urls.py`، `settings.py`، `admin.py`</span>) طبق الگوهای استاندارد Django هستن. توی GitHub هر فایل با توضیحات کامل هست.

---

## ۸. کد فرانت — خط به خط

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۱. `src/api.js`</span>

</div>

```js
const api = axios.create({ baseURL: '/api' })

// Attach token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token')
  if (token && !config.headers.Authorization) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Auto-refresh on 401
let refreshPromise = null
api.interceptors.response.use(
  (res) => res,
  async (error) => {
    if (error.response?.status === 401 && !error.config._retry) {
      // ... (refresh logic)
    }
    return Promise.reject(error)
  }
)

export const bookmarkApi = {
  list: async (params = {}) => (await api.get('/bookmarks/', { params })).data,
  create: async (data) => (await api.post('/bookmarks/', data)).data,
  remove: async (id) => { await api.delete(`/bookmarks/${id}/`) },
  stats: async () => (await api.get('/bookmarks/stats/')).data,
}
```

**این فایل چیه؟** همه‌ی تماس‌های HTTP به بک‌اند از اینجا رد می‌شن.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`axios.create({ baseURL: '/api' })`**</span> — یه نمونه‌ی axios می‌سازه که همه‌ی مسیرهاش با <span dir='ltr'>`/api`</span> شروع می‌شن. <span dir='ltr'>`api.get('/bookmarks/')`</span> یعنی <span dir='ltr'>`GET /api/bookmarks/`</span></span>

<span dir='rtl'>• <span dir='ltr'>**`api.interceptors.request.use(...)`**</span> — قبل از هر درخواست، این تابع اجرا می‌شه. توکن رو از localStorage می‌خونه و به هدر `Authorization` می‌ذاره. **دیگه لازم نیست هر تابع `token` رو پاس بده**</span>

<span dir='rtl'>• <span dir='ltr'>**`api.interceptors.response.use(...)`**</span> — بعد از هر پاسخ، این تابع اجرا می‌شه. اگه پاسخ 401 بود (توکن منقضی)، سعی می‌کنه با `refresh_token` تمدید کنه و درخواست رو دوباره بفرسته</span>

<span dir='rtl'>• <span dir='ltr'>**`refreshPromise`**</span> — اگه ۵ درخواست همزمان 401 بگیرن، فقط **یکی** refresh می‌کنه. بقیه منتظر همون promise می‌مونن. این از یه باگ خیلی رایج جلوگیری می‌کنه: **چند refresh همزمان که race condition ایجاد می‌کنن**</span>

</div>

**چرا این interceptor حیاتیه؟** چون `ACCESS_TOKEN_LIFETIME` یک ساعته. اگه interceptor نداشته باشی، **بعد از یک ساعت کاربر بی‌صدا logout می‌شه و نمی‌فهمه چرا.** ما این مشکل رو تجربه کردیم و این راه‌حل رو اضافه کردیم.

<div align='right' dir='rtl'>

### <span dir='rtl'>۸.۲. `src/components/BookmarkList.jsx`</span>

</div>

```jsx
const [bookmarks, setBookmarks] = useState([])
const [q, setQ] = useState('')
const [tag, setTag] = useState('')
const [stats, setStats] = useState({ total: 0, top_tags: [] })

const fetchAll = useCallback(async () => {
  const [list, st] = await Promise.all([
    bookmarkApi.list({ q, tag }),
    bookmarkApi.stats(),
  ])
  setBookmarks(list.results || list)
  setStats(st)
}, [q, tag])

useEffect(() => { fetchAll() }, [fetchAll])
```

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`useState`**</span> — stateهای کامپوننت: لیست بوکمارک‌ها، متن جستجو، تگ فعال، آمار</span>

<span dir='rtl'>• <span dir='ltr'>**`useCallback(fn, [q, tag])`**</span> — تابع `fetchAll` رو **کش** می‌کنه. فقط وقتی `q` یا `tag` عوض بشن دوباره ساخته می‌شه. این باعث می‌شه `useEffect` بفهمه کِی باید اجرا بشه</span>

<span dir='rtl'>• <span dir='ltr'>**`Promise.all([...])`**</span> — دو درخواست رو **موازی** می‌فرسته. اگه سریال بود (`await` دوتا پشت سر هم)، ۲ برابر طول می‌کشید. `Promise.all` هر دو رو همزمان می‌فرسته و منتظر هر دو می‌مونه</span>

<span dir='rtl'>• <span dir='ltr'>**`list.results || list`**</span> — DRF به‌طور پیش‌فرض صفحه‌بندی می‌کنه. جواب <span dir='ltr'>`{count, next, previous, results}`</span> هست. پس `results` رو برمی‌گردونیم. ولی اگه صفحه‌بندی خاموش باشه، خود آرایه برمی‌گرده. این line هر دو حالت رو پوشش می‌ده</span>

<span dir='rtl'>• <span dir='ltr'>**`useEffect(() => { fetchAll() }, [fetchAll])`**</span> — هر وقت `fetchAll` عوض شد، دوباره اجرا می‌شه. نتیجه: **جستجوی لحظه‌ای** — هر حرفی که تایپی، خودش جستجو می‌کنه</span>

</div>

بقیه‌ی فایل‌های فرانت (<span dir='ltr'>`Auth.jsx`، `BookmarkForm.jsx`، `BookmarkCard.jsx`</span>) ساده‌ان و طبق الگوهای استاندارد React. توی GitHub با توضیحات کامل هستن.

---

## ۹. فایل‌های Docker — قلب پروژه

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۱. `backend-django/Dockerfile` — خط به خط کامل</span>

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
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

**این فایل چیه؟** دستور پخت ایمیج Docker. Docker این فایل رو خط به خط می‌خونه و ایمیج می‌سازه. **هر خط یه لایه است** — و لایه‌ها کش می‌شن.

**خط به خط با تمام جزئیات:**

<div align='right' dir='rtl'>

### <span dir='rtl'>`FROM python:3.12-slim` — ایمیج پایه</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`FROM` یعنی:** «از این ایمیج شروع کن.»</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`python:3.12`**</span> — Ubuntu + <span dir='ltr'>Python</span> کامل: **<span dir='ltr'>~۹۰۰</span> مگابایت** (شامل کامپایلر C و ابزارهای build)</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`python:3.12-slim`**</span> — Debian + <span dir='ltr'>Python</span> ضروری: **<span dir='ltr'>~۱۵۰</span> مگابایت**</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`python:3.12-alpine`**</span> — Alpine + <span dir='ltr'>Python</span>: **<span dir='ltr'>~۵۰</span> مگابایت** ولی دردسر داره</span> <br>

</div>

**چرا `slim`؟** پروژه‌ی ما نیازی به کامپایلر C نداره. <span dir='ltr'>`psycopg[binary]`</span> از قبل کامپایل شده. پس `slim` کافیه — **۶ برابر کوچیک‌تر**.

**چرا نه <span dir='ltr'>`alpine`</span>؟** Alpine از `musl` به‌جای `glibc` استفاده می‌کنه. خیلی از پکیج‌های پایتون (به‌خصوص اون‌هایی که C دارن) روی Alpine باید از سورس کامپایل بشن ← **build چند دقیقه کندتر + احتمال خطا**.

**چرا `3.12`؟** `Django 5.1` با `3.12` بهترین سازگاری رو داره.

<div align='right' dir='rtl'>

### <span dir='rtl'>`ENV` — متغیرهای محیطی</span>

</div>

```dockerfile
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    PIP_NO_CACHE_DIR=1 \
    PIP_DISABLE_PIP_VERSION_CHECK=1
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`ENV` یعنی:** «یه متغیر محیطی تعریف کن.» متغیرها توی کل کانتینر در دسترس‌اند.</span>

</div>

**کاراکتر `\`** یعنی خط ادامه داره. `ENV` می‌تونه چند خطی باشه بدون اینکه چند لایه ساخته بشه.

**هر متغیر چیکار می‌کنه؟**

<div align='center' dir='rtl'>

| متغیر | کارش | چرا لازمه |
|--------|-------|-----------|
| <span dir='ltr'>`PYTHONDONTWRITEBYTECODE=1`</span> |<span dir='rtl'> فایل <span dir='ltr'>`.pyc`</span> نساز </span>|<span dir='rtl'> ایمیج تمیز، بدون مشکل ownership </span>|
| <span dir='ltr'>`PYTHONUNBUFFERED=1`</span> |<span dir='rtl'> stdout رو بافر نکن </span>|<span dir='rtl'> لاگ‌ها **فوری** توی `docker logs` دیده بشن. بدون این، لاگ‌های آخر crash از دست می‌رن </span>|
| <span dir='ltr'>`PIP_NO_CACHE_DIR=1`</span> |<span dir='rtl'> pip کش نکن </span>|<span dir='rtl'> ایمیج کوچیک‌تر (۱۰۰-۲۰۰ مگابایت کمتر) </span>|
| <span dir='ltr'>`PIP_DISABLE_PIP_VERSION_CHECK=1`</span> |<span dir='rtl'> چک نسخه‌ی pip رو غیرفعال کن </span>|<span dir='rtl'> build سریع‌تر، لاگ تمیزتر، در محیط محدود شبکه‌ای (ایران) مشکل نمی‌شه </span>|

</div>

**چرا همه توی یه `ENV`؟** هر `ENV` جدا یه لایه‌ی جدا می‌سازه. با `\` همه توی یه لایه ← **ایمیج کوچیک‌تر**.

<div align='right' dir='rtl'>

### <span dir='rtl'>`WORKDIR /app` — پوشه‌ی کاری</span>

</div>

**یعنی:** «پوشه‌ی جاری رو <span dir='ltr'>`/app`</span> کن. اگه نیست، بسازش.»

از این خط به بعد، همه‌ی <span dir='ltr'>`RUN`</span>، <span dir='ltr'>`COPY`</span>، <span dir='ltr'>`CMD`</span> توی <span dir='ltr'>`/app`</span> اجرا می‌شن.

**فرق با <span dir='ltr'>`RUN cd /app`</span>:** `cd` فقط توی همون لایه اثر داره، لایه‌ی بعدی برمی‌گرده به `/`. `WORKDIR` برای **همه‌ی لایه‌های بعد** اثر داره.

<div align='right' dir='rtl'>

### <span dir='rtl'>نصب پکیج‌های سیستمی</span>

</div>

```dockerfile
RUN apt-get update \
    && apt-get install -y --no-install-recommends libpq5 gosu \
    && rm -rf /var/lib/apt/lists/*
```

<div align='right' dir='rtl'>

<span dir='rtl'>**`RUN` یعنی:** «این دستور رو توی کانتینر در حال ساخت اجرا کن.» نتیجه توی ایمیج می‌مونه.</span>

</div>

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`apt-get update`**</span> — لیست پکیج‌های موجود رو از Debian می‌گیره و توی <span dir='ltr'>`/var/lib/apt/lists/`</span> ذخیره می‌کنه. **بدون این، <span dir='ltr'>`apt-get install`</span> نمی‌دونه چی نصب کنه.** این خط **شبکه** می‌خواد — اگه شبکه کند باشه یا محدود، این خط کندترین بخش build می‌شه</span>

<span dir='rtl'>• <span dir='ltr'>**`apt-get install -y`**</span> — <span dir='ltr'>`-y`</span> یعنی «به همه‌ی سؤالات yes بده.» بدون این، اگه `apt` بپرسه «نصب کنم؟» و کسی نباشه جواب بده، **build گیر می‌کنه**</span>

<span dir='rtl'>• <span dir='ltr'>**`--no-install-recommends`**</span> — فقط پکیج‌های ضروری، نه توصیه‌شده‌ها. اگه نصب کنی، **حجم ایمیج دو برابر می‌شه** بدون فایده</span>

<span dir='rtl'>• <span dir='ltr'>**`libpq5`**</span> — کتابخانه‌ی کلاینت PostgreSQL. <span dir='ltr'>`psycopg[binary]`</span> **معمولاً** این رو داخل wheel خودش داره، ولی توی بعضی موارد (SSL، نسخه‌های خاص) به این هم نیاز پیدا می‌کنه. **نصبش ضرری نداره و یه لایه‌ی امنیتی است**</span>

<span dir='rtl'>• <span dir='ltr'>**`gosu`**</span> — ابزاری که به `entrypoint.sh` اجازه می‌ده کاربر رو عوض کنه. **جزئیات توی بخش ۹.۲**</span>

<span dir='rtl'>• <span dir='ltr'>**`rm -rf /var/lib/apt/lists/*`**</span> — فایل‌های لیست رو پاک می‌کنه. **۲۰-۳۰ مگابایت صرفه‌جویی.** بدون این، ایمیج **بی‌خود بزرگ‌تره**</span>

</div>

**چرا همه با <span dir='ltr'>`&&`</span>؟** Docker هر `RUN` یه لایه می‌سازه. اگه سه تا `RUN` جدا بود، لایه‌ی وسطی (که فایل‌های لیست رو داره) **توی ایمیج می‌موند، حتی اگه `rm` پاکش کنه**. با `&&` همه توی **یه لایه**ن ← فقط نتیجه‌ی نهایی ذخیره می‌شه.

<div align='right' dir='rtl'>

### <span dir='rtl'>کپی و نصب پکیج‌های پایتون</span>

</div>

```dockerfile
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
```

**چرا اول `requirements.txt`، بعد کد؟** **این یکی از مهم‌ترین ترفندهای Dockerfile نویسیه.**

**اگه ترتیب اشتباه بود:**

```dockerfile
COPY . .                              # کد + requirements.txt
RUN pip install -r requirements.txt   # نصب
```

هر بار که **یه خط کد** عوض می‌کنی، لایه‌ی <span dir='ltr'>`COPY . .`</span> باطل می‌شه ← `pip install` **دوباره اجرا می‌شه** ← هر بار **۲ دقیقه صبر** برای نصب پکیج‌هایی که عوض نشدن!

**با ترتیب درست:**

```dockerfile
COPY requirements.txt .              # فقط requirements.txt
RUN pip install -r requirements.txt   # نصب (این لایه کش می‌شه)
COPY . .                              # بقیه‌ی کد
```

تا وقتی `requirements.txt` **تغییر نکرده**، لایه‌ی `pip install` **از کش استفاده می‌کنه**. فقط <span dir='ltr'>`COPY . .`</span> دوباره اجرا می‌شه → **۵ ثانیه**.


<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`COPY requirements.txt .`</span>** — از <span dir='ltr'>build context</span> (`requirements.txt`) کپی به <span dir='ltr'>`/app/requirements.txt`</span> (چون <span dir='ltr'>`WORKDIR /app`</span>).</span>

<span dir='rtl'>**<span dir='ltr'>`COPY . .`</span>** — همه‌ی فایل‌های پروژه رو کپی می‌کنه. **ولی فایل‌های <span dir='ltr'>`.dockerignore`</span> نمیان** — <span dir='ltr'>`.env`</span>، <span dir='ltr'>`__pycache__`</span>، <span dir='ltr'>`.venv`</span>، <span dir='ltr'>`.git`</span> همه حذف می‌شن.</span>

</div>

### ساخت کاربر غیر-root


```dockerfile
RUN mkdir -p /app/staticfiles \
    && useradd --create-home --shell /bin/bash appuser \
    && chown -R appuser:appuser /app \
    && chmod +x /app/entrypoint.sh
```

**۴ کار:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`mkdir -p /app/staticfiles`**</span> — پوشه‌ی static Django رو می‌سازه. <span dir='ltr'>`-p`</span> یعنی «اگه نبود بساز»</span>

<span dir='rtl'>• <span dir='ltr'>**`useradd --create-home --shell /bin/bash appuser`**</span> — یه کاربر جدید `appuser` می‌سازه. <span dir='ltr'>`--create-home`</span> یعنی <span dir='ltr'>`/home/appuser`</span> رو بسازه. <span dir='ltr'>`--shell /bin/bash`</span> یعنی shellش `bash` باشه</span>

<span dir='rtl'>• <span dir='ltr'>**`chown -R appuser:appuser /app`**</span> — مالکیت همه‌ی فایل‌های <span dir='ltr'>`/app`</span> رو به `appuser` می‌ده. <span dir='ltr'>`-R`</span> یعنی recursive</span>

<span dir='rtl'>• <span dir='ltr'>**`chmod +x /app/entrypoint.sh`**</span> — فایل `entrypoint.sh` رو executable می‌کنه. بدون این، Docker موقع اجرا `permission denied` می‌ده</span>

</div>

**چرا اصلاً کاربر جدید؟**

<div align='right' dir='rtl'>

<span dir='rtl'>Docker به‌طور پیش‌فرض همه چیز رو با `root` اجرا می‌کنه. **root داخل کانتینر = پتانسیل root روی host.** اگه مهاجم کد رو هک کرد و root بود، **می‌تونه به کانتینرهای دیگه، فایل‌های host، و در بدترین حالت به خود host حمله کنه.**</span>

</div>

با <span dir='ltr'>`appuser`</span> (non-root)، حتی اگه هک بشه، **دسترسی محدود** داره.

**نکته‌ی حیاتی:** <span dir='ltr'>`chmod +x`</span> **قبل از** `USER appuser` اجرا می‌شه. چون بعد از سوییچ به `appuser`، اون **دسترسی تغییر permission فایل مال root** رو نداره.

<div align='right' dir='rtl'>

### <span dir='rtl'>`USER appuser` — سوییچ کاربر</span>

</div>

**از این خط به بعد، همه‌ی دستورات با `appuser` اجرا می‌شن** (نه root).

<div align='center' dir='rtl'>

|<span dir='rtl'> قبل از `USER appuser` </span>|<span dir='rtl'> بعد از `USER appuser` </span>|
|------------------------|------------------------|
| `root` | `appuser` |

</div>

**چرا بعد از `RUN`های دیگر؟** چون نصب apt، pip، chown، chmod **نیاز به root** دارن. الگو:

<div align='right' dir='rtl'>

<span dir='rtl'>1. کارهای root لازم (نصب، chown، chmod)</span> <br>
<span dir='rtl'>2. سوییچ به کاربر عادی</span> <br>
<span dir='rtl'>3. کارهای runtime (اجرای برنامه)</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`EXPOSE 8000` — مستندسازی</span>

</div>

**این خط فقط مستندسازیه.** هیچ پورتی رو **باز نمی‌کنه**.

می‌گه «این ایمیج روی پورت 8000 گوش می‌ده.» برای `docker inspect` و مستندسازی.

**باز کردن پورت واقعی** توی `compose.yaml` با <span dir='ltr'>`ports:`</span> انجام می‌شه.

<div align='right' dir='rtl'>

### <span dir='rtl'>`ENTRYPOINT` و `CMD` — نقطه‌ی ورود</span>

</div>

```dockerfile
ENTRYPOINT ["/app/entrypoint.sh"]
CMD ["gunicorn", "--bind", "0.0.0.0:8000", "--workers", "3", "config.wsgi:application"]
```

**دو دستور، دو نقش:**

<div align='center' dir='rtl'>

| دستور | نقش |
|-------|------|
| `ENTRYPOINT` |<span dir='rtl'> **همیشه اجرا می‌شه** — نقطه‌ی ورود </span>|
| `CMD` |<span dir='rtl'> **آرگومان پیش‌فرض** — می‌تونه override بشه </span>|

</div>

**در عمل:** <span dir='ltr'>`docker run <image>`</span> ← <span dir='ltr'>Docker</span> اجرا می‌کنه: <span dir='ltr'>`entrypoint.sh gunicorn --bind 0.0.0.0:8000 --workers 3 config.wsgi:application`</span>

<div align='right' dir='rtl'>

<span dir='rtl'>`entrypoint.sh` کارهای مقدماتی (migrate، collectstatic) رو انجام می‌ده، بعد <span dir='ltr'>`exec gunicorn ...`</span> می‌کنه.</span>

</div>

**می‌شه `CMD` رو عوض کرد؟** **بله!** توی `compose.yaml`:

```yaml
migrate:
  build: ./backend-django
  command: python manage.py migrate --noinput   # ← CMD رو override می‌کنه
```

این‌جا <span dir='ltr'>Docker</span> `entrypoint.sh` رو اجرا می‌کنه، ولی به‌جای <span dir='ltr'>`gunicorn`</span>، `python manage.py migrate` رو اجرا می‌کنه. **نتیجه:** از همون ایمیج، برای دو سرویس (backend و migrate) استفاده می‌کنیم. **صرفه‌جویی بزرگ.**

**چرا <span dir='ltr'>`["..."]`</span> (exec form) به‌جای <span dir='ltr'>`...`</span> (shell form)؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**Shell form**</span> (<span dir='ltr'>`CMD gunicorn ...`</span>) ← <span dir='ltr'>Docker</span> اجرا می‌کنه <span dir='ltr'>`sh -c "gunicorn ..."`</span>. یعنی یه shell وسط هست. سیگنال‌های <span dir='ltr'>Docker</span> (SIGTERM) به shell می‌رسه، نه به `gunicorn`. نتیجه: **بدون graceful shutdown** — ممکنه ۱۰ ثانیه صبر کنه و زورکی kill بشه</span>

<span dir='rtl'>• <span dir='ltr'>**Exec form**</span> (<span dir='ltr'>`CMD ["gunicorn", ...]`</span>) ← مستقیم. سیگنال مستقیم به <span dir='ltr'>`gunicorn`</span>. **graceful shutdown درست کار می‌کنه**</span>

</div>

**قانون طلایی:** همیشه **exec form** برای `ENTRYPOINT` و `CMD`.

**آرگومان‌های `gunicorn`:**

<div align='center' dir='rtl'>

| پارامتر | معنی |
|---------|-------|
| <span dir='ltr'>`--bind 0.0.0.0:8000`</span> |<span dir='rtl'> روی همه‌ی interfaceها گوش بده، پورت 8000. `0.0.0.0` = «از هر جا قابل دسترس» </span>|
| <span dir='ltr'>`--workers 3`</span> |<span dir='rtl'> ۳ پروسه‌ی worker (پردازش همزمان ۳ درخواست) </span>|
| <span dir='ltr'>`config.wsgi:application`</span> |<span dir='rtl'> نقطه‌ی ورود WSGI پروژه: فایل `config/wsgi.py`، شیء `application` </span>|

</div>

**چرا `gunicorn` و نه `runserver`؟** `runserver` فقط برای dev است. تک‌worker، بدون مدیریت سیگنال، بدون performance. **توی production همیشه `gunicorn`.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۲. `entrypoint.sh` — خط به خط</span>

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

**این فایل چیه؟** اسکریپت شروع کانتینر. قبل از اجرای دستور اصلی (`CMD`)، کارهای مقدماتی رو انجام می‌ده.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`#!/bin/sh`**</span> — shebang. به سیستم می‌گه «این فایل رو با <span dir='ltr'>`/bin/sh`</span> اجرا کن.» <span dir='ltr'>`/bin/sh`</span> همیشه توی imageهای `slim` موجوده</span>

<span dir='rtl'>• <span dir='ltr'>**`set -e`**</span> — اگه هر دستوری fail کرد (خروج غیر صفر)، **کل اسکریپت متوقف بشه**. بدون این، اگه `migrate` شکست بخوره، اسکریپت ادامه می‌ده و `gunicorn` با یه دیتابیس نیمه‌مهاجرت بالا میاد. **فاجعه**</span>

<span dir='rtl'>• <span dir='ltr'>**`if [ "$(id -u)" = "0" ]`**</span> — چک می‌کنه آیا با کاربر root اجرا می‌شیم؟ (<span dir='ltr'>`id -u`</span> صفر یعنی root). چرا؟ چون Docker ولوم‌های <span dir='ltr'>named</span> (`static_files`) رو با `root` می‌سازه، حتی اگه `Dockerfile` بگه `appuser` — **این یه مشکل شناخته‌شده‌ست**</span>

<span dir='rtl'>• <span dir='ltr'>**`chown -R appuser:appuser /app/staticfiles`**</span> — مالکیت ولوم رو به `appuser` می‌ده. بدون این، `collectstatic` با `permission denied` مواجه می‌شه</span>

<span dir='rtl'>• <span dir='ltr'>**`exec gosu appuser "$0" "$@"`**</span> — **این خط جادوییه.** خودش رو با `appuser` **دوباره اجرا** می‌کنه:</span> <br>

  <span dir='rtl' style='margin-right:32px'>⁌ `gosu` مثل `sudo` عمل می‌کنه: یه دستور رو با کاربر دیگه اجرا می‌کنه</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ <span dir='ltr'>`$0`</span> = همین فایل (`entrypoint.sh`)</span> <br>
  <span dir='rtl' style='margin-right:32px'>⁌ <span dir='ltr'>`$@`</span> = همه‌ی آرگومان‌های اصلی (`CMD`)</span> <br>

  نتیجه: `entrypoint.sh` با `appuser` دوباره اجرا می‌شه. ولی این بار، <span dir='ltr'>`id -u`</span> صفر نیست (چون `appuser` هستیم) ← از `if` رد می‌شه

</div>

**بار دوم که اجرا می‌شه:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. <span dir='ltr'>`id -u`</span> دیگه 0 نیست ← از `if` رد می‌شه</span> <br>
<span dir='rtl'>2. <span dir='ltr'>`python manage.py migrate`</span> اجرا می‌شه (با `appuser`)</span> <br>
<span dir='rtl'>3. <span dir='ltr'>`python manage.py collectstatic`</span> اجرا می‌شه (با `appuser`)</span> <br>
<span dir='rtl'>4. <span dir='ltr'>`exec "$@"`</span> — دستور `CMD` (گونی‌کورن) رو اجرا می‌کنه</span> <br>

</div>

**چرا `migrate` توی entrypoint و نه Dockerfile؟** چون بعد از بالا اومدن دیتابیس باید اجرا بشه. توی `Dockerfile`، دیتابیس در دسترس نیست.

**چرا <span dir='ltr'>`exec "$@"`</span> و نه فقط <span dir='ltr'>`"$@"`</span>؟** `exec` باعث می‌شه <span dir='ltr'>`gunicorn`</span> **PID 1** بشه (پروسه‌ی اصلی). بدون <span dir='ltr'>`exec`</span>، `gunicorn` فرزند `sh` می‌شه و سیگنال‌های Docker به `sh` می‌رسن، نه به <span dir='ltr'>`gunicorn`</span> ← **graceful shutdown خراب می‌شه**.

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۳. <span dir='ltr'>`frontend-react/Dockerfile`</span> — Multi-stage</span>

</div>

```dockerfile
FROM node:22-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json* ./
RUN npm ci || npm install
COPY . .
RUN npm run build

FROM nginx:1.27-alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

**این فایل چیه؟** **Multi-stage build** — یه تکنیک که بهت اجازه می‌ده ایمیج نهایی رو خیلی کوچیک‌تر کنی.

**دو مرحله:**

**مرحله ۱ — `builder`:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`FROM node:22-alpine AS builder`**</span> — از Node.js شروع کن و اسمش رو `builder` بذار</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`COPY package.json package-lock.json* ./`**</span> — فقط فایل‌های وابستگی رو کپی کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`RUN npm ci || npm install`**</span> — `npm ci` سریع‌تر و دقیق‌تره، ولی نیاز به <span dir='ltr'>`package-lock.json`</span> داره. اگه نبود، `npm install`</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`COPY . .`**</span> — بقیه‌ی کد</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`RUN npm run build`**</span> — React رو به فایل‌های <span dir='ltr'>static</span> (<span dir='ltr'>`dist/`</span>) کامپایل کن</span> <br>

</div>

**حجم این مرحله: <span dir='ltr'>~۵۰۰</span> مگابایت** (<span dir='ltr'>Node.js</span> + <span dir='ltr'>npm</span> + <span dir='ltr'>`node_modules`</span> + کد + <span dir='ltr'>`dist`</span>).

**مرحله ۲ — `final` (نهایی):**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`FROM nginx:1.27-alpine`**</span> — ⭐ **این خط مرحله‌ی ۱ رو کاملاً فراموش می‌کنه.** یه ایمیج جدید از صفر</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`COPY --from=builder /app/dist /usr/share/nginx/html`**</span> — **فقط** پوشه‌ی `dist` رو از مرحله‌ی قبلی کپی کن</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`COPY nginx.conf /etc/nginx/conf.d/default.conf`**</span> — کانفیگ Nginx</span> <br>

</div>

**حجم نهایی: <span dir='ltr'>~۵۵</span> مگابایت.** بدون Node.js، بدون `node_modules`، بدون کد منبع. **فقط Nginx + فایل‌های static.**

**نتیجه: ایمیج ۱۰ برابر کوچیک‌تر.** ✅

**چرا <span dir='ltr'>`daemon off;`</span> توی `CMD`؟**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`nginx -g "daemon off;"`</span> یعنی «Nginx به‌عنوان پروسه‌ی foreground اجرا بشه، نه daemon.» اگه daemon بود، Nginx فوراً fork می‌شد و بچه‌اش رو می‌ساخت و پروسه‌ی اصلی تموم می‌شد ← Docker فکر می‌کرد کانتینر تموم شده. `daemon off` تضمین می‌کنه <span dir='ltr'>Nginx</span> **PID 1** بمونه.</span>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۹.۴. `frontend-react/nginx.conf` — خط به خط</span>

</div>

```nginx
upstream backend { server backend:8000; }

server {
    listen 80;

    location / { try_files $uri $uri/ /index.html; }
    location /api/ { proxy_pass http://backend; }
    location /admin/ { proxy_pass http://backend; }
    location /health/ { proxy_pass http://backend; }
    location /static/ { alias /app/staticfiles/; }
}
```

**این فایل چیه؟** Nginx به‌عنوان یه **reverse proxy** عمل می‌کنه. مرورگر یه درخواست می‌فرسته به Nginx، Nginx تصمیم می‌گیره کجا بفرسته.

**خط به خط:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`upstream backend { server backend:8000; }`**</span> — یه اسم `backend` تعریف می‌کنه که به سرور `backend:8000` اشاره می‌کنه. `backend` اسم سرویس توی compose است</span>

<span dir='rtl'>• <span dir='ltr'>**`listen 80`**</span> — روی پورت 80 گوش بده</span>

<span dir='rtl'>• <span dir='ltr'>**`location /`**</span> — همه‌ی مسیرهای دیگه</span> <br>
<span dir='rtl' style='margin-right:32px;'>← <span dir='ltr'>`try_files $uri $uri/ /index.html`</span> — اگه فایلی با این اسم بود، بده. اگه نبود، `index.html` رو بده. **این برای SPA routing حیاتیه** — React خودش مسیرها رو مدیریت می‌کنه</span>

<span dir='rtl'>• <span dir='ltr'>**`location /api/`**</span> — درخواست‌های API</span> <br>
<span dir='rtl' style='margin-right:32px;'>← <span dir='ltr'>`proxy_pass http://backend`</span> — بفرست به بک‌اند</span>

<span dir='rtl'>• <span dir='ltr'>**`location /admin/`**</span> — پنل ادمین Django ← بک‌اند</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /health/`**</span> — بررسی سلامت ← بک‌اند</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`location /static/`**</span> — فایل‌های <span dir='ltr'>static Django</span> (CSS ادمین)</span> <br>
<span dir='rtl' style='margin-right:32px;'>← <span dir='ltr'>`alias /app/staticfiles/`</span> — از این پوشه بخون. **`alias` به‌جای `root`** چون می‌خوایم مسیر مستقیم باشه</span>

</div>

**تفاوت با درس ۱۵:** هیچ بلوک <span dir='ltr'>`/ws/`</span> و هیچ هدر `Upgrade` نداریم. **چون HTTP ساده‌ست، Nginx ساده‌ست.**

---

## ۱۰. حالا بریم سراغ هسته‌ی درس: Docker Hub Workflow

### ۱۰.۱. ساخت حساب Docker Hub

<div align='right' dir='rtl'>

<span dir='rtl'>1. برو به <span dir='ltr'>`https://hub.docker.com/signup`</span></span> <br>
<span dir='rtl'>2. <span dir='ltr'>Username</span>، <span dir='ltr'>Email</span>، <span dir='ltr'>Password</span> بزن</span> <br>
<span dir='rtl'>3. تأیید کن</span> <br>

</div>

**نکته‌ی مهم:** Username حتماً **lowercase** باشه. اگه uppercase داشته باشه، `docker push` خطا می‌ده.

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۰.۲. `docker login`</span>

</div>

```bash
docker login
```

خروجی موفق:

```text
Login Succeeded
```

**این دستور یه توکن ذخیره می‌کنه** توی <span dir='ltr'>`~/.docker/config.json`</span>. تا وقتی logout نکنی، همه‌ی `push`ها خودکار احراز هویت می‌شن.

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۰.۳. `docker tag` — تغییر نام ایمیج</span>

</div>

اکنون دو ایمیج داری:

```bash
docker images
```

```
16-bookmarks-backend    latest
16-bookmarks-frontend   latest
```

**این اسم‌ها قابل push نیستن.** Docker Hub فقط اسم‌هایی رو قبول می‌کنه به شکل:

```
<username>/<repo>:<tag>
```

مثلاً `mcsrayan/bookmarks-backend:1.0.0`.

**پس `docker tag` = "یه نام جدید (alias) برای همون ایمیج".** هیچ چیزی build نمی‌شه، فقط اسم اضافه می‌شه.

```bash
docker tag 16-bookmarks-backend:latest mcsrayan/bookmarks-backend:1.0.0
docker tag 16-bookmarks-frontend:latest mcsrayan/bookmarks-frontend:1.0.0
```

**تأیید:**

```bash
docker images | grep bookmarks
```

**می‌بینی** هر ایمیج **دو خط** داره — یکی با اسم local، یکی با اسم Docker Hub. ولی **همون Image ID** — یعنی **یه فایل، دو اسم**.

**چرا `1.0.0` و نه `latest`؟**

<div align='center' dir='rtl'>

| Tag | کِی استفاده کنیم |
|-----|-------------------|
| <span dir='ltr'>`latest`</span> |<span dir='rtl'> نامشخص — ممکنه هر لحظه عوض بشه </span>|
| <span dir='ltr'>`1.0.0`</span> |<span dir='rtl'> نسخه‌ی دقیق — قابل پیش‌بینی </span>|
| <span dir='ltr'>`1.0.1`</span> |<span dir='rtl'> نسخه‌ی بعدی (باگ‌فیکس) </span>|
| <span dir='ltr'>`dev`</span> |<span dir='rtl'> برای توسعه‌ی فعال </span>|

</div>

**قانون طلایی:** برای production از نسخه‌ی دقیق استفاده کن. `latest` یه تله‌ست چون **قابل پیش‌بینی نیست.**

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۰.۴. `docker push`</span>

</div>

```bash
docker push mcsrayan/bookmarks-backend:1.0.0
docker push mcsrayan/bookmarks-frontend:1.0.0
```

**خروجی نمونه:**

```text
The push refers to repository [docker.io/mcsrayan/bookmarks-backend]
...
1.0.0: digest: sha256:... size: 1426
```

**زمان:** بستگی به سرعت آپلود. اول بار ۱-۳ دقیقه، بارهای بعد سریع‌تر (فقط لایه‌های جدید می‌رن).

**چرا بارهای بعد سریع‌ترن؟** Docker لایه‌ها رو می‌شناسه. اگه یه لایه قبلاً push شده بود، نمی‌فرسته. **فقط تفاوت‌ها می‌رن.**

### ۱۰.۵. تأیید

برو به مرورگر:

```
https://hub.docker.com/r/mcsrayan/bookmarks-backend
```

می‌بینی:

<div align='right' dir='rtl'>

<span dir='rtl'>• ریپازیتوری: `bookmarks-backend`</span> <br>
<span dir='rtl'>• <span dir='ltr'>Tag</span>: `1.0.0`</span> <br>
<span dir='rtl'>• حجم: <span dir='ltr'>`~۲۵۰MB`</span></span> <br>
<span dir='rtl'>• دستور `docker pull` برای کپی-پیست</span> <br>

</div>

**این ایمیج الان توی ابره. هر کسی از هر جایی می‌تونه pull کنه.**

---

<div align='right' dir='rtl'>

## <span dir='rtl'>۱۱. `compose.prod.yaml` — بدون کد، فقط ایمیج</span>

</div>

### ۱۱.۱. ساخت <span dir='ltr'>`.env.example`</span>

```env
DOCKERHUB_USERNAME=your-dockerhub-username
```

### ۱۱.۲. ساخت <span dir='ltr'>`.env`</span> (واقعی، gitignored)

```env
DOCKERHUB_USERNAME=mcsrayan
```

**چرا <span dir='ltr'>`.env`</span> gitignored؟** چون هر کسی که ریپو رو clone می‌کنه، username خودش رو باید بذاره. username توی گیت = دردسر.

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۱.۳. `compose.prod.yaml`</span>

</div>

```yaml
services:
  db:
    image: postgres:16
    # ... (بدون تغییر از compose.yaml)

  migrate:
    image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0
    command: python manage.py migrate --noinput
    environment: &django_env
      # ... (همون env مثل قبل)
    depends_on:
      db: { condition: service_healthy }

  backend:
    image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.0
    environment: *django_env
    volumes:
      - static_files:/app/staticfiles
    depends_on:
      migrate: { condition: service_completed_successfully }

  frontend:
    image: ${DOCKERHUB_USERNAME}/bookmarks-frontend:1.0.0
    ports:
      - "127.0.0.1:8091:80"
    volumes:
      - static_files:/app/staticfiles:ro
    depends_on:
      backend: { condition: service_healthy }

volumes:
  postgres_data:
  static_files:
```

**دو تفاوت با `compose.yaml`:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. **<span dir='ltr'>`image:`</span> به‌جای <span dir='ltr'>`build:`</span>** — از <span dir='ltr'>Docker Hub</span> pull می‌شه</span> <br>
<span dir='rtl'>2. **<span dir='ltr'>`${DOCKERHUB_USERNAME}`</span>** — از <span dir='ltr'>`.env`</span> خونده می‌شه</span> <br>

</div>

**نکته‌ی مهم:** فایل `compose.prod.yaml` **هیچ کدی نداره.** اگه کد رو پاک کنی، این فایل باز کار می‌کنه. **این یعنی می‌تونی فقط این فایل و <span dir='ltr'>`.env`</span> رو روی سرور بذاری و پروژه رو اجرا کنی.**

### ۱۱.۴. تست واقعی (شبیه‌سازی سرور تمیز)

**مرحله ۱ — حذف کامل ایمیج‌های local:**

```bash
docker compose -f compose.yaml down -v
docker rmi 16-bookmarks-backend:latest 16-bookmarks-frontend:latest
docker rmi mcsrayan/bookmarks-backend:1.0.0 mcsrayan/bookmarks-frontend:1.0.0
```

**مرحله ۲ — بالا آوردن با `compose.prod.yaml`:**

```bash
docker compose -f compose.prod.yaml up
```

**خروجی:**

```text
 ✔ bookmarks-backend Pulled
 ✔ bookmarks-frontend Pulled
 ✔ Container db-1  Healthy
 ✔ Container migrate-1  Exited (0)
 ✔ Container backend-1  Healthy
 ✔ Container frontend-1  Started
```

**دو خط `Pulled`** = تبریک! ایمیج‌ها از Docker Hub اومدن، نه از کد local. **پروژه بدون کد اجرا شد.**

**مرحله ۳ — تست:**

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`http://127.0.0.1:8091/`</span> ← فرم لاگین</span> <br>
<span dir='rtl'>• ثبت‌نام ← کار می‌کنه</span> <br>

</div>

---

## ۱۲. نسخه‌بندی و به‌روزرسانی

فرض کن یه باگ توی کد پیدا کردی و رفعش کردی. حالا چطور به‌روزرسانی رو منتشر کنی؟

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۲.۱. Rebuild</span>

</div>

```bash
docker compose -f compose.yaml build backend
```

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۲.۲. Tag با نسخه‌ی جدید</span>

</div>

```bash
docker tag 16-bookmarks-backend:latest mcsrayan/bookmarks-backend:1.0.1
```

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۲.۳. Push</span>

</div>

```bash
docker push mcsrayan/bookmarks-backend:1.0.1
```

### ۱۲.۴. تغییر `compose.prod.yaml`

```yaml
backend:
# از 1.0.0 به 1.0.1
  image: ${DOCKERHUB_USERNAME}/bookmarks-backend:1.0.1
```

### ۱۲.۵. روی سرور production

```bash
docker compose -f compose.prod.yaml pull
docker compose -f compose.prod.yaml up -d
```

**توجه:** <span dir='ltr'>`up -d`</span> (detach) — سرویس‌های قدیمی رو با جدیدها جایگزین می‌کنه. اگه image عوض شده باشه، دوباره pull می‌کنه و بالاتر می‌آره.

**قانون طلایی:**

> **هرگز `latest` رو توی production استفاده نکن.** چون یه روز صبح بیدار می‌شی و می‌بینی سرویس با یه نسخه‌ی ناشناخته کار می‌کنه.

---

## ۱۳. مشکلات رایج

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۳.۱. `TLS handshake timeout` هنگام build/pull</span>

</div>

**علت:** Docker Hub از ایران معمولاً در دسترس نیست.

**راه‌حل‌ها (به‌ترتیب):**

<div align='right' dir='rtl'>

<span dir='rtl'>1. **VPN روشن کن** — ساده‌ترین. توی همین پروژه، ما فقط VPN روشن کردیم و build بدون هیچ تغییر دیگه‌ای کار کرد</span> <br>
<span dir='rtl'>2. **Registry Mirror** تنظیم کن: <span dir='ltr'>Docker Desktop</span> ← <span dir='ltr'>Settings</span> ← <span dir='ltr'>Docker Engine</span> ← اضافه کن:</span> <br>

</div>

```json
{
  "registry-mirrors": [
    "https://docker.iranserver.com",
    "https://docker.arvancloud.ir"
  ]
}
```

<div align='right' dir='rtl'>

<span dir='rtl'>3. **DNS** رو روی `8.8.8.8` بذار: <span dir='ltr'>Docker Desktop</span> ← <span dir='ltr'>Settings</span> ← <span dir='ltr'>Resources</span> ← <span dir='ltr'>Network</span></span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۳.۲. `unauthorized: authentication required`</span>

</div>

```bash
docker login
```

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۳.۳. `denied: requested access to the resource is denied`</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• Username در `docker tag` با username واقعی حساب یکی نیست</span> <br>
<span dir='rtl'>• یا `docker login` نکردی</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۳.۴. `migrate` نشون می‌ده `Exited (0)`</span>

</div>

**این درسته.** `migrate` یه سرویس یک‌بارمصرفه. اجرا می‌شه، خارج می‌شه. `backend` منتظر `service_completed_successfully` می‌مونه.

<div align='right' dir='rtl'>

### <span dir='rtl'>۱۳.۵. `apt-get update` خیلی طول می‌کشه</span>

</div>

**علت:** `deb.debian.org` از ایران کنده (30kB/s یا حتی timeout).

**راه‌حل‌ها:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. **VPN روشن کن** — توی این پروژه، همین کافی بود (بدون هیچ تغییر توی Dockerfile)</span> <br>
<span dir='rtl'>2. **اگه VPN نداری**، خط زیر رو **قبل** از `apt-get` توی Dockerfile اضافه کن (mirror ایرانی):</span> <br>

</div>

```dockerfile
RUN sed -i 's|deb.debian.org|mirror.iranserver.com|g' /etc/apt/sources.list.d/debian.sources
```

**نکته‌ی مهم:** فایل پروژه‌ی ما **این خط رو نداره**، چون با VPN کار کرد. اگه بدون VPN هستی، این خط رو اضافه کن.

---

## ۱۴. جمع‌بندی

### چیزهایی که یاد گرفتیم

**۱. ذهنیت داکری — ۹ سؤال:**

<div align='right' dir='rtl'>

<span dir='rtl'>1. اجزا چیه؟ ← سرویس‌ها</span> <br>
<span dir='rtl'>2. هر کدوم چی لازم دارن؟ ← <span dir='ltr'>Dockerfile</span> / Image آماده / Image از Registry</span> <br>
<span dir='rtl'>3. چطور حرف می‌زنن؟ ← Network + نام سرویس</span> <br>
<span dir='rtl'>4. داده چی زنده بمونه؟ ← Volume</span> <br>
<span dir='rtl'>5. تنظیمات چی؟ ← Environment Variables</span> <br>
<span dir='rtl'>6. چطور Build بشه؟ ← <span dir='ltr'>Single</span> / Multi-stage</span> <br>
<span dir='rtl'>7. ترتیب شروع؟ ← <span dir='ltr'>depends_on</span> + healthcheck</span> <br>
<span dir='rtl'>8. **پروتکل چیه؟** ← <span dir='ltr'>HTTP</span> / WebSocket</span> <br>
<span dir='rtl'>9. **ایمیج‌ها کجا نگه‌داری می‌شن؟** ← Registry ⭐</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۲. <span dir='ltr'>Registry</span> = Google Drive برای ایمیج‌ها**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• Push = آپلود</span> <br>
<span dir='rtl'>• Pull = دانلود</span> <br>
<span dir='rtl'>• Tag = نسخه</span> <br>
<span dir='rtl'>• Repository = پوشه</span> <br>

</div>

**۳. قانون طلایی:**

> **کد رو یه جا build کن، همه‌جا pull کن.**

<div align='right' dir='rtl'>

<span dir='rtl'>**۴. <span dir='ltr'>Tag</span> ≠ Latest**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• برای production از نسخه‌ی دقیق (`1.0.0`) استفاده کن</span> <br>
<span dir='rtl'>• `latest` قابل پیش‌بینی نیست</span> <br>

</div>

**۵. دو فایل compose:**

<div align='right' dir='rtl'>

<span dir='rtl'>• `compose.yaml` — برای توسعه (<span dir='ltr'>`build:`</span>)</span> <br>
<span dir='rtl'>• `compose.prod.yaml` — برای <span dir='ltr'>production</span> (<span dir='ltr'>`image:`</span>)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۶. <span dir='ltr'>`.env`</span> gitignored:**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• Username و رمزها توی <span dir='ltr'>`.env`</span></span> <br>
<span dir='rtl'>• فقط <span dir='ltr'>`.env.example`</span> توی گیت</span> <br>
<span dir='rtl'>• این الگو همه‌جا کار می‌کنه</span> <br>

</div>

**۷. تست واقعی:**

<div align='right' dir='rtl'>

<span dir='rtl'>• ایمیج‌ها رو حذف کن</span> <br>
<span dir='rtl'>• `compose.prod.yaml up` بزن</span> <br>
<span dir='rtl'>• اگه از <span dir='ltr'>Docker Hub</span> pull کرد و بالا اومد ← **کل چرخه کار می‌کنه** ✅</span> <br>

</div>

### نکته‌ی کلیدی این درس

```text
Registry = پل بین developer و production
```

**بدون Registry:**

<div align='right' dir='rtl'>

<span dir='rtl'>• هر سرور باید ابزار development داشته باشه</span> <br>
<span dir='rtl'>• هر بار build، زمان و منابع هدر می‌ره</span> <br>
<span dir='rtl'>• محیط‌ها ممکنه یکسان نباشن</span> <br>

</div>

**با Registry:**

<div align='right' dir='rtl'>

<span dir='rtl'>• هر سرور فقط Docker لازم داره</span> <br>
<span dir='rtl'>• یه بار build، هزار بار pull</span> <br>
<span dir='rtl'>• محیط‌ها دقیقاً یکسان</span> <br>

</div>

**این ارزشمندترین چیزیه که این درس بهت می‌ده.**

### آنچه در ادامه می‌آید

**درس ۱۷ — URL Shortener (CI/CD با GitHub Actions)**

یه پروژه‌ی جدید که:

<div align='right' dir='rtl'>

<span dir='rtl'>• کد رو به <span dir='ltr'>GitHub</span> push می‌کنی</span> <br>
<span dir='rtl'>• GitHub Actions **خودکار** build می‌کنه</span> <br>
<span dir='rtl'>• **خودکار** به <span dir='ltr'>Docker Hub</span> push می‌کنه</span> <br>
<span dir='rtl'>• **خودکار** روی سرور deploy می‌کنه</span> <br>

</div>

**یعنی چیزی که توی درس ۱۶ دستی انجام دادی، حالا خودکار می‌شه.**

و بعد از اون:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس ۱۸:** <span dir='ltr'>Portfolio</span> (Deploy به <span dir='ltr'>VPS</span> + <span dir='ltr'>SSL</span> + <span dir='ltr'>Domain</span>)</span> <br>
<span dir='rtl'>• **درس ۱۹:** <span dir='ltr'>Vault</span> (<span dir='ltr'>Security</span>: <span dir='ltr'>Trivy</span>، <span dir='ltr'>Secrets</span>، <span dir='ltr'>Hardening</span>)</span> <br>
<span dir='rtl'>• **درس ۲۰:** <span dir='ltr'>Log Analyzer</span> (Debugging عمیق)</span> <br>
<span dir='rtl'>• **درس ۲۱:** <span dir='ltr'>Cheat Sheet</span> + Docker Templates</span> <br>
<span dir='rtl'>• **درس ۲۲:** <span dir='ltr'>Wrap-up</span> + نقشه‌ی راه</span> <br>

</div>
