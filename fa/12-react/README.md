<div align='right' dir='rtl'>

[🇬🇧 English](/en/12-react/README.md)

</div>

# درس ۱۲ — React با Docker

## مقدمه

توی درس‌های گذشته، سه پروژه‌ی بک‌اند-محور ساختیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• **درس [۹](/fa/09-django-docker/README.md):** یه API با Django + PostgreSQL</span> <br>
<span dir='rtl'>• **درس [۱۰](/fa/10-celery-redis/README.md):** یه URL Monitor با Celery + Redis</span> <br>
<span dir='rtl'>• **درس [۱۱](/fa/11-nginx/README.md):** یه گالری عکس با Nginx و HTML/CSS</span> <br>

</div>

هر سه‌ی این‌ها یه چیز مشترک داشتن: **بک‌اند پایتونی**. یعنی حتی اون گالری عکس هم HTMLش از سمت Django رندر می‌شد.

حالا می‌خوایم وارد دنیای **فرانت‌اند مدرن** بشیم. جایی که دیگه Django نیست، HTML از سمت سرور نمیاد. همه‌چیز توی **مرورگر** ساخته می‌شه. زبانش **JavaScript** هست و فریم‌ورکش **React**.

این تغییر بزرگیه. توی این درس:

<div align='right' dir='rtl'>

<span dir='rtl'>• با یه تکنولوژی کاملاً جدید کار می‌کنیم (Node.js به‌جای Python)</span> <br>
<span dir='rtl'>• با یه زبان جدید کار می‌کنیم (JavaScript به‌جای Python)</span> <br>
<span dir='rtl'>• با یه مدل ذهنی جدید کار می‌کنیم (Component به‌جای View)</span> <br>

</div>

اما نگران نباش. هدف این درس **یاد دادن React از صفر نیست**. هدف اینه که:

<div align='right' dir='rtl'>

<span dir='rtl'>۱. بفهمی یه پروژه‌ی React چطور ساختار می‌گیره</span> <br>
<span dir='rtl'>۲. بفهمی چطور توی Docker اجراش کنی</span> <br>
<span dir='rtl'>۳. با چالش معروف `node_modules` آشنا بشی</span> <br>

</div>

کدهای React رو خط به خط توضیح می‌دم، ولی تمرکز اصلی روی **Docker** هست.

کدهای کامل پروژه توی مسیر <span dir='ltr'>`projects/12-react-kanban/`</span> توی ریپو موجوده.

---

## آنچه یاد می‌گیری

در پایان این درس می‌تونی:

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• توضیح بدی React چیه و چطور با Django فرق داره</span> <br>
<span dir='rtl'><span dir='rtl'>• یه پروژه‌ی React رو با Vite بسازی</span> <br>
<span dir='rtl'><span dir='rtl'>• ساختار پوشه‌های یه پروژه‌ی React رو توضیح بدی</span> <br>
<span dir='rtl'><span dir='rtl'>• تفاوت dev server و production build رو بفهمی</span> <br>
<span dir='rtl'><span dir='rtl'>• یه Dockerfile برای یه پروژه‌ی Node.js بنویسی</span> <br>
<span dir='rtl'><span dir='rtl'>• مفهوم `node_modules` و چرا نباید با host به اشتراک گذاشته بشه رو بفهمی</span> <br>
<span dir='rtl'><span dir='rtl'>• از الگوی «دو volume» استفاده کنی</span> <br>
<span dir='rtl'><span dir='rtl'>• hot reload رو داخل Docker کار بندازی</span> <br>

</div>

---

## پیش‌نیازها

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• همه‌چیزهای درس ۹ تا ۱۱ (Dockerfile، compose، volumes)</span> <br>
<span dir='rtl'><span dir='rtl'>• Node.js روی سیستم نصب باشه (نسخه ۱۸ به بالا)</span> <br>
<span dir='rtl'><span dir='rtl'>• آشنایی پایه با JavaScript (متغیر، تابع، آرایه، آبجکت) — اگه نداری هم می‌تونی ادامه بدی، کدها توضیح داده می‌شن</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**React از صفر لازم نیست.** توی این درس مفاهیم اصلی رو با مثال توضیح می‌دم.</span>

</div>

---

## اول، یه توضیح ساده از React

قبل از اینکه وارد کد بشیم، بذار React رو با یه مثال توضیح بدم.

<div align='right' dir='rtl'>

### <span dir='rtl'>React چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**React یه کتابخانه‌ی JavaScript برای ساختن رابط کاربری (UI) هست.**</span>

</div>

توی Django، صفحات HTML رو از سمت **سرور** می‌ساختیم. یعنی کاربر یه درخواست می‌فرستاد، Django یه HTML آماده برمی‌گردوند، مرورگر نمایشش می‌داد.

توی <span dir='ltr'>React</span>، HTML از سمت **مرورگر** ساخته می‌شه. یعنی:

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• یه بار، یه صفحه‌ی خالی (با یه فایل JavaScript) می‌گیریم</span> <br>
<span dir='rtl'><span dir='rtl'>• JavaScript اون صفحه رو پر می‌کنه</span> <br>
<span dir='rtl'><span dir='rtl'>• وقتی کاربر روی یه دکمه کلیک می‌کنه، JavaScript به‌جای اینکه یه صفحه‌ی جدید از سرور بگیره، **همون صفحه رو به‌روز می‌کنه**</span> <br>

</div>

**مثال روزمره:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• **Django** = رستورانی که هر بار یه بشقاب کامل جدید می‌ده. اگه فقط نمک کم بود، بازم باید کل بشقاب رو عوض کنه.</span> <br>
<span dir='rtl'><span dir='rtl'>• **React** = رستورانی که یه بشقاب بزرگ می‌ده، و اگه نمک کم بود، فقط نمک اضافه می‌کنه.</span> <br>

</div>

**اسم <span dir='ltr'>«Single Page Application»</span> (SPA) هم از همین میاد.** یعنی یه صفحه، ولی با تعامل‌های زیاد.

### چهار مفهوم اصلی React

<div align='right' dir='rtl'>

<span dir='rtl'>**۱. Component (کامپوننت)**</span>

</div>

یه تکه‌ی کوچیک از UI. مثل یه لگو. با ترکیب کامپوننت‌های کوچیک، یه صفحه‌ی بزرگ می‌سازی.

توی پروژه‌ی ما:

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• `TaskCard` یه کامپوننت هست (یه کارت تسک)</span> <br>
<span dir='rtl'><span dir='rtl'>• `Column` یه کامپوننت هست (یه ستون)</span> <br>
<span dir='rtl'><span dir='rtl'>• `TaskModal` یه کامپوننت هست (پنجره‌ی افزودن/ویرایش)</span> <br>
<span dir='rtl'><span dir='rtl'>• `App` هم یه کامپوننت هست (کل صفحه)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**۲. Props (پراپس)**</span>

</div>

اطلاعاتی که یه کامپوننت از والدش می‌گیره. مثل آرگومان‌های یه فانکشن.

مثلاً `TaskCard` نیاز داره بدونه «کدوم تسک» رو نشون بده. این رو با <span dir='ltr'>prop</span> `task` می‌گیره.

<div align='right' dir='rtl'>

<span dir='rtl'>**۳. State (استیت)**</span>

</div>

داده‌ای که توی یه کامپوننت تغییر می‌کنه. مثل:

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• آیا modal بازه؟</span> <br>
<span dir='rtl'><span dir='rtl'>• کاربر چه فیلتری انتخاب کرده؟</span> <br>
<span dir='rtl'><span dir='rtl'>• لیست تسک‌ها چیه؟</span> <br>

