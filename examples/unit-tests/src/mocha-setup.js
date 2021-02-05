let talkbackStart = require("./talkback-start")

let talkbackInstance

exports.mochaHooks = {
  beforeAll() {
    talkbackInstance = talkbackStart()
  },
  afterAll() {
    talkbackInstance.close()
  }
}
