<div align='right' dir='rtl'>

[🇬🇧 English](/en/02-installation/README.md)

</div>

# جلسه ۲ — نصب Docker روی Windows، Linux و macOS

## مقدمه

در جلسه قبل یاد گرفتیم Docker چیست، چرا به وجود آمده و چه تفاوتی با Virtual Machine دارد.

حالا وقت آن رسیده که Docker را روی سیستم خودمان نصب کنیم.

در این جلسه Docker را روی سه سیستم‌عامل اصلی نصب خواهیم کرد:

<p dir='rtl'>
• Windows <br>
• Linux <br>
• macOS
</p>

در پایان جلسه باید بتوانیم با اطمینان بگوییم:

<div align='right' dir='rtl'>

> <span dir='rtl'>Docker روی سیستم من نصب شده و به‌درستی کار می‌کند.</span>

</div>

---

# قبل از شروع

برای یادگیری Docker به سیستم بسیار قدرتمندی نیاز نداریم، اما باید چند نکته را در نظر داشته باشیم.

در این دوره بیشتر مثال‌ها بر پایه Linux Containers خواهند بود.

اگر از Windows استفاده می‌کنید، Docker Desktop معمولاً از WSL 2 به عنوان Backend استفاده می‌کند.

اگر از macOS استفاده می‌کنید، Docker Desktop محیط مورد نیاز اجرای Containerها را فراهم می‌کند.

اگر از Linux استفاده می‌کنید، می‌توانیم Docker Engine را مستقیماً روی سیستم نصب کنیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Docker Desktop چیست؟</span>

</div>

اگر از Windows یا macOS استفاده می‌کنید، احتمالاً نام Docker Desktop را خواهید دید.

<p dir='rtl'>
Docker Desktop یک برنامه برای اجرای Docker روی سیستم‌های دسکتاپ است و اجزای مورد نیاز برای کار با Docker را در اختیار شما قرار می‌دهد.
</p>

به صورت ساده:

```text
Docker Desktop
│
├── Docker Engine
├── Docker CLI
├── Docker Compose
├── Docker Buildx
└── Desktop Integration
```

بنابراین Docker Desktop را نباید با خود Docker به عنوان یک مفهوم اشتباه بگیریم.

<p dir='rtl'>
Docker Engine موتور اجرای Containerها است و Docker Desktop مجموعه‌ای است که استفاده از Docker را روی سیستم‌های دسکتاپ ساده‌تر می‌کند.
</p>

---

# بخش اول — نصب Docker روی Windows

## پیش‌نیازها

برای Docker Desktop روی Windows باید سیستم شما شرایط مورد نیاز نسخه فعلی Docker Desktop را داشته باشد.

<p dir='rtl'>
Docker Desktop برای Windows از Backendهای مختلفی پشتیبانی می‌کند، اما WSL 2 گزینه پیش‌فرض و پیشنهادی برای بیشتر کاربران است.
</p>

در حال حاضر Docker برای WSL 2 حداقل نسخه WSL `2.1.5` را اعلام کرده و توصیه می‌کند از آخرین نسخه WSL استفاده شود.

همچنین برای اجرای WSL 2، پشتیبانی Virtualization در BIOS/UEFI سیستم باید فعال باشد.

<p dir='rtl'>
Docker Desktop روی نسخه‌های پشتیبانی‌شده Windows 10 و Windows 11 اجرا می‌شود.
</p>

برای جزئیات دقیق نسخه‌های پشتیبانی‌شده همیشه مستندات رسمی Docker را بررسی کنید.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>WSL چیست؟</span>

</div>

<p dir='rtl'>
WSL مخفف:
</p>

```text
Windows Subsystem for Linux
```

است.

<p dir='rtl'>
WSL به شما اجازه می‌دهد محیط Linux را در Windows اجرا کنید.
</p>

در نسخه دوم یعنی WSL 2، یک Linux Kernel واقعی در اختیار محیط WSL قرار می‌گیرد.

<p dir='rtl'>
Docker Desktop می‌تواند از WSL 2 برای اجرای Linux Containers استفاده کند.
</p>

به صورت ساده:

```text
Windows
│
└── WSL 2
    │
    └── Linux Kernel
         │
         └── Docker
              │
              ├── Container
              ├── Container
              └── Container
```

