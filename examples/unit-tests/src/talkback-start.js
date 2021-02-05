let talkback
if (process.env.USE_NPM) {
  talkback = require("talkback")
  console.log("Using NPM talkback")
} else {
  talkback = require("../../../dist")
}

let talkbackInstance

module.exports = function talkbackStart() {
  if (!talkbackInstance) {
    talkbackInstance = talkback({
      host: "http://localhost:8080",
      port: 8080,
      path: __dirname + "/tapes",
      record: talkback.Options.RecordMode.DISABLED,
      ignoreHeaders: ["user-agent", "referer", "accept", "accept-encoding", "connection"]
    })

    talkbackInstance.start()
  }

  return talkbackInstance
}
