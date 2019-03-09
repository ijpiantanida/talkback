import Logger from "./logger"

const defaultOptions = {
  port: 8080,
  path: "./tapes/",
  record: true,
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

  fallbackMode: "404",

  silent: false,
  summary: true,
  debug: false
}

export default class Options {
  static prepare(usrOpts = {}) {
    const opts = {
      ...defaultOptions,
      name: usrOpts.host,
      ...usrOpts,
      ignoreHeaders: [
        ...defaultOptions.ignoreHeaders,
        ...(usrOpts.ignoreHeaders || [])
      ]
    }

    opts.logger = new Logger(opts)

    return opts
  }
}
