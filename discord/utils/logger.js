const logLevels = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const currentLevel = logLevels[process.env.LOG_LEVEL?.toLowerCase() || 'info'] || 2;

export const logger = {
  error: (...args) => {
    if (currentLevel >= logLevels.error) {
      console.error('[DISCORD]', new Date().toISOString(), ...args);
    }
  },
  warn: (...args) => {
    if (currentLevel >= logLevels.warn) {
      console.warn('[DISCORD]', new Date().toISOString(), ...args);
    }
  },
  info: (...args) => {
    if (currentLevel >= logLevels.info) {
      console.log('[DISCORD]', new Date().toISOString(), ...args);
    }
  },
  debug: (...args) => {
    if (currentLevel >= logLevels.debug) {
      console.log('[DISCORD]', new Date().toISOString(), ...args);
    }
  },
};
