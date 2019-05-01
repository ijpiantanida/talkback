import Options from "../options";

export default class ErrorRate {
  constructor(options) {
    this.options = options
  }

  shouldSimulate(req, tape) {
    const isErrorRateAValue = typeof (this.options.errorRate) !== 'function'
    const globalErrorRate = isErrorRateAValue ? this.options.errorRate : this.options.errorRate(req)

    const errorRate = tape && tape.meta.errorRate !== undefined ? tape.meta.errorRate : globalErrorRate

    Options.validateErrorRate(errorRate)

    const random = Math.random() * 100
    return random < errorRate
  }

  simulate(req) {
    this.options.logger.log(`Simulating error for ${req.url}`)
    return {
      status: 503,
      headers: {'content-type': ['text/plain']},
      body: "talkback - failure injection"
    }
  }
}