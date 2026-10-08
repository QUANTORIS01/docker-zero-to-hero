
<div align='right' dir='rtl'>

[🇬🇧 English](/en/01-introduction/README.md)

</div>

# جلسه ۱ - داکر چیست؟

## مقدمه

اگر تا به حال برنامه‌ای را روی سیستم خود اجرا کرده باشید، احتمالاً با یکی از این مشکلات مواجه شده‌اید:

<p dir='rtl'>
• برنامه روی سیستم شما اجرا می‌شود اما روی سیستم دوستتان اجرا نمی‌شود. <br>
• برنامه روی ویندوز کار می‌کند اما روی لینوکس با خطا مواجه می‌شود. <br>
• نسخه کتابخانه‌های نصب شده با نسخه مورد نیاز پروژه سازگار نیست. <br>
• پس از نصب یک نرم‌افزار جدید، نرم‌افزارهای دیگر دچار مشکل می‌شوند. <br>
• انتقال پروژه از محیط توسعه به سرور بسیار زمان‌بر و دشوار است.
</p>

سال‌ها توسعه‌دهندگان نرم‌افزار با این مشکلات دست و پنجه نرم می‌کردند. Docker برای حل بخش بزرگی از این چالش‌ها به وجود آمد.

در این جلسه با مفهوم Docker، دلیل ایجاد آن، نحوه کارکرد آن و تفاوت آن با ماشین‌های مجازی آشنا خواهیم شد.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Docker چیست؟</span>

</div>

<p dir='rtl'>
Docker یک پلتفرم متن‌باز (Open Source) برای ساخت، بسته‌بندی، توزیع و اجرای نرم‌افزارها در محیط‌هایی به نام Container است.
</p>

به زبان ساده:

<p dir='rtl'>
Docker به شما اجازه می‌دهد برنامه خود را به همراه تمام وابستگی‌های آن در یک بسته استاندارد قرار دهید تا در هر محیطی دقیقاً به همان شکل اجرا شود.
</p>

فرض کنید یک پروژه Django نوشته‌اید که به موارد زیر نیاز دارد:

<p dir='rtl'>
• Python 3.12 <br>
• Django 5 <br>
• PostgreSQL <br>
• Redis <br>
• چندین کتابخانه دیگر
</p>

به جای اینکه این موارد را روی هر سیستم به صورت دستی نصب کنید، Docker همه آن‌ها را داخل یک Container قرار می‌دهد.

در نتیجه:

> اگر پروژه روی سیستم شما اجرا شود، روی هر سیستم دیگری نیز اجرا خواهد شد.

---

# مشکل روش سنتی

قبل از Docker، توسعه‌دهندگان معمولاً مراحل زیر را انجام می‌دادند:

<p dir='rtl'>
1. نصب سیستم عامل <br>
2. نصب زبان برنامه‌نویسی <br>
3. نصب پایگاه داده <br>
4. نصب کتابخانه‌ها <br>
5. تنظیم متغیرهای محیطی <br>
6. پیکربندی سرویس‌ها
</p>

این فرآیند معمولاً شامل خطاهای فراوانی بود.

مثال:

توسعه‌دهنده اول:

```text
Python 3.10
PostgreSQL 14
```

توسعه‌دهنده دوم:

```text
Python 3.12
PostgreSQL 16
```

در بسیاری از موارد برنامه در یکی از سیستم‌ها اجرا می‌شد اما در دیگری خیر.

این مشکل با جمله معروف زیر شناخته می‌شود:

> It works on my machine.

یعنی:

> روی سیستم من کار می‌کند!

<p dir='rtl'>
Docker دقیقاً برای حل چنین مشکلاتی طراحی شده است.
</p>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Container چیست؟</span>

</div>

برای درک Docker ابتدا باید مفهوم Container را درک کنیم.

<p dir='rtl'>
Container یک محیط ایزوله شده برای اجرای نرم‌افزار است.
</p>

این محیط شامل:

<p dir='rtl'>
• کد برنامه <br>
• کتابخانه‌ها <br>
• تنظیمات <br>
• ابزارهای مورد نیاز
</p>

