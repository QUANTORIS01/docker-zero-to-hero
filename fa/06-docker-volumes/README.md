<div align='right' dir='rtl'>

[🇬🇧 English](/en/06-docker-volumes/README.md)

</div>

# جلسه ۶ — Docker Volumes و داده‌های پایدار

## مقدمه

در جلسات گذشته یاد گرفتیم چگونه Docker Image بسازیم و از روی آن Container اجرا کنیم.

اما یک سؤال مهم وجود دارد:

**اگر یک Container را حذف کنیم، چه اتفاقی برای داده‌هایی که داخل آن ذخیره کرده‌ایم می‌افتد؟**

برای پاسخ به این سؤال باید با مفهوم Persistent Data آشنا شویم.

فرض کنید یک برنامه داریم که اطلاعات کاربران را در یک فایل ذخیره می‌کند. اگر این فایل فقط داخل لایه قابل‌نوشتن Container قرار داشته باشد، حذف Container می‌تواند باعث از دست رفتن آن اطلاعات شود.

برای حل این مشکل، Docker مکانیزم‌هایی برای ذخیره‌سازی داده‌ها خارج از چرخه عمر Container فراهم می‌کند.

در این جلسه با مهم‌ترین آن‌ها آشنا می‌شویم.

---

## 🎯 اهداف جلسه

در پایان این جلسه باید بتوانید:

<p dir='rtl'>
• مفهوم Persistent Data را توضیح دهید. <br>
• تفاوت Image، Container و Volume را درک کنید. <br>
• یک Docker Volume بسازید. <br>
• Volume را به Container متصل کنید. <br>
• داده‌ها را پس از حذف Container حفظ کنید. <br>
• از Named Volume استفاده کنید. <br>
• تفاوت Volume و Bind Mount را توضیح دهید. <br>
• فایل‌های Host را داخل Container در دسترس قرار دهید. <br>
• داده‌های PostgreSQL را در Volume ذخیره کنید. <br>
• Volumeهای بلااستفاده را شناسایی و مدیریت کنید. <br>
• مشکلات رایج ذخیره‌سازی در Docker را بررسی کنید.
</p>

---

# ۱. مشکل ذخیره داده داخل Container

فرض کنید یک Container ایجاد می‌کنیم:

```bash
docker run -d --name data-demo nginx
```

اکنون می‌توانیم وارد Container شویم:

```bash
docker exec -it data-demo sh
```

داخل Container، یک فایل آزمایشی ایجاد کنید:

```sh
echo "Important data" > /tmp/example.txt
```

سپس از Container خارج شوید:

```sh
exit
```

حالا Container را حذف کنید:

```bash
docker rm -f data-demo
```

با حذف Container، لایه قابل‌نوشتن آن نیز حذف می‌شود.

در نتیجه فایل آزمایشی که فقط داخل همان لایه ذخیره شده بود، دیگر در دسترس نیست.

**نکته:** حذف Container به معنی حذف خودکار همه Volumeهای متصل به آن نیست. رفتار دقیق به نوع Mount و نحوه ایجاد و حذف Container بستگی دارد.

---

# ۲. چرا به Persistent Data نیاز داریم؟

در بسیاری از برنامه‌ها، داده‌ها باید بیشتر از عمر یک Container باقی بمانند.

برای مثال:

<p dir='rtl'>
• اطلاعات کاربران <br>
• سفارش‌های فروشگاه <br>
• فایل‌های آپلودشده <br>
• داده‌های دیتابیس <br>
• گزارش‌های برنامه <br>
• فایل‌های پردازش‌شده
</p>

چرخه عمر Container ممکن است کوتاه باشد، اما داده‌های برنامه باید برای مدت طولانی‌تری باقی بمانند.

به همین دلیل باید محل ذخیره داده‌ها را از چرخه عمر Container جدا کنیم.

---

# ۳. روش‌های اصلی ذخیره‌سازی در Docker

سه مفهوم مهم در ذخیره‌سازی داده‌ها عبارت‌اند از:

<div align='center' dir='rtl'>