---

# بررسی WSL

<p dir='rtl'>
PowerShell یا Windows Terminal را باز کنید و دستور زیر را اجرا کنید:
</p>

```powershell
wsl --version
```

اگر WSL نصب شده باشد، اطلاعات نسخه آن نمایش داده می‌شود.

اگر WSL نصب نشده باشد، می‌توانیم آن را با دستور زیر نصب کنیم:

```powershell
wsl --install
```

ممکن است Windows از شما بخواهد سیستم را Restart کنید.

بعد از Restart، دوباره وضعیت WSL را بررسی کنید:

```powershell
wsl --version
```

برای به‌روزرسانی WSL نیز می‌توانیم از:

```powershell
wsl --update
```

استفاده کنیم.

> نکته: دستورهای WSL ممکن است بسته به نسخه Windows و سیاست‌های سازمانی سیستم متفاوت باشند. در صورت تفاوت، مستندات رسمی Microsoft و Docker را بررسی کنید.

---

# نصب Docker Desktop

ابتدا Docker Desktop را از وب‌سایت رسمی Docker دریافت کنید.

پس از دانلود Installer، فایل نصب را اجرا کنید.

در فرآیند نصب، Docker گزینه‌های مختلفی را در اختیار شما قرار می‌دهد.

برای بیشتر کاربران، استفاده از WSL 2 انتخاب مناسبی است.

پس از پایان نصب، Docker Desktop را اجرا کنید.

ممکن است اولین اجرای Docker کمی بیشتر طول بکشد.

---

# بررسی Docker Desktop

پس از اجرای Docker Desktop، باید صبر کنیم تا Docker آماده کار شود.

سپس Windows Terminal یا PowerShell را باز کنید.

دستور زیر را اجرا کنید:

```powershell
docker version
```

اگر Docker به درستی نصب شده باشد، اطلاعات مربوط به Docker Client و Server نمایش داده خواهد شد.

---

# بررسی Docker با Hello World

حالا به مهم‌ترین تست نصب Docker می‌رسیم.

دستور زیر را اجرا کنید:

```powershell
docker run hello-world
```

<div align='right' dir='rtl'>

<span dir='rtl'>Docker ابتدا بررسی می‌کند که Image مربوط به `hello-world` روی سیستم وجود دارد یا خیر.</span>

</div>

اگر Image وجود نداشته باشد، Docker آن را از Registry دریافت می‌کند.

سپس یک Container از روی آن Image ایجاد و اجرا می‌شود.

در نهایت پیامی برای تأیید موفقیت‌آمیز بودن اجرای Docker نمایش داده می‌شود.

اگر این مرحله با موفقیت انجام شد:

```text
Docker is working!
```

---

# یک نکته مهم درباره Windows

اگر از Docker Desktop با WSL 2 استفاده می‌کنید، لازم نیست Docker Engine را به صورت جداگانه داخل یک توزیع WSL نصب کنید.

نصب Docker Engine جداگانه داخل WSL می‌تواند باعث ایجاد تداخل شود.

در حالت استاندارد:

```text
Windows
│
├── WSL 2
│
└── Docker Desktop
      │
      └── Docker Engine
```

استفاده می‌کنیم.

---

# بخش دوم — نصب Docker روی Linux

<p dir='rtl'>
Linux تجربه متفاوتی دارد.
</p>

در Linux می‌توان Docker Engine را مستقیماً نصب کرد.

در این دوره برای آموزش نصب، Ubuntu را به عنوان نمونه اصلی انتخاب می‌کنیم.

دلیل انتخاب Ubuntu این است که یکی از رایج‌ترین محیط‌ها برای توسعه و Deployment است.

---

# بررسی نسخه Ubuntu

ابتدا نسخه Ubuntu را بررسی کنید:

```bash
cat /etc/os-release
```

یا:

```bash
lsb_release -a
```

---

# حذف نسخه‌های قدیمی و متعارض

اگر قبلاً Docker را از repository سیستم نصب کرده باشید، ممکن است بعضی Packageها با نسخه رسمی Docker تداخل داشته باشند.

برای نمونه Packageهایی مانند:

```text
docker.io
docker-compose
docker-compose-v2
docker-doc
docker-buildx
podman-docker
containerd
runc
```

