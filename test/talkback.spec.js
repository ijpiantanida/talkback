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
const path = require("path")
const fetch = require("node-fetch")
const del = require("del")

const RecordMode = talkback.Options.RecordMode
const FallbackMode = talkback.Options.FallbackMode

let talkbackServer, proxiedServer, currentTapeId
const proxiedPort = 8898
const proxiedHost = `http://localhost:${proxiedPort}`
const tapesPath = __dirname + "/tapes"

const talkbackPort = 8899
const talkbackHost = `http://localhost:${talkbackPort}`

const startTalkback = async (opts) => {
  const talkbackServer = talkback({
      path: tapesPath,
      port: talkbackPort,
      host: proxiedHost,
      record: RecordMode.NEW,
      silent: true,
      bodyMatcher: (tape, req) => {
        return tape.meta.tag === "echo"
      },
      responseDecorator: (tape, req) => {
        if (tape.meta.tag === "echo") {
          tape.res.body = req.body
        }

        let location = tape.res.headers["location"]
        if (location && location[0]) {
          location = location[0]
          tape.res.headers["location"] = [location.replace(proxiedHost, talkbackHost)]
        }

        return tape
      },
      ...opts
    }
  )
  await talkbackServer.start()

  currentTapeId = talkbackServer.tapeStore.currentTapeId() + 1
  return talkbackServer
}

const cleanupTapes = () => {
  // Delete all unnamed tapes
  let files = fs.readdirSync(tapesPath)
  for (let i = 0, len = files.length; i < len; i++) {
    const match = files[i].match(/unnamed-/)
    if (match !== null) {
      fs.unlinkSync(path.join(tapesPath, files[i]))
    }
  }
  const newTapesPath = path.join(tapesPath, 'new-tapes')
  del.sync(newTapesPath)
}

