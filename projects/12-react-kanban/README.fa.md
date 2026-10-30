<div align='right' dir='rtl'>

[🇬🇧 English](/projects/12-react-kanban/README.md)

</div>

<div align='right' dir='rtl'>

# <span dir='rtl'>Kanban Board — بورد کانبان</span>

</div>

> یک بورد تسک مدرن با قابلیت کشیدن و رها کردن، ساخته‌شده با React و Vite و Tailwind CSS — کاملاً داکری‌شده و با hot reload.

---

## معرفی

یک اپلیکیشن تک‌صفحه‌ای بورد کانبان، با الهام از Trello. کارت‌های تسک رو بین ستون‌ها بکش، جزئیات رو توی یه modal ویرایش کن، بر اساس اولویت فیلتر کن — همه‌چیز توی `localStorage` ذخیره می‌شه.

این پروژه، پیاده‌سازی مرجع **درس ۱۲** دوره‌ی «داکر از صفر تا صد» است.

این پروژه **بک‌اند ندارد**. کاملاً توی مرورگر اجرا می‌شه. این یه تصمیم عمدی است: به ما اجازه می‌ده ۱۰۰٪ روی این تمرکز کنیم که Docker چطور با یه پروژه‌ی مدرن جاوااسکریپت کار می‌کنه، بدون پیچیدگی API.

این پروژه روی روند توسعه تمرکز داره. production build با <span dir='ltr'>multi-stage</span> Docker و Nginx توی درس ۱۳ به‌عنوان یه پروژه‌ی جداگانه پوشش داده می‌شه.

---

## امکانات

<div align='right' dir='rtl'>

<span dir='rtl'>• سه ستون: **To Do**، **In Progress**، **Done**</span> <br>
<span dir='rtl'>• کشیدن و رها کردن بین ستون‌ها (با <span dir='ltr'>`@dnd-kit`</span>)</span> <br>
<span dir='rtl'>• ایجاد، ویرایش، و حذف تسک</span> <br>
<span dir='rtl'>• سطوح اولویت (Low، Medium، High) با برچسب‌های رنگی</span> <br>
<span dir='rtl'>• فیلتر تسک‌ها بر اساس اولویت</span> <br>
<span dir='rtl'>• badge تعداد تسک در هر ستون</span> <br>
<span dir='rtl'>• ذخیره‌ی خودکار در `localStorage`</span> <br>
<span dir='rtl'>• تم تاریک با گرادیانت‌های زیبا</span> <br>
<span dir='rtl'>• Responsive (سه ستون روی دسکتاپ، عمودی روی موبایل)</span> <br>
<span dir='rtl'>• Drag and drop با دسترسی‌پذیری از طریق keyboard</span> <br>
<span dir='rtl'>• Hot reload داخل Docker</span>

</div>

---

## پشته‌ی فناوری

<div align='center' dir='rtl'>

| بخش | نسخه |
|-----|------|
| Node.js | 22 (Alpine) |
| React | 19 |
| Vite | 8 |
| Tailwind CSS | 4 |
| dnd-kit | 6 |
| lucide-react | (آیکون‌ها) |

</div>

---

## شروع سریع (با Docker)

### ۱. کلون ریپو

```bash
git clone https://github.com/QUANTORIS01/docker-zero-to-hero.git
cd docker-zero-to-hero/projects/12-react-kanban
```

### ۲. ساخت و اجرا

```bash
docker compose up --build
```

### ۳. باز کردن برنامه

<div align='right' dir='rtl'>

<span dir='ltr'><http://localhost:3000/></span>

</div>

بورد با چند تسک نمونه از قبل پر شده. یکی رو بکش!

> **نکته درباره‌ی پورت:** این پروژه روی پورت **۳۰۰۰** اجرا می‌شه. پروژه‌های قبلی روی ۸۰۰۰ <span dir='ltr'>(TaskFlow)</span>، ۹۰۰۰ <span dir='ltr'>(URL Monitor)</span>، و ۸۰۸۰ <span dir='ltr'>(Photo Gallery)</span> هستن. یکتا بودن پورت‌ها یعنی هر چهار پروژه می‌تونن همزمان اجرا بشن.

---

## شروع سریع (بدون Docker)

```bash
npm install
npm run dev
```

بعد <span dir='ltr'><http://localhost:3000/></span> رو باز کن.

برنامه با یا بدون Docker یکسان رفتار می‌کنه. Docker لازم نیست که اجراش کنی — لازمه که بفهمی چطور برای تیم‌ها و CI/CD بسته‌بندی می‌شه.

---

## ساختار پروژه

