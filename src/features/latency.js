import Options from "../options";

export default class Latency {
  constructor(options) {
    this.options = options
  }

  async simulate(req, tape) {
    const resolved = Promise.resolve()

    const latencyGenerator = tape && tape.meta.latency !== undefined ? tape.meta.latency : this.options.latency
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