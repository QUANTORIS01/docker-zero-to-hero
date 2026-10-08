<div align='right' dir='rtl'>

[🇬🇧 English](/en/03-first-container/README.md)

</div>

# جلسه ۳ — اولین Container و چرخه حیات آن

## مقدمه

تا اینجا Docker را نصب کرده‌ایم و مطمئن شده‌ایم که به‌درستی کار می‌کند.

اما نصب Docker فقط نقطه شروع است.

در این جلسه قرار است اولین Containerهای واقعی خودمان را اجرا کنیم و با چرخه حیات آن‌ها آشنا شویم.

در پایان این جلسه باید بتوانید:

<p dir='rtl'>
• یک Container اجرا کنید. <br>
• Containerهای در حال اجرا را مشاهده کنید. <br>
• Containerهای متوقف‌شده را پیدا کنید. <br>
• Container را متوقف کنید. <br>
• دوباره آن را اجرا کنید. <br>
• Container را حذف کنید. <br>
• Logهای Container را مشاهده کنید. <br>
• وارد محیط یک Container شوید. <br>
• Container را در Background اجرا کنید. <br>
• مفهوم Port Mapping را درک کنید.
</p>

---

# اولین دستور Docker

بیایید با یک دستور ساده شروع کنیم:

```bash
docker run hello-world
```

اگر Docker به درستی نصب شده باشد، Docker یک پیام موفقیت نمایش خواهد داد.

اما پشت صحنه چه اتفاقی افتاد؟

این دستور در واقع چند مرحله را پشت سر می‌گذارد.

به صورت ساده:

<div align='left' dir='rtl'>

```text
docker run hello-world
        │
        ▼
آیا Image وجود دارد؟
        │
   ┌────┴────┐
   │         │
  Yes        No
   │         │
   │     Pull Image
   │         │
   └────┬────┘
        ▼
Create Container
        │
        ▼
Start Container
        │
        ▼
Execute Process
```

</div>

پس `docker run` فقط یک دستور ساده برای اجرای برنامه نیست.

<p dir='rtl'>
Docker در صورت نیاز Image را دریافت می‌کند، از روی آن Container می‌سازد و سپس Container را اجرا می‌کند.
</p>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>`docker run` دقیقاً چه کاری انجام می‌دهد؟</span>

</div>

به صورت مفهومی:

```text
docker run IMAGE
```

یعنی:

> از این Image یک Container بساز و آن را اجرا کن.

مثلاً:

```bash
docker run nginx
```

در اینجا:

```text
nginx
```

نام Image است.

<p dir='rtl'>
Docker ابتدا بررسی می‌کند که آیا Image موردنظر روی سیستم وجود دارد یا خیر.
</p>

اگر وجود نداشته باشد، آن را از Registry دریافت می‌کند.

سپس Container را می‌سازد و اجرا می‌کند.

---

# اجرای یک Container واقعی

حالا یک Nginx Container اجرا کنیم:

```bash
docker run nginx
```

ممکن است ترمینال شما درگیر اجرای Container شود.

برای توقف آن می‌توانیم:

```text
Ctrl + C
```

را فشار دهیم.

اما روش بهتری برای اجرای سرویس‌هایی مثل Nginx وجود دارد.

---

# اجرای Container در Background

برای اجرای Container در حالت Detached Mode از گزینه `-d` استفاده می‌کنیم:

```bash
docker run -d nginx
```

گزینه:

```text
-d
```

مخفف:

```text
detached
```

است.

یعنی Container در Background اجرا شود.

<p dir='rtl'>
Docker معمولاً شناسه Container را نیز نمایش می‌دهد.
</p>

مثلاً:

```text
a8f3c2...
```

این مقدار Container ID است.

---

# مشاهده Containerهای در حال اجرا

حالا:

```bash
docker ps
```

را اجرا کنید.

احتمالاً چیزی شبیه این مشاهده خواهید کرد:

```text
CONTAINER ID   IMAGE   COMMAND                  CREATED        STATUS        PORTS     NAMES
a8f3c2...      nginx   "/docker-entrypoint..."  5 seconds ago Up 4 seconds  80/tcp    ...
```

البته مقدارهای واقعی روی سیستم شما متفاوت خواهند بود.

---

# ستون‌های `docker ps`