</div>

وقتی State تغییر می‌کنه، React خودکار UI رو به‌روز می‌کنه.

<div align='right' dir='rtl'>

<span dir='rtl'>**۴. Hooks (هوک)**</span>

</div>

فانکشن‌های خاصی که به کامپوننت‌های Function-Based اجازه می‌دن State داشته باشن.

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• `useState` — برای State</span> <br>
<span dir='rtl'><span dir='rtl'>• `useEffect` — برای کارهایی که وقتی چیزی تغییر کرد اجرا می‌شن (مثل ذخیره در localStorage)</span> <br>
<span dir='rtl'><span dir='rtl'>• `useLocalStorage` — هوک سفارشی خودمون که می‌سازیم</span> <br>

</div>

**درباره‌ی JSX:** توی <span dir='ltr'>React</span>، HTML رو داخل JavaScript می‌نویسیم. این ترکیب اسمش **JSX** هست. مثلاً:

```jsx
const element = <h1>Hello</h1>
```

این خیلی شبیه HTML هست، ولی در واقع JavaScript هست. Vite این رو به JavaScript خالص تبدیل می‌کنه که مرورگر بفهمه.

<div align='right' dir='rtl'>

### <span dir='rtl'>Vite چیه؟</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**Vite یه ابزار build برای پروژه‌های مدرن JavaScript هست.**</span>

</div>

کارش اینه که:

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• یه dev server راه بندازه (برای توسعه)</span> <br>
<span dir='rtl'><span dir='rtl'>• کد رو برای production بیلد کنه (برای اجرا در محیط واقعی)</span> <br>
<span dir='rtl'><span dir='rtl'>• hot reload بده (تغییرات رو بدون reload صفحه نشون بده)</span> <br>

</div>

قبلاً `Create React App` (CRA) محبوب بود، ولی الان Vite استاندارد صنعته چون ۱۰-۱۰۰ برابر سریع‌تره.

---

## پروژه‌ای که می‌سازیم — Kanban Board

**داستان پروژه:**

یه بورد کانبان (مثل Trello). سه ستون:<span dir='ltr'> **To Do**</span>، <span dir='ltr'>**In Progress**</span>، <span dir='ltr'>**Done**</span>. کارت‌های تسک رو با موس بکش و بین ستون‌ها جابه‌جا کن.

**امکانات:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• سه ستون Kanban</span> <br>
<span dir='rtl'><span dir='rtl'>• کشیدن و رها کردن کارت‌ها (drag and drop)</span> <br>
<span dir='rtl'><span dir='rtl'>• افزودن، ویرایش، حذف تسک</span> <br>
<span dir='rtl'><span dir='rtl'>• اولویت (Low / Medium / High) با رنگ‌های مختلف</span> <br>
<span dir='rtl'><span dir='rtl'>• فیلتر بر اساس اولویت</span> <br>
<span dir='rtl'><span dir='rtl'>• ذخیره‌ی خودکار در `localStorage` (مرورگر)</span> <br>
<span dir='rtl'><span dir='rtl'>• تم تاریک با گرادیانت‌ها</span> <br>

</div>

**نکته‌ی مهم:** این پروژه **بک‌اند ندارد**. همه‌چیز توی مرورگر اجرا می‌شه. داده‌ها توی `localStorage` ذخیره می‌شن.

**چرا بدون بک‌اند؟**

چون هدف این درس **یادگیری Docker برای React** هست، نه یاد دادن یه سیستم کامل. بک‌اند رو توی درس بعد (یه پروژه‌ی کاملاً جدید) اضافه می‌کنیم.

**پشته:**

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='rtl'>• Node.js 22 (Alpine) — محیط اجرای JavaScript</span> <br>
<span dir='rtl'><span dir='rtl'>• React 19 — کتابخانه‌ی UI</span> <br>
<span dir='rtl'><span dir='rtl'>• Vite 8 — ابزار build</span> <br>
<span dir='rtl'><span dir='rtl'>• Tailwind CSS 4 — برای استایل</span> <br>
<span dir='rtl'><span dir='rtl'>• <span dir='ltr'>`@dnd-kit`</span> — برای drag and drop</span> <br>
<span dir='rtl'><span dir='rtl'>• `lucide-react` — برای آیکون‌ها</span> <br>

</div>

---

## ساختار پوشه

ساختار کامل پروژه:

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
│   ├── favicon.svg
│   └── icons.svg
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

**نکته:** فایل <span dir='ltr'>`.gitignore`</span> توی ریشه‌ی ریپو هست که همه‌ی پروژه‌ها رو پوشش می‌ده. برای همین این پروژه فایل <span dir='ltr'>`.gitignore`</span> جداگانه نداره.

**پوشه‌ها:**

<div align='center' dir='rtl'>

| پوشه | چیه |
|-------|------|
| <span dir='ltr'>`public/`</span> | فایل‌های ثابتی که مستقیم کپی می‌شن (favicon، آیکون) |
| <span dir='ltr'>`src/`</span> | کد اصلی پروژه |
| <span dir='ltr'>`src/components/`</span> | کامپوننت‌های React |
| <span dir='ltr'>`src/hooks/`</span> | هوک‌های سفارشی |
| <span dir='ltr'>`src/data/`</span> | داده‌های اولیه و ثابت‌ها |

</div>

---

## قدم ۱ — فایل `package.json`

فایل `package.json` قلب هر پروژه‌ی Node.js هست. مثل `requirements.txt` توی پایتون، ولی کامل‌تر.

```json
{
  "name": "12-react-kanban",
  "private": true,
  "version": "0.0.0",
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint .",
    "preview": "vite preview"
  },
  "dependencies": {
    "@dnd-kit/core": "^6.3.1",
    "@dnd-kit/sortable": "^10.0.0",
    "@dnd-kit/utilities": "^3.2.2",
    "@tailwindcss/vite": "^4.3.3",
    "lucide-react": "^1.64.0",
    "react": "^19.3.1",
    "react-dom": "^19.3.1",
    "tailwindcss": "^4.3.3"
  },
  "devDependencies": {
    "@eslint/js": "^10.0.1",
    "@types/react": "^19.3.0",
    "@types/react-dom": "^19.3.0",
    "@vitejs/plugin-react": "^6.1.2",
    "eslint": "^10.13.0",
    "eslint-plugin-react-hooks": "^7.1.1",
    "eslint-plugin-react-refresh": "^0.5.7",
    "globals": "^17.13.0",
    "vite": "^8.3.5"
  }
}
```

### هر بخش چیه؟

<div align='right' dir='rtl'>

<span dir='rtl'>**`name`** — اسم پروژه.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`private: true`** — یعنی این پروژه قرار نیست توی npm منتشر بشه. برای پروژه‌های شخصی، همیشه `true`.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>**`type: "module"`**</span> — یعنی این پروژه از **ES Modules** استفاده می‌کنه (سیستم ماژول مدرن JavaScript). این `import`/`export` رو ممکن می‌کنه. توی Node.js قدیمی، باید از <span dir='ltr'>`require()`</span> استفاده می‌کردی.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`scripts`** — میانبرهایی که با <span dir='ltr'>`npm run <name>`</span> اجرا می‌شن:</span>

</div>

<div align='center' dir='rtl'>

