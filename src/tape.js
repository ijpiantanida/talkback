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

  sameRequestAs(otherTape) {
    const otherReq = otherTape.req
    const sameURL = this.req.url === otherReq.url
    if (!sameURL) {
      this.options.logger.debug(`Not same URL ${this.req.url} vs ${otherReq.url}`)
      return false
    }
    const sameMethod = this.req.method === otherReq.method
    if (!sameMethod) {
      this.options.logger.debug(`Not same METHOD ${this.req.method} vs ${otherReq.method}`)
      return false
    }
    const sameBody = this.req.body.equals(otherReq.body)
    if (!sameBody) {
      this.options.logger.debug(`Not same BODY ${this.req.body} vs ${otherReq.body}`)
      return false
    }
    const currentHeadersLength = Object.keys(this.req.headers).length
    const otherHeadersLength = Object.keys(otherReq.headers).length
    const sameNumberOfHeaders = currentHeadersLength === otherHeadersLength
    if (!sameNumberOfHeaders) {
      this.options.logger.debug(`Not same #HEADERS ${JSON.stringify(this.req.headers)} vs ${JSON.stringify(otherReq.headers)}`)
      return false
    }

    let headersSame = true
    Object.keys(this.req.headers).forEach(k => {
      const entryHeader = this.req.headers[k]
      const header = otherReq.headers[k]

      headersSame = headersSame && entryHeader === header
    })
    if (!headersSame) {
      this.options.logger.debug(`Not same HEADERS values ${JSON.stringify(this.req.headers)} vs ${JSON.stringify(otherReq.headers)}`)
    }
    return headersSame
  }
}
