import TapeMatcher from "../src/tape-matcher"
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

describe("TapeMatcher", () => {
  describe("#sameAs", () => {
    const req = {
      url: "/foo/bar/1?ignored1=foo&ignored2=bar&real=3",
      method: "GET",
      headers: {
        "accept": "application/json",
        "x-ignored": "1"
      },
      body: Buffer.from("QUJD", "base64")
    }

    it("returns true when the request body is ignored", () => {
      const newOpts = {
        ...opts,
        ignoreBody: true
      }

      const newTape = Tape.fromStore(raw, newOpts)
      const tape2 = new Tape({...req, body: "XYZ"}, newOpts)
      expect(new TapeMatcher(newTape, newOpts).sameAs(tape2)).to.be.true
    })

    it("returns true when everything is the same", () => {
      const tape2 = new Tape(req, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.true
    })

    it("returns true when only ignored query params change", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?ignored1=diff&real=3"}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.true
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
      expect(new TapeMatcher(newTape, newOpts).sameAs(tape2)).to.be.true
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
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.true
    })

    it("returns false when the urls are different", () => {
      const tape2 = new Tape({...req, url: "/bar"}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when the query params have different values", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?real=different"}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when the query params are different", () => {
      const tape2 = new Tape({...req, url: "/foo/bar/1?real=3&newParam=1"}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when the methods are different", () => {
      const tape2 = new Tape({...req, method: "POST"}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when the bodies are different", () => {
      const tape2 = new Tape({...req, body: Buffer.from("")}, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when there are more headers", () => {
      const tape2 = new Tape({
        ...req,
        headers: {
          ...req.headers,
          "foo": "bar"
        }
      }, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })

    it("returns false when there are less headers", () => {
      const headers = {...req.headers}
      delete headers["accept"]
      const tape2 = new Tape({
        ...req,
        headers
      }, opts)
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
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
      expect(new TapeMatcher(tape, opts).sameAs(tape2)).to.be.false
    })
  })
})
