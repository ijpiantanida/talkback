const assert = require("assert")
const fetch = require("node-fetch")
let talkbackStart = require("./talkback-start")

let talkback
beforeAll(() => {
  talkback = talkbackStart()
})

afterAll(() => {
  talkback.close()
})

test("works", async () => {
  const result = await fetch("http://localhost:8080")

  assert.strictEqual(result.status, 200)
})
