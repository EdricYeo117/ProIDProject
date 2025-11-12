module.exports = function adminAuth(req, res, next) {
  const key = req.get('x-admin-key');
  if (!process.env.ADMIN_KEY) {
    return res.status(500).json({ error: 'ADMIN_KEY not set on server' });
  }
  if (key !== process.env.ADMIN_KEY) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  return next();
};
