<div align='right' dir='rtl'>

[🇬🇧 English](/en/08-docker-compose/README.md)

</div>

# درس ۸: Docker Compose

## 🎯 اهداف این درس

در پایان این درس می‌توانی:

<div align='right' dir="rtl">

<span dir='rtl'>• مفهوم Docker Compose و کاربرد آن را توضیح بدهی.</span> <br>
<span dir='rtl'>• فایل `compose.yaml` بنویسی.</span> <br>
<span dir='rtl'>• چند سرویس را با یک دستور اجرا و متوقف کنی.</span> <br>
<span dir='rtl'>• بین `services`، `networks` و `volumes` تفاوت قائل شوی.</span> <br>
<span dir='rtl'>• متغیرهای محیطی را در Compose تنظیم کنی.</span> <br>
<span dir='rtl'>• لاگ‌ها، وضعیت و پورت‌های سرویس‌ها را بررسی کنی.</span> <br>
<span dir='rtl'>• یک پروژهٔ چندکانتینری شامل وب‌سرور و PostgreSQL اجرا کنی.</span> <br>
<span dir='rtl'>• مشکلات متداول Compose را عیب‌یابی کنی.</span>

</div>

---

<div align='right' dir="rtl">

## <span dir='rtl'>۱. Docker Compose چیست؟</span>

</div>

تا اینجا کانتینرها را با دستورهایی مانند `docker run` اجرا کرده‌ایم.

برای اجرای یک وب‌سرور ساده، دستور زیر کافی است:

```bash
docker run -d --name web -p 8080:80 nginx:alpine
```

اما تصور کن یک پروژهٔ واقعی شامل سرویس‌های زیر باشد:

<p dir='rtl'>
• Backend با Django <br>
• Database با PostgreSQL <br>
• Frontend با JavaScript <br>
• Reverse Proxy با Nginx <br>
• Cache با Redis
</p>

اگر برای هر سرویس دستورات طولانی و جداگانه بنویسی، اجرای پروژه، مدیریت شبکه‌ها، تنظیم Volumeها و انتقال تنظیمات به اعضای دیگر تیم دشوار می‌شود.

<div align='right' dir="rtl">

<span dir='rtl'>**Docker Compose** این کار را ساده‌تر می‌کند.</span>

</div>

<p dir='rtl'>
Compose به تو اجازه می‌دهد سرویس‌های پروژه و تنظیمات مرتبط با آن‌ها را در یک فایل YAML تعریف کنی و سپس با یک دستور آن‌ها را مدیریت کنی.
</p>

برای مثال:

```bash
docker compose up -d
```

این دستور سرویس‌های تعریف‌شده در فایل Compose را ایجاد یا اجرا می‌کند.

برای توقف سرویس‌ها:

```bash
docker compose down
```

### تفاوت Docker و Docker Compose

<div align='right' dir="rtl">

<span dir='rtl'>• **Docker Engine** مسئول ساخت و اجرای کانتینرها، شبکه‌ها و Volumeها است.</span> <br>
<span dir='rtl'>• **Docker Compose** ابزاری برای تعریف و مدیریت برنامه‌های چندسرویسی با استفاده از فایل پیکربندی است.</span>

</div>

<p dir='rtl'>
Compose از Docker Engine برای انجام عملیات استفاده می‌کند.
</p>

---

## ۲. بررسی نصب Docker Compose

در نسخه‌های جدید Compose، Docker Desktop معمولاً از قبل در دسترس است.

نسخهٔ Compose را بررسی کن:

```bash
docker compose version
```

به فاصلهٔ بین `docker` و `compose` توجه کن. در نسخهٔ مدرن از دستور `docker compose` استفاده می‌کنیم، نه دستور قدیمی `docker-compose` که با خط تیره نوشته می‌شد.

اگر دستور بالا اجرا نشد، نصب Docker و در دسترس بودن Compose Plugin را بررسی کن.

---

## ۳. ساختار فایل Compose