| روش            | کاربرد                                                  |
| -------------- | ------------------------------------------------------- |
| Writable Layer |<span dir='rtl'> تغییرات ایجادشده در لایه قابل‌نوشتن Container</span>           |
| Volume         |<span dir='rtl'> ذخیره داده‌ها با مدیریت Docker و مستقل از عمر Container</span> |
| Bind Mount     |<span dir='rtl'> اتصال یک مسیر مشخص از Host به Container</span>                 |

</div>

نمای کلی:

```text
Docker Host
│
├── Container
│   └── Writable Layer
│
├── Docker Volume
│   └── Persistent Data
│
└── Host Directory
    └── Bind Mount
```

در ادامه هر روش را بررسی می‌کنیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>۴. Docker Volume چیست؟</span>

</div>

<p dir='rtl'>
Volume مکانیزمی برای ذخیره داده‌هاست که Docker آن را مدیریت می‌کند.
</p>

برخلاف لایه قابل‌نوشتن Container، Volume می‌تواند مستقل از Container باقی بماند.

نمای مفهومی:

```text
             Docker Host
                  │
          ┌───────┴────────┐
          │                │
      Container          Volume
          │                │
          └───────┬────────┘
                  │
          Application Data
```

وقتی یک Volume را به Container متصل می‌کنیم، برنامه می‌تواند داده‌های خود را در آن ذخیره کند.

اگر Container حذف شود و Volume را نیز حذف نکنیم، داده‌ها باقی می‌مانند.

---

# ۵. ساخت اولین Volume

برای ایجاد یک Volume با نام `app-data`:

```bash
docker volume create app-data
```

اگر دستور موفق باشد، نام Volume نمایش داده می‌شود:

```text
app-data
```

حالا می‌توانیم Volumeهای موجود را مشاهده کنیم:

```bash
docker volume ls
```

خروجی ممکن است شبیه این باشد:

```text
DRIVER    VOLUME NAME
local     app-data
```

در اینجا:

<div align='right' dir='rtl'>

<span dir='rtl'>• `DRIVER` نوع Driver ذخیره‌سازی را نشان می‌دهد.</span> <br>
<span dir='rtl'>• `VOLUME NAME` نام Volume را نشان می‌دهد.</span>

</div>

در این دوره بیشتر از Driver پیش‌فرض `local` استفاده می‌کنیم.

---

# ۶. بررسی اطلاعات Volume

برای مشاهده اطلاعات Volume:

```bash
docker volume inspect app-data
```

خروجی JSON شامل اطلاعاتی مانند موارد زیر است:

<p dir='rtl'>
• نام Volume <br>
• Driver <br>
• Mountpoint <br>
• تنظیمات Volume
</p>

در بسیاری از نصب‌های Linux، مسیر ذخیره‌سازی Volumeهای محلی زیر شاخه‌ای از این مسیر است:

```text
/var/lib/docker/volumes/
```

اما این مسیر را نباید در همه محیط‌ها ثابت فرض کنیم.

برای مشاهده مسیر واقعی Volume از خروجی `docker volume inspect` استفاده کنید.

در Docker Desktop، داده‌های Docker ممکن است داخل محیط مجازی مدیریت‌شده ذخیره شوند و مسیرها با نصب مستقیم Linux متفاوت باشند.

---

# ۷. اتصال Volume به Container

حالا می‌خواهیم Volume ساخته‌شده را به یک Container متصل کنیم.

دستور:

```bash
docker run -d \
  --name volume-demo \
  --mount source=app-data,target=/usr/share/nginx/html \
  -p 8080:80 \
  nginx
```

در این دستور:

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`--name volume-demo`</span> نام Container را مشخص می‌کند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`--mount`</span> یک Mount تعریف می‌کند.</span> <br>
<span dir='rtl'>• `source=app-data` نام Volume را مشخص می‌کند.</span> <br>
<span dir='rtl'>• `target=/usr/share/nginx/html`</span> مسیر داخل Container را مشخص می‌کند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`-p 8080:80`</span> پورت برنامه را منتشر می‌کند.</span>

</div>

به این ترتیب، مسیر زیر داخل Container به Volume متصل می‌شود:

```text
/usr/share/nginx/html
```

هر داده‌ای که برنامه در این مسیر ذخیره کند، در Volume قرار می‌گیرد.

