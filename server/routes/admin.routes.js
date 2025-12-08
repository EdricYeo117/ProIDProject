// server/routes/admin.routes.js
const express = require("express");
const router = express.Router();

const adminController = require("../controllers/admin.controller");
const { requireAdminKey } = require("../middleware/adminAuth");

// GET /api/admin/achievement-types?categoryId=students
router.get(
  "/achievement-types",
  requireAdminKey,
  adminController.getAchievementTypes
);

// POST /api/admin/persons/full
router.post(
  "/persons/full",
  requireAdminKey,
  adminController.createPersonFull
);

module.exports = router;