<div align='right' dir="rtl">

<span dir='rtl'>Compose معمولاً از فایلی به نام `compose.yaml` استفاده می‌کند.</span>

</div>

یک پروژهٔ ساده می‌تواند چنین ساختاری داشته باشد:

```text
my-project/
├── compose.yaml
└── README.md
```

فایل `compose.yaml` تنظیمات سرویس‌های پروژه را نگه می‌دارد.

### اولین فایل Compose

فایل `compose.yaml` را ایجاد کن و محتوای زیر را در آن قرار بده:

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "8080:80"
```

حالا از داخل پوشهٔ پروژه اجرا کن:

```bash
docker compose up -d
```

مرورگر را باز کن و به آدرس زیر برو:

```text
http://localhost:8080
```

باید صفحهٔ پیش‌فرض Nginx را ببینی.

### توضیح فایل

```yaml
services:
```

بخش اصلی تعریف سرویس‌های برنامه است.

```yaml
web:
```

نام سرویسی است که در Compose تعریف کرده‌ایم. این نام الزاماً همان نام کانتینر نیست.

```yaml
image: nginx:alpine
```

مشخص می‌کند کانتینر از کدام تصویر ساخته شود.

```yaml
ports:
  - "8080:80"
```

پورت ۸۰ کانتینر را روی پورت ۸۰۸۰ میزبان منتشر می‌کند.

در این مثال، پورت روی همهٔ رابط‌های شبکهٔ میزبان منتشر می‌شود؛ اگر فقط دسترسی محلی می‌خواهی، می‌توانی از این نگاشت استفاده کنی:

```yaml
ports:
  - "127.0.0.1:8080:80"
```

این حالت برای آزمایش محلی مناسب‌تر است، چون پورت به رابط loopback میزبان محدود می‌شود.

---

## ۴. دستورات مهم Docker Compose

این دستورات را در پوشه‌ای اجرا کن که فایل `compose.yaml` در آن قرار دارد.

### اجرای سرویس‌ها

```bash
docker compose up
```

برای اجرای پس‌زمینه:

```bash
docker compose up -d
```

گزینهٔ <span dir='ltr'>`-d`</span> به معنی اجرای detached است؛ یعنی ترمینال برای نمایش مداوم لاگ‌ها اشغال نمی‌شود.

### مشاهدهٔ سرویس‌های در حال اجرا

```bash
docker compose ps
```

### مشاهدهٔ لاگ‌ها

```bash
docker compose logs
```

برای دنبال کردن لاگ‌ها:

```bash
docker compose logs -f
```

برای مشاهدهٔ لاگ یک سرویس مشخص:

```bash
docker compose logs -f web
```

برای خروج از حالت دنبال کردن لاگ‌ها، `Ctrl+C` را فشار بده. این کار معمولاً سرویس‌ها را متوقف نمی‌کند.

### توقف سرویس‌ها

```bash
docker compose stop
```

این دستور کانتینرها را متوقف می‌کند، اما آن‌ها را حذف نمی‌کند.

### اجرای دوبارهٔ سرویس‌های متوقف‌شده

```bash
docker compose start
```

### توقف و حذف کانتینرها و شبکه‌های پروژه

```bash
docker compose down
```

به‌طور معمول، `down` کانتینرها و شبکه‌های ایجادشده برای پروژه را حذف می‌کند، اما Named Volumeها را حذف نمی‌کند.

**هشدار:** گزینهٔ <span dir='ltr'>`-v`</span> در دستور `down` می‌تواند Volumeهای مدیریت‌شده توسط Compose را نیز حذف کند. پیش از استفاده، مطمئن شو که داده‌های مهمی در آن‌ها وجود ندارد.

---

## ۵. ساخت پروژهٔ عملی: Nginx و PostgreSQL

حالا پروژه‌ای می‌سازیم که دو سرویس داشته باشد:

<div align='right' dir="rtl">

<span dir='rtl'>• `web`: سرور Nginx</span> <br>
<span dir='rtl'>• `db`: دیتابیس PostgreSQL</span>

</div>

در این مثال، Nginx و PostgreSQL مستقل از یکدیگر اجرا می‌شوند. هدف، یادگیری نحوهٔ تعریف چند سرویس، ایجاد شبکهٔ داخلی و نگهداری داده‌های دیتابیس است.

### ساختار پروژه

```text
compose-demo/
└── compose.yaml
```

### محتوای کامل `compose.yaml`

```yaml
services:
  web:
    image: nginx:alpine
    ports:
      - "127.0.0.1:8080:80"
    restart: unless-stopped

  db:
    image: postgres:16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: local-dev-password
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

