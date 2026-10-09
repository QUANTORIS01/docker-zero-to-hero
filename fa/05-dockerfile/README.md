<div align='right' dir='rtl'>

[🇬🇧 English](/en/05-dockerfile/README.md)

</div>

# جلسه ۵ — Dockerfile

در جلسات قبلی با Docker Image و Container آشنا شدیم.

تا اینجا بیشتر از Imageهای آماده مانند `nginx` استفاده می‌کردیم.

اما در پروژه‌های واقعی معمولاً به چیزی نیاز داریم که مخصوص خودمان باشد.

مثلاً فرض کنید یک پروژه Python داریم:

```text
my-project/
├── app.py
├── requirements.txt
└── Dockerfile
```

ما می‌خواهیم Docker بداند:

<p dir='rtl'>
1. از چه Imageای شروع کند. <br>
2. فایل‌های پروژه را کجا قرار دهد. <br>
3. dependencyها را چگونه نصب کند. <br>
4. برنامه را چگونه اجرا کند.

</p>

اینجاست که **Dockerfile** وارد می‌شود.

---

# 🎯 اهداف جلسه

در پایان این جلسه باید بتوانید:

<div align='right' dir='rtl'>

<span dir='rtl'>• Dockerfile را توضیح دهید.</span> <br>
<span dir='rtl'>• یک Dockerfile ساده بنویسید.</span> <br>
<span dir='rtl'>• یک Image اختصاصی Build کنید.</span> <br>
<span dir='rtl'>• از Image ساخته‌شده Container اجرا کنید.</span> <br>
<span dir='rtl'>• مفهوم Build Context را درک کنید.</span> <br>
<span dir='rtl'>• دستورات اصلی Dockerfile را بشناسید.</span> <br>
<span dir='rtl'>• تفاوت `RUN`، `CMD` و `ENTRYPOINT` را توضیح دهید.</span> <br>
<span dir='rtl'>• از <span dir='ltr'>`.dockerignore`</span> استفاده کنید.</span> <br>
<span dir='rtl'>• مفهوم Build Cache را درک کنید.</span> <br>
<span dir='rtl'>• خطاهای رایج Dockerfile را پیدا و برطرف کنید.</span>

</div>

---

<div align='right' dir='rtl'>

# <span dir='rtl'>1. Dockerfile چیست؟</span>

</div>

<p dir='rtl'>
Dockerfile یک فایل متنی است که مجموعه‌ای از دستورها برای ساخت یک Docker Image را مشخص می‌کند.
</p>

به زبان ساده:

```text
Dockerfile
     │
     │ docker build
     ▼
 Docker Image
     │
     │ docker run
     ▼
 Docker Container
```

بنابراین Dockerfile خودش Container نیست.

حتی خودش Image هم نیست.

<div align='right' dir='rtl'>

<span dir='rtl'>Dockerfile یک **دستورالعمل برای ساخت Image** است.</span>

</div>

---

# 2. اولین Dockerfile

بیایید ساده‌ترین Dockerfile ممکن را بسازیم.

یک پوشه ایجاد کنید:

```bash
mkdir docker-demo
cd docker-demo
```

سپس فایلی با نام دقیق زیر بسازید:

```text
Dockerfile
```

داخل آن:

```dockerfile
FROM nginx:latest
```

همین!

این Dockerfile می‌گوید:

<div align='right' dir='rtl'>

> <span dir='rtl'>Image من را بر پایه Image مربوط به Nginx بساز.</span>

</div>

---

# 3. چرا FROM؟

هر Dockerfile معمولاً با یک `FROM` شروع می‌شود.

مثلاً:

```dockerfile
FROM nginx:latest
```

یا:

```dockerfile
FROM python:3.12
```

یا:

```dockerfile
FROM node:22
```

یا:

```dockerfile
FROM ubuntu:24.04
```

<div align='right' dir='rtl'>

<span dir='rtl'>`FROM` مشخص می‌کند که Image ما از چه Base Imageای ساخته شود.</span>

</div>

---

# 4. ساخت Image

حالا که Dockerfile را داریم، باید Image بسازیم.

در همان پوشه اجرا کنید:

```bash
docker build -t my-nginx .
```

بیایید این دستور را تجزیه کنیم:

```text
docker build
```

یعنی یک Image بساز.

```text
-t my-nginx
```

نام و Tag برای Image تعیین می‌کند.

```text
.
```

