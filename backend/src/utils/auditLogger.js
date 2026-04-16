const fs = require("node:fs");
const path = require("node:path");

const configuredDir = process.env.AML_AUDIT_DIR;
const defaultDir = process.platform === "win32"
  ? path.join(process.cwd(), "aml_audit")
  : "/var/log/aml_audit";

const auditDirectory = configuredDir || defaultDir;

function ensureAuditDirectory() {
  fs.mkdirSync(auditDirectory, { recursive: true });
}

function writeAuditEntry(entry) {
  ensureAuditDirectory();
  const dateKey = new Date().toISOString().slice(0, 10);
  const filePath = path.join(auditDirectory, `aml-audit-${dateKey}.log`);
  fs.appendFileSync(filePath, `${JSON.stringify(entry)}\n`, "utf8");
  return filePath;
}

module.exports = {
  auditDirectory,
  writeAuditEntry,
};
