var talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../dist")
}

function recordMode(req) {
  return process.env.RECORD === "true" ? talkback.Options.RecordMode.NEW : talkback.Options.RecordMode.DISABLED
}

function isCartRequest(req) {
  return req.url.match(/\/carts\/[a-zA-Z-0-9]+/)
}

function isSequentialMode(req) {
  return isCartRequest(req)
}

var server = talkback({
  host: "http://fake-server.localhost",
  path: __dirname + "/tapes",
  record: recordMode,
  debug: true,
  name: "Example - Stateful",
  ignoreHeaders: ["user-agent"],
  alpha: {
    sequentialMode: isSequentialMode,
  }
})

server.start()