یعنی Build Context پوشه فعلی است.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>5. Build Context چیست؟</span>

</div>

یکی از مفاهیم مهم Docker همین `.` آخر دستور است.

وقتی می‌نویسیم:

```bash
docker build -t my-nginx .
```

نقطه یعنی:

> پوشه فعلی را به عنوان Build Context استفاده کن.

مثلاً اگر ساختار پروژه این باشد:

```text
docker-demo/
├── Dockerfile
├── index.html
└── app.js
```

و دستور زیر را اجرا کنیم:

```bash
docker build -t my-image .
```

<p dir='rtl'>
Docker این پوشه را به عنوان Context در اختیار فرآیند Build قرار می‌دهد.
</p>

به همین دلیل می‌توانیم فایل‌هایی مانند `index.html` را در Dockerfile با `COPY` وارد Image کنیم.

---

# 6. ساختار ساده پروژه

برای تمرین اول:

```text
docker-demo/
└── Dockerfile
```

<p dir='rtl'>
Dockerfile:
</p>

```dockerfile
FROM nginx:latest
```

حالا:

```bash
docker build -t my-nginx .
```

پس از Build:

```bash
docker image ls
```

باید Image جدید را ببینید:

```text
REPOSITORY   TAG       IMAGE ID
my-nginx     latest    ...
```

---

# 7. اجرای Image خودمان

حالا از Image ساخته‌شده Container ایجاد کنیم:

```bash
docker run -d --name my-nginx-container -p 8080:80 my-nginx
```

سپس:

```bash
docker ps
```

و در Browser:

```text
http://localhost:8080
```

باید صفحه پیش‌فرض Nginx را مشاهده کنید.

---

# 8. رابطه Dockerfile، Image و Container

در این مرحله این چرخه را به خوبی درک کنید:

```text
Dockerfile
    │
    │ docker build
    ▼
my-nginx Image
    │
    │ docker run
    ▼
my-nginx-container
```

این یکی از مهم‌ترین مفاهیم کل دوره است.

---

# 9. دستور COPY

حالا می‌خواهیم فایل خودمان را وارد Image کنیم.

ساختار:

```text
docker-demo/
├── Dockerfile
└── index.html
```

محتوای `index.html`:

```html
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>My Docker App</title>
</head>
<body>
    <h1>Hello from Docker!</h1>
</body>
</html>
```

<p dir='rtl'>
Dockerfile:
</p>

```dockerfile
FROM nginx:latest

COPY index.html /usr/share/nginx/html/index.html
```

دستور `COPY` فایل را از Build Context به داخل Image کپی می‌کند.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>10. Build مجدد</span>

</div>

ابتدا Container قبلی را حذف کنید:

```bash
docker rm -f my-nginx-container
```

سپس Image را دوباره Build کنید:

```bash
docker build -t my-nginx .
```

و Container را اجرا کنید:

```bash
docker run -d \
  --name my-nginx-container \
  -p 8080:80 \
  my-nginx
```

حالا:

```text
http://localhost:8080
```

را باز کنید.

باید صفحه‌ای که خودمان ساخته‌ایم نمایش داده شود.

---

# 11. دستور WORKDIR

<div align='right' dir='rtl'>

<span dir='rtl'>`WORKDIR` دایرکتوری کاری داخل Image را مشخص می‌کند.</span>

</div>

مثلاً:

```dockerfile
FROM python:3.12

WORKDIR /app
```

از اینجا به بعد دستورهای بعدی در <span dir='ltr'>`/app`</span> اجرا می‌شوند.

مثلاً:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY . .

RUN pip install -r requirements.txt
```

بهتر است به جای استفاده مداوم از مسیرهای مطلق، برای پروژه مسیر کاری مشخصی تعریف کنیم.

---

# 12. دستور RUN

<div align='right' dir='rtl'>

<span dir='rtl'>`RUN` هنگام Build شدن Image اجرا می‌شود.</span>

</div>

مثلاً:

```dockerfile
RUN apt-get update
```

یا:

```dockerfile
RUN pip install -r requirements.txt
```

یا:

```dockerfile
RUN npm install
```

نکته بسیار مهم:

<div align='right' dir='rtl'>

<span dir='rtl'>`RUN` در زمان **Build** اجرا می‌شود، نه هنگام اجرای Container.</span>

</div>

مثلاً:

```dockerfile
FROM python:3.12

WORKDIR /app

