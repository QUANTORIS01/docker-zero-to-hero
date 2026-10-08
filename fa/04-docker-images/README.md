<div align='right' dir='rtl'>

[🇬🇧 English](/en/04-docker-images/README.md)

</div>

# جلسه ۴ — Docker Images

در جلسه قبل با Containerها و چرخه حیات آن‌ها آشنا شدیم.

در این جلسه می‌خواهیم یکی از مهم‌ترین مفاهیم Docker یعنی **Image** را یاد بگیریم.

اگر بخواهیم رابطه‌ی اصلی مفاهیم Docker را خیلی ساده بیان کنیم:

<div align='right'>

**Image → Container**

</div>

یعنی Container معمولاً از روی یک Image ساخته و اجرا می‌شود.

در ادامه یاد می‌گیریم Image چیست، از کجا دریافت می‌شود، چگونه نسخه‌های مختلف آن را مدیریت کنیم و چگونه اطلاعات داخل یک Image را بررسی کنیم.

---

## 🎯 اهداف جلسه

در پایان این جلسه باید بتوانید:

<div align='right' dir='rtl'>

<span dir='rtl'>• مفهوم Docker Image را توضیح دهید.</span> <br>
<span dir='rtl'>• تفاوت Image و Container را درک کنید.</span> <br>
<span dir='rtl'>• Image را از Docker Registry دریافت کنید.</span> <br>
<span dir='rtl'>• Imageهای موجود روی سیستم را مشاهده کنید.</span> <br>
<span dir='rtl'>• Tagهای مختلف Imageها را درک کنید.</span> <br>
<span dir='rtl'>• مفهوم `latest` را بشناسید.</span> <br>
<span dir='rtl'>• اطلاعات یک Image را بررسی کنید.</span> <br>
<span dir='rtl'>• Layerهای یک Image را مشاهده کنید.</span> <br>
<span dir='rtl'>• Imageهای اضافی را حذف کنید.</span> <br>
<span dir='rtl'>• رابطه‌ی بین Image، Container و Registry را توضیح دهید.</span>

</div>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>1. Docker Image چیست؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Docker Image را می‌توان به عنوان یک **الگوی آماده برای ساخت Container** در نظر گرفت.</span>

</div>

یک Image شامل موارد موردنیاز برای اجرای یک برنامه است؛ برای مثال:

<p dir='rtl'>
• فایل‌های سیستم <br>
• کتابخانه‌ها <br>
• dependencyها <br>
• فایل‌های برنامه <br>
• تنظیمات لازم <br>
• metadata
</p>

اما یک Image به خودی خود مثل یک برنامه‌ی در حال اجرا نیست.

برای اجرای یک Image، از آن یک Container ایجاد می‌کنیم.

به صورت ساده:

```text
Docker Image
     │
     │ docker run
     ▼
Docker Container
```

مثلاً Image مربوط به `nginx` را می‌توانیم دریافت کنیم و از روی آن یک Container بسازیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>2. Image در مقابل Container</span>

</div>

یکی از مهم‌ترین تفاوت‌هایی که باید در Docker یاد بگیرید این است:

<div align='center' dir='rtl'>

| Image                                 | Container                              |
| ------------------------------------- | -------------------------------------- |
| <span dir='rtl'>Template است</span>                          | <span dir='rtl'>Instance </span>در حال اجرا یا ایجادشده است   |
| معمولاً immutable در نظر گرفته می‌شود | وضعیت runtime دارد                     |
| برای ساخت Container استفاده می‌شود    | برنامه داخل آن اجرا می‌شود             |
| می‌تواند بین چند Container مشترک باشد | هر Container هویت و وضعیت خودش را دارد |

</div>

مثلاً:

```text
nginx Image
   │
   ├── Container 1
   ├── Container 2
   └── Container 3
```

سه Container مختلف می‌توانند از یک Image یکسان ساخته شوند.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>3. Image از کجا می‌آید؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Imageها معمولاً از یک **Container Registry** دریافت می‌شوند.</span>

</div>

یکی از معروف‌ترین Registryها:

<div align='right' dir='rtl'>

**Docker Hub**

</div>

وقتی می‌نویسیم:

```bash
docker pull nginx
```

