// ../plugin/src/shared/logger.ts
import * as fs from "node:fs";
import * as path2 from "node:path";

// ../plugin/src/shared/data-path.ts
import { existsSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import * as os from "node:os";
import * as path from "node:path";

// ../plugin/src/shared/harness.ts
var currentHarness = "opencode";
var harnessLocked = false;
function setHarness(value) {
  if (harnessLocked && currentHarness !== value) {
    throw new Error(`Magic Context: harness already locked to "${currentHarness}"; cannot change to "${value}"`);
  }
  currentHarness = value;
  harnessLocked = true;
}
function getHarness() {
  return currentHarness;
}

// ../plugin/src/shared/data-path.ts
function getDataDir() {
  return process.env.XDG_DATA_HOME ?? path.join(os.homedir(), ".local", "share");
}
function getMagicContextTempDir(harness = getHarness()) {
  return path.join(os.tmpdir(), harness, "magic-context");
}
function getMagicContextLogPath(harness = getHarness()) {
  const envPath = process.env.MAGIC_CONTEXT_LOG_PATH?.trim();
  if (envPath)
    return envPath;
  return path.join(getMagicContextTempDir(harness), "magic-context.log");
}
function getProjectMagicContextDir(directory) {
  return path.join(directory, ".cortexkit", "magic-context");
}
var GITIGNORE_GUARD_OPEN = "# >>> cortexkit:magic-context";
var GITIGNORE_GUARD_CLOSE = "# <<< cortexkit:magic-context";
function ensureCortexKitArtifactGitignore(directory) {
  try {
    const cortexKitDir = path.join(directory, ".cortexkit");
    const gitignorePath = path.join(cortexKitDir, ".gitignore");
    let existing = "";
    if (existsSync(gitignorePath)) {
      existing = readFileSync(gitignorePath, "utf8");
      if (existing.includes(GITIGNORE_GUARD_OPEN))
        return;
    }
    const block = `${GITIGNORE_GUARD_OPEN}
magic-context/
${GITIGNORE_GUARD_CLOSE}
`;
    const needsLeadingNewline = existing.length > 0 && !existing.endsWith(`
`);
    const next = existing + (needsLeadingNewline ? `
` : "") + block;
    mkdirSync(cortexKitDir, { recursive: true });
    writeFileSync(gitignorePath, next, "utf8");
  } catch {}
}
function getProjectMagicContextHistorianDir(directory) {
  return path.join(getProjectMagicContextDir(directory), "historian");
}
function getOpenCodeStorageDir() {
  return path.join(getDataDir(), "opencode", "storage");
}
function getMagicContextStorageResolution() {
  const testDataDir = process.env.MAGIC_CONTEXT_TEST_DATA_DIR?.trim();
  if (testDataDir) {
    const perTestDataHome = process.env.XDG_DATA_HOME?.trim();
    if (perTestDataHome && path.resolve(perTestDataHome) !== path.resolve(testDataDir)) {
      return {
        path: path.join(perTestDataHome, "cortexkit", "magic-context"),
        source: "test isolation"
      };
    }
    return {
      path: path.join(testDataDir, "cortexkit", "magic-context"),
      source: "test isolation"
    };
  }
  if (false) {}
  const explicitStorageDir = process.env.MAGIC_CONTEXT_STORAGE_DIR?.trim();
  if (explicitStorageDir) {
    if (!path.isAbsolute(explicitStorageDir)) {
      throw new Error("MAGIC_CONTEXT_STORAGE_DIR must be an absolute path");
    }
    return { path: explicitStorageDir, source: "environment override" };
  }
  const xdgDataHome = process.env.XDG_DATA_HOME?.trim();
  if (xdgDataHome) {
    return {
      path: path.join(xdgDataHome, "cortexkit", "magic-context"),
      source: "XDG_DATA_HOME"
    };
  }
  return {
    path: path.join(os.homedir(), ".local", "share", "cortexkit", "magic-context"),
    source: "platform default"
  };
}
function getMagicContextStorageDir() {
  return getMagicContextStorageResolution().path;
}
function getLegacyOpenCodeMagicContextStorageDir() {
  return path.join(getOpenCodeStorageDir(), "plugin", "magic-context");
}

// ../plugin/src/shared/redaction.ts
import { homedir as homedir2, userInfo } from "node:os";
function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
var SECRET_WORDS = [
  "key",
  "token",
  "secret",
  "password",
  "auth",
  "authorization",
  "bearer",
  "credential"
];
var SECRET_SEGMENT_PATTERN = new RegExp(`^(?:${SECRET_WORDS.map((w) => `${w}s?`).join("|")})$`, "i");
var TRAILING_DESCRIPTORS = new Set(["id", "ids", "value", "values", "header", "headers"]);
function redactionTypeForKey(key) {
  const normalized = key.trim().toLowerCase().replace(/[^a-z0-9_.-]+/g, "_");
  const suffix = normalized.split(".").filter(Boolean).at(-1) ?? normalized;
  return suffix || "secret";
}
function isNonSecretScalarValue(value) {
  const v = value.trim();
  if (v === "true" || v === "false" || v === "null" || v === "undefined")
    return true;
  return /^[+-]?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?$/.test(v);
}
var SECRET_QUALIFIERS = new Set([
  "api",
  "access",
  "private",
  "client",
  "auth",
  "authorization",
  "secret",
  "bearer",
  "session",
  "refresh",
  "service",
  "x",
  "openai",
  "anthropic",
  "google",
  "github",
  "huggingface",
  "aws",
  "azure"
]);
function isSecretKey(key) {
  const segments = key.replace(/([a-z0-9])([A-Z])/g, "$1_$2").toLowerCase().split(/[._-]+/).filter(Boolean);
  if (segments.length === 0)
    return false;
  if (segments.length === 1) {
    const first = segments[0];
    return Boolean(first && SECRET_SEGMENT_PATTERN.test(first));
  }
  for (let i = 0;i < segments.length; i++) {
    const seg = segments[i];
    if (!seg || !SECRET_SEGMENT_PATTERN.test(seg))
      continue;
    let trailingOk = true;
    for (let j = i + 1;j < segments.length; j++) {
      const tail = segments[j];
      if (!tail)
        continue;
      if (TRAILING_DESCRIPTORS.has(tail))
        continue;
      if (SECRET_SEGMENT_PATTERN.test(tail))
        continue;
      trailingOk = false;
      break;
    }
    if (!trailingOk)
      continue;
    for (let k = i - 1;k >= 0; k--) {
      const lead = segments[k];
      if (lead && SECRET_QUALIFIERS.has(lead))
        return true;
    }
  }
  return false;
}
function sanitizePathString(value) {
  const home = process.env.HOME || process.env.USERPROFILE || homedir2();
  const username = userInfo().username;
  let sanitized = value;
  if (home) {
    sanitized = sanitized.replace(new RegExp(escapeRegex(home), "g"), "~");
  }
  sanitized = sanitized.replace(/\/Users\/[^/]+\//g, "/Users/<USER>/");
  sanitized = sanitized.replace(/\/home\/[^/]+\//g, "/home/<USER>/");
  sanitized = sanitized.replace(/C:\\Users\\[^\\]+\\/g, "C:\\Users\\<USER>\\");
  if (username) {
    sanitized = sanitized.replace(new RegExp(escapeRegex(username), "g"), "<USER>");
  }
  return sanitized;
}
var SECRET_TEXT_PATTERNS = [
  {
    pattern: /\bsk-ant-(?:api03-)?[A-Za-z0-9_-]{32,}/g,
    replacement: "<ANTHROPIC_API_KEY_REDACTED>"
  },
  {
    pattern: /\bsk-(?:proj-)?[A-Za-z0-9_-]{12,}/g,
    replacement: "<OPENAI_API_KEY_REDACTED>"
  },
  {
    pattern: /\bgithub_pat_[A-Za-z0-9_]{20,}/g,
    replacement: "<GITHUB_PAT_REDACTED>"
  },
  {
    pattern: /\b(?:gh[opsu]|ghr)_[A-Za-z0-9]{30,}/g,
    replacement: "<GITHUB_TOKEN_REDACTED>"
  },
  {
    pattern: /\bhf_[A-Za-z0-9]{30,}/g,
    replacement: "<HUGGINGFACE_TOKEN_REDACTED>"
  },
  {
    pattern: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/g,
    replacement: "<AWS_ACCESS_KEY_ID_REDACTED>"
  },
  {
    pattern: /\bxox[abprsuvc]-[A-Za-z0-9-]{10,}/g,
    replacement: "<SLACK_TOKEN_REDACTED>"
  },
  {
    pattern: /\bAIza[A-Za-z0-9_-]{35}\b/g,
    replacement: "<GOOGLE_API_KEY_REDACTED>"
  },
  {
    pattern: /\b(Authorization\s*:\s*Bearer\s+)([A-Za-z0-9._~+/=-]{8,})/gi,
    replacement: (_full, prefix) => `${prefix}<REDACTED:bearer>`
  },
  {
    pattern: /\beyJ[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+/g,
    replacement: "<JWT_REDACTED>"
  },
  {
    pattern: /(["'])([^"']*(?:key|token|secret|password|auth|bearer|credential)[^"']*)\1(\s*:\s*)(["'])([^"']*)\4/gi,
    replacement: (full, quote, key, separator, valueQuote, value) => isNonSecretScalarValue(value) ? full : `${quote}${key}${quote}${separator}${valueQuote}<REDACTED:${redactionTypeForKey(key)}>${valueQuote}`
  },
  {
    pattern: /\b([A-Za-z0-9_.-]*(?:key|token|secret|password|auth|bearer|credential)[A-Za-z0-9_.-]*)\s*=\s*([^\s'"`]+)/gi,
    replacement: (full, key, value) => isNonSecretScalarValue(value) ? full : `${key}=<REDACTED:${redactionTypeForKey(key)}>`
  }
];
function redactSecretText(value) {
  let redacted = value;
  for (const { pattern, replacement } of SECRET_TEXT_PATTERNS) {
    if (typeof replacement === "string") {
      redacted = redacted.replace(pattern, replacement);
    } else {
      redacted = redacted.replace(pattern, replacement);
    }
  }
  return redacted;
}
function sanitizeDiagnosticText(value) {
  return redactSecretText(sanitizePathString(value));
}
var SHAREABILITY_SENSITIVE_PATTERNS = [
  /\bC:\/Users\/[^/\s]+/i,
  /(?:^|\s)~\/[^\s]+/,
  /\b(?:api[_-]?key|secret|token|password|passwd|pwd|client[_-]?secret|access[_-]?key)\b\s*[:=]\s*\S+/i,
  /\b(?:localhost|127\.0\.0\.1|0\.0\.0\.0|\[::1\])(?::\d+)?\b/i,
  /\b(?:10|127)\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/,
  /\b192\.168\.\d{1,3}\.\d{1,3}\b/,
  /\b172\.(?:1[6-9]|2\d|3[01])\.\d{1,3}\.\d{1,3}\b/
];
function hasShareabilitySensitiveText(text) {
  try {
    if (sanitizeDiagnosticText(text) !== text)
      return true;
    return SHAREABILITY_SENSITIVE_PATTERNS.some((pattern) => pattern.test(text));
  } catch {
    return true;
  }
}
function sanitizeConfigValue(value, keyPath = []) {
  if (value === null || typeof value === "number" || typeof value === "boolean")
    return value;
  const key = keyPath.at(-1) ?? "";
  if (key && isSecretKey(key)) {
    return `<REDACTED:${redactionTypeForKey(key)}>`;
  }
  if (typeof value === "string")
    return sanitizeDiagnosticText(value);
  if (Array.isArray(value)) {
    return value.map((entry, index) => sanitizeConfigValue(entry, [...keyPath, String(index)]));
  }
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).map(([entryKey, entry]) => [
      entryKey,
      sanitizeConfigValue(entry, [...keyPath, entryKey])
    ]));
  }
  return value;
}

// ../plugin/src/shared/logger.ts
var isTestEnv = false;
var buffer = [];
var flushTimer = null;
var FLUSH_INTERVAL_MS = 500;
var BUFFER_SIZE_LIMIT = 50;
var MAX_LOG_FILE_BYTES = 32 * 1024 * 1024;
var SIZE_CHECK_INTERVAL_FLUSHES = 64;
var activeLogFile = null;
var activeLogSize = null;
var flushesSinceSizeCheck = 0;
var swallowedWriteCount = 0;
var lastErrorMessage = null;
var lastErrorTime = null;
function recordSwallowedWrite(error) {
  try {
    swallowedWriteCount++;
    lastErrorMessage = sanitizeDiagnosticText(error instanceof Error ? error.message : String(error));
    lastErrorTime = new Date().toISOString();
  } catch {}
}
function ensureDir(filePath) {
  fs.mkdirSync(path2.dirname(filePath), { recursive: true });
}
function isMissingFile(error) {
  return typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT";
}
function getCurrentLogSize(logFile) {
  if (activeLogFile === logFile && activeLogSize !== null && flushesSinceSizeCheck < SIZE_CHECK_INTERVAL_FLUSHES) {
    return activeLogSize;
  }
  try {
    const stat = fs.statSync(logFile);
    if (!stat.isFile()) {
      throw new Error(`Magic Context log path is not a regular file: ${logFile}`);
    }
    fs.chmodSync(logFile, 384);
    activeLogFile = logFile;
    activeLogSize = stat.size;
    flushesSinceSizeCheck = 0;
    return stat.size;
  } catch (error) {
    if (!isMissingFile(error))
      throw error;
    activeLogFile = logFile;
    activeLogSize = 0;
    flushesSinceSizeCheck = 0;
    return 0;
  }
}
function capLogData(data) {
  if (Buffer.byteLength(data) <= MAX_LOG_FILE_BYTES)
    return data;
  let bounded = Buffer.from(data).subarray(0, MAX_LOG_FILE_BYTES).toString("utf8");
  while (Buffer.byteLength(bounded) > MAX_LOG_FILE_BYTES) {
    bounded = bounded.slice(0, -1);
  }
  return bounded;
}
function writeBoundedPredecessor(logFile, predecessorPath, size) {
  const predecessorFd = fs.openSync(predecessorPath, "w", 384);
  try {
    fs.fchmodSync(predecessorFd, 384);
    const bytesToCopy = Math.min(size, MAX_LOG_FILE_BYTES);
    const sourceFd = fs.openSync(logFile, "r");
    try {
      const chunk = Buffer.allocUnsafe(Math.min(64 * 1024, bytesToCopy));
      let remaining = bytesToCopy;
      let position = Math.max(0, size - bytesToCopy);
      while (remaining > 0) {
        const bytesRead = fs.readSync(sourceFd, chunk, 0, Math.min(chunk.length, remaining), position);
        if (bytesRead === 0)
          break;
        fs.writeSync(predecessorFd, chunk, 0, bytesRead);
        remaining -= bytesRead;
        position += bytesRead;
      }
    } finally {
      fs.closeSync(sourceFd);
    }
  } finally {
    fs.closeSync(predecessorFd);
  }
}
function rotateLogFile(logFile, size) {
  const predecessorPath = `${logFile}.1`;
  writeBoundedPredecessor(logFile, predecessorPath, size);
  fs.truncateSync(logFile, 0);
  activeLogSize = 0;
  flushesSinceSizeCheck = 0;
}
function flush() {
  if (flushTimer) {
    clearTimeout(flushTimer);
    flushTimer = null;
  }
  if (buffer.length === 0)
    return;
  const bufferedData = buffer.join("");
  buffer = [];
  try {
    const data = capLogData(bufferedData);
    const logFile = getMagicContextLogPath();
    ensureDir(logFile);
    let currentSize = getCurrentLogSize(logFile);
    const dataSize = Buffer.byteLength(data);
    if (currentSize > 0 && currentSize + dataSize > MAX_LOG_FILE_BYTES) {
      rotateLogFile(logFile, currentSize);
      currentSize = 0;
    }
    fs.appendFileSync(logFile, data, { encoding: "utf8", mode: 384 });
    activeLogFile = logFile;
    activeLogSize = currentSize + dataSize;
    flushesSinceSizeCheck++;
  } catch (error) {
    activeLogFile = null;
    activeLogSize = null;
    flushesSinceSizeCheck = 0;
    recordSwallowedWrite(error);
  }
}
function scheduleFlush() {
  if (flushTimer)
    return;
  flushTimer = setTimeout(() => {
    flushTimer = null;
    flush();
  }, FLUSH_INTERVAL_MS);
}
function log(message, data) {
  if (isTestEnv)
    return;
  try {
    const timestamp = new Date().toISOString();
    const serialized = data === undefined ? "" : data instanceof Error ? ` ${sanitizeDiagnosticText(`${data.message}${data.stack ? `
${data.stack}` : ""}`)}` : ` ${JSON.stringify(sanitizeConfigValue(data))}`;
    buffer.push(`[${timestamp}] ${sanitizeDiagnosticText(message)}${serialized}
`);
    if (buffer.length >= BUFFER_SIZE_LIMIT) {
      flush();
    } else {
      scheduleFlush();
    }
  } catch {}
}
function sessionLog(sessionId, message, data) {
  log(`[magic-context][${sessionId}] ${message}`, data);
}
if (!isTestEnv) {
  process.on("exit", flush);
}

// ../plugin/src/config/migrate-config-location.ts
import { homedir as homedir3 } from "node:os";
import { basename, dirname as dirname2, isAbsolute as isAbsolute2, join as join2 } from "node:path";

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/scanner.js
function createScanner(text, ignoreTrivia = false) {
  const len = text.length;
  let pos = 0, value = "", tokenOffset = 0, token = 16, lineNumber = 0, lineStartOffset = 0, tokenLineStartOffset = 0, prevTokenLineStartOffset = 0, scanError = 0;
  function scanHexDigits(count, exact) {
    let digits = 0;
    let value = 0;
    while (digits < count || !exact) {
      let ch = text.charCodeAt(pos);
      if (ch >= 48 && ch <= 57) {
        value = value * 16 + ch - 48;
      } else if (ch >= 65 && ch <= 70) {
        value = value * 16 + ch - 65 + 10;
      } else if (ch >= 97 && ch <= 102) {
        value = value * 16 + ch - 97 + 10;
      } else {
        break;
      }
      pos++;
      digits++;
    }
    if (digits < count) {
      value = -1;
    }
    return value;
  }
  function setPosition(newPosition) {
    pos = newPosition;
    value = "";
    tokenOffset = 0;
    token = 16;
    scanError = 0;
  }
  function scanNumber() {
    let start = pos;
    if (text.charCodeAt(pos) === 48) {
      pos++;
    } else {
      pos++;
      while (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
      }
    }
    if (pos < text.length && text.charCodeAt(pos) === 46) {
      pos++;
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
      } else {
        scanError = 3;
        return text.substring(start, pos);
      }
    }
    let end = pos;
    if (pos < text.length && (text.charCodeAt(pos) === 69 || text.charCodeAt(pos) === 101)) {
      pos++;
      if (pos < text.length && text.charCodeAt(pos) === 43 || text.charCodeAt(pos) === 45) {
        pos++;
      }
      if (pos < text.length && isDigit(text.charCodeAt(pos))) {
        pos++;
        while (pos < text.length && isDigit(text.charCodeAt(pos))) {
          pos++;
        }
        end = pos;
      } else {
        scanError = 3;
      }
    }
    return text.substring(start, end);
  }
  function scanString() {
    let result = "", start = pos;
    while (true) {
      if (pos >= len) {
        result += text.substring(start, pos);
        scanError = 2;
        break;
      }
      const ch = text.charCodeAt(pos);
      if (ch === 34) {
        result += text.substring(start, pos);
        pos++;
        break;
      }
      if (ch === 92) {
        result += text.substring(start, pos);
        pos++;
        if (pos >= len) {
          scanError = 2;
          break;
        }
        const ch2 = text.charCodeAt(pos++);
        switch (ch2) {
          case 34:
            result += '"';
            break;
          case 92:
            result += "\\";
            break;
          case 47:
            result += "/";
            break;
          case 98:
            result += "\b";
            break;
          case 102:
            result += "\f";
            break;
          case 110:
            result += `
`;
            break;
          case 114:
            result += "\r";
            break;
          case 116:
            result += "\t";
            break;
          case 117:
            const ch3 = scanHexDigits(4, true);
            if (ch3 >= 0) {
              result += String.fromCharCode(ch3);
            } else {
              scanError = 4;
            }
            break;
          default:
            scanError = 5;
        }
        start = pos;
        continue;
      }
      if (ch >= 0 && ch <= 31) {
        if (isLineBreak(ch)) {
          result += text.substring(start, pos);
          scanError = 2;
          break;
        } else {
          scanError = 6;
        }
      }
      pos++;
    }
    return result;
  }
  function scanNext() {
    value = "";
    scanError = 0;
    tokenOffset = pos;
    lineStartOffset = lineNumber;
    prevTokenLineStartOffset = tokenLineStartOffset;
    if (pos >= len) {
      tokenOffset = len;
      return token = 17;
    }
    let code = text.charCodeAt(pos);
    if (isWhiteSpace(code)) {
      do {
        pos++;
        value += String.fromCharCode(code);
        code = text.charCodeAt(pos);
      } while (isWhiteSpace(code));
      return token = 15;
    }
    if (isLineBreak(code)) {
      pos++;
      value += String.fromCharCode(code);
      if (code === 13 && text.charCodeAt(pos) === 10) {
        pos++;
        value += `
`;
      }
      lineNumber++;
      tokenLineStartOffset = pos;
      return token = 14;
    }
    switch (code) {
      case 123:
        pos++;
        return token = 1;
      case 125:
        pos++;
        return token = 2;
      case 91:
        pos++;
        return token = 3;
      case 93:
        pos++;
        return token = 4;
      case 58:
        pos++;
        return token = 6;
      case 44:
        pos++;
        return token = 5;
      case 34:
        pos++;
        value = scanString();
        return token = 10;
      case 47:
        const start = pos - 1;
        if (text.charCodeAt(pos + 1) === 47) {
          pos += 2;
          while (pos < len) {
            if (isLineBreak(text.charCodeAt(pos))) {
              break;
            }
            pos++;
          }
          value = text.substring(start, pos);
          return token = 12;
        }
        if (text.charCodeAt(pos + 1) === 42) {
          pos += 2;
          const safeLength = len - 1;
          let commentClosed = false;
          while (pos < safeLength) {
            const ch = text.charCodeAt(pos);
            if (ch === 42 && text.charCodeAt(pos + 1) === 47) {
              pos += 2;
              commentClosed = true;
              break;
            }
            pos++;
            if (isLineBreak(ch)) {
              if (ch === 13 && text.charCodeAt(pos) === 10) {
                pos++;
              }
              lineNumber++;
              tokenLineStartOffset = pos;
            }
          }
          if (!commentClosed) {
            pos++;
            scanError = 1;
          }
          value = text.substring(start, pos);
          return token = 13;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
      case 45:
        value += String.fromCharCode(code);
        pos++;
        if (pos === len || !isDigit(text.charCodeAt(pos))) {
          return token = 16;
        }
      case 48:
      case 49:
      case 50:
      case 51:
      case 52:
      case 53:
      case 54:
      case 55:
      case 56:
      case 57:
        value += scanNumber();
        return token = 11;
      default:
        while (pos < len && isUnknownContentCharacter(code)) {
          pos++;
          code = text.charCodeAt(pos);
        }
        if (tokenOffset !== pos) {
          value = text.substring(tokenOffset, pos);
          switch (value) {
            case "true":
              return token = 8;
            case "false":
              return token = 9;
            case "null":
              return token = 7;
          }
          return token = 16;
        }
        value += String.fromCharCode(code);
        pos++;
        return token = 16;
    }
  }
  function isUnknownContentCharacter(code) {
    if (isWhiteSpace(code) || isLineBreak(code)) {
      return false;
    }
    switch (code) {
      case 125:
      case 93:
      case 123:
      case 91:
      case 34:
      case 58:
      case 44:
      case 47:
        return false;
    }
    return true;
  }
  function scanNextNonTrivia() {
    let result;
    do {
      result = scanNext();
    } while (result >= 12 && result <= 15);
    return result;
  }
  return {
    setPosition,
    getPosition: () => pos,
    scan: ignoreTrivia ? scanNextNonTrivia : scanNext,
    getToken: () => token,
    getTokenValue: () => value,
    getTokenOffset: () => tokenOffset,
    getTokenLength: () => pos - tokenOffset,
    getTokenStartLine: () => lineStartOffset,
    getTokenStartCharacter: () => tokenOffset - prevTokenLineStartOffset,
    getTokenError: () => scanError
  };
}
function isWhiteSpace(ch) {
  return ch === 32 || ch === 9;
}
function isLineBreak(ch) {
  return ch === 10 || ch === 13;
}
function isDigit(ch) {
  return ch >= 48 && ch <= 57;
}
var CharacterCodes;
(function(CharacterCodes) {
  CharacterCodes[CharacterCodes["lineFeed"] = 10] = "lineFeed";
  CharacterCodes[CharacterCodes["carriageReturn"] = 13] = "carriageReturn";
  CharacterCodes[CharacterCodes["space"] = 32] = "space";
  CharacterCodes[CharacterCodes["_0"] = 48] = "_0";
  CharacterCodes[CharacterCodes["_1"] = 49] = "_1";
  CharacterCodes[CharacterCodes["_2"] = 50] = "_2";
  CharacterCodes[CharacterCodes["_3"] = 51] = "_3";
  CharacterCodes[CharacterCodes["_4"] = 52] = "_4";
  CharacterCodes[CharacterCodes["_5"] = 53] = "_5";
  CharacterCodes[CharacterCodes["_6"] = 54] = "_6";
  CharacterCodes[CharacterCodes["_7"] = 55] = "_7";
  CharacterCodes[CharacterCodes["_8"] = 56] = "_8";
  CharacterCodes[CharacterCodes["_9"] = 57] = "_9";
  CharacterCodes[CharacterCodes["a"] = 97] = "a";
  CharacterCodes[CharacterCodes["b"] = 98] = "b";
  CharacterCodes[CharacterCodes["c"] = 99] = "c";
  CharacterCodes[CharacterCodes["d"] = 100] = "d";
  CharacterCodes[CharacterCodes["e"] = 101] = "e";
  CharacterCodes[CharacterCodes["f"] = 102] = "f";
  CharacterCodes[CharacterCodes["g"] = 103] = "g";
  CharacterCodes[CharacterCodes["h"] = 104] = "h";
  CharacterCodes[CharacterCodes["i"] = 105] = "i";
  CharacterCodes[CharacterCodes["j"] = 106] = "j";
  CharacterCodes[CharacterCodes["k"] = 107] = "k";
  CharacterCodes[CharacterCodes["l"] = 108] = "l";
  CharacterCodes[CharacterCodes["m"] = 109] = "m";
  CharacterCodes[CharacterCodes["n"] = 110] = "n";
  CharacterCodes[CharacterCodes["o"] = 111] = "o";
  CharacterCodes[CharacterCodes["p"] = 112] = "p";
  CharacterCodes[CharacterCodes["q"] = 113] = "q";
  CharacterCodes[CharacterCodes["r"] = 114] = "r";
  CharacterCodes[CharacterCodes["s"] = 115] = "s";
  CharacterCodes[CharacterCodes["t"] = 116] = "t";
  CharacterCodes[CharacterCodes["u"] = 117] = "u";
  CharacterCodes[CharacterCodes["v"] = 118] = "v";
  CharacterCodes[CharacterCodes["w"] = 119] = "w";
  CharacterCodes[CharacterCodes["x"] = 120] = "x";
  CharacterCodes[CharacterCodes["y"] = 121] = "y";
  CharacterCodes[CharacterCodes["z"] = 122] = "z";
  CharacterCodes[CharacterCodes["A"] = 65] = "A";
  CharacterCodes[CharacterCodes["B"] = 66] = "B";
  CharacterCodes[CharacterCodes["C"] = 67] = "C";
  CharacterCodes[CharacterCodes["D"] = 68] = "D";
  CharacterCodes[CharacterCodes["E"] = 69] = "E";
  CharacterCodes[CharacterCodes["F"] = 70] = "F";
  CharacterCodes[CharacterCodes["G"] = 71] = "G";
  CharacterCodes[CharacterCodes["H"] = 72] = "H";
  CharacterCodes[CharacterCodes["I"] = 73] = "I";
  CharacterCodes[CharacterCodes["J"] = 74] = "J";
  CharacterCodes[CharacterCodes["K"] = 75] = "K";
  CharacterCodes[CharacterCodes["L"] = 76] = "L";
  CharacterCodes[CharacterCodes["M"] = 77] = "M";
  CharacterCodes[CharacterCodes["N"] = 78] = "N";
  CharacterCodes[CharacterCodes["O"] = 79] = "O";
  CharacterCodes[CharacterCodes["P"] = 80] = "P";
  CharacterCodes[CharacterCodes["Q"] = 81] = "Q";
  CharacterCodes[CharacterCodes["R"] = 82] = "R";
  CharacterCodes[CharacterCodes["S"] = 83] = "S";
  CharacterCodes[CharacterCodes["T"] = 84] = "T";
  CharacterCodes[CharacterCodes["U"] = 85] = "U";
  CharacterCodes[CharacterCodes["V"] = 86] = "V";
  CharacterCodes[CharacterCodes["W"] = 87] = "W";
  CharacterCodes[CharacterCodes["X"] = 88] = "X";
  CharacterCodes[CharacterCodes["Y"] = 89] = "Y";
  CharacterCodes[CharacterCodes["Z"] = 90] = "Z";
  CharacterCodes[CharacterCodes["asterisk"] = 42] = "asterisk";
  CharacterCodes[CharacterCodes["backslash"] = 92] = "backslash";
  CharacterCodes[CharacterCodes["closeBrace"] = 125] = "closeBrace";
  CharacterCodes[CharacterCodes["closeBracket"] = 93] = "closeBracket";
  CharacterCodes[CharacterCodes["colon"] = 58] = "colon";
  CharacterCodes[CharacterCodes["comma"] = 44] = "comma";
  CharacterCodes[CharacterCodes["dot"] = 46] = "dot";
  CharacterCodes[CharacterCodes["doubleQuote"] = 34] = "doubleQuote";
  CharacterCodes[CharacterCodes["minus"] = 45] = "minus";
  CharacterCodes[CharacterCodes["openBrace"] = 123] = "openBrace";
  CharacterCodes[CharacterCodes["openBracket"] = 91] = "openBracket";
  CharacterCodes[CharacterCodes["plus"] = 43] = "plus";
  CharacterCodes[CharacterCodes["slash"] = 47] = "slash";
  CharacterCodes[CharacterCodes["formFeed"] = 12] = "formFeed";
  CharacterCodes[CharacterCodes["tab"] = 9] = "tab";
})(CharacterCodes || (CharacterCodes = {}));

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/string-intern.js
var cachedSpaces = new Array(20).fill(0).map((_, index) => {
  return " ".repeat(index);
});
var maxCachedValues = 200;
var cachedBreakLinesWithSpaces = {
  " ": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + " ".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + " ".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + " ".repeat(index);
    })
  },
  "\t": {
    "\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `
` + "\t".repeat(index);
    }),
    "\r": new Array(maxCachedValues).fill(0).map((_, index) => {
      return "\r" + "\t".repeat(index);
    }),
    "\r\n": new Array(maxCachedValues).fill(0).map((_, index) => {
      return `\r
` + "\t".repeat(index);
    })
  }
};
var supportedEols = [`
`, "\r", `\r
`];

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/format.js
function format(documentText, range, options) {
  let initialIndentLevel;
  let formatText;
  let formatTextStart;
  let rangeStart;
  let rangeEnd;
  if (range) {
    rangeStart = range.offset;
    rangeEnd = rangeStart + range.length;
    formatTextStart = rangeStart;
    while (formatTextStart > 0 && !isEOL(documentText, formatTextStart - 1)) {
      formatTextStart--;
    }
    let endOffset = rangeEnd;
    while (endOffset < documentText.length && !isEOL(documentText, endOffset)) {
      endOffset++;
    }
    formatText = documentText.substring(formatTextStart, endOffset);
    initialIndentLevel = computeIndentLevel(formatText, options);
  } else {
    formatText = documentText;
    initialIndentLevel = 0;
    formatTextStart = 0;
    rangeStart = 0;
    rangeEnd = documentText.length;
  }
  const eol = getEOL(options, documentText);
  const eolFastPathSupported = supportedEols.includes(eol);
  let numberLineBreaks = 0;
  let indentLevel = 0;
  let indentValue;
  if (options.insertSpaces) {
    indentValue = cachedSpaces[options.tabSize || 4] ?? repeat(cachedSpaces[1], options.tabSize || 4);
  } else {
    indentValue = "\t";
  }
  const indentType = indentValue === "\t" ? "\t" : " ";
  let scanner = createScanner(formatText, false);
  let hasError = false;
  function newLinesAndIndent() {
    if (numberLineBreaks > 1) {
      return repeat(eol, numberLineBreaks) + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    const amountOfSpaces = indentValue.length * (initialIndentLevel + indentLevel);
    if (!eolFastPathSupported || amountOfSpaces > cachedBreakLinesWithSpaces[indentType][eol].length) {
      return eol + repeat(indentValue, initialIndentLevel + indentLevel);
    }
    if (amountOfSpaces <= 0) {
      return eol;
    }
    return cachedBreakLinesWithSpaces[indentType][eol][amountOfSpaces];
  }
  function scanNext() {
    let token = scanner.scan();
    numberLineBreaks = 0;
    while (token === 15 || token === 14) {
      if (token === 14 && options.keepLines) {
        numberLineBreaks += 1;
      } else if (token === 14) {
        numberLineBreaks = 1;
      }
      token = scanner.scan();
    }
    hasError = token === 16 || scanner.getTokenError() !== 0;
    return token;
  }
  const editOperations = [];
  function addEdit(text, startOffset, endOffset) {
    if (!hasError && (!range || startOffset < rangeEnd && endOffset > rangeStart) && documentText.substring(startOffset, endOffset) !== text) {
      editOperations.push({ offset: startOffset, length: endOffset - startOffset, content: text });
    }
  }
  let firstToken = scanNext();
  if (options.keepLines && numberLineBreaks > 0) {
    addEdit(repeat(eol, numberLineBreaks), 0, 0);
  }
  if (firstToken !== 17) {
    let firstTokenStart = scanner.getTokenOffset() + formatTextStart;
    let initialIndent = indentValue.length * initialIndentLevel < 20 && options.insertSpaces ? cachedSpaces[indentValue.length * initialIndentLevel] : repeat(indentValue, initialIndentLevel);
    addEdit(initialIndent, formatTextStart, firstTokenStart);
  }
  while (firstToken !== 17) {
    let firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
    let secondToken = scanNext();
    let replaceContent = "";
    let needsLineBreak = false;
    while (numberLineBreaks === 0 && (secondToken === 12 || secondToken === 13)) {
      let commentTokenStart = scanner.getTokenOffset() + formatTextStart;
      addEdit(cachedSpaces[1], firstTokenEnd, commentTokenStart);
      firstTokenEnd = scanner.getTokenOffset() + scanner.getTokenLength() + formatTextStart;
      needsLineBreak = secondToken === 12;
      replaceContent = needsLineBreak ? newLinesAndIndent() : "";
      secondToken = scanNext();
    }
    if (secondToken === 2) {
      if (firstToken !== 1) {
        indentLevel--;
      }
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 1) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else if (secondToken === 4) {
      if (firstToken !== 3) {
        indentLevel--;
      }
      if (options.keepLines && numberLineBreaks > 0 || !options.keepLines && firstToken !== 3) {
        replaceContent = newLinesAndIndent();
      } else if (options.keepLines) {
        replaceContent = cachedSpaces[1];
      }
    } else {
      switch (firstToken) {
        case 3:
        case 1:
          indentLevel++;
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 5:
          if (options.keepLines && numberLineBreaks > 0 || !options.keepLines) {
            replaceContent = newLinesAndIndent();
          } else {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 12:
          replaceContent = newLinesAndIndent();
          break;
        case 13:
          if (numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 6:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (!needsLineBreak) {
            replaceContent = cachedSpaces[1];
          }
          break;
        case 10:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else if (secondToken === 6 && !needsLineBreak) {
            replaceContent = "";
          }
          break;
        case 7:
        case 8:
        case 9:
        case 11:
        case 2:
        case 4:
          if (options.keepLines && numberLineBreaks > 0) {
            replaceContent = newLinesAndIndent();
          } else {
            if ((secondToken === 12 || secondToken === 13) && !needsLineBreak) {
              replaceContent = cachedSpaces[1];
            } else if (secondToken !== 5 && secondToken !== 17) {
              hasError = true;
            }
          }
          break;
        case 16:
          hasError = true;
          break;
      }
      if (numberLineBreaks > 0 && (secondToken === 12 || secondToken === 13)) {
        replaceContent = newLinesAndIndent();
      }
    }
    if (secondToken === 17) {
      if (options.keepLines && numberLineBreaks > 0) {
        replaceContent = newLinesAndIndent();
      } else {
        replaceContent = options.insertFinalNewline ? eol : "";
      }
    }
    const secondTokenStart = scanner.getTokenOffset() + formatTextStart;
    addEdit(replaceContent, firstTokenEnd, secondTokenStart);
    firstToken = secondToken;
  }
  return editOperations;
}
function repeat(s, count) {
  let result = "";
  for (let i = 0;i < count; i++) {
    result += s;
  }
  return result;
}
function computeIndentLevel(content, options) {
  let i = 0;
  let nChars = 0;
  const tabSize = options.tabSize || 4;
  while (i < content.length) {
    let ch = content.charAt(i);
    if (ch === cachedSpaces[1]) {
      nChars++;
    } else if (ch === "\t") {
      nChars += tabSize;
    } else {
      break;
    }
    i++;
  }
  return Math.floor(nChars / tabSize);
}
function getEOL(options, text) {
  for (let i = 0;i < text.length; i++) {
    const ch = text.charAt(i);
    if (ch === "\r") {
      if (i + 1 < text.length && text.charAt(i + 1) === `
`) {
        return `\r
`;
      }
      return "\r";
    } else if (ch === `
`) {
      return `
`;
    }
  }
  return options && options.eol || `
`;
}
function isEOL(text, offset) {
  return `\r
`.indexOf(text.charAt(offset)) !== -1;
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/parser.js
var ParseOptions;
(function(ParseOptions) {
  ParseOptions.DEFAULT = {
    allowTrailingComma: false
  };
})(ParseOptions || (ParseOptions = {}));
function parse2(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentProperty = null;
  let currentParent = [];
  const previousParents = [];
  function onValue(value) {
    if (Array.isArray(currentParent)) {
      currentParent.push(value);
    } else if (currentProperty !== null) {
      currentParent[currentProperty] = value;
    }
  }
  const visitor = {
    onObjectBegin: () => {
      const object = {};
      onValue(object);
      previousParents.push(currentParent);
      currentParent = object;
      currentProperty = null;
    },
    onObjectProperty: (name) => {
      currentProperty = name;
    },
    onObjectEnd: () => {
      currentParent = previousParents.pop();
    },
    onArrayBegin: () => {
      const array = [];
      onValue(array);
      previousParents.push(currentParent);
      currentParent = array;
      currentProperty = null;
    },
    onArrayEnd: () => {
      currentParent = previousParents.pop();
    },
    onLiteralValue: onValue,
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  return currentParent[0];
}
function parseTree(text, errors = [], options = ParseOptions.DEFAULT) {
  let currentParent = { type: "array", offset: -1, length: -1, children: [], parent: undefined };
  function ensurePropertyComplete(endOffset) {
    if (currentParent.type === "property") {
      currentParent.length = endOffset - currentParent.offset;
      currentParent = currentParent.parent;
    }
  }
  function onValue(valueNode) {
    currentParent.children.push(valueNode);
    return valueNode;
  }
  const visitor = {
    onObjectBegin: (offset) => {
      currentParent = onValue({ type: "object", offset, length: -1, parent: currentParent, children: [] });
    },
    onObjectProperty: (name, offset, length) => {
      currentParent = onValue({ type: "property", offset, length: -1, parent: currentParent, children: [] });
      currentParent.children.push({ type: "string", value: name, offset, length, parent: currentParent });
    },
    onObjectEnd: (offset, length) => {
      ensurePropertyComplete(offset + length);
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onArrayBegin: (offset, length) => {
      currentParent = onValue({ type: "array", offset, length: -1, parent: currentParent, children: [] });
    },
    onArrayEnd: (offset, length) => {
      currentParent.length = offset + length - currentParent.offset;
      currentParent = currentParent.parent;
      ensurePropertyComplete(offset + length);
    },
    onLiteralValue: (value, offset, length) => {
      onValue({ type: getNodeType(value), offset, length, parent: currentParent, value });
      ensurePropertyComplete(offset + length);
    },
    onSeparator: (sep, offset, length) => {
      if (currentParent.type === "property") {
        if (sep === ":") {
          currentParent.colonOffset = offset;
        } else if (sep === ",") {
          ensurePropertyComplete(offset);
        }
      }
    },
    onError: (error, offset, length) => {
      errors.push({ error, offset, length });
    }
  };
  visit(text, visitor, options);
  const result = currentParent.children[0];
  if (result) {
    delete result.parent;
  }
  return result;
}
function findNodeAtLocation(root, path) {
  if (!root) {
    return;
  }
  let node = root;
  for (let segment of path) {
    if (typeof segment === "string") {
      if (node.type !== "object" || !Array.isArray(node.children)) {
        return;
      }
      let found = false;
      for (const propertyNode of node.children) {
        if (Array.isArray(propertyNode.children) && propertyNode.children[0].value === segment && propertyNode.children.length === 2) {
          node = propertyNode.children[1];
          found = true;
          break;
        }
      }
      if (!found) {
        return;
      }
    } else {
      const index = segment;
      if (node.type !== "array" || index < 0 || !Array.isArray(node.children) || index >= node.children.length) {
        return;
      }
      node = node.children[index];
    }
  }
  return node;
}
function getNodeValue(node) {
  switch (node.type) {
    case "array":
      return node.children.map(getNodeValue);
    case "object":
      const obj = Object.create(null);
      for (let prop of node.children) {
        const valueNode = prop.children[1];
        if (valueNode) {
          obj[prop.children[0].value] = getNodeValue(valueNode);
        }
      }
      return obj;
    case "null":
    case "string":
    case "number":
    case "boolean":
      return node.value;
    default:
      return;
  }
}
function visit(text, visitor, options = ParseOptions.DEFAULT) {
  const _scanner = createScanner(text, false);
  const _jsonPath = [];
  let suppressedCallbacks = 0;
  function toNoArgVisit(visitFunction) {
    return visitFunction ? () => suppressedCallbacks === 0 && visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisit(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter()) : () => true;
  }
  function toOneArgVisitWithPath(visitFunction) {
    return visitFunction ? (arg) => suppressedCallbacks === 0 && visitFunction(arg, _scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice()) : () => true;
  }
  function toBeginVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks++;
      } else {
        let cbReturn = visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter(), () => _jsonPath.slice());
        if (cbReturn === false) {
          suppressedCallbacks = 1;
        }
      }
    } : () => true;
  }
  function toEndVisit(visitFunction) {
    return visitFunction ? () => {
      if (suppressedCallbacks > 0) {
        suppressedCallbacks--;
      }
      if (suppressedCallbacks === 0) {
        visitFunction(_scanner.getTokenOffset(), _scanner.getTokenLength(), _scanner.getTokenStartLine(), _scanner.getTokenStartCharacter());
      }
    } : () => true;
  }
  const onObjectBegin = toBeginVisit(visitor.onObjectBegin), onObjectProperty = toOneArgVisitWithPath(visitor.onObjectProperty), onObjectEnd = toEndVisit(visitor.onObjectEnd), onArrayBegin = toBeginVisit(visitor.onArrayBegin), onArrayEnd = toEndVisit(visitor.onArrayEnd), onLiteralValue = toOneArgVisitWithPath(visitor.onLiteralValue), onSeparator = toOneArgVisit(visitor.onSeparator), onComment = toNoArgVisit(visitor.onComment), onError = toOneArgVisit(visitor.onError);
  const disallowComments = options && options.disallowComments;
  const allowTrailingComma = options && options.allowTrailingComma;
  function scanNext() {
    while (true) {
      const token = _scanner.scan();
      switch (_scanner.getTokenError()) {
        case 4:
          handleError(14);
          break;
        case 5:
          handleError(15);
          break;
        case 3:
          handleError(13);
          break;
        case 1:
          if (!disallowComments) {
            handleError(11);
          }
          break;
        case 2:
          handleError(12);
          break;
        case 6:
          handleError(16);
          break;
      }
      switch (token) {
        case 12:
        case 13:
          if (disallowComments) {
            handleError(10);
          } else {
            onComment();
          }
          break;
        case 16:
          handleError(1);
          break;
        case 15:
        case 14:
          break;
        default:
          return token;
      }
    }
  }
  function handleError(error, skipUntilAfter = [], skipUntil = []) {
    onError(error);
    if (skipUntilAfter.length + skipUntil.length > 0) {
      let token = _scanner.getToken();
      while (token !== 17) {
        if (skipUntilAfter.indexOf(token) !== -1) {
          scanNext();
          break;
        } else if (skipUntil.indexOf(token) !== -1) {
          break;
        }
        token = scanNext();
      }
    }
  }
  function parseString(isValue) {
    const value = _scanner.getTokenValue();
    if (isValue) {
      onLiteralValue(value);
    } else {
      onObjectProperty(value);
      _jsonPath.push(value);
    }
    scanNext();
    return true;
  }
  function parseLiteral() {
    switch (_scanner.getToken()) {
      case 11:
        const tokenValue = _scanner.getTokenValue();
        let value = Number(tokenValue);
        if (isNaN(value)) {
          handleError(2);
          value = 0;
        }
        onLiteralValue(value);
        break;
      case 7:
        onLiteralValue(null);
        break;
      case 8:
        onLiteralValue(true);
        break;
      case 9:
        onLiteralValue(false);
        break;
      default:
        return false;
    }
    scanNext();
    return true;
  }
  function parseProperty() {
    if (_scanner.getToken() !== 10) {
      handleError(3, [], [2, 5]);
      return false;
    }
    parseString(false);
    if (_scanner.getToken() === 6) {
      onSeparator(":");
      scanNext();
      if (!parseValue()) {
        handleError(4, [], [2, 5]);
      }
    } else {
      handleError(5, [], [2, 5]);
    }
    _jsonPath.pop();
    return true;
  }
  function parseObject() {
    onObjectBegin();
    scanNext();
    let needsComma = false;
    while (_scanner.getToken() !== 2 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 2 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (!parseProperty()) {
        handleError(4, [], [2, 5]);
      }
      needsComma = true;
    }
    onObjectEnd();
    if (_scanner.getToken() !== 2) {
      handleError(7, [2], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseArray() {
    onArrayBegin();
    scanNext();
    let isFirstElement = true;
    let needsComma = false;
    while (_scanner.getToken() !== 4 && _scanner.getToken() !== 17) {
      if (_scanner.getToken() === 5) {
        if (!needsComma) {
          handleError(4, [], []);
        }
        onSeparator(",");
        scanNext();
        if (_scanner.getToken() === 4 && allowTrailingComma) {
          break;
        }
      } else if (needsComma) {
        handleError(6, [], []);
      }
      if (isFirstElement) {
        _jsonPath.push(0);
        isFirstElement = false;
      } else {
        _jsonPath[_jsonPath.length - 1]++;
      }
      if (!parseValue()) {
        handleError(4, [], [4, 5]);
      }
      needsComma = true;
    }
    onArrayEnd();
    if (!isFirstElement) {
      _jsonPath.pop();
    }
    if (_scanner.getToken() !== 4) {
      handleError(8, [4], []);
    } else {
      scanNext();
    }
    return true;
  }
  function parseValue() {
    switch (_scanner.getToken()) {
      case 3:
        return parseArray();
      case 1:
        return parseObject();
      case 10:
        return parseString(true);
      default:
        return parseLiteral();
    }
  }
  scanNext();
  if (_scanner.getToken() === 17) {
    if (options.allowEmptyContent) {
      return true;
    }
    handleError(4, [], []);
    return false;
  }
  if (!parseValue()) {
    handleError(4, [], []);
    return false;
  }
  if (_scanner.getToken() !== 17) {
    handleError(9, [], []);
  }
  return true;
}
function getNodeType(value) {
  switch (typeof value) {
    case "boolean":
      return "boolean";
    case "number":
      return "number";
    case "string":
      return "string";
    case "object": {
      if (!value) {
        return "null";
      } else if (Array.isArray(value)) {
        return "array";
      }
      return "object";
    }
    default:
      return "null";
  }
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/impl/edit.js
function setProperty(text, originalPath, value, options) {
  const path = originalPath.slice();
  const errors = [];
  const root = parseTree(text, errors);
  let parent = undefined;
  let lastSegment = undefined;
  while (path.length > 0) {
    lastSegment = path.pop();
    parent = findNodeAtLocation(root, path);
    if (parent === undefined && value !== undefined) {
      if (typeof lastSegment === "string") {
        value = { [lastSegment]: value };
      } else {
        value = [value];
      }
    } else {
      break;
    }
  }
  if (!parent) {
    if (value === undefined) {
      throw new Error("Can not delete in empty document");
    }
    return withFormatting(text, { offset: root ? root.offset : 0, length: root ? root.length : 0, content: JSON.stringify(value) }, options);
  } else if (parent.type === "object" && typeof lastSegment === "string" && Array.isArray(parent.children)) {
    const existing = findNodeAtLocation(parent, [lastSegment]);
    if (existing !== undefined) {
      if (value === undefined) {
        if (!existing.parent) {
          throw new Error("Malformed AST");
        }
        const propertyIndex = parent.children.indexOf(existing.parent);
        let removeBegin;
        let removeEnd = existing.parent.offset + existing.parent.length;
        if (propertyIndex > 0) {
          let previous = parent.children[propertyIndex - 1];
          removeBegin = previous.offset + previous.length;
        } else {
          removeBegin = parent.offset + 1;
          if (parent.children.length > 1) {
            let next = parent.children[1];
            removeEnd = next.offset;
          }
        }
        return withFormatting(text, { offset: removeBegin, length: removeEnd - removeBegin, content: "" }, options);
      } else {
        return withFormatting(text, { offset: existing.offset, length: existing.length, content: JSON.stringify(value) }, options);
      }
    } else {
      if (value === undefined) {
        return [];
      }
      const newProperty = `${JSON.stringify(lastSegment)}: ${JSON.stringify(value)}`;
      const index = options.getInsertionIndex ? options.getInsertionIndex(parent.children.map((p) => p.children[0].value)) : parent.children.length;
      let edit;
      if (index > 0) {
        let previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      } else if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty + "," };
      }
      return withFormatting(text, edit, options);
    }
  } else if (parent.type === "array" && typeof lastSegment === "number" && Array.isArray(parent.children)) {
    const insertIndex = lastSegment;
    if (insertIndex === -1) {
      const newProperty = `${JSON.stringify(value)}`;
      let edit;
      if (parent.children.length === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: newProperty };
      } else {
        const previous = parent.children[parent.children.length - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else if (value === undefined && parent.children.length >= 0) {
      const removalIndex = lastSegment;
      const toRemove = parent.children[removalIndex];
      let edit;
      if (parent.children.length === 1) {
        edit = { offset: parent.offset + 1, length: parent.length - 2, content: "" };
      } else if (parent.children.length - 1 === removalIndex) {
        let previous = parent.children[removalIndex - 1];
        let offset = previous.offset + previous.length;
        let parentEndOffset = parent.offset + parent.length;
        edit = { offset, length: parentEndOffset - 2 - offset, content: "" };
      } else {
        edit = { offset: toRemove.offset, length: parent.children[removalIndex + 1].offset - toRemove.offset, content: "" };
      }
      return withFormatting(text, edit, options);
    } else if (value !== undefined) {
      let edit;
      const newProperty = `${JSON.stringify(value)}`;
      if (!options.isArrayInsertion && parent.children.length > lastSegment) {
        const toModify = parent.children[lastSegment];
        edit = { offset: toModify.offset, length: toModify.length, content: newProperty };
      } else if (parent.children.length === 0 || lastSegment === 0) {
        edit = { offset: parent.offset + 1, length: 0, content: parent.children.length === 0 ? newProperty : newProperty + "," };
      } else {
        const index = lastSegment > parent.children.length ? parent.children.length : lastSegment;
        const previous = parent.children[index - 1];
        edit = { offset: previous.offset + previous.length, length: 0, content: "," + newProperty };
      }
      return withFormatting(text, edit, options);
    } else {
      throw new Error(`Can not ${value === undefined ? "remove" : options.isArrayInsertion ? "insert" : "modify"} Array index ${insertIndex} as length is not sufficient`);
    }
  } else {
    throw new Error(`Can not add ${typeof lastSegment !== "number" ? "index" : "property"} to parent of type ${parent.type}`);
  }
}
function withFormatting(text, edit, options) {
  if (!options.formattingOptions) {
    return [edit];
  }
  let newText = applyEdit(text, edit);
  let begin = edit.offset;
  let end = edit.offset + edit.content.length;
  if (edit.length === 0 || edit.content.length === 0) {
    while (begin > 0 && !isEOL(newText, begin - 1)) {
      begin--;
    }
    while (end < newText.length && !isEOL(newText, end)) {
      end++;
    }
  }
  const edits = format(newText, { offset: begin, length: end - begin }, { ...options.formattingOptions, keepLines: false });
  for (let i = edits.length - 1;i >= 0; i--) {
    const edit = edits[i];
    newText = applyEdit(newText, edit);
    begin = Math.min(begin, edit.offset);
    end = Math.max(end, edit.offset + edit.length);
    end += edit.content.length - edit.length;
  }
  const editLength = text.length - (newText.length - end) - begin;
  return [{ offset: begin, length: editLength, content: newText.substring(begin, end) }];
}
function applyEdit(text, edit) {
  return text.substring(0, edit.offset) + edit.content + text.substring(edit.offset + edit.length);
}

// ../../node_modules/.bun/jsonc-parser@3.3.1/node_modules/jsonc-parser/lib/esm/main.js
var createScanner2 = createScanner;
var ScanError;
(function(ScanError) {
  ScanError[ScanError["None"] = 0] = "None";
  ScanError[ScanError["UnexpectedEndOfComment"] = 1] = "UnexpectedEndOfComment";
  ScanError[ScanError["UnexpectedEndOfString"] = 2] = "UnexpectedEndOfString";
  ScanError[ScanError["UnexpectedEndOfNumber"] = 3] = "UnexpectedEndOfNumber";
  ScanError[ScanError["InvalidUnicode"] = 4] = "InvalidUnicode";
  ScanError[ScanError["InvalidEscapeCharacter"] = 5] = "InvalidEscapeCharacter";
  ScanError[ScanError["InvalidCharacter"] = 6] = "InvalidCharacter";
})(ScanError || (ScanError = {}));
var SyntaxKind;
(function(SyntaxKind) {
  SyntaxKind[SyntaxKind["OpenBraceToken"] = 1] = "OpenBraceToken";
  SyntaxKind[SyntaxKind["CloseBraceToken"] = 2] = "CloseBraceToken";
  SyntaxKind[SyntaxKind["OpenBracketToken"] = 3] = "OpenBracketToken";
  SyntaxKind[SyntaxKind["CloseBracketToken"] = 4] = "CloseBracketToken";
  SyntaxKind[SyntaxKind["CommaToken"] = 5] = "CommaToken";
  SyntaxKind[SyntaxKind["ColonToken"] = 6] = "ColonToken";
  SyntaxKind[SyntaxKind["NullKeyword"] = 7] = "NullKeyword";
  SyntaxKind[SyntaxKind["TrueKeyword"] = 8] = "TrueKeyword";
  SyntaxKind[SyntaxKind["FalseKeyword"] = 9] = "FalseKeyword";
  SyntaxKind[SyntaxKind["StringLiteral"] = 10] = "StringLiteral";
  SyntaxKind[SyntaxKind["NumericLiteral"] = 11] = "NumericLiteral";
  SyntaxKind[SyntaxKind["LineCommentTrivia"] = 12] = "LineCommentTrivia";
  SyntaxKind[SyntaxKind["BlockCommentTrivia"] = 13] = "BlockCommentTrivia";
  SyntaxKind[SyntaxKind["LineBreakTrivia"] = 14] = "LineBreakTrivia";
  SyntaxKind[SyntaxKind["Trivia"] = 15] = "Trivia";
  SyntaxKind[SyntaxKind["Unknown"] = 16] = "Unknown";
  SyntaxKind[SyntaxKind["EOF"] = 17] = "EOF";
})(SyntaxKind || (SyntaxKind = {}));
var parse = parse2;
var parseTree2 = parseTree;
var findNodeAtLocation2 = findNodeAtLocation;
var getNodeValue2 = getNodeValue;
var ParseErrorCode;
(function(ParseErrorCode) {
  ParseErrorCode[ParseErrorCode["InvalidSymbol"] = 1] = "InvalidSymbol";
  ParseErrorCode[ParseErrorCode["InvalidNumberFormat"] = 2] = "InvalidNumberFormat";
  ParseErrorCode[ParseErrorCode["PropertyNameExpected"] = 3] = "PropertyNameExpected";
  ParseErrorCode[ParseErrorCode["ValueExpected"] = 4] = "ValueExpected";
  ParseErrorCode[ParseErrorCode["ColonExpected"] = 5] = "ColonExpected";
  ParseErrorCode[ParseErrorCode["CommaExpected"] = 6] = "CommaExpected";
  ParseErrorCode[ParseErrorCode["CloseBraceExpected"] = 7] = "CloseBraceExpected";
  ParseErrorCode[ParseErrorCode["CloseBracketExpected"] = 8] = "CloseBracketExpected";
  ParseErrorCode[ParseErrorCode["EndOfFileExpected"] = 9] = "EndOfFileExpected";
  ParseErrorCode[ParseErrorCode["InvalidCommentToken"] = 10] = "InvalidCommentToken";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfComment"] = 11] = "UnexpectedEndOfComment";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfString"] = 12] = "UnexpectedEndOfString";
  ParseErrorCode[ParseErrorCode["UnexpectedEndOfNumber"] = 13] = "UnexpectedEndOfNumber";
  ParseErrorCode[ParseErrorCode["InvalidUnicode"] = 14] = "InvalidUnicode";
  ParseErrorCode[ParseErrorCode["InvalidEscapeCharacter"] = 15] = "InvalidEscapeCharacter";
  ParseErrorCode[ParseErrorCode["InvalidCharacter"] = 16] = "InvalidCharacter";
})(ParseErrorCode || (ParseErrorCode = {}));
function printParseErrorCode(code) {
  switch (code) {
    case 1:
      return "InvalidSymbol";
    case 2:
      return "InvalidNumberFormat";
    case 3:
      return "PropertyNameExpected";
    case 4:
      return "ValueExpected";
    case 5:
      return "ColonExpected";
    case 6:
      return "CommaExpected";
    case 7:
      return "CloseBraceExpected";
    case 8:
      return "CloseBracketExpected";
    case 9:
      return "EndOfFileExpected";
    case 10:
      return "InvalidCommentToken";
    case 11:
      return "UnexpectedEndOfComment";
    case 12:
      return "UnexpectedEndOfString";
    case 13:
      return "UnexpectedEndOfNumber";
    case 14:
      return "InvalidUnicode";
    case 15:
      return "InvalidEscapeCharacter";
    case 16:
      return "InvalidCharacter";
  }
  return "<unknown ParseErrorCode>";
}
function modify(text, path, value, options) {
  return setProperty(text, path, value, options);
}
function applyEdits(text, edits) {
  let sortedEdits = edits.slice(0).sort((a, b) => {
    const diff = a.offset - b.offset;
    if (diff === 0) {
      return a.length - b.length;
    }
    return diff;
  });
  let lastModifiedOffset = text.length;
  for (let i = sortedEdits.length - 1;i >= 0; i--) {
    let e = sortedEdits[i];
    if (e.offset + e.length <= lastModifiedOffset) {
      text = applyEdit(text, e);
    } else {
      throw new Error("Overlapping edit");
    }
    lastModifiedOffset = e.offset;
  }
  return text;
}

// ../plugin/src/shared/jsonc-edit.ts
var TOKEN_COMMA = 5;
var TOKEN_EOF = 17;
function parseDocument(text) {
  const errors = [];
  const root = parseTree2(text, errors, { allowTrailingComma: true });
  if (!root || errors.length > 0) {
    throw new Error("Cannot edit invalid JSONC");
  }
  return root;
}
function findNode(text, path) {
  return findNodeAtLocation2(parseDocument(text), path);
}
function findComma(text, start, end) {
  const scanner = createScanner2(text, false);
  scanner.setPosition(start);
  for (;; ) {
    const kind = scanner.scan();
    const offset = scanner.getTokenOffset();
    if (kind === TOKEN_EOF || offset >= end)
      return;
    if (kind === TOKEN_COMMA) {
      return {
        offset,
        length: scanner.getTokenLength(),
        line: scanner.getTokenStartLine()
      };
    }
  }
}
function setJsoncValue(text, path, value) {
  const node = findNode(text, path);
  if (node) {
    if (Object.is(getNodeValue2(node), value))
      return text;
    const serialized = JSON.stringify(value);
    return text.slice(0, node.offset) + serialized + text.slice(node.offset + node.length);
  }
  return applyEdits(text, modify(text, path, value, {}));
}
function removeObjectProperty(text, object, key) {
  const properties = object.children ?? [];
  const index = properties.findIndex((property) => {
    const propertyKey = property.children?.[0];
    return propertyKey !== undefined && getNodeValue2(propertyKey) === key;
  });
  if (index === -1)
    return text;
  const property = properties[index];
  if (!property)
    return text;
  const closingBrace = object.offset + object.length - 1;
  const next = properties[index + 1];
  if (next) {
    const followingComma = findComma(text, property.offset + property.length, next.offset);
    if (!followingComma)
      return text;
    return text.slice(0, property.offset) + text.slice(followingComma.offset + followingComma.length);
  }
  const previous = properties[index - 1];
  const trailingComma = findComma(text, property.offset + property.length, closingBrace);
  if (!previous) {
    const afterProperty = property.offset + property.length;
    if (!trailingComma)
      return text.slice(0, property.offset) + text.slice(afterProperty);
    return text.slice(0, property.offset) + text.slice(afterProperty, trailingComma.offset) + text.slice(trailingComma.offset + trailingComma.length);
  }
  const precedingComma = findComma(text, previous.offset + previous.length, property.offset);
  if (!precedingComma)
    return text;
  const afterProperty = property.offset + property.length;
  const withoutProperty = text.slice(0, precedingComma.offset) + text.slice(precedingComma.offset + precedingComma.length, property.offset) + text.slice(afterProperty);
  if (!trailingComma)
    return withoutProperty;
  const shiftedTrailingComma = trailingComma.offset - 1;
  return withoutProperty.slice(0, shiftedTrailingComma) + withoutProperty.slice(shiftedTrailingComma + trailingComma.length);
}
function removeJsoncValue(text, path) {
  const key = path.at(-1);
  if (typeof key !== "string")
    return text;
  const parent = findNode(text, path.slice(0, -1));
  if (parent?.type !== "object")
    return text;
  return removeObjectProperty(text, parent, key);
}

// ../plugin/src/config/migrate-config-location.ts
var CONFIG_FILE_BASENAME = "magic-context";
function homeDir() {
  if (process.platform === "win32") {
    return process.env.USERPROFILE || process.env.HOME || homedir3();
  }
  return process.env.HOME || homedir3();
}
function configHome() {
  const xdg = process.env.XDG_CONFIG_HOME;
  if (xdg && isAbsolute2(xdg))
    return xdg;
  return join2(homeDir(), ".config");
}
function cortexKitUserConfigBasePath() {
  return join2(configHome(), "cortexkit", CONFIG_FILE_BASENAME);
}
function cortexKitProjectConfigBasePath(directory) {
  return join2(directory, ".cortexkit", CONFIG_FILE_BASENAME);
}
function resolveCortexKitUserConfigPath() {
  return `${cortexKitUserConfigBasePath()}.jsonc`;
}
function legacySourcesForBase(basePath, label) {
  return [
    { path: `${basePath}.jsonc`, label: `${label} magic-context.jsonc` },
    { path: `${basePath}.json`, label: `${label} magic-context.json` }
  ];
}
function userScopeConfigPaths() {
  return new Set([
    `${cortexKitUserConfigBasePath()}.jsonc`,
    `${cortexKitUserConfigBasePath()}.json`,
    join2(configHome(), "opencode", `${CONFIG_FILE_BASENAME}.jsonc`),
    join2(configHome(), "opencode", `${CONFIG_FILE_BASENAME}.json`),
    join2(homeDir(), ".pi", "agent", `${CONFIG_FILE_BASENAME}.jsonc`),
    join2(homeDir(), ".pi", "agent", `${CONFIG_FILE_BASENAME}.json`)
  ]);
}
function resolveLegacyConfigSources(directory) {
  const userPaths = userScopeConfigPaths();
  return {
    user: [
      ...legacySourcesForBase(join2(configHome(), "opencode", CONFIG_FILE_BASENAME), "OpenCode user"),
      ...legacySourcesForBase(join2(homeDir(), ".pi", "agent", CONFIG_FILE_BASENAME), "Pi user")
    ],
    project: [
      ...legacySourcesForBase(join2(directory, CONFIG_FILE_BASENAME), "project root"),
      ...legacySourcesForBase(join2(directory, ".opencode", CONFIG_FILE_BASENAME), "OpenCode project"),
      ...legacySourcesForBase(join2(directory, ".pi", CONFIG_FILE_BASENAME), "Pi project")
    ].filter((source) => !userPaths.has(source.path))
  };
}
function resolveLegacyConfigSourcesForHarness(directory, harness) {
  if (harness === "pi") {
    return {
      user: legacySourcesForBase(join2(homeDir(), ".pi", "agent", CONFIG_FILE_BASENAME), "Pi user"),
      project: legacySourcesForBase(join2(directory, ".pi", CONFIG_FILE_BASENAME), "Pi project")
    };
  }
  return {
    user: legacySourcesForBase(join2(configHome(), "opencode", CONFIG_FILE_BASENAME), "OpenCode user"),
    project: [
      ...legacySourcesForBase(join2(directory, CONFIG_FILE_BASENAME), "project root"),
      ...legacySourcesForBase(join2(directory, ".opencode", CONFIG_FILE_BASENAME), "OpenCode project")
    ]
  };
}

// ../plugin/src/features/magic-context/memory/constants.ts
var V2_MEMORY_CATEGORIES = [
  "PROJECT_RULES",
  "ARCHITECTURE",
  "CONSTRAINTS",
  "CONFIG_VALUES",
  "NAMING"
];
var PROMOTABLE_CATEGORIES = [
  "PROJECT_RULES",
  "ARCHITECTURE",
  "CONSTRAINTS",
  "CONFIG_VALUES",
  "NAMING",
  "ARCHITECTURE_DECISIONS",
  "CONFIG_DEFAULTS",
  "USER_PREFERENCES",
  "USER_DIRECTIVES",
  "ENVIRONMENT",
  "WORKFLOW_RULES",
  "KNOWN_ISSUES"
];
var CATEGORY_PRIORITY = [
  "PROJECT_RULES",
  "ARCHITECTURE",
  "CONSTRAINTS",
  "CONFIG_VALUES",
  "NAMING",
  "USER_DIRECTIVES",
  "USER_PREFERENCES",
  "CONFIG_DEFAULTS",
  "ARCHITECTURE_DECISIONS",
  "ENVIRONMENT",
  "WORKFLOW_RULES",
  "KNOWN_ISSUES"
];
var MEMORY_CATEGORY_ORDER_UNKNOWN = 99;
var MEMORY_CATEGORY_ORDER_PRIORITY = CATEGORY_PRIORITY.reduce((acc, category, index) => {
  acc[category] = index;
  return acc;
}, {});
var MEMORY_CATEGORY_ORDER_SQL = `CASE category ${CATEGORY_PRIORITY.map((category, index) => `WHEN '${category}' THEN ${index}`).join(" ")} ELSE ${MEMORY_CATEGORY_ORDER_UNKNOWN} END`;
function getMemoryCategoryOrder(category) {
  return MEMORY_CATEGORY_ORDER_PRIORITY[category] ?? MEMORY_CATEGORY_ORDER_UNKNOWN;
}
var CATEGORY_DEFAULT_TTL = {
  WORKFLOW_RULES: 90 * 24 * 60 * 60 * 1000,
  KNOWN_ISSUES: 30 * 24 * 60 * 60 * 1000
};

// ../plugin/src/features/magic-context/memory/project-identity.ts
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync as existsSync2, realpathSync, statSync as statSync2 } from "node:fs";
import { homedir as homedir4 } from "node:os";
import path3 from "node:path";
var GIT_TIMEOUT_MS = 5000;
var TRANSIENT_FAILURE_COOLDOWN_MS = 5 * 60 * 1000;
var identityCache = new Map;
var linkedGitWorktreeCache = new Map;
var lastKnownGitIdentityCache = new Map;
var directoryFallbackCache = new Map;
var transientFailureCooldown = new Map;
var dubiousOwnershipFallbackDirectories = new Set;
var dubiousOwnershipLoggedDirectories = new Set;
var dubiousOwnershipWarnedDirectories = new Set;
var transientGitIdentityReuseLoggedDirectories = new Set;
var sessionIdentityCache = new Map;
var execFileSyncForIdentity = execFileSync;
var userHomeDirectoryForIdentity = () => homedir4();
var nowMs = () => Date.now();
var filesystemProbeObserverForTests;

class ProjectIdentityError extends Error {
  errorClass;
  rawDirectory;
  constructor(errorClass, rawDirectory, message, cause) {
    super(message);
    this.name = "ProjectIdentityError";
    this.errorClass = errorClass;
    this.rawDirectory = rawDirectory;
    if (cause) {
      this.cause = cause;
    }
  }
}
function asError(error) {
  return error instanceof Error ? error : undefined;
}
function getErrorCode(error) {
  if (error === null || typeof error !== "object" || !("code" in error)) {
    return;
  }
  const code = error.code;
  return typeof code === "string" ? code : undefined;
}
function getErrorSignal(error) {
  if (error === null || typeof error !== "object" || !("signal" in error)) {
    return;
  }
  const signal = error.signal;
  return typeof signal === "string" ? signal : undefined;
}
function getErrorKilled(error) {
  if (error === null || typeof error !== "object" || !("killed" in error)) {
    return false;
  }
  return error.killed === true;
}
function getErrorStderr(error) {
  if (error === null || typeof error !== "object" || !("stderr" in error)) {
    return "";
  }
  const stderr = error.stderr;
  if (typeof stderr === "string") {
    return stderr;
  }
  if (Buffer.isBuffer(stderr)) {
    return stderr.toString("utf8");
  }
  return "";
}
function directoryFallback(directory) {
  const canonical = path3.resolve(directory);
  const hash = createHash("md5").update(canonical, "utf8").digest("hex").slice(0, 12);
  return `dir:${hash}`;
}
function assertDirectoryUsable(canonicalDirectory, rawDirectory) {
  try {
    const stat = statSync2(canonicalDirectory);
    if (!stat.isDirectory()) {
      throw new ProjectIdentityError("unknown", rawDirectory, `Project path is not a directory: ${canonicalDirectory}`);
    }
  } catch (error) {
    if (error instanceof ProjectIdentityError) {
      throw error;
    }
    const code = getErrorCode(error);
    if (code === "EACCES" || code === "EPERM") {
      throw new ProjectIdentityError("permission_denied", rawDirectory, `Permission denied while accessing project directory: ${canonicalDirectory}`, asError(error));
    }
    throw new ProjectIdentityError("unknown", rawDirectory, `Unable to access project directory: ${canonicalDirectory}`, asError(error));
  }
}
function isGitTimeoutError(error) {
  const code = getErrorCode(error);
  const signal = getErrorSignal(error);
  return code === "ETIMEDOUT" || signal === "SIGTERM" || signal === "SIGKILL" || getErrorKilled(error);
}
function classifyGitError(error, rawDirectory) {
  if (isGitTimeoutError(error)) {
    return new ProjectIdentityError("git_timeout", rawDirectory, `git rev-list timed out after ${GIT_TIMEOUT_MS}ms`, asError(error));
  }
  const code = getErrorCode(error);
  if (code === "ENOENT") {
    return new ProjectIdentityError("git_missing", rawDirectory, "git binary is not available in PATH", asError(error));
  }
  if (code === "EACCES" || code === "EPERM") {
    return new ProjectIdentityError("permission_denied", rawDirectory, "Permission denied while spawning git", asError(error));
  }
  const stderr = getErrorStderr(error).toLowerCase();
  if (stderr.includes("detected dubious ownership")) {
    return new ProjectIdentityError("dubious_ownership", rawDirectory, "git refused to read the repository because it detected dubious ownership", asError(error));
  }
  if (stderr.includes("not a git repository") || stderr.includes("does not have any commits yet") || stderr.includes("ambiguous argument 'head'") || stderr.includes("unknown revision or path")) {
    return new ProjectIdentityError("not_git_repo", rawDirectory, "Directory has no git root commit; caller may use directory fallback", asError(error));
  }
  return new ProjectIdentityError("unknown", rawDirectory, "git rev-list failed while resolving project identity", asError(error));
}
function resolveProjectIdentityStrict(directory) {
  const canonical = path3.resolve(directory);
  const cached = identityCache.get(canonical);
  if (cached !== undefined) {
    return cached;
  }
  assertDirectoryUsable(canonical, directory);
  if (!hasGitDir(canonical)) {
    throw new ProjectIdentityError("not_git_repo", directory, "Directory has no git metadata; caller may use directory fallback");
  }
  let output;
  try {
    output = execFileSyncForIdentity("git", ["rev-list", "--max-parents=0", "HEAD"], {
      cwd: canonical,
      encoding: "utf8",
      env: { ...process.env, LC_ALL: "C", LANG: "C" },
      stdio: ["ignore", "pipe", "pipe"],
      timeout: GIT_TIMEOUT_MS
    });
  } catch (error) {
    throw classifyGitError(error, directory);
  }
  const rootCommit = output.split(`
`).map((line) => line.trim().slice(0, 64)).filter((line) => /^[0-9a-f]{7,64}$/.test(line)).sort()[0];
  if (!rootCommit) {
    throw new ProjectIdentityError("unknown", directory, "git rev-list returned no valid root commit hash");
  }
  const identity = `git:${rootCommit}`;
  identityCache.set(canonical, identity);
  lastKnownGitIdentityCache.set(canonical, identity);
  transientFailureCooldown.delete(canonical);
  dubiousOwnershipFallbackDirectories.delete(canonical);
  transientGitIdentityReuseLoggedDirectories.delete(canonical);
  return identity;
}
function shouldUseDirectoryFallback(error) {
  return error.errorClass !== "permission_denied";
}
function getActiveCooldown(canonical) {
  const until = transientFailureCooldown.get(canonical);
  if (until === undefined)
    return;
  if (nowMs() < until)
    return until;
  transientFailureCooldown.delete(canonical);
  return;
}
function lastKnownGitIdentity(canonical) {
  return lastKnownGitIdentityCache.get(canonical) ?? identityCache.get(canonical);
}
function nearestLastKnownGitIdentity(canonical) {
  const visited = new Set;
  const walk = (start) => {
    let current = start;
    while (!visited.has(current)) {
      visited.add(current);
      const cached = lastKnownGitIdentity(current);
      if (cached !== undefined)
        return { identity: cached, source: current };
      const parent = path3.dirname(current);
      if (parent === current)
        break;
      current = parent;
    }
    return;
  };
  const exactOrAncestor = walk(canonical);
  if (exactOrAncestor)
    return exactOrAncestor;
  try {
    const realCanonical = realpathSync.native(canonical);
    if (realCanonical !== canonical)
      return walk(realCanonical);
  } catch {}
  return;
}
function reuseLastKnownGitIdentity(canonical) {
  const cached = nearestLastKnownGitIdentity(canonical);
  if (cached === undefined)
    return;
  if (!transientGitIdentityReuseLoggedDirectories.has(canonical)) {
    transientGitIdentityReuseLoggedDirectories.add(canonical);
    const sourceNote = cached.source === canonical ? "" : ` from ancestor ${cached.source}`;
    log(`[magic-context] git identity resolution is temporarily unavailable for ${canonical}; reusing the last successful project identity${sourceNote} to avoid splitting project-scoped memory`);
  }
  return cached.identity;
}
function formatDubiousOwnershipWarning(canonical) {
  return `Magic Context: git refused to read ${canonical} (dubious ownership — the repo is owned by a different user). Using a directory-based project identity for now, which keeps memory separate from this repo's normal identity. Fix: git config --global --add safe.directory ${canonical}`;
}
function recordDubiousOwnershipFallback(canonical) {
  dubiousOwnershipFallbackDirectories.add(canonical);
  if (dubiousOwnershipLoggedDirectories.has(canonical))
    return;
  dubiousOwnershipLoggedDirectories.add(canonical);
  log(`[magic-context] ${formatDubiousOwnershipWarning(canonical)}`);
}
function canonicalUserHomeDirectory() {
  const homeDirectory = userHomeDirectoryForIdentity();
  try {
    return realpathSync.native(homeDirectory);
  } catch {
    return homeDirectory;
  }
}
function isUserHomeDirectory(directory) {
  try {
    return realpathSync.native(path3.resolve(directory)) === canonicalUserHomeDirectory();
  } catch {
    return false;
  }
}
function resolveProjectIdentity2(directory) {
  const canonical = path3.resolve(directory);
  const cachedFallback = directoryFallbackCache.get(canonical);
  if (cachedFallback !== undefined) {
    if (!hasGitDir(canonical)) {
      return cachedFallback;
    }
    directoryFallbackCache.delete(canonical);
  }
  if (getActiveCooldown(canonical) !== undefined) {
    if (hasGitDir(canonical)) {
      const cachedGitIdentity = reuseLastKnownGitIdentity(canonical);
      if (cachedGitIdentity !== undefined) {
        return cachedGitIdentity;
      }
    }
    return directoryFallback(canonical);
  }
  try {
    return resolveProjectIdentityStrict(directory);
  } catch (error) {
    if (error instanceof ProjectIdentityError && shouldUseDirectoryFallback(error)) {
      const fallback = directoryFallback(canonical);
      const hasGitMetadata = hasGitDir(canonical);
      if (!hasGitMetadata) {
        directoryFallbackCache.set(canonical, fallback);
        transientFailureCooldown.delete(canonical);
      } else {
        transientFailureCooldown.set(canonical, nowMs() + TRANSIENT_FAILURE_COOLDOWN_MS);
        const cachedGitIdentity = reuseLastKnownGitIdentity(canonical);
        if (cachedGitIdentity !== undefined) {
          return cachedGitIdentity;
        }
      }
      if (error.errorClass === "dubious_ownership") {
        recordDubiousOwnershipFallback(canonical);
      }
      return fallback;
    }
    throw error;
  }
}
function resolveProjectIdentityOrFallback(directory) {
  try {
    return resolveProjectIdentity2(directory);
  } catch (error) {
    const canonical = path3.resolve(directory);
    const fallback = directoryFallback(canonical);
    const message = error instanceof Error ? error.message : String(error);
    log(`[magic-context] project identity resolution failed for ${canonical}; using directory fallback ${fallback}: ${message}`);
    return fallback;
  }
}
function hasGitDir(canonical) {
  if (hasGitDirInAncestorChain(canonical)) {
    return true;
  }
  try {
    const realCanonical = realpathSync.native(canonical);
    return realCanonical !== canonical && hasGitDirInAncestorChain(realCanonical);
  } catch {
    return false;
  }
}
function gitRootInAncestorChain(startDirectory) {
  let current = startDirectory;
  while (true) {
    if (existsSync2(path3.join(current, ".git"))) {
      try {
        return realpathSync.native(current);
      } catch {
        return path3.resolve(current);
      }
    }
    const parent = path3.dirname(current);
    if (parent === current) {
      return null;
    }
    current = parent;
  }
}
function hasGitDirInAncestorChain(startDirectory) {
  return gitRootInAncestorChain(startDirectory) !== null;
}
function gitRootDirectory(canonical) {
  const direct = gitRootInAncestorChain(canonical);
  if (direct)
    return direct;
  try {
    const realCanonical = realpathSync.native(canonical);
    return realCanonical === canonical ? null : gitRootInAncestorChain(realCanonical);
  } catch {
    return null;
  }
}
function resolveProjectIdentityForSession(directory, allowHomeProject = false) {
  const resolvedDirectory = path3.resolve(directory);
  const cacheKey = `${allowHomeProject ? "1" : "0"}\x00${resolvedDirectory}`;
  const cached = sessionIdentityCache.get(cacheKey);
  if (cached && (cached.revalidateAt === null || nowMs() < cached.revalidateAt)) {
    return cached.identity;
  }
  sessionIdentityCache.delete(cacheKey);
  filesystemProbeObserverForTests?.();
  const canonicalHome = canonicalUserHomeDirectory();
  const canonicalDirectory = (() => {
    try {
      filesystemProbeObserverForTests?.();
      return realpathSync.native(resolvedDirectory);
    } catch {
      return resolvedDirectory;
    }
  })();
  filesystemProbeObserverForTests?.();
  const inheritsHomeRepository = gitRootDirectory(canonicalDirectory) === canonicalHome;
  let identity;
  if (canonicalDirectory === canonicalHome || inheritsHomeRepository) {
    identity = allowHomeProject ? directoryFallback(canonicalHome) : undefined;
  } else {
    identity = resolveProjectIdentityOrFallback(directory);
  }
  sessionIdentityCache.set(cacheKey, {
    identity,
    revalidateAt: identity?.startsWith("git:") === true ? null : nowMs() + TRANSIENT_FAILURE_COOLDOWN_MS
  });
  return identity;
}
function normalizeStoredProjectPath(rawOrStored) {
  if (rawOrStored.startsWith("git:") || rawOrStored.startsWith("dir:")) {
    return rawOrStored;
  }
  try {
    return resolveProjectIdentity2(rawOrStored);
  } catch {
    return directoryFallback(rawOrStored);
  }
}
function storedPathBelongsToIdentity(storedProjectPath, projectIdentity) {
  return storedProjectPath === projectIdentity || normalizeStoredProjectPath(storedProjectPath) === projectIdentity;
}

// ../plugin/src/shared/error-message.ts
function getErrorMessage(error) {
  return error instanceof Error ? error.message : String(error);
}
function readString(value) {
  if (typeof value === "string" && value.length > 0)
    return value;
  if (typeof value === "number")
    return String(value);
  return;
}
function clip(value, max) {
  if (value.length <= max)
    return value;
  return `${value.slice(0, max)}…`;
}
function describeError(error) {
  const stringForm = clip(safeString(error), 400);
  if (!(error instanceof Error) && !(error && typeof error === "object")) {
    return {
      name: typeof error,
      message: "",
      stringForm,
      brief: stringForm || "<empty>"
    };
  }
  const obj = error;
  const nameFromField = readString(obj.name);
  const nameFromCtor = error?.constructor?.name;
  const name = nameFromField ?? nameFromCtor ?? "Error";
  const message = readString(obj.message) ?? "";
  const status = readString(obj.status) ?? readString(obj.statusCode);
  const code = readString(obj.code);
  let causeName;
  const cause = obj.cause;
  if (cause && typeof cause === "object") {
    const causeRecord = cause;
    causeName = readString(causeRecord.name) ?? cause.constructor?.name;
  }
  const stack = readString(obj.stack);
  const stackHead = stack ? stack.split(`
`).slice(0, 4).map((l) => l.trim()).filter((l) => l.length > 0).join(" | ") : undefined;
  const briefParts = [];
  if (name)
    briefParts.push(name);
  if (message)
    briefParts.push(`message="${clip(message, 200)}"`);
  if (status)
    briefParts.push(`status=${status}`);
  if (code)
    briefParts.push(`code=${code}`);
  if (causeName)
    briefParts.push(`cause=${causeName}`);
  if (!message && stringForm && stringForm !== name) {
    briefParts.push(`str="${clip(stringForm, 200)}"`);
  }
  const brief = briefParts.join(" ") || stringForm || name;
  return {
    name,
    message,
    ...status ? { status } : {},
    ...code ? { code } : {},
    ...causeName ? { causeName } : {},
    ...stackHead ? { stackHead } : {},
    stringForm,
    brief
  };
}
function safeString(value) {
  try {
    return String(value);
  } catch {
    return "<unstringifiable>";
  }
}

// ../plugin/src/features/magic-context/storage-db.ts
import {
  chmodSync as chmodSync2,
  copyFileSync,
  cpSync,
  existsSync as existsSync5,
  mkdirSync as mkdirSync3,
  readdirSync as readdirSync2,
  readFileSync as readFileSync3,
  statSync as statSync4,
  unlinkSync
} from "node:fs";
import { basename as basename2, dirname as dirname3, join as join4, resolve as resolve2 } from "node:path";

// ../plugin/src/plugin/boot-quiet.ts
var bootQuietUntilMs = 0;
function bootQuietRemainingMs(now = Date.now()) {
  return Math.max(0, bootQuietUntilMs - now);
}
function scheduleAfterBootQuiet(task, additionalDelayMs = 0) {
  const timer = setTimeout(task, bootQuietRemainingMs() + Math.max(0, additionalDelayMs));
  timer.unref?.();
  return timer;
}

// ../plugin/src/shared/rpc-utils.ts
import { execFileSync as execFileSync2 } from "node:child_process";
import { readFileSync as readFileSync2 } from "node:fs";

// ../plugin/src/shared/pi-executable.ts
var PI_IMAGE_NAMES = new Set(["pi", "pi.cmd", "omp", "oh-my-pi"]);
function piHarnessKindFromExecutable(value) {
  const executable = (value ?? "").trim().replace(/^['"]|['"]$/g, "").replaceAll("\\", "/").split("/").at(-1)?.toLowerCase().replace(/\.(?:exe|cmd)$/, "");
  if (!executable || !PI_IMAGE_NAMES.has(executable))
    return;
  return executable === "pi" ? "pi" : "omp";
}

// ../plugin/src/shared/rpc-utils.ts
function isPidAlive(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return "dead";
  if (rpcIdentityPlatform === "win32")
    return readWindowsProcess(pid).state;
  try {
    rpcIdentityProcessKill(pid, 0);
    return "alive";
  } catch (error) {
    return error.code === "ESRCH" ? "dead" : "inconclusive";
  }
}
var RPC_IDENTITY_SKEW_TOLERANCE_MS = 120000;
var LINUX_CLOCK_TICKS_PER_SECOND = 100;
var PS_PROBE_TIMEOUT_MS = 1000;
var WINDOWS_CIM_PROBE_TIMEOUT_MS = 5000;
var MAX_ANCESTOR_WALK_DEPTH = 16;
var OPEN_CODE_COMMAND_MARKERS = ["opencode", "node", "bun", "electron"];
var TASKLIST_NO_TASKS_PATTERN = /^INFO:\s+No tasks are running which match the specified criteria\.?$/im;
var WINDOWS_CIM_COMMAND = "Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,CommandLine,CreationDate | ConvertTo-Json -Compress";
var PI_HARNESS_ARC_MARKERS = [
  "pi-coding-agent",
  "oh-my-pi",
  "@oh-my-pi",
  "cljs/dist",
  "dist/bundle/cli"
];
var rpcIdentityReadFileSync = readFileSync2;
var rpcIdentityExecFileSync = execFileSync2;
var rpcIdentityProcessKill = process.kill;
var rpcProcessListExecFileSync = execFileSync2;
var rpcIdentityPlatform = process.platform;
var rpcIdentityNowMs = () => Date.now();
function parseLinuxProcessStartTime(statContent, uptimeContent) {
  const closingCommandName = statContent.lastIndexOf(")");
  if (closingCommandName < 0)
    return null;
  const statFields = statContent.slice(closingCommandName + 1).trim().split(/\s+/);
  const startTimeTicks = Number(statFields[19]);
  const uptimeSeconds = Number(uptimeContent.trim().split(/\s+/)[0]);
  if (!Number.isFinite(startTimeTicks) || startTimeTicks < 0 || !Number.isFinite(uptimeSeconds) || uptimeSeconds < 0) {
    return null;
  }
  const processStartTime = rpcIdentityNowMs() - uptimeSeconds * 1000 + startTimeTicks / LINUX_CLOCK_TICKS_PER_SECOND * 1000;
  return Number.isFinite(processStartTime) ? processStartTime : null;
}
function readLinuxProcessStartTime(pid) {
  try {
    const statContent = String(rpcIdentityReadFileSync(`/proc/${pid}/stat`, "utf8"));
    const uptimeContent = String(rpcIdentityReadFileSync("/proc/uptime", "utf8"));
    return parseLinuxProcessStartTime(statContent, uptimeContent);
  } catch {
    return null;
  }
}
function readPsProcessStartTime(pid) {
  try {
    const output = rpcIdentityExecFileSync("ps", ["-p", String(pid), "-o", "lstart="], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const processStartTime = Date.parse(String(output).trim());
    return Number.isFinite(processStartTime) ? processStartTime : null;
  } catch {
    return null;
  }
}
function readProcessStartTime(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return null;
  return rpcIdentityPlatform === "linux" ? readLinuxProcessStartTime(pid) : rpcIdentityPlatform === "win32" ? readWindowsProcessStartTime(pid) : readPsProcessStartTime(pid);
}
function readProcessProbeEvidence(pid) {
  return {
    startTime: readProcessStartTime(pid),
    commandLine: readProcessCommand(pid)
  };
}
var windowsProcessFactsCache = null;
function rememberWindowsProcessFacts(facts) {
  windowsProcessFactsCache = new Map(facts.map((fact) => [fact.pid, fact]));
}
function parseCsvLine(line) {
  const fields = [];
  let field = "";
  let quoted = false;
  for (let index = 0;index < line.length; index += 1) {
    const character = line[index];
    if (character === '"') {
      if (quoted && line[index + 1] === '"') {
        field += '"';
        index += 1;
      } else {
        quoted = !quoted;
      }
    } else if (character === "," && !quoted) {
      fields.push(field);
      field = "";
    } else {
      field += character;
    }
  }
  if (quoted)
    return null;
  fields.push(field);
  return fields;
}
function parseTasklistOutput(output) {
  const entries = [];
  let sawHeader = false;
  for (const rawLine of output.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line)
      continue;
    if (TASKLIST_NO_TASKS_PATTERN.test(line))
      return [];
    const fields = parseCsvLine(line);
    if (!fields)
      continue;
    if (fields[1]?.trim().toLowerCase() === "pid") {
      sawHeader = true;
      continue;
    }
    const pid = Number(fields[1]);
    if (!Number.isInteger(pid) || pid <= 0 || !fields[0])
      continue;
    entries.push({ pid, command: fields[0] });
  }
  return entries.length > 0 || sawHeader ? entries : null;
}
function readWindowsProcess(pid) {
  try {
    const output = rpcIdentityExecFileSync("tasklist", ["/FO", "CSV", "/FI", `PID eq ${pid}`], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    const entries = parseTasklistOutput(String(output));
    if (entries === null)
      return { state: "inconclusive" };
    const process2 = entries.find((entry) => entry.pid === pid);
    return process2 ? { state: "alive", command: process2.command } : { state: "dead" };
  } catch {
    return { state: "inconclusive" };
  }
}
function readWindowsProcessStartTime(pid) {
  const cached = windowsProcessFactsCache?.get(pid);
  if (cached)
    return cached.startTime;
  const snapshot = tryReadWindowsCimSnapshot(rpcIdentityExecFileSync);
  if (!snapshot)
    return null;
  rememberWindowsProcessFacts(snapshot.facts);
  return windowsProcessFactsCache?.get(pid)?.startTime ?? null;
}
function readLinuxProcessCommand(pid) {
  try {
    return String(rpcIdentityReadFileSync(`/proc/${pid}/cmdline`, "utf8"));
  } catch {
    return null;
  }
}
function readPsProcessCommand(pid) {
  try {
    const output = rpcIdentityExecFileSync("ps", ["-p", String(pid), "-o", "command="], {
      encoding: "utf8",
      timeout: PS_PROBE_TIMEOUT_MS,
      stdio: ["ignore", "pipe", "pipe"]
    });
    return String(output);
  } catch {
    return null;
  }
}
function readProcessCommand(pid) {
  if (!Number.isInteger(pid) || pid <= 0)
    return null;
  if (rpcIdentityPlatform === "linux")
    return readLinuxProcessCommand(pid);
  if (rpcIdentityPlatform === "win32") {
    const cached = windowsProcessFactsCache?.get(pid);
    if (cached?.commandLine)
      return cached.commandLine;
    return readWindowsProcess(pid).command ?? null;
  }
  return readPsProcessCommand(pid);
}
function executableName(token) {
  return (token ?? "").replace(/^['"]|['"]$/g, "").split("/").at(-1) ?? "";
}
function commandTokens(command) {
  return command.toLowerCase().replaceAll("\\", "/").replaceAll("\x00", " ").split(/\s+/).map((token) => token.replace(/^['"]|['"]$/g, "")).filter(Boolean);
}
function commandHasOpenCodeExecutable(tokens) {
  return tokens.findIndex((token) => {
    const executable = executableName(token).replace(/\.(?:exe|cmd)$/, "");
    return executable === "opencode" || executable.endsWith("/opencode");
  });
}
function commandHasPiExecutable(tokens) {
  for (let index = 0;index < tokens.length; index += 1) {
    const executable = executableName(tokens[index]).replace(/\.(?:exe|cmd)$/, "");
    if (piHarnessKindFromExecutable(executable) !== undefined)
      return true;
    if (["node", "bun", "deno"].includes(executable)) {
      const script = executableName(tokens[index + 1]).replace(/\.(?:exe|cmd)$/, "");
      if (["pi", "pi.js", "pi.mjs", "pi.cjs"].includes(script) || tokens[index + 1]?.includes("pi-coding-agent")) {
        return true;
      }
    }
  }
  return false;
}
function classifyProcessKind(command) {
  if (!command)
    return "process";
  const tokens = commandTokens(command);
  const openCodeIndex = commandHasOpenCodeExecutable(tokens);
  if (openCodeIndex >= 0) {
    const args = tokens.slice(openCodeIndex + 1);
    if (args.some((token) => token === "serve" || token === "--serve" || token.startsWith("--serve="))) {
      return "OpenCode server";
    }
    return "OpenCode instance (TUI/CLI)";
  }
  return commandHasPiExecutable(tokens) ? "Pi" : "process";
}
function commandLooksLikeOpenCode(command) {
  const normalized = command.toLowerCase();
  return OPEN_CODE_COMMAND_MARKERS.some((marker) => normalized.includes(marker));
}
function isPidIdentityPlausible(record, evidence) {
  if (!Number.isInteger(record.pid) || record.pid <= 0)
    return "implausible";
  if (Number.isFinite(record.started_at) && record.started_at > 0) {
    const processStartTime = evidence ? evidence.startTime : readProcessStartTime(record.pid);
    if (processStartTime === null)
      return "inconclusive";
    return processStartTime <= record.started_at + RPC_IDENTITY_SKEW_TOLERANCE_MS ? "plausible" : "implausible";
  }
  const command = evidence ? evidence.commandLine : rpcIdentityPlatform === "linux" ? readLinuxProcessCommand(record.pid) : rpcIdentityPlatform === "win32" ? readWindowsProcess(record.pid).command ?? null : readPsProcessCommand(record.pid);
  if (command === null)
    return "inconclusive";
  return commandLooksLikeOpenCode(command) ? "plausible" : "implausible";
}
function commandLooksLikePiImage(command) {
  const tokens = commandTokens(command);
  const first = executableName(tokens[0]).replace(/\.(?:exe|cmd)$/, "");
  return PI_IMAGE_NAMES.has(first);
}
function commandHasPiHarnessArc(command) {
  const normalized = command.trim().toLowerCase().replaceAll("\\", "/").replaceAll("\x00", " ");
  if (!normalized)
    return false;
  const tokens = commandTokens(command);
  if (tokens.length === 0)
    return false;
  const hasArc = PI_HARNESS_ARC_MARKERS.some((marker) => normalized.includes(marker));
  const first = executableName(tokens[0]).replace(/\.(?:exe|cmd)$/, "");
  if (hasArc && ["pi", "omp", "oh-my-pi", "node", "bun", "deno", "cmd"].includes(first)) {
    return true;
  }
  if (hasArc && PI_HARNESS_ARC_MARKERS.some((marker) => tokens[0].includes(marker))) {
    return true;
  }
  if (["node", "bun", "deno"].includes(first)) {
    const script = executableName(tokens[1]).replace(/\.(?:exe|cmd)$/, "");
    if (["pi", "pi.js", "pi.mjs", "pi.cjs"].includes(script))
      return true;
    if (hasArc)
      return true;
  }
  return false;
}
function execProcessList(exec, file, args, timeout = PS_PROBE_TIMEOUT_MS) {
  return String(exec(file, [...args], {
    encoding: "utf8",
    timeout,
    stdio: ["ignore", "pipe", "pipe"]
  }));
}
function parseWindowsCreationDate(value) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value > 1000000000000 ? value : value * 1000;
  }
  if (typeof value !== "string")
    return null;
  const trimmed = value.trim();
  if (!trimmed)
    return null;
  const wmi = /^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})\.(\d{6})([+-])(\d{3})$/.exec(trimmed);
  if (wmi) {
    const utcMs = Date.UTC(Number(wmi[1]), Number(wmi[2]) - 1, Number(wmi[3]), Number(wmi[4]), Number(wmi[5]), Number(wmi[6]), Number(wmi[7]) / 1000);
    if (!Number.isFinite(utcMs))
      return null;
    const offsetMinutes = Number(wmi[9]);
    const sign = wmi[8] === "+" ? 1 : -1;
    return utcMs - sign * offsetMinutes * 60000;
  }
  const dotNet = /^\/Date\((-?\d+)\)\/$/.exec(trimmed);
  if (dotNet) {
    const milliseconds = Number(dotNet[1]);
    return Number.isFinite(milliseconds) ? milliseconds : null;
  }
  const parsed = Date.parse(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}
function parseWindowsCimOutput(output) {
  const trimmed = output.trim();
  if (!trimmed)
    return null;
  const bracket = trimmed.indexOf("[");
  const brace = trimmed.indexOf("{");
  const start = Math.min(bracket === -1 ? Number.POSITIVE_INFINITY : bracket, brace === -1 ? Number.POSITIVE_INFINITY : brace);
  if (!Number.isFinite(start))
    return null;
  let parsed;
  try {
    parsed = JSON.parse(trimmed.slice(start));
  } catch {
    return null;
  }
  if (parsed == null)
    return null;
  const rows = Array.isArray(parsed) ? parsed : [parsed];
  const facts = [];
  for (const row of rows) {
    if (!row || typeof row !== "object")
      continue;
    const record = row;
    const pid = Number(record.ProcessId);
    if (!Number.isInteger(pid) || pid <= 0)
      continue;
    const parentRaw = record.ParentProcessId;
    const parentPid = parentRaw == null || parentRaw === "" ? Number.NaN : Number(parentRaw);
    const commandLine = typeof record.CommandLine === "string" ? record.CommandLine : null;
    facts.push({
      pid,
      parentPid: Number.isInteger(parentPid) && parentPid > 0 ? parentPid : null,
      commandLine,
      imageName: commandLine ? executableName(commandTokens(commandLine)[0]) : null,
      startTime: parseWindowsCreationDate(record.CreationDate)
    });
  }
  return facts.length > 0 ? facts : null;
}
function snapshotFromFacts(facts, source) {
  const parentByPid = new Map;
  for (const fact of facts) {
    if (fact.parentPid != null)
      parentByPid.set(fact.pid, fact.parentPid);
  }
  return { facts, parentByPid, source };
}
function tryReadWindowsCimSnapshot(exec) {
  try {
    const output = execProcessList(exec, "powershell", ["-NoProfile", "-Command", WINDOWS_CIM_COMMAND], WINDOWS_CIM_PROBE_TIMEOUT_MS);
    const facts = parseWindowsCimOutput(output);
    return facts ? snapshotFromFacts(facts, "cim") : null;
  } catch {
    return null;
  }
}
function tryReadWindowsTasklistSnapshot() {
  try {
    const output = execProcessList(rpcProcessListExecFileSync, "tasklist", ["/FO", "CSV"]);
    const entries = parseTasklistOutput(output);
    if (entries === null)
      return null;
    const facts = entries.map((entry) => ({
      pid: entry.pid,
      parentPid: null,
      commandLine: null,
      imageName: entry.command,
      startTime: null
    }));
    return snapshotFromFacts(facts, "tasklist");
  } catch {
    return null;
  }
}
function readPosixProcessSnapshot() {
  const output = execProcessList(rpcProcessListExecFileSync, "ps", ["-axo", "pid=,command="]);
  const facts = [];
  for (const line of output.split(/\r?\n/)) {
    const match = /^\s*(\d+)\s+(.+)$/.exec(line);
    if (!match)
      continue;
    const pid = Number(match[1]);
    if (!Number.isInteger(pid) || pid <= 0)
      continue;
    facts.push({
      pid,
      parentPid: null,
      commandLine: match[2],
      imageName: executableName(commandTokens(match[2])[0]),
      startTime: null
    });
  }
  return snapshotFromFacts(facts, "ps");
}
function readPosixParentPid(pid) {
  try {
    const output = execProcessList(rpcProcessListExecFileSync, "ps", [
      "-o",
      "ppid=",
      "-p",
      String(pid)
    ]);
    const match = /^\s*(\d+)\s*$/.exec(output);
    if (!match)
      return null;
    const ppid = Number(match[1]);
    return Number.isInteger(ppid) && ppid > 0 ? ppid : null;
  } catch {
    return null;
  }
}
function collectAncestorPids(selfPid, parentByPid) {
  const ancestors = new Set;
  let current = selfPid;
  for (let depth = 0;depth < MAX_ANCESTOR_WALK_DEPTH; depth += 1) {
    let ppid = null;
    if (parentByPid.has(current)) {
      ppid = parentByPid.get(current) ?? null;
    } else if (rpcIdentityPlatform !== "win32") {
      ppid = readPosixParentPid(current);
      if (ppid == null && current === process.pid && process.ppid > 0) {
        ppid = process.ppid;
      }
    } else if (current === process.pid && process.ppid > 0) {
      ppid = process.ppid;
    } else {
      break;
    }
    if (ppid == null || ppid <= 0 || ppid === current || ancestors.has(ppid))
      break;
    ancestors.add(ppid);
    current = ppid;
  }
  return ancestors;
}
function classifyLivePiSnapshot(snapshot) {
  const ancestors = collectAncestorPids(process.pid, snapshot.parentByPid);
  const processIds = new Set;
  const inconclusivePids = new Set;
  const skippedAncestorPids = [];
  for (const fact of snapshot.facts) {
    if (fact.pid === process.pid)
      continue;
    const command = fact.commandLine ?? fact.imageName ?? "";
    const looksLikeHarness = commandHasPiHarnessArc(command) || commandLooksLikePiImage(command);
    if (!looksLikeHarness)
      continue;
    if (ancestors.has(fact.pid)) {
      skippedAncestorPids.push(fact.pid);
      log(`[magic-context] Pi process scan: skipping ancestor PID ${fact.pid} (session launcher shim)`);
      continue;
    }
    if (commandHasPiHarnessArc(command)) {
      processIds.add(fact.pid);
      continue;
    }
    inconclusivePids.add(fact.pid);
    log(`[magic-context] Pi process scan: PID ${fact.pid} command line is ambiguous (image-name or missing Pi/OMP arc); treating as inconclusive`);
  }
  skippedAncestorPids.sort((left, right) => left - right);
  const verified = [...processIds].sort((left, right) => left - right);
  const inconclusive = [...inconclusivePids].sort((left, right) => left - right);
  if (verified.length === 0 && inconclusive.length > 0) {
    return {
      state: "inconclusive",
      processIds: [],
      inconclusivePids: inconclusive,
      ...skippedAncestorPids.length > 0 ? { skippedAncestorPids } : {}
    };
  }
  return {
    state: "known",
    processIds: verified,
    ...inconclusive.length > 0 ? { inconclusivePids: inconclusive } : {},
    ...skippedAncestorPids.length > 0 ? { skippedAncestorPids } : {}
  };
}
function inspectLivePiProcesses() {
  if (false) {}
  try {
    if (rpcIdentityPlatform === "win32") {
      const cim = tryReadWindowsCimSnapshot(rpcProcessListExecFileSync);
      const snapshot = cim ?? tryReadWindowsTasklistSnapshot();
      if (!snapshot) {
        return {
          state: "unreadable",
          processIds: [],
          error: "process list unavailable"
        };
      }
      rememberWindowsProcessFacts(snapshot.facts);
      return classifyLivePiSnapshot(snapshot);
    }
    return classifyLivePiSnapshot(readPosixProcessSnapshot());
  } catch (error) {
    return {
      state: "unreadable",
      processIds: [],
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
function parseRpcPortFile(content, fallbackPid = 0) {
  const trimmed = content.trim();
  if (!trimmed)
    return null;
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      const port = Number(parsed.port);
      const pid = Number(parsed.pid);
      const startedAt = Number(parsed.started_at);
      if (!isValidPort(port) || !Number.isInteger(pid) || pid <= 0)
        return null;
      return {
        port,
        pid,
        started_at: Number.isFinite(startedAt) ? startedAt : 0,
        kind: typeof parsed.kind === "string" ? parsed.kind : undefined,
        harness: typeof parsed.harness === "string" ? parsed.harness : undefined,
        token: typeof parsed.token === "string" ? parsed.token : undefined,
        instance_id: typeof parsed.instance_id === "string" ? parsed.instance_id : undefined
      };
    } catch {
      return null;
    }
  }
  const port = Number.parseInt(trimmed, 10);
  if (!isValidPort(port))
    return null;
  return { port, pid: fallbackPid, started_at: 0 };
}
function isValidPort(port) {
  return Number.isInteger(port) && port > 0 && port <= 65535;
}

// ../plugin/src/shared/sqlite.ts
var reportSlowPrivilegedWrite;
function registerSlowWriteReporter(reporter) {
  reportSlowPrivilegedWrite = reporter;
}
function detectSqliteRuntime() {
  const hasBunVersion = typeof process !== "undefined" && typeof process.versions?.bun === "string";
  const hasBunGlobal = typeof globalThis !== "undefined" && typeof globalThis.Bun !== "undefined";
  return hasBunVersion || hasBunGlobal ? "Bun" : "Node.js";
}
var bunSpec = "bun:" + "sqlite";
var nodeSpec = "node:" + "sqlite";
async function importSqliteModule(specifier) {
  return await import(specifier);
}
function isModuleNotFoundError(error, specifier) {
  const candidate = error;
  const code = typeof candidate?.code === "string" ? candidate.code : "";
  const name = typeof candidate?.name === "string" ? candidate.name : "";
  const message = error instanceof Error ? error.message : String(error ?? "");
  const details = `${code} ${name} ${message}`.toLowerCase();
  const mentionsSpecifier = details.includes(specifier.toLowerCase());
  if (!mentionsSpecifier)
    return false;
  return code === "ERR_MODULE_NOT_FOUND" || code === "ERR_UNKNOWN_BUILTIN_MODULE" || code === "MODULE_NOT_FOUND" || name === "ResolveMessage" || details.includes("module not found") || details.includes("cannot find module") || details.includes("cannot find package") || details.includes("no such built-in module");
}

class SqliteRuntimeUnavailableError extends Error {
  runtime;
  specifier;
  constructor(runtime, specifier, cause) {
    const requirement = specifier === nodeSpec ? "Requires Node.js >= 24, or Bun with bun:sqlite — this Bun build lacks node:sqlite." : "Requires Bun with bun:sqlite, or Node.js >= 24 — this Bun build lacks bun:sqlite.";
    super(`Magic Context detected ${runtime}, but could not load ${specifier}. ${requirement}`, { cause });
    this.name = "SqliteRuntimeUnavailableError";
    this.runtime = runtime;
    this.specifier = specifier;
  }
}
async function loadSqliteModule(runtime = detectSqliteRuntime(), importer = importSqliteModule) {
  const specifier = runtime === "Bun" ? bunSpec : nodeSpec;
  try {
    return await importer(specifier);
  } catch (error) {
    if (isModuleNotFoundError(error, specifier)) {
      throw new SqliteRuntimeUnavailableError(runtime, specifier, error);
    }
    throw error;
  }
}
var detectedRuntime = detectSqliteRuntime();
var isBun = detectedRuntime === "Bun";
var sqliteModule = await loadSqliteModule(detectedRuntime);
var DatabaseImpl = isBun ? sqliteModule.Database : buildNodeSqliteDatabaseClass(sqliteModule.DatabaseSync);
var trackedSqliteConnections = new Map;
var nextSqliteConnectionSequence = 1;
function trackSqliteConnection(db, filename, options) {
  const originalClose = db.close.bind(db);
  const sequence = nextSqliteConnectionSequence++;
  const metadata = {
    sequence,
    filename: typeof filename === "string" ? filename : Buffer.isBuffer(filename) ? "<buffer>" : ":memory:",
    readonly: Boolean(options) && typeof options === "object" && (options.readonly === true || options.readOnly === true)
  };
  Object.defineProperty(db, "close", {
    configurable: true,
    value: (...args) => {
      try {
        return originalClose(...args);
      } finally {
        trackedSqliteConnections.delete(sequence);
      }
    }
  });
  trackedSqliteConnections.set(sequence, {
    ...metadata,
    reference: new WeakRef(db)
  });
  return db;
}
var TrackedDatabase = new Proxy(DatabaseImpl, {
  construct(target, args) {
    const db = Reflect.construct(target, args, target);
    return trackSqliteConnection(db, args[0], args[1]);
  }
});
function buildNodeSqliteDatabaseClass(DatabaseSync) {
  const SAVEPOINT = "mc_tx_sp";

  class NodeSqliteDatabase extends DatabaseSync {
    constructor(filename, options) {
      const translated = { ...options };
      if (options && "readonly" in options) {
        translated.readOnly = options.readonly;
        delete translated.readonly;
      }
      super(typeof filename === "string" ? filename : ":memory:", translated);
    }
    prepare(sql) {
      const stmt = super.prepare(sql);
      for (const method of ["run", "get", "all"]) {
        const original = stmt[method].bind(stmt);
        stmt[method] = (...args) => args.length === 1 && Array.isArray(args[0]) ? original(...args[0]) : original(...args);
      }
      return stmt;
    }
    transaction(fn) {
      const self = this;
      const execute = (mode, receiver, args) => {
        const nested = self.isTransaction === true;
        self.exec(nested ? `SAVEPOINT ${SAVEPOINT}` : `BEGIN${mode ? ` ${mode}` : ""}`);
        try {
          const result = fn.apply(receiver, args);
          self.exec(nested ? `RELEASE ${SAVEPOINT}` : "COMMIT");
          return result;
        } catch (error) {
          if (nested) {
            self.exec(`ROLLBACK TO ${SAVEPOINT}`);
            self.exec(`RELEASE ${SAVEPOINT}`);
          } else {
            self.exec("ROLLBACK");
          }
          throw error;
        }
      };
      const wrapped = function(...args) {
        return execute("", this, args);
      };
      wrapped.default = function(...args) {
        return execute("", this, args);
      };
      wrapped.deferred = function(...args) {
        return execute("DEFERRED", this, args);
      };
      wrapped.immediate = function(...args) {
        return execute("IMMEDIATE", this, args);
      };
      wrapped.exclusive = function(...args) {
        return execute("EXCLUSIVE", this, args);
      };
      return wrapped;
    }
  }
  return NodeSqliteDatabase;
}
var Database = TrackedDatabase;
var privilegeDepth = new WeakMap;
function isInTransaction(db) {
  const candidate = db;
  return candidate.inTransaction === true || candidate.isTransaction === true;
}
function withPrivilegedWriter(db, operation) {
  const previousDepth = privilegeDepth.get(db) ?? 0;
  const nested = isInTransaction(db);
  const savepoint = "mc_privilege_scope";
  const transactionStartedAt = nested ? undefined : performance.now();
  if (nested) {
    db.exec(`SAVEPOINT ${savepoint}`);
  } else {
    db.exec("BEGIN IMMEDIATE");
  }
  privilegeDepth.set(db, previousDepth + 1);
  try {
    db.prepare("INSERT INTO context_privilege_state(id, enabled) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET enabled = 1").run();
    const result = operation();
    if (previousDepth === 0) {
      db.prepare("UPDATE context_privilege_state SET enabled = 0 WHERE id = 1").run();
    }
    if (nested) {
      db.exec(`RELEASE ${savepoint}`);
    } else {
      db.exec("COMMIT");
      if (transactionStartedAt !== undefined) {
        reportSlowPrivilegedWrite?.("privileged_writer", transactionStartedAt);
      }
    }
    if (previousDepth > 0)
      privilegeDepth.set(db, previousDepth);
    else
      privilegeDepth.delete(db);
    return result;
  } catch (error) {
    try {
      if (nested) {
        db.exec(`ROLLBACK TO ${savepoint}`);
        db.exec(`RELEASE ${savepoint}`);
      } else {
        db.exec("ROLLBACK");
      }
    } finally {
      if (previousDepth > 0)
        privilegeDepth.set(db, previousDepth);
      else
        privilegeDepth.delete(db);
    }
    throw error;
  }
}

// ../plugin/src/shared/sqlite-helpers.ts
function closeQuietly(db) {
  if (!db)
    return;
  try {
    db.close();
  } catch {}
}

// ../plugin/src/shared/storage-permissions.ts
var enforcePrivateStoragePermissions = true;
function shouldEnforcePrivateStoragePermissions() {
  return enforcePrivateStoragePermissions;
}

// ../plugin/src/shared/write-transaction-timing.ts
var SLOW_WRITE_TRANSACTION_THRESHOLD_MS = 1000;
function logSlowWriteTransaction(site, startedAt, thresholdMs = SLOW_WRITE_TRANSACTION_THRESHOLD_MS, completedAtMs = performance.now()) {
  try {
    const durationMs = completedAtMs - startedAt;
    if (durationMs < thresholdMs)
      return;
    log(`[magic-context] slow write transaction: site=${site} held=${durationMs.toFixed(1)}ms`);
  } catch {}
}

// ../plugin/src/features/magic-context/context-authority.ts
import { createHash as createHash2, randomUUID } from "node:crypto";
var AUTHORITY_DOMAINS = ["memories", "notes"];
var observedAuthorityRoutingByProject = new Map;
var moduleNoteEvaluationBridges = new Map;
function getModuleNoteEvaluationBridge(projectPath) {
  return moduleNoteEvaluationBridges.get(projectPath);
}
function getContextStoreUuid(db) {
  const row = db.prepare("SELECT value FROM context_store_meta WHERE key = 'store_uuid'").get();
  return typeof row?.value === "string" && row.value.length > 0 ? row.value : null;
}
function ensureContextStoreUuid(db) {
  const existing = getContextStoreUuid(db);
  if (existing)
    return existing;
  const minted = randomUUID();
  withPrivilegedWriter(db, () => {
    db.transaction(() => {
      db.prepare("INSERT INTO context_store_meta(key, value) VALUES ('store_uuid', ?) ON CONFLICT(key) DO NOTHING").run(minted);
    }).immediate();
  });
  return getContextStoreUuid(db) ?? minted;
}
function bumpDomainMutationEpoch(db, projectPath, domain) {
  db.prepare(`INSERT INTO domain_mutation_epoch(project_path, domain, epoch) VALUES (?, ?, 1)
         ON CONFLICT(project_path, domain) DO UPDATE SET epoch = epoch + 1`).run(projectPath, domain);
}
var MAX_AUTHORITY_SEED_FRAME_BYTES = 900 * 1024;
function getMirrorCursor(db, domain) {
  const row = db.prepare("SELECT cursor FROM mirror_cursors WHERE domain = ?").get(domain);
  return typeof row?.cursor === "number" ? row.cursor : 0;
}
function rowNumber(row, key, fallback = 0) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : fallback;
}
function rowString(row, key, fallback = "") {
  const value = row[key];
  return typeof value === "string" ? value : fallback;
}
function rowNullableString(row, key) {
  const value = row[key];
  return typeof value === "string" ? value : null;
}
var MEMORY_SNAPSHOT_COLUMNS = [
  "id",
  "project_path",
  "category",
  "content",
  "normalized_hash",
  "importance",
  "scope",
  "shareable",
  "source_session_id",
  "source_type",
  "seen_count",
  "retrieval_count",
  "first_seen_at",
  "created_at",
  "updated_at",
  "last_seen_at",
  "last_retrieved_at",
  "status",
  "expires_at",
  "verification_status",
  "verified_at",
  "classified_at",
  "superseded_by_memory_id",
  "merged_from",
  "metadata_json",
  "context_store_uuid",
  "context_row_id",
  "mural_cue",
  "mural_cue_hash",
  "mural_cue_at",
  "mural_cue_rejection_count"
];
var IMMUTABLE_MEMORY_SNAPSHOT_COLUMNS = ["project_path", "first_seen_at", "created_at"];
var CLASSIFICATION_MEMORY_SNAPSHOT_COLUMNS = [
  "importance",
  "scope",
  "shareable",
  "source_type",
  "classified_at"
];
var VERIFICATION_MEMORY_SNAPSHOT_COLUMNS = [
  "verification_status",
  "verified_at",
  "mapping",
  "mapping_origin"
];
var MURAL_MEMORY_SNAPSHOT_COLUMNS = [
  "mural_cue",
  "mural_cue_hash",
  "mural_cue_at",
  "mural_cue_rejection_count"
];
var UPDATED_MEMORY_SNAPSHOT_COLUMNS = [
  "category",
  "content",
  "normalized_hash",
  "source_session_id",
  "seen_count",
  "retrieval_count",
  "updated_at",
  "last_seen_at",
  "last_retrieved_at",
  "status",
  "expires_at",
  "superseded_by_memory_id",
  "merged_from",
  "metadata_json"
];
function memorySnapshotTimestamp(row, key) {
  const value = row[key];
  return typeof value === "number" && Number.isFinite(value) ? value : 0;
}
function parsedMemorySnapshot(snapshotJson, fallback) {
  try {
    const parsed = JSON.parse(snapshotJson);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : fallback;
  } catch {
    return fallback;
  }
}
function guardMemorySnapshotByRecency(args) {
  const effectiveRow = { ...args.row };
  if (!args.existing) {
    return { effectiveRow, hostUpdatedNewer: false, hostVerificationNewer: false };
  }
  const existing = args.existing;
  const preserve = (columns) => {
    for (const column of columns) {
      if (Object.hasOwn(existing, column)) {
        effectiveRow[column] = existing[column];
      }
    }
  };
  preserve(IMMUTABLE_MEMORY_SNAPSHOT_COLUMNS);
  const hostUpdatedNewer = memorySnapshotTimestamp(existing, "updated_at") > memorySnapshotTimestamp(args.snapshot, "updated_at");
  const hostClassificationNewer = hostUpdatedNewer || memorySnapshotTimestamp(existing, "classified_at") > memorySnapshotTimestamp(args.snapshot, "classified_at");
  const snapshotCarriesUpdatedAt = hasSnapshotField(args.snapshot, "updated_at");
  const hostVerificationNewer = hostUpdatedNewer && snapshotCarriesUpdatedAt;
  const hostMuralNewer = hostUpdatedNewer && snapshotCarriesUpdatedAt;
  if (hostUpdatedNewer)
    preserve(UPDATED_MEMORY_SNAPSHOT_COLUMNS);
  if (hostClassificationNewer)
    preserve(CLASSIFICATION_MEMORY_SNAPSHOT_COLUMNS);
  if (hostVerificationNewer)
    preserve(VERIFICATION_MEMORY_SNAPSHOT_COLUMNS);
  if (hostMuralNewer)
    preserve(MURAL_MEMORY_SNAPSHOT_COLUMNS);
  return { effectiveRow, hostUpdatedNewer, hostVerificationNewer };
}
function hasSnapshotField(row, key) {
  return Object.prototype.hasOwnProperty.call(row, key);
}
function isCompleteMemorySnapshot(row) {
  return MEMORY_SNAPSHOT_COLUMNS.every((column) => hasSnapshotField(row, column));
}
function memoryResnapshotState(db) {
  const row = db.prepare("SELECT status, generation, updated_at FROM mirror_resnapshot_state WHERE domain = 'memories'").get();
  return row ?? null;
}
function casMemoryResnapshotState(db, observed, status, generation) {
  const result = db.prepare(`UPDATE mirror_resnapshot_state
                SET status = ?, generation = ?, updated_at = ?
              WHERE domain = 'memories'
                AND status = ?
                AND generation IS ?`).run(status, generation, Date.now(), observed.status, observed.generation);
  return result.changes === 1;
}
function upgradeMemoryMirrorNeedsResnapshot(db) {
  const missingLive = db.prepare(`SELECT 1
               FROM mirror_identity identity
              WHERE identity.domain = 'memories'
                AND NOT EXISTS (
                    SELECT 1
                      FROM mirror_live_memory_rows live
                     WHERE live.module_project = identity.module_project
                       AND live.module_row_id = identity.module_row_id
                )
              LIMIT 1`).get();
  if (missingLive)
    return true;
  const orphanedLive = db.prepare(`SELECT 1
               FROM mirror_live_memory_rows live
              WHERE NOT EXISTS (
                    SELECT 1
                      FROM mirror_identity identity
                     WHERE identity.domain = 'memories'
                       AND identity.module_project = live.module_project
                       AND identity.module_row_id = live.module_row_id
              )
              LIMIT 1`).get();
  return Boolean(orphanedLive);
}
function stageLiveMemorySnapshotPage(db, generation, rows) {
  const owned = db.prepare(`SELECT 1
               FROM mirror_resnapshot_state
              WHERE domain = 'memories'
                AND status = 'resnapshotting'
                AND generation = ?`).get(generation);
  if (!owned)
    return false;
  const insert = db.prepare(`INSERT OR IGNORE INTO mirror_live_staging(
             generation, module_project, module_row_id, category, normalized_hash, full_row_snapshot
          ) VALUES (?, ?, ?, ?, ?, ?)`);
  for (const feed of rows) {
    const row = feed.full_row_snapshot;
    const moduleProject = rowString(row, "project_path");
    const normalizedHash = rowString(row, "normalized_hash");
    if (!moduleProject || !normalizedHash) {
      throw new Error("live memory snapshot omitted project_path or normalized_hash");
    }
    insert.run(generation, moduleProject, feed.module_row_id, rowString(row, "category", "CONSTRAINTS"), normalizedHash, JSON.stringify(row));
  }
  return true;
}
function installStagedLiveMemorySnapshot(db, generation) {
  const owned = db.prepare(`SELECT 1
               FROM mirror_resnapshot_state
              WHERE domain = 'memories'
                AND status = 'resnapshotting'
                AND generation = ?`).get(generation);
  if (!owned)
    return false;
  db.prepare("DELETE FROM mirror_live_memory_rows").run();
  db.prepare(`INSERT INTO mirror_live_memory_rows(
            module_project, module_row_id, category, normalized_hash, full_row_snapshot
         )
         SELECT module_project, module_row_id, category, normalized_hash, full_row_snapshot
           FROM mirror_live_staging
          WHERE generation = ?`).run(generation);
  const completed = db.prepare(`UPDATE mirror_resnapshot_state
                SET status = 'complete', updated_at = ?
              WHERE domain = 'memories'
                AND status = 'resnapshotting'
                AND generation = ?`).run(Date.now(), generation);
  if (completed.changes !== 1) {
    throw new Error("live memory resnapshot ownership changed inside its install transaction");
  }
  db.prepare("DELETE FROM mirror_live_staging WHERE generation = ?").run(generation);
  return true;
}
function ensureMemoryRepairState(db) {
  db.exec(`
        CREATE TABLE IF NOT EXISTS mirror_memory_repair_state (
            id INTEGER PRIMARY KEY CHECK(id = 1),
            dirty INTEGER NOT NULL DEFAULT 0 CHECK(dirty IN (0, 1)),
            updated_at INTEGER NOT NULL DEFAULT 0
        );
    `);
  db.prepare("INSERT OR IGNORE INTO mirror_memory_repair_state(id, dirty, updated_at) VALUES (1, 0, 0)").run();
}
function markMemoryRepairPending(db) {
  ensureMemoryRepairState(db);
  db.prepare("UPDATE mirror_memory_repair_state SET dirty = 1, updated_at = ? WHERE id = 1").run(Date.now());
}
function prepareMirrorPageStatements(db) {
  return {
    identityByModule: db.prepare("SELECT context_row_id FROM mirror_identity WHERE domain = ? AND module_project = ? AND module_row_id = ?"),
    insertIdentity: db.prepare("INSERT OR IGNORE INTO mirror_identity(domain, module_project, module_row_id, context_row_id) VALUES (?, ?, ?, ?)"),
    deleteIdentityByContext: db.prepare("DELETE FROM mirror_identity WHERE domain = ? AND context_row_id = ?"),
    deleteLiveMemory: db.prepare("DELETE FROM mirror_live_memory_rows WHERE module_project = ? AND module_row_id = ?"),
    deletePendingReferencesForMemory: db.prepare("DELETE FROM mirror_pending_references WHERE domain = ? AND module_project = ? AND (module_row_id = ? OR target_module_row_id = ?)"),
    deleteIdentity: db.prepare("DELETE FROM mirror_identity WHERE domain = ? AND module_project = ? AND module_row_id = ?"),
    sharedIdentity: db.prepare("SELECT 1 FROM mirror_identity WHERE domain = ? AND context_row_id = ? LIMIT 1"),
    memoryById: db.prepare(`SELECT project_path, category, content, normalized_hash, importance, scope, shareable,
                    source_session_id, source_type, seen_count, retrieval_count, first_seen_at,
                    created_at, updated_at, last_seen_at, last_retrieved_at, status, expires_at,
                     verification_status, verified_at, classified_at, superseded_by_memory_id,
                     merged_from, metadata_json, mural_cue, mural_cue_hash, mural_cue_at,
                     mural_cue_rejection_count
                FROM memories WHERE id = ?`),
    memoryIdByStoreId: db.prepare("SELECT id FROM memories WHERE id = ? AND project_path = ?"),
    memoryCandidates: db.prepare("SELECT id FROM memories WHERE project_path = ? AND category = ? AND normalized_hash = ? ORDER BY id"),
    insertMemory: db.prepare("INSERT INTO memories (project_path, category, content, normalized_hash, first_seen_at, created_at, updated_at, last_seen_at) VALUES (?, ?, '', '', 0, 0, 0, 0)"),
    liveMemoryMatches: db.prepare(`SELECT module_project, module_row_id FROM mirror_live_memory_rows
              WHERE module_project = ? AND category = ? AND normalized_hash = ?
              ORDER BY module_row_id LIMIT 2`),
    deleteMemoryEmbeddings: db.prepare("DELETE FROM memory_embeddings WHERE memory_id = ?"),
    deleteMemory: db.prepare("DELETE FROM memories WHERE id = ?"),
    liveMemorySnapshot: db.prepare("SELECT full_row_snapshot FROM mirror_live_memory_rows WHERE module_project = ? AND module_row_id = ?"),
    upsertLiveMemory: db.prepare(`INSERT INTO mirror_live_memory_rows(
                 module_project, module_row_id, category, normalized_hash, full_row_snapshot
             ) VALUES (?, ?, ?, ?, ?)
             ON CONFLICT(module_project, module_row_id) DO UPDATE SET
                 category = excluded.category,
                 normalized_hash = excluded.normalized_hash,
                 full_row_snapshot = excluded.full_row_snapshot`),
    updateMemory: db.prepare(`UPDATE memories SET project_path = ?, category = ?, content = ?, normalized_hash = ?,
             importance = ?, scope = ?, shareable = ?, source_session_id = ?, source_type = ?,
             seen_count = ?, retrieval_count = ?, first_seen_at = ?, created_at = ?, updated_at = ?,
             last_seen_at = ?, last_retrieved_at = ?, status = ?, expires_at = ?,
              verification_status = ?, verified_at = ?, classified_at = ?, superseded_by_memory_id = ?,
              merged_from = ?, metadata_json = ?, mural_cue = ?, mural_cue_hash = ?, mural_cue_at = ?,
              mural_cue_rejection_count = ? WHERE id = ?`),
    updateSuperseded: db.prepare("UPDATE memories SET superseded_by_memory_id = ?, updated_at = ? WHERE id = ?"),
    deletePendingReference: db.prepare("DELETE FROM mirror_pending_references WHERE domain = 'memories' AND module_project = ? AND module_row_id = ?"),
    upsertPendingReference: db.prepare("INSERT INTO mirror_pending_references(domain, module_project, module_row_id, target_module_row_id) VALUES ('memories', ?, ?, ?) ON CONFLICT(domain, module_project, module_row_id) DO UPDATE SET target_module_row_id = excluded.target_module_row_id"),
    deleteMemoryVerifications: db.prepare("DELETE FROM memory_verifications WHERE memory_id = ?"),
    insertMemoryVerification: db.prepare("INSERT INTO memory_verifications(memory_id, file_path, verified_at, mapped_at, mapping_origin) VALUES (?, ?, ?, ?, ?)"),
    noteById: db.prepare("SELECT * FROM notes WHERE id = ?"),
    noteIdByStoreId: db.prepare("SELECT id FROM notes WHERE id = ? AND type = 'smart' AND project_path = ?"),
    insertNote: db.prepare("INSERT INTO notes (type, status, content, project_path, session_id, created_at, updated_at) VALUES ('smart', 'active', '', ?, ?, 0, 0)"),
    deleteNote: db.prepare("DELETE FROM notes WHERE id = ?"),
    deleteNoteRevisions: db.prepare("DELETE FROM mirror_note_revisions WHERE module_project = ? AND module_row_id = ?"),
    updateNote: db.prepare(`UPDATE notes SET type = ?, status = ?, project_path = ?, session_id = ?, content = ?,
             surface_condition = ?, compiled_provider = ?, compiled_config = ?, compiled_at = ?, compile_status = ?,
             ready_at = ?, ready_reason = ?, manifest_json = ?, compiled_check = ?,
             check_hash = ?, check_cron = ?, check_failure_count = ?, check_network_failure_count = ?,
             check_quarantined_until = ?, check_next_due_at = ?, check_compiled_at = ?, check_false_since_at = ?,
             check_last_liveness_at = ?, last_checked_at = ?, check_status = ?, check_version = ?,
             policy_version = ?, anchor_block_id = ?, anchor_ordinal = ?, created_at = ?, updated_at = ? WHERE id = ?`),
    upsertNoteRevision: db.prepare("INSERT OR REPLACE INTO mirror_note_revisions(module_project, module_row_id, context_row_id, status_version) VALUES (?, ?, ?, ?)"),
    translateMemoryReferences: db.prepare(`UPDATE memories
                SET superseded_by_memory_id = (
                    SELECT target.context_row_id
                      FROM mirror_pending_references pending
                      JOIN mirror_identity source
                        ON source.domain = pending.domain
                       AND source.module_project = pending.module_project
                       AND source.module_row_id = pending.module_row_id
                      JOIN mirror_identity target
                        ON target.domain = pending.domain
                       AND target.module_project = pending.module_project
                       AND target.module_row_id = pending.target_module_row_id
                     WHERE pending.domain = 'memories'
                       AND source.context_row_id = memories.id
                ),
                    updated_at = ?
              WHERE id IN (
                    SELECT source.context_row_id
                      FROM mirror_pending_references pending
                      JOIN mirror_identity source
                        ON source.domain = pending.domain
                       AND source.module_project = pending.module_project
                       AND source.module_row_id = pending.module_row_id
                      JOIN mirror_identity target
                        ON target.domain = pending.domain
                       AND target.module_project = pending.module_project
                       AND target.module_row_id = pending.target_module_row_id
                     WHERE pending.domain = 'memories'
              )`),
    clearTranslatedReferences: db.prepare(`DELETE FROM mirror_pending_references
              WHERE domain = 'memories'
                AND EXISTS (
                    SELECT 1
                      FROM mirror_identity source
                      JOIN mirror_identity target
                        ON target.domain = source.domain
                       AND target.module_project = source.module_project
                       AND target.module_row_id = mirror_pending_references.target_module_row_id
                     WHERE source.domain = mirror_pending_references.domain
                       AND source.module_project = mirror_pending_references.module_project
                       AND source.module_row_id = mirror_pending_references.module_row_id
                )`),
    repairPending: db.prepare("SELECT dirty FROM mirror_memory_repair_state WHERE id = 1"),
    markRepairPending: db.prepare("UPDATE mirror_memory_repair_state SET dirty = 1, updated_at = ? WHERE id = 1"),
    clearRepairPending: db.prepare("UPDATE mirror_memory_repair_state SET dirty = 0, updated_at = ? WHERE id = 1"),
    repairCandidates: db.prepare(`SELECT memory.id, memory.updated_at, memory.classified_at, live.full_row_snapshot
               FROM memories memory
               JOIN mirror_identity identity
                 ON identity.domain = 'memories'
                AND identity.context_row_id = memory.id
               JOIN mirror_live_memory_rows live
                 ON live.module_project = identity.module_project
                AND live.module_row_id = identity.module_row_id
               JOIN authority_managed managed
                 ON managed.project_path = memory.project_path
                  OR managed.project_path = identity.module_project
              WHERE (memory.source_type IS NULL OR memory.importance IS NULL)
                AND live.full_row_snapshot IS NOT NULL`),
    repairMemory: db.prepare(`UPDATE memories
                SET source_type = COALESCE(source_type, ?),
                    importance = COALESCE(importance, ?),
                    updated_at = ?
              WHERE id = ?
                AND COALESCE(updated_at, 0) <= ?
                AND COALESCE(classified_at, 0) <= ?
                AND ((source_type IS NULL AND ? IS NOT NULL)
                  OR (importance IS NULL AND ? IS NOT NULL))`),
    updateCursor: db.prepare("INSERT INTO mirror_cursors(domain, cursor, updated_at) VALUES (?, ?, ?) ON CONFLICT(domain) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at"),
    contextStoreUuid: getContextStoreUuid(db)
  };
}
function mirrorIdentity(db, domain, moduleProject, moduleRowId, statements) {
  return (statements?.identityByModule ?? db.prepare("SELECT context_row_id FROM mirror_identity WHERE domain = ? AND module_project = ? AND module_row_id = ?")).get(domain, moduleProject, moduleRowId) ?? null;
}
function rememberIdentity(db, domain, moduleProject, moduleRowId, contextRowId, statements, replaceContextIdentity = domain === "notes") {
  const existing = mirrorIdentity(db, domain, moduleProject, moduleRowId, statements);
  if (existing?.context_row_id === contextRowId)
    return;
  if (existing) {
    if (!replaceContextIdentity)
      return;
    (statements?.deleteIdentity ?? db.prepare("DELETE FROM mirror_identity WHERE domain = ? AND module_project = ? AND module_row_id = ?")).run(domain, moduleProject, moduleRowId);
  }
  if (replaceContextIdentity) {
    (statements?.deleteIdentityByContext ?? db.prepare("DELETE FROM mirror_identity WHERE domain = ? AND context_row_id = ?")).run(domain, contextRowId);
  }
  (statements?.insertIdentity ?? db.prepare("INSERT OR IGNORE INTO mirror_identity(domain, module_project, module_row_id, context_row_id) VALUES (?, ?, ?, ?)")).run(domain, moduleProject, moduleRowId, contextRowId);
}
function contextMemoryId(db, domain, moduleProject, row, moduleRowId, statements) {
  const mapped = mirrorIdentity(db, domain, moduleProject, moduleRowId, statements);
  if (mapped)
    return { contextId: mapped.context_row_id, inserted: false };
  const sourceUuid = rowNullableString(row, "context_store_uuid");
  const sourceId = rowNumber(row, "context_row_id", -1);
  const localStoreUuid = statements?.contextStoreUuid ?? getContextStoreUuid(db);
  if (sourceUuid && sourceUuid === localStoreUuid && sourceId >= 0) {
    const existing = (statements?.memoryIdByStoreId ?? db.prepare("SELECT id FROM memories WHERE id = ? AND project_path = ?")).get(sourceId, moduleProject);
    if (existing?.id !== undefined) {
      rememberIdentity(db, domain, moduleProject, moduleRowId, existing.id, statements, true);
      return { contextId: existing.id, inserted: false };
    }
  }
  const normalizedHash = rowString(row, "normalized_hash");
  const category = rowString(row, "category", "CONSTRAINTS");
  if (normalizedHash) {
    const candidates = (statements?.memoryCandidates ?? db.prepare("SELECT id FROM memories WHERE project_path = ? AND category = ? AND normalized_hash = ? ORDER BY id")).all(moduleProject, category, normalizedHash);
    if (candidates.length === 1 && candidates[0]?.id !== undefined) {
      rememberIdentity(db, domain, moduleProject, moduleRowId, candidates[0].id, statements);
      return { contextId: candidates[0].id, inserted: false };
    }
  }
  const result = (statements?.insertMemory ?? db.prepare("INSERT INTO memories (project_path, category, content, normalized_hash, first_seen_at, created_at, updated_at, last_seen_at) VALUES (?, ?, '', '', 0, 0, 0, 0)")).run(moduleProject, rowString(row, "category", "CONSTRAINTS"));
  const contextId = Number(result.lastInsertRowid);
  rememberIdentity(db, domain, moduleProject, moduleRowId, contextId, statements);
  return { contextId, inserted: true };
}
function applyMemoryRow(db, feed, statements) {
  const row = feed.full_row_snapshot;
  const moduleProject = rowString(row, "project_path");
  if (!moduleProject)
    throw new Error("memory feed snapshot has no project_path");
  if (feed.op === "tombstone") {
    statements.deleteLiveMemory.run(moduleProject, feed.module_row_id);
    statements.deletePendingReferencesForMemory.run(feed.domain, moduleProject, feed.module_row_id, feed.module_row_id);
    const mapped = mirrorIdentity(db, feed.domain, moduleProject, feed.module_row_id, statements);
    if (!mapped)
      return;
    statements.deleteIdentity.run(feed.domain, moduleProject, feed.module_row_id);
    const shared = statements.sharedIdentity.get(feed.domain, mapped.context_row_id);
    if (shared)
      return;
    const contextRow = statements.memoryById.get(mapped.context_row_id);
    if (contextRow?.project_path && contextRow.category && contextRow.normalized_hash) {
      const liveMatches = statements.liveMemoryMatches.all(contextRow.project_path, contextRow.category, contextRow.normalized_hash);
      if (liveMatches.length === 1 && liveMatches[0]) {
        rememberIdentity(db, feed.domain, liveMatches[0].module_project, liveMatches[0].module_row_id, mapped.context_row_id, statements);
        return;
      }
    }
    statements.deleteMemoryEmbeddings.run(mapped.context_row_id);
    statements.deleteMemory.run(mapped.context_row_id);
    return;
  }
  const storedLive = statements.liveMemorySnapshot.get(moduleProject, feed.module_row_id);
  const snapshotJson = !isCompleteMemorySnapshot(row) && storedLive?.full_row_snapshot ? storedLive.full_row_snapshot : JSON.stringify(row);
  statements.upsertLiveMemory.run(moduleProject, feed.module_row_id, rowString(row, "category", "CONSTRAINTS"), rowString(row, "normalized_hash"), snapshotJson);
  const metadataClobberRisk = hasSnapshotField(row, "source_type") && rowNullableString(row, "source_type") === null || hasSnapshotField(row, "importance") && !(typeof row.importance === "number" && Number.isFinite(row.importance));
  if (metadataClobberRisk)
    statements.markRepairPending.run(Date.now());
  const { contextId, inserted } = contextMemoryId(db, feed.domain, moduleProject, row, feed.module_row_id, statements);
  const existing = statements.memoryById.get(contextId);
  if (existing && existing.project_path !== moduleProject) {
    log(`[magic-context] skipping memory mirror update for module ${moduleProject}/${feed.module_row_id}: context row ${contextId} belongs to ${existing.project_path}`);
    return;
  }
  const retainedRecencySnapshot = parsedMemorySnapshot(snapshotJson, row);
  const recencySnapshot = hasSnapshotField(row, "updated_at") ? row : hasSnapshotField(row, "classified_at") ? { ...retainedRecencySnapshot, classified_at: row.classified_at } : retainedRecencySnapshot;
  const recencyGuard = guardMemorySnapshotByRecency({
    row,
    snapshot: recencySnapshot,
    existing: inserted ? undefined : existing
  });
  const projectedRow = recencyGuard.effectiveRow;
  const has = (key) => hasSnapshotField(row, key);
  const nullableNumber = (key, previous) => has(key) ? typeof projectedRow[key] === "number" && Number.isFinite(projectedRow[key]) ? projectedRow[key] : null : previous ?? null;
  const nullableString = (key, previous) => has(key) ? rowNullableString(projectedRow, key) : previous ?? null;
  const hasSuperseded = has("superseded_by_memory_id") && !recencyGuard.hostUpdatedNewer;
  const previousHash = existing?.normalized_hash;
  statements.updateMemory.run(has("project_path") ? rowString(projectedRow, "project_path") : existing?.project_path ?? moduleProject, has("category") ? rowString(projectedRow, "category", "CONSTRAINTS") : existing?.category ?? "CONSTRAINTS", has("content") ? rowString(projectedRow, "content") : existing?.content ?? "", has("normalized_hash") ? rowString(projectedRow, "normalized_hash") : existing?.normalized_hash ?? "", has("importance") ? typeof projectedRow.importance === "number" && Number.isFinite(projectedRow.importance) ? projectedRow.importance : null : existing?.importance ?? null, has("scope") ? rowString(projectedRow, "scope", "project") : existing?.scope ?? "project", has("shareable") ? rowNumber(projectedRow, "shareable") : existing?.shareable ?? 0, nullableString("source_session_id", existing?.source_session_id), nullableString("source_type", existing?.source_type), has("seen_count") ? rowNumber(projectedRow, "seen_count", 1) : existing?.seen_count ?? 1, has("retrieval_count") ? rowNumber(projectedRow, "retrieval_count") : existing?.retrieval_count ?? 0, has("first_seen_at") ? rowNumber(projectedRow, "first_seen_at") : existing?.first_seen_at ?? 0, has("created_at") ? rowNumber(projectedRow, "created_at") : existing?.created_at ?? 0, has("updated_at") ? rowNumber(projectedRow, "updated_at") : existing?.updated_at ?? 0, has("last_seen_at") ? rowNumber(projectedRow, "last_seen_at") : existing?.last_seen_at ?? 0, nullableNumber("last_retrieved_at", existing?.last_retrieved_at), has("status") ? rowString(projectedRow, "status", "active") : existing?.status ?? "active", nullableNumber("expires_at", existing?.expires_at), has("verification_status") ? rowString(projectedRow, "verification_status", "unverified") : existing?.verification_status ?? "unverified", nullableNumber("verified_at", existing?.verified_at), nullableNumber("classified_at", existing?.classified_at), hasSuperseded ? null : existing?.superseded_by_memory_id ?? null, nullableString("merged_from", existing?.merged_from), nullableString("metadata_json", existing?.metadata_json), nullableString("mural_cue", existing?.mural_cue), nullableString("mural_cue_hash", existing?.mural_cue_hash), nullableNumber("mural_cue_at", existing?.mural_cue_at), has("mural_cue_rejection_count") ? rowNumber(projectedRow, "mural_cue_rejection_count") : existing?.mural_cue_rejection_count ?? 0, contextId);
  if (hasSuperseded && typeof projectedRow.superseded_by_memory_id === "number") {
    const translated = mirrorIdentity(db, "memories", moduleProject, projectedRow.superseded_by_memory_id, statements);
    if (translated) {
      statements.updateSuperseded.run(translated.context_row_id, Date.now(), contextId);
      statements.deletePendingReference.run(moduleProject, feed.module_row_id);
    } else {
      statements.upsertPendingReference.run(moduleProject, feed.module_row_id, projectedRow.superseded_by_memory_id);
    }
  } else if (hasSuperseded) {
    statements.deletePendingReference.run(moduleProject, feed.module_row_id);
  }
  const appliedHash = has("normalized_hash") ? rowString(projectedRow, "normalized_hash") : previousHash;
  if (previousHash !== appliedHash && appliedHash !== undefined) {
    statements.deleteMemoryEmbeddings.run(contextId);
  }
  if (has("mapping") && !recencyGuard.hostVerificationNewer) {
    statements.deleteMemoryVerifications.run(contextId);
    if (Array.isArray(projectedRow.mapping)) {
      const files = [
        ...new Set(projectedRow.mapping.filter((file) => typeof file === "string").sort())
      ];
      const verifiedAt = rowNumber(projectedRow, "verified_at");
      const mappedAt = rowNumber(projectedRow, "updated_at", Date.now());
      const mappingOrigin = projectedRow.mapping_origin === "host_rejected_fallback" ? "host_rejected_fallback" : "mapper";
      for (const file of files.length > 0 ? files : [""]) {
        statements.insertMemoryVerification.run(contextId, file, verifiedAt, mappedAt, mappingOrigin);
      }
    }
  }
}
function repairNullClobberedMemoryRows(statements) {
  const pending = statements.repairPending.get();
  if (pending?.dirty !== 1)
    return;
  const candidates = statements.repairCandidates.all();
  for (const candidate of candidates) {
    if (!candidate.full_row_snapshot)
      continue;
    let snapshot;
    try {
      const parsed = JSON.parse(candidate.full_row_snapshot);
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        continue;
      snapshot = parsed;
    } catch {
      continue;
    }
    const sourceType = hasSnapshotField(snapshot, "source_type") && typeof snapshot.source_type === "string" ? snapshot.source_type : null;
    const importance = hasSnapshotField(snapshot, "importance") && typeof snapshot.importance === "number" && Number.isFinite(snapshot.importance) ? snapshot.importance : null;
    if (sourceType === null && importance === null)
      continue;
    const snapshotVintage = Math.max(memorySnapshotTimestamp(snapshot, "updated_at"), memorySnapshotTimestamp(snapshot, "classified_at"));
    const hostVintage = Math.max(candidate.updated_at ?? 0, candidate.classified_at ?? 0);
    if (hostVintage > snapshotVintage)
      continue;
    statements.repairMemory.run(sourceType, importance, Date.now(), candidate.id, snapshotVintage, snapshotVintage, sourceType, importance);
  }
  statements.clearRepairPending.run(Date.now());
}
function contextNoteId(db, feed, moduleProject, statements) {
  const mapped = mirrorIdentity(db, feed.domain, moduleProject, feed.module_row_id, statements);
  if (mapped)
    return mapped.context_row_id;
  const row = feed.full_row_snapshot;
  const sourceId = rowNumber(row, "context_row_id", -1);
  const sourceUuid = rowNullableString(row, "context_store_uuid");
  const localStoreUuid = statements?.contextStoreUuid ?? getContextStoreUuid(db);
  if (sourceUuid && sourceUuid === localStoreUuid && sourceId >= 0) {
    const existing = (statements?.noteIdByStoreId ?? db.prepare("SELECT id FROM notes WHERE id = ? AND type = 'smart' AND project_path = ?")).get(sourceId, moduleProject);
    if (existing?.id !== undefined) {
      rememberIdentity(db, feed.domain, moduleProject, feed.module_row_id, existing.id, statements);
      return existing.id;
    }
  }
  const result = (statements?.insertNote ?? db.prepare("INSERT INTO notes (type, status, content, project_path, session_id, created_at, updated_at) VALUES ('smart', 'active', '', ?, ?, 0, 0)")).run(moduleProject, rowNullableString(row, "session_id"));
  const contextId = Number(result.lastInsertRowid);
  rememberIdentity(db, feed.domain, moduleProject, feed.module_row_id, contextId, statements);
  return contextId;
}
function translateMemoryReferences(statements) {
  statements.translateMemoryReferences.run(Date.now());
  statements.clearTranslatedReferences.run();
}
function applyNoteRow(db, feed, statements) {
  const row = feed.full_row_snapshot;
  const moduleProject = rowString(row, "project_path");
  if (!moduleProject)
    throw new Error("note feed snapshot has no project_path");
  if (feed.op === "tombstone") {
    const mapped = mirrorIdentity(db, feed.domain, moduleProject, feed.module_row_id, statements);
    if (!mapped)
      return;
    statements.deleteNote.run(mapped.context_row_id);
    statements.deleteIdentity.run(feed.domain, moduleProject, feed.module_row_id);
    statements.deleteNoteRevisions.run(moduleProject, feed.module_row_id);
    return;
  }
  const contextId = contextNoteId(db, feed, moduleProject, statements);
  const existing = statements.noteById.get(contextId);
  const effectiveRow = { ...existing ?? {}, ...row };
  if (!hasSnapshotField(row, "created_at_ms") && existing?.created_at !== undefined) {
    effectiveRow.created_at_ms = existing.created_at;
  }
  if (!hasSnapshotField(row, "updated_at_ms") && existing?.updated_at !== undefined) {
    effectiveRow.updated_at_ms = existing.updated_at;
  }
  const moduleStatus = rowString(effectiveRow, "status", "active");
  const contextStatus = moduleStatus === "surfaced" || moduleStatus === "surfacing" ? "ready" : moduleStatus;
  statements.updateNote.run(rowString(effectiveRow, "type", "smart"), contextStatus, moduleProject, rowNullableString(effectiveRow, "session_id"), rowString(effectiveRow, "content"), rowNullableString(effectiveRow, "surface_condition"), rowNullableString(effectiveRow, "compiled_provider"), rowNullableString(effectiveRow, "compiled_config"), typeof effectiveRow.compiled_at === "number" ? effectiveRow.compiled_at : null, rowNullableString(effectiveRow, "compile_status"), typeof effectiveRow.ready_at === "number" ? effectiveRow.ready_at : null, rowNullableString(effectiveRow, "ready_reason"), rowNullableString(effectiveRow, "manifest_json"), rowNullableString(effectiveRow, "compiled_check"), rowNullableString(effectiveRow, "check_hash"), rowNullableString(effectiveRow, "check_cron"), rowNumber(effectiveRow, "check_failure_count"), rowNumber(effectiveRow, "check_network_failure_count"), typeof effectiveRow.check_quarantined_until === "number" ? effectiveRow.check_quarantined_until : null, typeof effectiveRow.check_next_due_at === "number" ? effectiveRow.check_next_due_at : null, typeof effectiveRow.check_compiled_at === "number" ? effectiveRow.check_compiled_at : null, typeof effectiveRow.check_false_since_at === "number" ? effectiveRow.check_false_since_at : null, typeof effectiveRow.check_last_liveness_at === "number" ? effectiveRow.check_last_liveness_at : null, typeof effectiveRow.last_checked_at === "number" ? effectiveRow.last_checked_at : null, rowString(effectiveRow, "check_status", "uncompiled"), rowNumber(effectiveRow, "check_version"), rowNumber(effectiveRow, "policy_version", 1), rowNullableString(effectiveRow, "anchor_block_id"), typeof effectiveRow.anchor_ordinal === "number" ? effectiveRow.anchor_ordinal : null, rowNumber(effectiveRow, "created_at_ms"), rowNumber(effectiveRow, "updated_at_ms"), contextId);
  statements.upsertNoteRevision.run(moduleProject, feed.module_row_id, contextId, rowNumber(effectiveRow, "status_version"));
}
function applyMirrorPage(args) {
  const { db, page } = args;
  if (!AUTHORITY_DOMAINS.includes(page.domain))
    throw new Error("unknown mirror domain");
  const durableCursor = getMirrorCursor(db, page.domain);
  if (page.cursor !== durableCursor) {
    throw new Error(`mirror cursor mismatch for ${page.domain}: expected ${durableCursor}, got ${page.cursor}`);
  }
  if (page.next_cursor < durableCursor) {
    throw new Error("mirror page moved its cursor backwards");
  }
  const resnapshotState = page.domain === "memories" ? memoryResnapshotState(db) : null;
  const hasNewRows = page.rows.some((feed) => feed.domain === page.domain && feed.feed_seq > durableCursor);
  const replayMustRun = page.domain === "memories" && resnapshotState !== null && resnapshotState.status !== "complete" && (durableCursor === 0 || page.rows.some((feed) => feed.op === "tombstone"));
  if (!hasNewRows && !replayMustRun) {
    if (page.next_cursor <= durableCursor)
      return durableCursor;
    withPrivilegedWriter(db, () => {
      db.prepare("INSERT INTO mirror_cursors(domain, cursor, updated_at) VALUES (?, ?, ?) ON CONFLICT(domain) DO UPDATE SET cursor = excluded.cursor, updated_at = excluded.updated_at").run(page.domain, page.next_cursor, Date.now());
    });
    return page.next_cursor;
  }
  let nextCursor = durableCursor;
  withPrivilegedWriter(db, () => {
    db.transaction(() => {
      ensureMemoryRepairState(db);
      const statements = prepareMirrorPageStatements(db);
      const currentResnapshotState = page.domain === "memories" ? memoryResnapshotState(db) : null;
      let resnapshotStatus = page.domain === "memories" ? currentResnapshotState?.status ?? null : "complete";
      if (page.domain === "memories" && durableCursor === 0 && currentResnapshotState && resnapshotStatus !== "complete") {
        statements.markRepairPending.run(Date.now());
        if (!casMemoryResnapshotState(db, currentResnapshotState, "complete", currentResnapshotState.generation)) {
          throw new Error("memory mirror resnapshot ownership changed during replay");
        }
        resnapshotStatus = "complete";
      }
      if (page.domain === "memories" && resnapshotStatus !== "complete" && page.rows.some((feed) => feed.op === "tombstone")) {
        throw new Error("memory mirror resnapshot must complete before tombstones");
      }
      if (page.domain === "memories") {
        for (const feed of page.rows) {
          if (feed.domain !== "memories" || feed.op === "tombstone" || feed.feed_seq <= durableCursor) {
            continue;
          }
          const row = feed.full_row_snapshot;
          const moduleProject = rowString(row, "project_path");
          const sourceUuid = rowNullableString(row, "context_store_uuid");
          const sourceId = rowNumber(row, "context_row_id", -1);
          if (!moduleProject || !sourceUuid || sourceUuid !== statements.contextStoreUuid || sourceId < 0) {
            continue;
          }
          const existing = statements.memoryIdByStoreId.get(sourceId, moduleProject);
          if (existing?.id === undefined)
            continue;
          rememberIdentity(db, "memories", moduleProject, feed.module_row_id, existing.id, statements, true);
        }
      }
      const touchedProjects = new Set;
      for (const feed of page.rows) {
        if (feed.domain !== page.domain || feed.feed_seq <= nextCursor)
          continue;
        const projectPath = rowString(feed.full_row_snapshot, "project_path");
        if (projectPath)
          touchedProjects.add(projectPath);
        if (feed.domain === "memories")
          applyMemoryRow(db, feed, statements);
        else
          applyNoteRow(db, feed, statements);
        nextCursor = feed.feed_seq;
      }
      if (page.domain === "memories") {
        translateMemoryReferences(statements);
        repairNullClobberedMemoryRows(statements);
      }
      for (const projectPath of touchedProjects) {
        bumpDomainMutationEpoch(db, projectPath, page.domain);
      }
      if (page.next_cursor < nextCursor) {
        throw new Error("mirror page moved its cursor backwards");
      }
      nextCursor = Math.max(nextCursor, page.next_cursor);
      statements.updateCursor.run(page.domain, nextCursor, Date.now());
    }).immediate();
  });
  return nextCursor;
}
async function ensureLiveMemoryResnapshot(args) {
  let adoptedWinner = false;
  let generation;
  while (true) {
    const observed = memoryResnapshotState(args.db);
    if (!observed || observed.status === "complete")
      return;
    if (observed.status === "resnapshotting") {
      withPrivilegedWriter(args.db, () => markMemoryRepairPending(args.db));
    }
    if (observed.status === "pending_check" && !upgradeMemoryMirrorNeedsResnapshot(args.db)) {
      let completed = false;
      withPrivilegedWriter(args.db, () => {
        args.db.transaction(() => {
          markMemoryRepairPending(args.db);
          completed = casMemoryResnapshotState(args.db, observed, "complete", observed.generation);
          if (completed) {
            args.db.prepare("DELETE FROM mirror_live_staging WHERE generation IS NOT ?").run(observed.generation);
          }
        }).immediate();
      });
      if (completed)
        return;
      continue;
    }
    if (!args.module.mirrorPull) {
      throw new Error("memory mirror resnapshot requires the mirror.pull module route");
    }
    const now = Date.now();
    generation = `${now.toString(36)}:${crypto.randomUUID()}`;
    let claimed = false;
    withPrivilegedWriter(args.db, () => {
      args.db.transaction(() => {
        claimed = casMemoryResnapshotState(args.db, observed, "resnapshotting", generation);
        if (claimed) {
          markMemoryRepairPending(args.db);
          args.db.prepare("DELETE FROM mirror_live_staging WHERE generation != ?").run(generation);
        }
      }).immediate();
    });
    if (claimed)
      break;
    const winner = memoryResnapshotState(args.db);
    if (!adoptedWinner && winner?.status === "resnapshotting" && typeof winner.generation === "string" && winner.generation.length > 0) {
      generation = winner.generation;
      adoptedWinner = true;
      break;
    }
  }
  let cursor = 0;
  while (true) {
    const response = await args.module.mirrorPull({
      domain: "memories",
      cursor,
      limit: args.limit,
      live_only: true
    });
    const page = response.page;
    if (page.domain !== "memories" || page.cursor !== cursor) {
      throw new Error("live memory resnapshot returned a mismatched page");
    }
    let staged = false;
    withPrivilegedWriter(args.db, () => {
      args.db.transaction(() => {
        staged = stageLiveMemorySnapshotPage(args.db, generation, page.rows);
      }).immediate();
    });
    if (!staged)
      return;
    if (!page.has_more)
      break;
    if (page.next_cursor <= cursor) {
      throw new Error("live memory resnapshot did not advance its cursor");
    }
    cursor = page.next_cursor;
  }
  withPrivilegedWriter(args.db, () => {
    args.db.transaction(() => {
      installStagedLiveMemorySnapshot(args.db, generation);
    }).immediate();
  });
}
async function pullAndApplyMirrorPageWithStatus(args) {
  if (!args.module.mirrorPull) {
    throw new Error("memory mirror consumer requires the mirror.pull module route");
  }
  const limit = Math.max(1, Math.min(args.limit ?? 100, 1000));
  if (args.domain === "memories") {
    await ensureLiveMemoryResnapshot({ db: args.db, module: args.module, limit });
  }
  const cursor = getMirrorCursor(args.db, args.domain);
  const response = await args.module.mirrorPull({
    domain: args.domain,
    cursor,
    limit
  });
  const nextCursor = applyMirrorPage({ db: args.db, page: response.page });
  if (args.domain === "memories" && args.module.memoryIdentityAck) {
    const rowsByProject = new Map;
    for (const feed of response.page.rows) {
      if (feed.domain !== "memories" || feed.op === "tombstone")
        continue;
      const project = rowString(feed.full_row_snapshot, "project_path");
      if (!project)
        continue;
      const identity = mirrorIdentity(args.db, "memories", project, feed.module_row_id);
      if (!identity)
        continue;
      const rows = rowsByProject.get(project) ?? [];
      rows.push({
        module_row_id: feed.module_row_id,
        context_row_id: identity.context_row_id
      });
      rowsByProject.set(project, rows);
    }
    for (const [project, rows] of rowsByProject) {
      await args.module.memoryIdentityAck({ project, rows });
    }
  }
  return {
    cursor: nextCursor,
    hasMore: response.page.has_more,
    rowsApplied: response.page.rows.filter((row) => row.domain === args.domain && row.feed_seq > cursor).length
  };
}
async function drainMirrorPages(args) {
  const pageBudget = args.pageBudget === undefined ? Number.MAX_SAFE_INTEGER : Math.max(1, Math.floor(args.pageBudget));
  let pagesPulled = 0;
  let rowsApplied = 0;
  let cursor = getMirrorCursor(args.db, args.domain);
  while (pagesPulled < pageBudget) {
    const priorCursor = cursor;
    const page = await pullAndApplyMirrorPageWithStatus(args);
    pagesPulled += 1;
    rowsApplied += page.rowsApplied;
    cursor = page.cursor;
    if (!page.hasMore) {
      return { cursor, pagesPulled, rowsApplied, complete: true, budgetExhausted: false };
    }
    if (cursor === priorCursor) {
      return { cursor, pagesPulled, rowsApplied, complete: false, budgetExhausted: false };
    }
  }
  return { cursor, pagesPulled, rowsApplied, complete: false, budgetExhausted: true };
}
var mirrorFlights = new WeakMap;

// ../plugin/src/features/magic-context/fail-closed-block.ts
var FAIL_CLOSED_DOCTOR_COMMAND = "npx @cortexkit/magic-context@latest doctor";
function attachFailClosedBlockingProcessEvidence(process2, evidence) {
  Object.defineProperties(process2, {
    startTime: { configurable: true, value: evidence.startTime },
    commandLine: { configurable: true, value: evidence.commandLine }
  });
  return process2;
}
var OPENCODE_INTERNAL_AGENT_NAMES = new Set(["title", "summary", "compaction"]);

// ../plugin/src/features/magic-context/message-fts-rowid-map.ts
import { createHash as createHash3 } from "node:crypto";
var MESSAGE_FTS_ROWID_MAP_BACKFILL_BATCH_SIZE = 500;
var BACKFILL_STATE_ID = 1;
var EMPTY_INDEX_CONTENT_HASH = createHash3("sha256").update("").digest("hex");
var upsertMapStatements = new WeakMap;
var rangeReadyStatements = new WeakMap;
var activeBackfills = new WeakMap;
function getUpsertMapStatement(db) {
  let statement = upsertMapStatements.get(db);
  if (!statement) {
    statement = db.prepare(`INSERT INTO message_fts_rowid_map (session_id, message_ordinal, fts_rowid)
             VALUES (?, ?, ?)
             ON CONFLICT(session_id, message_ordinal) DO UPDATE SET
                 fts_rowid = excluded.fts_rowid`);
    upsertMapStatements.set(db, statement);
  }
  return statement;
}
function getBackfillState(db) {
  const row = db.prepare(`SELECT watermark_rowid AS watermarkRowid, completed
             FROM message_fts_rowid_map_backfill_state
             WHERE id = ?`).get(BACKFILL_STATE_ID);
  return {
    processed: 0,
    watermarkRowid: typeof row?.watermarkRowid === "number" && Number.isSafeInteger(row.watermarkRowid) ? row.watermarkRowid : 0,
    completed: row?.completed === 1
  };
}
function recordMessageFtsRowid(db, sessionId, messageOrdinal, ftsRowid) {
  const numericRowid = Number(ftsRowid);
  if (!Number.isSafeInteger(numericRowid) || numericRowid <= 0) {
    throw new Error(`invalid message FTS rowid: ${String(ftsRowid)}`);
  }
  getUpsertMapStatement(db).run(sessionId, messageOrdinal, numericRowid);
}
function backfillMessageFtsRowidMapBatch(db, batchSize = MESSAGE_FTS_ROWID_MAP_BACKFILL_BATCH_SIZE) {
  const boundedBatchSize = Math.max(1, Math.floor(batchSize));
  let progress = {
    processed: 0,
    watermarkRowid: 0,
    completed: false
  };
  const transactionStartedAt = performance.now();
  db.transaction(() => {
    const state = getBackfillState(db);
    if (state.completed) {
      progress = state;
      return;
    }
    const rows = db.prepare(`SELECT rowid AS ftsRowid,
                        session_id AS sessionId,
                        message_ordinal AS messageOrdinal
                 FROM message_history_fts
                 WHERE rowid > ?
                 ORDER BY rowid ASC
                 LIMIT ?`).all(state.watermarkRowid, boundedBatchSize);
    let watermarkRowid = state.watermarkRowid;
    for (const row of rows) {
      const ftsRowid = Number(row.ftsRowid);
      const messageOrdinal = Number(row.messageOrdinal);
      if (Number.isSafeInteger(ftsRowid) && ftsRowid > watermarkRowid) {
        watermarkRowid = ftsRowid;
      }
      if (typeof row.sessionId === "string" && Number.isSafeInteger(messageOrdinal) && messageOrdinal >= 0 && Number.isSafeInteger(ftsRowid) && ftsRowid > 0) {
        recordMessageFtsRowid(db, row.sessionId, messageOrdinal, ftsRowid);
      }
    }
    const completed = rows.length < boundedBatchSize;
    db.prepare(`UPDATE message_fts_rowid_map_backfill_state
             SET watermark_rowid = ?, completed = ?, updated_at = ?
             WHERE id = ?`).run(watermarkRowid, completed ? 1 : 0, Date.now(), BACKFILL_STATE_ID);
    progress = {
      processed: rows.length,
      watermarkRowid,
      completed
    };
  })();
  logSlowWriteTransaction("message_fts_rowid_backfill", transactionStartedAt);
  return progress;
}
async function runMessageFtsRowidMapBackfill(db) {
  for (;; ) {
    const progress = backfillMessageFtsRowidMapBatch(db);
    if (progress.completed)
      return;
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
}
function startMessageFtsRowidMapBackfill(db) {
  const active = activeBackfills.get(db);
  if (active)
    return active;
  const run = runMessageFtsRowidMapBackfill(db).finally(() => {
    activeBackfills.delete(db);
  });
  activeBackfills.set(db, run);
  return run;
}
function messageFtsOrdinalRangeIsMapped(db, sessionId, startOrdinal, endOrdinal) {
  if (endOrdinal < startOrdinal)
    return true;
  if (getBackfillState(db).completed)
    return true;
  let statement = rangeReadyStatements.get(db);
  if (!statement) {
    statement = db.prepare(`SELECT COUNT(DISTINCT source.message_ordinal) AS sourceOrdinalCount,
                    COUNT(DISTINCT CASE
                        WHEN source.role IN ('user', 'assistant')
                         AND source.normalized_content_hash != ?
                        THEN source.message_ordinal
                    END) AS expectedMapCount,
                    COUNT(DISTINCT CASE
                        WHEN source.role IN ('user', 'assistant')
                         AND source.normalized_content_hash != ?
                         AND map.fts_rowid IS NOT NULL
                        THEN source.message_ordinal
                    END) AS mappedCount
             FROM message_history_source AS source
             LEFT JOIN message_fts_rowid_map AS map
               ON map.session_id = source.session_id
              AND map.message_ordinal = source.message_ordinal
             WHERE source.session_id = ?
               AND source.message_ordinal BETWEEN ? AND ?`);
    rangeReadyStatements.set(db, statement);
  }
  const row = statement.get(EMPTY_INDEX_CONTENT_HASH, EMPTY_INDEX_CONTENT_HASH, sessionId, startOrdinal, endOrdinal);
  const ordinalCount = endOrdinal - startOrdinal + 1;
  return row?.sourceOrdinalCount === ordinalCount && row.expectedMapCount === row.mappedCount;
}

// ../plugin/src/hooks/magic-context/compartment-parser.ts
var COMPARTMENT_REGEX = /<compartment\s+([^>]*?)\s*>(.*?)<\/compartment>/gs;
var ATTR_START_REGEX = /\bstart="(\d+)"/;
var ATTR_END_REGEX = /\bend="(\d+)"/;
var ATTR_TITLE_REGEX = /\btitle="([^"]*)"/;
var ATTR_EPISODE_REGEX = /\bepisode_type="([^"]*)"/;
var ATTR_IMPORTANCE_REGEX = /\bimportance="(\d+)"/;
function makeTierOpenRegex(n) {
  return new RegExp(`<p${n}\\s*(/?)>`);
}
var TIER_OPEN_REGEXES = [
  makeTierOpenRegex(1),
  makeTierOpenRegex(2),
  makeTierOpenRegex(3),
  makeTierOpenRegex(4)
];
var TIER_CLOSE_ANY_REGEX = /<\/p\d/;
var TIER_OPEN_ANY_REGEX = /<p\d/;
var CATEGORY_BLOCK_REGEX = /<(PROJECT_RULES|ARCHITECTURE|CONSTRAINTS|CONFIG_VALUES|NAMING)>(.*?)<\/\1>/gs;
var FACT_ITEM_REGEX = /^\s*\*\s*(.+)$/gm;
var UNPROCESSED_REGEX = /<unprocessed_from>(\d+)<\/unprocessed_from>/;
var USER_OBSERVATIONS_REGEX = /<user_observations>(.*?)<\/user_observations>/s;
var USER_OBS_ITEM_REGEX = /^\s*\*\s*(.+)$/gm;
var PRIMER_CANDIDATES_REGEX = /<primer_candidates>(.*?)<\/primer_candidates>/s;
var PRIMER_ELEMENT_REGEX = /<primer\s+at_compartment="(\d+)"\s*>(.*?)<\/primer>/gs;
var PRIMER_ITEM_REGEX = /^\s*(?:\*|-|\d+\.)\s*(.+)$/gm;
var FACTS_BLOCK_REGEX = /<facts>(.*?)<\/facts>/s;
var EVENTS_BLOCK_REGEX = /<events>(.*?)<\/events>/s;
var EVENT_ELEMENT_REGEX = /<([a-z_]+)\s+at_compartment="(\d+)"\s*>(.*?)<\/\1>/gs;
var EVENT_FIELD_REGEX = /<([a-z_]+)\s*>(.*?)<\/\1>/gs;
function extractTier(inner, index) {
  const openMatch = TIER_OPEN_REGEXES[index].exec(inner);
  if (!openMatch)
    return;
  if (openMatch[1] === "/")
    return "";
  const rest = inner.slice(openMatch.index + openMatch[0].length);
  const closeAt = rest.search(TIER_CLOSE_ANY_REGEX);
  let body = closeAt === -1 ? rest : rest.slice(0, closeAt);
  const openInside = body.search(TIER_OPEN_ANY_REGEX);
  if (openInside !== -1)
    body = body.slice(0, openInside);
  return unescapeXml(body.trim());
}
function extractTiersFromInner(inner) {
  return {
    p1: extractTier(inner, 0),
    p2: extractTier(inner, 1),
    p3: extractTier(inner, 2),
    p4: extractTier(inner, 3)
  };
}
function parseCompartmentOutput(text) {
  const compartments = [];
  const facts = [];
  for (const match of text.matchAll(COMPARTMENT_REGEX)) {
    const attrs = match[1];
    const inner = match[2];
    const startMatch = attrs.match(ATTR_START_REGEX);
    const endMatch = attrs.match(ATTR_END_REGEX);
    const titleMatch = attrs.match(ATTR_TITLE_REGEX);
    if (!startMatch || !endMatch || !titleMatch)
      continue;
    const startMessage = parseInt(startMatch[1], 10);
    const endMessage = parseInt(endMatch[1], 10);
    const title = unescapeXml(titleMatch[1]);
    if (Number.isNaN(startMessage) || Number.isNaN(endMessage) || !title)
      continue;
    const episodeMatch = attrs.match(ATTR_EPISODE_REGEX);
    const importanceMatch = attrs.match(ATTR_IMPORTANCE_REGEX);
    const episodeType = episodeMatch ? unescapeXml(episodeMatch[1]) : undefined;
    const importance = importanceMatch ? parseInt(importanceMatch[1], 10) : undefined;
    const p1 = extractTier(inner, 0);
    if (typeof p1 === "string" && p1.length > 0) {
      const p2 = extractTier(inner, 1);
      const p3 = extractTier(inner, 2);
      const p4 = extractTier(inner, 3);
      compartments.push({
        startMessage,
        endMessage,
        title,
        content: p1,
        p1,
        p2: typeof p2 === "string" ? p2 : p1,
        p3: typeof p3 === "string" ? p3 : typeof p2 === "string" ? p2 : p1,
        p4: typeof p4 === "string" ? p4 : "",
        importance,
        episodeType
      });
      continue;
    }
    const content = unescapeXml(inner.trim());
    if (content) {
      compartments.push({
        startMessage,
        endMessage,
        title,
        content,
        importance,
        episodeType
      });
    }
  }
  const factsBlockMatch = text.match(FACTS_BLOCK_REGEX);
  const factsScope = factsBlockMatch ? factsBlockMatch[1] : text.replace(EVENTS_BLOCK_REGEX, "").replace(/<compartment\s+[^>]*?\s*>.*?<\/compartment>/gs, "");
  for (const categoryMatch of factsScope.matchAll(CATEGORY_BLOCK_REGEX)) {
    const category = categoryMatch[1];
    const blockContent = categoryMatch[2];
    for (const itemMatch of blockContent.matchAll(FACT_ITEM_REGEX)) {
      const content = unescapeXml(itemMatch[1].trim());
      if (content) {
        facts.push({ category, content });
      }
    }
  }
  const unprocessedMatch = text.match(UNPROCESSED_REGEX);
  const unprocessedFrom = unprocessedMatch ? parseInt(unprocessedMatch[1], 10) : null;
  const userObservations = [];
  const userObsMatch = text.match(USER_OBSERVATIONS_REGEX);
  if (userObsMatch) {
    for (const itemMatch of userObsMatch[1].matchAll(USER_OBS_ITEM_REGEX)) {
      const obs = unescapeXml(itemMatch[1].trim());
      if (obs)
        userObservations.push(obs);
    }
  }
  const primerCandidates = [];
  const primerMatch = text.match(PRIMER_CANDIDATES_REGEX);
  if (primerMatch) {
    const block = primerMatch[1];
    let sawElement = false;
    for (const el of block.matchAll(PRIMER_ELEMENT_REGEX)) {
      sawElement = true;
      const question = unescapeXml(el[2].trim());
      if (question) {
        primerCandidates.push({
          question,
          originCompartmentIndex: Number.parseInt(el[1], 10)
        });
      }
    }
    if (!sawElement) {
      for (const itemMatch of block.matchAll(PRIMER_ITEM_REGEX)) {
        const question = unescapeXml(itemMatch[1].trim());
        if (question)
          primerCandidates.push({ question });
      }
    }
  }
  const events = parseEvents(text);
  compartments.sort((a, b) => a.startMessage - b.startMessage);
  return { compartments, facts, events, unprocessedFrom, userObservations, primerCandidates };
}
function parseEvents(text) {
  const blockMatch = text.match(EVENTS_BLOCK_REGEX);
  if (!blockMatch)
    return [];
  const block = blockMatch[1];
  const events = [];
  for (const elMatch of block.matchAll(EVENT_ELEMENT_REGEX)) {
    const kind = elMatch[1];
    const atRaw = parseInt(elMatch[2], 10);
    const atCompartment = Number.isNaN(atRaw) ? null : atRaw;
    const fields = {};
    for (const fieldMatch of elMatch[3].matchAll(EVENT_FIELD_REGEX)) {
      const name = fieldMatch[1];
      const value = unescapeXml(fieldMatch[2].trim());
      if (value)
        fields[name] = value;
    }
    events.push({ kind, atCompartment, fields });
  }
  return events;
}
function unescapeXml(s) {
  return s.replace(/&amp;/g, "&").replace(/&apos;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">");
}

// ../plugin/src/features/magic-context/storage-schema-helpers.ts
function ensureColumn(db, table, column, definition) {
  if (!/^[a-z][a-z0-9_]*$/.test(table) || !/^[a-z][a-z0-9_]*$/.test(column) || !/^[A-Z0-9_"'(),[\]\s]+$/i.test(definition)) {
    throw new Error(`Unsafe schema identifier: ${table}.${column} ${definition}`);
  }
  const rows = db.prepare(`PRAGMA table_info(${table})`).all();
  if (rows.some((row) => row.name === column)) {
    return;
  }
  try {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  } catch (err) {
    const recheck = db.prepare(`PRAGMA table_info(${table})`).all();
    if (recheck.some((row) => row.name === column)) {
      return;
    }
    throw err;
  }
}
function healAllNullColumns(db) {
  const existingColumns = getSessionMetaColumns(db);
  const fallbacks = [
    ["cache_ttl", ""],
    ["last_nudge_band", ""],
    ["last_nudge_level", ""],
    ["channel2_nudge_claim_token", ""],
    ["last_transform_error", ""],
    ["nudge_anchor_message_id", ""],
    ["nudge_anchor_text", ""],
    ["sticky_turn_reminder_text", ""],
    ["sticky_turn_reminder_message_id", ""],
    ["note_nudge_trigger_message_id", ""],
    ["note_nudge_sticky_text", ""],
    ["note_nudge_sticky_message_id", ""],
    ["last_todo_state", ""],
    ["todo_synthetic_call_id", ""],
    ["todo_synthetic_anchor_message_id", ""],
    ["todo_synthetic_state_json", ""],
    ["system_prompt_hash", ""],
    ["stripped_placeholder_ids", ""],
    ["stale_reduce_stripped_ids", ""],
    ["processed_image_stripped_ids", ""],
    ["merged_reasoning_stripped_ids", ""],
    ["thinking_binding_recovery_target", ""],
    ["trailing_blank_decisions", ""],
    ["memory_block_cache", ""],
    ["memory_block_ids", ""],
    ["compaction_marker_state", ""],
    ["key_files", ""],
    ["times_execute_threshold_reached", 0],
    ["compartment_in_progress", 0],
    ["historian_failure_count", 0],
    ["cleared_reasoning_through_tag", 0],
    ["memory_block_count", 0],
    ["system_prompt_tokens", 0],
    ["conversation_tokens", 0],
    ["tool_call_tokens", 0],
    ["note_nudge_trigger_pending", 0],
    ["observed_safe_input_tokens", 0],
    ["cache_alert_sent", 0],
    ["new_work_tokens", 0],
    ["total_input_tokens", 0],
    ["last_emergency_input_sample", 0],
    ["channel2_nudge_claimed_at", 0],
    ["last_usage_context_limit", 0],
    ["prior_boundary_ordinal", 1],
    ["protected_tail_policy_version", 0],
    ["protected_tail_drain_window_started_at", 0],
    ["protected_tail_drain_tokens", 0],
    ["recovery_no_eligible_head_count", 0],
    ["force_emergency_bypass_window_start", 0],
    ["force_emergency_bypass_used", 0],
    ["emergency_drain_active", 0],
    ["historian_drain_failure_at", 0]
  ];
  const presentFallbacks = fallbacks.filter(([column]) => existingColumns.has(column));
  if (presentFallbacks.length > 0) {
    const assignments = presentFallbacks.map(([column]) => `${column} = COALESCE(${column}, ?)`).join(", ");
    const nullPredicate = presentFallbacks.map(([column]) => `${column} IS NULL`).join(" OR ");
    db.prepare(`UPDATE session_meta SET ${assignments} WHERE ${nullPredicate}`).run(...presentFallbacks.map(([, fallback]) => fallback));
  }
  healMissingMemoryBlockIds(db, existingColumns);
}
function getSessionMetaColumns(db) {
  const rows = db.prepare("PRAGMA table_info(session_meta)").all();
  return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function healMissingMemoryBlockIds(db, columns) {
  if (!columns.has("memory_block_cache") || !columns.has("memory_block_ids") || !columns.has("memory_block_count")) {
    return;
  }
  db.prepare("UPDATE session_meta SET memory_block_cache = '' WHERE memory_block_cache != '' AND (memory_block_ids IS NULL OR memory_block_ids = '') AND memory_block_count > 0").run();
}

// ../plugin/src/features/magic-context/workspaces.ts
import { createHash as createHash4 } from "node:crypto";
var VALID_SHARE_CATEGORIES = new Set(V2_MEMORY_CATEGORIES);
var DEFAULT_WORKSPACE_SHARE_CATEGORIES = ["CONSTRAINTS"];
function tableExists(db, tableName) {
  const row = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name = ? LIMIT 1").get(tableName);
  return Boolean(row);
}
function columnExists(db, tableName, columnName) {
  const rows = db.prepare(`PRAGMA table_info(${tableName})`).all();
  return rows.some((row) => row.name === columnName);
}
function uniqueSorted(values) {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}
function placeholders(values) {
  return values.map(() => "?").join(", ");
}
function defaultWorkspaceShareCategories() {
  return [...DEFAULT_WORKSPACE_SHARE_CATEGORIES];
}
function warnInvalidShareCategories(reason, raw) {
  log("[magic-context] WARN: invalid workspace share_categories; sharing no foreign memory categories", {
    reason,
    raw
  });
}
function normalizeShareCategories(raw) {
  if (raw === null || raw === undefined) {
    return defaultWorkspaceShareCategories();
  }
  if (typeof raw !== "string") {
    warnInvalidShareCategories("not a string", raw);
    return [];
  }
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    warnInvalidShareCategories("malformed JSON", raw);
    return [];
  }
  if (!Array.isArray(parsed)) {
    warnInvalidShareCategories("not a JSON array", raw);
    return [];
  }
  const categories = [];
  for (const value of parsed) {
    if (typeof value !== "string" || !VALID_SHARE_CATEGORIES.has(value)) {
      warnInvalidShareCategories("unknown category", raw);
      return [];
    }
    if (!categories.includes(value))
      categories.push(value);
  }
  return categories.sort((left, right) => left.localeCompare(right));
}
function selectWorkspaceShareCategories(db, identities) {
  const candidates = uniqueSorted(identities.filter((identity) => identity.length > 0));
  if (candidates.length === 0 || !tableExists(db, "workspace_members")) {
    return null;
  }
  const hasMembership = Boolean(db.prepare(`SELECT 1
                   FROM workspace_members
                  WHERE project_path IN (${placeholders(candidates)})
                  LIMIT 1`).get(...candidates));
  if (!hasMembership)
    return null;
  if (!tableExists(db, "workspaces")) {
    log("[magic-context] WARN: workspace member has no workspaces table; sharing no foreign memory categories");
    return [];
  }
  if (!columnExists(db, "workspaces", "share_categories")) {
    return defaultWorkspaceShareCategories();
  }
  const row = db.prepare(`SELECT workspace.share_categories AS shareCategories
               FROM workspace_members AS member
               JOIN workspaces AS workspace ON workspace.id = member.workspace_id
              WHERE member.project_path IN (${placeholders(candidates)})
              ORDER BY workspace.id ASC
              LIMIT 1`).get(...candidates);
  if (!row) {
    log("[magic-context] WARN: workspace member has no workspace share_categories row; sharing no foreign memory categories");
    return [];
  }
  return normalizeShareCategories(row.shareCategories);
}
function resolveWorkspaceShareCategories(db, projectIdentity) {
  return selectWorkspaceShareCategories(db, [projectIdentity]);
}
function resolveWorkspaceIdentitySet(db, projectIdentity) {
  if (!tableExists(db, "workspace_members")) {
    return { identities: [projectIdentity], namesByIdentity: new Map };
  }
  const rows = db.prepare(`SELECT member.project_path AS identity, member.display_name AS displayName
               FROM workspace_members AS anchor
               JOIN workspace_members AS member ON member.workspace_id = anchor.workspace_id
              WHERE anchor.project_path = ?
              ORDER BY member.display_name ASC, member.project_path ASC`).all(projectIdentity);
  if (rows.length === 0) {
    return { identities: [projectIdentity], namesByIdentity: new Map };
  }
  const namesByIdentity = new Map;
  const identities = [];
  for (const row of rows) {
    if (typeof row.identity !== "string" || row.identity.length === 0)
      continue;
    if (identities.includes(row.identity))
      continue;
    identities.push(row.identity);
    if (typeof row.displayName === "string" && row.displayName.length > 0) {
      namesByIdentity.set(row.identity, row.displayName);
    }
  }
  return identities.length > 0 ? { identities, namesByIdentity } : { identities: [projectIdentity], namesByIdentity: new Map };
}
function expandWorkspaceIdentitySetWithAliases(db, identities) {
  const canonical = uniqueSorted(identities.filter((identity) => identity.length > 0));
  const expanded = new Set(canonical);
  const canonicalIdentityByStoredPath = new Map;
  for (const identity of canonical) {
    canonicalIdentityByStoredPath.set(identity, identity);
  }
  if (canonical.length === 0 || !tableExists(db, "v22_identity_rekey_map")) {
    return { expandedIdentities: [...expanded], canonicalIdentityByStoredPath };
  }
  const rows = db.prepare(`SELECT old_project_path AS oldProjectPath, new_project_path AS newProjectPath
               FROM v22_identity_rekey_map
              WHERE new_project_path IN (${placeholders(canonical)})
              ORDER BY old_project_path ASC`).all(...canonical);
  for (const row of rows) {
    if (typeof row.oldProjectPath !== "string" || typeof row.newProjectPath !== "string") {
      continue;
    }
    if (!canonicalIdentityByStoredPath.has(row.newProjectPath))
      continue;
    expanded.add(row.oldProjectPath);
    canonicalIdentityByStoredPath.set(row.oldProjectPath, row.newProjectPath);
  }
  return { expandedIdentities: [...expanded], canonicalIdentityByStoredPath };
}
function resolveStoredPathWorkspaceIdentity(storedProjectPath, memberIdentities, canonicalIdentityByStoredPath) {
  const direct = canonicalIdentityByStoredPath.get(storedProjectPath);
  if (direct)
    return direct;
  const normalized = normalizeStoredProjectPath(storedProjectPath);
  const normalizedDirect = canonicalIdentityByStoredPath.get(normalized);
  if (normalizedDirect)
    return normalizedDirect;
  if (memberIdentities.includes(normalized))
    return normalized;
  for (const identity of memberIdentities) {
    if (storedPathBelongsToIdentity(storedProjectPath, identity)) {
      return identity;
    }
  }
  return null;
}
function sourceNameForMemory(storedProjectPath, ownIdentity, memberIdentities, namesByIdentity, canonicalIdentityByStoredPath) {
  const canonicalIdentity = resolveStoredPathWorkspaceIdentity(storedProjectPath, memberIdentities, canonicalIdentityByStoredPath);
  if (!canonicalIdentity || canonicalIdentity === ownIdentity)
    return;
  return namesByIdentity.get(canonicalIdentity);
}
function getEpochMap(db, identities) {
  if (identities.length === 0)
    return new Map;
  const rows = db.prepare(`SELECT project_path AS projectPath, project_memory_epoch AS epoch
               FROM project_state
              WHERE project_path IN (${placeholders(identities)})`).all(...identities);
  const epochs = new Map;
  for (const row of rows) {
    if (typeof row.projectPath !== "string" || typeof row.epoch !== "number")
      continue;
    epochs.set(row.projectPath, row.epoch);
  }
  return epochs;
}
function computeWorkspaceEpochFingerprint(db, identities) {
  const canonical = uniqueSorted(identities.filter((identity) => identity.length > 0));
  const epochs = getEpochMap(db, canonical);
  const shareCategories = selectWorkspaceShareCategories(db, canonical);
  const hash = createHash4("sha256");
  hash.update("share_categories", "utf8");
  hash.update("\x00");
  hash.update(shareCategories === null ? "NO_WORKSPACE" : JSON.stringify(shareCategories), "utf8");
  hash.update(`
`);
  for (const identity of canonical) {
    hash.update(identity, "utf8");
    hash.update("\x00");
    hash.update(String(epochs.get(identity) ?? 0), "utf8");
    hash.update(`
`);
  }
  return hash.digest("hex");
}
function isInTransaction2(db) {
  const candidate = db;
  return candidate.inTransaction === true || candidate.isTransaction === true;
}
function workspaceMembersForIdentity(db, identity) {
  if (!tableExists(db, "workspace_members"))
    return [identity];
  const rows = db.prepare(`SELECT member.project_path AS identity
               FROM workspace_members AS anchor
               JOIN workspace_members AS member ON member.workspace_id = anchor.workspace_id
              WHERE anchor.project_path = ?
              ORDER BY member.project_path ASC`).all(identity);
  const identities = rows.map((row) => typeof row.identity === "string" ? row.identity : "").filter((value) => value.length > 0);
  return identities.length > 0 ? uniqueSorted(identities) : [identity];
}
function bumpEpochRows(db, identities, now) {
  const stmt = db.prepare(`INSERT INTO project_state
            (project_path, project_memory_epoch, project_user_profile_version, updated_at)
         VALUES (?, 1, 0, ?)
         ON CONFLICT(project_path) DO UPDATE SET
            project_memory_epoch = project_memory_epoch + 1,
            updated_at = excluded.updated_at`);
  for (const identity of uniqueSorted(identities)) {
    stmt.run(identity, now);
  }
}
function bumpEpochsForWorkspaceMembers(db, identity, now = Date.now()) {
  const run = () => bumpEpochRows(db, workspaceMembersForIdentity(db, identity), now);
  if (isInTransaction2(db)) {
    run();
    return;
  }
  const transactionStartedAt = performance.now();
  db.exec("BEGIN IMMEDIATE");
  try {
    run();
    db.exec("COMMIT");
    logSlowWriteTransaction("workspace_epoch_bump", transactionStartedAt);
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}
function bumpEpochsForWorkspaceMemberSet(db, identities, now = Date.now()) {
  const run = () => bumpEpochRows(db, identities, now);
  if (isInTransaction2(db)) {
    run();
    return;
  }
  const transactionStartedAt = performance.now();
  db.exec("BEGIN IMMEDIATE");
  try {
    run();
    db.exec("COMMIT");
    logSlowWriteTransaction("workspace_epoch_bump", transactionStartedAt);
  } catch (error) {
    try {
      db.exec("ROLLBACK");
    } catch {}
    throw error;
  }
}

// ../plugin/src/features/magic-context/migrations.ts
var FORK_MIGRATION_VERSION_FLOOR = 1e4;
class MigrationLockBusyError extends Error {
  constructor(message) {
    super(message);
    this.name = "MigrationLockBusyError";
  }
}
function isSqliteLockError(error) {
  if (!error || typeof error !== "object")
    return false;
  const candidate = error;
  if (candidate.code === "SQLITE_BUSY" || candidate.code === "SQLITE_LOCKED")
    return true;
  return typeof candidate.message === "string" && /database is locked|sqlite_(busy|locked)/i.test(candidate.message);
}
function tableExists2(db, name) {
  return Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
}
function tableHasHarnessColumn(db, name) {
  if (!tableExists2(db, name))
    return false;
  return db.prepare(`PRAGMA table_info(${name})`).all().some((column) => column.name === "harness");
}
var V85_OPENCODE2_RELABEL_TABLES = [
  "tags",
  "pending_ops",
  "source_contents",
  "compartments",
  "compartment_chunk_embeddings",
  "session_projects",
  "compartment_events",
  "compression_depth",
  "session_facts",
  "primer_candidates",
  "notes",
  "message_history_index",
  "message_history_source",
  "pending_session_cleanup",
  "message_history_orphan_sweep",
  "session_meta",
  "subagent_invocations",
  "historian_runs",
  "transform_decisions",
  "recomp_compartments",
  "recomp_facts"
];
var V85_OPTIONAL_OPENCODE2_RELABEL_TABLES = ["session_project_backfill_state"];
function deleteLosingOpenCode2Twin(db, table, joinColumns, newerPredicate) {
  if (!tableHasHarnessColumn(db, table))
    return;
  const naturalJoin = joinColumns.map((column) => `oc.${column} = o2.${column}`).join(" AND ");
  const o2On = naturalJoin ? `${naturalJoin} AND oc.harness = 'opencode'` : `oc.harness = 'opencode'`;
  const ocOn = naturalJoin ? `${naturalJoin} AND o2.harness = 'opencode2'` : `o2.harness = 'opencode2'`;
  db.exec(`
        DELETE FROM ${table}
        WHERE rowid IN (
            SELECT o2.rowid
            FROM ${table} AS o2
            JOIN ${table} AS oc
              ON ${o2On}
            WHERE o2.harness = 'opencode2'
              AND NOT (${newerPredicate})
        );
        DELETE FROM ${table}
        WHERE rowid IN (
            SELECT oc.rowid
            FROM ${table} AS oc
            JOIN ${table} AS o2
              ON ${ocOn}
            WHERE oc.harness = 'opencode'
              AND (${newerPredicate})
        );
    `);
}
function relabelOpenCode2HarnessRows(db) {
  deleteLosingOpenCode2Twin(db, "session_projects", ["session_id"], "o2.updated_at > oc.updated_at");
  deleteLosingOpenCode2Twin(db, "primer_candidates", ["project_path", "session_id", "source_start_message_id", "source_end_message_id"], "o2.created_at > oc.created_at");
  deleteLosingOpenCode2Twin(db, "transform_decisions", ["session_id", "message_id"], "o2.ts_ms > oc.ts_ms");
  deleteLosingOpenCode2Twin(db, "message_history_orphan_sweep", [], "COALESCE(o2.last_swept_at, -1) > COALESCE(oc.last_swept_at, -1)");
  if (tableHasHarnessColumn(db, "session_project_backfill_state")) {
    db.exec(`
            DELETE FROM session_project_backfill_state
            WHERE harness = 'opencode2'
              AND EXISTS (
                  SELECT 1 FROM session_project_backfill_state WHERE harness = 'opencode'
              )
              AND NOT (
                  (status = 'completed'
                    AND (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode')
                        != 'completed')
                  OR (
                      status = (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode')
                      AND COALESCE(started_at, -1) > COALESCE(
                          (SELECT started_at FROM session_project_backfill_state WHERE harness = 'opencode'),
                          -1
                      )
                  )
              );
            DELETE FROM session_project_backfill_state
            WHERE harness = 'opencode'
              AND EXISTS (
                  SELECT 1 FROM session_project_backfill_state WHERE harness = 'opencode2'
              )
              AND (
                  ((SELECT status FROM session_project_backfill_state WHERE harness = 'opencode2') = 'completed'
                    AND status != 'completed')
                  OR (
                      status = (SELECT status FROM session_project_backfill_state WHERE harness = 'opencode2')
                      AND COALESCE(
                          (SELECT started_at FROM session_project_backfill_state WHERE harness = 'opencode2'),
                          -1
                      ) > COALESCE(started_at, -1)
                  )
              );
        `);
  }
  const tables = new Set([
    ...V85_OPENCODE2_RELABEL_TABLES,
    ...V85_OPTIONAL_OPENCODE2_RELABEL_TABLES
  ]);
  for (const table of tables) {
    if (!tableHasHarnessColumn(db, table))
      continue;
    db.exec(`UPDATE ${table} SET harness = 'opencode' WHERE harness = 'opencode2'`);
  }
}
function healMismatchedTierClose(db, table, hasLegacy) {
  if (!tableExists2(db, table))
    return;
  const columns = new Set(db.prepare(`PRAGMA table_info(${table})`).all().map((row) => row.name));
  for (const required of ["content", "p1", "p2", "p3", "p4"]) {
    if (!columns.has(required))
      return;
  }
  if (hasLegacy && !columns.has("legacy"))
    return;
  const predicate = hasLegacy ? "legacy = 1 AND p1 IS NULL AND content LIKE '%<p1%'" : "p1 IS NULL AND content LIKE '%<p1%'";
  const rows = db.prepare(`SELECT id, content FROM ${table} WHERE ${predicate}`).all();
  const update = db.prepare(`UPDATE ${table} SET p1 = ?, p2 = ?, p3 = ?, p4 = ?${hasLegacy ? ", legacy = 0" : ""} WHERE id = ?`);
  for (const row of rows) {
    const tiers = extractTiersFromInner(row.content);
    if (typeof tiers.p1 !== "string" || tiers.p1.length === 0)
      continue;
    const p1 = tiers.p1;
    const p2 = typeof tiers.p2 === "string" ? tiers.p2 : p1;
    const p3 = typeof tiers.p3 === "string" ? tiers.p3 : p2;
    const p4 = typeof tiers.p4 === "string" ? tiers.p4 : "";
    update.run(p1, p2, p3, p4, row.id);
  }
}
function assertForeignKeyIntegrity(db, table) {
  const rows = (table ? db.prepare(`PRAGMA foreign_key_check(${table})`) : db.prepare("PRAGMA foreign_key_check")).all();
  if (rows.length > 0) {
    throw new Error(`foreign_key_check failed after embedding table rebuild${table ? ` (${table})` : ""} (${rows.length} violation(s))`);
  }
}
function authorityPrivilegeCheck() {
  return "COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0";
}
function managedAuthorityNoteRow(row) {
  return `(
        EXISTS (SELECT 1 FROM authority_managed WHERE project_path = ${row}.project_path)
        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = ${row}.project_path)
        OR EXISTS (
            SELECT 1 FROM session_projects sp
            JOIN authority_managed am ON am.project_path = sp.project_path
            WHERE sp.session_id = ${row}.session_id
        )
        OR EXISTS (
            SELECT 1 FROM session_projects sp
            JOIN authority_repair_pending arp ON arp.project_path = sp.project_path
            WHERE sp.session_id = ${row}.session_id
        )
    )`;
}
function installLatestAuthorityTriggers(db) {
  const privilegeCheck = authorityPrivilegeCheck();
  if (tableExists2(db, "memories")) {
    db.exec(`
            DROP TRIGGER IF EXISTS memories_authority_guard_insert;
            DROP TRIGGER IF EXISTS memories_authority_guard_update;
            DROP TRIGGER IF EXISTS memories_authority_guard_delete;
            CREATE TRIGGER memories_authority_guard_insert
            BEFORE INSERT ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
            CREATE TRIGGER memories_authority_guard_update
            BEFORE UPDATE ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
            CREATE TRIGGER memories_authority_guard_delete
            BEFORE DELETE ON memories
            WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
               OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
              AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
        `);
  }
  if (tableExists2(db, "notes")) {
    const managedOld = managedAuthorityNoteRow("OLD");
    const managedNew = managedAuthorityNoteRow("NEW");
    db.exec(`
            DROP TRIGGER IF EXISTS notes_authority_guard_insert;
            DROP TRIGGER IF EXISTS notes_authority_guard_update;
            DROP TRIGGER IF EXISTS notes_authority_guard_delete;
            CREATE TRIGGER notes_authority_guard_insert
            BEFORE INSERT ON notes
            WHEN ${managedNew} AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
            CREATE TRIGGER notes_authority_guard_update
            BEFORE UPDATE ON notes
            WHEN (${managedOld} OR ${managedNew}) AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
            CREATE TRIGGER notes_authority_guard_delete
            BEFORE DELETE ON notes
            WHEN ${managedOld} AND ${privilegeCheck}
            BEGIN SELECT RAISE(ABORT, 'context.db note writes are managed by the Rust module'); END;
        `);
  }
}
var MIGRATIONS = [
  {
    version: 1,
    description: "Merge session_notes + smart_notes into unified notes table",
    up: (db) => {
      db.exec(`
				CREATE TABLE IF NOT EXISTS notes (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					type TEXT NOT NULL DEFAULT 'session',
					status TEXT NOT NULL DEFAULT 'active',
					content TEXT NOT NULL,
					session_id TEXT,
					project_path TEXT,
					surface_condition TEXT,
					created_at INTEGER NOT NULL,
					updated_at INTEGER NOT NULL,
					last_checked_at INTEGER,
					ready_at INTEGER,
					ready_reason TEXT,
					compiled_provider TEXT,
					compiled_config TEXT,
					compiled_at INTEGER,
					compile_status TEXT CHECK(compile_status IN ('compiled', 'plain', 'refused'))
				);
				CREATE INDEX IF NOT EXISTS idx_notes_session_status ON notes(session_id, status);
				CREATE INDEX IF NOT EXISTS idx_notes_project_status ON notes(project_path, status);
				CREATE INDEX IF NOT EXISTS idx_notes_type_status ON notes(type, status);
			`);
      const hasSessionNotes = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='session_notes'").get();
      if (hasSessionNotes) {
        db.exec(`
					INSERT INTO notes (type, status, content, session_id, created_at, updated_at)
					SELECT 'session', 'active', content, session_id, created_at, created_at
					FROM session_notes
				`);
      }
      const hasSmartNotes = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='smart_notes'").get();
      if (hasSmartNotes) {
        db.exec(`
					INSERT INTO notes (type, status, content, session_id, project_path, surface_condition,
						created_at, updated_at, last_checked_at, ready_at, ready_reason)
					SELECT 'smart', status, content, created_session_id, project_path, surface_condition,
						created_at, updated_at, last_checked_at, ready_at, ready_reason
					FROM smart_notes
				`);
      }
      if (hasSessionNotes) {
        const sourceCount = db.prepare("SELECT COUNT(*) as c FROM session_notes").get().c;
        const migratedCount = db.prepare("SELECT COUNT(*) as c FROM notes WHERE type = 'session'").get().c;
        if (migratedCount >= sourceCount) {
          db.exec("DROP TABLE session_notes");
        } else {
          throw new Error(`session_notes migration verification failed: expected ${sourceCount} rows, got ${migratedCount}`);
        }
      }
      if (hasSmartNotes) {
        const sourceCount = db.prepare("SELECT COUNT(*) as c FROM smart_notes").get().c;
        const migratedCount = db.prepare("SELECT COUNT(*) as c FROM notes WHERE type = 'smart'").get().c;
        if (migratedCount >= sourceCount) {
          db.exec("DROP TABLE smart_notes");
        } else {
          throw new Error(`smart_notes migration verification failed: expected ${sourceCount} rows, got ${migratedCount}`);
        }
      }
    }
  },
  {
    version: 2,
    description: "Add plugin_messages table for TUI ↔ server communication",
    up: (db) => {
      db.exec(`
				CREATE TABLE IF NOT EXISTS plugin_messages (
					id INTEGER PRIMARY KEY AUTOINCREMENT,
					direction TEXT NOT NULL,
					type TEXT NOT NULL,
					payload TEXT NOT NULL DEFAULT '{}',
					session_id TEXT,
					created_at INTEGER NOT NULL,
					consumed_at INTEGER
				);
				CREATE INDEX IF NOT EXISTS idx_plugin_messages_direction_consumed
					ON plugin_messages(direction, consumed_at);
				CREATE INDEX IF NOT EXISTS idx_plugin_messages_created
					ON plugin_messages(created_at);
			`);
    }
  },
  {
    version: 3,
    description: "Add user_memory_candidates and user_memories tables",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS user_memory_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    session_id TEXT NOT NULL,
                    source_compartment_start INTEGER,
                    source_compartment_end INTEGER,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_umc_created ON user_memory_candidates(created_at);

                CREATE TABLE IF NOT EXISTS user_memories (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    content TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'active',
                    promoted_at INTEGER NOT NULL,
                    source_candidate_ids TEXT DEFAULT '[]',
                    source_candidate_provenance TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_um_status ON user_memories(status);
            `);
    }
  },
  {
    version: 4,
    description: "Add git_commits + git_commit_embeddings + git_commits_fts tables",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS git_commits (
                    sha TEXT PRIMARY KEY,
                    project_path TEXT NOT NULL,
                    short_sha TEXT NOT NULL,
                    message TEXT NOT NULL,
                    author TEXT,
                    committed_at INTEGER NOT NULL,
                    indexed_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_git_commits_project_time
                    ON git_commits(project_path, committed_at DESC);

                CREATE TABLE IF NOT EXISTS git_commit_embeddings (
                    sha TEXT PRIMARY KEY,
                    embedding BLOB NOT NULL,
                    model_id TEXT NOT NULL,
                    created_at INTEGER NOT NULL,
                    -- FK-cascade audit (v12): git_commit_embeddings.sha -> git_commits.sha
                    -- uses ON DELETE CASCADE, so SQLite PRAGMA foreign_keys must be ON on
                    -- every connection and v12 cleans historical orphan rows.
                    FOREIGN KEY(sha) REFERENCES git_commits(sha) ON DELETE CASCADE
                );

                CREATE VIRTUAL TABLE IF NOT EXISTS git_commits_fts USING fts5(
                    sha UNINDEXED,
                    project_path UNINDEXED,
                    message,
                    tokenize = 'porter unicode61'
                );

                -- Mirror writes into FTS. We intentionally rebuild FTS rows on
                -- every INSERT OR REPLACE so amended commits or re-indexed
                -- messages update cleanly.
                CREATE TRIGGER IF NOT EXISTS git_commits_fts_insert
                AFTER INSERT ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = NEW.sha;
                    INSERT INTO git_commits_fts(sha, project_path, message)
                    VALUES (NEW.sha, NEW.project_path, NEW.message);
                END;

                CREATE TRIGGER IF NOT EXISTS git_commits_fts_delete
                AFTER DELETE ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = OLD.sha;
                END;

                CREATE TRIGGER IF NOT EXISTS git_commits_fts_update
                AFTER UPDATE OF message, project_path ON git_commits BEGIN
                    DELETE FROM git_commits_fts WHERE sha = OLD.sha;
                    INSERT INTO git_commits_fts(sha, project_path, message)
                    VALUES (NEW.sha, NEW.project_path, NEW.message);
                END;
            `);
    }
  },
  {
    version: 5,
    description: "One-shot heal of NULL session_meta columns",
    up: (db) => {
      healAllNullColumns(db);
    }
  },
  {
    version: 6,
    description: "Heal session_meta.counter drift below MAX(tag_number)",
    up: (db) => {
      db.prepare(`UPDATE session_meta
                 SET counter = (
                     SELECT MAX(tag_number)
                     FROM tags
                     WHERE tags.session_id = session_meta.session_id
                 )
                 WHERE EXISTS (
                     SELECT 1
                     FROM tags
                     WHERE tags.session_id = session_meta.session_id
                       AND tags.tag_number > session_meta.counter
                 )`).run();
    }
  },
  {
    version: 7,
    description: "Add harness column to notes table for cross-harness sharing",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(notes)").all();
      if (!cols.some((c) => c.name === "harness")) {
        db.exec("ALTER TABLE notes ADD COLUMN harness TEXT NOT NULL DEFAULT 'opencode'");
      }
    }
  },
  {
    version: 8,
    description: "Add partial indexes on tags(session_id, tag_number) for active and dropped",
    up: (db) => {
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_tags_active_session_tag_number
                ON tags(session_id, tag_number)
                WHERE status = 'active';

                CREATE INDEX IF NOT EXISTS idx_tags_dropped_session_tag_number
                ON tags(session_id, tag_number)
                WHERE status = 'dropped';
            `);
      db.exec("ANALYZE tags;");
    }
  },
  {
    version: 9,
    description: "Persist tool_definition_measurements across plugin restarts",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS tool_definition_measurements (
                    provider_id TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    agent_name TEXT NOT NULL,
                    tool_id TEXT NOT NULL,
                    token_count INTEGER NOT NULL,
                    recorded_at INTEGER NOT NULL,
                    PRIMARY KEY (provider_id, model_id, agent_name, tool_id)
                );
            `);
    }
  },
  {
    version: 10,
    description: "Add tool_owner_message_id column to tags + composite identity indexes",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(tags)").all();
      if (!cols.some((c) => c.name === "tool_owner_message_id")) {
        db.exec("ALTER TABLE tags ADD COLUMN tool_owner_message_id TEXT DEFAULT NULL");
      }
      db.exec(`
                CREATE UNIQUE INDEX IF NOT EXISTS idx_tags_tool_composite
                ON tags(session_id, message_id, tool_owner_message_id)
                WHERE type = 'tool' AND tool_owner_message_id IS NOT NULL;

                CREATE INDEX IF NOT EXISTS idx_tags_tool_null_owner
                ON tags(session_id, message_id)
                WHERE type = 'tool' AND tool_owner_message_id IS NULL;
            `);
    }
  },
  {
    version: 11,
    description: "Add todo state synthesis columns to session_meta",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "last_todo_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN last_todo_state TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_call_id")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_call_id TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_anchor_message_id")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_anchor_message_id TEXT DEFAULT ''");
      }
      if (!cols.some((c) => c.name === "todo_synthetic_state_json")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN todo_synthetic_state_json TEXT DEFAULT ''");
      }
    }
  },
  {
    version: 12,
    description: "Clean orphan rows from FK-cascade embedding tables",
    up: (db) => {
      const hasTable = (name) => Boolean(db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name = ?").get(name));
      const memoryEmbeddings = hasTable("memory_embeddings") ? db.prepare(`DELETE FROM memory_embeddings
                           WHERE memory_id NOT IN (SELECT id FROM memories)`).run().changes : 0;
      log(`[migrations] v12 cleaned ${memoryEmbeddings} orphan memory_embeddings row(s)`);
      const gitCommitEmbeddings = hasTable("git_commit_embeddings") ? db.prepare(`DELETE FROM git_commit_embeddings
                           WHERE sha NOT IN (SELECT sha FROM git_commits)`).run().changes : 0;
      log(`[migrations] v12 cleaned ${gitCommitEmbeddings} orphan git_commit_embeddings row(s)`);
    }
  },
  {
    version: 13,
    description: "Add pending_compaction_marker_state column for deferred marker drain",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "pending_compaction_marker_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pending_compaction_marker_state TEXT");
      }
    }
  },
  {
    version: 14,
    description: "Add project-scoped key files and version counter",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS project_key_files (
                    project_path           TEXT    NOT NULL,
                    path                   TEXT    NOT NULL,
                    content                TEXT    NOT NULL,
                    content_hash           TEXT    NOT NULL,
                    local_token_estimate   INTEGER NOT NULL,
                    generated_at           INTEGER NOT NULL,
                    generated_by_model     TEXT,
                    generation_config_hash TEXT    NOT NULL,
                    stale_reason           TEXT,
                    PRIMARY KEY (project_path, path)
                );

                CREATE INDEX IF NOT EXISTS idx_project_key_files_project
                    ON project_key_files(project_path);
                CREATE INDEX IF NOT EXISTS idx_project_key_files_generated_at
                    ON project_key_files(project_path, generated_at);

                CREATE TABLE IF NOT EXISTS project_key_files_version (
                    project_path TEXT    PRIMARY KEY,
                    version      INTEGER NOT NULL DEFAULT 0
                );
            `);
    }
  },
  {
    version: 15,
    description: "Add the now-retired deferred_execute_state column",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "deferred_execute_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN deferred_execute_state TEXT");
      }
    }
  },
  {
    version: 16,
    description: "Add context-limit cache regression sentinels",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "observed_safe_input_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN observed_safe_input_tokens INTEGER NOT NULL DEFAULT 0");
      }
      if (!cols.some((c) => c.name === "cache_alert_sent")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN cache_alert_sent INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 17,
    description: "Multi-anchor JSON storage for note-nudge and auto-search-hint persistence",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "note_nudge_anchors")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN note_nudge_anchors TEXT NOT NULL DEFAULT '[]'");
      }
      if (!cols.some((c) => c.name === "auto_search_hint_decisions")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN auto_search_hint_decisions TEXT NOT NULL DEFAULT '[]'");
      }
      db.exec(`
                UPDATE session_meta
                SET note_nudge_anchors = json_array(
                    json_object(
                        'messageId', note_nudge_sticky_message_id,
                        'text', note_nudge_sticky_text
                    )
                )
                WHERE COALESCE(note_nudge_sticky_text, '') != ''
                  AND COALESCE(note_nudge_sticky_message_id, '') != ''
                  AND (note_nudge_anchors IS NULL OR note_nudge_anchors = '[]')
            `);
      db.exec(`
                UPDATE session_meta SET note_nudge_anchors = '[]'
                WHERE note_nudge_anchors IS NULL
            `);
      db.exec(`
                UPDATE session_meta SET auto_search_hint_decisions = '[]'
                WHERE auto_search_hint_decisions IS NULL
            `);
    }
  },
  {
    version: 18,
    description: "Add pending_pi_compaction_marker_state column for Pi deferred marker drain",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "pending_pi_compaction_marker_state")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pending_pi_compaction_marker_state TEXT");
      }
    }
  },
  {
    version: 19,
    description: "Add compartment state lease table",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_state_lease (
                    session_id TEXT PRIMARY KEY NOT NULL,
                    holder_id TEXT NOT NULL,
                    acquired_at INTEGER NOT NULL,
                    expires_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_compartment_state_lease_expires
                    ON compartment_state_lease(expires_at);
            `);
    }
  },
  {
    version: 20,
    description: "Add subagent invocation token accounting",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS subagent_invocations (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL,
                    subagent TEXT NOT NULL,
                    task TEXT,
                    provider_id TEXT,
                    model_id TEXT,
                    started_at INTEGER NOT NULL,
                    ended_at INTEGER,
                    status TEXT NOT NULL,
                    input_tokens INTEGER NOT NULL DEFAULT 0,
                    output_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_read_tokens INTEGER NOT NULL DEFAULT 0,
                    cache_write_tokens INTEGER NOT NULL DEFAULT 0,
                    error TEXT,
                    parent_invocation_id INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_sai_session_started
                    ON subagent_invocations(session_id, started_at DESC);
                CREATE INDEX IF NOT EXISTS idx_sai_subagent
                    ON subagent_invocations(subagent, started_at DESC);
            `);
    }
  },
  {
    version: 21,
    description: "Add session lifetime work metrics",
    up: (db) => {
      const cols = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!cols.some((c) => c.name === "new_work_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN new_work_tokens INTEGER NOT NULL DEFAULT 0");
      }
      if (!cols.some((c) => c.name === "total_input_tokens")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN total_input_tokens INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 22,
    description: "v2.0 cache architecture schema foundation",
    up: (db) => {
      const hasSessionMetaTable = tableExists2(db, "session_meta");
      const hasCompartmentsTable = tableExists2(db, "compartments");
      const hasMemoriesTable = tableExists2(db, "memories");
      if (hasSessionMetaTable) {
        ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
        ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
        ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
        ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
        ensureColumn(db, "session_meta", "upgrade_reminded_at", "INTEGER");
      }
      if (hasCompartmentsTable) {
        ensureColumn(db, "compartments", "p1", "TEXT");
        ensureColumn(db, "compartments", "p2", "TEXT");
        ensureColumn(db, "compartments", "p3", "TEXT");
        ensureColumn(db, "compartments", "p4", "TEXT");
        ensureColumn(db, "compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
        ensureColumn(db, "compartments", "episode_type", "TEXT");
        ensureColumn(db, "compartments", "p1_embedding", "BLOB");
        ensureColumn(db, "compartments", "p1_embedding_model_id", "TEXT");
        ensureColumn(db, "compartments", "legacy", "INTEGER NOT NULL DEFAULT 0");
      }
      const hasRecompCompartmentsTable = tableExists2(db, "recomp_compartments");
      if (hasRecompCompartmentsTable) {
        ensureColumn(db, "recomp_compartments", "p1", "TEXT");
        ensureColumn(db, "recomp_compartments", "p2", "TEXT");
        ensureColumn(db, "recomp_compartments", "p3", "TEXT");
        ensureColumn(db, "recomp_compartments", "p4", "TEXT");
        ensureColumn(db, "recomp_compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
        ensureColumn(db, "recomp_compartments", "episode_type", "TEXT");
      }
      if (hasMemoriesTable) {
        ensureColumn(db, "memories", "importance", "INTEGER");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS schema_migrations_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS project_state (
                    project_path TEXT PRIMARY KEY,
                    project_memory_epoch INTEGER NOT NULL DEFAULT 0,
                    project_user_profile_version INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );

                CREATE TABLE IF NOT EXISTS m0_mutation_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    mutation_type TEXT NOT NULL CHECK (mutation_type IN (
                        'compartment_delete',
                        'compartment_merge',
                        'recomp_boundary_change',
                        'compartment_upgrade'
                    )),
                    target_id INTEGER,
                    queued_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session
                    ON m0_mutation_log(session_id);

                CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
                    old_project_path TEXT PRIMARY KEY,
                    new_project_path TEXT NOT NULL,
                    rekeyed_at INTEGER NOT NULL
                );

                CREATE TABLE IF NOT EXISTS v22_backfill_failures (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    table_name TEXT NOT NULL,
                    row_id INTEGER NOT NULL,
                    raw_project_path TEXT NOT NULL,
                    error_class TEXT NOT NULL CHECK (error_class IN (
                        'not_git_repo',
                        'git_missing',
                        'git_timeout',
                        'permission_denied',
                        'unknown'
                    )),
                    error_message TEXT,
                    failed_at INTEGER NOT NULL,
                    UNIQUE(table_name, row_id)
                );
            `);
      if (hasCompartmentsTable) {
        db.exec(`
                    INSERT OR IGNORE INTO schema_migrations_meta (key, value)
                    SELECT 'v22_legacy_compartment_boundary', CAST(COALESCE(MAX(id), 0) AS TEXT)
                    FROM compartments
                `);
        const boundaryRow = db.prepare("SELECT value FROM schema_migrations_meta WHERE key = 'v22_legacy_compartment_boundary'").get();
        const compartmentBoundary = Number.parseInt(boundaryRow?.value ?? "0", 10);
        db.prepare("UPDATE compartments SET legacy = 1 WHERE legacy = 0 AND id <= ?").run(Number.isFinite(compartmentBoundary) ? compartmentBoundary : 0);
      } else {
        db.prepare("INSERT OR IGNORE INTO schema_migrations_meta (key, value) VALUES ('v22_legacy_compartment_boundary', '0')").run();
      }
      db.prepare("INSERT OR IGNORE INTO schema_migrations_meta (key, value) VALUES ('v22_legacy_memory_backfill', 'pending')").run();
    }
  },
  {
    version: 23,
    description: "v2 compartment events storage (causal_incident / trajectory_correction)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_events (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    compartment_id INTEGER,
                    kind TEXT NOT NULL,
                    at_compartment INTEGER,
                    fields_json TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode'
                );
                CREATE INDEX IF NOT EXISTS idx_compartment_events_session
                    ON compartment_events(session_id);
            `);
    }
  },
  {
    version: 24,
    description: "historian_runs metrics (per-run quality/cost telemetry)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS historian_runs (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    subagent_invocation_id INTEGER,
                    run_kind TEXT NOT NULL,
                    status TEXT NOT NULL,
                    failure_reason TEXT,
                    chunk_start_ordinal INTEGER,
                    chunk_end_ordinal INTEGER,
                    unprocessed_from INTEGER,
                    compartments_produced INTEGER NOT NULL DEFAULT 0,
                    compartment_id_min INTEGER,
                    compartment_id_max INTEGER,
                    facts_emitted INTEGER NOT NULL DEFAULT 0,
                    facts_by_category_json TEXT,
                    events_emitted INTEGER NOT NULL DEFAULT 0,
                    importance_min INTEGER,
                    importance_max INTEGER,
                    importance_avg REAL,
                    discarded_last INTEGER NOT NULL DEFAULT 0,
                    legacy INTEGER NOT NULL DEFAULT 0,
                    created_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_historian_runs_session
                    ON historian_runs(session_id, created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_historian_runs_status
                    ON historian_runs(status, created_at DESC);
            `);
    }
  },
  {
    version: 25,
    description: "pi_stable_id_scheme session_meta column (Pi message-id cutover gate)",
    up: (db) => {
      const rows = db.prepare("PRAGMA table_info(session_meta)").all();
      if (!rows.some((row) => row.name === "pi_stable_id_scheme")) {
        db.exec("ALTER TABLE session_meta ADD COLUMN pi_stable_id_scheme INTEGER");
      }
    }
  },
  {
    version: 26,
    description: "memory mutation log and atomic m[1] cache columns",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS memory_mutation_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    mutation_type TEXT NOT NULL CHECK (mutation_type IN (
                        'archive',
                        'delete',
                        'update',
                        'superseded'
                    )),
                    target_memory_id INTEGER NOT NULL,
                    superseded_by_id INTEGER,
                    category TEXT,
                    new_content TEXT,
                    queued_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
                    ON memory_mutation_log(project_path, id);
            `);
      ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
      ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_max_memory_mutation_id", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
      ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
      ensureColumn(db, "session_meta", "cached_m1_bytes", "BLOB");
      ensureColumn(db, "session_meta", "last_observed_model_key", "TEXT");
      ensureColumn(db, "session_meta", "memory_block_cache", "TEXT DEFAULT ''");
      ensureColumn(db, "session_meta", "memory_block_count", "INTEGER DEFAULT 0");
      ensureColumn(db, "session_meta", "memory_block_ids", "TEXT DEFAULT ''");
      db.prepare(`UPDATE session_meta SET
                    cached_m0_bytes = NULL,
                    cached_m1_bytes = NULL,
                    cached_m0_project_memory_epoch = NULL,
                    cached_m0_project_user_profile_version = NULL,
                    cached_m0_max_compartment_seq = NULL,
                    cached_m0_max_memory_id = NULL,
                    cached_m0_max_mutation_id = NULL,
                    cached_m0_max_memory_mutation_id = NULL,
                    cached_m0_project_docs_hash = NULL,
                    cached_m0_materialized_at = NULL,
                    cached_m0_session_facts_version = NULL,
                    cached_m0_upgrade_state = NULL,
                    memory_block_cache = '',
                    memory_block_count = 0,
                    memory_block_ids = ''`).run();
    }
  },
  {
    version: 27,
    description: "tags.entry_fingerprint for Pi fallback-tag adoption",
    up: (db) => {
      const hasTags = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='tags' LIMIT 1").get();
      if (!hasTags)
        return;
      ensureColumn(db, "tags", "entry_fingerprint", "TEXT");
      db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_adopt
                    ON tags(session_id, entry_fingerprint)
                    WHERE type='message' AND entry_fingerprint IS NOT NULL`);
    }
  },
  {
    version: 28,
    description: "Add git commit sweep coordinator lease/cooldown table",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS git_sweep_coordinator (
                    project_path TEXT PRIMARY KEY,
                    lease_holder TEXT,
                    lease_expires_at INTEGER,
                    last_swept_at INTEGER
                );
                CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_lease_expires
                    ON git_sweep_coordinator(lease_expires_at);
                CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_last_swept
                    ON git_sweep_coordinator(last_swept_at);
            `);
    }
  },
  {
    version: 29,
    description: "Add anchor_ordinal to notes (traceback to the conversation tail)",
    up: (db) => {
      const notesExists = db.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='notes'").get();
      if (!notesExists) {
        return;
      }
      const columns = db.prepare("PRAGMA table_info(notes)").all();
      if (!columns.some((column) => column.name === "anchor_ordinal")) {
        db.exec("ALTER TABLE notes ADD COLUMN anchor_ordinal INTEGER");
      }
    }
  },
  {
    version: 30,
    description: "HARD-bust m[0] markers: cached system/tool-set/model identity",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "cached_m0_system_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_tool_set_hash", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_model_key", "TEXT");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      if (columns.has("cached_m0_bytes")) {
        db.prepare(`UPDATE session_meta SET
                        cached_m0_bytes = NULL,
                        cached_m1_bytes = NULL,
                        cached_m0_materialized_at = NULL,
                        cached_m0_system_hash = NULL,
                        cached_m0_tool_set_hash = NULL,
                        cached_m0_model_key = NULL`).run();
      }
    }
  },
  {
    version: 31,
    description: "Nudge redesign: Channel 1 cadence (last_nudge_undropped) + Channel 2 ceiling lease " + "(channel2_nudge_state); zero legacy ctx_reduce-nudge sticky/anchor state (startup heal)",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "last_nudge_undropped", "INTEGER DEFAULT 0");
      ensureColumn(db, "session_meta", "channel2_nudge_state", "TEXT DEFAULT ''");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      if (columns.has("sticky_turn_reminder_text")) {
        db.prepare(`UPDATE session_meta SET
                        sticky_turn_reminder_text = '',
                        sticky_turn_reminder_message_id = '',
                        nudge_anchor_message_id = '',
                        nudge_anchor_text = ''`).run();
      }
    }
  },
  {
    version: 32,
    description: "Protected tail boundary state, usage resolver fields, recovery escape, and drain quota",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "prior_boundary_ordinal", "INTEGER NOT NULL DEFAULT 1");
      ensureColumn(db, "session_meta", "protected_tail_policy_version", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "protected_tail_drain_window_started_at", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "protected_tail_drain_tokens", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "recovery_no_eligible_head_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "force_emergency_bypass_window_start", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "force_emergency_bypass_used", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "last_usage_context_limit", "INTEGER NOT NULL DEFAULT 0");
      db.prepare("UPDATE session_meta SET prior_boundary_ordinal = 1 WHERE prior_boundary_ordinal IS NULL OR prior_boundary_ordinal < 1").run();
      db.prepare("UPDATE session_meta SET protected_tail_policy_version = 0 WHERE protected_tail_policy_version IS NULL").run();
      db.prepare("UPDATE session_meta SET protected_tail_drain_window_started_at = 0 WHERE protected_tail_drain_window_started_at IS NULL").run();
      db.prepare("UPDATE session_meta SET protected_tail_drain_tokens = 0 WHERE protected_tail_drain_tokens IS NULL").run();
      db.prepare("UPDATE session_meta SET recovery_no_eligible_head_count = 0 WHERE recovery_no_eligible_head_count IS NULL").run();
      db.prepare("UPDATE session_meta SET force_emergency_bypass_window_start = 0 WHERE force_emergency_bypass_window_start IS NULL").run();
      db.prepare("UPDATE session_meta SET force_emergency_bypass_used = 0 WHERE force_emergency_bypass_used IS NULL").run();
      db.prepare("UPDATE session_meta SET last_usage_context_limit = 0 WHERE last_usage_context_limit IS NULL").run();
    }
  },
  {
    version: 33,
    description: "Compartment chunk embeddings for semantic message-history search",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS compartment_chunk_embeddings (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    window_index INTEGER NOT NULL DEFAULT 0,
                    start_ordinal INTEGER NOT NULL,
                    end_ordinal INTEGER NOT NULL,
                    chunk_hash TEXT NOT NULL,
                    model_id TEXT NOT NULL,
                    dims INTEGER NOT NULL,
                    vector BLOB NOT NULL,
                    created_at INTEGER NOT NULL,
                    UNIQUE(compartment_id, window_index)
                );
                CREATE INDEX IF NOT EXISTS idx_cce_session
                    ON compartment_chunk_embeddings(session_id);
                CREATE INDEX IF NOT EXISTS idx_cce_project_model
                    ON compartment_chunk_embeddings(project_path, model_id);
            `);
    }
  },
  {
    version: 34,
    description: "workspace tables and m[0] workspace fingerprint cache reset",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS workspaces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS workspace_members (
                    workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
                    project_path TEXT NOT NULL,
                    display_name TEXT NOT NULL,
                    display_path TEXT NOT NULL,
                    added_at INTEGER NOT NULL,
                    PRIMARY KEY (workspace_id, project_path)
                );
                CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique
                    ON workspace_members(project_path);
                CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name
                    ON workspace_members(workspace_id, display_name);
            `);
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta' LIMIT 1").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "cached_m0_workspace_fingerprint", "TEXT");
      const columns = new Set(db.prepare("PRAGMA table_info(session_meta)").all().map((column) => column.name));
      const clears = [
        ["cached_m0_bytes", null],
        ["cached_m1_bytes", null],
        ["cached_m0_project_memory_epoch", null],
        ["cached_m0_workspace_fingerprint", null],
        ["cached_m0_project_user_profile_version", null],
        ["cached_m0_max_compartment_seq", null],
        ["cached_m0_max_memory_id", null],
        ["cached_m0_max_mutation_id", null],
        ["cached_m0_max_memory_mutation_id", null],
        ["cached_m0_project_docs_hash", null],
        ["cached_m0_materialized_at", null],
        ["cached_m0_session_facts_version", null],
        ["cached_m0_upgrade_state", null],
        ["cached_m0_system_hash", null],
        ["cached_m0_tool_set_hash", null],
        ["cached_m0_model_key", null],
        ["cached_m0_last_baseline_end_message_id", null],
        ["memory_block_cache", ""],
        ["memory_block_ids", ""],
        ["memory_block_count", 0]
      ];
      const setClauses = [];
      const values = [];
      for (const [column, value] of clears) {
        if (!columns.has(column))
          continue;
        setClauses.push(`${column} = ?`);
        values.push(value);
      }
      if (setClauses.length > 0) {
        db.prepare(`UPDATE session_meta SET ${setClauses.join(", ")}`).run(...values);
      }
    }
  },
  {
    version: 35,
    description: "workspace per-category share defaults and epoch refresh",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS workspaces (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    name TEXT NOT NULL UNIQUE,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL,
                    share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
                );
            `);
      ensureColumn(db, "workspaces", "share_categories", `TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'`);
      db.prepare(`UPDATE workspaces
                    SET share_categories = '["CONSTRAINTS"]'
                  WHERE share_categories IS NULL OR share_categories = ''`).run();
      if (!tableExists2(db, "workspace_members"))
        return;
      const rows = db.prepare(`SELECT DISTINCT project_path AS identity
                       FROM workspace_members
                      WHERE project_path IS NOT NULL AND project_path <> ''
                      ORDER BY project_path ASC`).all();
      const identities = rows.map((row) => typeof row.identity === "string" ? row.identity : "").filter((identity) => identity.length > 0);
      if (identities.length > 0) {
        bumpEpochsForWorkspaceMemberSet(db, identities, Date.now());
      }
    }
  },
  {
    version: 36,
    description: "session project ownership map for compartment chunk backfill scoping",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS session_projects (
                    session_id TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    project_path TEXT NOT NULL,
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY(session_id, harness)
                );
                CREATE INDEX IF NOT EXISTS idx_session_projects_project
                    ON session_projects(project_path);
            `);
      const hasChunkTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='compartment_chunk_embeddings'").get();
      if (hasChunkTable) {
        db.exec(`
                    INSERT OR IGNORE INTO session_projects (session_id, harness, project_path, updated_at)
                    SELECT session_id, harness, MIN(project_path), 0
                    FROM compartment_chunk_embeddings
                    GROUP BY session_id, harness
                    HAVING COUNT(DISTINCT project_path) = 1;
                `);
      }
    }
  },
  {
    version: 37,
    description: "emergency drain catch-up latch + historian drain failure backoff",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta'").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "emergency_drain_active", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "session_meta", "historian_drain_failure_at", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 38,
    description: "durable transform decisions for cache-event cause attribution",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS transform_decisions (
                    session_id         TEXT    NOT NULL,
                    harness            TEXT    NOT NULL DEFAULT 'opencode',
                    message_id         TEXT    NOT NULL,
                    ts_ms              INTEGER NOT NULL,
                    decision           TEXT    NOT NULL,
                    materialized       INTEGER NOT NULL DEFAULT 0,
                    materialize_reason TEXT,
                    emergency          INTEGER NOT NULL DEFAULT 0,
                    dropped_tokens     INTEGER NOT NULL DEFAULT 0,
                    dropped_count      INTEGER NOT NULL DEFAULT 0,
                    input_tokens       INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (session_id, harness, message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
                    ON transform_decisions(session_id, harness);
            `);
    }
  },
  {
    version: 39,
    description: "persist compaction marker target end message id",
    up: (db) => {
      const hasSessionMeta = db.prepare("SELECT 1 FROM sqlite_master WHERE type='table' AND name='session_meta'").get();
      if (!hasSessionMeta)
        return;
      ensureColumn(db, "session_meta", "compaction_marker_state", "TEXT DEFAULT ''");
      ensureColumn(db, "session_meta", "compaction_marker_target_end_message_id", "TEXT");
      db.exec(`
                UPDATE session_meta
                SET compaction_marker_target_end_message_id = json_extract(compaction_marker_state, '$.targetEndMessageId')
                WHERE compaction_marker_target_end_message_id IS NULL
                  AND COALESCE(compaction_marker_state, '') != ''
                  AND json_valid(compaction_marker_state)
                  AND typeof(json_extract(compaction_marker_state, '$.targetEndMessageId')) = 'text'
            `);
    }
  },
  {
    version: 40,
    description: "index Pi fallback tool owners for stable-id cutover",
    up: (db) => {
      if (!tableExists2(db, "tags"))
        return;
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_tags_pi_fallback_tool_owner
                ON tags(session_id, tool_owner_message_id)
                WHERE type='tool';
            `);
    }
  },
  {
    version: 41,
    description: "key detected context limits by model",
    up: (db) => {
      if (!tableExists2(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "detected_context_limit_model_key", "TEXT");
    }
  },
  {
    version: 42,
    description: "per-task dreamer scheduling state (Dreamer v2 A+B)",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS task_schedule_state (
                    project_path  TEXT    NOT NULL,
                    task          TEXT    NOT NULL,
                    last_run_at   INTEGER,
                    next_due_at   INTEGER,
                    schedule      TEXT,
                    last_status   TEXT,
                    last_error    TEXT,
                    retry_count   INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY (project_path, task)
                );
                CREATE INDEX IF NOT EXISTS idx_task_schedule_due
                    ON task_schedule_state(next_due_at);
            `);
    }
  },
  {
    version: 43,
    description: "memory verification side table and verify watermarks",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS memory_verifications (
                    memory_id    INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
                    file_path    TEXT NOT NULL,
                    verified_at  INTEGER NOT NULL,
                    PRIMARY KEY (memory_id, file_path)
                );
                CREATE INDEX IF NOT EXISTS idx_memory_verifications_memory
                    ON memory_verifications(memory_id);
            `);
      if (tableExists2(db, "task_schedule_state")) {
        ensureColumn(db, "task_schedule_state", "last_checked_commit", "TEXT");
        ensureColumn(db, "task_schedule_state", "last_broad_run_at", "INTEGER");
      }
    }
  },
  {
    version: 44,
    description: "memory classification scope and shareability columns",
    up: (db) => {
      if (!tableExists2(db, "memories"))
        return;
      ensureColumn(db, "memories", "scope", "TEXT NOT NULL DEFAULT 'project'");
      ensureColumn(db, "memories", "shareable", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 45,
    description: "retrospective content watermark and processed-window idempotence",
    up: (db) => {
      if (tableExists2(db, "task_schedule_state")) {
        ensureColumn(db, "task_schedule_state", "retrospective_watermark_ms", "INTEGER");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS retrospective_processed_windows (
                    project_path TEXT NOT NULL,
                    window_key   TEXT NOT NULL,
                    processed_at INTEGER NOT NULL,
                    PRIMARY KEY (project_path, window_key)
                );
            `);
    }
  },
  {
    version: 46,
    description: "Primers v1 candidate and promoted primer storage",
    up: (db) => {
      db.exec(`
                CREATE TABLE IF NOT EXISTS primer_candidates (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    session_id TEXT NOT NULL,
                    question TEXT NOT NULL,
                    normalized_question TEXT NOT NULL,
                    source_compartment_start INTEGER,
                    source_compartment_end INTEGER,
                    source_start_message_id TEXT NOT NULL DEFAULT '',
                    source_end_message_id TEXT NOT NULL DEFAULT '',
                    source_message_time INTEGER NOT NULL,
                    question_embedding BLOB,
                    question_embedding_model_id TEXT,
                    created_at INTEGER NOT NULL,
                    UNIQUE(project_path, harness, session_id, source_start_message_id, source_end_message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
                    ON primer_candidates(project_path, source_message_time);
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
                    ON primer_candidates(session_id, harness);
                CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
                    ON primer_candidates(project_path, question_embedding_model_id);

                CREATE TABLE IF NOT EXISTS primers (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    project_path TEXT NOT NULL,
                    question TEXT NOT NULL,
                    question_embedding BLOB,
                    question_embedding_model_id TEXT,
                    answer TEXT NOT NULL DEFAULT '',
                    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
                    total_support INTEGER NOT NULL DEFAULT 0,
                    last_observed_at INTEGER,
                    answer_refreshed_at INTEGER,
                    source_candidate_ids TEXT NOT NULL DEFAULT '[]',
                    source_candidate_provenance TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
                    ON primers(project_path, status, last_observed_at DESC);
                CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
                    ON primers(project_path, question_embedding_model_id);

                CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
                    question,
                    answer,
                    project_path UNINDEXED,
                    content='primers',
                    content_rowid='id',
                    tokenize='porter unicode61'
                );
                CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
                    INSERT INTO primers_fts(rowid, question, answer, project_path)
                    VALUES (new.id, new.question, new.answer, new.project_path);
                END;
                CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
                    INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
                    VALUES ('delete', old.id, old.question, old.answer, old.project_path);
                END;
                CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
                    INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
                    VALUES ('delete', old.id, old.question, old.answer, old.project_path);
                    INSERT INTO primers_fts(rowid, question, answer, project_path)
                    VALUES (new.id, new.question, new.answer, new.project_path);
                END;
            `);
    }
  },
  {
    version: 47,
    description: "compiled smart-note checks and runtime policy state",
    up: (db) => {
      if (!tableExists2(db, "notes"))
        return;
      ensureColumn(db, "notes", "compiled_check", "TEXT");
      ensureColumn(db, "notes", "manifest_json", "TEXT");
      ensureColumn(db, "notes", "check_hash", "TEXT");
      ensureColumn(db, "notes", "check_cron", "TEXT");
      ensureColumn(db, "notes", "check_version", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_status", "TEXT NOT NULL DEFAULT 'uncompiled'");
      ensureColumn(db, "notes", "check_failure_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_network_failure_count", "INTEGER NOT NULL DEFAULT 0");
      ensureColumn(db, "notes", "check_quarantined_until", "INTEGER");
      ensureColumn(db, "notes", "check_next_due_at", "INTEGER");
      ensureColumn(db, "notes", "check_compiled_at", "INTEGER");
      ensureColumn(db, "notes", "check_false_since_at", "INTEGER");
      ensureColumn(db, "notes", "check_last_liveness_at", "INTEGER");
      ensureColumn(db, "notes", "policy_version", "INTEGER NOT NULL DEFAULT 1");
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_notes_smart_checks_due
                    ON notes(project_path, check_status, check_next_due_at)
                    WHERE type = 'smart' AND status = 'pending';
                CREATE INDEX IF NOT EXISTS idx_notes_smart_checks_liveness
                    ON notes(project_path, check_false_since_at, check_last_liveness_at)
                    WHERE type = 'smart' AND status = 'pending';
            `);
    }
  },
  {
    version: 48,
    description: "DreamerV2 rework: memory→file mapping vs verification split, classify marker",
    up: (db) => {
      if (tableExists2(db, "memory_verifications")) {
        ensureColumn(db, "memory_verifications", "mapped_at", "INTEGER NOT NULL DEFAULT 0");
      }
      if (tableExists2(db, "memories")) {
        ensureColumn(db, "memories", "classified_at", "INTEGER");
      }
    }
  },
  {
    version: 49,
    description: "per-model embedding coexistence and active identity tracking",
    up: (db) => {
      if (tableExists2(db, "memory_embeddings")) {
        db.exec(`
                    UPDATE memory_embeddings
                    SET model_id = 'legacy:unknown'
                    WHERE model_id IS NULL;
                `);
        if (tableExists2(db, "memories")) {
          db.exec(`
                        DELETE FROM memory_embeddings
                        WHERE memory_id NOT IN (SELECT id FROM memories);
                    `);
        }
        db.exec(`
                    DROP TABLE IF EXISTS memory_embeddings_v49_new;
                    CREATE TABLE memory_embeddings_v49_new (
                        memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
                        embedding BLOB NOT NULL,
                        model_id TEXT NOT NULL,
                        PRIMARY KEY(memory_id, model_id)
                    );
                    INSERT INTO memory_embeddings_v49_new (memory_id, embedding, model_id)
                    SELECT memory_id, embedding, model_id
                    FROM memory_embeddings;
                    DROP TABLE memory_embeddings;
                    ALTER TABLE memory_embeddings_v49_new RENAME TO memory_embeddings;
                `);
        assertForeignKeyIntegrity(db, "memory_embeddings");
      }
      if (tableExists2(db, "git_commit_embeddings")) {
        if (tableExists2(db, "git_commits")) {
          db.exec(`
                        DELETE FROM git_commit_embeddings
                        WHERE sha NOT IN (SELECT sha FROM git_commits);
                    `);
        }
        db.exec(`
                    DROP TABLE IF EXISTS git_commit_embeddings_v49_new;
                    CREATE TABLE git_commit_embeddings_v49_new (
                        sha TEXT NOT NULL,
                        embedding BLOB NOT NULL,
                        model_id TEXT NOT NULL,
                        created_at INTEGER NOT NULL,
                        PRIMARY KEY(sha, model_id),
                        FOREIGN KEY(sha) REFERENCES git_commits(sha) ON DELETE CASCADE
                    );
                    INSERT INTO git_commit_embeddings_v49_new (sha, embedding, model_id, created_at)
                    SELECT sha, embedding, model_id, created_at
                    FROM git_commit_embeddings;
                    DROP TABLE git_commit_embeddings;
                    ALTER TABLE git_commit_embeddings_v49_new RENAME TO git_commit_embeddings;
                `);
        assertForeignKeyIntegrity(db, "git_commit_embeddings");
      }
      if (tableExists2(db, "compartment_chunk_embeddings")) {
        if (tableExists2(db, "compartments")) {
          db.exec(`
                        DELETE FROM compartment_chunk_embeddings
                        WHERE compartment_id NOT IN (SELECT id FROM compartments);
                    `);
        }
        db.exec(`
                    DROP INDEX IF EXISTS idx_cce_session;
                    DROP INDEX IF EXISTS idx_cce_project_model;
                    DROP TABLE IF EXISTS compartment_chunk_embeddings_v49_new;
                    CREATE TABLE compartment_chunk_embeddings_v49_new (
                        id INTEGER PRIMARY KEY AUTOINCREMENT,
                        compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
                        session_id TEXT NOT NULL,
                        project_path TEXT NOT NULL,
                        harness TEXT NOT NULL DEFAULT 'opencode',
                        window_index INTEGER NOT NULL DEFAULT 0,
                        start_ordinal INTEGER NOT NULL,
                        end_ordinal INTEGER NOT NULL,
                        chunk_hash TEXT NOT NULL,
                        model_id TEXT NOT NULL,
                        dims INTEGER NOT NULL,
                        vector BLOB NOT NULL,
                        created_at INTEGER NOT NULL,
                        UNIQUE(compartment_id, model_id, window_index)
                    );
                    INSERT INTO compartment_chunk_embeddings_v49_new (
                        id, compartment_id, session_id, project_path, harness, window_index,
                        start_ordinal, end_ordinal, chunk_hash, model_id, dims, vector, created_at
                    )
                    SELECT id, compartment_id, session_id, project_path, harness, window_index,
                           start_ordinal, end_ordinal, chunk_hash, model_id, dims, vector, created_at
                    FROM compartment_chunk_embeddings;
                    DROP TABLE compartment_chunk_embeddings;
                    ALTER TABLE compartment_chunk_embeddings_v49_new RENAME TO compartment_chunk_embeddings;
                    CREATE INDEX IF NOT EXISTS idx_cce_session ON compartment_chunk_embeddings(session_id);
                    CREATE INDEX IF NOT EXISTS idx_cce_project_model ON compartment_chunk_embeddings(project_path, model_id);
                `);
        assertForeignKeyIntegrity(db, "compartment_chunk_embeddings");
      }
      db.exec(`
                CREATE TABLE IF NOT EXISTS embedding_identity_active (
                    project_path TEXT NOT NULL,
                    scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
                    model_id TEXT NOT NULL,
                    last_active_at INTEGER NOT NULL,
                    PRIMARY KEY(project_path, scope, model_id)
                );
            `);
    }
  },
  {
    version: 50,
    description: "add durable ctx-wrapup session marker",
    up(db) {
      if (tableExists2(db, "session_meta")) {
        ensureColumn(db, "session_meta", "wrapup_in_progress_state", "TEXT");
      }
    }
  },
  {
    version: 51,
    description: "version tool-owner backfill state and repair legacy NULL session metadata",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
                    session_id TEXT PRIMARY KEY,
                    status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
                    started_at INTEGER,
                    lease_expires_at INTEGER,
                    completed_at INTEGER,
                    last_error TEXT
                );
                CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
                    ON tool_owner_backfill_state(status);
            `);
      healAllNullColumns(db);
    }
  },
  {
    version: 52,
    description: "persist emergency recovery origin",
    up(db) {
      if (tableExists2(db, "session_meta")) {
        ensureColumn(db, "session_meta", "emergency_recovery_origin", "TEXT DEFAULT ''");
      }
    }
  },
  {
    version: 53,
    description: "add Synapse batch, shadow, and measurement storage",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS embedding_registrations (
                    project_path TEXT PRIMARY KEY,
                    provider_identity TEXT NOT NULL DEFAULT '',
                    model_id TEXT NOT NULL DEFAULT '',
                    chunk_model_id TEXT NOT NULL DEFAULT '',
                    fingerprint TEXT NOT NULL DEFAULT '',
                    table_epoch INTEGER NOT NULL DEFAULT 0,
                    dims INTEGER NOT NULL DEFAULT 0,
                    provenance_json TEXT NOT NULL DEFAULT '{}',
                    generation INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS synapse_batch_ledger (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL DEFAULT '',
                    scope TEXT NOT NULL DEFAULT '',
                    manifest_json TEXT NOT NULL DEFAULT '{}',
                    request_key TEXT NOT NULL DEFAULT '',
                    job_id TEXT,
                    cursor TEXT,
                    status TEXT NOT NULL DEFAULT 'pending',
                    created_at INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(session_id, request_key)
                );
                CREATE INDEX IF NOT EXISTS idx_synapse_batch_ledger_session
                    ON synapse_batch_ledger(session_id, updated_at);
                CREATE TABLE IF NOT EXISTS shadow_embedding_registrations (
                    project_path TEXT NOT NULL,
                    scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
                    model_id TEXT NOT NULL,
                    generation INTEGER NOT NULL DEFAULT 0,
                    fingerprint TEXT NOT NULL DEFAULT '',
                    table_epoch INTEGER NOT NULL DEFAULT 0,
                    dims INTEGER NOT NULL DEFAULT 0,
                    provenance_json TEXT NOT NULL DEFAULT '{}',
                    updated_at INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(project_path, scope, model_id)
                );
                CREATE TABLE IF NOT EXISTS embedding_measurement_corpus (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    session_id TEXT NOT NULL,
                    project_path TEXT NOT NULL DEFAULT '',
                    dedup_key TEXT NOT NULL DEFAULT '',
                    cohort_key TEXT NOT NULL DEFAULT '',
                    query_text_hash TEXT NOT NULL DEFAULT '',
                    primary_result_ids_json TEXT NOT NULL DEFAULT '[]',
                    shadow_result_ids_json TEXT NOT NULL DEFAULT '[]',
                    primary_latency_ms INTEGER,
                    shadow_latency_ms INTEGER,
                    primary_failed INTEGER NOT NULL DEFAULT 0,
                    shadow_failed INTEGER NOT NULL DEFAULT 0,
                    primary_model_id TEXT NOT NULL DEFAULT '',
                    shadow_model_id TEXT NOT NULL DEFAULT '',
                    primary_fingerprint TEXT NOT NULL DEFAULT '',
                    shadow_fingerprint TEXT NOT NULL DEFAULT '',
                    primary_epoch INTEGER NOT NULL DEFAULT 0,
                    shadow_epoch INTEGER NOT NULL DEFAULT 0,
                    corpus_hash TEXT NOT NULL DEFAULT '',
                    coverage_json TEXT NOT NULL DEFAULT '{}',
                    created_at INTEGER NOT NULL DEFAULT 0,
                    UNIQUE(dedup_key, cohort_key)
                );
                CREATE INDEX IF NOT EXISTS idx_embedding_measurement_session
                    ON embedding_measurement_corpus(session_id, created_at);
            `);
    }
  },
  {
    version: 54,
    description: "add authority identity, managed-write guards, and mirror cursors",
    up(db) {
      const memoriesPresent = tableExists2(db, "memories");
      const notesPresent = tableExists2(db, "notes");
      db.exec(`
                CREATE TABLE IF NOT EXISTS context_store_meta (
                    key TEXT PRIMARY KEY,
                    value TEXT NOT NULL
                );
                CREATE TABLE IF NOT EXISTS authority_managed (
                    project_path TEXT PRIMARY KEY,
                    context_store_uuid TEXT NOT NULL,
                    marked_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS authority_repair_pending (
                    project_path TEXT PRIMARY KEY,
                    started_at INTEGER NOT NULL
                );
                CREATE TABLE IF NOT EXISTS mirror_identity (
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    context_row_id INTEGER NOT NULL,
                    PRIMARY KEY(domain, module_project, module_row_id),
                    UNIQUE(domain, context_row_id)
                );
                CREATE TABLE IF NOT EXISTS mirror_cursors (
                    domain TEXT PRIMARY KEY CHECK(domain IN ('memories', 'notes')),
                    cursor INTEGER NOT NULL DEFAULT 0,
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                CREATE TABLE IF NOT EXISTS context_privilege_state (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    enabled INTEGER NOT NULL DEFAULT 0 CHECK(enabled IN (0, 1))
                );
            `);
      if (memoriesPresent) {
        db.exec(`
                DROP TRIGGER IF EXISTS memories_authority_guard_insert;
                DROP TRIGGER IF EXISTS memories_authority_guard_update;
                DROP TRIGGER IF EXISTS memories_authority_guard_delete;
                CREATE TRIGGER memories_authority_guard_insert
                BEFORE INSERT ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                CREATE TRIGGER memories_authority_guard_update
                BEFORE UPDATE ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                CREATE TRIGGER memories_authority_guard_delete
                BEFORE DELETE ON memories
                 WHEN (
                     EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                     OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                 ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module');
                END;
                `);
      }
      if (notesPresent) {
        db.exec(`
                DROP TRIGGER IF EXISTS notes_authority_guard_insert;
                DROP TRIGGER IF EXISTS notes_authority_guard_update;
                DROP TRIGGER IF EXISTS notes_authority_guard_delete;
                CREATE TRIGGER notes_authority_guard_insert
                BEFORE INSERT ON notes
                 WHEN NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                   AND (
                       EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)
                   ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                CREATE TRIGGER notes_authority_guard_update
                BEFORE UPDATE ON notes
                WHEN (
                     (OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)))
                     OR
                     (NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path)))
                ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                CREATE TRIGGER notes_authority_guard_delete
                BEFORE DELETE ON notes
                 WHEN OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                   AND (
                       EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                   ) AND COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0
                BEGIN
                    SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module');
                END;
                `);
      }
    }
  },
  {
    version: 55,
    description: "make managed-write privilege connection-local",
    up(db) {
      const memoriesPresent = tableExists2(db, "memories");
      const notesPresent = tableExists2(db, "notes");
      const native = db;
      const privilegeCheck = typeof native.function === "function" || typeof native.createFunction === "function" ? "mc_privileged_writer() = 0" : "COALESCE((SELECT enabled FROM context_privilege_state WHERE id = 1), 0) = 0";
      if (memoriesPresent) {
        db.exec(`
                    DROP TRIGGER IF EXISTS memories_authority_guard_insert;
                    DROP TRIGGER IF EXISTS memories_authority_guard_update;
                    DROP TRIGGER IF EXISTS memories_authority_guard_delete;
                    CREATE TRIGGER memories_authority_guard_insert
                    BEFORE INSERT ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                    CREATE TRIGGER memories_authority_guard_update
                    BEFORE UPDATE ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                    CREATE TRIGGER memories_authority_guard_delete
                    BEFORE DELETE ON memories
                    WHEN (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                       OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db memory writes are managed by the Rust module'); END;
                `);
      }
      if (notesPresent) {
        db.exec(`
                    DROP TRIGGER IF EXISTS notes_authority_guard_insert;
                    DROP TRIGGER IF EXISTS notes_authority_guard_update;
                    DROP TRIGGER IF EXISTS notes_authority_guard_delete;
                    CREATE TRIGGER notes_authority_guard_insert
                    BEFORE INSERT ON notes
                    WHEN NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                    CREATE TRIGGER notes_authority_guard_update
                    BEFORE UPDATE ON notes
                    WHEN ((OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                            AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                              OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path)))
                       OR (NEW.type = 'smart' AND NEW.project_path IS NOT NULL
                            AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = NEW.project_path)
                              OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = NEW.project_path))))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                    CREATE TRIGGER notes_authority_guard_delete
                    BEFORE DELETE ON notes
                    WHEN OLD.type = 'smart' AND OLD.project_path IS NOT NULL
                      AND (EXISTS (SELECT 1 FROM authority_managed WHERE project_path = OLD.project_path)
                        OR EXISTS (SELECT 1 FROM authority_repair_pending WHERE project_path = OLD.project_path))
                      AND ${privilegeCheck}
                    BEGIN SELECT RAISE(ABORT, 'context.db smart-note writes are managed by the Rust module'); END;
                `);
      }
    }
  },
  {
    version: 56,
    description: "record authority capture bounds and pending mirror references",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS authority_capture_bounds (
                    project_path TEXT NOT NULL,
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    max_rowid INTEGER NOT NULL,
                    data_version INTEGER NOT NULL,
                    captured_at INTEGER NOT NULL,
                    PRIMARY KEY(project_path, domain)
                );
                CREATE TABLE IF NOT EXISTS mirror_pending_references (
                    domain TEXT NOT NULL CHECK(domain = 'memories'),
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    target_module_row_id INTEGER NOT NULL,
                    PRIMARY KEY(domain, module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_pending_reference_target
                    ON mirror_pending_references(domain, module_project, target_module_row_id);
                CREATE TABLE IF NOT EXISTS mirror_note_revisions (
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    context_row_id INTEGER NOT NULL,
                    status_version INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(module_project, module_row_id),
                    UNIQUE(context_row_id)
                );
            `);
      installLatestAuthorityTriggers(db);
    }
  },
  {
    version: 57,
    description: "domain mutation epoch for authority capture bounds",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS domain_mutation_epoch (
                    project_path TEXT NOT NULL,
                    domain TEXT NOT NULL CHECK(domain IN ('memories', 'notes')),
                    epoch INTEGER NOT NULL DEFAULT 0,
                    PRIMARY KEY(project_path, domain)
                );
            `);
      if (tableExists2(db, "authority_capture_bounds")) {
        ensureColumn(db, "authority_capture_bounds", "mutation_epoch", "INTEGER NOT NULL DEFAULT 0");
      }
    }
  },
  {
    version: 58,
    description: "track live module memory identities during mirror replay",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_live_memory_rows (
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    normalized_hash TEXT NOT NULL,
                    PRIMARY KEY(module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_live_memory_content
                    ON mirror_live_memory_rows(module_project, category, normalized_hash);
                CREATE TABLE IF NOT EXISTS mirror_resnapshot_state (
                    domain TEXT PRIMARY KEY CHECK(domain = 'memories'),
                    status TEXT NOT NULL CHECK(status IN ('pending_check', 'resnapshotting', 'complete')),
                    updated_at INTEGER NOT NULL
                );
                INSERT OR IGNORE INTO mirror_resnapshot_state(domain, status, updated_at)
                VALUES ('memories', 'pending_check', 0);
            `);
    }
  },
  {
    version: 59,
    description: "stage paged live memory resnapshots before atomic replacement",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_live_staging (
                    generation TEXT NOT NULL,
                    module_project TEXT NOT NULL,
                    module_row_id INTEGER NOT NULL,
                    category TEXT NOT NULL,
                    normalized_hash TEXT NOT NULL,
                    PRIMARY KEY(generation, module_project, module_row_id)
                );
                CREATE INDEX IF NOT EXISTS idx_mirror_live_staging_generation
                    ON mirror_live_staging(generation);
            `);
    }
  },
  {
    version: 60,
    description: "persist the owning live memory resnapshot generation",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mirror_resnapshot_state (
                    domain TEXT PRIMARY KEY CHECK(domain = 'memories'),
                    status TEXT NOT NULL CHECK(status IN ('pending_check', 'resnapshotting', 'complete')),
                    updated_at INTEGER NOT NULL
                );
            `);
      db.exec("INSERT OR IGNORE INTO mirror_resnapshot_state(domain, status, updated_at) VALUES ('memories', 'pending_check', 0)");
      ensureColumn(db, "mirror_resnapshot_state", "generation", "TEXT");
    }
  },
  {
    version: 61,
    description: "retain complete memory snapshots for mirror healing",
    up(db) {
      ensureColumn(db, "mirror_live_memory_rows", "full_row_snapshot", "TEXT");
      ensureColumn(db, "mirror_live_staging", "full_row_snapshot", "TEXT");
      db.prepare(`UPDATE mirror_resnapshot_state
                    SET status = 'pending_check', generation = NULL, updated_at = ?
                  WHERE domain = 'memories'
                    AND status = 'complete'
                    AND NOT EXISTS (
                        SELECT 1 FROM schema_migrations WHERE version = 61
                    )`).run(Date.now());
    }
  },
  {
    version: 62,
    description: "durable row-level project identity merge audit log",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS identity_merge_log (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    from_identity TEXT NOT NULL,
                    to_identity TEXT NOT NULL,
                    table_name TEXT NOT NULL,
                    row_id TEXT NOT NULL,
                    action TEXT NOT NULL,
                    target_row_id TEXT,
                    merged_at INTEGER NOT NULL
                );
                CREATE INDEX IF NOT EXISTS idx_identity_merge_log_identities
                    ON identity_merge_log(from_identity, to_identity, merged_at);
                CREATE INDEX IF NOT EXISTS idx_identity_merge_log_table_row
                    ON identity_merge_log(table_name, row_id);
            `);
    }
  },
  {
    version: 63,
    description: "Add anchor_block_id to notes (module note mirror writes it)",
    up(db) {
      if (!tableExists2(db, "notes"))
        return;
      const columns = db.prepare("PRAGMA table_info(notes)").all();
      if (!columns.some((column) => column.name === "anchor_block_id")) {
        db.exec("ALTER TABLE notes ADD COLUMN anchor_block_id TEXT");
      }
    }
  },
  {
    version: 64,
    description: "store project-scoped rendered memory mural",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS mural_manifest (
                    project_path TEXT PRIMARY KEY,
                    image BLOB NOT NULL,
                    content_hash TEXT NOT NULL,
                    rendered_at INTEGER NOT NULL,
                    model TEXT,
                    memory_ids_json TEXT NOT NULL DEFAULT '[]',
                    width INTEGER NOT NULL DEFAULT 1092,
                    height INTEGER NOT NULL DEFAULT 1092
                );
            `);
      ensureColumn(db, "mural_manifest", "model", "TEXT");
      ensureColumn(db, "mural_manifest", "memory_ids_json", "TEXT NOT NULL DEFAULT '[]'");
      ensureColumn(db, "mural_manifest", "width", "INTEGER NOT NULL DEFAULT 1092");
      ensureColumn(db, "mural_manifest", "height", "INTEGER NOT NULL DEFAULT 1092");
    }
  },
  {
    version: 65,
    description: "Add per-memory mural cue columns for the deterministic cue-compression cutover",
    up(db) {
      if (!tableExists2(db, "memories"))
        return;
      ensureColumn(db, "memories", "mural_cue", "TEXT");
      ensureColumn(db, "memories", "mural_cue_hash", "TEXT");
      ensureColumn(db, "memories", "mural_cue_at", "INTEGER");
    }
  },
  {
    version: 66,
    description: "bound per-session historian upgrade reminders",
    up(db) {
      if (!tableExists2(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "upgrade_reminder_last_sent_at", "INTEGER");
      ensureColumn(db, "session_meta", "upgrade_reminder_count", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 67,
    description: "persist the frozen mural payload with each cached m0 baseline",
    up(db) {
      if (!tableExists2(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "cached_m0_mural_data_url", "TEXT");
      ensureColumn(db, "session_meta", "cached_m0_mural_hash", "TEXT");
    }
  },
  {
    version: 68,
    description: "converge message FTS deletions and same-ID source revisions",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS message_history_source (
                    session_id TEXT NOT NULL,
                    message_id TEXT NOT NULL,
                    message_ordinal INTEGER NOT NULL,
                    source_version TEXT NOT NULL,
                    normalized_content_hash TEXT NOT NULL,
                    role TEXT NOT NULL,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    updated_at INTEGER NOT NULL,
                    PRIMARY KEY(session_id, message_id)
                );
                CREATE INDEX IF NOT EXISTS idx_message_history_source_session_ordinal
                    ON message_history_source(session_id, message_ordinal);

                CREATE TABLE IF NOT EXISTS pending_session_cleanup (
                    session_id TEXT PRIMARY KEY,
                    harness TEXT NOT NULL DEFAULT 'opencode',
                    requested_at INTEGER NOT NULL,
                    last_attempt_at INTEGER
                );

                CREATE TABLE IF NOT EXISTS message_history_orphan_sweep (
                    harness TEXT PRIMARY KEY,
                    cursor_session_id TEXT NOT NULL DEFAULT '',
                    last_swept_at INTEGER
                );
            `);
      if (tableExists2(db, "message_history_index")) {
        const columns = new Set(db.prepare("PRAGMA table_info(message_history_index)").all().map((column) => column.name));
        if (columns.has("session_id") && columns.has("harness") && columns.has("updated_at")) {
          db.exec(`
                        CREATE INDEX IF NOT EXISTS idx_message_history_index_orphan_sweep
                            ON message_history_index(harness, session_id, updated_at);
                    `);
        }
      }
    }
  },
  {
    version: 69,
    description: "index visibility mutation discovery and target loading",
    up(db) {
      if (!tableExists2(db, "memory_mutation_log"))
        return;
      db.exec(`
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_visibility
                    ON memory_mutation_log(project_path, category, id, target_memory_id);
                CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_target
                    ON memory_mutation_log(project_path, target_memory_id, id);
            `);
    }
  },
  {
    version: 70,
    description: "heal legacy compartments stranded by mismatched tier closing tags (issue #246)",
    up(db) {
      healMismatchedTierClose(db, "compartments", true);
      healMismatchedTierClose(db, "recomp_compartments", false);
    }
  },
  {
    version: 71,
    description: "rebuild authority guard triggers to the durable state-table form (issue #253)",
    up(db) {
      installLatestAuthorityTriggers(db);
    }
  },
  {
    version: 72,
    description: "add per-session compaction mode record column (issue #266)",
    up(db) {
      if (tableExists2(db, "session_meta")) {
        ensureColumn(db, "session_meta", "compaction_mode_record", "TEXT");
      }
    }
  },
  {
    version: 73,
    description: "persist the last successful todowrite permission verdict",
    up(db) {
      if (tableExists2(db, "session_meta")) {
        ensureColumn(db, "session_meta", "todo_permission_denied", "INTEGER NOT NULL DEFAULT 2");
      }
    }
  },
  {
    version: 74,
    description: "persist detected context-limit provenance",
    up(db) {
      if (tableExists2(db, "session_meta")) {
        ensureColumn(db, "session_meta", "detected_context_limit_provenance", "TEXT NOT NULL DEFAULT 'unknown'");
      }
    }
  },
  {
    version: 75,
    description: "persist mural cue validation rejection latches",
    up(db) {
      if (!tableExists2(db, "memories"))
        return;
      ensureColumn(db, "memories", "mural_cue_rejection_count", "INTEGER NOT NULL DEFAULT 0");
    }
  },
  {
    version: 76,
    description: "persist retina provider compilation for smart-note conditions",
    up(db) {
      if (!tableExists2(db, "notes"))
        return;
      ensureColumn(db, "notes", "compiled_provider", "TEXT");
      ensureColumn(db, "notes", "compiled_config", "TEXT");
      ensureColumn(db, "notes", "compiled_at", "INTEGER");
      ensureColumn(db, "notes", "compile_status", "TEXT CHECK(compile_status IN ('compiled', 'plain', 'refused'))");
    }
  },
  {
    version: 77,
    description: "persist scoped provenance for promoted user memories and primers",
    up(db) {
      if (tableExists2(db, "user_memories")) {
        ensureColumn(db, "user_memories", "source_candidate_provenance", "TEXT");
      }
      if (tableExists2(db, "primers")) {
        ensureColumn(db, "primers", "source_candidate_provenance", "TEXT");
      }
    }
  },
  {
    version: 78,
    description: "add migration_pending journal for crash-safe cross-harness session migration",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS migration_pending (
                    migration_key TEXT PRIMARY KEY,
                    source_session_id TEXT NOT NULL,
                    target_harness TEXT NOT NULL,
                    pi_session_id TEXT NOT NULL,
                    final_path TEXT NOT NULL,
                    stage_path TEXT NOT NULL,
                    content_sha256 TEXT NOT NULL,
                    phase TEXT NOT NULL CHECK (phase IN ('staged', 'db_committed')),
                    created_at INTEGER NOT NULL
                );
            `);
    }
  },
  {
    version: 79,
    description: "record m[0] system-hash and model-key comparison telemetry",
    up(db) {
      if (!tableExists2(db, "transform_decisions"))
        return;
      ensureColumn(db, "transform_decisions", "system_hash_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "system_hash_new", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_model_key_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_model_key_new", "TEXT");
    }
  },
  {
    version: 80,
    description: "record observed m[0] tool-set hash comparisons",
    up(db) {
      if (!tableExists2(db, "transform_decisions"))
        return;
      ensureColumn(db, "transform_decisions", "m0_tool_set_hash_prev", "TEXT");
      ensureColumn(db, "transform_decisions", "m0_tool_set_hash_new", "TEXT");
    }
  },
  {
    version: 81,
    description: "persist last-known-good transform snapshots across restarts",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS lkg_slots (
                    session_id TEXT PRIMARY KEY,
                    json_prefix TEXT NOT NULL,
                    input_id_seq TEXT NOT NULL,
                    input_content_digests TEXT NOT NULL,
                    input_content_signatures TEXT,
                    last_input_message_id TEXT NOT NULL,
                    model_key TEXT,
                    provider_key TEXT,
                    captured_at INTEGER NOT NULL,
                    row_version INTEGER,
                    capture_sequence INTEGER
                );
            `);
    }
  },
  {
    version: 82,
    description: "record the origin of memory file-independent mappings",
    up(db) {
      if (!tableExists2(db, "memory_verifications"))
        return;
      ensureColumn(db, "memory_verifications", "mapping_origin", "TEXT NOT NULL DEFAULT 'mapper'");
    }
  },
  {
    version: 83,
    description: "add indexed rowid access for message FTS content",
    up(db) {
      db.exec(`
                CREATE TABLE IF NOT EXISTS message_fts_rowid_map (
                    session_id TEXT NOT NULL,
                    message_ordinal INTEGER NOT NULL,
                    fts_rowid INTEGER NOT NULL,
                    PRIMARY KEY(session_id, message_ordinal)
                );

                CREATE TABLE IF NOT EXISTS message_fts_rowid_map_backfill_state (
                    id INTEGER PRIMARY KEY CHECK(id = 1),
                    watermark_rowid INTEGER NOT NULL DEFAULT 0,
                    completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
                    updated_at INTEGER NOT NULL DEFAULT 0
                );
                INSERT OR IGNORE INTO message_fts_rowid_map_backfill_state
                    (id, watermark_rowid, completed, updated_at)
                VALUES (1, 0, 0, 0);
            `);
    }
  },
  {
    version: 84,
    description: "persist protected-token floor state per session",
    up(db) {
      if (!tableExists2(db, "session_meta"))
        return;
      ensureColumn(db, "session_meta", "protected_tokens_effective", "INTEGER");
      ensureColumn(db, "session_meta", "protected_tokens_pre_snapshot", "TEXT");
    }
  },
  {
    version: 85,
    description: "relabel OpenCode 1.x mis-tagged opencode2 session rows",
    up(db) {
      relabelOpenCode2HarnessRows(db);
    }
  }
];
var LATEST_MIGRATION_VERSION = MIGRATIONS.reduce((max, m) => Math.max(max, m.version), 0);
function ensureMigrationsTable(db) {
  db.exec(`
		CREATE TABLE IF NOT EXISTS schema_migrations (
			version INTEGER PRIMARY KEY,
			description TEXT NOT NULL,
			applied_at INTEGER NOT NULL
		)
	`);
}
function getCurrentVersion(db) {
  const row = db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations WHERE version < ?").get(FORK_MIGRATION_VERSION_FLOOR);
  return row?.version ?? 0;
}
function isMigrationApplied(db, version) {
  return db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(version) != null;
}
function isSiblingMigrationConflict(db, error, version) {
  if (!(error instanceof Error))
    return false;
  const msg = error.message;
  if (!msg.includes("schema_migrations"))
    return false;
  if (!msg.toLowerCase().includes("version"))
    return false;
  const confirmed = db.prepare("SELECT 1 FROM schema_migrations WHERE version = ?").get(version);
  return confirmed != null;
}
function runMigrations(db) {
  try {
    ensureMigrationsTable(db);
  } catch (error) {
    if (isSqliteLockError(error)) {
      throw new MigrationLockBusyError(`failed to prepare migration lock: ${error instanceof Error ? error.message : String(error)}`);
    }
    throw error;
  }
  let loggedPlan = false;
  let touchedLegacyAuthorityBatch = false;
  while (true) {
    let migration;
    const migrationState = {};
    let currentVersion = 0;
    try {
      currentVersion = getCurrentVersion(db);
      const pendingMigration = MIGRATIONS.find((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version));
      if (!pendingMigration)
        break;
      migration = undefined;
      const transactionStartedAt = performance.now();
      const applied = db.transaction(() => {
        currentVersion = getCurrentVersion(db);
        migration = MIGRATIONS.find((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version));
        migrationState.value = migration;
        if (!migration)
          return false;
        if (!loggedPlan) {
          const pendingCount = MIGRATIONS.filter((candidate) => candidate.version > currentVersion && !isMigrationApplied(db, candidate.version)).length;
          log(`[migrations] current upstream migration lane: ${currentVersion}, applying ${pendingCount} migration(s)`);
          loggedPlan = true;
        }
        migration.up(db);
        db.prepare("INSERT INTO schema_migrations (version, description, applied_at) VALUES (?, ?, ?)").run(migration.version, migration.description, Date.now());
        return true;
      }).immediate();
      logSlowWriteTransaction("migration-runner", transactionStartedAt);
      migration = migrationState.value;
      if (!applied || !migration)
        break;
      if (migration.version <= 61)
        touchedLegacyAuthorityBatch = true;
      log(`[migrations] applied v${migration.version}: ${migration.description}`);
    } catch (error) {
      if (!migration && isSqliteLockError(error)) {
        throw new MigrationLockBusyError(`failed to acquire migration write lock: ${error instanceof Error ? error.message : String(error)}`);
      }
      if (migration && isSiblingMigrationConflict(db, error, migration.version)) {
        log(`[migrations] v${migration.version} already applied by sibling instance — resuming with re-read version`);
        const reReadVersion = getCurrentVersion(db);
        if (reReadVersion > currentVersion)
          continue;
        throw new Error(`Migration v${migration.version} failed: sibling conflict reported but version did not advance. Database may need manual repair.`);
      }
      const version = migration?.version ?? currentVersion + 1;
      const description = migration?.description ?? "acquire migration write lock";
      log(`[migrations] FAILED v${version}: ${description} — ${error instanceof Error ? error.message : String(error)}`);
      throw new Error(`Migration v${version} failed: ${error instanceof Error ? error.message : String(error)}. Database may need manual repair.`);
    }
  }
  if (touchedLegacyAuthorityBatch) {
    try {
      const transactionStartedAt = performance.now();
      db.transaction(() => installLatestAuthorityTriggers(db)).immediate();
      logSlowWriteTransaction("migration-runner", transactionStartedAt);
    } catch (error) {
      throw new Error(`Migration authority-trigger postcondition failed: ${error instanceof Error ? error.message : String(error)}. Database may need manual repair.`);
    }
  }
  if (loggedPlan) {
    log(`[migrations] upstream migration lane now: ${MIGRATIONS[MIGRATIONS.length - 1].version}`);
  }
}

// ../plugin/src/hooks/magic-context/read-session-formatting.ts
import { createRequire } from "node:module";

// ../plugin/src/shared/commit-detection.ts
var HASH_HEX = "[0-9a-f]{7,12}";
var COMMIT_HASH_TEST_PATTERN = new RegExp(`\\b${HASH_HEX}\\b`, "i");
var COMMIT_VERB_PATTERN = /\b(?:commit(?:ted|ting|s)?|cherry-?pick(?:ed|ing|s)?|merge[ds]?|merging|rebas(?:e|ed|es|ing))\b/i;
function createCommitHashExtractPattern() {
  return new RegExp(`\`?\\b(${HASH_HEX})\\b\`?`, "gi");
}

// ../plugin/src/shared/internal-initiator-marker.ts
var OMO_INTERNAL_INITIATOR_MARKER = "<!-- OMO_INTERNAL_INITIATOR -->";

// ../plugin/src/shared/system-directive.ts
var SYSTEM_DIRECTIVE_PREFIX = "[SYSTEM DIRECTIVE: MAGIC-CONTEXT";
function isSystemDirective(text) {
  return text.trimStart().startsWith(SYSTEM_DIRECTIVE_PREFIX);
}
function removeSystemReminders(text) {
  return text.replace(/<system-reminder>[\s\S]*?<\/system-reminder>/gi, "").trim();
}

// ../plugin/src/hooks/magic-context/read-session-formatting.ts
var MAX_COMMITS_PER_BLOCK = 5;
function hasMeaningfulUserText(parts) {
  for (const part of parts) {
    if (part === null || typeof part !== "object")
      continue;
    const candidate = part;
    if (candidate.type !== "text" || typeof candidate.text !== "string")
      continue;
    if (candidate.ignored === true)
      continue;
    const cleaned = removeSystemReminders(candidate.text).replace(OMO_INTERNAL_INITIATOR_MARKER, "").trim();
    if (!cleaned)
      continue;
    if (isSystemDirective(cleaned))
      continue;
    return true;
  }
  return false;
}
function extractTexts(parts) {
  const texts = [];
  for (const part of parts) {
    if (part === null || typeof part !== "object")
      continue;
    const p = part;
    if (p.type === "text" && typeof p.text === "string" && p.text.trim().length > 0) {
      texts.push(p.text.trim());
    }
  }
  return texts;
}
function extractToolResultBodyTokens(parts) {
  let tokens = 0;
  for (const part of parts) {
    if (part === null || typeof part !== "object")
      continue;
    const p = part;
    if (p.type !== "tool")
      continue;
    const state = p.state;
    if (!state || typeof state !== "object")
      continue;
    const body = state.output ?? state.error;
    if (body === undefined)
      continue;
    const text = typeof body === "string" ? body : JSON.stringify(body);
    tokens += Math.ceil(text.length / 4);
  }
  return tokens;
}
function extractToolCallSummaries(parts) {
  const summaries = [];
  for (const part of parts) {
    if (part === null || typeof part !== "object")
      continue;
    const p = part;
    if (p.type !== "tool" || typeof p.tool !== "string")
      continue;
    const state = p.state;
    if (!state || typeof state !== "object")
      continue;
    const input = state.input;
    const metadata = state.metadata;
    const description = input && typeof input.description === "string" && input.description || metadata && typeof metadata.description === "string" && metadata.description;
    if (description) {
      summaries.push(`TC: ${description}`);
      continue;
    }
    const toolName = p.tool;
    const keyArg = extractKeyArg(toolName, input);
    summaries.push(keyArg ? `TC: ${toolName}(${keyArg})` : `TC: ${toolName}`);
  }
  return summaries;
}
function extractKeyArg(_toolName, input) {
  if (!input)
    return null;
  if (typeof input.filePath === "string")
    return truncateArg(input.filePath);
  if (typeof input.path === "string")
    return truncateArg(input.path);
  if (typeof input.pattern === "string")
    return truncateArg(input.pattern);
  if (typeof input.query === "string")
    return truncateArg(input.query);
  if (typeof input.symbol === "string")
    return input.symbol;
  if (typeof input.module === "string")
    return input.module;
  if (typeof input.action === "string")
    return input.action;
  return null;
}
function truncateArg(value, maxLen = 60) {
  if (value.length <= maxLen)
    return value;
  return `${value.slice(0, maxLen)}…`;
}
var tokenizer;
var tokenizerLoadAttempted = false;
var tokenizerWarningSent = false;
var tokenizerEncodingPath;
var tokenizerSerializedTableBytes;
function constructTokenizer(tokenizerModule, claudeEncoding) {
  const typedModule = tokenizerModule;
  const Tokenizer = typedModule.default ?? typedModule.Tokenizer;
  if (!Tokenizer) {
    throw new Error("ai-tokenizer does not expose a Tokenizer constructor");
  }
  return new Tokenizer(claudeEncoding);
}
function loadTokenizer() {
  const requireFromThisModule = createRequire(import.meta.url);
  const encodingSpecifier = "ai-tokenizer/encoding/" + "claude";
  tokenizerEncodingPath = requireFromThisModule.resolve(encodingSpecifier);
  tokenizerSerializedTableBytes = undefined;
  return constructTokenizer(requireFromThisModule("ai-" + "tokenizer"), requireFromThisModule(encodingSpecifier));
}
function warnTokenizerFallback(error) {
  if (tokenizerWarningSent)
    return;
  tokenizerWarningSent = true;
  const reason = error instanceof Error ? error.message : String(error);
  console.warn("[magic-context] ai-tokenizer is unavailable; using approximate character-based token counts for this process. Token budgets, persisted per-message counts, and protected-tail/compartment boundaries may be less accurate until restart:", reason);
}
function getTokenizer() {
  if (tokenizer || tokenizerLoadAttempted)
    return tokenizer;
  tokenizerLoadAttempted = true;
  try {
    tokenizer = loadTokenizer();
  } catch (error) {
    warnTokenizerFallback(error);
  }
  return tokenizer;
}
function estimateTokensHeuristically(text) {
  return Math.ceil(text.length / 3.5);
}
function estimateTokens(text) {
  if (!text)
    return 0;
  const activeTokenizer = getTokenizer();
  if (!activeTokenizer)
    return estimateTokensHeuristically(text);
  try {
    return activeTokenizer.encode(text, "all").length;
  } catch (error) {
    tokenizer = undefined;
    tokenizerLoadAttempted = true;
    warnTokenizerFallback(error);
    return estimateTokensHeuristically(text);
  }
}
function normalizeText(text) {
  return text.replace(/\s+/g, " ").trim();
}
function compactRole(role) {
  if (role === "assistant")
    return "A";
  if (role === "user")
    return "U";
  return role.slice(0, 1).toUpperCase() || "M";
}
function formatBlock(block) {
  const range = block.startOrdinal === block.endOrdinal ? `[${block.startOrdinal}]` : `[${block.startOrdinal}-${block.endOrdinal}]`;
  const commitSuffix = block.commitHashes.length > 0 ? ` commits: ${block.commitHashes.join(", ")}` : "";
  return `${range} ${block.role}:${commitSuffix} ${block.parts.join(" / ")}`;
}
function extractCommitHashes(text) {
  const hashes = [];
  const seen = new Set;
  for (const match of text.matchAll(createCommitHashExtractPattern())) {
    const hash = match[1]?.toLowerCase();
    if (!hash || seen.has(hash))
      continue;
    seen.add(hash);
    hashes.push(hash);
    if (hashes.length >= MAX_COMMITS_PER_BLOCK)
      break;
  }
  return hashes;
}
function compactTextForSummary(text, role) {
  const commitHashes = role === "assistant" ? extractCommitHashes(text) : [];
  if (commitHashes.length === 0 || !COMMIT_VERB_PATTERN.test(text)) {
    return { text, commitHashes };
  }
  const withoutHashes = text.replace(createCommitHashExtractPattern(), "").replace(/\(\s*\)/g, "").replace(/\s+,/g, ",").replace(/,\s*,+/g, ", ").replace(/\s{2,}/g, " ").replace(/\s+([,.;:])/g, "$1").trim();
  return {
    text: withoutHashes.length > 0 ? withoutHashes : text,
    commitHashes
  };
}
function mergeCommitHashes(existing, next) {
  if (next.length === 0)
    return existing;
  const merged = [...existing];
  for (const hash of next) {
    if (merged.includes(hash))
      continue;
    merged.push(hash);
    if (merged.length >= MAX_COMMITS_PER_BLOCK)
      break;
  }
  return merged;
}

// ../plugin/src/shared/stable-json.ts
function stableStringify(value, seen = new WeakSet) {
  if (value === undefined)
    return "undefined";
  if (value === null || typeof value !== "object")
    return JSON.stringify(value) ?? String(value);
  if (seen.has(value))
    return '"[Circular]"';
  seen.add(value);
  if (Array.isArray(value)) {
    return `[${value.map((item) => stableStringify(item, seen)).join(",")}]`;
  }
  const entries = Object.entries(value).sort(([a], [b]) => {
    if (a < b)
      return -1;
    if (a > b)
      return 1;
    return 0;
  });
  return `{${entries.map(([key, child]) => `${JSON.stringify(key)}:${stableStringify(child, seen)}`).join(",")}}`;
}

// ../plugin/src/features/magic-context/tool-definition-tokens.ts
var measurements = new Map;
var fingerprints = new Map;
var persistenceDb = null;
var cachedInsertStmt = null;
function keyFor(providerID, modelID, agentName) {
  const agent = agentName && agentName.length > 0 ? agentName : "default";
  return `${providerID}/${modelID}/${agent}`;
}
function setDatabase(db) {
  persistenceDb = db;
  cachedInsertStmt = null;
}
function loadToolDefinitionMeasurements(db) {
  let rows = [];
  try {
    rows = db.prepare("SELECT provider_id, model_id, agent_name, tool_id, token_count FROM tool_definition_measurements").all();
  } catch {
    return;
  }
  for (const row of rows) {
    const key = keyFor(row.provider_id, row.model_id, row.agent_name);
    let inner = measurements.get(key);
    if (!inner) {
      inner = new Map;
      measurements.set(key, inner);
    }
    inner.set(row.tool_id, row.token_count);
  }
}

// ../plugin/src/features/magic-context/tool-owner-backfill.ts
import { existsSync as existsSync4 } from "node:fs";

// ../plugin/src/shared/opencode-db-path.ts
import { existsSync as existsSync3, readdirSync, statSync as statSync3 } from "node:fs";
import { homedir as homedir5 } from "node:os";
import { isAbsolute as isAbsolute3, join as join3 } from "node:path";
var cachedResolution = null;
var lastReadFailure = null;
var claimedDiagnostics = new Set;
function openCodeDataDir(env = process.env, dataHome) {
  return join3(dataHome ?? env.XDG_DATA_HOME ?? join3(homedir5(), ".local", "share"), "opencode");
}
function environmentKey(dataDir, hostGeneration, channel, env) {
  return [
    hostGeneration,
    dataDir,
    env.OPENCODE_DB ?? "",
    env.OPENCODE_DISABLE_CHANNEL_DB ?? "",
    channel ?? env.OPENCODE_CHANNEL ?? ""
  ].join("\x00");
}
function channelPath(dataDir, channel) {
  return ["latest", "beta", "prod"].includes(channel) ? join3(dataDir, "opencode.db") : join3(dataDir, `opencode-${channel}.db`);
}
function discoveredCandidateNames(dataDir) {
  const names = ["opencode.db", "opencode-local.db", "opencode-dev.db"];
  try {
    const discovered = readdirSync(dataDir, { withFileTypes: true }).filter((entry) => /^opencode-.+\.db$/.test(entry.name) && !names.includes(entry.name)).map((entry) => entry.name).sort();
    names.push(...discovered);
  } catch {}
  return names;
}
function discoverOpenCodeDb(dataDir) {
  const candidates = discoveredCandidateNames(dataDir).map((name, order) => {
    const path = join3(dataDir, name);
    try {
      const metadata = statSync3(path);
      return metadata.isFile() ? { path, order, mtimeMs: metadata.mtimeMs } : null;
    } catch {
      return null;
    }
  });
  const existing = candidates.filter((candidate) => candidate !== null).sort((left, right) => right.mtimeMs - left.mtimeMs || left.order - right.order)[0];
  if (!existing) {
    return { path: join3(dataDir, "opencode.db"), source: "default", channel: null };
  }
  const name = existing.path.slice(dataDir.length + 1);
  const channel = name === "opencode.db" ? null : name.slice("opencode-".length, -".db".length) || null;
  return { path: existing.path, source: "discovered", channel };
}
function resolveV1Fresh(dataDir, env = process.env) {
  const explicit = env.OPENCODE_DB;
  if (explicit !== undefined && explicit.length > 0) {
    if (explicit === ":memory:") {
      return { path: explicit, source: "OPENCODE_DB", channel: null };
    }
    return {
      path: isAbsolute3(explicit) ? explicit : join3(dataDir, explicit),
      source: "OPENCODE_DB",
      channel: null
    };
  }
  const disableChannelDb = env.OPENCODE_DISABLE_CHANNEL_DB;
  if (disableChannelDb === "1" || disableChannelDb === "true") {
    return { path: join3(dataDir, "opencode.db"), source: "default", channel: null };
  }
  const channel = env.OPENCODE_CHANNEL;
  if (channel !== undefined && channel.length > 0) {
    return { path: channelPath(dataDir, channel), source: "channel", channel };
  }
  return discoverOpenCodeDb(dataDir);
}
function sourceOpenCodeDatabaseFilename(hostGeneration, channel, env = process.env) {
  if (hostGeneration === "v1") {
    const explicit = env.OPENCODE_DB;
    if (explicit !== undefined && explicit.length > 0)
      return explicit;
    if (env.OPENCODE_DISABLE_CHANNEL_DB === "1" || env.OPENCODE_DISABLE_CHANNEL_DB === "true") {
      return "opencode.db";
    }
    return ["latest", "beta", "prod"].includes(channel) ? "opencode.db" : `opencode-${channel}.db`;
  }
  return env.OPENCODE_DB ?? (["latest", "dev", "beta", "next", "prod"].includes(channel) || env.OPENCODE_DISABLE_CHANNEL_DB === "1" || env.OPENCODE_DISABLE_CHANNEL_DB === "true" ? "opencode.db" : `opencode-${channel.replace(/[^a-zA-Z0-9._-]/g, "")}.db`);
}
function resolveV2Fresh(dataDir, channel, env) {
  const filename = sourceOpenCodeDatabaseFilename("v2", channel, env);
  const explicit = env.OPENCODE_DB !== undefined;
  return {
    path: filename === ":memory:" ? filename : join3(dataDir, filename),
    source: explicit ? "OPENCODE_DB" : env.OPENCODE_CHANNEL ? "channel" : "default",
    channel: explicit ? null : channel
  };
}
function resolveOpenCodeDbPath(hostGeneration = "v1", options = {}) {
  const env = options.env ?? process.env;
  const dataDir = openCodeDataDir(env, options.dataHome);
  const channel = options.channel ?? env.OPENCODE_CHANNEL;
  const key = environmentKey(dataDir, hostGeneration, channel, env);
  if (cachedResolution?.key === key && (!cachedResolution.existed || existsSync3(cachedResolution.resolution.path))) {
    if (cachedResolution.existed)
      return cachedResolution.resolution;
  }
  const resolution = hostGeneration === "v2" ? resolveV2Fresh(dataDir, channel ?? "latest", env) : resolveV1Fresh(dataDir, env);
  cachedResolution = {
    key,
    resolution,
    existed: resolution.path !== ":memory:" && existsSync3(resolution.path)
  };
  return resolution;
}
function schemaTableNames(db, schema = "main") {
  const rows = db.prepare(`SELECT name FROM ${schema}.sqlite_master WHERE type = 'table' AND name IN ('message', 'part', 'session', 'project', 'session_message')`).all();
  return new Set(rows.flatMap((row) => typeof row.name === "string" ? [row.name] : []));
}
function detectOpenCodeStoreGeneration(db, schema = "main") {
  const tables = schemaTableNames(db, schema);
  const hasV1Messages = tables.has("message") && tables.has("part");
  if (hasV1Messages)
    return "v1";
  if (tables.has("session_message"))
    return "v2";
  if (tables.has("session") || tables.has("project"))
    return "v1";
  return "unknown";
}
function assertOpenCodeStoreGeneration(db, expected, path, schema = "main") {
  const actual = detectOpenCodeStoreGeneration(db, schema);
  if (actual === expected)
    return;
  if (actual === "unknown")
    return;
  throw new Error(`OpenCode store generation mismatch at ${path}: expected ${expected}, found ${actual}; refusing generation-specific database access`);
}
function openCodeDbPathExists(resolution = resolveOpenCodeDbPath()) {
  return resolution.path !== ":memory:" && existsSync3(resolution.path);
}
function getOpenCodeDbProbeDescriptions(resolution = resolveOpenCodeDbPath()) {
  if (resolution.source === "OPENCODE_DB")
    return [resolution.path];
  if (resolution.source === "channel" || process.env.OPENCODE_DISABLE_CHANNEL_DB === "1" || process.env.OPENCODE_DISABLE_CHANNEL_DB === "true") {
    return [resolution.path];
  }
  const dataDir = openCodeDataDir();
  return [
    join3(dataDir, "opencode.db"),
    join3(dataDir, "opencode-local.db"),
    join3(dataDir, "opencode-dev.db"),
    join3(dataDir, "opencode-<channel>.db")
  ];
}
function lookedForText(resolution) {
  return getOpenCodeDbProbeDescriptions(resolution).join(", ");
}
function formatOpenCodeDbMissingStatusLine(resolution = resolveOpenCodeDbPath()) {
  return `OpenCode DB: MISSING (looked for ${lookedForText(resolution)}). History compaction (historian) and the mid-turn valve are disabled; set OPENCODE_DB if OpenCode stores it elsewhere.`;
}
function formatOpenCodeDbReadFailureStatusLine(failure) {
  return `OpenCode DB: READ FAILED (path=${failure.path}, source=${failure.source}) — ${failure.message}`;
}
function recordOpenCodeDbReadFailure(resolution, error) {
  const message = error instanceof Error ? error.message : String(error);
  lastReadFailure = { ...resolution, message };
  return lastReadFailure;
}
function clearOpenCodeDbReadFailure(path) {
  if (path === undefined || lastReadFailure?.path === path)
    lastReadFailure = null;
}
function getOpenCodeDbReadFailure() {
  return lastReadFailure;
}
function claimOpenCodeDbDiagnosticOnce(surface, resolution) {
  const key = `${surface}\x00${resolution.path}\x00${resolution.source}`;
  if (claimedDiagnostics.has(key))
    return false;
  claimedDiagnostics.add(key);
  return true;
}

// ../plugin/src/features/magic-context/tool-owner-backfill.ts
var LEASE_DURATION_MS = 5 * 60 * 1000;
var LEASE_RENEWAL_MS = 60 * 1000;
function resolveOpencodeDbPath() {
  return resolveOpenCodeDbPath().path;
}
function ensureBackfillStateTable(db) {
  db.exec(`
        CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
            session_id TEXT PRIMARY KEY,
            status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
            started_at INTEGER,
            lease_expires_at INTEGER,
            completed_at INTEGER,
            last_error TEXT
        );
        CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
        ON tool_owner_backfill_state(status);
    `);
}
function runToolOwnerBackfill(db) {
  const startedAt = performance.now();
  ensureBackfillStateTable(db);
  const result = {
    sessionsProcessed: 0,
    sessionsSkippedNoOcDb: 0,
    sessionsSkippedNoMatches: 0,
    sessionsCompleted: 0,
    sessionsBlockedByLease: 0,
    sessionsErrored: 0,
    rowsUpdated: 0,
    rowsLeftNull: 0,
    durationMs: 0
  };
  if (!isToolOwnerBackfillNeeded(db)) {
    result.durationMs = performance.now() - startedAt;
    return result;
  }
  const opencodeDbPath = resolveOpencodeDbPath();
  if (!existsSync4(opencodeDbPath)) {
    log(`[backfill] OpenCode DB not found at ${opencodeDbPath} — marking all unbackfilled sessions as skipped. Lazy adoption (defense-in-depth) handles legacy rows at runtime.`);
    markAllUnbackfilledSessionsSkipped(db);
    result.sessionsSkippedNoOcDb = countSessionsByStatus(db, "skipped");
    result.durationMs = performance.now() - startedAt;
    return result;
  }
  const escapedDbPath = opencodeDbPath.replaceAll("'", "''");
  db.exec(`ATTACH '${escapedDbPath}' AS oc_backfill`);
  try {
    assertOpenCodeStoreGeneration(db, "v1", opencodeDbPath, "oc_backfill");
    backfillToolOwnersInChunks(db, result);
  } finally {
    try {
      db.exec("DETACH DATABASE oc_backfill");
    } catch (error) {
      log(`[backfill] failed to detach oc_backfill database: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
  result.durationMs = performance.now() - startedAt;
  log(`[backfill] sessions=${result.sessionsProcessed} completed=${result.sessionsCompleted} skipped_no_oc=${result.sessionsSkippedNoOcDb} skipped_no_matches=${result.sessionsSkippedNoMatches} blocked_by_lease=${result.sessionsBlockedByLease} errored=${result.sessionsErrored} rows_updated=${result.rowsUpdated} rows_left_null=${result.rowsLeftNull} duration_ms=${Math.round(result.durationMs)}`);
  return result;
}
function isToolOwnerBackfillNeeded(db) {
  ensureBackfillStateTable(db);
  const row = db.prepare(`SELECT 1 AS hit
             FROM tags
             WHERE type = 'tool' AND tool_owner_message_id IS NULL
               AND NOT EXISTS (
                   SELECT 1 FROM tool_owner_backfill_state s
                   WHERE s.session_id = tags.session_id
                     AND s.status IN ('completed', 'skipped')
               )
             LIMIT 1`).get();
  return row !== null && row !== undefined;
}
function markAllUnbackfilledSessionsSkipped(db) {
  const now = Date.now();
  db.prepare(`INSERT INTO tool_owner_backfill_state(session_id, status, started_at, completed_at, last_error)
         SELECT DISTINCT session_id, 'skipped', NULL, ?, NULL
         FROM tags
         WHERE type = 'tool' AND tool_owner_message_id IS NULL
         ON CONFLICT(session_id) DO UPDATE SET
             status = 'skipped',
             completed_at = excluded.completed_at,
             last_error = NULL
         WHERE tool_owner_backfill_state.status NOT IN ('completed', 'running')`).run(now);
}
function countSessionsByStatus(db, status) {
  const row = db.prepare("SELECT COUNT(*) AS c FROM tool_owner_backfill_state WHERE status = ?").get(status);
  return row.c;
}
function acquireSessionLease(db, sessionId, now) {
  const expiresAt = now + LEASE_DURATION_MS;
  const result = db.prepare(`INSERT INTO tool_owner_backfill_state(session_id, status, started_at, lease_expires_at)
             SELECT ?, 'running', ?, ?
             WHERE EXISTS (SELECT 1 FROM tags WHERE session_id = ?)
             ON CONFLICT(session_id) DO UPDATE SET
                 status = 'running',
                 started_at = excluded.started_at,
                 lease_expires_at = excluded.lease_expires_at,
                 last_error = NULL
             WHERE tool_owner_backfill_state.status IN ('pending', 'skipped')
                OR (tool_owner_backfill_state.status = 'running'
                    AND tool_owner_backfill_state.lease_expires_at < ?)`).run(sessionId, now, expiresAt, sessionId, now);
  return (result.changes ?? 0) === 1;
}
function renewSessionLease(db, sessionId, now) {
  const expiresAt = now + LEASE_DURATION_MS;
  db.prepare(`UPDATE tool_owner_backfill_state
         SET lease_expires_at = ?
         WHERE session_id = ? AND status = 'running'`).run(expiresAt, sessionId);
}
function markSessionCompleted(db, sessionId, now) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'completed', completed_at = ?, lease_expires_at = NULL, last_error = NULL
         WHERE session_id = ?`).run(now, sessionId);
}
function markSessionPendingRetry(db, sessionId) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'pending', completed_at = NULL, lease_expires_at = NULL, last_error = NULL
         WHERE session_id = ?`).run(sessionId);
}
function markSessionSkipped(db, sessionId, now, reason) {
  db.prepare(`UPDATE tool_owner_backfill_state
         SET status = 'skipped', completed_at = ?, last_error = ?, lease_expires_at = NULL
         WHERE session_id = ? AND status = 'running'`).run(now, reason, sessionId);
}
function markSessionErrored(db, sessionId, error) {
  const message = error instanceof Error ? error.message : String(error);
  db.prepare(`UPDATE tool_owner_backfill_state
         SET last_error = ?, lease_expires_at = NULL
         WHERE session_id = ?`).run(message, sessionId);
}
function getSessionsNeedingBackfill(db) {
  const rows = db.prepare(`SELECT DISTINCT t.session_id
             FROM tags t
             LEFT JOIN tool_owner_backfill_state s ON s.session_id = t.session_id
             WHERE t.type = 'tool' AND t.tool_owner_message_id IS NULL
               AND (s.status IS NULL OR s.status NOT IN ('completed', 'skipped'))
             ORDER BY t.session_id ASC`).all();
  return rows.map((r) => r.session_id);
}
function buildSessionOwnerMap(db, sessionId) {
  const rows = db.prepare(`SELECT
                COALESCE(
                    CASE WHEN json_extract(p.data, '$.type') = 'tool_use'
                        THEN json_extract(p.data, '$.id')
                    END,
                    json_extract(p.data, '$.callID')
                ) AS callid,
                m.id AS owner_id,
                m.time_created AS owner_t_created,
                p.id AS part_id,
                p.time_created AS part_t_created
             FROM oc_backfill.message m
             INNER JOIN oc_backfill.part p ON p.message_id = m.id
             WHERE m.session_id = ?
               AND json_extract(m.data, '$.role') = 'assistant'
               AND (
                   (json_extract(p.data, '$.type') IN ('tool', 'tool-invocation')
                       AND json_extract(p.data, '$.callID') IS NOT NULL)
                   OR (json_extract(p.data, '$.type') = 'tool_use'
                       AND json_extract(p.data, '$.id') IS NOT NULL)
               )
             ORDER BY
                 m.time_created ASC,
                 m.id ASC,
                 p.time_created ASC,
                 p.id ASC`).all(sessionId);
  const oldestByCallId = new Map;
  for (const r of rows) {
    if (typeof r.callid !== "string" || r.callid.length === 0)
      continue;
    if (!oldestByCallId.has(r.callid)) {
      oldestByCallId.set(r.callid, r.owner_id);
    }
  }
  return oldestByCallId;
}
function applyOwnersForSession(db, sessionId, ownersByCallId) {
  if (ownersByCallId.size === 0) {
    const leftNull = db.prepare(`SELECT COUNT(*) AS c FROM tags
                     WHERE session_id = ? AND type = 'tool'
                       AND tool_owner_message_id IS NULL`).get(sessionId).c;
    return { rowsUpdated: 0, rowsLeftNull: leftNull };
  }
  const findOrphanStmt = db.prepare(`SELECT id FROM tags
         WHERE session_id = ? AND message_id = ? AND type = 'tool'
           AND tool_owner_message_id IS NULL
         ORDER BY tag_number ASC
         LIMIT 1`);
  const updateRowStmt = db.prepare(`UPDATE tags
         SET tool_owner_message_id = ?
         WHERE id = ? AND tool_owner_message_id IS NULL`);
  const existingOwnerStmt = db.prepare(`SELECT 1 AS hit FROM tags
         WHERE session_id = ? AND message_id = ? AND type = 'tool'
           AND tool_owner_message_id = ?
         LIMIT 1`);
  let rowsUpdated = 0;
  db.transaction(() => {
    for (const [callId, ownerId] of ownersByCallId) {
      const orphan = findOrphanStmt.get(sessionId, callId);
      if (!orphan)
        continue;
      if (existingOwnerStmt.get(sessionId, callId, ownerId))
        continue;
      const result = updateRowStmt.run(ownerId, orphan.id);
      rowsUpdated += result.changes ?? 0;
    }
  }).immediate();
  const rowsLeftNull = db.prepare(`SELECT COUNT(*) AS c FROM tags
                 WHERE session_id = ? AND type = 'tool'
                   AND tool_owner_message_id IS NULL`).get(sessionId).c;
  return { rowsUpdated, rowsLeftNull };
}
function backfillToolOwnersInChunks(db, result) {
  const sessionIds = getSessionsNeedingBackfill(db);
  let lastRenewedAt = Date.now();
  for (const sessionId of sessionIds) {
    const now = Date.now();
    result.sessionsProcessed += 1;
    const acquired = acquireSessionLease(db, sessionId, now);
    if (!acquired) {
      result.sessionsBlockedByLease += 1;
      continue;
    }
    try {
      const owners = buildSessionOwnerMap(db, sessionId);
      const { rowsUpdated, rowsLeftNull } = applyOwnersForSession(db, sessionId, owners);
      result.rowsUpdated += rowsUpdated;
      result.rowsLeftNull += rowsLeftNull;
      if (owners.size === 0) {
        markSessionSkipped(db, sessionId, Date.now(), "no_oc_matches");
        result.sessionsSkippedNoMatches += 1;
      } else if (rowsLeftNull > 0) {
        markSessionPendingRetry(db, sessionId);
      } else {
        markSessionCompleted(db, sessionId, Date.now());
        result.sessionsCompleted += 1;
      }
    } catch (error) {
      log(`[backfill] session=${sessionId} errored: ${error instanceof Error ? error.message : String(error)}`);
      markSessionErrored(db, sessionId, error);
      result.sessionsErrored += 1;
    }
    const sinceRenew = Date.now() - lastRenewedAt;
    if (sinceRenew > LEASE_RENEWAL_MS) {
      renewSessionLease(db, sessionId, Date.now());
      lastRenewedAt = Date.now();
    }
  }
}

// ../plugin/src/features/magic-context/storage-db.ts
registerSlowWriteReporter(logSlowWriteTransaction);
var databases = new Map;
var pendingAsyncOpens = new Map;
var persistenceByDatabase = new WeakMap;
var persistenceErrorByDatabase = new WeakMap;
var pathByDatabase = new WeakMap;
var lastSchemaFenceRejection = null;
var lastMigrationOnOpenRefusal = null;
function getSchemaFenceRejection() {
  return lastSchemaFenceRejection;
}
var LATEST_SUPPORTED_VERSION = 85;
var BOOT_SQLITE_BUSY_TIMEOUT_MS = 5000;
var PERMISSIONS_ENFORCEABLE = process.platform !== "win32";
var defaultStoragePermissionFs = { chmodSync: chmodSync2, mkdirSync: mkdirSync3 };
var storagePermissionFs = defaultStoragePermissionFs;
function ensureSecureStorageDir(dir) {
  if (!shouldEnforcePrivateStoragePermissions()) {
    storagePermissionFs.mkdirSync(dir, { recursive: true });
    return;
  }
  storagePermissionFs.mkdirSync(dir, { recursive: true, mode: 448 });
  if (!PERMISSIONS_ENFORCEABLE)
    return;
  try {
    storagePermissionFs.chmodSync(dir, 448);
  } catch (error) {
    log(`[magic-context] could not restrict storage dir permissions on ${dir}: ${getErrorMessage(error)}`);
  }
}
function restrictDatabaseFilePermissions(dbPath) {
  if (!PERMISSIONS_ENFORCEABLE || !shouldEnforcePrivateStoragePermissions())
    return;
  for (const suffix of ["", "-wal", "-shm"]) {
    const file = `${dbPath}${suffix}`;
    if (!existsSync5(file))
      continue;
    try {
      storagePermissionFs.chmodSync(file, 384);
    } catch (error) {
      log(`[magic-context] could not restrict DB file permissions on ${file}: ${getErrorMessage(error)}`);
    }
  }
}
function resolveBootBusyTimeoutMs(value) {
  if (value === undefined)
    return BOOT_SQLITE_BUSY_TIMEOUT_MS;
  if (!Number.isFinite(value))
    return BOOT_SQLITE_BUSY_TIMEOUT_MS;
  return Math.max(0, Math.min(BOOT_SQLITE_BUSY_TIMEOUT_MS, Math.floor(value)));
}
function installBootBusyTimeout(db, dbPath, timeoutMs, report = log) {
  db.exec(`PRAGMA busy_timeout=${timeoutMs}`);
  report(`[magic-context] SQLite boot busy timeout: backend=${detectSqliteRuntime()} timeout=${timeoutMs}ms path=${dbPath}`);
}
function resolveDatabasePath(dbPathOverride) {
  if (dbPathOverride) {
    return { dbDir: dirname3(dbPathOverride), dbPath: dbPathOverride };
  }
  const dbDir = getMagicContextStorageDir();
  return { dbDir, dbPath: join4(dbDir, "context.db") };
}
function migrateLegacyStorageIfNeeded(targetDbPath, targetDbDir) {
  if (existsSync5(targetDbPath))
    return;
  const legacyDir = getLegacyOpenCodeMagicContextStorageDir();
  const legacyDbPath = join4(legacyDir, "context.db");
  if (!existsSync5(legacyDbPath))
    return;
  log(`[magic-context] migrating legacy plugin storage: ${legacyDir} -> ${targetDbDir} (legacy left in place as backup)`);
  ensureSecureStorageDir(targetDbDir);
  try {
    const legacyDb = new Database(legacyDbPath);
    try {
      legacyDb.exec("PRAGMA wal_checkpoint(TRUNCATE)");
    } finally {
      closeQuietly(legacyDb);
    }
  } catch (error) {
    log(`[magic-context] legacy WAL checkpoint before copy failed (continuing with sidecar copy): ${getErrorMessage(error)}`);
  }
  for (const suffix of ["", "-wal", "-shm"]) {
    const src = `${legacyDbPath}${suffix}`;
    const dst = join4(targetDbDir, `context.db${suffix}`);
    if (existsSync5(src)) {
      try {
        copyFileSync(src, dst);
      } catch (error) {
        log(`[magic-context] failed to copy ${src}:`, getErrorMessage(error));
      }
    }
  }
  const legacyModelsDir = join4(legacyDir, "models");
  const targetModelsDir = join4(targetDbDir, "models");
  if (existsSync5(legacyModelsDir) && !existsSync5(targetModelsDir)) {
    try {
      cpSync(legacyModelsDir, targetModelsDir, { recursive: true });
    } catch (error) {
      log("[magic-context] failed to copy embedding model cache:", getErrorMessage(error));
    }
  }
}
function getPersistedSchemaVersion(db) {
  const hasMigrationsTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'schema_migrations'").get();
  if (!hasMigrationsTable) {
    return 0;
  }
  const row = db.prepare("SELECT COALESCE(MAX(version), 0) AS version FROM schema_migrations WHERE version < ?").get(FORK_MIGRATION_VERSION_FLOOR);
  return row?.version ?? 0;
}
function formatSchemaFenceBootLog(persistedVersion, supportedVersion) {
  return `[magic-context] upstream migration lane at boot: database=v${persistedVersion}, supported_fence=v${supportedVersion}`;
}
function getRuntimeLatestSupportedVersion(options) {
  if (options?.latestSupportedVersion !== undefined) {
    return options.latestSupportedVersion;
  }
  const override = process.env.MAGIC_CONTEXT_LATEST_SUPPORTED_VERSION;
  if (override) {
    const parsed = Number.parseInt(override, 10);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }
  return LATEST_SUPPORTED_VERSION;
}
function enforceSchemaFence(db, dbPath, latestSupportedVersion) {
  const persistedVersion = getPersistedSchemaVersion(db);
  if (persistedVersion <= latestSupportedVersion) {
    lastSchemaFenceRejection = null;
    return true;
  }
  lastSchemaFenceRejection = { persistedVersion, supportedVersion: latestSupportedVersion };
  log(`[magic-context] storage fatal: refusing to open ${dbPath}; upstream migration lane v${persistedVersion} is newer than this binary supports (max v${latestSupportedVersion}). A pinned or stale plugin is likely sharing this database with a newer instance; update or unpin Magic Context with 'npx @cortexkit/magic-context@latest doctor --force', then restart.`);
  return false;
}
function unreadableDiscovery(path, arm) {
  return {
    state: "unreadable",
    serverPids: [],
    staleFiles: [],
    unreadableFile: path,
    unreadableArm: arm
  };
}
var RPC_DISCOVERY_PARSE_GRACE_MS = 10 * 60 * 1000;
var defaultRpcDiscoveryFs = {
  readdirSync: (path, options) => options?.withFileTypes ? readdirSync2(path, { withFileTypes: true }) : readdirSync2(path),
  readFileSync: (path, encoding) => String(readFileSync3(path, encoding)),
  statSync: (path) => ({ mtimeMs: statSync4(path).mtimeMs }),
  unlinkSync: (path) => unlinkSync(path)
};
var rpcDiscoveryFs = defaultRpcDiscoveryFs;
function invalidDiscoveryReason(raw) {
  const trimmed = raw.trim();
  if (trimmed.startsWith("{")) {
    try {
      const parsed = JSON.parse(trimmed);
      if ("pid" in parsed) {
        const pid = Number(parsed.pid);
        if (!Number.isInteger(pid) || pid <= 0)
          return "invalid-pid";
      }
    } catch {}
  }
  return "parse-invalid";
}
function classifyDiscoveryRecordKind(record) {
  for (const value of [record.kind, record.harness]) {
    const normalized = value?.trim().toLowerCase();
    if (!normalized)
      continue;
    if (normalized === "process")
      return "process";
    if (normalized === "opencode server" || normalized === "server") {
      return "OpenCode server";
    }
    if (normalized === "opencode instance" || normalized === "opencode instance (tui/cli)" || normalized === "opencode" || normalized === "tui" || normalized === "cli") {
      return "OpenCode instance (TUI/CLI)";
    }
    if (normalized === "pi" || normalized === "pi harness" || normalized === "omp" || normalized === "oh-my-pi") {
      return "Pi";
    }
  }
  return null;
}
function classifyRpcProcess(record, commandLine) {
  return classifyDiscoveryRecordKind(record) ?? classifyProcessKind(commandLine === undefined ? readProcessProbeEvidence(record.pid).commandLine : commandLine);
}
function classifyJunkDiscovery(portFile, raw, staleFiles) {
  let mtimeMs;
  try {
    mtimeMs = rpcDiscoveryFs.statSync(portFile).mtimeMs;
  } catch (error) {
    if (error.code === "ENOENT")
      return null;
    return unreadableDiscovery(portFile, "io");
  }
  const ageMs = Date.now() - mtimeMs;
  if (!Number.isFinite(ageMs) || ageMs < RPC_DISCOVERY_PARSE_GRACE_MS) {
    return unreadableDiscovery(portFile, "parse");
  }
  staleFiles.push(portFile);
  const reason = invalidDiscoveryReason(raw);
  log(`[magic-context] removing stale RPC discovery file ${portFile}: ${reason} record older than 10 minutes`);
  return null;
}
function inspectRpcServerDiscovery(storageDir) {
  const rpcRoot = join4(storageDir, "rpc");
  let projectEntries;
  try {
    projectEntries = rpcDiscoveryFs.readdirSync(rpcRoot, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") {
      return { state: "absent", serverPids: [], staleFiles: [] };
    }
    return unreadableDiscovery(rpcRoot, "io");
  }
  const portFiles = [];
  for (const projectEntry of projectEntries) {
    if (!projectEntry.isDirectory())
      continue;
    const projectDir = join4(rpcRoot, projectEntry.name);
    let entries;
    try {
      entries = rpcDiscoveryFs.readdirSync(projectDir);
    } catch (error) {
      if (error.code === "ENOENT")
        continue;
      return unreadableDiscovery(projectDir, "io");
    }
    for (const entry of entries) {
      if (entry === "port" || entry.startsWith("port-") && entry.endsWith(".json")) {
        portFiles.push(join4(projectDir, entry));
      }
    }
  }
  if (portFiles.length === 0) {
    return { state: "absent", serverPids: [], staleFiles: [] };
  }
  const pids = new Set;
  const processByPid = new Map;
  const staleFiles = [];
  const inconclusivePids = new Set;
  for (const portFile of portFiles) {
    let raw;
    try {
      raw = rpcDiscoveryFs.readFileSync(portFile, "utf8");
    } catch (error) {
      if (error.code === "ENOENT")
        continue;
      return unreadableDiscovery(portFile, "io");
    }
    const filename = basename2(portFile);
    const pidFromName = /^port-(\d+)/.exec(filename)?.[1];
    const fallbackPid = pidFromName ? Number(pidFromName) : 0;
    const record = parseRpcPortFile(raw, fallbackPid);
    if (!record || !Number.isInteger(record.pid) || record.pid <= 0) {
      const junk = classifyJunkDiscovery(portFile, raw, staleFiles);
      if (junk)
        return junk;
      continue;
    }
    const liveness = isPidAlive(record.pid);
    if (liveness === "dead") {
      staleFiles.push(portFile);
      continue;
    }
    const evidence = readProcessProbeEvidence(record.pid);
    const identity = isPidIdentityPlausible(record, evidence);
    if (identity === "plausible") {
      pids.add(record.pid);
      const detected = attachFailClosedBlockingProcessEvidence({
        kind: classifyRpcProcess(record, evidence.commandLine),
        pid: record.pid
      }, evidence);
      const previous = processByPid.get(record.pid);
      if (!previous || previous.kind === "process" && detected.kind !== "process") {
        processByPid.set(record.pid, detected);
      }
    } else if (identity === "implausible") {
      staleFiles.push(portFile);
    } else {
      inconclusivePids.add(record.pid);
    }
  }
  for (const staleFile of staleFiles) {
    try {
      rpcDiscoveryFs.unlinkSync(staleFile);
    } catch {
      return unreadableDiscovery(staleFile, "io");
    }
  }
  const serverPids = [...pids].sort((a, b) => a - b);
  if (serverPids.length > 0) {
    return {
      state: "live",
      serverPids,
      serverProcesses: serverPids.map((pid) => processByPid.get(pid) ?? { kind: "process", pid }),
      staleFiles
    };
  }
  const uncertainPids = [...inconclusivePids].sort((a, b) => a - b);
  if (uncertainPids.length > 0) {
    return {
      state: "inconclusive",
      serverPids: [],
      staleFiles,
      inconclusivePids: uncertainPids
    };
  }
  return { state: "stale", serverPids: [], staleFiles };
}
function createPiBlockingProcess(pid) {
  return attachFailClosedBlockingProcessEvidence({ kind: "Pi", pid }, readProcessProbeEvidence(pid));
}
function formatInconclusiveOpenCodeMigrationWarning(dbPath, pids) {
  return `[magic-context] storage warning: continuing migration for ${dbPath}; OpenCode server PID ${pids.join(", ")} was not confirmed because its liveness or identity check could not run. This commonly means an OS sandbox denied kill(0) or ps. No live OpenCode server was confirmed.`;
}
function formatInconclusivePiMigrationWarning(dbPath, pids) {
  return `[magic-context] storage warning: continuing migration for ${dbPath}; Pi/OMP PID ${pids.join(", ")} was not confirmed as a live harness because the process image or command line was ambiguous. No live Pi harness was confirmed.`;
}
function logInconclusiveMigrationProbes(dbPath, discovery, piDiscovery) {
  const uncertainPids = discovery.inconclusivePids ?? [];
  if (uncertainPids.length > 0) {
    log(formatInconclusiveOpenCodeMigrationWarning(dbPath, uncertainPids));
  }
  if (piDiscovery.state === "unreadable") {
    log(`[magic-context] storage warning: continuing migration for ${dbPath}; the Pi/OMP process-list probe could not run, which commonly means an OS sandbox denied ps. No live Pi harness was confirmed.`);
  } else if ((piDiscovery.inconclusivePids?.length ?? 0) > 0) {
    log(formatInconclusivePiMigrationWarning(dbPath, piDiscovery.inconclusivePids ?? []));
  }
}
function isDefaultSharedDatabasePath(dbPath) {
  if (!process.env.XDG_DATA_HOME && (process.env.MAGIC_CONTEXT_TEST_DATA_DIR || false)) {
    return false;
  }
  return resolve2(dbPath) === resolve2(join4(getMagicContextStorageDir(), "context.db"));
}
function migrationBlockingPiPids(dbPath, discovery, discoveredPiPids) {
  if (isDefaultSharedDatabasePath(dbPath))
    return [...discoveredPiPids];
  const sameDataDirPids = new Set(discovery.serverPids);
  return discoveredPiPids.filter((pid) => sameDataDirPids.has(pid));
}
function formatLiveProcessMigrationRefusal(dbPath, persistedVersion, latestSupportedVersion, serverPids, piPids) {
  const blockers = [
    ...serverPids.map((pid) => `confirmed OpenCode server PID ${pid}`),
    ...piPids.map((pid) => `confirmed Pi harness PID ${pid}`)
  ];
  return `[magic-context] storage fatal: refusing to migrate ${dbPath} from upstream migration v${persistedVersion} to v${latestSupportedVersion} while ${blockers.join(", ")} still use the old plugin build. Restart the blocking harness, then retry this process.`;
}
function enforceMigrationOnOpenGuard(db, dbPath, dbDir, latestSupportedVersion) {
  const persistedVersion = getPersistedSchemaVersion(db);
  if (persistedVersion >= latestSupportedVersion) {
    lastMigrationOnOpenRefusal = null;
    return true;
  }
  const discovery = inspectRpcServerDiscovery(dbDir);
  const piDiscovery = inspectLivePiProcesses();
  const piPids = migrationBlockingPiPids(dbPath, discovery, piDiscovery.processIds);
  const serverProcesses = discovery.serverProcesses ?? (discovery.state === "live" ? discovery.serverPids.map((pid) => ({ kind: "process", pid })) : []);
  const blockingProcesses = [...serverProcesses, ...piPids.map(createPiBlockingProcess)];
  if ((discovery.state === "absent" || discovery.state === "stale" || discovery.state === "inconclusive") && piPids.length === 0) {
    lastMigrationOnOpenRefusal = null;
    logInconclusiveMigrationProbes(dbPath, discovery, piDiscovery);
    return true;
  }
  const blockingPids = [...new Set([...discovery.serverPids, ...piPids])].sort((left, right) => left - right);
  lastMigrationOnOpenRefusal = {
    persistedVersion,
    supportedVersion: latestSupportedVersion,
    serverPids: blockingPids,
    blockingProcesses,
    ...discovery.unreadableFile ? { unreadableFile: discovery.unreadableFile } : {},
    ...discovery.unreadableArm ? { unreadableArm: discovery.unreadableArm } : {}
  };
  if (discovery.state === "unreadable") {
    const unreadableFile = discovery.unreadableFile ?? "<unknown>";
    const arm = discovery.unreadableArm ?? "io";
    const recovery = arm === "io" ? `If no OpenCode server is running, it is safe to delete ${unreadableFile} and retry.` : `Retry after the file is older than the ten-minute grace window, or stop OpenCode before deleting it.`;
    log(`[magic-context] storage fatal: refusing to migrate ${dbPath} from upstream migration v${persistedVersion} to v${latestSupportedVersion} because RPC discovery file ${unreadableFile} is uncertain (${arm} arm), so the absence of a live OpenCode server cannot be proven. ${recovery}`);
  } else {
    log(formatLiveProcessMigrationRefusal(dbPath, persistedVersion, latestSupportedVersion, discovery.serverPids, piPids));
  }
  return false;
}
var sqlitePragmaConfig = {
  cacheSizeMb: 64,
  mmapSizeMb: 0
};
function applySqliteTuningPragmas(db) {
  db.exec(`PRAGMA cache_size=-${Math.round(sqlitePragmaConfig.cacheSizeMb * 1024)}`);
  db.exec(`PRAGMA mmap_size=${Math.round(sqlitePragmaConfig.mmapSizeMb * 1024 * 1024)}`);
  db.exec("PRAGMA analysis_limit=400");
}
function finishDatabaseOpen(db, dbPath, explicitDbPath, latestSupportedVersion) {
  if (!enforceSchemaFence(db, dbPath, latestSupportedVersion)) {
    closeQuietly(db);
    return null;
  }
  healWedgedChannel2Claims(db);
  if (!explicitDbPath) {
    const runBackfills = () => {
      try {
        runToolOwnerBackfill(db);
      } catch (error) {
        log(`[magic-context] tool-owner backfill failed (continuing with lazy adoption fallback): ${getErrorMessage(error)}`);
      }
      startMessageFtsRowidMapBackfill(db).catch((error) => {
        log(`[magic-context] message FTS rowid-map backfill failed (will resume next startup): ${getErrorMessage(error)}`);
      });
    };
    if (bootQuietRemainingMs() > 0)
      scheduleAfterBootQuiet(runBackfills);
    else
      runBackfills();
  }
  setDatabase(db);
  loadToolDefinitionMeasurements(db);
  restrictDatabaseFilePermissions(dbPath);
  databases.set(dbPath, db);
  pathByDatabase.set(db, dbPath);
  persistenceByDatabase.set(db, true);
  persistenceErrorByDatabase.delete(db);
  if (!explicitDbPath) {
    log(formatSchemaFenceBootLog(getPersistedSchemaVersion(db), latestSupportedVersion));
  }
  return db;
}
function initializeDatabase(db, busyTimeoutMs = BOOT_SQLITE_BUSY_TIMEOUT_MS) {
  db.exec(`PRAGMA busy_timeout=${resolveBootBusyTimeoutMs(busyTimeoutMs)}`);
  db.exec("PRAGMA foreign_keys=ON");
  db.exec("PRAGMA journal_mode=WAL");
  applySqliteTuningPragmas(db);
  db.exec(`
    CREATE TABLE IF NOT EXISTS tags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      message_id TEXT,
      type TEXT,
      status TEXT DEFAULT 'active',
      byte_size INTEGER,
      tag_number INTEGER,
      harness TEXT NOT NULL DEFAULT 'opencode',
      entry_fingerprint TEXT,
      token_count INTEGER,
      input_token_count INTEGER,
      reasoning_token_count INTEGER,
      UNIQUE(session_id, tag_number)
    );

    CREATE TABLE IF NOT EXISTS pending_ops (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT,
      tag_id INTEGER,
      operation TEXT,
      queued_at INTEGER,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS source_contents (
      tag_id INTEGER,
      session_id TEXT,
      content TEXT,
      created_at INTEGER, -- epoch ms; Date.now() on source writes, preserved on session clones
      harness TEXT NOT NULL DEFAULT 'opencode',
      PRIMARY KEY(session_id, tag_id)
    );

    CREATE TABLE IF NOT EXISTS compartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      start_message INTEGER NOT NULL,
      end_message INTEGER NOT NULL,
      start_message_id TEXT DEFAULT '',
      end_message_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      p1 TEXT,
      p2 TEXT,
      p3 TEXT,
      p4 TEXT,
      importance INTEGER NOT NULL DEFAULT 50,
      episode_type TEXT,
      p1_embedding BLOB,
      p1_embedding_model_id TEXT,
      legacy INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode',
      UNIQUE(session_id, sequence)
    );
    CREATE INDEX IF NOT EXISTS idx_compartments_session ON compartments(session_id);

    CREATE TABLE IF NOT EXISTS compartment_chunk_embeddings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      compartment_id INTEGER NOT NULL REFERENCES compartments(id) ON DELETE CASCADE,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      window_index INTEGER NOT NULL DEFAULT 0,
      start_ordinal INTEGER NOT NULL,
      end_ordinal INTEGER NOT NULL,
      chunk_hash TEXT NOT NULL,
      model_id TEXT NOT NULL,
      dims INTEGER NOT NULL,
      vector BLOB NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      UNIQUE(compartment_id, model_id, window_index)
    );
    CREATE INDEX IF NOT EXISTS idx_cce_session ON compartment_chunk_embeddings(session_id);
    CREATE INDEX IF NOT EXISTS idx_cce_project_model ON compartment_chunk_embeddings(project_path, model_id);

    CREATE TABLE IF NOT EXISTS session_projects (
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      project_path TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(session_id, harness)
    );
    CREATE INDEX IF NOT EXISTS idx_session_projects_project
      ON session_projects(project_path);

    CREATE TABLE IF NOT EXISTS compartment_events (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      compartment_id INTEGER,
      kind TEXT NOT NULL,
      at_compartment INTEGER,
      fields_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode'
    );
    CREATE INDEX IF NOT EXISTS idx_compartment_events_session
      ON compartment_events(session_id);

    CREATE TABLE IF NOT EXISTS compartment_state_lease (
      session_id TEXT PRIMARY KEY NOT NULL,
      holder_id TEXT NOT NULL,
      acquired_at INTEGER NOT NULL,
      expires_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_compartment_state_lease_expires
      ON compartment_state_lease(expires_at);

    CREATE TABLE IF NOT EXISTS compression_depth (
      session_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      depth INTEGER NOT NULL DEFAULT 0,
      harness TEXT NOT NULL DEFAULT 'opencode',
      PRIMARY KEY(session_id, message_ordinal)
    );
    CREATE INDEX IF NOT EXISTS idx_compression_depth_session ON compression_depth(session_id);

    CREATE TABLE IF NOT EXISTS session_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS primer_candidates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      session_id TEXT NOT NULL,
      question TEXT NOT NULL,
      normalized_question TEXT NOT NULL,
      source_compartment_start INTEGER,
      source_compartment_end INTEGER,
      source_start_message_id TEXT NOT NULL DEFAULT '',
      source_end_message_id TEXT NOT NULL DEFAULT '',
      source_message_time INTEGER NOT NULL,
      question_embedding BLOB,
      question_embedding_model_id TEXT,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      UNIQUE(project_path, harness, session_id, source_start_message_id, source_end_message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
      ON primer_candidates(project_path, source_message_time);
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
      ON primer_candidates(session_id, harness);
    CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
      ON primer_candidates(project_path, question_embedding_model_id);

    CREATE TABLE IF NOT EXISTS primers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      question TEXT NOT NULL,
      question_embedding BLOB,
      question_embedding_model_id TEXT,
      answer TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'archived')),
      total_support INTEGER NOT NULL DEFAULT 0,
      last_observed_at INTEGER,
      answer_refreshed_at INTEGER,
      source_candidate_ids TEXT NOT NULL DEFAULT '[]',
      source_candidate_provenance TEXT,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
      ON primers(project_path, status, last_observed_at DESC);
    CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
      ON primers(project_path, question_embedding_model_id);

    CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
      question,
      answer,
      project_path UNINDEXED,
      content='primers',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
      INSERT INTO primers_fts(rowid, question, answer, project_path)
      VALUES (new.id, new.question, new.answer, new.project_path);
    END;

    CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
      INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
      VALUES ('delete', old.id, old.question, old.answer, old.project_path);
    END;

    CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
      INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
      VALUES ('delete', old.id, old.question, old.answer, old.project_path);
      INSERT INTO primers_fts(rowid, question, answer, project_path)
      VALUES (new.id, new.question, new.answer, new.project_path);
    END;

    -- session_notes and smart_notes were merged into the unified notes table
    -- by migration v1 (see features/magic-context/migrations.ts). The old tables
    -- are never recreated; fresh DBs create only notes, upgraded DBs have
    -- their old tables migrated and dropped by the migration runner.

    CREATE TABLE IF NOT EXISTS memories (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      normalized_hash TEXT NOT NULL,
      importance INTEGER,
      scope TEXT NOT NULL DEFAULT 'project',
      shareable INTEGER NOT NULL DEFAULT 0,
      source_session_id TEXT,
      source_type TEXT DEFAULT 'historian',
      seen_count INTEGER DEFAULT 1,
      retrieval_count INTEGER DEFAULT 0,
      first_seen_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      last_seen_at INTEGER NOT NULL,
      last_retrieved_at INTEGER,
      status TEXT DEFAULT 'active',
      expires_at INTEGER,
      verification_status TEXT DEFAULT 'unverified',
      verified_at INTEGER,
      classified_at INTEGER,
      superseded_by_memory_id INTEGER,
      merged_from TEXT,
      metadata_json TEXT,
      mural_cue TEXT,
      mural_cue_hash TEXT,
      mural_cue_at INTEGER,
      mural_cue_rejection_count INTEGER NOT NULL DEFAULT 0,
      UNIQUE(project_path, category, normalized_hash)
    );

    CREATE TABLE IF NOT EXISTS memory_embeddings (
      -- FK-cascade audit (v12): memory_embeddings.memory_id -> memories.id
      -- uses ON DELETE CASCADE, so SQLite PRAGMA foreign_keys must be ON on
      -- every connection and v12 cleans historical orphan rows.
      memory_id INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      embedding BLOB NOT NULL,
      model_id TEXT NOT NULL,
      PRIMARY KEY(memory_id, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_identity_active (
      project_path TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
      model_id TEXT NOT NULL,
      last_active_at INTEGER NOT NULL,
      PRIMARY KEY(project_path, scope, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_registrations (
      project_path TEXT PRIMARY KEY,
      provider_identity TEXT NOT NULL DEFAULT '',
      model_id TEXT NOT NULL DEFAULT '',
      chunk_model_id TEXT NOT NULL DEFAULT '',
      fingerprint TEXT NOT NULL DEFAULT '',
      table_epoch INTEGER NOT NULL DEFAULT 0,
      dims INTEGER NOT NULL DEFAULT 0,
      provenance_json TEXT NOT NULL DEFAULT '{}',
      generation INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS synapse_batch_ledger (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL DEFAULT '',
      scope TEXT NOT NULL DEFAULT '',
      manifest_json TEXT NOT NULL DEFAULT '{}',
      request_key TEXT NOT NULL DEFAULT '',
      job_id TEXT,
      cursor TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at INTEGER NOT NULL DEFAULT 0, -- epoch ms (Date.now())
      updated_at INTEGER NOT NULL DEFAULT 0,
      UNIQUE(session_id, request_key)
    );
    CREATE INDEX IF NOT EXISTS idx_synapse_batch_ledger_session
      ON synapse_batch_ledger(session_id, updated_at);

    CREATE TABLE IF NOT EXISTS shadow_embedding_registrations (
      project_path TEXT NOT NULL,
      scope TEXT NOT NULL CHECK(scope IN ('memory', 'commit', 'chunk')),
      model_id TEXT NOT NULL,
      generation INTEGER NOT NULL DEFAULT 0,
      fingerprint TEXT NOT NULL DEFAULT '',
      table_epoch INTEGER NOT NULL DEFAULT 0,
      dims INTEGER NOT NULL DEFAULT 0,
      provenance_json TEXT NOT NULL DEFAULT '{}',
      updated_at INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY(project_path, scope, model_id)
    );

    CREATE TABLE IF NOT EXISTS embedding_measurement_corpus (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      project_path TEXT NOT NULL DEFAULT '',
      dedup_key TEXT NOT NULL DEFAULT '',
      cohort_key TEXT NOT NULL DEFAULT '',
      query_text_hash TEXT NOT NULL DEFAULT '',
      primary_result_ids_json TEXT NOT NULL DEFAULT '[]',
      shadow_result_ids_json TEXT NOT NULL DEFAULT '[]',
      primary_latency_ms INTEGER,
      shadow_latency_ms INTEGER,
      primary_failed INTEGER NOT NULL DEFAULT 0,
      shadow_failed INTEGER NOT NULL DEFAULT 0,
      primary_model_id TEXT NOT NULL DEFAULT '',
      shadow_model_id TEXT NOT NULL DEFAULT '',
      primary_fingerprint TEXT NOT NULL DEFAULT '',
      shadow_fingerprint TEXT NOT NULL DEFAULT '',
      primary_epoch INTEGER NOT NULL DEFAULT 0,
      shadow_epoch INTEGER NOT NULL DEFAULT 0,
      corpus_hash TEXT NOT NULL DEFAULT '',
      coverage_json TEXT NOT NULL DEFAULT '{}',
      created_at INTEGER NOT NULL DEFAULT 0, -- epoch ms (Date.now())
      UNIQUE(dedup_key, cohort_key)
    );
    CREATE INDEX IF NOT EXISTS idx_embedding_measurement_session
      ON embedding_measurement_corpus(session_id, created_at);

    CREATE TABLE IF NOT EXISTS memory_verifications (
      memory_id    INTEGER NOT NULL REFERENCES memories(id) ON DELETE CASCADE,
      file_path    TEXT NOT NULL,
      -- verified_at=0 means "mapped (files known) but not yet content-verified".
      -- map-memories sets mapped_at + verified_at=0; verify sets verified_at=now.
      verified_at  INTEGER NOT NULL,
       mapped_at    INTEGER NOT NULL DEFAULT 0,
       -- Distinguishes mapper-authored independence from a host rejection fallback.
       mapping_origin TEXT NOT NULL DEFAULT 'mapper',
       PRIMARY KEY (memory_id, file_path)
    );
    CREATE INDEX IF NOT EXISTS idx_memory_verifications_memory ON memory_verifications(memory_id);

    CREATE TABLE IF NOT EXISTS memory_mutation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      mutation_type TEXT NOT NULL CHECK (mutation_type IN ('archive', 'delete', 'update', 'superseded')),
      target_memory_id INTEGER NOT NULL,
      superseded_by_id INTEGER,
      category TEXT,
      new_content TEXT,
      queued_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
      ON memory_mutation_log(project_path, id);
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_visibility
      ON memory_mutation_log(project_path, category, id, target_memory_id);
    CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_target
      ON memory_mutation_log(project_path, target_memory_id, id);

    CREATE TABLE IF NOT EXISTS dream_state (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS dream_queue (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      reason TEXT NOT NULL,
      enqueued_at INTEGER NOT NULL,
      started_at INTEGER,
      retry_count INTEGER DEFAULT 0
    );
    CREATE INDEX IF NOT EXISTS idx_dream_queue_project ON dream_queue(project_path);
CREATE INDEX IF NOT EXISTS idx_dream_queue_pending ON dream_queue(started_at, enqueued_at);

    CREATE TABLE IF NOT EXISTS dream_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      project_path TEXT NOT NULL,
      started_at INTEGER NOT NULL,
      finished_at INTEGER NOT NULL,
      holder_id TEXT NOT NULL,
      tasks_json TEXT NOT NULL,
      tasks_succeeded INTEGER NOT NULL DEFAULT 0,
      tasks_failed INTEGER NOT NULL DEFAULT 0,
      smart_notes_surfaced INTEGER NOT NULL DEFAULT 0,
      smart_notes_pending INTEGER NOT NULL DEFAULT 0,
      memory_changes_json TEXT,
      parent_session_id TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_dream_runs_project ON dream_runs(project_path, finished_at DESC);

    CREATE TABLE IF NOT EXISTS task_schedule_state (
      project_path  TEXT    NOT NULL,
      task          TEXT    NOT NULL,
      last_run_at   INTEGER,
      next_due_at   INTEGER,
      schedule      TEXT,
      last_status   TEXT,
      last_error    TEXT,
      last_checked_commit TEXT,
      last_broad_run_at INTEGER,
      retrospective_watermark_ms INTEGER,
      retry_count   INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (project_path, task)
    );
    CREATE INDEX IF NOT EXISTS idx_task_schedule_due ON task_schedule_state(next_due_at);

    CREATE TABLE IF NOT EXISTS retrospective_processed_windows (
      project_path TEXT NOT NULL,
      window_key   TEXT NOT NULL,
      processed_at INTEGER NOT NULL,
      PRIMARY KEY (project_path, window_key)
    );

    CREATE TABLE IF NOT EXISTS project_key_files (
      project_path           TEXT    NOT NULL,
      path                   TEXT    NOT NULL,
      content                TEXT    NOT NULL,
      content_hash           TEXT    NOT NULL,
      local_token_estimate   INTEGER NOT NULL,
      generated_at           INTEGER NOT NULL,
      generated_by_model     TEXT,
      generation_config_hash TEXT    NOT NULL,
      stale_reason           TEXT,
      PRIMARY KEY (project_path, path)
    );
    CREATE INDEX IF NOT EXISTS idx_project_key_files_project ON project_key_files(project_path);
    CREATE INDEX IF NOT EXISTS idx_project_key_files_generated_at ON project_key_files(project_path, generated_at);

    CREATE TABLE IF NOT EXISTS project_key_files_version (
      project_path TEXT    PRIMARY KEY,
      version      INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS schema_migrations_meta (
      key   TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS project_state (
      project_path TEXT PRIMARY KEY,
      project_memory_epoch INTEGER NOT NULL DEFAULT 0,
      project_user_profile_version INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS git_sweep_coordinator (
      project_path TEXT PRIMARY KEY,
      lease_holder TEXT,
      lease_expires_at INTEGER,
      last_swept_at INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_lease_expires
      ON git_sweep_coordinator(lease_expires_at);
    CREATE INDEX IF NOT EXISTS idx_git_sweep_coordinator_last_swept
      ON git_sweep_coordinator(last_swept_at);

    CREATE TABLE IF NOT EXISTS m0_mutation_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      mutation_type TEXT NOT NULL CHECK (mutation_type IN (
        'compartment_delete', 'compartment_merge', 'recomp_boundary_change', 'compartment_upgrade'
      )),
      target_id INTEGER,
      queued_at INTEGER NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session ON m0_mutation_log(session_id);

    CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
      old_project_path TEXT PRIMARY KEY,
      new_project_path TEXT NOT NULL,
      rekeyed_at INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS workspaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL,
      share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
    );

    CREATE TABLE IF NOT EXISTS workspace_members (
      workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
      project_path TEXT NOT NULL,
      display_name TEXT NOT NULL,
      display_path TEXT NOT NULL,
      added_at INTEGER NOT NULL,
      PRIMARY KEY (workspace_id, project_path)
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique ON workspace_members(project_path);
    CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name ON workspace_members(workspace_id, display_name);

    CREATE TABLE IF NOT EXISTS v22_backfill_failures (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name TEXT NOT NULL,
      row_id INTEGER NOT NULL,
      raw_project_path TEXT NOT NULL,
      error_class TEXT NOT NULL CHECK (error_class IN ('not_git_repo', 'git_missing', 'git_timeout', 'permission_denied', 'unknown')),
      error_message TEXT,
      failed_at INTEGER NOT NULL,
      UNIQUE(table_name, row_id)
    );

    -- (smart_notes: see note above; merged into unified notes table by migration v1)

    CREATE VIRTUAL TABLE IF NOT EXISTS memories_fts USING fts5(
      content,
      category,
      content='memories',
      content_rowid='id',
      tokenize='porter unicode61'
    );

    CREATE VIRTUAL TABLE IF NOT EXISTS message_history_fts USING fts5(
      session_id UNINDEXED,
      message_ordinal UNINDEXED,
      message_id UNINDEXED,
      role,
      content,
      tokenize='porter unicode61'
    );

    CREATE TABLE IF NOT EXISTS message_fts_rowid_map (
      session_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      fts_rowid INTEGER NOT NULL,
      PRIMARY KEY(session_id, message_ordinal)
    );

    CREATE TABLE IF NOT EXISTS message_fts_rowid_map_backfill_state (
      id INTEGER PRIMARY KEY CHECK(id = 1),
      watermark_rowid INTEGER NOT NULL DEFAULT 0,
      completed INTEGER NOT NULL DEFAULT 0 CHECK(completed IN (0, 1)),
      updated_at INTEGER NOT NULL DEFAULT 0
    );
    INSERT OR IGNORE INTO message_fts_rowid_map_backfill_state
      (id, watermark_rowid, completed, updated_at)
    VALUES (1, 0, 0, 0);

    CREATE TABLE IF NOT EXISTS message_history_index (
      session_id TEXT PRIMARY KEY,
      last_indexed_ordinal INTEGER NOT NULL DEFAULT 0,
      dirty_floor_ordinal INTEGER NOT NULL DEFAULT 0,
      updated_at INTEGER NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE TABLE IF NOT EXISTS message_history_source (
      session_id TEXT NOT NULL,
      message_id TEXT NOT NULL,
      message_ordinal INTEGER NOT NULL,
      source_version TEXT NOT NULL,
      normalized_content_hash TEXT NOT NULL,
      role TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      updated_at INTEGER NOT NULL,
      PRIMARY KEY(session_id, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_message_history_source_session_ordinal
      ON message_history_source(session_id, message_ordinal);

    CREATE TABLE IF NOT EXISTS pending_session_cleanup (
      session_id TEXT PRIMARY KEY,
      harness TEXT NOT NULL DEFAULT 'opencode',
      requested_at INTEGER NOT NULL,
      last_attempt_at INTEGER
    );

    CREATE TABLE IF NOT EXISTS message_history_orphan_sweep (
      harness TEXT PRIMARY KEY,
      cursor_session_id TEXT NOT NULL DEFAULT '',
      last_swept_at INTEGER
    );

    CREATE TRIGGER IF NOT EXISTS memories_ai AFTER INSERT ON memories BEGIN
      INSERT INTO memories_fts(rowid, content, category) VALUES (new.id, new.content, new.category);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_ad AFTER DELETE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, category) VALUES ('delete', old.id, old.content, old.category);
    END;

    CREATE TRIGGER IF NOT EXISTS memories_au AFTER UPDATE ON memories BEGIN
      INSERT INTO memories_fts(memories_fts, rowid, content, category) VALUES ('delete', old.id, old.content, old.category);
      INSERT INTO memories_fts(rowid, content, category) VALUES (new.id, new.content, new.category);
    END;

    CREATE TABLE IF NOT EXISTS session_meta (
      session_id TEXT PRIMARY KEY,
      harness TEXT NOT NULL DEFAULT 'opencode',
      last_response_time INTEGER,
      cache_ttl TEXT,
      counter INTEGER DEFAULT 0,
      last_nudge_tokens INTEGER DEFAULT 0,
      last_nudge_band TEXT DEFAULT '',
      last_nudge_undropped INTEGER DEFAULT 0,
      last_nudge_level TEXT DEFAULT '',
      channel2_nudge_state TEXT DEFAULT '',
      channel2_nudge_claimed_at INTEGER DEFAULT 0,
      channel2_nudge_claim_token TEXT DEFAULT '',
      last_emergency_input_sample INTEGER DEFAULT 0,
      last_transform_error TEXT DEFAULT '',
      nudge_anchor_message_id TEXT DEFAULT '',
      nudge_anchor_text TEXT DEFAULT '',
      sticky_turn_reminder_text TEXT DEFAULT '',
      sticky_turn_reminder_message_id TEXT DEFAULT '',
      note_nudge_trigger_pending INTEGER DEFAULT 0,
      note_nudge_trigger_message_id TEXT DEFAULT '',
      note_nudge_sticky_text TEXT DEFAULT '',
      note_nudge_sticky_message_id TEXT DEFAULT '',
      note_nudge_anchors TEXT NOT NULL DEFAULT '[]',
      auto_search_hint_decisions TEXT NOT NULL DEFAULT '[]',
      last_todo_state TEXT DEFAULT '',
      todo_permission_denied INTEGER NOT NULL DEFAULT 2,
      todo_synthetic_call_id TEXT DEFAULT '',
      todo_synthetic_anchor_message_id TEXT DEFAULT '',
      todo_synthetic_state_json TEXT DEFAULT '',
      is_subagent INTEGER DEFAULT 0,
      last_context_percentage REAL DEFAULT 0,
      last_input_tokens INTEGER DEFAULT 0,
      detected_context_limit_provenance TEXT NOT NULL DEFAULT 'unknown',
      observed_safe_input_tokens INTEGER NOT NULL DEFAULT 0,
      cache_alert_sent INTEGER NOT NULL DEFAULT 0,
      times_execute_threshold_reached INTEGER DEFAULT 0,
      compartment_in_progress INTEGER DEFAULT 0,
      historian_failure_count INTEGER DEFAULT 0,
      historian_last_error TEXT DEFAULT NULL,
      historian_last_failure_at INTEGER DEFAULT NULL,
      system_prompt_hash TEXT DEFAULT '',
      memory_block_cache TEXT DEFAULT '',
      memory_block_count INTEGER DEFAULT 0,
      memory_block_ids TEXT DEFAULT '',
      -- pending_compaction_marker_state: intentionally NULLABLE without a
      -- default. Absence of a deferred marker is SQL NULL; presence is a
      -- valid JSON blob written via setPendingCompactionMarkerState.
      -- Excluded from the healAllNullColumns fallback list. Readers filter
      -- IS NOT NULL AND != empty-string defensively. Plan v6 section 3.
      pending_compaction_marker_state TEXT,
      -- Target OpenCode message id used to inject the current compaction marker.
      -- Nullable for legacy persisted markers; repaired on the next marker move.
      compaction_marker_target_end_message_id TEXT,
      -- pending_pi_compaction_marker_state: intentionally NULLABLE without a
      -- default. Absence of a deferred Pi-native marker is SQL NULL; presence
      -- is a valid JSON blob written via setPendingPiCompactionMarkerState.
      -- Excluded from the healAllNullColumns fallback list.
      pending_pi_compaction_marker_state TEXT,
      new_work_tokens INTEGER NOT NULL DEFAULT 0,
      total_input_tokens INTEGER NOT NULL DEFAULT 0,
      -- Retired columns remain in place so existing databases keep the same schema:
      -- deferred_execute_state was used by the removed turn-boundary execute hold.
      deferred_execute_state TEXT,
      cached_m0_bytes BLOB,
      cached_m0_project_memory_epoch INTEGER,
      cached_m0_workspace_fingerprint TEXT,
      cached_m0_project_user_profile_version INTEGER,
      cached_m0_max_compartment_seq INTEGER,
      cached_m0_max_memory_id INTEGER,
      cached_m0_max_mutation_id INTEGER,
      cached_m0_max_memory_mutation_id INTEGER,
      cached_m0_project_docs_hash TEXT,
      cached_m1_bytes BLOB,
      last_observed_model_key TEXT,
      last_usage_context_limit INTEGER NOT NULL DEFAULT 0,
      prior_boundary_ordinal INTEGER NOT NULL DEFAULT 1,
      protected_tokens_effective INTEGER,
      protected_tokens_pre_snapshot TEXT,
      protected_tail_policy_version INTEGER NOT NULL DEFAULT 0,
      protected_tail_drain_window_started_at INTEGER NOT NULL DEFAULT 0,
      protected_tail_drain_tokens INTEGER NOT NULL DEFAULT 0,
      recovery_no_eligible_head_count INTEGER NOT NULL DEFAULT 0,
      force_emergency_bypass_window_start INTEGER NOT NULL DEFAULT 0,
      force_emergency_bypass_used INTEGER NOT NULL DEFAULT 0,
      emergency_drain_active INTEGER NOT NULL DEFAULT 0,
      historian_drain_failure_at INTEGER NOT NULL DEFAULT 0,
      wrapup_in_progress_state TEXT,
      compaction_mode_record TEXT,
      cached_m0_materialized_at INTEGER,
      cached_m0_session_facts_version INTEGER,
      cached_m0_upgrade_state TEXT,
      cached_m0_system_hash TEXT,
      cached_m0_tool_set_hash TEXT,
      cached_m0_model_key TEXT,
       cached_m0_project_identity TEXT,
       cached_m0_last_baseline_end_message_id TEXT,
       thinking_binding_recovery_target TEXT NOT NULL DEFAULT '',
       upgrade_reminded_at INTEGER,
       pi_stable_id_scheme INTEGER
    );

    CREATE TABLE IF NOT EXISTS tool_owner_backfill_state (
      session_id TEXT PRIMARY KEY,
      status TEXT NOT NULL CHECK (status IN ('pending', 'running', 'completed', 'skipped')),
      started_at INTEGER,
      lease_expires_at INTEGER,
      completed_at INTEGER,
      last_error TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tool_owner_backfill_state_status
      ON tool_owner_backfill_state(status);

    CREATE TABLE IF NOT EXISTS subagent_invocations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL,
      subagent TEXT NOT NULL,
      task TEXT,
      provider_id TEXT,
      model_id TEXT,
      started_at INTEGER NOT NULL,
      ended_at INTEGER,
      status TEXT NOT NULL,
      input_tokens INTEGER NOT NULL DEFAULT 0,
      output_tokens INTEGER NOT NULL DEFAULT 0,
      cache_read_tokens INTEGER NOT NULL DEFAULT 0,
      cache_write_tokens INTEGER NOT NULL DEFAULT 0,
      error TEXT,
      parent_invocation_id INTEGER
    );
    CREATE INDEX IF NOT EXISTS idx_sai_session_started
      ON subagent_invocations(session_id, started_at DESC);
    CREATE INDEX IF NOT EXISTS idx_sai_subagent
      ON subagent_invocations(subagent, started_at DESC);

    CREATE TABLE IF NOT EXISTS historian_runs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      harness TEXT NOT NULL DEFAULT 'opencode',
      subagent_invocation_id INTEGER,
      run_kind TEXT NOT NULL,
      status TEXT NOT NULL,
      failure_reason TEXT,
      chunk_start_ordinal INTEGER,
      chunk_end_ordinal INTEGER,
      unprocessed_from INTEGER,
      compartments_produced INTEGER NOT NULL DEFAULT 0,
      compartment_id_min INTEGER,
      compartment_id_max INTEGER,
      facts_emitted INTEGER NOT NULL DEFAULT 0,
      facts_by_category_json TEXT,
      events_emitted INTEGER NOT NULL DEFAULT 0,
      importance_min INTEGER,
      importance_max INTEGER,
      importance_avg REAL,
      discarded_last INTEGER NOT NULL DEFAULT 0,
      legacy INTEGER NOT NULL DEFAULT 0,
      created_at INTEGER NOT NULL -- epoch ms (Date.now())
    );
    CREATE INDEX IF NOT EXISTS idx_historian_runs_session
      ON historian_runs(session_id, created_at DESC);
    CREATE INDEX IF NOT EXISTS idx_historian_runs_status
      ON historian_runs(status, created_at DESC);

    CREATE TABLE IF NOT EXISTS transform_decisions (
      session_id         TEXT    NOT NULL,
      harness            TEXT    NOT NULL DEFAULT 'opencode',
      message_id         TEXT    NOT NULL,
      ts_ms              INTEGER NOT NULL,
      decision           TEXT    NOT NULL,
      materialized       INTEGER NOT NULL DEFAULT 0,
      materialize_reason TEXT,
      system_hash_prev      TEXT,
      system_hash_new       TEXT,
      m0_tool_set_hash_prev TEXT,
      m0_tool_set_hash_new  TEXT,
      m0_model_key_prev     TEXT,
      m0_model_key_new      TEXT,
      emergency          INTEGER NOT NULL DEFAULT 0,
      dropped_tokens     INTEGER NOT NULL DEFAULT 0,
      dropped_count      INTEGER NOT NULL DEFAULT 0,
      input_tokens       INTEGER NOT NULL DEFAULT 0,
      PRIMARY KEY (session_id, harness, message_id)
    );
    CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
      ON transform_decisions(session_id, harness);

    CREATE INDEX IF NOT EXISTS idx_tags_session_tag_number ON tags(session_id, tag_number);
    CREATE INDEX IF NOT EXISTS idx_tags_session_message_id ON tags(session_id, message_id);
    CREATE INDEX IF NOT EXISTS idx_pending_ops_session ON pending_ops(session_id);
    CREATE INDEX IF NOT EXISTS idx_pending_ops_session_tag_id ON pending_ops(session_id, tag_id);
    CREATE INDEX IF NOT EXISTS idx_source_contents_session ON source_contents(session_id);
    
    CREATE TABLE IF NOT EXISTS recomp_compartments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      sequence INTEGER NOT NULL,
      start_message INTEGER NOT NULL,
      end_message INTEGER NOT NULL,
      start_message_id TEXT DEFAULT '',
      end_message_id TEXT DEFAULT '',
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      p1 TEXT,
      p2 TEXT,
      p3 TEXT,
      p4 TEXT,
      importance INTEGER NOT NULL DEFAULT 50,
      episode_type TEXT,
      pass_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode',
      UNIQUE(session_id, sequence)
    );

    CREATE TABLE IF NOT EXISTS recomp_facts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      category TEXT NOT NULL,
      content TEXT NOT NULL,
      pass_number INTEGER NOT NULL,
      created_at INTEGER NOT NULL, -- epoch ms (Date.now())
      harness TEXT NOT NULL DEFAULT 'opencode'
    );

    CREATE INDEX IF NOT EXISTS idx_session_facts_session ON session_facts(session_id);
    CREATE INDEX IF NOT EXISTS idx_recomp_compartments_session ON recomp_compartments(session_id);
    CREATE INDEX IF NOT EXISTS idx_recomp_facts_session ON recomp_facts(session_id);
    CREATE INDEX IF NOT EXISTS idx_memories_project_status_category ON memories(project_path, status, category);
    CREATE INDEX IF NOT EXISTS idx_memories_project_status_expires ON memories(project_path, status, expires_at);
    CREATE INDEX IF NOT EXISTS idx_memories_project_category_hash ON memories(project_path, category, normalized_hash);
    CREATE INDEX IF NOT EXISTS idx_message_history_index_updated_at ON message_history_index(updated_at);
  `);
  ensureColumn(db, "primer_candidates", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "primer_candidates", "source_start_message_id", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "primer_candidates", "source_end_message_id", "TEXT NOT NULL DEFAULT ''");
  ensureColumn(db, "primer_candidates", "question_embedding", "BLOB");
  ensureColumn(db, "primer_candidates", "question_embedding_model_id", "TEXT");
  ensureColumn(db, "primers", "question_embedding_model_id", "TEXT");
  ensureColumn(db, "primers", "source_candidate_provenance", "TEXT");
  const hasUserMemoriesTable = db.prepare("SELECT 1 FROM sqlite_master WHERE type = 'table' AND name = 'user_memories'").get();
  if (hasUserMemoriesTable) {
    ensureColumn(db, "user_memories", "source_candidate_provenance", "TEXT");
  }
  db.exec(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_primer_candidates_occurrence
        ON primer_candidates(project_path, harness, session_id, source_start_message_id, source_end_message_id);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_project_time
        ON primer_candidates(project_path, source_message_time);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_session
        ON primer_candidates(session_id, harness);
      CREATE INDEX IF NOT EXISTS idx_primer_candidates_embedding_model
        ON primer_candidates(project_path, question_embedding_model_id);
      CREATE INDEX IF NOT EXISTS idx_primers_project_status_observed
        ON primers(project_path, status, last_observed_at DESC);
      CREATE INDEX IF NOT EXISTS idx_primers_embedding_model
        ON primers(project_path, question_embedding_model_id);
      CREATE VIRTUAL TABLE IF NOT EXISTS primers_fts USING fts5(
        question,
        answer,
        project_path UNINDEXED,
        content='primers',
        content_rowid='id',
        tokenize='porter unicode61'
      );
      CREATE TRIGGER IF NOT EXISTS primers_ai AFTER INSERT ON primers BEGIN
        INSERT INTO primers_fts(rowid, question, answer, project_path)
        VALUES (new.id, new.question, new.answer, new.project_path);
      END;
      CREATE TRIGGER IF NOT EXISTS primers_ad AFTER DELETE ON primers BEGIN
        INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
        VALUES ('delete', old.id, old.question, old.answer, old.project_path);
      END;
      CREATE TRIGGER IF NOT EXISTS primers_au AFTER UPDATE ON primers BEGIN
        INSERT INTO primers_fts(primers_fts, rowid, question, answer, project_path)
        VALUES ('delete', old.id, old.question, old.answer, old.project_path);
        INSERT INTO primers_fts(rowid, question, answer, project_path)
        VALUES (new.id, new.question, new.answer, new.project_path);
      END;
    `);
  ensureColumn(db, "session_meta", "last_nudge_band", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "last_nudge_undropped", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "last_nudge_level", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "channel2_nudge_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "channel2_nudge_claimed_at", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "channel2_nudge_claim_token", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "last_emergency_input_sample", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "last_transform_error", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "nudge_anchor_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "nudge_anchor_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "sticky_turn_reminder_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "sticky_turn_reminder_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_trigger_pending", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "note_nudge_trigger_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_sticky_text", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_sticky_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_nudge_anchors", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "session_meta", "auto_search_hint_decisions", "TEXT NOT NULL DEFAULT '[]'");
  ensureColumn(db, "session_meta", "last_todo_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_permission_denied", "INTEGER NOT NULL DEFAULT 2");
  ensureColumn(db, "session_meta", "todo_synthetic_call_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_synthetic_anchor_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "todo_synthetic_state_json", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "note_last_read_at", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "times_execute_threshold_reached", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "observed_safe_input_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cache_alert_sent", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "compartment_in_progress", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_failure_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_last_error", "TEXT DEFAULT NULL");
  ensureColumn(db, "session_meta", "historian_last_failure_at", "INTEGER DEFAULT NULL");
  ensureColumn(db, "session_meta", "system_prompt_hash", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "cleared_reasoning_through_tag", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "tool_reclaim_watermark", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "stripped_placeholder_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "stale_reduce_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "processed_image_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "merged_reasoning_stripped_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "thinking_binding_recovery_target", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "trailing_blank_decisions", "TEXT DEFAULT ''");
  ensureColumn(db, "compartments", "start_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "compartments", "end_message_id", "TEXT DEFAULT ''");
  ensureColumn(db, "memory_embeddings", "model_id", "TEXT");
  ensureColumn(db, "session_meta", "memory_block_cache", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "memory_block_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "pi_stable_id_scheme", "INTEGER");
  ensureColumn(db, "session_meta", "memory_block_ids", "TEXT DEFAULT ''");
  ensureColumn(db, "dream_queue", "retry_count", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "reasoning_byte_size", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "drop_mode", "TEXT DEFAULT 'full'");
  ensureColumn(db, "tags", "tool_name", "TEXT");
  ensureColumn(db, "tags", "input_byte_size", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "caveman_depth", "INTEGER DEFAULT 0");
  ensureColumn(db, "tags", "tool_owner_message_id", "TEXT DEFAULT NULL");
  ensureColumn(db, "tags", "entry_fingerprint", "TEXT");
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_adopt
            ON tags(session_id, entry_fingerprint)
            WHERE type='message' AND entry_fingerprint IS NOT NULL`);
  db.exec(`CREATE INDEX IF NOT EXISTS idx_tags_pi_fallback_tool_owner
            ON tags(session_id, tool_owner_message_id)
            WHERE type='tool'`);
  ensureColumn(db, "tags", "token_count", "INTEGER");
  ensureColumn(db, "tags", "input_token_count", "INTEGER");
  ensureColumn(db, "tags", "reasoning_token_count", "INTEGER");
  ensureColumn(db, "task_schedule_state", "schedule", "TEXT");
  ensureColumn(db, "task_schedule_state", "last_checked_commit", "TEXT");
  ensureColumn(db, "task_schedule_state", "last_broad_run_at", "INTEGER");
  ensureColumn(db, "task_schedule_state", "retrospective_watermark_ms", "INTEGER");
  ensureColumn(db, "dream_runs", "parent_session_id", "TEXT");
  ensureColumn(db, "session_meta", "system_prompt_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "compaction_marker_state", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "compaction_marker_target_end_message_id", "TEXT");
  ensureColumn(db, "session_meta", "key_files", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "conversation_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "tool_call_tokens", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "recomp_partial_range_start", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "recomp_partial_range_end", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "detected_context_limit", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "detected_context_limit_model_key", "TEXT");
  ensureColumn(db, "session_meta", "detected_context_limit_provenance", "TEXT NOT NULL DEFAULT 'unknown'");
  ensureColumn(db, "session_meta", "needs_emergency_recovery", "INTEGER DEFAULT 0");
  ensureColumn(db, "session_meta", "emergency_recovery_origin", "TEXT DEFAULT ''");
  ensureColumn(db, "session_meta", "pending_compaction_marker_state", "TEXT");
  ensureColumn(db, "session_meta", "pending_pi_compaction_marker_state", "TEXT");
  ensureColumn(db, "session_meta", "new_work_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "total_input_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "deferred_execute_state", "TEXT");
  ensureColumn(db, "compartments", "p1", "TEXT");
  ensureColumn(db, "compartments", "p2", "TEXT");
  ensureColumn(db, "compartments", "p3", "TEXT");
  ensureColumn(db, "compartments", "p4", "TEXT");
  ensureColumn(db, "compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
  ensureColumn(db, "compartments", "episode_type", "TEXT");
  ensureColumn(db, "compartments", "p1_embedding", "BLOB");
  ensureColumn(db, "compartments", "p1_embedding_model_id", "TEXT");
  ensureColumn(db, "compartments", "legacy", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "recomp_compartments", "p1", "TEXT");
  ensureColumn(db, "recomp_compartments", "p2", "TEXT");
  ensureColumn(db, "recomp_compartments", "p3", "TEXT");
  ensureColumn(db, "recomp_compartments", "p4", "TEXT");
  ensureColumn(db, "recomp_compartments", "importance", "INTEGER NOT NULL DEFAULT 50");
  ensureColumn(db, "recomp_compartments", "episode_type", "TEXT");
  ensureColumn(db, "memories", "importance", "INTEGER");
  ensureColumn(db, "memories", "classified_at", "INTEGER");
  ensureColumn(db, "memories", "mural_cue", "TEXT");
  ensureColumn(db, "memories", "mural_cue_hash", "TEXT");
  ensureColumn(db, "memories", "mural_cue_at", "INTEGER");
  ensureColumn(db, "memory_verifications", "mapped_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cached_m0_bytes", "BLOB");
  ensureColumn(db, "session_meta", "cached_m0_project_memory_epoch", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_workspace_fingerprint", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_project_user_profile_version", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_compartment_seq", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_memory_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_mutation_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_max_memory_mutation_id", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_project_docs_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m1_bytes", "BLOB");
  ensureColumn(db, "session_meta", "last_observed_model_key", "TEXT");
  ensureColumn(db, "session_meta", "last_usage_context_limit", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "prior_boundary_ordinal", "INTEGER NOT NULL DEFAULT 1");
  ensureColumn(db, "session_meta", "protected_tokens_effective", "INTEGER");
  ensureColumn(db, "session_meta", "protected_tokens_pre_snapshot", "TEXT");
  ensureColumn(db, "session_meta", "protected_tail_policy_version", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "protected_tail_drain_window_started_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "protected_tail_drain_tokens", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "recovery_no_eligible_head_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "force_emergency_bypass_window_start", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "force_emergency_bypass_used", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "emergency_drain_active", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "historian_drain_failure_at", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "wrapup_in_progress_state", "TEXT");
  ensureColumn(db, "session_meta", "compaction_mode_record", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_materialized_at", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_session_facts_version", "INTEGER");
  ensureColumn(db, "session_meta", "cached_m0_upgrade_state", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_system_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_tool_set_hash", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_model_key", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_project_identity", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_last_baseline_end_message_id", "TEXT");
  ensureColumn(db, "session_meta", "upgrade_reminded_at", "INTEGER");
  ensureColumn(db, "session_meta", "upgrade_reminder_last_sent_at", "INTEGER");
  ensureColumn(db, "session_meta", "upgrade_reminder_count", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "session_meta", "cached_m0_mural_data_url", "TEXT");
  ensureColumn(db, "session_meta", "cached_m0_mural_hash", "TEXT");
  db.exec(`
      CREATE TABLE IF NOT EXISTS project_state (
        project_path TEXT PRIMARY KEY,
        project_memory_epoch INTEGER NOT NULL DEFAULT 0,
        project_user_profile_version INTEGER NOT NULL DEFAULT 0,
        updated_at INTEGER NOT NULL DEFAULT 0
      );
      CREATE TABLE IF NOT EXISTS session_projects (
        session_id TEXT NOT NULL,
        harness TEXT NOT NULL DEFAULT 'opencode',
        project_path TEXT NOT NULL,
        updated_at INTEGER NOT NULL,
        PRIMARY KEY(session_id, harness)
      );
      CREATE INDEX IF NOT EXISTS idx_session_projects_project
        ON session_projects(project_path);
      CREATE TABLE IF NOT EXISTS m0_mutation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT NOT NULL,
        mutation_type TEXT NOT NULL CHECK (mutation_type IN (
          'compartment_delete', 'compartment_merge', 'recomp_boundary_change', 'compartment_upgrade'
        )),
        target_id INTEGER,
        queued_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_m0_mutation_log_session ON m0_mutation_log(session_id);
      CREATE TABLE IF NOT EXISTS memory_mutation_log (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        project_path TEXT NOT NULL,
        mutation_type TEXT NOT NULL CHECK (mutation_type IN ('archive', 'delete', 'update', 'superseded')),
        target_memory_id INTEGER NOT NULL,
        superseded_by_id INTEGER,
        category TEXT,
        new_content TEXT,
        queued_at INTEGER NOT NULL
      );
      CREATE INDEX IF NOT EXISTS idx_memory_mutation_log_project
        ON memory_mutation_log(project_path, id);
       CREATE TABLE IF NOT EXISTS v22_identity_rekey_map (
         old_project_path TEXT PRIMARY KEY,
         new_project_path TEXT NOT NULL,
         rekeyed_at INTEGER NOT NULL
       );
       CREATE TABLE IF NOT EXISTS identity_merge_log (
         id INTEGER PRIMARY KEY AUTOINCREMENT,
         from_identity TEXT NOT NULL,
         to_identity TEXT NOT NULL,
         table_name TEXT NOT NULL,
         row_id TEXT NOT NULL,
         action TEXT NOT NULL,
         target_row_id TEXT,
         merged_at INTEGER NOT NULL
       );
       CREATE INDEX IF NOT EXISTS idx_identity_merge_log_identities
         ON identity_merge_log(from_identity, to_identity, merged_at);
       CREATE INDEX IF NOT EXISTS idx_identity_merge_log_table_row
         ON identity_merge_log(table_name, row_id);
      CREATE TABLE IF NOT EXISTS workspaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL UNIQUE,
        created_at INTEGER NOT NULL,
        updated_at INTEGER NOT NULL,
        share_categories TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'
      );
      CREATE TABLE IF NOT EXISTS workspace_members (
        workspace_id INTEGER NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
        project_path TEXT NOT NULL,
        display_name TEXT NOT NULL,
        display_path TEXT NOT NULL,
        added_at INTEGER NOT NULL,
        PRIMARY KEY (workspace_id, project_path)
      );
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_unique ON workspace_members(project_path);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_workspace_member_name ON workspace_members(workspace_id, display_name);
      CREATE TABLE IF NOT EXISTS v22_backfill_failures (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        table_name TEXT NOT NULL,
        row_id INTEGER NOT NULL,
        raw_project_path TEXT NOT NULL,
        error_class TEXT NOT NULL CHECK (error_class IN ('not_git_repo', 'git_missing', 'git_timeout', 'permission_denied', 'unknown')),
        error_message TEXT,
        failed_at INTEGER NOT NULL,
        UNIQUE(table_name, row_id)
      );
      CREATE TABLE IF NOT EXISTS transform_decisions (
        session_id         TEXT    NOT NULL,
        harness            TEXT    NOT NULL DEFAULT 'opencode',
        message_id         TEXT    NOT NULL,
        ts_ms              INTEGER NOT NULL,
        decision           TEXT    NOT NULL,
        materialized       INTEGER NOT NULL DEFAULT 0,
        materialize_reason TEXT,
      system_hash_prev      TEXT,
      system_hash_new       TEXT,
      m0_tool_set_hash_prev TEXT,
      m0_tool_set_hash_new  TEXT,
      m0_model_key_prev     TEXT,
      m0_model_key_new      TEXT,
        emergency          INTEGER NOT NULL DEFAULT 0,
        dropped_tokens     INTEGER NOT NULL DEFAULT 0,
        dropped_count      INTEGER NOT NULL DEFAULT 0,
        input_tokens       INTEGER NOT NULL DEFAULT 0,
        PRIMARY KEY (session_id, harness, message_id)
      );
      CREATE INDEX IF NOT EXISTS idx_transform_decisions_session_harness
        ON transform_decisions(session_id, harness);
    `);
  ensureColumn(db, "transform_decisions", "system_hash_prev", "TEXT");
  ensureColumn(db, "transform_decisions", "system_hash_new", "TEXT");
  ensureColumn(db, "transform_decisions", "m0_model_key_prev", "TEXT");
  ensureColumn(db, "transform_decisions", "m0_model_key_new", "TEXT");
  ensureColumn(db, "tags", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "message_history_index", "dirty_floor_ordinal", "INTEGER NOT NULL DEFAULT 0");
  ensureColumn(db, "pending_ops", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "source_contents", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "compartments", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "compression_depth", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "session_facts", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "session_meta", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "recomp_compartments", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "recomp_facts", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  ensureColumn(db, "message_history_index", "harness", "TEXT NOT NULL DEFAULT 'opencode'");
  db.exec(`
      CREATE INDEX IF NOT EXISTS idx_message_history_index_orphan_sweep
        ON message_history_index(harness, session_id, updated_at);
    `);
  ensureColumn(db, "workspaces", "share_categories", `TEXT NOT NULL DEFAULT '["CONSTRAINTS"]'`);
}
var CHANNEL2_CLAIM_TTL_MS = 10 * 60000;
function healWedgedChannel2Claims(db) {
  try {
    const staleBefore = Date.now() - CHANNEL2_CLAIM_TTL_MS;
    db.prepare("UPDATE session_meta SET channel2_nudge_state = '', channel2_nudge_claimed_at = 0, channel2_nudge_claim_token = '' WHERE channel2_nudge_state = 'claimed' AND (channel2_nudge_claimed_at IS NULL OR channel2_nudge_claimed_at = 0 OR channel2_nudge_claimed_at <= ?)").run(staleBefore);
  } catch {}
}
function openDatabase(dbPathOrOptions) {
  const options = typeof dbPathOrOptions === "string" ? { dbPath: dbPathOrOptions } : dbPathOrOptions;
  const explicitDbPath = options?.dbPath !== undefined;
  const { dbDir, dbPath } = resolveDatabasePath(options?.dbPath);
  const latestSupportedVersion = getRuntimeLatestSupportedVersion(options);
  const busyTimeoutMs = resolveBootBusyTimeoutMs(options?.busyTimeoutMs);
  lastSchemaFenceRejection = null;
  lastMigrationOnOpenRefusal = null;
  const existing = databases.get(dbPath);
  if (existing) {
    if (!enforceSchemaFence(existing, dbPath, latestSupportedVersion)) {
      return null;
    }
    if (!persistenceByDatabase.has(existing)) {
      persistenceByDatabase.set(existing, true);
    }
    healWedgedChannel2Claims(existing);
    return existing;
  }
  try {
    if (!explicitDbPath) {
      migrateLegacyStorageIfNeeded(dbPath, dbDir);
    }
    ensureSecureStorageDir(dbDir);
    const db = new Database(dbPath);
    installBootBusyTimeout(db, dbPath, busyTimeoutMs, options?.onBootBusyTimeout);
    if (!enforceSchemaFence(db, dbPath, latestSupportedVersion)) {
      closeQuietly(db);
      return null;
    }
    if (!enforceMigrationOnOpenGuard(db, dbPath, dbDir, latestSupportedVersion)) {
      closeQuietly(db);
      return null;
    }
    initializeDatabase(db, busyTimeoutMs);
    runMigrations(db);
    ensureContextStoreUuid(db);
    return finishDatabaseOpen(db, dbPath, explicitDbPath, latestSupportedVersion);
  } catch (error) {
    const detail = getErrorMessage(error);
    log(`[magic-context] storage fatal: failed to open ${dbPath}: ${detail}`);
    throw new Error(`[magic-context] storage unavailable: ${detail}. Magic Context is disabled for this run; check log for details.`);
  }
}

export { setHarness, getHarness, parse, printParseErrorCode, getDataDir, ensureCortexKitArtifactGitignore, getProjectMagicContextHistorianDir, getMagicContextStorageResolution, getMagicContextStorageDir, sanitizeDiagnosticText, hasShareabilitySensitiveText, log, sessionLog, shouldEnforcePrivateStoragePermissions, setJsoncValue, removeJsoncValue, cortexKitUserConfigBasePath, cortexKitProjectConfigBasePath, resolveCortexKitUserConfigPath, resolveLegacyConfigSources, resolveLegacyConfigSourcesForHarness, logSlowWriteTransaction, V2_MEMORY_CATEGORIES, PROMOTABLE_CATEGORIES, getMemoryCategoryOrder, CATEGORY_DEFAULT_TTL, Database, withPrivilegedWriter, OMO_INTERNAL_INITIATOR_MARKER, removeSystemReminders, hasMeaningfulUserText, extractTexts, extractToolResultBodyTokens, extractToolCallSummaries, estimateTokens, normalizeText, compactRole, formatBlock, compactTextForSummary, mergeCommitHashes, recordMessageFtsRowid, messageFtsOrdinalRangeIsMapped, scheduleAfterBootQuiet, isUserHomeDirectory, resolveProjectIdentity2, resolveProjectIdentityForSession, normalizeStoredProjectPath, storedPathBelongsToIdentity, getModuleNoteEvaluationBridge, getContextStoreUuid, drainMirrorPages, stableStringify, resolveOpenCodeDbPath, assertOpenCodeStoreGeneration, openCodeDbPathExists, formatOpenCodeDbMissingStatusLine, formatOpenCodeDbReadFailureStatusLine, recordOpenCodeDbReadFailure, clearOpenCodeDbReadFailure, getOpenCodeDbReadFailure, claimOpenCodeDbDiagnosticOnce, closeQuietly, parseCompartmentOutput, resolveWorkspaceShareCategories, resolveWorkspaceIdentitySet, expandWorkspaceIdentitySetWithAliases, resolveStoredPathWorkspaceIdentity, sourceNameForMemory, computeWorkspaceEpochFingerprint, bumpEpochsForWorkspaceMembers, getErrorMessage, describeError, FAIL_CLOSED_DOCTOR_COMMAND, getSchemaFenceRejection, LATEST_SUPPORTED_VERSION, getPersistedSchemaVersion, openDatabase };
