// server/server.js
require('dotenv').config();

const path = require('path');
const express = require('express');
const cors = require('cors');

const { initPool, closePool } = require('./services/db.service');
const hofRoutes   = require('./routes/hof.routes');   // /api/*
const adminRoutes = require('./routes/admin.routes'); // /api/admin/*

const app = express();

/* ---------- CORS ---------- */
const isProd = process.env.NODE_ENV === 'production';
const whitelist = new Set(
  [
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:3000',
    process.env.CLIENT_ORIGIN, // e.g. https://yourdomain.com
  ].filter(Boolean)
);

const corsOrigin = isProd
  ? (origin, cb) => {
      if (!origin) return cb(null, true);           // Postman/curl
      return whitelist.has(origin)
        ? cb(null, true)
        : cb(new Error('CORS blocked'));
    }
  : true;

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '2mb' }));

/* ---------- API routes ---------- */
app.get('/api/health', (_req, res) => res.json({ ok: true }));

app.use('/api', hofRoutes);
app.use('/api/admin', adminRoutes);

/* ---------- Static SPA (optional for production) ---------- */
/* If you build the React app to /dist, serve it below */
if (isProd) {
  const distDir = path.join(__dirname, '..', 'dist'); // adjust if needed
  app.use(express.static(distDir));

  // History fallback for client-side routes
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

/* ---------- 404 & error handlers ---------- */
app.use((req, res) => res.status(404).json({ error: 'Not found' }));
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Server error' });
});

/* ---------- Start ---------- */
const port = Number(process.env.PORT) || 8080;

(async () => {
  try {
    await initPool();
    app.listen(port, () => console.log(`HOF API listening on :${port}`));
  } catch (err) {
    console.error('Failed to initialize DB pool:', err);
    process.exit(1);
  }
})();

/* ---------- Graceful shutdown ---------- */
const shutdown = async () => {
  try { await closePool(); } finally { process.exit(0); }
};
process.on('SIGINT',  shutdown);
process.on('SIGTERM', shutdown);
