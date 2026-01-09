// GCZ validation helpers

export function isValidId(id) {
  return /^[0-9]+$/.test(String(id));
}

export function isNonEmpty(text) {
  return typeof text === "string" && text.trim().length > 0;
}

export function isValidCode(code) {
  return /^[A-Za-z0-9_-]{3,40}$/.test(code);
}

export function isValidUrl(url) {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

export function isValidUsername(name) {
  return /^[A-Za-z0-9_]{3,32}$/.test(name);
}