**نکته مهم:** اتصال Volume به یک مسیر غیرخالی در Image، به‌طور معمول باعث می‌شود فایل‌های موجود در آن مسیر از دید Container پوشانده شوند. در برخی حالت‌ها Docker می‌تواند فایل‌های موجود را هنگام اولین اتصال Volume کپی کند، مگر اینکه این رفتار غیرفعال شده باشد. بنابراین برای مسیرهای مهم برنامه، قبل از اتصال Volume باید رفتار آن را بشناسیم.

---

# ۸. آزمایش ماندگاری داده‌ها

حالا بررسی می‌کنیم که آیا داده‌ها پس از حذف Container باقی می‌مانند یا خیر.

ابتدا Container را اجرا کنید:

```bash
docker run -d \
  --name volume-test \
  --mount source=app-data,target=/data \
  nginx
```

یک فایل داخل Volume ایجاد کنید:

```bash
docker exec volume-test sh -c 'echo "Persistent Docker data" > /data/message.txt'
```

حالا محتوای فایل را بخوانید:

```bash
docker exec volume-test cat /data/message.txt
```

خروجی:

```text
Persistent Docker data
```

<p dir='rtl'>
Container را حذف کنید:
</p>

```bash
docker rm -f volume-test
```

حالا یک Container جدید با همان Volume بسازید:

```bash
docker run -d \
  --name volume-test-2 \
  --mount source=app-data,target=/data \
  nginx
```

محتوای فایل را بررسی کنید:

```bash
docker exec volume-test-2 cat /data/message.txt
```

خروجی همچنان باید این باشد:

```text
Persistent Docker data
```

**نتیجه:** داده‌ها با حذف Container از بین نرفتند، چون در Volume ذخیره شده بودند.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>۹. Named Volume چیست؟</span>

</div>

در مثال قبلی از Volumeای با نام مشخص استفاده کردیم:

```text
app-data
```

به چنین Volumeای معمولاً Named Volume می‌گوییم.

مزایای آن:

<p dir='rtl'>
• نام مشخص و قابل‌فهم دارد. <br>
• می‌توان آن را بین Containerهای مختلف استفاده کرد. <br>
• مدیریت آن ساده‌تر است. <br>
• از عمر Container مستقل است. <br>
• برای ذخیره داده‌های دیتابیس مناسب است.
</p>

ساخت Volume:

```bash
docker volume create postgres-data
```

استفاده از آن:

```bash
docker run -d \
  --name postgres-db \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  -e POSTGRES_PASSWORD=local-dev-password \
  postgres:16
```

این مثال برای یادگیری است. در محیط واقعی نباید رمز عبور را مستقیماً داخل دستورهای قابل‌ذخیره در تاریخچه Shell یا فایل‌های عمومی قرار دهید. همچنین مسیر ذخیره‌سازی باید با نسخه و تنظیمات Image دیتابیس سازگار باشد.

در ادامه یک مثال کامل‌تر از PostgreSQL را بررسی می‌کنیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>۱۰. Anonymous Volume چیست؟</span>

</div>

<p dir='rtl'>
Docker می‌تواند Volumeهایی بدون نام انتخابی کاربر ایجاد کند.
</p>

برای مثال:

```bash
docker run -d \
  --name anonymous-volume-demo \
  -v /data \
  nginx
```

در این حالت Docker یک Volume با نام تولیدشده ایجاد می‌کند و آن را به مسیر <span dir='ltr'>`/data`</span> متصل می‌کند.

مشاهده Volumeها:

```bash
docker volume ls
```

<p dir='rtl'>
Anonymous Volumeها در برخی سناریوها مفید هستند، اما مدیریت و شناسایی آن‌ها نسبت به Named Volume دشوارتر است.
</p>

برای داده‌های مهم برنامه، معمولاً Named Volume انتخاب روشن‌تری است.

**توجه:** حذف Container الزاماً باعث حذف Anonymous Volume نمی‌شود. برای حذف Volumeهای مرتبط با Containerهای حذف‌شده، باید سیاست حذف و دستورهای مورد استفاده را بررسی کنید.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>۱۱. Bind Mount چیست؟</span>

