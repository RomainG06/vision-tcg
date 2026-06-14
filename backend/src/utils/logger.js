const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3
};

class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }
  
  error(message, ...args) {
    if (this.level >= LOG_LEVELS.error) {
      console.error(`[ERROR] ${new Date().toISOString()}`, message, ...args);
    }
  }
  
  warn(message, ...args) {
    if (this.level >= LOG_LEVELS.warn) {
      console.warn(`[WARN]  ${new Date().toISOString()}`, message, ...args);
    }
  }
  
  info(message, ...args) {
    if (this.level >= LOG_LEVELS.info) {
      console.log(`[INFO]  ${new Date().toISOString()}`, message, ...args);
    }
  }
  
  debug(message, ...args) {
    if (this.level >= LOG_LEVELS.debug) {
      console.log(`[DEBUG] ${new Date().toISOString()}`, message, ...args);
    }
  }
}

export const logger = new Logger(process.env.LOG_LEVEL || 'info');
