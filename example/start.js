var talkback = require("../dist/index")

var host = "https://api.github.com"
var server = talkback({
  host: host,
  path: __dirname + "/tapes",
  record: false,
  debug: false,
  ignoreQueryParams: ["t"],
  bodyMatcher: (tape, req) => {
    if (tape.meta.tag === "fake-post") {
      const tapeBody = JSON.parse(tape.req.body.toString())
      const reqBody = JSON.parse(req.body.toString())

      return tapeBody.username === reqBody.username
    }
    return false
  }
})

server.start()