volumes:
  postgres_data:
```

**نکتهٔ امنیتی:** رمز عبور بالا فقط برای تمرین محلی است. برای محیط واقعی، رمزها را داخل فایل Compose یا مخزن Git به‌صورت ثابت قرار نده. از روش مناسب مدیریت Secret و تنظیمات محیطی امن استفاده کن.

### اجرای پروژه

در پوشهٔ `compose-demo` اجرا کن:

```bash
docker compose up -d
```

وضعیت سرویس‌ها را ببین:

```bash
docker compose ps
```

لاگ‌ها را بررسی کن:

```bash
docker compose logs
```

برای بررسی فقط PostgreSQL:

```bash
docker compose logs db
```

حالا Nginx از طریق آدرس زیر در دسترس است:

```text
http://127.0.0.1:8080
```

<div align='right' dir="rtl">

### <span dir='rtl'>Compose چه چیزهایی ساخته است؟</span>

</div>

با اجرای فایل بالا، Compose منابع لازم را مدیریت می‌کند:

<div align='right' dir="rtl">

<span dir='rtl'>• کانتینر مربوط به سرویس `web`</span> <br>
<span dir='rtl'>• کانتینر مربوط به سرویس `db`</span> <br>
<span dir='rtl'>• شبکهٔ پیش‌فرض پروژه</span> <br>
<span dir='rtl'>• Volume به نام `postgres_data`</span>

</div>

<p dir='rtl'>
Compose معمولاً نام منابع را با پیشوند نام پروژه مشخص می‌کند. نام دقیق منابع می‌تواند به نام پوشه یا گزینه‌های تنظیم نام پروژه بستگی داشته باشد.
</p>

---

## ۶. ارتباط سرویس‌ها در شبکهٔ Compose

به‌طور پیش‌فرض، Compose برای پروژه یک شبکه ایجاد می‌کند و سرویس‌های آن را به آن متصل می‌کند.

بنابراین سرویس‌ها می‌توانند از نام سرویس برای ارتباط با یکدیگر استفاده کنند.

در مثال بالا، اگر برنامه‌ای داخل یک کانتینر دیگر بخواهد به PostgreSQL متصل شود، تنظیمات اتصال معمولاً چنین است:

```text
Host: db
Port: 5432
Database: appdb
Username: appuser
```

نکتهٔ کلیدی این است که **نام سرویس `db` نام میزبان شبکه‌ای برای دسترسی به PostgreSQL است**.

در این مثال نیازی نیست پورت ۵۴۳۲ را روی میزبان منتشر کنیم. سرویس‌های داخل شبکهٔ Compose می‌توانند به پورت داخلی دیتابیس دسترسی داشته باشند.

اگر بخواهیم پورت PostgreSQL را برای ابزارهایی که روی میزبان اجرا می‌شوند منتشر کنیم، می‌توانیم این تنظیم را به سرویس `db` اضافه کنیم:

```yaml
ports:
  - "127.0.0.1:5432:5432"
