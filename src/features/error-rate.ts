import OptionsFactory, {Options} from "../options"
import Tape from "../tape"
import {Req, Res} from "../types"
import {logger} from "../logger"

export default class ErrorRate {
  private options: Options

  constructor(options: Options) {
    this.options = options
  }

  shouldSimulate(req:Req, tape?: Tape) {
    const globalErrorRate = typeof (this.options.errorRate) === 'number' ? this.options.errorRate : this.options.errorRate(req)

    const errorRate = tape && tape.meta.errorRate !== undefined ? tape.meta.errorRate : globalErrorRate

    OptionsFactory.validateErrorRate(errorRate)

    const random = Math.random() * 100
    return random < errorRate
  }

  simulate(req: Req) {
    logger.log.info(`Simulating error for ${req.url}`)
    return {
      status: 503,
      headers: {'content-type': ['text/plain']},
      body: Buffer.from("talkback - failure injection")
    } as Res
  }
}