<div align='right' dir='rtl'>

<span dir='rtl'>Docker تلاش می‌کند Image مربوط به `nginx` را از Registry پیش‌فرض دریافت کند.</span>

</div>

---

# 4. دریافت یک Image با docker pull

بیایید Image مربوط به Nginx را دریافت کنیم:

```bash
docker pull nginx
```

ممکن است خروجی چیزی شبیه این باشد:

```text
Using default tag: latest
latest: Pulling from library/nginx
...
Status: Downloaded newer image for nginx:latest
```

<p dir='rtl'>
Docker Image ممکن است از چند Layer تشکیل شده باشد.
</p>

به همین دلیل هنگام Pull ممکن است چند Layer مختلف دانلود شوند.

---

# 5. مشاهده Imageهای موجود

برای مشاهده Imageهای موجود روی سیستم:

```bash
docker image ls
```

همچنین دستور قدیمی‌تر زیر نیز وجود دارد:

```bash
docker images
```

نمونه خروجی:

```text
REPOSITORY   TAG       IMAGE ID       CREATED       SIZE
nginx        latest    abc123456789   2 weeks ago   190MB
```

ستون‌های مهم:

<div align='right' dir='rtl'>

### REPOSITORY

</div>

نام Image.

مثلاً:

```text
nginx
```

<div align='right' dir='rtl'>

### TAG

</div>

نسخه یا برچسب Image.

مثلاً:

```text
latest
```

<div align='right' dir='rtl'>

### IMAGE ID

</div>

شناسه Image.

<div align='right' dir='rtl'>

### CREATED

</div>

زمان ایجاد Image.

<div align='right' dir='rtl'>

### SIZE

</div>

حجم Image.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>6. Image Tag چیست؟</span>

</div>

یک Image می‌تواند Tagهای مختلفی داشته باشد.

برای مثال:

```text
nginx:latest
nginx:1.27
nginx:1.27.5
```

ساختار کلی:

```text
repository:tag
```

مثلاً:

```text
nginx:1.27
```

در اینجا:

```text
repository = nginx
tag        = 1.27
```

---

# 7. مفهوم latest

اگر فقط بنویسیم:

```bash
docker pull nginx
```

<div align='right' dir='rtl'>

<span dir='rtl'>Docker به صورت پیش‌فرض Tag مربوط به `latest` را در نظر می‌گیرد:</span>

</div>

```text
nginx:latest
```

اما یک نکته بسیار مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>**`latest` الزاماً به معنی جدیدترین نسخه نرم‌افزار نیست.**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`latest` فقط یک Tag است که Maintainer Image می‌تواند آن را به نسخه‌ای خاص اشاره دهد.</span>

</div>

بنابراین در پروژه‌های جدی، بهتر است نسخه موردنظر را صریح مشخص کنیم.

مثلاً:

```bash
docker pull nginx:1.27
```

به جای:

```bash
docker pull nginx
```

---

# 8. اجرای Image

حالا که Image مربوط به Nginx را داریم، می‌توانیم از روی آن Container بسازیم:

```bash
docker run -d --name my-nginx nginx
```

در اینجا اتفاق زیر رخ می‌دهد:

```text
nginx Image
     │
     │ docker run
     ▼
my-nginx Container
```

اگر Image روی سیستم وجود نداشته باشد، Docker معمولاً ابتدا تلاش می‌کند آن را Pull کند.

---

# 9. یک Image می‌تواند چند Container داشته باشد

فرض کنید Image زیر را داریم:

```text
nginx:latest
```

می‌توانیم چند Container مختلف از آن بسازیم:

```bash
docker run -d --name nginx-1 nginx
```

و:

```bash
docker run -d --name nginx-2 nginx
```

و:

```bash
docker run -d --name nginx-3 nginx
```

در نتیجه:

```text
              nginx:latest
                   │
        ┌──────────┼──────────┐
        ▼          ▼          ▼
     nginx-1    nginx-2    nginx-3
```

هر Container مستقل از دیگری است.

البته اگر بخواهیم هر سه Nginx را روی Host با Portهای قابل دسترسی اجرا کنیم، باید Portهای Host متفاوتی برای آن‌ها انتخاب کنیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>10. Image Layer چیست؟</span>

