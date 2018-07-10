const URL = require("url")
const querystring = require("querystring")
const bufferShim = require("buffer-shims")

export default class Tape {
  constructor(req, options) {
    this.req = {
      url: req.url,
      method: req.method,
      headers: req.headers,
      body: req.body
    }
    this.options = options
    this.headersToIgnore = ["host"].concat(this.options.ignoreHeaders)
    this.cleanupHeaders()

    this.queryParamsToIgnore = this.options.ignoreQueryParams
    this.cleanupQueryParams()

    this.meta = {
      createdAt: new Date(),
      host: this.options.host
    }
  }

  static fromStore(raw, options) {
    const req = {...raw.req}
    if (raw.meta.reqHumanReadable) {
      req.body = bufferShim.from(raw.req.body)
    } else {
      req.body = bufferShim.from(raw.req.body, "base64")
    }

    const tape = new Tape(req, options)
    tape.meta = raw.meta
    tape.res = {...raw.res}
    if (tape.meta.resHumanReadable) {
      tape.res.body = bufferShim.from(tape.res.body)
    } else {
      tape.res.body = bufferShim.from(raw.res.body, "base64")
    }
    return tape
  }

  cleanupHeaders() {
    const newHeaders = {...this.req.headers}
    this.headersToIgnore.forEach(h => delete newHeaders[h])
    this.req = {
      ...this.req,
      headers: newHeaders
    }
  }

  cleanupQueryParams() {
    if (this.queryParamsToIgnore.length === 0) {
      return
    }

    const url = URL.parse(this.req.url, {parseQueryString: true})
    if (!url.search) {
      return
    }

    const query = {...url.query}
    this.queryParamsToIgnore.forEach(q => delete query[q])

    const newQuery = querystring.stringify(query)
    if (newQuery) {
      url.query = query
      url.search = "?" + newQuery
    } else {
      url.query = null
      url.search = null
    }
    this.req.url = URL.format(url)
  }
}