```

اما این کار را فقط وقتی انجام بده که واقعاً به اتصال از میزبان نیاز داری.

اگر پورت ۵۴۳۲ میزبان قبلاً اشغال شده باشد، باید پورت میزبان دیگری انتخاب کنی.

### یک نکتهٔ مهم دربارهٔ آمادگی سرویس

اجرای کانتینر دیتابیس به این معنی نیست که دیتابیس بلافاصله آمادهٔ پذیرش اتصال است.

اگر Backend به دیتابیس وابسته باشد، باید وضعیت آمادگی دیتابیس را هم در نظر بگیریم. در ادامه با Healthcheck و `depends_on` آشنا می‌شویم.

---

## ۷. تفاوت `depends_on` و آمادگی واقعی سرویس

فرض کن Backend به PostgreSQL نیاز دارد.

می‌توانی وابستگی سرویس‌ها را این‌طور تعریف کنی:

```yaml
services:
  db:
    image: postgres:16

  backend:
    image: my-backend:latest
    depends_on:
      - db
```

این تنظیم ترتیب راه‌اندازی سرویس‌ها را مشخص می‌کند، اما به‌تنهایی تضمین نمی‌کند که PostgreSQL کاملاً آمادهٔ پذیرش اتصال باشد.

برای این کار می‌توان از Healthcheck و شرط `service_healthy` استفاده کرد.

نمونهٔ کامل‌تر:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: appdb
      POSTGRES_USER: appuser
      POSTGRES_PASSWORD: local-dev-password
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U appuser -d appdb"]
      interval: 5s
      timeout: 3s
      retries: 10
      start_period: 10s

  backend:
    image: my-backend:latest
    depends_on:
      db:
        condition: service_healthy
```

در این مثال، Compose پیش از شروع Backend منتظر می‌ماند تا Healthcheck دیتابیس موفق شود.

این نمونه برای توضیح مفهوم است؛ تصویر `my-backend:latest` باید واقعاً وجود داشته باشد و برنامهٔ داخل آن باید بتواند به دیتابیس متصل شود.

همچنین، حتی با Healthcheck، برنامه باید بتواند خطاهای موقت اتصال را مدیریت کند.

---

## ۸. مدیریت متغیرهای محیطی

در Compose می‌توان متغیرهای محیطی را با `environment` تنظیم کرد.

مثال:

```yaml
services:
  backend:
    image: my-backend:latest
    environment:
      APP_ENV: development
      DB_HOST: db
      DB_PORT: "5432"
      DB_NAME: appdb
```

در این مثال، تنظیمات اتصال دیتابیس از طریق متغیرهای محیطی به برنامه منتقل می‌شوند.

اما توجه کن که Docker Compose این متغیرها را خودکار به تنظیمات برنامه تبدیل نمی‌کند. کد برنامه باید این متغیرها را بخواند و از آن‌ها استفاده کند.

### استفاده از فایل <span dir='ltr'>`.env`</span>

می‌توانی مقادیر را در فایل <span dir='ltr'>`.env`</span> قرار بدهی.

برای مثال، فایل <span dir='ltr'>`.env`</span>:

```dotenv
POSTGRES_DB=appdb
POSTGRES_USER=appuser
POSTGRES_PASSWORD=local-dev-password
```

سپس در `compose.yaml` بنویسی:

```yaml
services:
  db:
    image: postgres:16
    environment:
      POSTGRES_DB: ${POSTGRES_DB}
      POSTGRES_USER: ${POSTGRES_USER}
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
```

<div align='right' dir="rtl">

<span dir='rtl'>Compose معمولاً از فایل <span dir='ltr'>`.env`</span> موجود در پوشهٔ پروژه برای جایگزینی متغیرها در فایل پیکربندی استفاده می‌کند.</span>

</div>

**هشدار مهم:** فایل <span dir='ltr'>`.env`</span> به‌خودی‌خود یک Secret Store امن نیست. اگر رمز واقعی در آن قرار دارد، فایل را به مخزن Git اضافه نکن و برای محیط عملیاتی از روش مناسب مدیریت Secret استفاده کن.

در مخزن پروژه، معمولاً بهتر است یک فایل <span dir='ltr'>`.env.example`</span> با مقادیر نمونه و بدون اطلاعات محرمانه قرار بدهی.

