const LEVELS = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const DEFAULT_LEVEL = (process.env.LOG_LEVEL || "info").toLowerCase();
const ACTIVE_LEVEL = LEVELS[DEFAULT_LEVEL] ?? LEVELS.info;

function normalizeError(err) {
  if (!(err instanceof Error)) return null;
  return {
    name: err.name,
    message: err.message,
    stack: err.stack,
  };
}

function buildEntry(level, args) {
  const timestamp = new Date().toISOString();
  const entry = {
    timestamp,
    level,
    service: process.env.SERVICE_NAME || "gcz-bot",
  };

  const messageParts = [];
  let meta = {};
  let errorPayload;

  for (const arg of args) {
    if (arg instanceof Error) {
      errorPayload = normalizeError(arg);
      continue;
    }

    if (arg && typeof arg === "object") {
      meta = { ...meta, ...arg };
      continue;
    }

    messageParts.push(String(arg));
  }

  if (messageParts.length > 0) {
    entry.message = messageParts.join(" ");
  }

  if (Object.keys(meta).length > 0) {
    Object.assign(entry, meta);
  }

  if (errorPayload) {
    entry.error = errorPayload;
  }

  return entry;
}

function logLevel(level, ...args) {
  if (LEVELS[level] < ACTIVE_LEVEL) return;
  const entry = buildEntry(level, args);
  const payload = JSON.stringify(entry);
  if (level === "error") {
    console.error(payload);
    return;
  }
  console.log(payload);
}

export const logger = {
  info: (...args) => logLevel("info", ...args),
  warn: (...args) => logLevel("warn", ...args),
  error: (...args) => logLevel("error", ...args),
  debug: (...args) => logLevel("debug", ...args),
};

export function log(scope, message, error = null, meta = null) {
  const level = error ? "error" : "info";
  const payload = {
    timestamp: new Date().toISOString(),
    level,
    service: process.env.SERVICE_NAME || "gcz-bot",
    scope,
    message,
  };

  if (meta && typeof meta === "object") {
    Object.assign(payload, meta);
  }

  if (error) {
    payload.error = normalizeError(error) || { message: String(error) };
    console.error(JSON.stringify(payload));
    return;
  }

  console.log(JSON.stringify(payload));
}
