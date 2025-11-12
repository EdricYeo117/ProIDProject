// server/middleware/adminAuth.js
function requireAdmin(req, res, next) {
  const provided = (req.header('x-admin-key') || '').trim();
  const expected = (process.env.ADMIN_KEY || '').trim();
  if (!expected || provided !== expected) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  next();
}
module.exports = requireAdmin;