---

## ۹. اجرای مجدد و بازسازی سرویس‌ها

اگر تنظیمات `compose.yaml` را تغییر دادی، می‌توانی از دستور زیر استفاده کنی:

```bash
docker compose up -d
```

<p dir='rtl'>
Compose تغییرات را بررسی می‌کند و در صورت نیاز کانتینرها را دوباره ایجاد می‌کند.
</p>

اگر تصویر Backend را تغییر داده‌ای و می‌خواهی آن را بسازی:

```bash
docker compose up -d --build
```

این دستور برای سرویس‌هایی که در Compose با `build` تعریف شده‌اند، فرایند ساخت تصویر را اجرا می‌کند.

مثال:

```yaml
services:
  backend:
    build:
      context: ./backend
    ports:
      - "127.0.0.1:8000:8000"
```

در این حالت Compose از Dockerfile موجود در پوشهٔ `backend` برای ساخت تصویر استفاده می‌کند.

اگر سرویس فقط با `image` تعریف شده باشد و `build` نداشته باشد، گزینهٔ <span dir='ltr'>`--build`</span> برای آن سرویس تصویری از منبع محلی نمی‌سازد.

---

## ۱۰. دستورات کاربردی بیشتر

### نمایش کانفیگ نهایی Compose

```bash
docker compose config
```

این دستور پیکربندی را بررسی و نسخهٔ پردازش‌شدهٔ آن را نمایش می‌دهد.

خروجی ممکن است مقادیر متغیرهای محیطی را نیز در بر داشته باشد؛ بنابراین قبل از انتشار خروجی، اطلاعات محرمانه را بررسی کن.

### مشاهدهٔ تصاویر

```bash
docker compose images
```

### اجرای یک دستور داخل سرویس

برای مثال:

```bash
docker compose exec db psql -U appuser -d appdb
```

این دستور یک نشست تعاملی `psql` داخل کانتینر سرویس `db` باز می‌کند، به شرط آنکه دیتابیس آماده باشد.

برای خروج از محیط `psql`:

```sql
\q
```

### اجرای یک دستور موقت

اگر نمی‌خواهی وارد کانتینر در حال اجرا شوی، می‌توانی از `run` استفاده کنی:

```bash
docker compose run --rm db psql -U appuser -d appdb -c "SELECT current_database();"
```

این دستور یک کانتینر موقت برای سرویس `db` اجرا می‌کند و پس از اتمام آن را حذف می‌کند. در این مثال، کانتینر موقت به همان تنظیمات سرویس دسترسی دارد و فرمان `psql` را اجرا می‌کند.

---

## ۱۱. مشکلات رایج Docker Compose

### مشکل اول: پورت از قبل اشغال شده است

اگر خطایی مشابه `port is already allocated` دیدی، احتمالاً پورت میزبان توسط سرویس دیگری استفاده می‌شود.

راه‌حل:

<p dir='rtl'>
• سرویس متداخل را متوقف کن؛ یا <br>
• پورت میزبان دیگری انتخاب کن.
</p>

مثلاً:

```yaml
ports:
  - "127.0.0.1:8081:80"
```

### مشکل دوم: سرویس دیتابیس اجرا نمی‌شود

لاگ‌ها را بررسی کن:

```bash
docker compose logs db
```

همچنین وضعیت سرویس را ببین:

```bash
docker compose ps
```

### مشکل سوم: Backend نمی‌تواند دیتابیس را پیدا کند

بررسی کن:

<div align='right' dir="rtl">

<span dir='rtl'>• هر دو سرویس در شبکهٔ مناسب پروژه باشند.</span> <br>
<span dir='rtl'>• مقدار `DB_HOST` نام سرویس دیتابیس، مثلاً `db`، باشد.</span> <br>
<span dir='rtl'>• پورت داخلی صحیح، مثلاً `5432`، استفاده شود.</span> <br>
<span dir='rtl'>• دیتابیس آمادهٔ پذیرش اتصال باشد.</span>