می‌شود.

هر Container مستقل از Containerهای دیگر عمل می‌کند.

به عنوان مثال:

```text
Container A
└── Python 3.10

Container B
└── Python 3.12
```

هر دو می‌توانند همزمان روی یک سیستم اجرا شوند.

بدون اینکه با یکدیگر تداخلی داشته باشند.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Docker چگونه کار می‌کند؟</span>

</div>

<p dir='rtl'>
Docker بر پایه چند مفهوم اصلی ساخته شده است:
</p>

<div align='right' dir='rtl'>

## Docker Engine

</div>

هسته اصلی Docker است.

مسئول:

<p dir='rtl'>
• ساخت Container <br>
• اجرای Container <br>
• مدیریت منابع
</p>

می‌باشد.

---

<div align='right' dir='rtl'>

## Docker Client

</div>

ابزاری است که شما از طریق آن با Docker ارتباط برقرار می‌کنید.

مثال:

```bash
docker ps
```

یا

```bash
docker run nginx
```

این دستورات توسط Docker Client به Docker Engine ارسال می‌شوند.

---

<div align='right' dir='rtl'>

## Docker Image

</div>

<p dir='rtl'>
Image یک قالب آماده برای ساخت Container است.
</p>

می‌توان آن را مشابه Blueprint یا نقشه ساختمان در نظر گرفت.

مثال:

```bash
nginx
ubuntu
postgres
redis
python
```

همگی Image هستند.

---

<div align='right' dir='rtl'>

## Docker Container

</div>

<p dir='rtl'>
Container نمونه اجرا شده یک Image است.
</p>

مثال:

```bash
docker run nginx
```

در اینجا:

```text
nginx
```

یک Image است.

و Docker از آن یک Container می‌سازد.

---

# تفاوت Image و Container

یکی از رایج‌ترین اشتباهات افراد تازه‌کار، اشتباه گرفتن این دو مفهوم است.

<p dir='rtl'>
Image:
</p>

```text
Recipe
```

<p dir='rtl'>
Container:
</p>

```text
Prepared Food
```

مثال آشپزی:

دستور تهیه پیتزا = Image

پیتزای آماده شده = Container

از یک دستور می‌توان بارها پیتزا تهیه کرد.

از یک Image نیز می‌توان چندین Container ساخت.

---

# ماشین مجازی چیست؟

قبل از Docker، راهکار محبوب برای جداسازی محیط‌ها استفاده از Virtual Machine بود.

ماشین مجازی یک سیستم عامل کامل را شبیه‌سازی می‌کند.

برای مثال:

```text
Host OS
│
├── VM 1 (Ubuntu)
├── VM 2 (Windows)
└── VM 3 (CentOS)
```

هر VM دارای:

<p dir='rtl'>
• Kernel <br>
• Drivers <br>
• Libraries <br>
• Operating System
</p>

مستقل است.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Docker در مقابل Virtual Machine</span>

</div>

<div align='right' dir='rtl'>

## Virtual Machine

</div>

مزایا:

<p dir='rtl'>
• ایزوله‌سازی بسیار بالا <br>
• امکان اجرای سیستم عامل‌های مختلف
</p>

معایب:

<p dir='rtl'>
• مصرف RAM زیاد <br>
• مصرف CPU زیاد <br>
• حجم بالا <br>
• سرعت راه‌اندازی پایین
</p>

---

<div align='right' dir='rtl'>

## Docker

</div>

مزایا:

<p dir='rtl'>
• سبک <br>
• سریع <br>
• مصرف منابع کمتر <br>
• راه‌اندازی در چند ثانیه
</p>

معایب:

<p dir='rtl'>
• سطح ایزوله‌سازی کمتر نسبت به VM <br>
• وابستگی به Kernel سیستم عامل میزبان
</p>

---

# مقایسه تصویری

<p dir='rtl'>
Virtual Machine:
</p>

```text
Application
Application
Application
│
Guest OS
│
Hypervisor
│
Host OS
│
Hardware
```

<p dir='rtl'>
Docker:
</p>

