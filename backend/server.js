const express = require('express');
const multer = require('multer');
const { customAlphabet } = require('nanoid');
const QRCode = require('qrcode');
const path = require('path');
const fs = require('fs');
const os = require('os');

const app = express();

// ---------- CONFIG (env-aware, EXE-friendly) ----------
const PORT = process.env.PORT || 3000;
const IS_PACKAGED = typeof process.pkg !== 'undefined';
const APP_DIR = IS_PACKAGED ? path.dirname(process.execPath) : __dirname;
const DATA_DIR = path.join(APP_DIR, 'lml-data');
const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
const DB_FILE = path.join(DATA_DIR, 'db.json');

// BASE_URL: env > LAN IP (so phone on same WiFi can scan QR and download)
function getBaseUrl() {
  if (process.env.BASE_URL) return process.env.BASE_URL;
  const ifaces = os.networkInterfaces();
  for (const name of Object.keys(ifaces)) {
    for (const iface of ifaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return `http://${iface.address}:${PORT}`;
      }
    }
  }
  return `http://localhost:${PORT}`;
}
const BASE_URL = getBaseUrl();

// ---------- DIRS ----------
for (const d of [DATA_DIR, UPLOAD_DIR]) {
  if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
}

// ---------- DB (persistent JSON) ----------
let db = {};
function saveDb() {
  try { fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2)); } catch (e) { console.error('DB save error:', e.message); }
}
function loadDb() {
  try {
    if (fs.existsSync(DB_FILE)) db = JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
  } catch (e) { db = {}; }
}
loadDb();
// cleanup: remove entries whose files are gone
for (const code of Object.keys(db)) {
  if (!fs.existsSync(path.join(UPLOAD_DIR, db[code].storedName))) delete db[code];
}
saveDb();

// ---------- HELPERS ----------
const newCode = customAlphabet('abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789', 8);

function getBaseUrlRequest(req) {
  // respect reverse-proxy headers (Render/Railway/Nginx)
  const proto = req.headers['x-forwarded-proto'] || 'http';
  const host = req.headers['x-forwarded-host'] || req.headers.host || req.hostname;
  return `${proto}://${host}`;
}

function formatSize(b) {
  if (b < 1024) return b + ' B';
  if (b < 1048576) return (b / 1024).toFixed(1) + ' KB';
  if (b < 1073741824) return (b / 1048576).toFixed(1) + ' MB';
  return (b / 1073741824).toFixed(2) + ' GB';
}

