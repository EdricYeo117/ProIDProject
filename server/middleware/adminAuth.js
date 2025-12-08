// server/middleware/adminAuth.js
require("dotenv").config();

function requireAdminKey(req, res, next) {
  const headerKey = req.header("x-admin-key");
  const expected = process.env.ADMIN_KEY;

  if (!expected) {
    console.warn(
      "[adminAuth] ADMIN_KEY is not set in .env – refusing all admin calls."
    );
    return res.status(500).json({ error: "Admin key not configured" });
  }

  if (!headerKey || headerKey !== expected) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  // you can attach the admin identity here if you want
  req.adminUser = "admin";
  next();
}

module.exports = { requireAdminKey };
