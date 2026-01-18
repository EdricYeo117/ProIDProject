// server/services/oci.service.js
const fs = require("fs");
const path = require("path");
const os = require("os");

const { ConfigFileAuthenticationDetailsProvider } = require("oci-common");
const objectStorage = require("oci-objectstorage");

function fileExists(p) {
  try {
    return !!p && fs.existsSync(p);
  } catch {
    return false;
  }
}

function resolveOciConfigPath() {
  // Mode 1: Explicit config file path (local OR Render Secret File)
  if (process.env.OCI_CONFIG_FILE) {
    const p = process.env.OCI_CONFIG_FILE;
    if (!fileExists(p)) {
      throw new Error(`OCI_CONFIG_FILE is set but does not exist: ${p}`);
    }
    return p;
  }

  // Mode 2: Env-only materialization (Render-friendly)
  const cfgText = process.env.OCI_CONFIG_TEXT;
  const keyText = process.env.OCI_API_KEY_PEM;
  if (cfgText && keyText) {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "oci-"));
    const cfgPath = path.join(dir, "config");
    const keyPath = path.join(dir, "oci_api_key.pem");

    fs.writeFileSync(keyPath, keyText, { mode: 0o600 });

    let fixedCfg = cfgText;
    if (/^\s*key_file\s*=/im.test(fixedCfg)) {
      fixedCfg = fixedCfg.replace(
        /^\s*key_file\s*=.*$/im,
        `key_file=${keyPath}`,
      );
    } else {
      fixedCfg = `${fixedCfg.trim()}\nkey_file=${keyPath}\n`;
    }

    fs.writeFileSync(cfgPath, fixedCfg, { mode: 0o600 });
    return cfgPath;
  }

  // Mode 3: Local default ~/.oci/config (only if it exists)
  const home = process.env.HOME || process.env.USERPROFILE;
  const fallback = home ? path.resolve(home, ".oci", "config") : null;
  if (fileExists(fallback)) return fallback;

  // Nothing available -> clear actionable error
  throw new Error(
    [
      "OCI credentials not configured.",
      "Set ONE of the following:",
      "  (A) OCI_CONFIG_FILE=/absolute/path/to/oci/config",
      "  (B) OCI_CONFIG_TEXT (full config content) AND OCI_API_KEY_PEM (full private key PEM).",
      `Tried fallback ${fallback || "<no HOME/USERPROFILE>"}, but it was missing.`,
    ].join("\n"),
  );
}

const configPath = resolveOciConfigPath();
const profile = process.env.OCI_CONFIG_PROFILE || "DEFAULT";

const authProvider = new ConfigFileAuthenticationDetailsProvider(
  configPath,
  profile,
);

const client = new objectStorage.ObjectStorageClient({
  authenticationDetailsProvider: authProvider,
});
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

async function createParsForObject(
  objectName,
  contentType = "application/octet-stream",
) {
  if (!process.env.OCI_REGION || !NAMESPACE || !BUCKET) {
    throw new Error("Missing OCI_REGION / OCI_NAMESPACE / OCI_BUCKET in env");
  }

  const uploadReq = {
    namespaceName: NAMESPACE,
    bucketName: BUCKET,
    createPreauthenticatedRequestDetails: {
      name: `upload-${objectName}-${Date.now()}`,
      accessType:
        objectStorage.models.CreatePreauthenticatedRequestDetails.AccessType
          .ObjectWrite,
      bucketListingAction:
        objectStorage.models.CreatePreauthenticatedRequestDetails
          .BucketListingAction.Deny,
      timeExpires: expiresIn(Number(process.env.OCI_PAR_UPLOAD_TTL_MIN || 15)),
      objectName,
    },
  };

  const upload = await client.createPreauthenticatedRequest(uploadReq);
  const uploadUrl = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${upload.preauthenticatedRequest.accessUri}`;

  const readReq = {
    namespaceName: NAMESPACE,
    bucketName: BUCKET,
    createPreauthenticatedRequestDetails: {
      name: `view-${objectName}-${Date.now()}`,
      accessType:
        objectStorage.models.CreatePreauthenticatedRequestDetails.AccessType
          .ObjectRead,
      bucketListingAction:
        objectStorage.models.CreatePreauthenticatedRequestDetails
          .BucketListingAction.Deny,
      timeExpires: expiresInDays(
        Number(process.env.OCI_PAR_VIEW_TTL_DAYS || 365),
      ),
      objectName,
    },
  };

  const read = await client.createPreauthenticatedRequest(readReq);
  const viewUrl = `https://objectstorage.${process.env.OCI_REGION}.oraclecloud.com${read.preauthenticatedRequest.accessUri}`;

  return { uploadUrl, viewUrl, objectName, contentType };
}

module.exports = { createParsForObject };
