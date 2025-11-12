// server/routes/milestones.routes.js
const express = require('express');
const router = express.Router();

// ---- optional admin middleware (used only for POST/PUT/DELETE) ----
let requireAdmin = (req, res, next) => next(); // no-op by default
try {
  const mod = require('../middleware/adminAuth'); // adjust path if needed
  if (typeof mod === 'function') requireAdmin = mod;
  else if (mod && typeof mod.requireAdmin === 'function') requireAdmin = mod.requireAdmin;
  else if (mod && typeof mod.default === 'function') requireAdmin = mod.default;
} catch { /* middleware is optional */ }

// ---- controller import (support default or named) ----
const ctrl = (() => {
  const m = require('../controllers/milestones.controller'); // adjust path if needed
  return m?.default ?? m;
})();

function assertFn(obj, name) {
  const fn = obj?.[name];
  if (typeof fn !== 'function') {
    throw new Error(`[milestones.routes] "${name}" must be a function; got ${typeof fn}`);
  }
  return fn;
}

// bind handlers (fail fast if missing)
const listMilestones     = assertFn(ctrl, 'listMilestones');
const getMilestoneById   = ctrl.getMilestoneById ? assertFn(ctrl, 'getMilestoneById') : null;
const createMilestone    = ctrl.createMilestone  ? assertFn(ctrl, 'createMilestone')  : null;
const updateMilestone    = ctrl.updateMilestone  ? assertFn(ctrl, 'updateMilestone')  : null;
const deleteMilestone    = ctrl.deleteMilestone  ? assertFn(ctrl, 'deleteMilestone')  : null;

// Public
router.get('/',        listMilestones);
if (getMilestoneById) router.get('/:id', getMilestoneById);

// Admin-only (only wire if you actually implemented them)
if (createMilestone) router.post('/',    requireAdmin, createMilestone);
if (updateMilestone) router.put('/:id',  requireAdmin, updateMilestone);
if (deleteMilestone) router.delete('/:id', requireAdmin, deleteMilestone);

module.exports = router;
