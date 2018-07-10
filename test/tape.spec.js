import Tape from "../src/tape"
import Logger from "../src/logger"

const raw = {
  meta: {
    createdAt: new Date(),
    reqHumanReadable: true,
    resHumanReadable: false
  },
  req: {
    url: "/foo/bar/1?real=3",
    method: "GET",
    headers: {
      "accept": "application/json",
      "x-ignored": "1"
    },
    body: "ABC"
  },
  res: {
    headers: {
      "accept": ["application/json"],
      "x-ignored": ["2"]
    },
    body: "SGVsbG8="
  }
}

const opts = {
  ignoreHeaders: ["x-ignored"],
  ignoreQueryParams: ["ignored1", "ignored2"],
  logger: new Logger({debug: true})
}

const tape = Tape.fromStore(raw, opts)

describe("Tape", () => {
  describe(".fromStore", () => {
    it("creates a tape from the raw file data with req and res human readable", () => {
      expect(tape.req.url).to.eq("/foo/bar/1?real=3")
      expect(tape.req.headers["accept"]).to.eq("application/json")
      expect(tape.req.headers["x-ignored"]).to.be.undefined
      expect(tape.req.body.equals(Buffer.from("ABC"))).to.be.true

      expect(tape.res.headers["accept"]).to.eql(["application/json"])
      expect(tape.res.headers["x-ignored"]).to.eql(["2"])
      expect(tape.res.body.equals(Buffer.from("Hello"))).to.be.true
    })

    it("creates a tape from the raw file data with req and res not human readable", () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          reqHumanReadable: false,
          resHumanReadable: true
        },
        req: {
          ...raw.req,
          body: "SGVsbG8="
        },
        res: {
          ...raw.res,
          body: "ABC"
        }
      }

      const tape = Tape.fromStore(newRaw, opts)

      expect(tape.req.url).to.eq("/foo/bar/1?real=3")
      expect(tape.req.headers["accept"]).to.eq("application/json")
      expect(tape.req.headers["x-ignored"]).to.be.undefined
      expect(tape.req.body.equals(Buffer.from("Hello"))).to.be.true

      expect(tape.res.headers["accept"]).to.eql(["application/json"])
      expect(tape.res.headers["x-ignored"]).to.eql(["2"])
      expect(tape.res.body.equals(Buffer.from("ABC"))).to.be.true
    })
  })
})
