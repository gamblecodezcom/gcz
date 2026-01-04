const COLORS = {
  reset: "\x1b[0m",
  dim: "\x1b[2m",
  fg: {
    cyan: "\x1b[36m",
    yellow: "\x1b[33m",
    red: "\x1b[31m",
    green: "\x1b[32m",
    magenta: "\x1b[35m"
  }
};

export function log(scope, message, error = null) {
  const time = new Date().toISOString();
  const color =
    scope === "bot" ? COLORS.fg.cyan :
    scope === "health" ? COLORS.fg.green :
    scope === "routes" ? COLORS.fg.magenta :
    scope === "error" ? COLORS.fg.red :
    COLORS.fg.yellow;

  const prefix = `${COLORS.dim}[${time}]${COLORS.reset} ${color}[${scope}]${COLORS.reset}`;

  if (error) {
    console.error(prefix, message, "\n", error);
  } else {
    console.log(prefix, message);
  }
}