ممکن است نیاز به بررسی یا حذف داشته باشند.

> اگر Docker از قبل روی سیستم شما نصب است، قبل از حذف Packageها مطمئن شوید Containerها، Imageها و Volumeهای مهمی ندارید که به آن‌ها نیاز دارید.

---

# اضافه کردن Repository رسمی Docker

ابتدا Packageهای مورد نیاز را نصب می‌کنیم:

```bash
sudo apt update
sudo apt install ca-certificates curl
```

سپس محل نگهداری کلیدهای Repository را ایجاد می‌کنیم:

```bash
sudo install -m 0755 -d /etc/apt/keyrings
```

کلید رسمی Docker را دریافت می‌کنیم:

```bash
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
```

دسترسی خواندن کلید را تنظیم می‌کنیم:

```bash
sudo chmod a+r /etc/apt/keyrings/docker.asc
```

اکنون Repository رسمی Docker را اضافه می‌کنیم:

```bash
sudo tee /etc/apt/sources.list.d/docker.sources <<EOF
Types: deb
URIs: https://download.docker.com/linux/ubuntu
Suites: $(. /etc/os-release && echo "${UBUNTU_CODENAME:-$VERSION_CODENAME}")
Components: stable
Architectures: $(dpkg --print-architecture)
Signed-By: /etc/apt/keyrings/docker.asc
EOF
```

سپس:

```bash
sudo apt update
```

---

# نصب Docker Engine

اکنون Packageهای اصلی Docker را نصب می‌کنیم:

```bash
sudo apt install docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
```

این دستور اجزای اصلی زیر را نصب می‌کند:

<p dir='rtl'>
• Docker Engine <br>
• Docker CLI <br>
• containerd <br>
• Buildx <br>
• Docker Compose Plugin
</p>

---

# بررسی وضعیت Docker

پس از نصب، وضعیت Docker را بررسی کنید:

```bash
sudo systemctl status docker
```

اگر Docker فعال باشد، باید وضعیت سرویس را به صورت `active` مشاهده کنید.

اگر سرویس اجرا نشده بود:

```bash
sudo systemctl start docker
```

برای فعال شدن خودکار Docker هنگام Boot نیز می‌توانیم از:

```bash
sudo systemctl enable docker
```

استفاده کنیم.

---

# اجرای اولین Container در Linux

اکنون:

```bash
sudo docker run hello-world
```

را اجرا کنید.

اگر پیام موفقیت نمایش داده شد، Docker Engine با موفقیت نصب شده است.

---

# چرا در Linux از sudo استفاده کردیم؟

به صورت پیش‌فرض Docker Socket به شکلی تنظیم می‌شود که کاربر عادی ممکن است برای اجرای دستورات Docker به دسترسی بالاتر نیاز داشته باشد.

به همین دلیل در مثال‌های اولیه ممکن است دستور را به صورت زیر اجرا کنیم:

```bash
sudo docker ps
```

اما استفاده دائمی از `sudo` چندان راحت نیست.

در ادامه دوره یاد می‌گیریم چگونه کاربر خودمان را به گروه `docker` اضافه کنیم.

> نکته امنیتی: عضویت در گروه `docker` عملاً سطح دسترسی بالایی روی سیستم ایجاد می‌کند. بنابراین این کار را بدون درک پیامدهای امنیتی انجام ندهید.

فعلاً استفاده از `sudo` برای آموزش اولیه کاملاً قابل قبول است.

---

# بخش سوم — نصب Docker روی macOS

اگر از Mac استفاده می‌کنید، مسیر نصب بسیار ساده‌تر است.

<p dir='rtl'>
Docker برای Docker Desktop ،macOS  را ارائه می‌کند.
</p>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>Apple Silicon یا Intel؟</span>

</div>

<p dir='rtl'>
Macها ممکن است از دو معماری اصلی استفاده کنند:
</p>

```text
Apple Silicon
├── M1
├── M2
├── M3
├── M4
└── ...
```

یا:

```text
Intel
```

بنابراین هنگام دریافت Docker Desktop باید نسخه متناسب با معماری سیستم خود را انتخاب کنید.

---

# تشخیص معماری Mac

<p dir='rtl'>
Terminal را باز کنید:
</p>

```bash
uname -m
```

اگر خروجی:

```text
arm64
```