```text
12-react-kanban/
├── .dockerignore
├── Dockerfile.dev
├── compose.yaml
├── index.html
├── package.json
├── package-lock.json
├── vite.config.js
├── eslint.config.js
├── README.md
├── README.fa.md
├── public/
└── src/
    ├── main.jsx
    ├── App.jsx
    ├── index.css
    ├── data/
    │   └── initialData.js
    ├── hooks/
    │   └── useLocalStorage.js
    └── components/
        ├── Column.jsx
        ├── TaskCard.jsx
        └── TaskModal.jsx
```

یک فایل <span dir='ltr'>`.gitignore`</span> در ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین این پروژه فایل جداگانه ندارد.

---

## چرا Dockerfile اسمش `Dockerfile.dev` است؟

چون این **Dockerfile توسعه** است. dev server ویت رو با <span dir='ltr'>hot reload</span>، source maps، و خطاهای کامل اجرا می‌کنه.

پسوند <span dir='ltr'>`.dev`</span> این نیت رو واضح می‌کنه. توی یه پروژه‌ی واقعی، معمولاً دو Dockerfile داری: یکی برای توسعه (تکرار سریع)، یکی برای production (کوچیک، بهینه، فایل‌های static سرو‌شده توسط وب‌سرور).

این پروژه عمداً فقط روی Dockerfile توسعه تمرکز کرده تا درس متمرکز بمونه. production build با <span dir='ltr'>multi-stage</span> Docker و Nginx توی درس ۱۳ به‌عنوان یه **پروژه‌ی جداگانه** پوشش داده می‌شه.

---

## چطور Docker Setup کار می‌کنه

<div align='right' dir='rtl'>

### `Dockerfile.dev`

</div>

```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev"]
```

نکته‌ی کلیدی اینه که `package.json` و `package-lock.json` **قبل از** بقیه‌ی کد کپی می‌شن. این کار به Docker اجازه می‌ده لایه‌ی `npm ci` رو کش کنه، پس یه تغییر کوچیک توی کد باعث reinstall کل وابستگی‌ها نمی‌شه.

<div align='right' dir='rtl'>

### `compose.yaml`

</div>

```yaml
services:
  frontend:
    build:
      context: .
      dockerfile: Dockerfile.dev
    ports:
      - "127.0.0.1:3000:3000"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
      - CHOKIDAR_USEPOLLING=true
```

دو خط volume. بیایید توضیح بدیم، چون این مهم‌ترین مفهوم این درسه.

### چرا دو volume؟

<div align='right' dir='rtl'>

<span dir='rtl'>volume اول <span dir='ltr'>(`.:/app`)</span> کد **منبع** رو از host توی کانتینر mount می‌کنه. این همون چیزیه که **hot reload** رو ممکن می‌کنه: وقتی فایلی رو ذخیره می‌کنی، کانتینر بلافاصله تغییر رو می‌بینه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>volume دوم <span dir='ltr'>(`/app/node_modules`)</span> یه **anonymous volume** است. <span dir='ltr'>`node_modules`</span> host رو پنهان می‌کنه و به کانتینر اجازه می‌ده از `node_modules` خودش (سازگار با لینوکس) که هنگام build از Image کپی شده استفاده کنه.</span>

</div>

بدون volume دوم، این اتفاق می‌افته:

<div align='right' dir='rtl'>

<span dir='rtl'>• روی ویندوز `npm install` می‌زنی ← `node_modules` پر می‌شه از فایل‌های **بومی ویندوز** (<span dir='ltr'>`.node`</span>، <span dir='ltr'>`.dll`</span>).</span> <br>
<span dir='rtl'>• Docker همون پوشه رو توی یه کانتینر **لینوکسی** mount می‌کنه.</span> <br>
<span dir='rtl'>• Node.js سعی می‌کنه فایل‌های <span dir='ltr'>`.node`</span> رو لود کنه، ولی برای ویندوز ساخته شدن.</span> <br>
<span dir='rtl'>• خطاهای عجیب مثل `invalid ELF header` یا `Cannot find module` می‌گیری.</span>

</div>

با volume دوم، `node_modules` داخل کانتینر کاملاً مستقل است. کانتینر با `npm ci` ساخته شده که وابستگی‌های بومی لینوکس رو نصب کرده. `node_modules` روی host نادیده گرفته می‌شه.

**این الگو، روش استاندارد اجرای Node.js توی Docker در حالت توسعه‌ست.** اگه فقط یه چیز از این درس یادت بمونه، همین باشه.

### چرا `CHOKIDAR_USEPOLLING=true`؟

روی <span dir='ltr'>Windows + WSL2</span>، file watcher ویت گاهی تغییرات فایل رو از دست می‌ده چون رویدادهای فایل‌سیستم از مرز WSL رد می‌شن. این متغیر Chokidar رو مجبور می‌کنه از **polling** (بررسی دوره‌ای فایل‌ها) استفاده کنه به‌جای رویدادهای بومی. polling کمی CPU بیشتری مصرف می‌کنه ولی قابله‌اعتماده.