| دستور | چیکار می‌کنه |
|--------|---------------|
| <span dir='ltr'>`npm run dev` </span>|<span dir='rtl'> dev server رو راه می‌ندازه (پورت ۳۰۰۰) </span>|
| <span dir='ltr'>`npm run build` </span>|<span dir='rtl'> برای production بیلد می‌کنه (خروجی توی <span dir='ltr'>`dist/`</span>) </span>|
| <span dir='ltr'>`npm run lint` </span>|<span dir='rtl'> کد رو با ESLint بررسی می‌کنه </span>|
| <span dir='ltr'>`npm run preview` </span>|<span dir='rtl'> build نهایی رو لوکال تست می‌کنه </span>|

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`dependencies`** — پکیج‌هایی که توی **production** لازم‌اند:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>`react`</span>، `react-dom`** — خود React</sapn> <br>
<span dir='rtl'>• <span dir='ltr'>**`@dnd-kit/*`**</span> — سه پکیج برای drag and drop</sapn> <br>
<span dir='rtl'>• **<span dir='ltr'>`tailwindcss`</span>، <span dir='ltr'>`@tailwindcss/vite`</span>** — استایل</sapn> <br>
<span dir='rtl'>• <span dir='ltr'>**`lucide-react`**</span> — آیکون‌ها</sapn> <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`devDependencies`** — پکیج‌هایی که فقط توی **توسعه** لازم‌اند:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• **<span dir='ltr'>`vite`</span>، <span dir='ltr'>`@vitejs/plugin-react`</span>** — ابزار build</sapn> <br>
<span dir='rtl'>• **<span dir='ltr'>`eslint`</span>، پلاگین‌هاش** — بررسی کیفیت کد</sapn> <br>

</div>

**نکته‌ی مهم:** تفاوت `dependencies` و `devDependencies` توی محیط عملیاتی مهم می‌شه. اگه `npm install --omit=dev` بزنی، فقط `dependencies` نصب می‌شن. این باعث می‌شه Image خیلی کوچیک‌تر بشه.

---

## قدم ۲ — فایل `vite.config.js`

فایل `vite.config.js` تنظیمات Vite رو نگه می‌داره:

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  server: {
    host: '0.0.0.0',
    port: 3000,
  },
})
```

### هر بخش چیه؟

<div align='right' dir='rtl'>

<span dir='ltr'>**`plugins: [react(), tailwindcss()]`**</span>

</div>

پلاگین‌ها. <span dir='ltr'>`react()`</span> به Vite می‌گه «این پروژه React هست، JSX رو پردازش کن». <span dir='ltr'>`tailwindcss()`</span> هم Tailwind رو فعال می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`server.host: '0.0.0.0'`**</span>

</div>

**این مهم‌ترین خط برای Docker هست.** به Vite می‌گه «روی همه‌ی رابط‌های شبکه گوش بده».

اگه این خط نبود، Vite فقط روی `localhost` داخل کانتینر گوش می‌داد. یعنی از بیرون کانتینر (حتی از خود ویندوز) قابل‌دسترس نبود.

<div align='right' dir='rtl'>

<span dir='ltr'>**`server.port: 3000`**</span>

</div>

پورت پیش‌فرض Vite (۵۱۷۳) رو به ۳۰۰۰ تغییر می‌ده. پورت ۳۰۰۰ استاندارد Reactه.

**توجه:** هر کدوم از پروژه‌های این دوره یه پورت جداگانه دارن:

<div align='center' dir='rtl'>

| درس | پورت |
|-----|------|
| ۹ (TaskFlow) | ۸۰۰۰ |
| ۱۰ (URL Monitor) | ۹۰۰۰ |
| ۱۱ (Photo Gallery) | ۸۰۸۰ |
| **۱۲ (Kanban)** | **۳۰۰۰** |

</div>

این‌طوری هر چهار پروژه می‌تونن همزمان اجرا بشن.

---

## قدم ۳ — فایل `index.html`

این فایل، نقطه‌ی ورود مرورگر به اپلیکیشن هست. توی پوشه‌ی ریشه‌ی پروژه‌ست.

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <link rel="icon" type="image/svg+xml" href="/favicon.svg" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Kanban Board</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

### خط به خط

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`<div id="root"></div>`</span>** — این یه <span dir='ltr'>`<div>`</span> خالی است. React تمام محتوا رو داخل این <span dir='ltr'>`<div>`</span> می‌سازه. اسمش `root`ه (ریشه).</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`<script type="module" src="/src/main.jsx"></script>`</span>** — این خط، فایل JavaScript اصلی رو لود می‌کنه. <span dir='ltr'>`type="module"`</span> یعنی از ES Modules استفاده می‌کنه.</span>

</div>

**نکته:** این فایل **در زمان توسعه** توسط Vite سرو می‌شه. توی <span dir='ltr'>production</span>، Vite یه HTML نهایی می‌سازه که JavaScript رو به یه فایل بزرگ تبدیل کرده.

**تفاوت با Django:**

توی <span dir='ltr'>Django</span>، HTML رو با template engine می‌ساختیم:

```django
<h1>{{ title }}</h1>
{% for task in tasks %}
  <div>{{ task.title }}</div>
{% endfor %}
```

توی <span dir='ltr'>React</span>، HTML **خالی** هست و React همه‌چیز رو با JavaScript می‌سازه. این تفاوت اصلیه.

---

## قدم ۴ — فایل `src/main.jsx`

این فایل، نقطه‌ی ورود JavaScript هست:

```jsx
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
```

### خط به خط

<div align='right' dir='rtl'>

<span dir='ltr'>**`import { StrictMode } from 'react'`**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>`StrictMode` یه کامپوننت خاص React هست که بعضی خطاهای رایج رو توی توسعه نشون می‌ده. کد رو دو بار اجرا می‌کنه تا باگ‌ها زودتر پیدا بشن.</span>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`import { createRoot } from 'react-dom/client'`**</span>

</div>

تابعی که React رو به یه <span dir='ltr'>`<div>`</span> توی HTML وصل می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`import './index.css'`**</span>

</div>

فایل CSS رو import می‌کنه. Vite این رو خودکار به HTML اضافه می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`import App from './App.jsx'`**</span>

</div>

کامپوننت اصلی برنامه رو import می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`createRoot(document.getElementById('root')).render(...)`**</span>

</div>

روی <span dir='ltr'>`<div id="root">`</span> یه React root می‌سازه، بعد کامپوننت <span dir='ltr'>`<App />`</span> رو داخلش render می‌کنه.

**خط آخر یعنی چی؟**

یعنی: «از الان به بعد، هر چیزی که <span dir='ltr'>`<App />`</span> برمی‌گردونه، توی <span dir='ltr'>`<div id="root">`</span> توی `index.html` نشون بده.»

---

## قدم ۵ — فایل `src/index.css`

فایل CSS اصلی:

```css
@import "tailwindcss";

@theme {
  --color-bg: #0a0a0f;
  --color-surface: #16162a;
  --color-surface-hover: #1c1c33;
  --color-border: rgba(255, 255, 255, 0.08);
  --color-text: #f5f5f7;
  --color-text-muted: #8b8b9e;
  --color-accent: #7c3aed;
  --color-accent-2: #06b6d4;

  --font-sans: 'Inter', system-ui, -apple-system, sans-serif;
}

html, body, #root {
  height: 100%;
}

