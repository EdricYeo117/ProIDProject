// server/services/oci.service.js
const fs = require('fs');
const os = require('os');
const path = require('path');
const common = require('oci-common');
const objectStorage = require('oci-objectstorage');
const { v4: uuid } = require('uuid');

const { OCI_REGION, OCI_NAMESPACE, OCI_BUCKET } = process.env;

let client; // lazy singleton

function expandHome(p) {
  if (!p) return p;
  if (p.startsWith('~')) return path.join(os.homedir(), p.slice(1));
  return p;
}

function getClient() {
  if (client) return client;

  // 1) Config-file auth if OCI_CONFIG_FILE exists
  const cfgPath = expandHome(process.env.OCI_CONFIG_FILE || path.join(os.homedir(), '.oci', 'config'));
  const profile = process.env.OCI_PROFILE || 'DEFAULT';
  if (fs.existsSync(cfgPath)) {
    const provider = new common.ConfigFileAuthenticationDetailsProvider(cfgPath, profile);
    client = new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
    client.regionId = OCI_REGION;
    return client;
  }

  // 2) Simple auth via env vars (no config file)
  const { OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_PRIVATE_KEY_PEM, OCI_PRIVATE_KEY_PASSPHRASE } = process.env;
  if (OCI_TENANCY_OCID && OCI_USER_OCID && OCI_FINGERPRINT && OCI_PRIVATE_KEY_PEM) {
    const provider = new common.SimpleAuthenticationDetailsProvider(
      OCI_TENANCY_OCID,
      OCI_USER_OCID,
      OCI_FINGERPRINT,
      OCI_PRIVATE_KEY_PEM,
      OCI_PRIVATE_KEY_PASSPHRASE || null,
      OCI_REGION
    );
    client = new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
    client.regionId = OCI_REGION;
    return client;
  }

  // 3) (Optional) Instance principals if you run on OCI compute
  // const provider = new common.InstancePrincipalsAuthenticationDetailsProvider();
  // client = new objectStorage.ObjectStorageClient({ authenticationDetailsProvider: provider });
  // client.regionId = OCI_REGION;

  throw new Error(
    `OCI auth not configured. Provide either:
     - OCI_CONFIG_FILE (and ensure it exists), or
     - OCI_TENANCY_OCID, OCI_USER_OCID, OCI_FINGERPRINT, OCI_PRIVATE_KEY_PEM`
  );
}

async function createUploadPar({ prefix = 'persons/' } = {}) {
  const c = getClient();
  const objectName = `${prefix}${uuid()}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

  const resp = await c.createPreauthenticatedRequest({
    namespaceName: OCI_NAMESPACE,
    bucketName: OCI_BUCKET,
    createPreauthenticatedRequestDetails: {
      name: `upload-${objectName}`,
      accessType: objectStorage.models.CreatePreauthenticatedRequestDetails.AccessType.ObjectWrite,
      objectName,
      timeExpires: expiresAt,
    },
  });

  const uploadUrl = `https://objectstorage.${OCI_REGION}.oraclecloud.com${resp.preauthenticatedRequest.accessUri}`;
  const objectUrl = `https://objectstorage.${OCI_REGION}.oraclecloud.com/n/${OCI_NAMESPACE}/b/${OCI_BUCKET}/o/${encodeURIComponent(objectName)}`;

  return { uploadUrl, objectUrl, objectName, expiresAt };
}

module.exports = { createUploadPar };