// ---------- MULTER ----------
const storage = multer.diskStorage({
  destination: (req, file, b) => b(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const code = newCode();
    const safeName = file.originalname.replace(/[^\w\-.() ]+/g, '_').slice(0, 100);
    cb(null, `${code}${safeName.startsWith('.') ? safeName : path.extname(safeName)}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600', 10) }
});

// ---------- PAGES ----------
const errorPage = (title, msg, icon) => `<!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="UTF-8"><title>${title} — LML</title>
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:system-ui,'Segoe UI',Tahoma,sans-serif}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;background:#0a0a1a;
background-image:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(124,77,255,.35),transparent),
radial-gradient(ellipse 60% 50% at 90% 10%,rgba(0,210,255,.22),transparent);color:#fff;text-align:center}
.box{padding:60px 40px}.box .i{font-size:4.5rem;margin-bottom:20px}
h1{font-size:2.2rem;margin-bottom:14px;background:linear-gradient(135deg,#7c4dff,#00d2ff);
-webkit-background-clip:text;-webkit-text-fill-color:transparent}
p{color:rgba(255,255,255,.55);margin-bottom:30px;font-size:1.05rem}
a{display:inline-block;padding:14px 40px;border-radius:14px;text-decoration:none;color:#fff;font-weight:700;
background:linear-gradient(135deg,#7c4dff,#00d2ff);box-shadow:0 8px 30px rgba(124,77,255,.4);transition:.25s}
a:hover{transform:translateY(-3px)}
</style></head><body><div class="box"><div class="i">${icon}</div><h1>${title}</h1><p>${msg}</p>
<a href="/">برگشت به LML 🚀</a></div></body></html>`;

const qrOpts = { width: 300, margin: 1, color: { dark: '#ffffff', light: '#0a0a1a' } };

const downloadPage = (meta, qrLink, downloadLink) => `<!DOCTYPE html>
<html lang="fa" dir="rtl"><head><meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${meta.originalName} — دانلود از LML</title>
<link href="https://fonts.googleapis.com/css2?family=Vazirmatn:wght@300;500;700;900&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box;font-family:'Vazirmatn',system-ui,sans-serif}
body{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:20px;
background:#0a0a1a;
background-image:radial-gradient(ellipse 80% 50% at 20% -10%,rgba(124,77,255,.35),transparent),
radial-gradient(ellipse 60% 50% at 90% 10%,rgba(0,210,255,.22),transparent),
radial-gradient(ellipse 50% 60% at 50% 110%,rgba(255,0,128,.18),transparent);color:#fff}
.glass{background:rgba(255,255,255,.05);border:1px solid rgba(255,255,255,.12);border-radius:24px;
backdrop-filter:blur(20px);box-shadow:0 20px 60px rgba(0,0,0,.4);padding:50px 40px;max-width:520px;width:100%;
text-align:center;position:relative;overflow:hidden}
.glass::before{content:'';position:absolute;top:0;left:0;right:0;height:1px;
background:linear-gradient(90deg,transparent,rgba(124,77,255,.8),rgba(0,210,255,.8),transparent)}
.i{font-size:3.6rem;margin-bottom:18px}
h1{font-size:1.5rem;font-weight:700;word-break:break-all;margin-bottom:10px}
.meta{color:rgba(255,255,255,.5);font-size:.9rem;margin-bottom:28px}
.btn{display:block;padding:16px;border-radius:16px;text-decoration:none;color:#fff;font-size:1.1rem;font-weight:700;
background:linear-gradient(135deg,#7c4dff,#00d2ff);box-shadow:0 10px 34px rgba(124,77,255,.45);transition:.25s}
.btn:hover{transform:translateY(-3px);box-shadow:0 14px 44px rgba(0,210,255,.55)}
.qr{display:block;width:200px;margin:0 auto 16px;border-radius:16px}
.qr-p{font-size:.8rem;color:rgba(255,255,255,.4);margin-top:22px}
.brand{position:fixed;bottom:18px;left:0;right:0;text-align:center;font-size:.85rem;color:rgba(255,255,255,.3)}
.brand b{background:linear-gradient(90deg,#7c4dff,#00d2ff);-webkit-background-clip:text;-webkit-text-fill-color:transparent}
</style></head><body>
<div class="glass">
  <div class="i">📦</div>
  <h1>${meta.originalName}</h1>
  <div class="meta">حجم: ${formatSize(meta.size)} • ${meta.downloads} دانلود</div>
  <img class="qr" src="${qrLink}" alt="QR">
  <a class="btn" href="${downloadLink}">⬇ دانلود فایل</a>
  <p class="qr-p">یا با موبایل کیوآر رو اسکن کن 📱</p>
</div>
<div class="brand">قدرت گرفته از <b>LML</b> 🚀</div>
</body></html>`;

// ---------- API ROUTES ----------

app.get('/api/health', (req, res) => {
  res.json({ ok: true, service: 'LML', files: Object.keys(db).length, baseUrl: BASE_URL });
});

// POST /api/upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });

  const code = req.file.filename.slice(0, 8);
  db[code] = {
    code,
    originalName: req.file.originalname,
    storedName: req.file.filename,
    size: req.file.size,
    mimeType: req.file.mimetype || 'application/octet-stream',
    uploadDate: new Date().toISOString(),
    downloads: 0
  };
  saveDb();

  const base = getBaseUrlRequest(req);
  const link = `${base}/d/${code}`;
  QRCode.toDataURL(link, qrOpts)
    .then(qr => res.json({ ...db[code], link, qr }))
    .catch(() => res.json({ ...db[code], link }));
});

// GET /api/file/:code -> metadata + qr
app.get('/api/file/:code', (req, res) => {
  const meta = db[req.params.code];
  if (!meta) return res.status(404).json({ error: 'Not found' });

  const base = getBaseUrlRequest(req);
  const link = `${base}/d/${meta.code}`;
  QRCode.toDataURL(link, qrOpts)
    .then(qr => res.json({ ...meta, link, qr }))
    .catch(() => res.json({ ...meta, link }));
});

// GET /api/files -> list all files
app.get('/api/files', (req, res) => {
  const list = Object.values(db).sort((a, b) => new Date(b.uploadDate) - new Date(a.uploadDate));
  res.json(list);
});

// DELETE /api/file/:code -> remove file
app.delete('/api/file/:code', (req, res) => {
  const meta = db[req.params.code];
  if (!meta) return res.status(404).json({ error: 'Not found' });

  const filePath = path.join(UPLOAD_DIR, meta.storedName);
  if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
  delete db[req.params.code];
  saveDb();
  res.json({ ok: true, deleted: req.params.code });
});

// GET /api/qr/:code -> png
app.get('/api/qr/:code', (req, res) => {
  const meta = db[req.params.code];
  if (!meta) return res.status(404).json({ error: 'Not found' });

  const base = getBaseUrlRequest(req);
  QRCode.toBuffer(`${base}/d/${meta.code}`, { ...qrOpts, width: 400 })
    .then(buf => {
      res.set('Content-Type', 'image/png');
      res.send(buf);
    })
    .catch(() => res.status(500).json({ error: 'QR error' }));
});

// GET /d/:code -> download page
app.get('/d/:code', async (req, res) => {
  const meta = db[req.params.code];
  if (!meta) return res.status(404).send(errorPage('۴۰۴ — پیدا نشد', 'این فایل وجود نداره یا حذف شده.', '🔍'));

  const base = getBaseUrlRequest(req);
  const qrLink = await QRCode.toDataURL(`${base}/d/${meta.code}`, { ...qrOpts, width: 200 }).catch(() => '');
  res.send(downloadPage(meta, qrLink, `${base}/dl/${meta.code}`));
});

// GET /dl/:code -> actual download
app.get('/dl/:code', (req, res) => {
  const meta = db[req.params.code];
  if (!meta) return res.status(404).send(errorPage('۴۰۴ — پیدا نشد', 'این فایل وجود نداره یا حذف شده.', '🔍'));

  const filePath = path.join(UPLOAD_DIR, meta.storedName);
  if (!fs.existsSync(filePath)) return res.status(410).send(errorPage('۴۱۰ — منقضی شده', 'این فایل دیگه روی سرور نیست.', '⏰'));

  meta.downloads++;
  saveDb();

  res.set('Content-Type', meta.mimeType);
  res.set('Content-Disposition', `attachment; filename*=UTF-8''${encodeURIComponent(meta.originalName)}`);
  res.set('Content-Length', meta.size);
  fs.createReadStream(filePath).pipe(res);
});

// ---------- STATIC ----------
// In packaged EXE, frontend files are embedded in pkg snapshot
const FRONTEND_DIR = IS_PACKAGED
  ? path.join(path.dirname(process.execPath), '..', 'frontend')
  : path.join(__dirname, '..', 'frontend');

// embedded fallback (works inside pkg snapshot)
let indexHtml = null;
function getIndexHtml() {
  if (indexHtml) return indexHtml;
  try {
    indexHtml = fs.readFileSync(path.join(__dirname, '..', 'frontend', 'index.html'), 'utf8');
  } catch (e) {
    try {
      indexHtml = fs.readFileSync(path.join(FRONTEND_DIR, 'index.html'), 'utf8');
    } catch (e2) {
      indexHtml = errorPage('خطا', 'فایل frontend/index.html پیدا نشد', '⚠️');
    }
  }
  return indexHtml;
}

if (!IS_PACKAGED) {
  app.use(express.static(FRONTEND_DIR));
}
app.get('/', (req, res) => res.send(getIndexHtml()));

app.use((req, res) => {
  res.status(404).send(errorPage('۴۰۴', 'صفحه‌ای که دنبالش بودی اینجا نیست.', '🚀'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ┌─────────────────────────────────────────┐
  │                                         │
  │   ██╗     ██╗███╗   ███╗██╗  ██╗       │
  │   ██║     ██║████╗ ████║██║ ██╔╝       │
  │   ██║     ██║██╔████╔██║█████╔╝        │
  │   ██║     ██║██║╚██╔╝██║██╔═██╗        │
  │   ███████╗██║██║ ╚═╝ ██║██║  ██╗       │
  │   ╚══════╝╚═╝╚═╝     ╚═╝╚═╝  ╚═╝       │
  │                                         │
  │   🚀  LML File Sharing v1.0            │
  │                                         │
  │   Local:   http://localhost:${PORT}       │
  │   Network: ${BASE_URL}  │
  │   Data:    ${DATA_DIR}  │
  │                                         │
  └─────────────────────────────────────────┘
  `);
  // open browser automatically (EXE mode)
  if (IS_PACKAGED) {
    const { exec } = require('child_process');
    exec('start http://localhost:' + PORT, { shell: 'cmd.exe' });
  }
});