باشد، سیستم شما Apple Silicon است.

اگر خروجی:

```text
x86_64
```

باشد، سیستم شما Intel است.

---

# پیش‌نیازهای macOS

<p dir='rtl'>
Docker Desktop روی نسخه‌های پشتیبانی‌شده macOS اجرا می‌شود.
</p>

<p dir='rtl'>
Docker در حال حاضر نسخه فعلی و دو نسخه اصلی قبلی macOS را پشتیبانی می‌کند.
</p>

همچنین حداقل 4GB RAM برای Docker Desktop مورد نیاز است.

برای Macهای Apple Silicon، استفاده از Rosetta 2 برای بعضی ابزارهای اختیاری مرتبط با Darwin/AMD64 همچنان می‌تواند مفید باشد.

در صورت نیاز:

```bash
softwareupdate --install-rosetta
```

را اجرا کنید.

---

# نصب Docker Desktop روی macOS

<p dir='rtl'>
Docker Desktop را از وب‌سایت رسمی Docker دانلود کنید.
</p>

نسخه مناسب معماری سیستم خود را انتخاب کنید.

پس از دانلود:

<p dir='rtl'>
1. فایل Docker Desktop را باز کنید. <br>
2. Docker را به Applications منتقل کنید. <br>
3. Docker Desktop را اجرا کنید. <br>
4. مراحل اولیه Setup را تکمیل کنید.
</p>

بعد از اجرا، Terminal را باز کنید.

---

# بررسی Docker در macOS

ابتدا:

```bash
docker version
```

سپس:

```bash
docker run hello-world
```

اگر پیام موفقیت نمایش داده شد، Docker با موفقیت نصب شده است.

---

# بررسی نهایی در هر سه سیستم‌عامل

فرقی نمی‌کند از چه سیستم‌عاملی استفاده می‌کنید.

در پایان این جلسه باید بتوانید:

```bash
docker version
```

و:

```bash
docker run hello-world
```

را با موفقیت اجرا کنید.

---

# دستورهای پایه برای بررسی نصب

اکنون چند دستور مفید را یاد بگیریم.

## بررسی نسخه Docker

```bash
docker --version
```

مثلاً:

```text
Docker version ...
```

---

## اطلاعات کامل Docker

```bash
docker info
```

این دستور اطلاعات بیشتری درباره Docker Engine، Containerها، Imageها و تنظیمات سیستم نمایش می‌دهد.

---

## نمایش Containerهای در حال اجرا

```bash
docker ps
```

---

## نمایش تمام Containerها

```bash
docker ps -a
```

---

## نمایش Imageها

```bash
docker images
```

---

# تفاوت `docker ps` و `docker ps -a`

این تفاوت بسیار مهم است.

دستور:

```bash
docker ps
```

فقط Containerهای در حال اجرا را نمایش می‌دهد.

اما:

```bash
docker ps -a
```

تمام Containerها را نمایش می‌دهد؛ حتی Containerهایی که متوقف شده‌اند.

مثلاً بعد از اجرای:

```bash
docker run hello-world
```

ممکن است Container پس از نمایش پیام، متوقف شود.

بنابراین:

```bash
docker ps
```

ممکن است چیزی نمایش ندهد.

اما:

```bash
docker ps -a
```

<div align='right' dir='rtl'>

<span dir='rtl'>Container مربوط به `hello-world` را نمایش خواهد داد.</span>

</div>

---

# مشکلات رایج

## مشکل اول — `docker` command not found

اگر چیزی شبیه این مشاهده کردید:

```text
docker: command not found
```

ممکن است Docker نصب نشده باشد یا CLI در PATH سیستم قرار نگرفته باشد.

ابتدا Docker Desktop را اجرا کنید یا در Linux نصب Docker Engine را بررسی کنید.

---

# مشکل دوم — Docker Desktop اجرا نمی‌شود

در Windows موارد زیر را بررسی کنید:

<p dir='rtl'>
• WSL نصب باشد. <br>
• WSL به‌روز باشد. <br>
• Virtualization در BIOS/UEFI فعال باشد. <br>
• نسخه Windows پشتیبانی شود.
</p>

برای بررسی WSL:

```powershell
wsl --version
```

---

# مشکل سوم — Permission Denied در Linux

