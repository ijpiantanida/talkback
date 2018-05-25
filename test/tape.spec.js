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

  describe("#sameRequestAs", () => {
    const req = {
      url: "/foo/bar/1?ignored1=foo&ignored2=bar&real=3",
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-ignored": "1"
      },
      body: Buffer.from("QUJD", "base64")
    }

    it("returns true when everything is the same", () => {
      const tape2 = new Tape(req, opts)
      expect(tape.sameRequestAs(tape2)).to.be.true
    })

    it("returns true when only ignored query params change", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?ignored1=diff&real=3"}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.true
    })

    it("returns true when all query params are ignored", () => {
      const newOpts = {
        ...opts,
        ignoreQueryParams: [
          ...opts.ignoreQueryParams,
          "real"
        ]
      }
      const newTape = Tape.fromStore(raw, newOpts)
      const tape2 = new Tape({...req, url: "/foo/bar/1?ignored1=diff&real=diff"}, newOpts)
      expect(newTape.sameRequestAs(tape2)).to.be.true
    })

    it("returns true when only ignored headers change", () => {
      const headers = {
        ...req.headers,
        "x-ignored": "diff"
      }
      const tape2 = new Tape({
        ...req,
        headers
      }, opts)
      expect(tape.sameRequestAs(tape2)).to.be.true
    })

    it("returns false when the urls are different", () => {
      const tape2 = new Tape({...req, url: "/bar"}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when the query params have different values", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?real=different"}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when the query params are different", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?real=3&newParam=1"}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when the methods are different", () => {
      const tape2 = new Tape({...req, method: "POST"}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when the bodies are different", () => {
      const tape2 = new Tape({...req, body: Buffer.from("")}, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when there are more headers", () => {
      const tape2 = new Tape({
        ...req,
        headers: {
          ...req.headers,
          "foo": "bar"
        }
      }, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when there are less headers", () => {
      const headers = {...req.headers}
      delete headers["accept"]
      const tape2 = new Tape({
        ...req,
        headers
      }, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })

    it("returns false when a header has a different value", () => {
      const headers = {
        ...req.headers,
        "accept": "x-form"
      }
      const tape2 = new Tape({
        ...req,
        headers
      }, opts)
      expect(tape.sameRequestAs(tape2)).to.be.false
    })
  })
})
