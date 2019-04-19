const fetch = require("node-fetch")

import Tape from "./tape"
import Options, {RecordMode, FallbackMode} from "./options"

export default class RequestHandler {
  constructor(tapeStore, options) {
    this.tapeStore = tapeStore
    this.options = options
  }
  
  async handle(req) {
    const recordIsAValue = typeof (this.options.record) !== 'function'
    const recordMode = recordIsAValue ? this.options.record : this.options.record(req)
    
    Options.validateRecord(recordMode)
    
    let newTape = new Tape(req, this.options)
    let matchingTape = this.tapeStore.find(newTape)
    let resObj, responseTape
    
    let latencyGenerator = 0 // Default to no latency. Only if we are matching we use the options/tape value
    
    if (recordMode !== RecordMode.OVERWRITE && matchingTape) {
      responseTape = matchingTape
      
      latencyGenerator = this.options.latency
      const tapeLatencyGenerator = matchingTape.meta.latency;
      if( tapeLatencyGenerator !== undefined ) {
        latencyGenerator = tapeLatencyGenerator
      }
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
    
    const latency = this.getLatencyValue(req, latencyGenerator)
    if(latency > 0) {
      await new Promise(r => setTimeout(r, latency))
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
  
  getLatencyValue(req, latencyGenerator) {
    Options.validateLatency(latencyGenerator)
    
    const type = typeof latencyGenerator
    if(type === 'number') {
      return latencyGenerator
    }
    if(Array.isArray(latencyGenerator)) {
      const high = latencyGenerator[1]
      const low = latencyGenerator[0]
      return Math.random() * (high - low) + low
    }
    
    return latencyGenerator(req)
  }
}
