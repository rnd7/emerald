let logLevel = 0
const log = console.log
const info = console.info
const warn = console.warn
const error = console.error
window.console.log = (...args) => {
  if(logLevel>3) log(...args)
}
window.console.info = (...args) => {
  if(logLevel>2) info(...args)
}
window.console.warn = (...args) => {
  if(logLevel>1) warn(...args)
}
window.console.error = (...args) => {
  if(logLevel>0) error(...args)
}

const setLogLevel = (level) => {
  logLevel = level
}

module.exports = {
  setLogLevel
}
