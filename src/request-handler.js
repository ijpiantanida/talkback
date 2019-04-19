const fetch = require("node-fetch")

import Tape from "./tape"
import Options, {RecordMode, FallbackMode} from "./options"
import ErrorRate from "./features/error-rate"

export default class RequestHandler {
  constructor(tapeStore, options) {
    this.tapeStore = tapeStore
    this.options = options
    this.errorRate = new ErrorRate(this.options)
  }
  
  async handle(req) {
    const recordIsAValue = typeof (this.options.record) !== 'function'
    const recordMode = recordIsAValue ? this.options.record : this.options.record(req)
    
    Options.validateRecord(recordMode)
    
    let newTape = new Tape(req, this.options)
    let matchingTape = this.tapeStore.find(newTape)
    let resObj, responseTape
    
    if (recordMode !== RecordMode.OVERWRITE && matchingTape) {
      responseTape = matchingTape

      if(this.errorRate.shouldSimulate(req, matchingTape)) {
        return this.errorRate.simulate(req)
      }

      const latencyGenerator = matchingTape.meta.latency || this.options.latency
      await this.applyLatency(req, latencyGenerator)

    } else {
      if (matchingTape) {
        responseTape = matchingTape
      } else {
        responseTape = newTape
      }
      
      if (recordMode === RecordMode.NEW || recordMode === RecordMode.OVERWRITE) {
        resObj = await this.makeRealRequest(req)
        responseTape.res = {...resObj}
        this.tapeStore.save(responseTape)
      } else {
        resObj = await this.onNoRecord(req)
        responseTape.res = {...resObj}
      }
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
    const fallbackModeIsAValue = typeof (this.options.fallbackMode) === "string"
    const fallbackMode = fallbackModeIsAValue ? this.options.fallbackMode : this.options.fallbackMode(req)
    
    Options.validateFallbackMode(fallbackMode)
    
    this.options.logger.log(`Tape for ${req.url} not found and recording is disabled (fallbackMode: ${fallbackMode})`)
    this.options.logger.log({
      url: req.url,
      headers: req.headers
    })
    
    if (fallbackMode === FallbackMode.PROXY) {
      if(this.errorRate.shouldSimulate(req, undefined)) {
        return this.errorRate.simulate(req)
      }

      await this.applyLatency(req, this.options.latency)
      return await this.makeRealRequest(req)
    }
    
    return {
      status: 404,
      headers: {'content-type': ['text/plain']},
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
  
  applyLatency(req, latencyGenerator) {
    const resolved = Promise.resolve()
    if(!latencyGenerator) {
      return resolved
    }

    Options.validateLatency(latencyGenerator)

    let latency = 0
    
    const type = typeof latencyGenerator
    if(type === 'number') {
      latency = latencyGenerator
    } else if(Array.isArray(latencyGenerator)) {
      const high = latencyGenerator[1]
      const low = latencyGenerator[0]
      latency = Math.random() * (high - low) + low
    } else {
      latency = latencyGenerator(req)
    }

    return new Promise(r => setTimeout(r, latency))
  }
}
