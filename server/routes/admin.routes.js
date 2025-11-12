const router = require('express').Router();
const adminAuth = require('../middleware/adminAuth');
const { listAchievementTypes, createPersonDeep } = require('../controllers/admin.controller');
const { getParForUpload } = require('../controllers/upload.controller'); // you already had upload PAR

// Public (or keep behind admin if you prefer)
router.get('/achievement-types', listAchievementTypes);

// Admin-only endpoints
router.post('/upload-par', adminAuth, getParForUpload);
router.post('/persons/full', adminAuth, createPersonDeep);

module.exports = router;
