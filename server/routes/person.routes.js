// routes/person.routes.js (for example)
const router = require('express').Router();
const { ensureAdmin } = require('../controllers/upload.controller'); // or your existing auth
const PersonController = require('../controllers/person.controller');

// POST /api/admin/persons/full  (matches NewPerson.tsx)
router.post('/api/admin/persons/full', ensureAdmin, PersonController.create);

module.exports = router;
