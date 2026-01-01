// utils/logger.js
// GambleCodez Production Logger (ESM Safe)

const COLORS = {
  reset: "\x1b[0m",
  gray: "\x1b[90m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  green: "\x1b[32m",
  cyan: "\x1b[36m"
};

function timestamp() {
  return new Date().toISOString();
}

function base(level, color, ...args) {
  const prefix = `${COLORS.gray}[${timestamp()}]${COLORS.reset}`;
  const tag = `${color}${level.toUpperCase()}${COLORS.reset}`;
  console.log(prefix, tag, ...args);
}

export function info(...args) {
  base("info", COLORS.green, ...args);
}

export function warn(...args) {
  base("warn", COLORS.yellow, ...args);
}

export function error(...args) {
  base("error", COLORS.red, ...args);
}

export function debug(...args) {
  if (process.env.DEBUG === "true") {
    base("debug", COLORS.cyan, ...args);
  }
}

// Default export for convenience
export default {
  info,
  warn,
  error,
  debug
};