body {
  background-color: var(--color-bg);
  color: var(--color-text);
  font-family: var(--font-sans);
  -webkit-font-smoothing: antialiased;
}
```

### هر بخش چیه؟

<div align='right' dir='rtl'>

<span dir='ltr'>**`@import "tailwindcss";`**</span>

</div>

کل Tailwind رو لود می‌کنه. توی Tailwind v4، این یه خط همه‌چیز رو فعال می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`@theme { ... }`**</span>

</div>

این ویژگی جدیده Tailwind v4. بهت اجازه می‌ده **متغیرهای سفارشی** تعریف کنی که توی همه‌ی کامپوننت‌ها استفاده بشن.

**رنگ‌هایی که انتخاب کردیم:**

<div align='center' dir='rtl'>

| متغیر | کد رنگ | چیه |
|--------|--------|-----|
| <span dir='ltr'>`bg` </span>| <span dir='ltr'>`#0a0a0f` </span>| پس‌زمینه‌ی مشکی سرمه‌ای |
| <span dir='ltr'>`surface` </span>| <span dir='ltr'>`#16162a` </span>| کارت‌ها |
| <span dir='ltr'>`accent` </span>| <span dir='ltr'>`#7c3aed` </span>| بنفش (اولویت بالا، دکمه‌ها) |
| <span dir='ltr'>`accent-2` </span>| <span dir='ltr'>`#06b6d4` </span>| فیروزه‌ای |

</div>

**نکته:** این‌ها همون رنگ‌های گالری درس ۱۱ هستن. این‌طوری پروژه‌ها یه هویت بصری مشترک دارن.

<div align='right' dir='rtl'>

<span dir='ltr'>**`html, body, #root { height: 100%; }`**</span>

</div>

کل صفحه رو به ارتفاع کامل می‌کشه. بدون این، یه نوار سفید پایین صفحه می‌مونه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`body { ... }`**</span>

</div>

استایل پیش‌فرض body. <span dir='ltr'>`-webkit-font-smoothing: antialiased`</span> فونت‌ها رو روی Mac و iOS نرم‌تر می‌کنه.

---

## قدم ۶ — فایل `src/data/initialData.js`

فایل داده‌های اولیه. سه تا چیز رو تعریف می‌کنه:

```js
export const columns = [
  { id: 'todo', title: 'To Do', accent: 'text-slate-400' },
  { id: 'in-progress', title: 'In Progress', accent: 'text-amber-400' },
  { id: 'done', title: 'Done', accent: 'text-emerald-400' },
]

export const priorities = {
  low: {
    label: 'Low',
    pill: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  },
  medium: {
    label: 'Medium',
    pill: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  },
  high: {
    label: 'High',
    pill: 'bg-rose-500/15 text-rose-300 border-rose-500/30',
  },
}

export const initialTasks = [
  {
    id: '1',
    title: 'Design new landing page',
    description: 'Create a modern landing page with hero section and features.',
    priority: 'high',
    status: 'todo',
    createdAt: Date.now() - 100000,
  },
  // ... چند تسک نمونه دیگه
]
```

### هر بخش چیه؟

<div align='right' dir='rtl'>

<span dir='rtl'>**`columns`** — سه ستون Kanban:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `id` — شناسه (که با `status` تسک‌ها مطابقت داره)</span>  <br>
<span dir='rtl'>• `title` — اسم نمایشی</span>  <br>
<span dir='rtl'>• `accent` — کلاس رنگ Tailwind برای عنوان ستون</span>  <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`priorities`** — سه سطح اولویت:</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>• `label` — اسم نمایشی</span>  <br>
<span dir='rtl'>• `pill` — کلاس‌های Tailwind برای ظاهر برچسب</span>  <br>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`initialTasks`** — چند تسک نمونه:</span>

</div>

اگه کاربر بار اول وارد بشه (یعنی `localStorage` خالی باشه)، این تسک‌ها نمایش داده می‌شن. اگه کاربر قبلاً تسک داشته باشه، این‌ها نادیده گرفته می‌شن.

---

## قدم ۷ — فایل `src/hooks/useLocalStorage.js`

این یه **هوک سفارشی** هست. مثل `useState` خود React، ولی داده رو توی `localStorage` ذخیره می‌کنه.

```js
import { useEffect, useState } from 'react'

export function useLocalStorage(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value))
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
    }
  }, [key, value])

  return [value, setValue]
}
```

<div align='right' dir='rtl'>

### <span dir='rtl'>`localStorage` چیه؟</span>

</div>

یه فضای ذخیره‌سازی توی مرورگر. مثل یه کش ساده که با بستن مرورگر پاک نمی‌شه.

<div align='right' dir='rtl'>

<span dir='rtl'>• `localStorage.setItem('key', 'value')` — ذخیره</span> <br>
<span dir='rtl'>• `localStorage.getItem('key')` — خوندن</span> <br>
<span dir='rtl'>• `localStorage.removeItem('key')` — حذف</span> <br>

</div>

**محدودیت:** فقط رشته (string) قبول می‌کنه. برای ذخیره‌ی آرایه یا آبجکت، باید اول به JSON تبدیلش کنی (`JSON.stringify`) و بعد بخونی (`JSON.parse`).

### خط به خط

<div align='right' dir='rtl'>

<span dir='ltr'>**`useState(() => { ... })`**</span>

</div>

این یه «lazy initializer» هست. فقط **یک بار** موقع mount اجرا می‌شه.

<div align='right' dir='rtl'>

<span dir='rtl'>• سعی می‌کنیم از `localStorage` بخونیم</span> <br>
<span dir='rtl'>• اگه چیزی بود، JSON.parse می‌کنیم و برمی‌گردونیم</span> <br>
<span dir='rtl'>• اگه نبود یا خطا داد، `initialValue` رو برمی‌گردونیم</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`useEffect(() => { ... }, [key, value])`**</span>

</div>

هر بار که `key` یا `value` تغییر کرد، این effect دوباره اجرا می‌شه. `value` رو به JSON تبدیل می‌کنه و توی `localStorage` می‌نویسه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`return [value, setValue]`**</span>

</div>

دقیقاً مثل `useState`. یه آرایه برمی‌گردونه: `[مقدار_فعلی, تابع_تغییر]`. استفاده‌کننده می‌تونه این‌طوری destruct کنه:

```js
const [tasks, setTasks] = useLocalStorage('kanban-tasks', initialTasks)
```

**نتیجه:** هر تغییری توی `tasks`، خودکار توی `localStorage` ذخیره می‌شه. بدون این، هر بار reload، تسک‌ها پاک می‌شدن.

---

## قدم ۸ — فایل `src/components/TaskCard.jsx`

کامپوننت کارت تسک. دو تا چیز رو export می‌کنه:

<div align='right' dir='rtl'>

<span dir='rtl'>• `TaskCardVisual` — فقط ظاهر</span> <br>
<span dir='rtl'>• <span dir='ltr'>`TaskCard`</span> — wrapper که منطق drag رو اضافه می‌کنه</span> <br>

</div>

```jsx
import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import { Pencil, Trash2 } from 'lucide-react'
import { priorities } from '../data/initialData'

export function TaskCardVisual({ task, onEdit, onDelete }) {
  const priority = priorities[task.priority]

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-lg p-4">
      {/* عنوان، توضیحات، برچسب اولویت */}
    </div>
  )
}

export function TaskCard({ task, onEdit, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
    id: task.id,
    data: { task },
  })

  return (
    <div
      ref={setNodeRef}
      {...attributes}
      {...listeners}
      className={`cursor-grab active:cursor-grabbing touch-none ${
        isDragging ? 'opacity-30' : ''
      }`}
    >
      <TaskCardVisual task={task} onEdit={onEdit} onDelete={onDelete} />
    </div>
  )
}
```