RUN pip install requests
```

دستور `pip install requests` هنگام Build اجرا می‌شود.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>13. RUN در مقابل CMD</span>

</div>

این دو را با هم اشتباه نگیرید.

<div align='right' dir='rtl'>

### RUN

</div>

برای اجرای دستور هنگام Build:

```dockerfile
RUN pip install -r requirements.txt
```

<div align='right' dir='rtl'>

### CMD

</div>

برای مشخص کردن دستور پیش‌فرض هنگام اجرای Container:

```dockerfile
CMD ["python", "app.py"]
```

پس:

```text
docker build
     │
     └── RUN

docker run
     │
     └── CMD
```

---

# 14. دستور CMD

<div align='right' dir='rtl'>

<sapn dir='rtl'>`CMD` دستور پیش‌فرض Container را مشخص می‌کند.</sapn>

</div>

مثلاً:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY app.py .

CMD ["python", "app.py"]
```

وقتی اجرا کنیم:

```bash
docker run my-python-app
```

<p dir='rtl'>
Docker به صورت پیش‌فرض این را اجرا می‌کند:
</p>

```bash
python app.py
```

---

# 15. چرا CMD را به شکل JSON می‌نویسیم؟

توصیه می‌شود `CMD` را به صورت Exec Form بنویسیم:

```dockerfile
CMD ["python", "app.py"]
```

به جای:

```dockerfile
CMD python app.py
```

فرم JSON کنترل بهتری روی Process اصلی Container می‌دهد و برای برنامه‌های Dockerized معمولاً انتخاب بهتری است.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>16. دستور ENTRYPOINT</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`ENTRYPOINT` مشخص می‌کند Container اساساً چه برنامه‌ای را اجرا کند.</span>

</div>

مثلاً:

```dockerfile
FROM python:3.12

WORKDIR /app

COPY app.py .

ENTRYPOINT ["python", "app.py"]
```

در این حالت `python app.py` به عنوان Entry Point برنامه تعیین می‌شود.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>17. CMD و ENTRYPOINT</span>

</div>

یک مدل ذهنی ساده:

<div align='right' dir='rtl'>

```text
ENTRYPOINT = برنامه اصلی

CMD = آرگومان‌ها یا مقدار پیش‌فرض
```

</div>

مثلاً:

```dockerfile
ENTRYPOINT ["python"]
CMD ["app.py"]
```

در حالت عادی:

```bash
docker run my-app
```

تقریباً معادل اجرای:

```bash
python app.py
```

است.

اگر Container را با آرگومان دیگری اجرا کنیم:

```bash
docker run my-app other.py
```

در این مدل، مقدار `CMD` جایگزین می‌شود.

این موضوع در پروژه‌های واقعی بسیار کاربردی است.

---

# 18. دستور EXPOSE

مثلاً:

```dockerfile
EXPOSE 80
```

این دستور اعلام می‌کند که برنامه داخل Container از Port `80` استفاده می‌کند.

اما یک نکته بسیار مهم:

<div align='right' dir='rtl'>

**<span dir='rtl'>`EXPOSE` خودش Port را روی Host باز نمی‌کند.</span>**

</div>

برای دسترسی از Host همچنان باید Port Mapping داشته باشیم:

```bash
docker run -p 8080:80 my-nginx
```

یعنی:

```text
Host 8080 → Container 80
```

---

# 19. دستور ENV

برای تعریف Environment Variable می‌توانیم از `ENV` استفاده کنیم.

مثلاً:

```dockerfile
ENV APP_ENV=production
```

یا:

```dockerfile
ENV PORT=8000
```

بعداً برنامه می‌تواند این مقدارها را از Environment دریافت کند.

برای مثال در Python:

```python
import os

port = os.getenv("PORT", "8000")
print(port)
```

در پروژه‌های واقعی استفاده از Environment Variableها بسیار مهم است.

---

# 20. یک پروژه Python کامل

حالا یک پروژه کوچک واقعی می‌سازیم.

ساختار:

```text
python-docker-demo/
├── Dockerfile
├── requirements.txt
└── app.py
```

فایل `requirements.txt`:

```text
flask==3.1.2
```

فایل `app.py`:

```python
from flask import Flask

app = Flask(__name__)


@app.get("/")
def home():
    return "Hello from Docker!"


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=8000)
```

<p dir='rtl'>
Dockerfile:
</p>

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

---

<div align='right' dir='rtl'>

