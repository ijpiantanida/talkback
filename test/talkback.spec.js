let talkback
if (process.env.USE_DIST) {
  talkback = require("../dist/index")
  console.log("Using DIST talkback")
} else {
  talkback = require("../src/index").default
}
import testServer from "./support/test-server"

const JSON5 = require("json5")
const fs = require("fs")
const fetch = require("node-fetch")

let talkbackServer, proxiedServer
const proxiedPort = 8898
const proxiedHost = `http://localhost:${proxiedPort}`
const tapesPath = __dirname + "/tapes"

const startTalkback = async (opts) => {
  const talkbackServer = talkback({
      path: tapesPath,
      port: 8899,
      host: proxiedHost,
      record: true,
      silent: true,
      ...opts
    }
  )
  await talkbackServer.start()
  return talkbackServer
}

describe("talkback", async () => {
  beforeEach(async () => {
    // Delete all unnamed tapes
    const files = fs.readdirSync(tapesPath)
    for (let i = 0, len = files.length; i < len; i++) {
      const match = files[i].match(/unnamed-/)
      if (match !== null) {
        fs.unlinkSync(tapesPath + "/" + files[i])
      }
    }
  })

  before(async () => {
    proxiedServer = testServer()
    await proxiedServer.listen(proxiedPort)
  })

  after(() => {
    proxiedServer.close()
  })

  afterEach(() => {
    talkbackServer.close()
  })

  describe("## recording enabled", async () => {
    it("proxies and creates a new tape when the POST request is unknown with human readable req and res", async () => {
      talkbackServer = await startTalkback()

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch("http://localhost:8899/test/1", {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"))
      expect(tape.meta.reqHumanReadable).to.eq(true)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(JSON.parse(tape.res.body)).to.eql(expectedResBody)
    })

    it("proxies and creates a new tape when the GET request is unknown", async () => {
      talkbackServer = await startTalkback()

      const res = await fetch("http://localhost:8899/test/1", {compress: false, method: "GET"})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: null}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"))
      expect(tape.meta.reqHumanReadable).to.eq(undefined)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(JSON.parse(tape.res.body)).to.eql(expectedResBody)
    })

    it("proxies and creates a new tape when the POST request is unknown with human readable req and res", async () => {
      talkbackServer = await startTalkback()

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch("http://localhost:8899/test/1", {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"))
      expect(tape.meta.reqHumanReadable).to.eq(true)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(JSON.parse(tape.res.body)).to.eql(expectedResBody)
    })

    it("handles when the proxied server returns a 500", async () => {
      talkbackServer = await startTalkback()

      const res = await fetch("http://localhost:8899/test/3")
      expect(res.status).to.eq(500)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + "/unnamed-2.json5"))
      expect(tape.req.url).to.eql("/test/3")
      expect(tape.res.status).to.eql(500)
    })

    it("loads existing tapes and uses them if they match", async () => {
      talkbackServer = await startTalkback({record: false})

      const res = await fetch("http://localhost:8899/test/3", {compress: false})
      expect(res.status).to.eq(200)

      const body = await res.json()
      expect(body).to.eql({ok: true})
    })
  })

  describe("## recording disabled", async () => {
    it("returns a 404 on unkwown request with fallbackMode 404 (default)", async () => {
      talkbackServer = await startTalkback({record: false})

      const res = await fetch("http://localhost:8899/test/1", {compress: false})
      expect(res.status).to.eq(404)
    })

    it("proxies request to host on unkwown request with fallbackMode proxy", async () => {
      talkbackServer = await startTalkback({record: false, fallbackMode: "proxy"})

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch("http://localhost:8899/test/1", {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      expect(fs.existsSync(tapesPath + "/unnamed-2.json5")).to.eq(false)
    })
  })

  describe("error handling", async () => {
    afterEach(() => td.reset())

    it("returns a 500 if anything goes wrong", async () => {
      talkbackServer = await startTalkback({record: false})
      td.replace(talkbackServer, "tapeStore", {
        find: () => {
          throw "Test error"
        }
      })

      const res = await fetch("http://localhost:8899/test/1", {compress: false})
      expect(res.status).to.eq(500)
    })
  })

  describe("summary printing", async () => {
    let log
    beforeEach(() => {
      log = td.replace(console, 'log')
    })

    afterEach(() => td.reset())

    it("prints the summary when enabled", async () => {
      talkbackServer = await startTalkback({summary: true})
      talkbackServer.close()

      td.verify(log("===== SUMMARY ====="))
    })

    it("doesn't print the summary when disabled", async () => {
      talkbackServer = await startTalkback({summary: false})
      talkbackServer.close()

      td.verify(log("===== SUMMARY ====="), {times: 0})
    })
  })
})
