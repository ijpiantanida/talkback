export default class Logger {
  constructor(options) {
    this.options = options;
  }
  
  log(message) {
    if(!this.options.silent) {
      console.log(message);
    }
  }
}