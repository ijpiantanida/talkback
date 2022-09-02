import TapeStore from "./tape-store"
import { v4 as uuidv4 } from 'uuid';

const fetch = require("node-fetch")

import Tape from "./tape"
import OptionsFactory, {RecordMode, FallbackMode, Options} from "./options"
import ErrorRate from "./features/error-rate"
import Latency from "./features/latency"
import {HttpRequest, HttpResponse, MatchingContext} from "./types"
import {Logger} from "./logger"

export default class RequestHandler {
  private readonly tapeStore: TapeStore
  private readonly options: Options
  private readonly errorRate: ErrorRate
  private readonly latency: Latency
  private readonly logger: Logger;

  constructor(tapeStore: TapeStore, options: Options) {
    this.tapeStore = tapeStore
    this.options = options
    this.errorRate = new ErrorRate(this.options)
    this.latency = new Latency(this.options)
    this.logger = Logger.for(this.options)
  }

  async handle(req: HttpRequest): Promise<HttpResponse> {
    const matchingContext: MatchingContext = {
      id: uuidv4()
    }
    const recordMode = typeof (this.options.record) === "string" ? this.options.record : this.options.record(req)

    OptionsFactory.validateRecord(recordMode)

    if (this.options.requestDecorator) {
      req = this.options.requestDecorator(req, matchingContext)
      if (!req) {
        throw new Error("requestDecorator didn't return a req object")
      }
    }

    let newTape = new Tape(req, this.options)
    let matchingTape = this.tapeStore.find(newTape)
    let resObj, responseTape

    if (recordMode !== RecordMode.OVERWRITE && matchingTape) {
      responseTape = matchingTape

      if (this.errorRate.shouldSimulate(req, matchingTape)) {
        return this.errorRate.simulate(req)
      }

      await this.latency.simulate(req, matchingTape)
    } else {
      if (matchingTape) {
        responseTape = matchingTape
      } else {
        responseTape = newTape
      }

      if (recordMode === RecordMode.NEW || recordMode === RecordMode.OVERWRITE) {
        resObj = await this.makeRealRequest(req)
        responseTape.res = {...resObj}
        if (this.options.tapeDecorator) {
          responseTape = this.options.tapeDecorator(responseTape, matchingContext)
          if (!responseTape) {
            throw new Error("tapeDecorator didn't return a tape object")
          }
        }
        await this.tapeStore.save(responseTape)
      } else {
        resObj = await this.onNoRecord(req)
        responseTape.res = {...resObj}
      }
    }

    resObj = responseTape.res

    if (this.options.responseDecorator) {
      const clonedTape = await responseTape.clone()
      const resTape = this.options.responseDecorator(clonedTape, req, matchingContext)
      if (!resTape) {
        throw new Error("responseDecorator didn't return a tape object")
      }

      if (resTape.res.headers["content-length"]) {
        resTape.res.headers["content-length"] = resTape.res.body.length
      }
      resObj = resTape.res
    }

    return resObj
  }

  private async onNoRecord(req: HttpRequest) {
    const fallbackMode = typeof (this.options.fallbackMode) === "string" ? this.options.fallbackMode : this.options.fallbackMode(req)

    OptionsFactory.validateFallbackMode(fallbackMode)

    this.logger.info(`Tape for ${req.url} not found and recording is disabled (fallbackMode: ${fallbackMode})`)
    this.logger.info({
      url: req.url,
      headers: req.headers
    })

    if (fallbackMode === FallbackMode.PROXY) {
      if (this.errorRate.shouldSimulate(req, undefined)) {
        return this.errorRate.simulate(req)
      }

      await this.latency.simulate(req, undefined)
      return await this.makeRealRequest(req)
    }

    return {
      status: 404,
      headers: {"content-type": ["text/plain"]},
      body: Buffer.from("talkback - tape not found")
    } as HttpResponse
  }

  private async makeRealRequest(req: HttpRequest) {
    let fetchBody: Buffer | null
    let {method, url, body} = req
    fetchBody = body
    const headers = {...req.headers}
    delete headers.host

    const host = this.options.host
    this.logger.info(`Making real request to ${host}${url}`)

    if (method === "GET" || method === "HEAD") {
      fetchBody = null
    }

    const fRes = await fetch(host + url, {method, headers, body: fetchBody, compress: false, redirect: "manual"})
    const buff = await fRes.buffer()
    return {
      status: fRes.status,
      headers: fRes.headers.raw(),
      body: buff
    } as HttpResponse
  }
}
