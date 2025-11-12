// server/routes/milestones.routes.js
const express = require('express');
const router = express.Router();
const ctrl = require('../controllers/milestones.controller');

// Public
router.get('/', ctrl.listMilestones);
router.get('/:id', ctrl.getMilestoneById);

// Admin (protected via x-admin-key header inside controller)
router.post('/', ctrl.createMilestone);
router.put('/:id', ctrl.updateMilestone);
router.delete('/:id', ctrl.deleteMilestone);

module.exports = router;