</div>

<p dir='rtl'>
Docker Image معمولاً از چند Layer تشکیل شده است.
</p>

برای مثال می‌توانیم به شکل مفهومی تصور کنیم:

```text
┌──────────────────────────────┐
│ Application                  │
├──────────────────────────────┤
│ Application Dependencies     │
├──────────────────────────────┤
│ Runtime / Libraries          │
├──────────────────────────────┤
│ Base Image                   │
└──────────────────────────────┘
```

این Layerها یکی از دلایل مهم کارایی Docker هستند.

<p dir='rtl'>
Layerها می‌توانند بین Imageهای مختلف به اشتراک گذاشته شوند.
</p>

بنابراین Docker همیشه مجبور نیست داده‌ای را که قبلاً روی سیستم وجود دارد دوباره دانلود کند.

---

# 11. مشاهده Layerهای Image

برای مشاهده تاریخچه Layerهای یک Image می‌توانیم از این دستور استفاده کنیم:

```bash
docker image history nginx
```

یا:

```bash
docker history nginx
```

خروجی اطلاعاتی درباره Layerهای Image نشان می‌دهد.

مثلاً ممکن است شامل مواردی مانند:

```text
IMAGE        CREATED       CREATED BY
abc123       2 weeks ago   ...
def456       2 weeks ago   ...
```

این دستور در زمان Debug کردن Imageها بسیار مفید است.

---

# 12. بررسی جزئیات Image

برای مشاهده اطلاعات کامل‌تر یک Image:

```bash
docker image inspect nginx
```

خروجی معمولاً شامل اطلاعات JSON مانند موارد زیر است:

<p dir='rtl'>
• Architecture <br>
• OS <br>
• Config <br>
• Entrypoint <br>
• Cmd <br>
• Environment variables <br>
• Root filesystem <br>
• Image metadata
</p>

برای مثال:

```bash
docker image inspect nginx
```

ممکن است خروجی بسیار طولانی باشد.

برای همین در پروژه‌های واقعی می‌توانیم از ابزارهایی مثل <span dir='ltr'>`--format`</span> نیز استفاده کنیم.

مثلاً:

```bash
docker image inspect nginx --format '{{.Os}}'
```

یا:

```bash
docker image inspect nginx --format '{{.Architecture}}'
```

---

# 13. حذف Image

اگر دیگر به Image نیاز نداریم، می‌توانیم آن را حذف کنیم:

```bash
docker image rm nginx
```

یا:

```bash
docker rmi nginx
```

هر دو روش برای حذف Image استفاده می‌شوند.

اما اگر Containerای هنوز به Image وابسته باشد، ممکن است Docker اجازه حذف مستقیم آن را ندهد.

در چنین شرایطی ابتدا باید وضعیت Containerها را بررسی کنیم:

```bash
docker ps -a
```

و در صورت نیاز Container مربوطه را حذف کنیم.

---

# 14. حذف Image با Tag

فرض کنیم این Image را داریم:

```text
nginx:1.27
```

می‌توانیم آن را به صورت مشخص حذف کنیم:

```bash
docker image rm nginx:1.27
```

این روش بهتر از حدس زدن Image موردنظر است، مخصوصاً زمانی که چند نسخه از یک Repository روی سیستم داریم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>15. Image ID چیست؟</span>

</div>

فرض کنیم خروجی `docker image ls` این باشد:

```text
REPOSITORY   TAG       IMAGE ID
nginx        latest    abc123456789
```

می‌توانیم Image را با ID نیز حذف کنیم:

```bash
docker image rm abc123456789
```

البته معمولاً استفاده از نام و Tag خواناتر است:

```bash
docker image rm nginx:latest
```

---

<div align='right' dir='rtl'>

# <span dir='rtl'>16. Registry چیست؟</span>

</div>

<p dir='rtl'>
Registry را می‌توان محلی برای ذخیره و توزیع Imageها در نظر گرفت.
</p>

معماری ساده:

```text
             Docker Registry
                    │
             docker pull
                    │
                    ▼
             Local Machine
                    │
                    │ docker run
                    ▼
                Container
```

<p dir='rtl'>
Registry می‌تواند عمومی یا خصوصی باشد.
</p>

