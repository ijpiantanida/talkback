import {Options} from "./options"

export default interface Logger {
  info(message: any): void

  error(message: any, ...optionalParameters: any[]): void

  debug(message: any): void
}

export class ConsoleLogger implements Logger {
  options: Options

  constructor(options: Options) {
    this.options = options
    if (this.options.debug) {
      this.debug("DEBUG mode active")
    }
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

export class NoopLogger implements Logger {
  debug(message: any): void {
  }

  error(message: any, ...optionalParameters: any[]): void {
  }

  info(message: any): void {
  }

}

const logger = {
  log: new NoopLogger()
}

function initializeLogger(options: Options) {
  logger.log = new ConsoleLogger(options)
}

export {logger, initializeLogger}