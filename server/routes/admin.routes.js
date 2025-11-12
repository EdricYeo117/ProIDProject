// server/routes/admin.routes.js
const express = require('express');
const router = express.Router();

// middleware (must export a function)
const requireAdmin = (() => {
  const mod = require('../middleware/adminAuth'); // adjust path if needed
  if (typeof mod === 'function') return mod;
  if (mod && typeof mod.requireAdmin === 'function') return mod.requireAdmin;
  if (mod && typeof mod.default === 'function') return mod.default;
  throw new Error('adminAuth must export a function (default or named requireAdmin)');
})();

// controller (object with handler fns)
const admin = (() => {
  const mod = require('../controllers/admin.controller'); // adjust path if needed
  return mod.default ?? mod;
})();

function assertFn(obj, name) {
  if (typeof obj[name] !== 'function') {
    throw new Error(`[admin.routes] "${name}" must be a function. Got: ${typeof obj[name]}`);
  }
  return obj[name];
}

const listAchievementTypes = assertFn(admin, 'listAchievementTypes');
const createPersonDeep     = assertFn(admin, 'createPersonDeep');

// If you have an upload PAR handler, wire it here; otherwise you can omit:
const uploadPar = admin.uploadPar ? assertFn(admin, 'uploadPar') : (_req, res) => res.status(501).json({ error: 'Not Implemented' });

// Health
router.get('/health', (_req, res) => res.json({ ok: true }));

// Admin endpoints
router.get('/achievement-types', requireAdmin, listAchievementTypes);
router.post('/persons/full',     requireAdmin, createPersonDeep);
router.post('/upload-par',       requireAdmin, uploadPar);

module.exports = router;