<p dir='rtl'>
Docker Hub یکی از شناخته‌شده‌ترین Registryهاست.
</p>

در پروژه‌های سازمانی ممکن است از Registry خصوصی نیز استفاده شود.

---

# 17. نام کامل Image

وقتی می‌نویسیم:

```bash
docker pull nginx
```

در واقع Docker از یک نام کوتاه استفاده می‌کند.

در Image، Docker Hub  رسمی Nginx در Repository مربوط به:

```text
library/nginx
```

قرار دارد.

بنابراین می‌توانیم شکل کامل‌تر آن را به صورت:

```text
docker.io/library/nginx
```

در نظر بگیریم.

همچنین می‌توانیم Tag را اضافه کنیم:

```text
docker.io/library/nginx:latest
```

این ساختار بعدها هنگام کار با Registryهای خصوصی بسیار مهم خواهد شد.

---

# 18. تفاوت Pull و Run

این دو دستور را با هم اشتباه نگیرید:

```bash
docker pull nginx
```

و:

```bash
docker run nginx
```

<div align='right' dir='rtl'>

### docker pull

</div>

<p dir='rtl'>
Image را دریافت می‌کند.
</p>

```text
Registry
   │
   │ pull
   ▼
Local Image
```

<div align='right' dir='rtl'>

### docker run

</div>

از Image یک Container ایجاد و اجرا می‌کند:

```text
Image
  │
  │ run
  ▼
Container
```

نکته مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>`docker run` اگر Image موردنظر را به صورت Local نداشته باشیم، معمولاً ابتدا آن را Pull می‌کند.</span>

</div>

---

# 19. چرخه اصلی Docker

تا اینجا می‌توانیم چرخه ساده Docker را این‌طور ببینیم:

```text
                Registry
                   │
                   │ docker pull
                   ▼
                 Image
                   │
                   │ docker run
                   ▼
               Container
                   │
                   │
                   ▼
                Running
```

اما در پروژه‌های واقعی یک مرحله بسیار مهم دیگر هم داریم:

```text
Dockerfile
     │
     │ docker build
     ▼
   Image
     │
     │ docker run
     ▼
 Container
```

این قسمت یکی از مهم‌ترین مسیرهای یادگیری Docker است و در جلسه بعد به صورت کامل وارد آن می‌شویم.

---

# 20. تمرین عملی اول

ابتدا Image مربوط به Nginx را دریافت کنید:

```bash
docker pull nginx:latest
```

سپس Imageها را مشاهده کنید:

```bash
docker image ls
```

باید Image مربوط به Nginx را ببینید.

---

# 21. تمرین عملی دوم

اطلاعات Image را بررسی کنید:

```bash
docker image inspect nginx:latest
```

سپس:

```bash
docker image history nginx:latest
```

سعی کنید تفاوت اطلاعات این دو دستور را درک کنید.

### سؤال

کدام دستور برای مشاهده Layerهای Image مناسب‌تر است؟

```text
docker image inspect
```

یا:

```text
docker image history
```

---

# 22. تمرین عملی سوم

یک Container از Nginx ایجاد کنید:

```bash
docker run -d --name image-test nginx:latest
```

سپس:

```bash
docker ps
```

و:

```bash
docker image ls
```

را اجرا کنید.

دقت کنید که:

```text
Image
```

و:

```text
Container
```

دو موجودیت متفاوت هستند.

---

# 23. تمرین عملی چهارم — چند Container از یک Image

سه Container از یک Image بسازید:

```bash
docker run -d --name web-1 nginx:latest
```

```bash
docker run -d --name web-2 nginx:latest
```

```bash
docker run -d --name web-3 nginx:latest
```

سپس:

```bash
docker ps
```

را اجرا کنید.

باید سه Container مختلف مشاهده کنید.

در پایان برای Cleanup:

```bash
docker rm -f web-1 web-2 web-3
```

---

<div align='right' dir='rtl'>

# <span dir='rtl'>24. Challenge</span>

</div>

بدون نگاه کردن به بخش‌های قبلی، این سناریو را انجام دهید:

<div align='right' dir='rtl'>