اگر بدون `sudo` با خطایی شبیه Permission Denied مواجه شدید:

```bash
docker ps
```

ابتدا تست کنید:

```bash
sudo docker ps
```

اگر دستور دوم کار کرد، مشکل مربوط به Permission کاربر است.

در جلسات بعدی این موضوع را به شکل کامل‌تر بررسی خواهیم کرد.

---

# مشکل چهارم — Docker daemon is not running

اگر خطایی درباره Docker daemon دریافت کردید، ابتدا وضعیت سرویس را بررسی کنید:

```bash
sudo systemctl status docker
```

در صورت نیاز:

```bash
sudo systemctl start docker
```

---

# مشکل پنجم — `hello-world` دانلود نمی‌شود

اجرای:

```bash
docker run hello-world
```

به دسترسی Docker به Registry نیاز دارد.

بنابراین مشکلات زیر می‌توانند باعث شکست عملیات شوند:

<p dir='rtl'>
• اتصال اینترنت <br>
• DNS <br>
• Proxy <br>
• Firewall <br>
• محدودیت شبکه
</p>

در این حالت ابتدا مطمئن شوید سیستم شما به اینترنت دسترسی دارد.

---

# یک نکته مهم درباره Docker Hub

وقتی اجرا می‌کنیم:

```bash
docker run hello-world
```

اگر Image روی سیستم وجود نداشته باشد، Docker آن را از یک Registry دریافت می‌کند.

در حالت معمول این Registry همان Docker Hub است.

فعلاً لازم نیست درباره Registryها عمیق شویم.

در جلسات بعدی دقیقاً بررسی خواهیم کرد:

```text
Docker Client
      │
      ▼
Docker Engine
      │
      ▼
Registry
      │
      ▼
Image
      │
      ▼
Container
```

---

# تمرین عملی

اکنون نوبت شماست.

## تمرین ۱

نسخه Docker را بررسی کنید:

```bash
docker --version
```

---

## تمرین ۲

اطلاعات Docker را مشاهده کنید:

```bash
docker info
```

---

## تمرین ۳

اولین Container خود را اجرا کنید:

```bash
docker run hello-world
```

---

## تمرین ۴

<p dir='rtl'>
Container ایجاد شده را پیدا کنید:
</p>

```bash
docker ps -a
```

---

## تمرین ۵

<p dir='rtl'>
Imageهای موجود روی سیستم را مشاهده کنید:
</p>

```bash
docker images
```

---

# چالش جلسه

بدون استفاده از این آموزش، سعی کنید به این سؤال پاسخ دهید:

> چرا بعد از اجرای `docker run hello-world` ممکن است چیزی در خروجی `docker ps` مشاهده نکنیم، اما همان Container در `docker ps -a` وجود داشته باشد؟

اگر پاسخ این سؤال را فهمیده باشید، اولین مفهوم مهم مربوط به چرخه حیات Containerها را یاد گرفته‌اید.

---

# جمع‌بندی

در این جلسه یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• Docker Desktop چیست.</span> <br>
<span dir='rtl'>• WSL 2 چیست.</span> <br>
<span dir='rtl'>• Docker را روی Windows نصب کنیم.</span> <br>
<span dir='rtl'>• Docker Engine را روی Ubuntu نصب کنیم.</span> <br>
<span dir='rtl'>• Docker Desktop را روی macOS نصب کنیم.</span> <br>
<span dir='rtl'>• معماری Apple Silicon و Intel را تشخیص دهیم.</span> <br>
<span dir='rtl'>• نصب Docker را با `docker version` بررسی کنیم.</span> <br>
<span dir='rtl'>• اولین Container خود را با `hello-world` اجرا کنیم.</span> <br>
<span dir='rtl'>• Containerهای فعال و متوقف‌شده را مشاهده کنیم.</span> <br>
<span dir='rtl'>• Imageهای موجود را مشاهده کنیم.</span> <br>
<span dir='rtl'>• با خطاهای رایج نصب Docker آشنا شویم.</span>

</div>

در جلسه بعد وارد بخش عملی Docker می‌شویم و اولین Containerهای واقعی خود را اجرا خواهیم کرد.

آن‌جا دیگر فقط Docker را نصب نمی‌کنیم؛ بلکه شروع می‌کنیم به **کار کردن با Docker**.