بیایید خروجی را بررسی کنیم.

<div align='right' dir='rtl'>

## CONTAINER ID

</div>

شناسه Container است.

مثلاً:

```text
a8f3c2...
```

این شناسه برای مدیریت Container کاربرد دارد.

---

<div align='right' dir='rtl'>

## IMAGE

</div>

<p dir='rtl'>
Imageای که Container از روی آن ساخته شده است.
</p>

مثلاً:

```text
nginx
```

---

<div align='right' dir='rtl'>

## COMMAND

</div>

فرآیندی که داخل Container اجرا شده است.

---

<div align='right' dir='rtl'>

## CREATED

</div>

مدت زمانی که از ایجاد Container گذشته است.

---

<div align='right' dir='rtl'>

## STATUS

</div>

وضعیت فعلی Container.

مثلاً:

```text
Up 10 seconds
```

یعنی Container در حال اجراست.

---

<div align='right' dir='rtl'>

## PORTS

</div>

<p dir='rtl'>
Portهایی که Container استفاده می‌کند.
</p>

در این مرحله ممکن است چیزی شبیه:

```text
80/tcp
```

ببینید.

بعداً به صورت کامل Port Mapping را بررسی خواهیم کرد.

---

<div align='right' dir='rtl'>

## NAMES

</div>

<p dir='rtl'>
Docker برای Container یک نام تولید می‌کند.
</p>

ممکن است چیزی شبیه این باشد:

```text
beautiful_turing
```

این نام تصادفی است.

اما می‌توانیم خودمان نام Container را تعیین کنیم.

---

# نام‌گذاری Container

برای تعیین نام از گزینه `--name` استفاده می‌کنیم:

```bash
docker run -d --name my-nginx nginx
```

حالا:

```bash
docker ps
```

را اجرا کنید.

در ستون `NAMES` باید ببینید:

```text
my-nginx
```

این موضوع مدیریت Containerها را بسیار ساده‌تر می‌کند.

---

# چرا نام‌گذاری مهم است؟

فرض کنید ۱۰ Container دارید:

```text
my-nginx
django-app
postgres-db
redis-cache
node-api
frontend
backend
nginx-proxy
worker
scheduler
```

مدیریت این Containerها بسیار راحت‌تر از استفاده از IDهای طولانی است.

مثلاً:

```bash
docker stop my-nginx
```

به مراتب خواناتر از:

```bash
docker stop a8f3c2...
```

است.

---

# اجرای Container با نام مشخص

برای تمرین ابتدا Container قبلی را حذف کنید.

```bash
docker rm -f my-nginx
```

سپس:

```bash
docker run -d --name my-nginx nginx
```

حالا:

```bash
docker ps
```

را اجرا کنید.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>`docker ps` در مقابل `docker ps -a`</span>

</div>

این مفهوم بسیار مهم است.

دستور:

```bash
docker ps
```

فقط Containerهای در حال اجرا را نشان می‌دهد.

اما:

```bash
docker ps -a
```

تمام Containerها را نمایش می‌دهد.

یعنی:

```text
docker ps
    ↓
Running Containers

docker ps -a
    ↓
All Containers
```

---

# متوقف کردن Container

برای متوقف کردن Container:

```bash
docker stop my-nginx
```

حالا:

```bash
docker ps
```

را اجرا کنید.

<p dir='rtl'>
Container دیگر نمایش داده نمی‌شود.
</p>

اما آیا Container حذف شده است؟

خیر.

برای مشاهده آن:

```bash
docker ps -a
```

را اجرا کنید.

<p dir='rtl'>
Container را خواهید دید و وضعیت آن احتمالاً چیزی شبیه این خواهد بود:
</p>

```text
Exited (0)
```

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Stop با Remove فرق دارد</span>

</div>

این دو دستور کاملاً متفاوت هستند.

```bash
docker stop my-nginx
```

<p dir='rtl'>
Container را متوقف می‌کند.
</p>

اما:

```bash
docker rm my-nginx
```

<p dir='rtl'>
Container را حذف می‌کند.
</p>

بنابراین:

<div align='center' dir='rtl'>

```text
STOP
↓
Container باقی می‌ماند
```

</div>

ولی:

<div align='center' dir='rtl'>

```text
REMOVE
↓
Container حذف می‌شود
```