</div>

<p dir='rtl'>
Bind Mount روشی است که به ما اجازه می‌دهد یک مسیر مشخص از Host را به یک مسیر داخل Container متصل کنیم.
</p>

مثلاً ساختار پروژه روی کامپیوتر:

```text
my-project/
├── app.py
└── data/
```

می‌خواهیم پوشه `data` را به مسیر `/app/data` داخل Container متصل کنیم.

با استفاده از <spqan dir='ltr'>`--mount`</span>:

```bash
docker run -d \
  --name bind-demo \
  --mount type=bind,source="$(pwd)/data",target=/app/data \
  python:3.12-slim \
  sleep infinity
```

این دستور برای Shellهای Unix مانند Linux و macOS مناسب است. در Windows باید مسیر Source را مطابق محیط مورد استفاده تنظیم کنید.

حالا اگر فایلی داخل مسیر <span dir='ltr'>`/app/data`</span> ایجاد شود، روی مسیر متصل‌شده در Host نیز قابل مشاهده خواهد بود.

برای آزمایش:

```bash
docker exec bind-demo sh -c 'echo "Hello from Container" > /app/data/message.txt'
```

سپس فایل `message.txt` را داخل پوشه `data` روی Host بررسی کنید.

باید محتوای زیر را ببینید:

```text
Hello from Container
```

برای حذف Container:

```bash
docker rm -f bind-demo
```

فایل ایجادشده در Host باقی می‌ماند، مگر اینکه خودتان آن را حذف کنید.

---

# ۱۲. تفاوت Volume و Bind Mount

این دو مفهوم شبیه هستند، اما یکسان نیستند.

<div align='center' dir='rtl'>

| ویژگی                    | Volume                             | Bind Mount                      |
| ------------------------ | ---------------------------------- | ------------------------------- |
| محل مدیریت داده          | مدیریت‌شده توسط Docker             | مسیر مشخص روی Host              |
| انتخاب مسیر Host         | معمولاً توسط Docker مدیریت می‌شود  | کاربر مسیر را مشخص می‌کند       |
| دسترسی مستقیم به فایل‌ها | بسته به محیط، معمولاً غیرمستقیم‌تر | مستقیماً از مسیر Host           |
| مناسب برای دیتابیس       | بسیار رایج                         | ممکن است، اما نیازمند دقت بیشتر |
| مناسب برای توسعه محلی    | قابل استفاده                       | بسیار رایج                      |
| وابستگی به ساختار Host   | کمتر                               | بیشتر                           |

</div>

### چه زمانی از Volume استفاده کنیم؟

برای مواردی مانند:

<p dir='rtl'>
• داده‌های PostgreSQL <br>
• داده‌های MySQL <br>
• فایل‌های پایدار برنامه <br>
• ذخیره‌سازی مستقل از Container
</p>

### چه زمانی از Bind Mount استفاده کنیم؟

برای مواردی مانند:

<p dir='rtl'>
• توسعه محلی <br>
• اتصال Source Code به Container <br>
• مشاهده فایل‌های تولیدشده توسط برنامه <br>
• ویرایش فایل‌ها روی Host و مشاهده تغییرات داخل Container
</p>

انتخاب نهایی به نیاز پروژه و محیط اجرا بستگی دارد.

---

# ۱۳. دستور کوتاه‌تر با ‎-v

برای Mount کردن Volume می‌توانیم از گزینه <span dir='ltr'>`-v`</span> نیز استفاده کنیم.

مثلاً:

```bash
docker run -d \
  --name volume-short-demo \
  -v app-data:/data \
  nginx
```

در این دستور:

```text
app-data:/data
```

یعنی Volume با نام `app-data` به مسیر <span dir='ltr'>`/data`</span> داخل Container متصل شود.

برای Bind Mount نیز می‌توان از <span dir='ltr'>`-v`</span> استفاده کرد:

```bash
docker run -d \
  --name bind-short-demo \
  -v "$(pwd)/data:/data" \
  nginx
```

با این حال، گزینه <span dir='ltr'>`--mount`</span> معمولاً ساختار واضح‌تری دارد و برای آموزش و خوانایی بیشتر توصیه می‌شود.

