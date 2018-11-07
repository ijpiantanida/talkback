import Logger from "./logger"

const defaultOptions = {
  port: 8080,
  path: "./tapes/",
  record: true,
  https: {
    enabled: false,
    keyPath: null,
    certPath: null
  },
  ignoreHeaders: [],
  ignoreQueryParams: [],
  ignoreBody: false,
  bodyMatcher: null,
  urlMatcher: null,
  responseDecorator: null,
  fallbackMode: "404",
  silent: false,
  summary: true,
  debug: false,
  https: {
    enabled: false,
    keyPath: null,
    certPath: null
  }
}

export default class Options {
  static prepare(usrOpts) {
    const opts = {
      ...defaultOptions,
      ...usrOpts
    }

    if (opts.bodyMatcher) {
      opts.ignoreHeaders.push("content-length")
    }

    opts.logger = new Logger(opts)

    return opts;
  }
}