</div>

---

# اجرای دوباره Container

اگر Container متوقف شده باشد، می‌توانیم آن را دوباره اجرا کنیم:

```bash
docker start my-nginx
```

حالا:

```bash
docker ps
```

را اجرا کنید.

<p dir='rtl'>
Container دوباره Running خواهد شد.
</p>

---

# تفاوت `docker run` و `docker start`

این تفاوت بسیار مهم است.

<div align='right' dir='rtl'>

## `docker run`

</div>

یک Container جدید ایجاد می‌کند و آن را اجرا می‌کند.

```bash
docker run nginx
```

<div align='right' dir='rtl'>

## `docker start`

</div>

یک Container موجود و متوقف‌شده را دوباره اجرا می‌کند.

```bash
docker start my-nginx
```

بنابراین:

```text
docker run
    ↓
Create + Start

docker start
    ↓
Start Existing Container
```

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Restart کردن Container</span>

</div>

گاهی می‌خواهیم Container را Restart کنیم.

```bash
docker restart my-nginx
```

این دستور Container را متوقف کرده و دوباره اجرا می‌کند.

برای سرویس‌هایی که دچار مشکل موقت شده‌اند، Restart می‌تواند مفید باشد.

---

# حذف Container

برای حذف یک Container متوقف‌شده:

```bash
docker rm my-nginx
```

حالا:

```bash
docker ps -a
```

را اجرا کنید.

<p dir='rtl'>
Container دیگر وجود نخواهد داشت.
</p>

---

# چرا نمی‌توانیم Container در حال اجرا را حذف کنیم؟

اگر Container در حال اجرا باشد و دستور زیر را اجرا کنیم:

```bash
docker rm my-nginx
```

<p dir='rtl'>
Docker معمولاً اجازه حذف آن را نمی‌دهد.
</p>

ابتدا باید آن را متوقف کنیم:

```bash
docker stop my-nginx
```

سپس:

```bash
docker rm my-nginx
```

---

# حذف اجباری

می‌توانیم Container را با گزینه <span dir='ltr'>`-f`</span> به صورت اجباری حذف کنیم:

```bash
docker rm -f my-nginx
```

این دستور Container را متوقف کرده و حذف می‌کند.

اما از استفاده بی‌دلیل از <span dir='ltr'>`-f`</span> خودداری کنید.

---

# مشاهده Logهای Container

<p dir='rtl'>
Containerها معمولاً برنامه‌هایی را اجرا می‌کنند که خروجی تولید می‌کنند.
</p>

برای مشاهده خروجی:

```bash
docker logs my-nginx
```

اگر خروجی زیادی داشته باشیم، می‌توانیم از:

```bash
docker logs --tail 50 my-nginx
```

استفاده کنیم.

یعنی فقط آخرین ۵۰ خط را ببینیم.

---

# دنبال کردن Logها

برای مشاهده Logها به صورت زنده:

```bash
docker logs -f my-nginx
```

گزینه:

```text
-f
```

یعنی:

```text
follow
```

یعنی خروجی جدید را نیز به صورت زنده نمایش بده.

برای خروج از حالت Follow معمولاً:

```text
Ctrl + C
```

را فشار می‌دهیم.

---

# ورود به داخل Container

یکی از قدرتمندترین قابلیت‌های Docker این است که می‌توانیم یک Shell داخل Container اجرا کنیم.

برای مثال:

```bash
docker exec -it my-nginx sh
```

دو گزینه مهم داریم:

```text
-i
```

و:

```text
-t
```

که معمولاً به صورت ترکیبی نوشته می‌شوند:

```text
-it
```

به صورت ساده:

```text
-i
Interactive

-t
TTY
```

حالا اگر Shell اجرا شود، وارد محیط Container شده‌اید.

ممکن است Prompt شما شبیه این شود:

```text
#
```

اکنون دستورهای Linux را امتحان کنید:

```bash
ls
```

یا:

```bash
pwd
```

یا:

```bash
cat /etc/os-release
```

---

# خروج از Container

برای خروج از Shell:

```bash
exit
```

نکته مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>`exit` معمولاً Shellای را که با `docker exec` باز کرده‌اید می‌بندد؛ الزاماً Container را متوقف نمی‌کند.</span>

</div>

