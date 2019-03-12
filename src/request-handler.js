const fetch = require("node-fetch")

import Tape from "./tape"

export default class RequestHandler {
  constructor(tapeStore, options) {
    this.tapeStore = tapeStore
    this.options = options
  }

  async handle(req) {
    const newTape = new Tape(req, this.options)
    let matchingTape = this.options.cache ? this.tapeStore.find(newTape) : null;
    let resObj, responseTape;

    if (matchingTape) {
      responseTape = matchingTape
    } else {
      if (this.options.record) {
        resObj = await this.makeRealRequest(req)
        newTape.res = {...resObj}
        this.tapeStore.save(newTape)
      } else {
        resObj = await this.onNoRecord(req)
        newTape.res = {...resObj}
      }
      responseTape = newTape
    }

    resObj = responseTape.res

    if (this.options.responseDecorator) {
      const resTape = this.options.responseDecorator(responseTape.clone(), req)

      if (resTape.res.headers["content-length"]) {
        resTape.res.headers["content-length"] = resTape.res.body.length
      }
      resObj = resTape.res
    }

    return resObj
  }

  async onNoRecord(req) {
    const fallbackMode = this.options.fallbackMode
    this.options.logger.log(`Tape for ${req.url} not found and recording is disabled (fallbackMode: ${fallbackMode})`)
    this.options.logger.log({
      url: req.url,
      headers: req.headers
    })

    if (fallbackMode === "proxy") {
      return await this.makeRealRequest(req)
    }

    return {
      status: 404,
      headers: [],
      body: "talkback - tape not found"
    }
  }

  async makeRealRequest(req) {
    let {method, url, body} = req
    const headers = {...req.headers}
    delete headers.host

    const host = this.options.host
    this.options.logger.log(`Making real request to ${host}${url}`)

    if (method === "GET" || method === "HEAD") {
      body = null
    }

    const fRes = await fetch(host + url, {method, headers, body, compress: false, redirect: "manual"})
    const buff = await fRes.buffer()
    return {
      status: fRes.status,
      headers: fRes.headers.raw(),
      body: buff
    }
  }
}