</div>

از `localhost` برای اتصال Backend به کانتینر جداگانهٔ دیتابیس استفاده نکن.

### مشکل چهارم: تغییر رمز عبور در Compose اثر نمی‌کند

تصاویر رسمی دیتابیس معمولاً متغیرهایی مانند `POSTGRES_PASSWORD` را هنگام مقداردهی اولیهٔ یک پوشهٔ دادهٔ خالی پردازش می‌کنند.

اگر Volume قبلاً مقداردهی شده باشد، تغییر متغیرهای محیطی لزوماً رمز عبور کاربر موجود را تغییر نمی‌دهد.

در این شرایط، باید فرایند تغییر رمز عبور دیتابیس را به‌درستی انجام بده؛ صرفاً حذف و ساخت دوبارهٔ کانتینر ممکن است کافی نباشد، چون داده‌ها در Volume باقی می‌مانند.

**داده‌های مهم را برای حل این مشکل بدون نسخهٔ پشتیبان حذف نکن.**

### مشکل پنجم: تغییرات فایل Compose اعمال نمی‌شوند

ابتدا کانفیگ را بررسی کن:

```bash
docker compose config
```

سپس وضعیت سرویس‌ها را ببین:

```bash
docker compose ps
```

اگر تصویر برنامه تغییر کرده است و سرویس از `build` استفاده می‌کند:

```bash
docker compose up -d --build
```

### مشکل ششم: از دست رفتن داده‌ها

حذف کانتینر لزوماً به معنی حذف Volume نیست.

از طرف دیگر، اجرای این دستور می‌تواند Volumeهای مدیریت‌شده توسط Compose را حذف کند:

```bash
docker compose down -v
```

این دستور را بدون بررسی وضعیت داده‌ها اجرا نکن.

---

## ۱۲. تمرین‌های درس

### تمرین ۱: اجرای Nginx

یک فایل Compose بساز که Nginx را روی پورت محلی `8080` اجرا کند.

هدف: آشنایی با `services`، `image` و `ports`.

### تمرین ۲: اجرای PostgreSQL

یک سرویس PostgreSQL تعریف کن که دیتابیس، کاربر و رمز عبور آزمایشی داشته باشد و داده‌ها را در Named Volume نگهداری کند.

هدف: یادگیری `environment` و `volumes`.

### تمرین ۳: ارتباط داخلی

دو سرویس تعریف کن که در شبکهٔ پیش‌فرض پروژه با یکدیگر ارتباط داشته باشند.

هدف: درک DNS داخلی Compose و استفاده از نام سرویس.

### تمرین ۴: بررسی لاگ‌ها

سرویس‌ها را اجرا کن و لاگ هر سرویس را جداگانه بررسی کن.

هدف: استفاده از `docker compose logs`.

### تمرین ۵: متوقف کردن پروژه

پروژه را با `docker compose down` متوقف و حذف کن. سپس بررسی کن که آیا داده‌های Volume همچنان باقی مانده‌اند یا نه.

هدف: درک تفاوت چرخهٔ عمر کانتینر و Volume.

---

## ۱۳. چالش نهایی

یک پروژه با ساختار زیر ایجاد کن:

```text
compose-final/
├── compose.yaml
└── .env.example
```

شرایط پروژه:

<div align='right' dir="rtl">

<span dir='rtl'>1. سرویس `web` از تصویر Nginx استفاده کند.</span> <br>
<span dir='rtl'>2. وب‌سرور از طریق پورت محلی `8080` قابل دسترسی باشد.</span> <br>
<span dir='rtl'>3. سرویس `db` از PostgreSQL استفاده کند.</span> <br>
<span dir='rtl'>4. PostgreSQL از Named Volume استفاده کند.</span> <br>
<span dir='rtl'>5. پورت دیتابیس بدون نیاز واقعی روی میزبان منتشر نشود.</span> <br>
<span dir='rtl'>6. اطلاعات اتصال از متغیرهای محیطی دریافت شوند.</span> <br>
<span dir='rtl'>7. بتوانی سرویس‌ها را با `docker compose up -d` اجرا کنی.</span> <br>
<span dir='rtl'>8. بتوانی لاگ‌ها و وضعیت سرویس‌ها را بررسی کنی.</span> <br>
<span dir='rtl'>9. بتوانی پروژه را با `docker compose down` متوقف و منابع معمول آن را حذف کنی، بدون آنکه Volume داده‌ها را ناخواسته حذف کنی.</span>

