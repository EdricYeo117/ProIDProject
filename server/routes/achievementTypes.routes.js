// routes/achievementTypes.routes.js
const router = require('express').Router();
const { ensureAdmin } = require('../controllers/upload.controller');
const AchievementTypesController = require('../controllers/achievementTypes.controller');

router.get('/api/admin/achievement-types', ensureAdmin, AchievementTypesController.list);

module.exports = router;
