export default class Logger {
  options: any;
  
  constructor(options: any) {
    this.options = options;
    if(this.options.debug) {
      console.debug("DEBUG mode active")
    }
  }
  
  log(message: any) {
    if(!this.options.silent) {
      console.log(message)
    }
  }

  debug(message: any) {
    if(this.options.debug) {
      console.debug(message)
    }
  }

  error(message: any) {
    console.error(message)
  }
}