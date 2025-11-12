const { createParsForObject } = require('../services/oci.service');
const crypto = require('crypto');
const path = require('path');

function safeName(filename) {
  const ext = path.extname(filename || '').toLowerCase() || '.bin';
  const base = (filename || 'file').replace(/[^\w.-]+/g, '_').slice(0, 40).replace(/^_+/, '');
  const rnd = crypto.randomBytes(6).toString('hex');
  return `${Date.now()}-${base || 'upload'}-${rnd}${ext}`;
}

async function getUploadPar(req, res) {
  const { filename, contentType } = req.body || {};
  if (!filename) return res.status(400).json({ error: 'filename is required' });

  try {
    const objectName = safeName(filename);
    const pars = await createParsForObject(objectName, contentType);
    res.json(pars);
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: 'Failed to create pre-authenticated request' });
  }
}

module.exports = { getUploadPar };
