const http = require("http")

import RequestHandler from "./request-handler"
import Summary from "./summary"
import TapeStore from "./tape-store"

export default class TalkbackServer {
  constructor(options) {
    this.options = options
    this.tapeStore = new TapeStore(this.options)
  }

  handleRequest(req, res) {
    let reqBody = []
    req.on("data", (chunk) => {
      reqBody.push(chunk)
    }).on("end", async () => {
      try {
        reqBody = Buffer.concat(reqBody)
        req.body = reqBody
        const requestHandler = new RequestHandler(this.tapeStore, this.options)
        const fRes = await requestHandler.handle(req)

        res.writeHead(fRes.status, fRes.headers)
        res.end(fRes.body)
      } catch (ex) {
        console.error("Error handling request", ex)
        res.statusCode = 500
        res.end()
      }
    })
  }

  start(callback) {
    this.tapeStore.load()
    this.server = http.createServer(this.handleRequest.bind(this))
    console.log(`Starting talkback on ${this.options.port}`)
    this.server.listen(this.options.port, callback)

    const closeSignalHandler = this.close.bind(this)
    process.on("exit", closeSignalHandler)
    process.on("SIGINT", closeSignalHandler)
    process.on("SIGTERM", closeSignalHandler)

    return this.server
  }

  hasTapeBeenUsed(tapeName) {
    return this.tapeStore.hasTapeBeenUsed(tapeName);
  }

  resetTapeUsage() {
    this.tapeStore.resetTapeUsage();
  }

  close(callback) {
    if (this.closed) {
      return
    }
    this.closed = true
    this.server.close(callback)

    if (this.options.summary) {
      const summary = new Summary(this.tapeStore.tapes)
      summary.print()
    }
  }
}
