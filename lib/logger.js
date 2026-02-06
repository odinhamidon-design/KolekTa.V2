/**
 * Lightweight structured logger for Kolek-Ta.
 *
 * Log levels: error > warn > info > debug
 * In production, debug messages are suppressed.
 * All messages include ISO timestamp and level prefix.
 */

const LOG_LEVELS = { error: 0, warn: 1, info: 2, debug: 3 };

const currentLevel = process.env.NODE_ENV === 'production' ? 'warn' : 'debug';

function shouldLog(level) {
  return LOG_LEVELS[level] <= LOG_LEVELS[currentLevel];
}

function formatMessage(level, msg, ...args) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return [prefix, msg, ...args];
}

const logger = {
  error(msg, ...args) {
    if (shouldLog('error')) console.error(...formatMessage('error', msg, ...args));
  },
  warn(msg, ...args) {
    if (shouldLog('warn')) console.warn(...formatMessage('warn', msg, ...args));
  },
  info(msg, ...args) {
    if (shouldLog('info')) console.log(...formatMessage('info', msg, ...args));
  },
  debug(msg, ...args) {
    if (shouldLog('debug')) console.log(...formatMessage('debug', msg, ...args));
  },
};

module.exports = logger;
