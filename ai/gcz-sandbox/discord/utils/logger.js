const LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const envLevel =
  typeof process.env.LOG_LEVEL === 'string'
    ? process.env.LOG_LEVEL.toLowerCase()
    : 'info';

const currentLevel =
  Object.prototype.hasOwnProperty.call(LEVELS, envLevel)
    ? LEVELS[envLevel]
    : LEVELS.info;

function ts() {
  return new Date().toISOString();
}

export const logger = {
  error: (...args) => {
    if (currentLevel >= LEVELS.error) {
      console.error(`[DISCORD] ${ts()} ERROR`, ...args);
    }
  },

  warn: (...args) => {
    if (currentLevel >= LEVELS.warn) {
      console.warn(`[DISCORD] ${ts()} WARN`, ...args);
    }
  },

  info: (...args) => {
    if (currentLevel >= LEVELS.info) {
      console.log(`[DISCORD] ${ts()} INFO`, ...args);
    }
  },

  debug: (...args) => {
    if (currentLevel >= LEVELS.debug) {
      console.log(`[DISCORD] ${ts()} DEBUG`, ...args);
    }
  },
};