```text
Application
Application
Application
│
Docker Engine
│
Host OS
│
Hardware
```

همان‌طور که مشاهده می‌کنید Docker لایه Guest OS را حذف می‌کند.

در نتیجه بسیار سبک‌تر است.

---

# چرا Docker محبوب شد؟

<p dir='rtl'>
Docker چند مزیت فوق‌العاده دارد:
</p>

## قابلیت حمل (Portability)

یک بار بساز:

```text
Build Once
```

و همه جا اجرا کن:

```text
Run Anywhere
```

---

## سرعت بالا

راه‌اندازی Container معمولاً چند ثانیه زمان می‌برد.

در حالی که ماشین مجازی ممکن است چند دقیقه طول بکشد.

---

## مدیریت آسان وابستگی‌ها

تمام وابستگی‌ها داخل Container قرار می‌گیرند.

بنابراین:

```text
No Dependency Hell
```

---

## مناسب برای تیم‌ها

تمام اعضای تیم از محیط یکسان استفاده می‌کنند.

در نتیجه:

<p dir='rtl'>
• خطاها کمتر می‌شوند. <br>
• توسعه سریع‌تر می‌شود. <br>
• استقرار آسان‌تر می‌شود.
</p>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Docker در دنیای واقعی</span>

</div>

امروزه Docker تقریباً در همه شرکت‌های نرم‌افزاری استفاده می‌شود.

نمونه کاربردها:

<div align='right' dir='rtl'>

### Backend Development

</div>

<p dir='rtl'>
• Django <br>
• Flask <br>
• FastAPI <br>
• Spring Boot <br>
• ASP.NET
</p>

---

<div align='right' dir='rtl'>

### Frontend Development

</div>

<p dir='rtl'>
• React <br>
• Vue <br>
• Angular <br>
• Next.js
</p>

---

<div align='right' dir='rtl'>

### Databases

</div>

<p dir='rtl'>
• PostgreSQL <br>
• MySQL <br>
• MongoDB <br>
• Redis
</p>

---

<div align='right' dir='rtl'>

### DevOps

</div>

<p dir='rtl'>
• CI/CD <br>
• GitHub Actions <br>
• GitLab CI <br>
• Jenkins
</p>

---

<div align='right' dir='rtl'>

### Cloud Platforms

</div>

<p dir='rtl'>
• AWS <br>
• Azure <br>
• Google Cloud
</p>

---

# در این دوره چه چیزی یاد خواهیم گرفت؟

در پایان این دوره قادر خواهید بود:

<p dir='rtl'>
• Docker را حرفه‌ای استفاده کنید. <br>
• Dockerfile بنویسید. <br>
• Docker Compose ایجاد کنید. <br>
• پروژه‌های Django را Dockerize کنید. <br>
• پروژه‌های Node.js را Dockerize کنید. <br>
• PostgreSQL و MongoDB را مدیریت کنید. <br>
• Nginx را پیکربندی کنید. <br>
• پروژه‌های واقعی را Deploy کنید. <br>
• SSL و Domain راه‌اندازی کنید. <br>
• CI/CD پیاده‌سازی کنید.
</p>

---

# تمرین

۱. درباره Docker در وب جستجو کنید.

۲. سه مزیت Docker را یادداشت کنید.

۳. تفاوت Container و Virtual Machine را با زبان خودتان توضیح دهید.

۴. حدس بزنید چرا شرکت‌های بزرگ از Docker استفاده می‌کنند.

---

# خلاصه جلسه

در این جلسه یاد گرفتیم:

<p dir='rtl'>
• Docker چیست. <br>
• چرا Docker ایجاد شد. <br>
• Container چیست. <br>
• Image چیست. <br>
• Docker چگونه کار می‌کند. <br>
• تفاوت Docker و Virtual Machine چیست. <br>
• مزایا و کاربردهای Docker کدام‌اند.
</p>

در جلسه بعد Docker را روی ویندوز، لینوکس و macOS نصب خواهیم کرد و اولین قدم عملی خود را در دنیای Containerها برخواهیم داشت.

