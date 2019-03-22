export default class Logger {
  constructor(options) {
    this.options = options;
    if(this.options.debug) {
      console.debug("DEBUG mode active")
    }
  }
  
  log(message) {
    if(!this.options.silent) {
      console.log(message)
    }
  }

  debug(message) {
    if(this.options.debug) {
      console.debug(message)
    }
  }

  error(message) {
    console.error(message)
  }
}