### چرا دو تا کامپوننت؟

<div align='right' dir='rtl'>

<span dir='rtl'>`TaskCardVisual` فقط ظاهر رو می‌سازه. `TaskCard` منطق drag رو اضافه می‌کنه.</span>

</div>

**چرا جدا؟** چون توی `DragOverlay` (که توی `App.jsx` می‌بینیم) نیاز به **کپی بصری** کارت داریم که draggable نباشه (چون اصلی داره کشیده می‌شه).

<div align='right' dir='rtl'>

### <span dir='rtl'>`useDraggable` چیه؟</span>

</div>

هوک dnd-kit که به یه کامپوننت می‌گه «می‌تونی کشیده بشی».

<div align='right' dir='rtl'>

<span dir='rtl'>• **`id`** — شناسه‌ی منحصربه‌فرد (تسک)</span> <br>
<span dir='rtl'>• **`data`** — اطلاعات اضافی (برای آینده)</span> <br>
<span dir='rtl'>• **`setNodeRef`** — به DOM وصل می‌شه</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`listeners`**</span> — event handlerها</span> <br>
<span dir='rtl'>• **`isDragging`** — آیا الان کشیده می‌شه؟</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`opacity-30` چرا؟</span>

</div>

وقتی کارت کشیده می‌شه، **کپی**ش توی `DragOverlay` با موس حرکت می‌کنه. کارت اصلی کم‌رنگ می‌شه تا کاربر بفهمه این یکی داره کشیده می‌شه.

<div align='right' dir='rtl'>

### <span dir='rtl'><span dir='ltr'>`onPointerDown={e => e.stopPropagation()}`</span> روی دکمه‌ها</span>

</div>

بدون این، وقتی روی دکمه‌ی Edit کلیک می‌کنی، dnd-kit فکر می‌کنه داری کارت رو می‌کشی و drag شروع می‌شه. با <span dir='ltr'>`stopPropagation`</span>، dnd-kit این رو نمی‌بینه، ولی `onClick` هنوز کار می‌کنه.

---

## قدم ۹ — فایل `src/components/Column.jsx`

کامپوننت ستون Kanban:

```jsx
import { useDroppable } from '@dnd-kit/core'
import { Plus } from 'lucide-react'
import { TaskCard } from './TaskCard'

export function Column({ column, tasks, onEdit, onDelete, onAddTask }) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { column },
  })

  return (
    <div
      ref={setNodeRef}
      className={`flex flex-col ... ${
        isOver ? 'border-violet-500/50 bg-violet-500/5' : 'border-[var(--color-border)]'
      }`}
    >
      {/* عنوان، تعداد تسک، دکمه‌ی + */}
      {/* لیست TaskCardها */}
    </div>
  )
}
```

<div align='right' dir='rtl'>

### <span dir='rtl'>`useDroppable` چیه؟</span>

</div>

هوک dnd-kit که به یه کامپوننت می‌گه «می‌تونی هدف drop باشی».

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>**`id: column.id`** </span>— شناسه‌ی این ستون. توی <span dir='ltr'>`onDragEnd`</span>، `over.id` برابر این می‌شه.</span> <br>
<span dir='rtl'>• <span dir='ltr'>**`isOver`**</span> — آیا الان یه کارت روی این ستون کشیده شده؟</span> <br>

</div>

### کلاس‌های پویا

وقتی `isOver=true` هست (یعنی یه کارت روی ستون کشیده شده)، border بنفش می‌شه و پس‌زمینه یه ذره بنفش می‌گیره. این **بازخورد بصری** به کاربر می‌ده.

---

## قدم ۱۰ — فایل `src/components/TaskModal.jsx`

پنجره‌ی افزودن/ویرایش تسک. یه فرم با title، description، priority، و status:

```jsx
export function TaskModal({ isOpen, onClose, onSave, task, defaultStatus }) {
  const [title, setTitle] = useState('')
  // ... stateهای دیگه

  useEffect(() => {
    if (task) {
      // اگه در حال ویرایشه، فرم رو پر کن
    } else {
      // اگه تسک جدیده، فرم رو خالی کن
    }
  }, [task, defaultStatus, isOpen])

  if (!isOpen) return null

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!title.trim()) return
    onSave({ title, description, priority, status })
  }

  return (
    <div className="fixed inset-0 ..." onClick={onClose}>
      <div className="..." onClick={e => e.stopPropagation()}>
        {/* فرم */}
      </div>
    </div>
  )
}
```

### نکته‌های کلیدی

<div align='right' dir='rtl'>

<span dir='rtl'>**`useEffect` برای populate کردن فرم:**</span>

</div>

وقتی modal باز می‌شه یا `task` عوض می‌شه، فرم با داده‌های مربوطه پر می‌شه. اگه `task` نال بود (تسک جدید)، فرم خالی می‌شه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`if (!isOpen) return null`**</span>

</div>

اگه modal بسته‌ست، هیچی رندر نکن.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`onClick={e => e.stopPropagation()}`</span> روی محتوای modal:**</span>

</div>

بیرونی (<span dir='ltr'>`fixed inset-0`</span>) یه <span dir='ltr'>`onClick={onClose}`</span> داره که modal رو می‌بنده. اگه `stopPropagation` نبود، هر کلیک داخل modal اون رو می‌بست.

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`e.preventDefault()`</span> توی `handleSubmit`:**</span>

</div>

جلوی رفتار پیش‌فرض فرم رو می‌گیره (که reload صفحه‌ست).

---

## قدم ۱۱ — فایل `src/App.jsx`

قلب برنامه. همه‌چیز رو به هم وصل می‌کنه:

```jsx
export default function App() {
  const [tasks, setTasks] = useLocalStorage('kanban-tasks', initialTasks)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [filterPriority, setFilterPriority] = useState('all')
  const [activeTask, setActiveTask] = useState(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor),
  )

  const handleDragEnd = (event) => {
    const { active, over } = event
    setActiveTask(null)
    if (!over) return
    const task = tasks.find(t => t.id === active.id)
    if (!task || task.status === over.id) return
    setTasks(tasks.map(t =>
      t.id === active.id ? { ...t, status: over.id } : t
    ))
  }

  return (
    <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
      {/* هدر با فیلتر و دکمه‌ی New task */}
      {/* سه ستون */}
      <DragOverlay>{activeTask && <TaskCardVisual task={activeTask} />}</DragOverlay>
    </DndContext>
  )
}
```

<div align='right' dir='rtl'>

### <span dir='rtl'>Stateها</span>

</div>

<div align='center' dir='rtl'>

| State | چیه |
|--------|------|
| <span dir='ltr'>`tasks`</span> |<span dir='rtl'> آرایه‌ی همه‌ی تسک‌ها (با `useLocalStorage` ذخیره می‌شه) </span>|
| <span dir='ltr'>`isModalOpen`</span> |<span dir='rtl'> آیا modal بازه؟ </span>|
| <span dir='ltr'>`editingTask`</span> |<span dir='rtl'> تسکی که ویرایش می‌شه (اگه `null`، تسک جدیده) </span>|
| <span dir='ltr'>`filterPriority`</span> |<span dir='rtl'> فیلتر فعلی </span>|
| <span dir='ltr'>`activeTask`</span> |<span dir='rtl'> تسکی که در حال drag هست </span>|

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`sensors` چیه؟</span>

