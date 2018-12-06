import Headers from "../../src/utils/headers"

describe("Headers", () => {
  describe(".write", () => {
    it("returns the value when it's an array", () => {
      const headers = {
        "content-type": ["application/json"]
      }
      const value = Headers.read(headers, "content-type")
      expect(value).to.eql("application/json")
    })

    it("returns the value when it's just the value", () => {
      const headers = {
        "content-type": "application/json"
      }
      const value = Headers.read(headers, "content-type")
      expect(value).to.eql("application/json")
    })
  })

  describe(".write", () => {
    it("writes just the value as value when it's for req", () => {
      const headers = {}
      Headers.write(headers, "content-type", "application/json", "req")
      expect(headers["content-type"]).to.eql("application/json")
    })

    it("writes just the value as an array when it's for res", () => {
      const headers = {}
      Headers.write(headers, "content-type", "application/json", "res")
      expect(headers["content-type"]).to.eql(["application/json"])
    })
  })
})