# <span dir='rtl'>21. Build پروژه Python</span>

</div>

در پوشه پروژه اجرا کنید:

```bash
docker build -t python-docker-demo .
```

بعد:

```bash
docker image ls
```

باید Image جدید را ببینید.

---

# 22. اجرای پروژه Python

حالا:

```bash
docker run -d \
  --name python-demo-container \
  -p 8000:8000 \
  python-docker-demo
```

بررسی:

```bash
docker ps
```

و:

```text
http://localhost:8000
```

باید این متن را ببینید:

```text
Hello from Docker!
```

---

# 23. بررسی Logs

اگر برنامه اجرا نشد:

```bash
docker logs python-demo-container
```

یا:

```bash
docker logs -f python-demo-container
```

برای Debug کردن Container این دستور بسیار مهم است.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>24. Build Cache</span>

</div>

<p dir='rtl'>
Docker در زمان Build می‌تواند از Cache استفاده کند.
</p>

مثلاً Dockerfile زیر را در نظر بگیرید:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

CMD ["python", "app.py"]
```

فرض کنید فقط `app.py` را تغییر دهیم.

در Build بعدی Docker می‌تواند Layerهای قبلی مربوط به:

```dockerfile
COPY requirements.txt .
```

و:

```dockerfile
RUN pip install --no-cache-dir -r requirements.txt
```

را از Cache استفاده کند.

در نتیجه لازم نیست dependencyها را هر بار دوباره نصب کند.

---

# 25. چرا ترتیب دستورها مهم است؟

این Dockerfile:

```dockerfile
COPY . .

RUN pip install --no-cache-dir -r requirements.txt
```

می‌تواند باعث شود تغییر یک فایل ساده در پروژه، Cache مرحله نصب dependencyها را نیز تحت تأثیر قرار دهد.

ساختار بهتر:

```dockerfile
COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY . .
```

چرا؟

چون dependencyها معمولاً کمتر از Source Code تغییر می‌کنند.

بنابراین می‌توانیم Cache را بهتر استفاده کنیم.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>26. <span dir='ltr'>.dockerignore</span></span>

</div>

همه فایل‌های پروژه لازم نیست وارد Build Context شوند.

برای مثال:

```text
node_modules/
.git/
.env
__pycache__/
*.pyc
.venv/
```

را معمولاً نمی‌خواهیم وارد Context شوند.

برای این کار فایلی به نام:

```text
.dockerignore
```

می‌سازیم.

مثلاً برای پروژه Python:

```text
__pycache__/
*.pyc
.venv/
.env
.git/
.gitignore
```

این فایل می‌تواند حجم Build Context را کاهش دهد و از انتقال فایل‌های غیرضروری جلوگیری کند.

---

# 27. یک Dockerfile بهتر

نسخه بهتر پروژه Python:

```dockerfile
FROM python:3.12-slim

WORKDIR /app

COPY requirements.txt .

RUN pip install --no-cache-dir -r requirements.txt

COPY app.py .

EXPOSE 8000

