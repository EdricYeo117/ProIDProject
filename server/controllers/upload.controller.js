const { createUploadPar } = require("../services/oci.service");

// (Auth middleware placeholder)
// Replace with your real admin auth.
function ensureAdmin(req, res, next) {
  // e.g., check req.headers.authorization
  next();
}

async function startUpload(req, res) {
  try {
    const { prefix, contentType } = req.body || {};
    const data = await createUploadPar({ prefix, contentType });
    return res.json(data);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Failed to create upload URL" });
  }
}

module.exports = { startUpload, ensureAdmin };