بعد از خروج:

```bash
docker ps
```

را اجرا کنید.

<p dir='rtl'>
Container همچنان باید Running باشد.
</p>

---

# چرا `docker exec` مهم است؟

در پروژه‌های واقعی بارها به Container وارد خواهیم شد.

مثلاً در یک پروژه Django ممکن است بخواهیم:

```bash
python manage.py migrate
```

را داخل Container اجرا کنیم.

یا در یک Container مربوط به Node.js بخواهیم فایل‌ها را بررسی کنیم.

بنابراین `docker exec` یکی از ابزارهای روزمره Docker خواهد بود.

---

<div align='right' dir='rtl'>

# Port Mapping

</div>

حالا به یکی از مهم‌ترین مفاهیم Docker می‌رسیم.

فرض کنید Nginx داخل Container روی Port:

```text
80
```

در حال اجراست.

اما اگر Browser سیستم خودمان را باز کنیم، الزاماً نمی‌توانیم به آن دسترسی داشته باشیم.

چرا؟

چون Port داخل Container با Port سیستم Host یکی نیست.

---

# اتصال Port Host به Container

برای اتصال Portها از گزینه `-p` استفاده می‌کنیم:

```bash
docker run -d --name my-nginx -p 8080:80 nginx
```

ساختار:

```text
-p HOST_PORT:CONTAINER_PORT
```

بنابراین:

```text
8080:80
```

یعنی:

```text
Host
8080
  │
  ▼
Container
80
```

---

# دسترسی به Nginx

حالا Browser را باز کنید و به:

```text
http://localhost:8080
```

بروید.

اگر همه چیز درست باشد، صفحه پیش‌فرض Nginx را مشاهده خواهید کرد.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Port Mapping را چگونه تصور کنیم؟</span>

</div>

می‌توانیم آن را این‌گونه تصور کنیم:

```text
Browser
   │
   │ localhost:8080
   ▼
Host Port 8080
   │
   │ Docker Port Mapping
   ▼
Container Port 80
   │
   ▼
Nginx
```

این مفهوم در پروژه‌های آینده بسیار مهم خواهد بود.

مثلاً:

```text
Django
8000

PostgreSQL
5432

Redis
6379

Nginx
80
```

---

# مشاهده Port Mapping

برای مشاهده Port Mapping:

```bash
docker ps
```

ممکن است چیزی شبیه این ببینید:

```text
0.0.0.0:8080->80/tcp
```

یعنی Port `8080` روی Host به Port `80` داخل Container متصل شده است.

---

# حذف Container قبلی

اگر هنوز Container قبلی را دارید:

```bash
docker rm -f my-nginx
```

سپس دوباره:

```bash
docker run -d --name my-nginx -p 8080:80 nginx
```

---

# بررسی وضعیت

اکنون:

```bash
docker ps
```

و:

```bash
docker logs my-nginx
```

را اجرا کنید.

سپس Browser را باز کنید:

```text
http://localhost:8080
```

---

# چرخه حیات Container

تا اینجا با بخش بزرگی از چرخه حیات Container آشنا شدیم.

به صورت ساده:

```text
             docker run
                  │
                  ▼
              Created
                  │
                  ▼
               Running
               /     \
              /       \
     docker stop     docker restart
          │              │
          ▼              │
        Stopped ◄────────┘
          │
          │ docker start
          ▼
       Running
          │
          │ docker rm
          ▼
       Removed
```

البته چرخه واقعی Docker جزئیات بیشتری دارد، اما این مدل برای شروع بسیار مفید است.

---

# یک تمرین کامل

حالا بدون کپی کردن دستورات قبلی، مراحل زیر را انجام دهید.

## مرحله ۱

یک Nginx Container با نام:

```text
training-nginx
```

بسازید.

---

## مرحله ۲

آن را در Background اجرا کنید.

---

## مرحله ۳

<div align='right' dir='rtl'>

<span dir='rtl'>Port `8081` سیستم Host را به Port `80` Container متصل کنید.</span>

</div>

---

## مرحله ۴

با Browser به Nginx دسترسی پیدا کنید.

---

## مرحله ۵

<p  dir='rtl'>
Logهای Container را مشاهده کنید.
</p>

---

## مرحله ۶

وارد Container شوید.

---

## مرحله ۷