CMD ["python", "app.py"]
```

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`.dockerignore`</span>:</span>

</div>

```text
__pycache__/
*.pyc
.venv/
.env
.git/
.gitignore
```

ساختار نهایی:

```text
python-docker-demo/
├── Dockerfile
├── .dockerignore
├── requirements.txt
└── app.py
```

---

# 28. اشتباه رایج: Dockerfile.txt

در Windows ممکن است فایل را به صورت:

```text
Dockerfile.txt
```

ذخیره کنید.

نام صحیح:

```text
Dockerfile
```

است.

<p dir='rtl'>
Docker به صورت پیش‌فرض به دنبال Dockerfile با همین نام می‌گردد.
</p>

---

# 29. انتخاب Base Image

مثلاً:

```dockerfile
FROM python:3.12
```

در مقابل:

```dockerfile
FROM python:3.12-slim
```

نسخه `slim` معمولاً Image کوچک‌تری ارائه می‌دهد.

اما کوچک‌تر بودن همیشه به معنی بهتر بودن نیست.

گاهی برای Build یا اجرای برنامه به ابزارها و کتابخانه‌هایی نیاز داریم که در Imageهای کوچک‌تر وجود ندارند.

بنابراین Base Image باید بر اساس نیاز پروژه انتخاب شود.

---

# 30. یک نکته مهم درباره امنیت

از قرار دادن Secretها داخل Dockerfile خودداری کنید.

مثلاً این کار مناسب نیست:

```dockerfile
ENV DATABASE_PASSWORD=my-secret-password
```

برای اطلاعات حساس مانند:

<p dir='rtl'>
• Password <br>
• API Key <br>
• Token <br>
• Secret
</p>

باید از روش‌های مناسب مدیریت Secret و Environment استفاده کنیم.

این موضوع را در بخش‌های پیشرفته‌تر دوره به صورت کامل بررسی خواهیم کرد.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>31. Debug کردن Dockerfile</span>

</div>

اگر Build شکست خورد:

```bash
docker build -t my-image .
```

اولین کار این است که آخرین بخش موفق Build را پیدا کنیم.

همچنین می‌توانیم Imageهای موجود را بررسی کنیم:

```bash
docker image ls
```

و تاریخچه Image را ببینیم:

```bash
docker image history my-image
```

اگر Container ساخته شده اما اجرا نمی‌شود:

```bash
docker ps -a
```

و سپس:

```bash
docker logs <container-name>
```

را بررسی کنید.

---

<div align='right' dir='rtl'>

# <span dir='rtl'>32. Challenge</span>

</div>

یک پروژه Python بسازید که:

```text
GET /
```

را پاسخ دهد.

پروژه باید شامل این فایل‌ها باشد:

```text
my-python-app/
├── Dockerfile
├── .dockerignore
├── requirements.txt
└── app.py
```

الزامات:

<div align='right' dir='rtl'>

<span dir='rtl'>1. از `python:3.12-slim` استفاده کنید.</span> <br>
<span dir='rtl'>2. `WORKDIR` را روی <span dir='ltr'>`/app`</span> قرار دهید.</span> <br>
<span dir='rtl'>3. dependencyها را نصب کنید.</span> <br>
<span dir='rtl'>4. برنامه را Copy کنید.</span> <br>
<span dir='rtl'>5. Port `8000` را `EXPOSE` کنید.</span> <br>
<span dir='rtl'>6. برنامه را با `CMD` اجرا کنید.</span> <br>
<span dir='rtl'>7. Image را با نام `my-python-app` بسازید.</span> <br>
<span dir='rtl'>8. Container را با نام `my-python-container` اجرا کنید.</span> <br>
<span dir='rtl'>9. Port `8000` را روی Host منتشر کنید.</span> <br>
<span dir='rtl'>10. با Browser یا `curl` برنامه را تست کنید.</span>

</div>

---

# 33. خلاصه

در این جلسه یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• Dockerfile چیست.</span> <br>
<span dir='rtl'>• `FROM` چه کاری انجام می‌دهد.</span> <br>
<span dir='rtl'>• Build Context چیست.</span> <br>
<span dir='rtl'>• `docker build` چگونه کار می‌کند.</span> <br>
<span dir='rtl'>• `COPY` چیست.</span> <br>
<span dir='rtl'>• `WORKDIR` چیست.</span> <br>
<span dir='rtl'>• `RUN` چه زمانی اجرا می‌شود.</span> <br>
<span dir='rtl'>• `CMD` چه زمانی اجرا می‌شود.</span> <br>
<span dir='rtl'>• `ENTRYPOINT` چیست.</span> <br>
<span dir='rtl'>• تفاوت `CMD` و `ENTRYPOINT` چیست.</span> <br>
<span dir='rtl'>• `EXPOSE` چه کاری انجام می‌دهد.</span> <br>
<span dir='rtl'>• `ENV` چیست.</span> <br>
<span dir='rtl'>• Build Cache چگونه کار می‌کند.</span> <br>
<span dir='rtl'>• <span dir='ltr'>`.dockerignore`</span> چیست.</span> <br>
<span dir='rtl'>• چگونه یک Python Application را Dockerize کنیم.</span>

</div>

مهم‌ترین چرخه‌ای که باید به خاطر بسپارید:

```text
             Dockerfile
                  │
                  │ docker build
                  ▼
              Docker Image
                  │
                  │ docker run
                  ▼
             Docker Container
                  │
                  ▼
             Running App
```

در جلسه بعد سراغ یکی از موضوعات بسیار مهم دیگر می‌رویم:

# جلسه ۶ — Docker Volumes & Persistent Data

در آنجا یاد می‌گیریم چرا داده‌های داخل Container نباید بدون فکر داخل خود Container نگهداری شوند و چگونه داده‌ها را با **Volume** پایدار کنیم.

