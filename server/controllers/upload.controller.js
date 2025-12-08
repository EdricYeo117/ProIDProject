const { createParsForObject } = require('../services/oci.service');
const crypto = require('crypto');
const path = require('path');

function safeName(filename, folder) {
  const ext = path.extname(filename || '').toLowerCase() || '.bin';
  const base = (filename || 'file')
    .replace(/[^\w.-]+/g, '_')
    .slice(0, 40)
    .replace(/^_+/, '');
  const rnd = crypto.randomBytes(6).toString('hex');

  const prefix = (folder || '').replace(/[^\w/.-]+/g, '').replace(/^\/+|\/+$/g, '');
  const name = `${Date.now()}-${base || 'upload'}-${rnd}${ext}`;

  return prefix ? `${prefix}/${name}` : name;
}

// Simple header-based admin guard, if not already defined
function ensureAdmin(req, res, next) {
  const adminKey = process.env.ADMIN_KEY;
  const provided = req.header('x-admin-key');
  if (!adminKey || provided !== adminKey) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  next();
}

async function startUpload(req, res) {
  const { filename, contentType, folder } = req.body || {};
  if (!filename) {
    return res.status(400).json({ error: 'filename is required' });
  }

  try {
    const objectName = safeName(filename, folder);
    // assume this returns { uploadUrl, objectUrl, expiresAt, ... }
    const pars = await createParsForObject(objectName, contentType);

    return res.json({
      uploadUrl: pars.uploadUrl,      // for PUT from browser
      viewUrl: pars.objectUrl,        // what you store + display
      objectName,
      expiresAt: pars.expiresAt || null,
      contentType: contentType || 'application/octet-stream',
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create pre-authenticated request' });
  }
}

module.exports = {
  startUpload,
  ensureAdmin,
};