</div>

سنسورهای ورودی dnd-kit:

<div align='right' dir='rtl'>

<span dir='rtl'>• **`PointerSensor`** — برای موس و تاچ. <span dir='ltr'>`activationConstraint: { distance: 5 }`</span> یعنی «کارت تا وقتی ۵ پیکسل حرکت نکنه، drag شروع نشه». بدون این، هر کلیک drag شروع می‌کرد.</span> <br>
<span dir='rtl'>• **`KeyboardSensor`** — برای دسترسی‌پذیری. کاربر با <span dir='ltr'>`Tab`</span> + `Space` + فلش‌ها می‌تونه drag کنه.</span> <br>

</div>

<div align='right' dir='rtl'>

### <span dir='rtl'>`handleDragEnd` — مهم‌ترین تابع</span>

</div>

```jsx
const { active, over } = event
```

<div align='right' dir='rtl'>

<span dir='rtl'>• `active` — چیزی که کشیده شده (تسک)</span> <br>
<span dir='rtl'>• `over` — چیزی که روش drop شده (ستون) یا `null` اگه بیرون drop شده</span> <br>

</div>

```jsx
if (!over) return
```

اگه بیرون drop شد، کاری نکن.

```jsx
if (task.status === over.id) return
```

اگه همون ستون، کاری نکن.

```jsx
setTasks(tasks.map(t => t.id === active.id ? { ...t, status: over.id } : t))
```

تسک رو پیدا کن، `status`ش رو عوض کن. `useLocalStorage` خودکار ذخیره می‌کنه.

<div align='right' dir='rtl'>

### <span dir='rtl'>`DndContext` و `DragOverlay`</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`DndContext`** — محیط drag. همه‌ی draggable و droppable باید داخلش باشن.</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>**`DragOverlay`** — کپی بصری کارتی که داره کشیده می‌شه. `rotate-3` و `shadow-2xl` و `opacity-95` باعث می‌شه کارت معلق به نظر برسه.</span>

</div>

---

## قدم ۱۲ — Dockerfile.dev

حالا بخش Docker. فایل `Dockerfile.dev`:

```dockerfile
FROM node:22-alpine

WORKDIR /app

COPY package.json package-lock.json ./

RUN npm ci

COPY . .

EXPOSE 3000

CMD ["npm", "run", "dev"]
```

### خط به خط

<div align='right' dir='rtl'>

<span dir='ltr'>**`FROM node:22-alpine`**</span>

</div>

<div align='right' dir='rtl'>

<span dir='rtl'>Image پایه. <span dir='ltr'>`node:22`</span> = Node.js نسخه ۲۲ (LTS)، `alpine` = لایه‌ی سیستم‌عاملی کوچیک (<span dir='ltr'>~۵۰</span> مگابایت، به‌جای <span dir='ltr'>~۹۰۰</span> مگابایت نسخه‌ی کامل).</span>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`WORKDIR /app`**</span>

</div>

پوشه‌ی کاری داخل کانتینر.

<div align='right' dir='rtl'>

<span dir='ltr'>**`COPY package.json package-lock.json ./`**</span>

</div>

**فقط** این دو فایل رو کپی می‌کنیم. یه تصمیم عمدی.

چرا؟ چون اگه همون اول کل کد رو کپی کنیم، **هر** تغییر توی کد، لایه‌ی `npm ci` رو باطل می‌کنه و دوباره از صفر نصب می‌کنه. این خیلی کند می‌شه.

با کپی فقط <span dir='ltr'>`package*.json`</span>، لایه‌ی `npm ci` تا وقتی که خود `package.json` تغییر نکنه، از کش استفاده می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`RUN npm ci`**</span>

</div>

مثل `npm install`، ولی:

<div align='right' dir='rtl'>

<span dir='rtl'>• فقط از `package-lock.json` استفاده می‌کنه (نه از `package.json`)</span> <br>
<span dir='rtl'>• سریع‌تره</span> <br>
<span dir='rtl'>• قابل‌اعتمادتره (دقیقاً همون نسخه‌ها نصب می‌شن)</span> <br>
<span dir='rtl'>• `node_modules` رو پاک و از اول نصب می‌کنه (پس تمیز شروع می‌شه)</span> <br>

</div>

<div align='right' dir='rtl'>

<span dir='ltr'>**`COPY . .`**</span>

</div>

بقیه‌ی کد رو کپی می‌کنه. توی محیط توسعه، این خط عملاً بی‌فایده‌ست (چون bind mount روش رو می‌پوشونه)، ولی برای این‌که Image کامل باشه، نگهش می‌داریم.

<div align='right' dir='rtl'>

<span dir='ltr'>**`EXPOSE 3000`**</span>

</div>

اعلام پورت. یادت باشه: پورت رو **منتشر نمی‌کنه**، فقط مستندش می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`CMD ["npm", "run", "dev"]`**</span>

</div>

دستور پیش‌فرض. dev server Vite رو راه می‌ندازه.

### چرا `Dockerfile.dev` و نه `Dockerfile`؟

چون این Dockerfile **مخصوص توسعه** هست:

<div align='right' dir='rtl'>

<span dir='rtl'>• dev server (کند، حافظه‌بر، ولی hot reload داره)</span> <br>
<span dir='rtl'>• کد minify نشده</span> <br>
<span dir='rtl'>• ابزارهای دیباگ</span> <br>

</div>

توی **یه پروژه‌ی واقعی**، معمولاً دو Dockerfile داری:

<div align='right' dir='rtl'>

<span dir='rtl'>• `Dockerfile.dev` — برای توسعه</span> <br>
<span dir='rtl'>• `Dockerfile.prod` — برای production (multi-stage، کوچیک، بهینه)</span> <br>

</div>

**این پروژه فقط `Dockerfile.dev` داره**، چون درس ۱۲ روی محیط توسعه تمرکز داره. production build با multi-stage در **درس ۱۳** به‌عنوان یه **پروژه‌ی جداگانه** پوشش داده می‌شه.

---

## قدم ۱۳ — فایل <span dir='ltr'>`.dockerignore`</span>

```text
node_modules/
dist/
dist-ssr/
*.local
.git/
.gitignore
.vscode/
.idea/
.DS_Store
Thumbs.db
README.md
```

### مهم‌ترین خط

<div align='right' dir='rtl'>

<span dir='ltr'>**`node_modules/`**</span>

</div>

اگه این خط نباشه، هر بار که `docker build` بزنی، Docker باید <span dir='ltr'>~۲۰۰</span> مگابایت `node_modules` رو به daemon بفرسته. این کار خیلی کند و بیهوده‌ست.

### بقیه‌ی خطوط

<div align='right' dir='rtl'>

<span dir='rtl'>• <span dir='ltr'>`dist/`</span> — خروجی `vite build`، توی dev لازم نیست</span> <br>
<span dir='rtl'>• <span dir='ltr'>`.git/`</span> — تاریخچه‌ی Git، لازم نیست</span> <br>
<span dir='rtl'>• <span dir='ltr'>`.vscode/`</span>, <span dir='ltr'>`.idea/`</span> — تنظیمات IDE</span> <br>
<span dir='rtl'>• `README.md` — نمی‌خوایم داخل Image باشه</span> <br>

</div>

---

## قدم ۱۴ — فایل `compose.yaml`

فایل `compose.yaml`:

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
    restart: unless-stopped
