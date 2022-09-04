const logger = {
  warn: (...args) => console.warn(...args),
  info: (...args) => console.info(...args),
  log: (...args) => console.log(...args),
  err: (...args) => console.error(...args),
  error: (...args) => console.error(...args),
}

module.exports = logger
