const router = require("express").Router();
const { startUpload, ensureAdmin } = require("../controllers/upload.controller");

// POST /api/uploads/start  -> returns { uploadUrl, objectUrl, objectName, expiresAt }
router.post("/start", ensureAdmin, startUpload);

module.exports = router;
