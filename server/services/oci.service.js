const { ConfigFileAuthenticationDetailsProvider } = require('oci-common');
const objectStorage = require('oci-objectstorage');
const path = require('path');

const authProvider = new ConfigFileAuthenticationDetailsProvider(
  process.env.OCI_CONFIG_FILE || path.resolve(process.env.HOME || process.env.USERPROFILE, '.oci', 'config'),
  process.env.OCI_CONFIG_PROFILE || 'DEFAULT'
);

const client = new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: authProvider });
client.regionId = process.env.OCI_REGION;

const NAMESPACE = process.env.OCI_NAMESPACE;
const BUCKET = process.env.OCI_BUCKET;

function expiresIn(minutes) {
  const d = new Date();
  d.setMinutes(d.getMinutes() + minutes);
  return d;
}
function expiresInDays(days) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Create two PARs for a specific object:
 *  - upload PAR (WRITE, short TTL)
 *  - view PAR (READ, long TTL)
 * Returns { uploadUrl, viewUrl, objectName }
 */
async function createParsForObject(objectName, contentType = 'application/octet-stream') {
  // --- WRITE (PUT) PAR
  const uploadReq = {
    namespaceName: NAMESPACE,
    bucketName: BUCKET,
    createPreauthenticatedRequestDetails: {
      name: `upload-${objectName}-${Date.now()}`,
      accessType: objectStorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
      bucketListingAction: objectStorage.models.CreatePreauthenticatedRequestDetails.BucketListingAction.Deny,
      timeExpires: expiresIn(Number(process.env.OCI_PAR_UPLOAD_TTL_MIN || 15)),
      objectName: objectName
    }
  };
  const upload = await client.createPreauthenticatedRequest(uploadReq);
  const uploadUrl = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${upload.preauthenticatedRequest.accessUri}`;

  // --- READ PAR (long-living view URL)
  const readReq = {
    namespaceName: NAMESPACE,
    bucketName: BUCKET,
    createPreauthenticatedRequestDetails: {
      name: `view-${objectName}-${Date.now()}`,
      accessType: objectStorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectRead,
      bucketListingAction: objectStorage.models.CreatePreauthenticatedRequestDetails.BucketListingAction.Deny,
      timeExpires: expiresInDays(Number(process.env.OCI_PAR_VIEW_TTL_DAYS || 365)),
      objectName: objectName
    }
  };
  const read = await client.createPreauthenticatedRequest(readReq);
  const viewUrl = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${read.preauthenticatedRequest.accessUri}`;

  return { uploadUrl, viewUrl, objectName, contentType };
}

module.exports = { createParsForObject };