---

# ۱۴. پروژه عملی: ذخیره داده PostgreSQL

اکنون یک دیتابیس PostgreSQL را با Volume اجرا می‌کنیم.

ابتدا Volume را بسازید:

```bash
docker volume create postgres-data
```

سپس Container را اجرا کنید:

```bash
docker run -d \
  --name postgres-demo \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=appdb \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  postgres:16
```

این نمونه برای محیط آموزشی و محلی است. در پروژه واقعی باید رمز عبور را با روش امن مدیریت کنید و نسخه Image را مطابق سیاست پروژه انتخاب کنید.

وضعیت Container را بررسی کنید:

```bash
docker ps
```

لاگ‌ها:

```bash
docker logs postgres-demo
```

صبر کنید تا PostgreSQL آماده اتصال شود.

برای بررسی آماده بودن دیتابیس:

```bash
docker exec postgres-demo pg_isready -U appuser -d appdb
```

اگر دیتابیس آماده باشد، خروجی معمولاً شامل پیام `accepting connections` خواهد بود.

---

# ۱۵. آزمایش ماندگاری PostgreSQL

وارد محیط `psql` شوید:

```bash
docker exec -it postgres-demo psql -U appuser -d appdb
```

در محیط PostgreSQL، جدول بسازید:

```sql
CREATE TABLE notes (
    id SERIAL PRIMARY KEY,
    message TEXT NOT NULL
);
```

یک رکورد اضافه کنید:

```sql
INSERT INTO notes (message)
VALUES ('Data survives container replacement');
```

اطلاعات را بخوانید:

```sql
SELECT * FROM notes;
```

سپس از محیط PostgreSQL خارج شوید:

```sql
\q
```

حالا Container را حذف کنید:

```bash
docker rm -f postgres-demo
```

دوباره با همان Container، Volume را بسازید:

```bash
docker run -d \
  --name postgres-demo \
  -e POSTGRES_USER=appuser \
  -e POSTGRES_PASSWORD=local-dev-password \
  -e POSTGRES_DB=appdb \
  --mount source=postgres-data,target=/var/lib/postgresql/data \
  postgres:16
```

پس از آماده شدن دیتابیس، دوباره وارد شوید:

```bash
docker exec -it postgres-demo psql -U appuser -d appdb
```

و اجرا کنید:

```sql
SELECT * FROM notes;
```

رکورد قبلی باید همچنان وجود داشته باشد.

**چرا؟** چون فایل‌های دیتابیس داخل Volume ذخیره شده‌اند، نه صرفاً در لایه قابل‌نوشتن Container.

> نکته عملیاتی: Volume به تنهایی جایگزین Backup نیست. برای حفاظت از داده‌های مهم، باید از دیتابیس Backup بگیرید و بازیابی آن را نیز آزمایش کنید.

---

# ۱۶. مدیریت Volumeها

### مشاهده Volumeها

```bash
docker volume ls
```

### مشاهده اطلاعات Volume

```bash
docker volume inspect postgres-data
```

### حذف Volume

```bash
docker volume rm postgres-data
```

حذف Volume فقط زمانی انجام می‌شود که Docker اجازه دهد؛ معمولاً نباید Volumeای را که Containerای از آن استفاده می‌کند، مستقیماً حذف کرد.

قبل از حذف، Containerهای مرتبط را بررسی کنید.

### مشاهده Containerها

```bash
docker ps -a
```

### حذف Container آزمایشی

```bash
docker rm -f postgres-demo
```

پس از حذف Container، اگر Volume دیگر مورد استفاده نباشد، می‌توان آن را به‌صورت مستقل حذف کرد.

**هشدار:** حذف Volume ممکن است باعث از دست رفتن دائمی داده‌ها شود. پیش از اجرای `docker volume rm` مطمئن شوید داده‌ها دیگر موردنیاز نیستند و در صورت لزوم Backup دارید.

---

# ۱۷. دستور docker volume prune

<p dir='rtl'>
Docker می‌تواند Volumeهای بلااستفاده را پاک‌سازی کند.
</p>

```bash
docker volume prune
```

