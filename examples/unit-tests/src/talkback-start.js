var talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../../dist")
}

var host = "http://localhost:8080"

module.exports = function talkbackStart() {
  var server = talkback({
    host: host,
    port: 8080,
    path: __dirname + "/tapes",
    record: talkback.Options.RecordMode.DISABLED,
    ignoreHeaders: ["user-agent", "referer", "accept", "accept-encoding", "connection"]
  })

  server.start()

  return server
}
