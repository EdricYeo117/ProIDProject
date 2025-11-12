const router = require('express').Router();
const { postPerson } = require('../controllers/person.controller');
const { ensureAdmin } = require('../controllers/upload.controller');

router.post('/admin', ensureAdmin, postPerson); // POST /api/persons/admin

module.exports = router;