</div>

### معیارهای موفقیت

<div align='right' dir="rtl">

<span dir='rtl'>• فایل Compose معتبر باشد.</span> <br>
<span dir='rtl'>• سرویس‌ها با یک دستور اجرا شوند.</span> <br>
<span dir='rtl'>• وب‌سرور از میزبان قابل دسترسی باشد.</span> <br>
<span dir='rtl'>• PostgreSQL داده‌ها را در Volume نگهداری کند.</span> <br>
<span dir='rtl'>• پورت دیتابیس بدون نیاز منتشر نشده باشد.</span> <br>
<span dir='rtl'>• تفاوت `stop`، `down` و `down -v` را توضیح بدهی.</span>

</div>

---

## ۱۴. پاک‌سازی محیط تمرین

در پوشهٔ پروژه اجرا کن:

```bash
docker compose down
```

این دستور معمولاً کانتینرها و شبکهٔ پیش‌فرض پروژه را حذف می‌کند، اما Named Volume تعریف‌شده را نگه می‌دارد.

اگر می‌خواهی داده‌های آزمایشی را هم حذف کنی، ابتدا مطمئن شو که دیگر به آن‌ها نیاز نداری. سپس می‌توانی از دستور زیر استفاده کنی:

```bash
docker compose down -v
```

**هشدار:** این دستور می‌تواند داده‌های ذخیره‌شده در Volumeهای مدیریت‌شده توسط Compose را حذف کند.

---

## ۱۵. جمع‌بندی

در این درس یاد گرفتی:

<div align='right' dir="rtl">

<span dir='rtl'>• Docker Compose برای مدیریت برنامه‌های چندسرویسی استفاده می‌شود.</span> <br>
<span dir='rtl'>• تنظیمات سرویس‌ها در فایل `compose.yaml` تعریف می‌شوند.</span> <br>
<span dir='rtl'>• `docker compose up -d` سرویس‌ها را در پس‌زمینه اجرا می‌کند.</span> <br>
<span dir='rtl'>• `docker compose ps` وضعیت سرویس‌ها را نمایش می‌دهد.</span> <br>
<span dir='rtl'>• `docker compose logs` برای بررسی لاگ‌ها استفاده می‌شود.</span> <br>
<span dir='rtl'>• `docker compose down` کانتینرها و شبکه‌های پروژه را معمولاً حذف می‌کند.</span> <br>
<span dir='rtl'>• Named Volume برای نگهداری داده‌ها خارج از چرخهٔ عمر کانتینر کاربرد دارد.</span> <br>
<span dir='rtl'>• سرویس‌ها در شبکهٔ پروژه می‌توانند از نام سرویس برای ارتباط استفاده کنند.</span> <br>
<span dir='rtl'>• اجرای کانتینر با آماده بودن برنامه یکسان نیست.</span> <br>
<span dir='rtl'>• مدیریت رمزها و داده‌های پایدار باید با دقت انجام شود.</span>

</div>

**اصل طلایی:** زیرساخت پروژه را تا جای ممکن در یک فایل Compose قابل تکرار تعریف کن، پورت‌ها را فقط در صورت نیاز منتشر کن و داده‌های مهم را در Volume مناسب نگه دار.

در درس بعدی یک پروژهٔ واقعی‌تر می‌سازیم و مفاهیم Docker را وارد فرایند توسعهٔ یک برنامهٔ کاربردی می‌کنیم.