اگه hot reload بدونش کار کرد، می‌تونی خط رو حذف کنی. روی لینوکس و مک، لازم نیست.

---

## نصب پکیج جدید

**داخل کانتینر انجامش بده**، نه روی host:

```bash
docker compose exec frontend npm install some-package
```

این کار این‌ها رو آپدیت می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• `node_modules` داخل کانتینر</span> <br>
<span dir='rtl'>• `package.json` و `package-lock.json` روی host (از طریق bind mount)</span>

</div>

اگه به‌جاش **روی <span dir='ltr'>host</span>** `npm install` بزنی، کانتینر پکیج جدید رو نمی‌بینه (چون `node_modules` جداست). برای رفع:

```bash
docker compose up --build
```

تا Image رو با وابستگی‌های جدید دوباره build کنه.

---

## دستورات پرکاربرد

```bash
# شروع (در صورت نیاز rebuild می‌کنه)
docker compose up --build

# شروع در پس‌زمینه
docker compose up -d

# دیدن وضعیت کانتینر
docker compose ps

# دنبال کردن لاگ‌های dev server ویت
docker compose logs -f frontend

# باز کردن shell داخل کانتینر
docker compose exec frontend sh

# نصب پکیج جدید (node_modules داخل کانتینر رو آپدیت می‌کنه)
docker compose exec frontend npm install <package-name>

# اجرای ESLint
docker compose exec frontend npm run lint

# Build برای production (خروجی در dist/)
docker compose exec frontend npm run build

# توقف کانتینر (volume آنونیموس node_modules رو نگه می‌داره)
docker compose down

# توقف و حذف volumeها (شروع بعدی node_modules رو دوباره نصب می‌کنه)
docker compose down -v
```

---

## نکات محیط عملیاتی

این پروژه **فقط برای توسعه** است. به همین شکل روی سرور <span dir='ltr'>production</span> deploy نکن.

**چرا؟** چون dev server ویت:

<p dir='rtl'>
• حافظه‌ی زیادی مصرف می‌کنه (کل درخت سورس رو توی حافظه نگه می‌داره) <br>
• کد minify نشده سرو می‌کنه <br>
• ابزارهای دیباگ داره <br>
• سطح حمله‌ی بزرگی داره
</p>

یه setup درست production برای یه اپ React معمولاً شامل این‌هاست:

<div align='right' dir='rtl'>

<span dir='rtl'>• `Dockerfile.prod` با multi-stage build</span> <br>
<span dir='rtl'>• `vite build` برای bundle و minify</span> <br>
<span dir='rtl'>• Nginx برای سرو خروجی static</span> <br>
<span dir='rtl'>• Image نهایی زیر ۵۰ مگابایت</span>

</div>

همه‌ی این‌ها توی درس ۱۳ به‌عنوان یه **پروژه‌ی جداگانه** پوشش داده می‌شن، نه به‌عنوان ارتقای این پروژه.

---

## نکات دیباگ

<div align='right' dir='rtl'>

### <span dir='rtl'>Hot reload کار نمی‌کنه</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>۱. تأیید کن که `CHOKIDAR_USEPOLLING=true` توی `compose.yaml` هست.</span> <br>
<span dir='rtl'>۲. کانتینر رو restart کن: `docker compose restart frontend`.</span> <br>
<span dir='rtl'>۳. آخرین راه‌حل: `docker compose down -v && docker compose up --build`.</span>

</div>

### بعد از `npm install` خطای `Cannot find module`

روی <span dir='ltr'>host</span> `npm install` زدی، نه داخل کانتینر. rebuild کن:

```bash
docker compose up --build
```

### پورت ۳۰۰۰ در استفاده است

پورت host رو توی `compose.yaml` عوض کن:

```yaml
ports:
  - "127.0.0.1:3001:3000"
```

بعد <span dir='ltr'><http://localhost:3001/></span> رو باز کن.

### کانتینر در حال اجراست ولی صفحه لود نمی‌شه

لاگ‌ها رو چک کن:

```bash
docker compose logs frontend
```

اگه `VITE ready` با <span dir='ltr'>`Local: http://localhost:3000/`</span> دیدی، سرور در حال اجراست. اگه نه، یه خطای build یا dependency هست.

---

## درس‌های مرتبط

این پروژه، پیاده‌سازی مرجع است برای:

<div align='right' dir='rtl'>

<span dir='rtl'>• [**درس ۱۲ — React با Docker**](/fa/12-react/README.md)</span>

</div>

---

## لایسنس

<p dir='rtl'>
MIT
</p>
