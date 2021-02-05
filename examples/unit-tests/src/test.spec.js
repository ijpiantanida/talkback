const assert = require("assert")
const fetch = require("node-fetch")

describe("A test that depends on talkback", () => {
  it("works", async () => {
    const result = await fetch("http://localhost:8080")

    assert.strictEqual(result.status, 200)
  })
})
