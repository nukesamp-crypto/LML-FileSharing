<div align="center">

# 🚀 LML

### ابزار اشتراک‌گذاری فایل مدرن — آپلود کن، لینک بگیر، اشتراک بذار

**LML** یه ابزار اشتراک‌گذاری فایل ساده، سریع و خوش‌طرحه. فایلت رو رها کن، لینک و کیوآر بگیر، با هر کسی می‌خوای به اشتراک بذار.

![Version](https://img.shields.io/badge/version-1.0-blueviolet)
![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20Linux%20%7C%20macOS-green)
![License](https://img.shields.io/badge/license-MIT-cyan)

</div>

---

## 🌐 سه روش استفاده

| روش | مناسب برای | لینک |
|-----|-----------|------|
| 🌍 **سایت عمومی** (Render) | اشتراک با رفقا از هر جا | در [Releases](https://github.com/nukesamp-crypto/LML-FileSharing/releases) یا [Deploy خودت](#-دیپلوی-روی-رندر-۱-دقیقه) |
| 💻 **EXE ویندوز** | کامپیوتر خودت، بدون نصب هیچی | [Releases](https://github.com/nukesamp-crypto/LML-FileSharing/releases) |
| ⚙️ **از سورس** | دولوپرها | پایین رو بخون |

---

## ✨ امکانات

- 📤 **آپلود Drag & Drop** — با نوار پیشرفت انیمیشنی
- 🔗 **لینک کوتاه امن** — کد ۸ رقمی تصادفی بدون ابهام
- 📱 **کیوآر کد خودکار** — اسکن کن، مستقیم از موبایل دانلود کن
- 📄 **صفحه دانلود اختصاصی** — هر فایل یه صفحه خوشگل با شمارنده دانلود
- 🌍 **لینک از روی LAN/اینترنت** — کیوآر برای همون آدرس ساخته می‌شه
- 💾 **ذخیره‌سازی دائمی** — ری‌استارت = از دست ندادن فایل‌ها (EXE)
- 🎨 **تم شیشه‌ای (Glassmorphism)** — تیره گرادیانی + ستاره‌های چشمک‌زن
- 🇮🇷 **کاملاً فارسی و RTL** — فونت وزیرمتن
- 📱 **ریسپانسیو** — موبایل، تبلت، دسکتاپ

---

## 🖥 دانلود EXE ویندوز

1. برو به بخش **[Releases](https://github.com/nukesamp-crypto/LML-FileSharing/releases)**
2. `lml-win.exe` رو دانلود کن
3. دابل‌کلیک کن — تمام! ✨

**چی می‌شه وقتی اجرا کنی:**
- مرورگر خودکار باز می‌شه
- یه پوشه `lml-data` کنار EXE ساخته می‌شه (فایل‌ها + دیتابیس)
- سرور روی پورت ۳۰۰۰ بالا میاد
- کیوآر با IP لوکال شبکه ساخته می‌شه → **موبایل با همون وای‌فای اسکن کنه، دانلود می‌کنه!**

> ⚠️ اگه ویندوز SmartScreen نشون داد: **More info → Run anyway** (چون EXE امضای دیجیتال نداره)

> برای لینک‌دهی به رفقا از بیرون خانه، یا سایت Render رو استفاده کن یا با منفذ 3000 فوروارد کن.

---

## 🚀 دیپلوی روی Render (۱ دقیقه)

ساده‌ترین راه برای داشتن **لینک عمومی اینترنتی** که از هر جایی باز می‌شه:

1. برو به **[render.com](https://render.com)** و با گیت‌هاب لاگین کن
2. **New → Web Service**
3. ریپو `LML-FileSharing` رو انتخاب کن
4. Render فایل `render.yaml` رو خودکار می‌خونه — فقط **Create Web Service** بزن
5. ۲ دقیقه صبر کن → لینک عمومی می‌گیری: `https://lml-file-sharing.onrender.com`

> 💡 پلن Free هر ۱۵ دقیقه بی‌کار بخوابه و فایل‌ها ری‌استارت رو پاک کنن. برای مصرف واقعی پلن Starter + Persistent Disk بگیر.

---

## ⚙️ اجرا از سورس

```bash
git clone https://github.com/nukesamp-crypto/LML-FileSharing.git
cd LML-FileSharing/backend
npm install
npm start
# → http://localhost:3000
```

بیلد EXE خودت:

```bash
npm install
npm run build   # → dist/lml-win.exe
```

---

## 📂 ساختار پروژه

```
LML-FileSharing/
├── backend/
│   ├── server.js          # سرور Express (آپلود، لینک، QR، دانلود)
│   ├── package.json       # + کانفیگ pkg برای EXE
│   └── dist/              # خروجی بیلد (gitignore)
└── frontend/
    └── index.html         # UI شیشه‌ای
```

---

## 🔌 API

| متد | مسیر | توضیح |
|-----|------|-------|
| `POST` | `/api/upload` | آپلود → لینک + کیوآر |
| `GET` | `/api/files` | لیست همه فایل‌ها |
| `GET` | `/api/file/:code` | متادیتا + کیوآر |
| `DELETE` | `/api/file/:code` | حذف فایل |
| `GET` | `/api/qr/:code` | PNG کیوآر |
| `GET` | `/d/:code` | صفحه دانلود |
| `GET` | `/dl/:code` | دانلود مستقیم |
| `GET` | `/api/health` | وضعیت سرویس |

```bash
# مثال آپلود
curl -F "file=@myfile.zip" https://your-lml-site.onrender.com/api/upload
```

---

## ⚙️ متغیرهای محیطی

| متغیر | پیش‌فرض | توضیح |
|-------|---------|-------|
| `PORT` | `3000` | پورت سرور |
| `BASE_URL` | IP لوکال | آدرس پایه لینک‌ها |
| `MAX_FILE_SIZE` | `104857600` (100MB) | حداکثر حجم فایل (بایت) |

---

## 🛠 تکنولوژی‌ها

- **Backend**: Node.js • Express • Multer • nanoid • qrcode
- **Frontend**: HTML • CSS Glassmorphism • Vanilla JS • فونت وزیرمتن
- **Packaging**: @yao-pkg/pkg (EXE تک‌فایله بدون نیاز به Node)

---

## 🗺 نقشه راه

- [ ] انقضای خودکار فایل‌ها (X روز / X دانلود)
- [ ] رمزگذاری فایل‌ها
- [ ] چند فایل هم‌زمان
- [ ] پیش‌نمایش عکس و ویدیو

---

## 📄 لایسنس

MIT License — ❤️

---

<div align="center">

**ساخته شده با ❤️ — LML 🚀**

</div>