```

### خط به خط

<div align='right' dir='rtl'>

<span dir='rtl'>**<span dir='ltr'>`build.context: .`</span> و <span dir='ltr'>`build.dockerfile: Dockerfile.dev`</span>**</span>

</div>

می‌گه از `Dockerfile.dev` توی پوشه‌ی فعلی build کن.

<div align='right' dir='rtl'>

<span dir='ltr'>**`ports: "127.0.0.1:3000:3000"`**</span>

</div>

پورت ۳۰۰۰ روی `127.0.0.1` (فقط از خود سیستم) به پورت ۳۰۰۰ داخل کانتینر نقشه می‌شه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`volumes: - .:/app`**</span>

</div>

کل پوشه‌ی پروژه از host توی <span dir='ltr'>`/app`</span> کانتینر ظاهر می‌شه. این همون چیزیه که hot reload رو ممکن می‌کنه.

<div align='right' dir='rtl'>

<span dir='ltr'>**`volumes: - /app/node_modules`**</span>

</div>

**این مهم‌ترین خط این درسه.** یه **anonymous volume** هست. `node_modules` کانتینر رو از host جدا می‌کنه.

### چرا این خط حیاتیه؟ (مهم‌ترین مفهوم درس)

**تصور کن این سناریو:**

۱. تو روی ویندوز، توی پروژه‌ت `npm install` زدی. <span dir='ltr'>`node_modules/`</span> پر شد از پکیج‌های **کامپایل‌شده برای ویندوز** (<span dir='ltr'>`.node` files</span>، <span dir='ltr'>`.dll` files</span>).

۲. حالا Docker می‌خواد پروژه‌ت رو داخل کانتینر **لینوکسی** اجرا کنه.

۳. اگه <span dir='ltr'>`node_modules/`</span> ویندوزی رو با bind mount ببریم توی کانتینر، Node.js لینوکسی نمی‌تونه اون‌ها رو بخونه. خطاهایی مثل `Error: Cannot find module` یا `invalid ELF header` می‌گیری.

**راه‌حل:**

```yaml
volumes:
  - .:/app              # کد رو از host بیار
  - /app/node_modules   # ولی node_modules رو از host نیار!
```

**خط دوم دقیقاً چیکار می‌کنه؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• یه فضای خالی می‌سازه به اسم <span dir='ltr'>`/app/node_modules`</span></span> <br>
<span dir='rtl'>• این فضا رو **از Image** می‌گیره (چون توی Dockerfile گفتیم `npm ci` بزنه)</span> <br>
<span dir='rtl'>• host هیچ دسترسی بهش نداره</span> <br>
<span dir='rtl'>• کانتینر می‌تونه توش بنویسه</span> <br>

</div>

**نتیجه:**

<div align='right' dir='rtl'>

<span dir='rtl'>• `node_modules` داخل کانتینر: لینوکسی، مستقل</span> <br>
<span dir='rtl'>• کد از host میاد (پس hot reload کار می‌کنه)</span> <br>

</div>

**این الگو، روش استاندارد اجرای Node.js توی Docker در حالت توسعه‌ست.** اگه فقط یه چیز از این درس یادت بمونه، همین باشه.

<div align='right' dir='rtl'>

### <span dir='rtl'>`CHOKIDAR_USEPOLLING=true` چرا؟</span>

</div>

روی <span dir='ltr'>Windows</span> + <span dir='ltr'>WSL2</span>، Vite's file watcher گاهی تغییرات فایل رو از دست می‌ده چون رویدادهای filesystem از مرز WSL رد می‌شن. این متغیر Chokidar (کتابخونه‌ی watching Vite) رو مجبور می‌کنه از **polling** (بررسی دوره‌ای) استفاده کنه به‌جای رویدادهای بومی.

<div align='right' dir='rtl'>

<span dir='rtl'>polling کمی CPU بیشتری مصرف می‌کنه، ولی **قابل‌اعتماده**.</span>

</div>

روی لینوکس و مک، لازم نیست. برای محیط توسعه‌ی ویندوزی، توصیه می‌شه.

---

## قدم ۱۵ — اجرا

از داخل <span dir='ltr'>`projects/12-react-kanban/`</span>:

```bash
docker compose up --build
```

### چی انتظار داری ببینی

**مرحله‌ی build:**

```text
 => [1/5] FROM node:22-alpine
 => [2/5] WORKDIR /app
 => [3/5] COPY package.json package-lock.json ./
 => [4/5] RUN npm ci
 => [5/5] COPY . .
 => exporting to image
```

**مرحله‌ی start:**

```text
 ✔ Container 12-react-kanban-frontend-1  Started
```

**لاگ:**

```text
frontend-1  | > 12-react-kanban@0.0.0 dev
frontend-1  | > vite
frontend-1  |
frontend-1  |   VITE v8.3.5  ready in 250 ms
frontend-1  |
frontend-1  |   ➜  Local:   http://localhost:3000/
frontend-1  |   ➜  Network: http://172.18.0.2:3000/
```

اگه <span dir='ltr'>`Local: http://localhost:3000/`</span> رو دیدی، یعنی Vite روی `0.0.0.0` گوش می‌ده. این‌طوری Docker می‌تونه پورت رو پل بزنه.

---

## قدم ۱۶ — تست

### تست ۱ — باز کردن برنامه

```text
http://localhost:3000/
```

باید صفحه‌ی Kanban رو ببینی:

<div align='right' dir='rtl'>

<span dir='rtl'>• هدر با لوگو</span> <br>
<span dir='rtl'>• سه ستون: To Do (۳ تسک)، In Progress (۲ تسک)، Done (۱ تسک)</span> <br>
<span dir='rtl'>• کارت‌ها با عنوان، توضیحات، برچسب اولویت رنگی</span> <br>

</div>

### تست ۲ — Drag and Drop

۱. یه کارت رو از «To Do» بکش و رها کن توی «In Progress»

۲. **باید ببینی:**

<div align='right' dir='rtl'>

<span dir='rtl'>• ستون مقصد هایلایت بنفش می‌شه</span> <br>
<span dir='rtl'>• کارت اصلی کم‌رنگ می‌شه</span> <br>
<span dir='rtl'>• کپی کارت با زاویه و سایه با موس حرکت می‌کنه</span> <br>
<span dir='rtl'>• کارت به ستون جدید می‌ره</span> <br>

</div>

۳. صفحه رو reload کن. کارت باید توی ستون جدیدش مونده باشه.

### تست ۳ — افزودن، ویرایش، حذف

۱. روی «New task» بزن. یه تسک جدید بساز.

۲. روی آیکن Edit یه کارت بزن. عنوان رو عوض کن. Save.

۳. روی آیکن Delete بزن. تأیید کن.

همه باید کار کنن.

### تست ۴ — Hot Reload (مهم‌ترین تست Docker)

**این تست ثابت می‌کنه که bind mount درست کار می‌کنه.**

۱. فایل `src/App.jsx` رو توی VS Code باز کن

۲. تیتر رو از `Kanban Board` به `Kanban Board (Docker)` تغییر بده

۳. **ذخیره کن**

۴. برو به مرورگر. **بدون reload**. باید تیتر رو با تغییر جدید ببینی.

اگه hot reload کار می‌کنه، **همه‌چیز درست درآمده**. 🎉

### تست ۵ — جدایی `node_modules`

**این تست ثابت می‌کنه که <span dir='ltr'>`node_modules`</span> host و container قاطی نشدن.**

**مرحله‌ی ۱ — فایل تست داخل کانتینر بساز:**

```powershell
docker compose exec frontend touch node_modules/.container-test
```

