require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { initPool, closePool } = require('./services/db.service');
const hofRoutes = require('./routes/hof.routes');

const app = express();

// --- CORS ---
const allowAllInDev = process.env.NODE_ENV !== 'production';
const whitelist = new Set(
  [
    'http://localhost:3000',
    'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:8080',
    process.env.CLIENT_ORIGIN, // optional
  ].filter(Boolean)
);

// In dev, allow all; in prod, only allow from whitelist.
const corsOrigin = allowAllInDev
  ? true
  : (origin, cb) => {
      if (!origin) return cb(null, true); // allow curl/Postman/no-origin
      return whitelist.has(origin) ? cb(null, true) : cb(new Error('CORS blocked'));
    };

app.use(cors({ origin: corsOrigin }));
app.use(express.json({ limit: '1mb' }));

// --- Routes ---
app.use('/api', hofRoutes);
const uploadRoutes = require('./routes/upload.routes');
app.use('/api/uploads', uploadRoutes);
const personRoutes = require('./routes/person.routes');
app.use('/api/persons', personRoutes);


// --- Start ---
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

// --- Graceful shutdown ---
const shutdown = async () => {
  try { await closePool(); } finally { process.exit(0); }
};
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