describe("talkback", () => {
  beforeEach(() => cleanupTapes())

  before(async () => {
    proxiedServer = testServer()
    await proxiedServer.listen(proxiedPort)
  })

  after(() => {
    if(proxiedServer) {
      proxiedServer.close()
      proxiedServer = null
    }
  })

  afterEach(() => {
    if(talkbackServer) {
      talkbackServer.close()
      talkbackServer = null
    }
  })

  describe("## record mode NEW", () => {
    it("proxies and creates a new tape when the POST request is unknown with human readable req and res", async () => {
      talkbackServer = await startTalkback({debug: true, silent: false})

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch(`${talkbackHost}/test/1`, {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${currentTapeId}.json5`))
      expect(tape.meta.reqHumanReadable).to.eq(true)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(tape.res.body).to.eql(expectedResBody)
    })

    it("proxies and creates a new tape when the GET request is unknown", async () => {
      talkbackServer = await startTalkback()

      const res = await fetch(`${talkbackHost}/test/1`, {compress: false, method: "GET"})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: null}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${currentTapeId}.json5`))
      expect(tape.meta.reqHumanReadable).to.eq(undefined)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(tape.res.body).to.eql(expectedResBody)
    })

    it("proxies and creates a new tape when the POST request is unknown with human readable req and res", async () => {
      talkbackServer = await startTalkback()

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch(`${talkbackHost}/test/1`, {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${currentTapeId}.json5`))
      expect(tape.meta.reqHumanReadable).to.eq(true)
      expect(tape.meta.resHumanReadable).to.eq(true)
      expect(tape.req.url).to.eql("/test/1")
      expect(tape.res.body).to.eql(expectedResBody)
    })

    it("proxies and creates a new tape when the HEAD request is unknown", async () => {
      talkbackServer = await startTalkback()

      const headers = {"content-type": "application/json"}
      const res = await fetch(`${talkbackHost}/test/head`, {method: "HEAD", headers})
      expect(res.status).to.eq(200)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${currentTapeId}.json5`))
      expect(tape.meta.reqHumanReadable).to.eq(undefined)
      expect(tape.meta.resHumanReadable).to.eq(undefined)
      expect(tape.req.url).to.eql("/test/head")
      expect(tape.req.body).to.eql("")
      expect(tape.res.body).to.eql("")
    })

    it("proxies and creates a new tape with a custom tape name generator", async () => {
      talkbackServer = await startTalkback(
        {
          tapeNameGenerator: (tapeNumber, tape) => {
            return path.join('new-tapes', `${tape.req.method}`, `my-tape-${tapeNumber}`)
          }
        }
      )

      const res = await fetch(`${talkbackHost}/test/1`, {compress: false, method: "GET"})

      expect(res.status).to.eq(200)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/new-tapes/GET/my-tape-${currentTapeId}.json5`))
      expect(tape.req.url).to.eql("/test/1")
    })

    it("decorates proxied responses", async () => {
      talkbackServer = await startTalkback()

      const res = await fetch(`${talkbackHost}/test/redirect/1`, {compress: false, method: "GET", redirect: "manual"})
      expect(res.status).to.eq(302)

      const location = res.headers.get("location")
      expect(location).to.eql(`${talkbackHost}/test/1`)
    })

    it("handles when the proxied server returns a 500", async () => {
      talkbackServer = await startTalkback()

      const res = await fetch(`${talkbackHost}/test/3`)
      expect(res.status).to.eq(500)

      const tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${currentTapeId}.json5`))
      expect(tape.req.url).to.eql("/test/3")
      expect(tape.res.status).to.eql(500)
    })

    it("loads existing tapes and uses them if they match", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      const res = await fetch(`${talkbackHost}/test/3`, {compress: false})
      expect(res.status).to.eq(200)

      const body = await res.json()
      expect(body).to.eql({ok: true})
    })

    it("matches and returns pretty printed tapes", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      const headers = {"content-type": "application/json"}
      const body = JSON.stringify({param1: 3, param2: {subParam: 1}})

      const res = await fetch(`${talkbackHost}/test/pretty`, {
        compress: false,
        method: "POST",
        headers,
        body
      })
      expect(res.status).to.eq(200)

      const resClone = await res.clone()

      const resBody = await res.json()
      expect(resBody).to.eql({ok: true, foo: {bar: 3}})

      const resBodyAsText = await resClone.text()
      expect(resBodyAsText).to.eql("{\n  \"ok\": true,\n  \"foo\": {\n    \"bar\": 3\n  }\n}")
    })

    it("doesn't match pretty printed tapes with different body", async () => {
      const makeRequest = async (body) => {
        let res = await fetch(`${talkbackHost}/test/pretty`, {
          compress: false,
          method: "POST",
          headers,
          body
        })
        expect(res.status).to.eq(404)
      }

      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      const headers = {"content-type": "application/json"}

      // Different nested object
      let body = JSON.stringify({param1: 3, param2: {subParam: 2}})
      await makeRequest(body)

      // Different key order
      body = JSON.stringify({param2: {subParam: 1}, param1: 3})
      await makeRequest(body)

      // Extra key
      body = JSON.stringify({param1: 3, param2: {subParam: 1}, param3: false})
      await makeRequest(body)
    })

    it("decorates the response of an existing tape", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      const headers = {"content-type": "application/json"}
      const body = JSON.stringify({text: "my-test"})

      const res = await fetch(`${talkbackHost}/test/echo`, {
        compress: false,
        method: "POST",
        headers,
        body
      })
      expect(res.status).to.eq(200)

      const resBody = await res.json()
      expect(resBody).to.eql({text: "my-test"})
    })
  })

  describe("## record mode OVERWRITE", () => {
    it("overwrites an existing tape", async () => {
      talkbackServer = await startTalkback({
        record: RecordMode.OVERWRITE,
        ignoreHeaders: ["x-talkback-ping"],
        silent: false,
        debug: true
      })

      const nextTapeId = currentTapeId

      let headers = {"x-talkback-ping": "test1"}

      let res = await fetch(`${talkbackHost}/test/1`, {compress: false, headers})
      expect(res.status).to.eq(200)
      let resBody = await res.json()
      let expectedBody = {ok: true, body: "test1"}
      expect(resBody).to.eql(expectedBody)

      let tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${nextTapeId}.json5`))
      expect(tape.req.url).to.eql("/test/1")
      expect(tape.res.body).to.eql(expectedBody)

      headers = {"x-talkback-ping": "test2"}

      res = await fetch(`${talkbackHost}/test/1`, {compress: false, headers})
      expect(res.status).to.eq(200)
      resBody = await res.json()
      expectedBody = {ok: true, body: "test2"}
      expect(resBody).to.eql(expectedBody)

      tape = JSON5.parse(fs.readFileSync(tapesPath + `/unnamed-${nextTapeId}.json5`))
      expect(tape.req.url).to.eql("/test/1")
      expect(tape.res.body).to.eql(expectedBody)
    })
  })

  describe("## record mode DISABLED", () => {
    it("returns a 404 on unkwown request with fallbackMode NOT_FOUND (default)", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      const res = await fetch(`${talkbackHost}/test/1`, {compress: false})
      expect(res.status).to.eq(404)
    })

    it("proxies request to host on unkwown request with fallbackMode PROXY", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED, fallbackMode: FallbackMode.PROXY})

      const reqBody = JSON.stringify({foo: "bar"})
      const headers = {"content-type": "application/json"}
      const res = await fetch(`${talkbackHost}/test/1`, {compress: false, method: "POST", headers, body: reqBody})
      expect(res.status).to.eq(200)

      const expectedResBody = {ok: true, body: {foo: "bar"}}
      const body = await res.json()
      expect(body).to.eql(expectedResBody)

      expect(fs.existsSync(tapesPath + "/unnamed-3.json5")).to.eq(false)
    })
  })

  describe("error handling", () => {
    afterEach(() => td.reset())

    it("returns a 500 if anything goes wrong", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})
      td.replace(talkbackServer, "tapeStore", {
        find: () => {
          throw "Test error"
        }
      })

      const res = await fetch(`${talkbackHost}/test/1`, {compress: false})
      expect(res.status).to.eq(500)
    })
  })

  describe("summary printing", () => {
    let log
    beforeEach(() => {
      log = td.replace(console, 'log')
    })

    afterEach(() => td.reset())

    it("prints the summary when enabled", async () => {
      talkbackServer = await startTalkback({summary: true})
      talkbackServer.close()

      td.verify(log(td.matchers.contains("SUMMARY")))
    })

    it("doesn't print the summary when disabled", async () => {
      talkbackServer = await startTalkback({summary: false})
      talkbackServer.close()

      td.verify(log(td.matchers.contains("SUMMARY")), {times: 0})
    })
  })

  describe("tape usage information", () => {
    it("should indicate that a tape has been used after usage", async () => {
      talkbackServer = await startTalkback({record: RecordMode.DISABLED})

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json5')).to.eq(false)

      const res = await fetch(`${talkbackHost}/test/3`, {compress: false})
      expect(res.status).to.eq(200)

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json5')).to.eq(true)

      talkbackServer.resetTapeUsage()

      expect(talkbackServer.hasTapeBeenUsed('saved-request.json5')).to.eq(false)

      const body = await res.json()
      expect(body).to.eql({ok: true})
    })
  })

  describe("https", () => {
    it("should be able to run a https server", async () => {
      const options = {
        record: RecordMode.DISABLED,
        https: {
          enabled: true,
          keyPath: "./example/httpsCert/localhost.key",
          certPath: "./example/httpsCert/localhost.crt"
        }
      }
      talkbackServer = await startTalkback(options)

      // Disable self-signed certificate check
      process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0"

      const res = await fetch(`https://localhost:${talkbackPort}/test/3`, {compress: false})

      expect(res.status).to.eq(200)
    })
  })
})
