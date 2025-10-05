/**
 * Logger Utility
 * Centralized logging with different levels and formatting
 */

const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3
};

class Logger {
  constructor(context = 'TestRunner') {
    this.context = context;
    this.level = LOG_LEVELS.INFO;
    this.isDevelopment = false; // Set to true for verbose logging
  }

  setLevel(level) {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.INFO;
  }

  setDevelopmentMode(enabled) {
    this.isDevelopment = enabled;
  }

  _log(level, message, ...args) {
    if (LOG_LEVELS[level] < this.level && !this.isDevelopment) {
      return;
    }

    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${this.context}] [${level}]`;

    switch (level) {
      case 'DEBUG':
        console.debug(prefix, message, ...args);
        break;
      case 'INFO':
        console.info(prefix, message, ...args);
        break;
      case 'WARN':
        console.warn(prefix, message, ...args);
        break;
      case 'ERROR':
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message, ...args) {
    this._log('DEBUG', message, ...args);
  }

  info(message, ...args) {
    this._log('INFO', message, ...args);
  }

  warn(message, ...args) {
    this._log('WARN', message, ...args);
  }

  error(message, ...args) {
    this._log('ERROR', message, ...args);
  }

  group(label) {
    console.group(`[${this.context}] ${label}`);
  }

  groupEnd() {
    console.groupEnd();
  }

  table(data) {
    console.table(data);
  }
}

// Create singleton instances for different contexts
export const createLogger = (context) => new Logger(context);

export const backgroundLogger = createLogger('Background');
export const contentLogger = createLogger('Content');
export const popupLogger = createLogger('Popup');

export default Logger;
