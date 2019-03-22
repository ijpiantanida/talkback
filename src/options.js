import Logger from "./logger"

export const RecordMode = {
  NEW: "NEW", // If no tape matches the request, proxy it and save the response to a tape
  OVERWRITE: "OVERWRITE", // Always proxy the request and save the response to a tape, overwriting any existing one
  DISABLED: "DISABLED", // If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response
}
RecordMode.ALL = [RecordMode.NEW, RecordMode.OVERWRITE, RecordMode.DISABLED]

export const FallbackMode = {
  NOT_FOUND: "NOT_FOUND",
  PROXY: "PROXY"
}
FallbackMode.ALL = [FallbackMode.NOT_FOUND, FallbackMode.PROXY]

const defaultOptions = {
  port: 8080,
  path: "./tapes/",
  record: RecordMode.NEW,
  name: "unnamed",
  tapeNameGenerator: null,

  https: {
    enabled: false,
    keyPath: null,
    certPath: null
  },
  ignoreHeaders: ["content-length", "host"],
  ignoreQueryParams: [],
  ignoreBody: false,

  bodyMatcher: null,
  urlMatcher: null,

  responseDecorator: null,

  fallbackMode: FallbackMode.NOT_FOUND,

  silent: false,
  summary: true,
  debug: false
}

export default class Options {
  static prepare(usrOpts = {}) {
    // We start with a default logger
    this.logger = new Logger({})

    this.checkDeprecated(usrOpts)

    const opts = {
      ...defaultOptions,
      name: usrOpts.host,
      ...usrOpts,
      ignoreHeaders: [
        ...defaultOptions.ignoreHeaders,
        ...(usrOpts.ignoreHeaders || [])
      ]
    }

    this.logger = new Logger(opts)
    opts.logger = this.logger

    this.validateOptions(opts)

    return opts
  }

  static checkDeprecated(usrOpts) {
    this.checkDeprecatedRecord(usrOpts)
    this.checkDeprecatedFallbackMode(usrOpts)
  }

  static checkDeprecatedRecord(usrOpts) {
    const value = usrOpts.record
    if (typeof (value) === 'boolean') {
      const newValue = value ? RecordMode.NEW : RecordMode.DISABLED
      usrOpts.record = newValue
      this.logger.error(`DEPRECATION NOTICE: record option will no longer accept boolean values. Replace ${value} with the string '${newValue}'.`)
    }
  }

  static checkDeprecatedFallbackMode(usrOpts) {
    const value = usrOpts.fallbackMode
    if (value === '404') {
      usrOpts.fallbackMode = FallbackMode.NOT_FOUND
      this.logger.error(`DEPRECATION NOTICE: fallbackMode option '404' has been replaced by '${FallbackMode.NOT_FOUND}'`)
    }

    if (value === 'proxy') {
      usrOpts.fallbackMode = FallbackMode.PROXY
      this.logger.error(`DEPRECATION NOTICE: fallbackMode option 'proxy' has been replaced by '${FallbackMode.PROXY}'`)
    }
  }

  static validateOptions(opts) {
    this.validateRecord(opts.record)
    this.validateFallbackMode(opts.fallbackMode)
  }

  static validateRecord(record) {
    if (typeof (record) === 'string' && !RecordMode.ALL.includes(record)) {
      throw `INVALID OPTION: record has an invalid value of '${record}'`
    }
  }

  static validateFallbackMode(fallbackMode) {
    if (typeof (fallbackMode) === 'string' && !FallbackMode.ALL.includes(fallbackMode)) {
      throw `INVALID OPTION: fallbackMode has an invalid value of '${fallbackMode}'`
    }
  }
}