در نسخه‌های جدید Docker، این دستور به‌صورت پیش‌فرض Volumeهای محلی بلااستفاده را حذف می‌کند و ممکن است برای تأیید، ورودی بخواهد.

برای حذف بدون درخواست تأیید:

```bash
docker volume prune -f
```

از این دستور با احتیاط استفاده کنید؛ Volumeای که در حال حاضر به هیچ Container متصل نیست ممکن است هنوز داده مهمی داشته باشد.

**بلااستفاده بودن از دید Docker به معنی بی‌ارزش بودن داده‌ها نیست.**

---

# ۱۸. بررسی Mountهای یک Container

برای دیدن Mountهای Container:

```bash
docker inspect postgres-demo
```

خروجی شامل بخش `Mounts` است.

برای نمایش فقط اطلاعات Mountها:

```bash
docker inspect --format '{{json .Mounts}}' postgres-demo
```

در این خروجی می‌توانید مواردی مانند Source و Destination را بررسی کنید.

این کار هنگام Debug کردن مشکلات ذخیره‌سازی بسیار مفید است.

---

# ۱۹. مشکلات رایج

## مشکل اول: داده‌ها پس از حذف Container از بین رفته‌اند

علت احتمالی:

داده‌ها در لایه قابل‌نوشتن Container ذخیره شده‌اند و به Volume یا Bind Mount منتقل نشده‌اند.

راه‌حل:

برای داده‌های مهم از Mount مناسب استفاده کنید.

## مشکل دوم: فایل‌ها داخل Container دیده نمی‌شوند

علت احتمالی:

یک Volume یا Bind Mount مسیر موردنظر را پوشانده است.

راه‌حل:

<p dir='rtl'>
Mountهای Container را بررسی کنید:
</p>

```bash
docker inspect <container-name>
```

## مشکل سوم: Permission Denied

علت احتمالی:

کاربر داخل Container مجوز لازم برای نوشتن در مسیر Mountشده را ندارد.

راه‌حل:

<p dir='rtl'>
• مالکیت و مجوزهای فایل‌ها را بررسی کنید. <br>
• کاربر اجراکننده برنامه را بررسی کنید. <br>
• در محیط‌های دارای SELinux، تنظیمات امنیتی Mount را نیز در نظر بگیرید. <br>
• بدون بررسی، مجوزهای دسترسی را به شکل گسترده باز نکنید.
</p>

## مشکل چهارم: Volume حذف نمی‌شود

علت احتمالی:

یک یا چند Container هنوز از Volume استفاده می‌کنند.

راه‌حل:

<p  dir='rtl'>
Containerهای مرتبط را بررسی کنید:
</p>

```bash
docker ps -a
```

## مشکل پنجم: تصور می‌کنیم حذف Container یعنی حذف Volume

این تصور همیشه درست نیست.

<p  dir='rtl'>
Volume چرخه عمر مستقلی از Container دارد. باید حذف Volume را به‌صورت آگاهانه مدیریت کنید.
</p>

---

# ۲۰. تمرین عملی اول

یک Volume با نام `lesson6-data` بسازید:

```bash
docker volume create lesson6-data
```

آن را بررسی کنید:

```bash
docker volume ls
```

سپس:

```bash
docker volume inspect lesson6-data
```

---

# ۲۱. تمرین عملی دوم

یک Container اجرا کنید که Volume را به مسیر <span dir='ltr'>`/data`</span> متصل کند:

```bash
docker run -d \
  --name lesson6-container \
  --mount source=lesson6-data,target=/data \
  nginx
```

فایل ایجاد کنید:

```bash
docker exec lesson6-container sh -c 'echo "Lesson 6 completed" > /data/result.txt'
```

محتوا را بخوانید:

```bash
docker exec lesson6-container cat /data/result.txt
```

حالا Container را حذف کنید:

```bash
docker rm -f lesson6-container
```

دوباره Container را با همان Volume اجرا کنید:

```bash
docker run -d \
  --name lesson6-container-2 \
  --mount source=lesson6-data,target=/data \
  nginx
```

فایل را بخوانید:

```bash
docker exec lesson6-container-2 cat /data/result.txt
```

