// src/routes/hof.routes.js
const router = require('express').Router();
const c = require('../controllers/hof.controller');

// meta
router.get('/health', (_req, res) => res.json({ ok: true }));

// data
router.get('/schools', c.getSchools);
router.get('/categories', c.getCategories);
router.get('/hof', c.getHof);
router.get('/person/:id', c.getPerson);

module.exports = router;
