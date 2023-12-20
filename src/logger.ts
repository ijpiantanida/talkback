import {Options} from "./options"

export class Logger {
  static for(options: Options): Logger {
    return new Logger(options)
  }

  options: Options

  constructor(options: Options) {
    this.options = options
  }

  info(message: any) {
    if (!this.options.silent || this.options.debug) {
      console.log(this.formatMessage(message, "INFO"))
    }
  }

  debug(message: any) {
    if (this.options.debug) {
      console.debug(this.formatMessage(message, "DEBUG"))
    }
  }

  error(message: any, ...optionalParameters: any[]) {
    console.error(this.formatMessage(message, "ERROR"), ...optionalParameters)
  }

  formatMessage(message: any, level: string) {
    const now = new Date()
    const formattedNow = now.toISOString()
    let messageString: string
    if (typeof message == "object") {
      messageString = JSON.stringify(message)
    } else {
      messageString = message
    }
    return `${formattedNow} [${this.options.name}] [${level}] ${messageString}`
  }
}
