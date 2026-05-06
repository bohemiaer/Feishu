"use strict";

const fs = require("fs");
const path = require("path");
const Ajv2020 = require("ajv/dist/2020");

const SCHEMA_DIR = path.resolve(__dirname, "../../schemas");
const MANIFEST_PATH = path.join(SCHEMA_DIR, "schema_manifest.json");
const FILE_EXTENSION = ".json";

const ajv = new Ajv2020({
  allErrors: true,
  strict: false
});

let manifestCache = null;
let validatorCache = null;

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function readJsonFile(filePath) {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function loadManifest() {
  if (!manifestCache) {
    manifestCache = readJsonFile(MANIFEST_PATH);
  }
  return manifestCache;
}

function inferArtifactName(filePath) {
  const baseName = path.basename(filePath, FILE_EXTENSION);
  return baseName.endsWith(".schema") ? baseName.slice(0, -".schema".length) : baseName;
}

function getArtifactContract(artifactName) {
  const manifest = loadManifest();
  const contract = manifest.artifacts[artifactName];
  if (!contract) {
    const known = Object.keys(manifest.artifacts).sort().join(", ");
    throw new Error(`Unknown schema artifact "${artifactName}". Known artifacts: ${known}`);
  }
  return contract;
}

function loadValidatorCache() {
  if (validatorCache) {
    return validatorCache;
  }

  const manifest = loadManifest();
  validatorCache = {};

  Object.entries(manifest.artifacts).forEach(([artifactName, contract]) => {
    const schemaPath = path.join(SCHEMA_DIR, contract.schema_file);
    const schema = readJsonFile(schemaPath);
    validatorCache[artifactName] = {
      contract,
      schemaPath,
      validate: ajv.compile(schema)
    };
  });

  return validatorCache;
}

function formatValidationErrors(errors = []) {
  return errors.map((error) => {
    const location = error.instancePath || "/";
    const detail = error.message || "validation error";
    if (error.keyword === "required" && error.params && error.params.missingProperty) {
      return `${location} missing required property "${error.params.missingProperty}"`;
    }
    if (error.keyword === "additionalProperties" && error.params && error.params.additionalProperty) {
      return `${location} has unsupported property "${error.params.additionalProperty}"`;
    }
    return `${location} ${detail}`;
  });
}

function validateArtifact(artifactName, payload) {
  const cache = loadValidatorCache();
  const validatorEntry = cache[artifactName];
  if (!validatorEntry) {
    throw new Error(`Validator for artifact "${artifactName}" is not available.`);
  }

  const valid = validatorEntry.validate(payload);
  return {
    valid: Boolean(valid),
    schema_bundle_version: getSchemaBundleVersion(),
    schema_file: path.basename(validatorEntry.schemaPath),
    validation_mode: validatorEntry.contract.validation_mode,
    errors: valid ? [] : formatValidationErrors(validatorEntry.validate.errors || [])
  };
}

function assertArtifactValid(artifactName, payload, context = {}) {
  const result = validateArtifact(artifactName, payload);
  if (result.valid) {
    return payload;
  }

  const location = context.filePath
    ? ` file=${context.filePath}`
    : "";
  const stage = context.stage
    ? ` stage=${context.stage}`
    : "";
  throw new Error(
    `Schema validation failed for artifact "${artifactName}"${stage}${location} ` +
    `(bundle=${result.schema_bundle_version}, schema=${result.schema_file}, mode=${result.validation_mode}). ` +
    `Errors: ${result.errors.join("; ")}`
  );
}

function readArtifactJson(filePath, artifactName = inferArtifactName(filePath)) {
  const payload = readJsonFile(filePath);
  return assertArtifactValid(artifactName, payload, {
    filePath,
    stage: "read"
  });
}

function writeArtifactJson(filePath, payload, artifactName = inferArtifactName(filePath)) {
  const validatedPayload = assertArtifactValid(artifactName, payload, {
    filePath,
    stage: "write"
  });
  ensureDir(path.dirname(filePath));
  fs.writeFileSync(filePath, JSON.stringify(validatedPayload, null, 2), "utf8");
  return validatedPayload;
}

function getSchemaBundleVersion() {
  return loadManifest().schema_bundle_version;
}

function listArtifactContracts() {
  return loadManifest().artifacts;
}

module.exports = {
  assertArtifactValid,
  getArtifactContract,
  getSchemaBundleVersion,
  inferArtifactName,
  listArtifactContracts,
  readArtifactJson,
  validateArtifact,
  writeArtifactJson
};