**مرحله‌ی ۲ — چک کن روی host دیده نمی‌شه:**

```powershell
Test-Path node_modules\.container-test
```

باید `False` برگردونه. اگه `False` بود، جدایی `node_modules` کار می‌کنه. ✅

**اگه `True` بود**، یعنی <span dir='ltr'>`node_modules`</span> host و container یکسانن (که نباید باشه). چک کن که <span dir='ltr'>`volumes: - /app/node_modules`</span> توی `compose.yaml` هست.

---

## قدم ۱۷ — نصب پکیج جدید (نکته‌ی مهم)

وقتی می‌خوای یه پکیج جدید نصب کنی (مثلاً `react-router-dom`)، دو راه داری:

### راه درست — داخل کانتینر

```bash
docker compose exec frontend npm install react-router-dom
```

**چی می‌شه؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• `node_modules` داخل کانتینر آپدیت می‌شه</span> <br>
<span dir='rtl'>• `package.json` و `package-lock.json` روی host آپدیت می‌شن (چون bind mount کار می‌کنه)</span> <br>
<span dir='rtl'>• همه‌چیز خودکار هم‌زمان</span> <br>

</div>

**این روش درسته.** ✅

### راه اشتباه — روی host

```bash
npm install react-router-dom
```

**چی می‌شه؟**

<div align='right' dir='rtl'>

<span dir='rtl'>• `node_modules` روی host آپدیت می‌شه</span> <br>
<span dir='rtl'>• `package.json` و `package-lock.json` روی host آپدیت می‌شن</span> <br>
<span dir='rtl'>• **ولی `node_modules` داخل کانتینر عوض نمی‌شه** (چون volume جداست)</span> <br>

</div>

**نتیجه:** کانتینر ارور می‌ده که `react-router-dom` پیدا نمی‌شه.

**راه‌حل:** بعد از نصب روی host:

```bash
docker compose up --build
```

تا Image رو با وابستگی‌های جدید rebuild کنه.

### توصیه

**همیشه داخل کانتینر نصب کن.** این یه عادت خوبه که از همون اول تمرین می‌کنی.

---

## مشکلات رایج

### مشکل اول — Hot reload کار نمی‌کنه

۱. تأیید کن `CHOKIDAR_USEPOLLING=true` توی `compose.yaml` هست

۲. کانتینر رو restart کن:

```bash
docker compose restart frontend
```

۳. آخرین راه‌حل:

```bash
docker compose down -v
docker compose up --build
```

### مشکل دوم — خطای `Cannot find module` بعد از `npm install`

روی host نصب کردی، نه داخل کانتینر. rebuild کن:

```bash
docker compose up --build
```

### مشکل سوم — پورت ۳۰۰۰ در استفاده است

پورت host رو عوض کن:

```yaml
ports:
  - "127.0.0.1:3001:3000"
```

بعد <span dir='ltr'>`http://localhost:3001/`</span> رو باز کن.

### مشکل چهارم — کانتینر در حال اجراست ولی صفحه لود نمی‌شه

لاگ‌ها رو چک کن:

```bash
docker compose logs frontend
```

اگه `VITE ready` با <span dir='ltr'>`Local: http://localhost:3000/`</span> دیدی، سرور در حال اجراست. اگه نه، یه خطای build یا dependency هست.

### مشکل پنجم — `invalid ELF header` یا خطاهای باینری

<div align='right' dir='rtl'>

<span dir='rtl'><span dir='ltr'>`node_modules`</span> host و container قاطی شدن. چک کن:</span>

</div>

```bash
grep node_modules compose.yaml
```

باید خط <span dir='ltr'>`- /app/node_modules`</span> باشه.

---

## تمرین‌ها

۱. <span dir='ltr'>`docker compose up --build`</span> رو اجرا کن و مطمئن شو صفحه‌ی Kanban لود می‌شه.

۲. یه کارت رو بین ستون‌ها بکش. صفحه رو reload کن. تغییر باید ذخیره شده باشه.

۳. <span dir='ltr'>`src/App.jsx`</span> رو تغییر بده. بدون reload، تغییر رو ببین.

۴. <span dir='ltr'>`docker compose exec frontend touch node_modules/.container-test`</span> رو بزن. با `Test-Path` چک کن روی host نیست.

۵. توی کانتینر <span dir='ltr'>`docker compose exec frontend npm install date-fns`</span> رو بزن. ببین `package.json` روی host آپدیت شد.

۶. **چالش:** یه دکمه‌ی «Clear all tasks» به هدر اضافه کن که همه‌ی تسک‌ها رو پاک کنه. توی <span dir='ltr'>`App.jsx`</span>، <span dir='ltr'>`setTasks([])`</span> رو صدا بزن.

---

## جمع‌بندی

در این درس یاد گرفتیم:

<div align='right' dir='rtl'>

<span dir='rtl'>• **React چیه** و چطور با Django فرق داره (UI توی مرورگر <span dir='ltr'>vs</span> HTML از سرور)</span> <br>
<span dir='rtl'>• **<span dir='ltr'>Component</span>، <span dir='ltr'>Props</span>، <span dir='ltr'>State</span>، <span dir='ltr'>Hooks</span>** — چهار مفهوم اصلی React</span> <br>
<span dir='rtl'>• **Vite چیه** و چرا جایگزین Create React App شده</span> <br>
<span dir='rtl'>• **ساختار یه پروژه‌ی React** و اینکه هر پوشه چیکار می‌کنه</span> <br>
<span dir='rtl'>• **Dockerfile.dev** چیه و چرا با `Dockerfile.prod` فرق داره</span> <br>
<span dir='rtl'>• **الگوی دو volume** — مهم‌ترین مفهوم این درس</span> <br>
<span dir='rtl'>• چرا `node_modules` نباید بین host و container مشترک باشه</span> <br>
<span dir='rtl'>• چطور hot reload رو توی Docker کار بندازیم</span> <br>
<span dir='rtl'>• چطور پکیج جدید نصب کنیم (داخل کانتینر، نه روی host)</span> <br>

</div>

**مهم‌ترین نکته‌ی این درس:**

```text
volumes:
  - .:/app              ← کد از host، برای hot reload
  - /app/node_modules   ← node_modules از container، برای سازگاری لینوکس
```

**اگه فقط یه چیز از این درس یادت بمونه، همین دو خط باشه.**

---

## درس بعدی

**درس ۱۳ — یک پروژه‌ی کاملاً جدید: React + Django + Multi-stage Build**

توی درس بعد، یه **پروژه‌ی کاملاً جدید** می‌سازیم که:

<div align='right' dir='rtl'>

<span dir='rtl'>• React برای فرانت‌اند</span> <br>
<span dir='rtl'>• Django برای بک‌اند</span> <br>
<span dir='rtl'>• PostgreSQL برای دیتابیس</span> <br>
<span dir='rtl'>• Nginx به‌عنوان Reverse Proxy</span> <br>
<span dir='rtl'>• **Multi-stage Docker build** برای production</span> <br>
<span dir='rtl'>• React رو با `vite build` بیلد می‌کنه، بعد با Nginx سرو می‌کنه</span> <br>

</div>

یعنی از یه <span dir='ltr'>Image</span> ۵۰۰ مگابایتی dev، به یه <span dir='ltr'>Image</span> ۵۰ مگابایتی production می‌رسیم. یاد می‌گیری چطور یه اپ full-stack واقعی رو برای محیط عملیاتی آماده کنی.
