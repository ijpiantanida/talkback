const assert = require("node:assert/strict")
const fs = require("node:fs")
const http = require("node:http")
const os = require("node:os")
const path = require("node:path")

// Passing an isolated consumer directory verifies the installed npm artifact.
const packagePath = process.argv[2]
  ? path.join(path.resolve(process.argv[2]), "node_modules", "talkback")
  : path.join(__dirname, "..", "dist")
const talkback = require(packagePath)

function request(port, body) {
  return new Promise((resolve, reject) => {
    const req = http.request({
      hostname: "127.0.0.1",
      port,
      path: "/record",
      method: "POST",
      agent: false,
      headers: {
        "content-type": "application/json",
        "content-length": Buffer.byteLength(body)
      }
    }, res => {
      const chunks = []
      res.on("data", chunk => chunks.push(chunk))
      res.on("error", reject)
      res.on("end", () => resolve({status: res.statusCode, body: Buffer.concat(chunks)}))
    })
    req.on("error", reject)
    req.end(body)
  })
}

async function main() {
  const tapesPath = fs.mkdtempSync(path.join(os.tmpdir(), "talkback-runtime-"))
  let proxy
  let origin
  try {
    let upstreamCalls = 0
    origin = http.createServer((req, res) => {
      upstreamCalls++
      const chunks = []
      req.on("data", chunk => chunks.push(chunk))
      req.on("end", () => {
        res.writeHead(200, {"content-type": "application/json"})
        res.end(JSON.stringify({echo: JSON.parse(Buffer.concat(chunks).toString())}))
      })
    })
    await new Promise(resolve => origin.listen(0, "127.0.0.1", resolve))
    const host = `http://127.0.0.1:${origin.address().port}`
    const body = JSON.stringify({message: "Node runtime compatibility"})
    const expected = {echo: JSON.parse(body)}
    proxy = talkback({
      host,
      port: 0,
      path: tapesPath,
      silent: true,
      summary: false,
      requestDecorator(req, context) {
        assert.match(context.id, /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i)
        return req
      }
    })
    const httpServer = await proxy.start()
    if (!httpServer.listening) {
      await new Promise(resolve => httpServer.once("listening", resolve))
    }
    for (let i = 0; i < 2; i++) {
      const response = await request(httpServer.address().port, body)
      assert.equal(response.status, 200)
      assert.deepEqual(JSON.parse(response.body.toString()), expected)
    }
    assert.equal(upstreamCalls, 1, "The second request must play back the recorded tape")
    assert.equal(fs.readdirSync(tapesPath).length, 1)

    await new Promise(resolve => proxy.close(resolve))
    proxy = null
    await new Promise(resolve => origin.close(resolve))
    origin = null

    const handler = await talkback.requestHandler({
      host,
      path: tapesPath,
      record: talkback.Options.RecordMode.DISABLED,
      ignoreHeaders: ["host", "connection", "content-length"],
      silent: true,
      summary: false
    })
    const replay = await handler.handle({
      method: "POST",
      url: "/record",
      headers: {"content-type": "application/json"},
      body: Buffer.from(body)
    })
    assert.equal(replay.status, 200)
    assert.deepEqual(JSON.parse(replay.body.toString()), expected)
    console.log(`Runtime compatibility passed on ${process.version}: recording, playback, and request handler`)
  } finally {
    if (proxy) await new Promise(resolve => proxy.close(resolve))
    if (origin) await new Promise(resolve => origin.close(resolve))
    fs.rmSync(tapesPath, {recursive: true, force: true})
  }
}

main().catch(error => {
  console.error(error)
  process.exitCode = 1
})