باید محتوای قبلی را مشاهده کنید.

---

# ۲۲. تمرین عملی سوم

یک پوشه به نام `shared-data` در پروژه خود ایجاد کنید.

داخل آن فایل زیر را بسازید:

```text
message.txt
```

محتوا:

```text
Hello from the Host!
```

حالا پوشه را با استفاده از Bind Mount به Container متصل کنید.

در Linux یا macOS:

```bash
docker run --rm \
  --mount type=bind,source="$(pwd)/shared-data",target=/data \
  alpine:3.21 \
  cat /data/message.txt
```

اگر Docker بتواند Image موردنیاز را دریافت کند، باید خروجی زیر را ببینید:

```text
Hello from the Host!
```

در Windows ممکن است لازم باشد مسیر Source را با توجه به PowerShell، CMD یا محیط Git Bash تنظیم کنید.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>۲۳. Challenge نهایی</span>

</div>

بدون نگاه کردن به مراحل قبلی، سناریوی زیر را پیاده‌سازی کنید:

<div align='right' dir='rtl'>

<span dir='rtl'>1. یک Volume با نام `challenge-data` بسازید.</span> <br>
<span dir='rtl'>2. یک Container از Image مربوط به Nginx اجرا کنید.</span> <br>
<span dir='rtl'>3. Volume را به مسیر <span dir='ltr'>`/data`</span> متصل کنید.</span> <br>
<span dir='rtl'>4. یک فایل با نام `challenge.txt` داخل Volume بسازید.</span> <br>
<span dir='rtl'>5. محتوای فایل را بخوانید.</span> <br>
<span dir='rtl'>6. Container را حذف کنید.</span> <br>
<span dir='rtl'>7. یک Container جدید با همان Volume بسازید.</span> <br>
<span dir='rtl'>8. ثابت کنید فایل هنوز وجود دارد.</span> <br>
<span dir='rtl'>9. اطلاعات Mount را با `docker inspect` بررسی کنید.</span> <br>
<span dir='rtl'>10. در پایان، Containerها و Volume آزمایشی را به‌صورت آگاهانه پاک‌سازی کنید.</span>

</div>

دستورهای اصلی:

```bash
docker volume create
docker volume ls
docker volume inspect
docker run
docker exec
docker inspect
docker rm
docker volume rm
```

### سؤال مفهومی

اگر Container حذف شود، اما Volume باقی بماند، آیا داده‌های داخل Volume باید از بین بروند؟

پاسخ مورد انتظار:

**خیر؛ تا زمانی که خود Volume یا داده‌های آن حذف یا خراب نشده باشند، داده‌ها مستقل از حذف Container باقی می‌مانند.**

---

# ۲۴. جمع‌بندی

در این جلسه یاد گرفتیم:

<p dir='rtl'>
• چرا داده‌های Container ممکن است از بین بروند. <br>
• Persistent Data چیست. <br>
• Docker Volume چیست. <br>
• چگونه Volume بسازیم و بررسی کنیم. <br>
• چگونه Volume را به Container متصل کنیم. <br>
• Named Volume و Anonymous Volume چه تفاوتی دارند. <br>
• Bind Mount چیست. <br>
• چه زمانی از Volume و چه زمانی از Bind Mount استفاده کنیم. <br>
• چگونه داده‌های PostgreSQL را حفظ کنیم. <br>
• چگونه Mountهای Container را بررسی کنیم. <br>
• چگونه Volumeهای بلااستفاده را مدیریت کنیم. <br>
• چرا Backup همچنان ضروری است.
</p>

مهم‌ترین مفهوم این جلسه:

```text
Container Lifecycle ≠ Data Lifecycle
```

یعنی چرخه عمر Container الزاماً با چرخه عمر داده‌های برنامه یکسان نیست.

در جلسه بعد سراغ موضوعی می‌رویم که برای ارتباط بین چند Container ضروری است:

# جلسه ۷ — Docker Networking

در جلسه بعد یاد می‌گیریم Containerها چگونه با یکدیگر ارتباط برقرار می‌کنند، شبکه‌های Docker چه انواعی دارند و چگونه یک برنامه را به دیتابیس متصل کنیم.