داخل Container این دستورها را اجرا کنید:

```bash
pwd
```

و:

```bash
ls
```

و:

```bash
cat /etc/os-release
```

---

## مرحله ۸

از Container خارج شوید.

---

## مرحله ۹

<p dir='rtl'>
Container را Stop کنید.
</p>

---

## مرحله ۱۰

<p dir='rtl'>
Container را دوباره Start کنید.
</p>

---

## مرحله ۱۱

<p dir='rtl'>
Container را حذف کنید.
</p>

---

<div align='right' dir='rtl'>

# Challenge

</div>

حالا یک چالش واقعی‌تر:

یک Container از Nginx اجرا کنید که:

```text
Name:
docker-web

Host Port:
9090

Container Port:
80
```

باشد.

سپس باید بتوانید با Browser به:

```text
http://localhost:9090
```

دسترسی پیدا کنید.

بعد:

```bash
docker ps
```

را اجرا کنید و Port Mapping را از خروجی پیدا کنید.

---

# سؤال مفهومی

به این سؤال پاسخ دهید:

> اگر دو Nginx Container داشته باشیم، آیا هر دو می‌توانند همزمان Port `80` داخل Container را استفاده کنند؟

پاسخ:

بله.

مثلاً:

```text
Container A
Port 80

Container B
Port 80
```

مشکلی ندارد.

اما اگر بخواهیم هر دو را روی Port `8080` سیستم Host منتشر کنیم، با مشکل مواجه خواهیم شد.

مثلاً:

```text
Host 8080 → Container A 80
Host 8080 → Container B 80
```

امکان اختصاص همزمان یک Host Port به دو Container وجود ندارد.

اما می‌توانیم:

```text
Host 8080 → Container A 80

Host 8081 → Container B 80
```

داشته باشیم.

---

# جمع‌بندی

در این جلسه یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• `docker run`</span> <br>
<span dir='rtl'>• `docker ps`</span> <br>
<span dir='rtl'>• `docker ps -a`</span> <br>
<span dir='rtl'>• `docker start`</span> <br>
<span dir='rtl'>• `docker stop`</span> <br>
<span dir='rtl'>• `docker restart`</span> <br>
<span dir='rtl'>• `docker rm`</span> <br>
<span dir='rtl'>• `docker logs`</span> <br>
<span dir='rtl'>• `docker exec`</span> <br>
<span dir='rtl'>• `docker run -d`</span> <br>
<span dir='rtl'>• `--name`</span> <br>
<span dir='rtl'>• `-p`</span> <br>
<span dir='rtl'>• Port Mapping</span> <br>
<span dir='rtl'>• چرخه حیات Container</span>

</div>

همچنین یاد گرفتیم که:

```text
docker run
```

یک Container جدید ایجاد و اجرا می‌کند.

در حالی که:

```text
docker start
```

یک Container موجود را دوباره اجرا می‌کند.

و:

```text
docker stop
```

<p dir='rtl'>
Container را متوقف می‌کند، اما حذف نمی‌کند.
</p>

در نهایت:

```text
docker rm
```

<p dir='rtl'>
Container را حذف می‌کند.
</p>

---

# جلسه بعد

در جلسه بعد وارد یکی از مهم‌ترین مفاهیم Docker می‌شویم:

<div align='right' dir='rtl'>

# Docker Images

</div>

یاد می‌گیریم:

<div align='right' dir='rtl'>

<span dir='rtl'>• Image چیست؟</span> <br>
<span dir='rtl'>• Image از چه چیزی ساخته شده؟</span> <br>
<span dir='rtl'>• Docker Hub چیست؟</span> <br>
<span dir='rtl'>• چگونه Image دریافت کنیم؟</span> <br>
<span dir='rtl'>• `docker pull`</span> <br>
<span dir='rtl'>• `docker images`</span> <br>
<span dir='rtl'>• Image Tag چیست؟</span> <br>
<span dir='rtl'>• `latest` چیست؟</span> <br>
<span dir='rtl'>• چگونه یک Image را حذف کنیم؟</span> <br>
<span dir='rtl'>• چگونه Imageهای مختلف را مدیریت کنیم؟</span>

</div>

بعد از آن کم‌کم وارد ساخت Imageهای خودمان خواهیم شد.