<span dir='rtl'>1. Image مربوط به Nginx با Tag `1.27` را دریافت کنید.</span> <br>
<span dir='rtl'>2. Imageهای موجود را مشاهده کنید.</span> <br>
<span dir='rtl'>3. اطلاعات Image را بررسی کنید.</span> <br>
<span dir='rtl'>4. تاریخچه Layerهای Image را مشاهده کنید.</span> <br>
<span dir='rtl'>5. یک Container از آن بسازید.</span> <br>
<span dir='rtl'>6. Container را متوقف کنید.</span> <br>
<span dir='rtl'>7. Container را حذف کنید.</span> <br>
<span dir='rtl'>8. در نهایت Image را حذف کنید.</span>

</div>

دستورهای اصلی که احتمالاً نیاز دارید:

```bash
docker pull
docker image ls
docker image inspect
docker image history
docker run
docker stop
docker rm
docker image rm
```

هدف این تمرین این نیست که فقط دستورات را کپی کنید؛ هدف این است که **رابطه بین Image و Container را در عمل درک کنید.**

---

# 25. یک سؤال مهم

فرض کنید Image زیر را داریم:

```text
nginx:latest
```

و سه Container از آن ساخته‌ایم:

```text
web-1
web-2
web-3
```

اگر Container `web-1` را حذف کنیم:

```bash
docker rm web-1
```

آیا Image مربوط به Nginx نیز حذف می‌شود؟

**خیر.**

<p dir='rtl'>
Image و Container موجودیت‌های جداگانه‌ای هستند.
</p>

تا زمانی که Image را به صورت مستقل حذف نکنیم، باقی می‌ماند.

---

# 26. نکته مهم درباره تغییرات داخل Container

یکی از اشتباهات رایج در ابتدای یادگیری Docker این است که فکر کنیم:

> هر تغییری که داخل Container انجام می‌دهیم، بخشی از Image اصلی می‌شود.

این‌طور نیست.

<p dir='rtl'>
Container یک لایه قابل تغییر در زمان اجرا دارد.
</p>

به صورت مفهومی:

```text
        Docker Image
      ┌───────────────┐
      │   Image       │
      │   Layers      │
      └───────────────┘
              │
              ▼
      ┌───────────────┐
      │ Container     │
      │ Writable      │
      │ Layer         │
      └───────────────┘
```

این موضوع در آینده هنگام یادگیری:

<p dir='rtl'>
• Volumes <br>
• Dockerfile <br>
• Container persistence <br>
• Images
</p>

اهمیت زیادی پیدا می‌کند.

---

# 27. جمع‌بندی

در این جلسه یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• Image چیست.</span> <br>
<span dir='rtl'>• Container چیست.</span> <br>
<span dir='rtl'>• تفاوت Image و Container چیست.</span> <br>
<span dir='rtl'>• Registry چیست.</span> <br>
<span dir='rtl'>• چگونه Image دریافت کنیم.</span> <br>
<span dir='rtl'>• چگونه Imageهای موجود را مشاهده کنیم.</span> <br>
<span dir='rtl'>• Tag چیست.</span> <br>
<span dir='rtl'>• `latest` چه معنایی دارد.</span> <br>
<span dir='rtl'>• چگونه Image را Inspect کنیم.</span> <br>
<span dir='rtl'>• چگونه Layerهای Image را مشاهده کنیم.</span> <br>
<span dir='rtl'>• چگونه Image را حذف کنیم.</span> <br>
<span dir='rtl'>• چگونه چند Container از یک Image بسازیم.</span> <br>
<span dir='rtl'>• رابطه Registry، Image و Container چیست.</span>

</div>

مهم‌ترین مفهوم جلسه:

```text
Registry
    │
    │ docker pull
    ▼
  Image
    │
    │ docker run
    ▼
Container
```

و برای ساخت Imageهای اختصاصی:

```text
Dockerfile
    │
    │ docker build
    ▼
  Image
    │
    │ docker run
    ▼
Container
```

در جلسه بعد وارد یکی از مهم‌ترین بخش‌های Docker می‌شویم:

# جلسه ۵ — Dockerfile

در جلسه بعد یاد می‌گیریم چگونه **Image اختصاصی خودمان را بسازیم** و یک پروژه واقعی را داخل Docker قرار دهیم.

