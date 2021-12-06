var talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../dist")
}

var host = "https://api.github.com"

function fallbackMode(req) {
  if (req.url.includes("/mytest")) {
    return talkback.Options.FallbackMode.PROXY
  }
  return talkback.Options.FallbackMode.NOT_FOUND
}

function bodyMatcher(tape, req) {
  if (tape.meta.tag === "fake-post") {
    var tapeBody = JSON.parse(tape.req.body.toString())
    var reqBody = JSON.parse(req.body.toString())

    return tapeBody.username === reqBody.username
  }
  return false
}

function urlMatcher(tape, req) {
  if (tape.meta.tag === "orgs-wildcard") {
    return !!req.url.match(/\/orgs\/[a-zA-Z0-9]/)
  }
  return false
}

var requestStartTime = {}

function requestDecorator(req, context) {
  requestStartTime[context.id] = new Date().getTime()

  const acceptEncoding = req.headers["accept-encoding"]
  if (acceptEncoding && acceptEncoding.includes("test")) {
    delete req.headers["accept-encoding"]
  }
  return req
}

function tapeDecorator(tape, context) {
  var originalDurationMs = new Date().getTime() - requestStartTime[context.id]
  delete requestStartTime[context.id]

  tape.meta.originalDurationMs = originalDurationMs
  tape.meta.latency = [Math.floor(0.5*originalDurationMs), Math.floor(1.5*originalDurationMs)]

  return tape
}

function responseDecorator(tape, req, context) {
  if (tape.meta.tag === "auth") {
    var tapeBody = JSON.parse(tape.res.body.toString())
    var expiration = new Date()
    expiration.setDate(expiration.getDate() + 1)
    var expirationEpoch = Math.floor(expiration.getTime() / 1000)
    tapeBody.expiration = expirationEpoch

    var newBody = JSON.stringify(tapeBody)
    tape.res.body = Buffer.from(newBody)
  }
  return tape
}

var server = talkback({
  host: host,
  path: __dirname + "/tapes",
  record: process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED,
  fallbackMode: fallbackMode,
  debug: false,
  name: "Example - Server",
  ignoreQueryParams: ["t"],
  ignoreHeaders: ["user-agent"],
  bodyMatcher: bodyMatcher,
  urlMatcher: urlMatcher,
  requestDecorator: requestDecorator,
  responseDecorator: responseDecorator,
  tapeDecorator: tapeDecorator,
  https: {
    enabled: true,
    keyPath: __dirname + "/httpsCert/localhost.key",
    certPath: __dirname + "/httpsCert/localhost.crt"
  }
})

server.start()
