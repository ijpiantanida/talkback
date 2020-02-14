const zlib = require("zlib")
import {expect} from "chai"

import TapeRenderer from "../src/tape-renderer"
import Options from "../src/options"

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
      "accept": "text/unknown",
      "content-type": "text/plain",
      "x-ignored": "1"
    },
    body: "ABC"
  },
  res: {
    status: 200,
    headers: {
      "content-type": ["text/unknown"],
      "x-ignored": ["2"]
    },
    body: Buffer.from("Hello").toString("base64")
  }
}

const opts = Options.prepare({
  ignoreHeaders: ["x-ignored"],
  ignoreQueryParams: ["ignored1", "ignored2"],
})

let tape

describe("TapeRenderer", () => {
  beforeEach(async () => {
    tape = await TapeRenderer.fromStore(raw, opts)
  })

  describe(".fromStore", () => {
    it("creates a tape from the raw file data with req and res human readable", () => {
      expect(tape.req.url).to.eq("/foo/bar/1?real=3")
      expect(tape.req.headers["accept"]).to.eq("text/unknown")
      expect(tape.req.headers["x-ignored"]).to.be.undefined
      expect(tape.req.body.equals(Buffer.from("ABC"))).to.be.true

      expect(tape.res.headers["content-type"]).to.eql(["text/unknown"])
      expect(tape.res.headers["x-ignored"]).to.eql(["2"])
      expect(tape.res.body.equals(Buffer.from("Hello"))).to.be.true
    })

    it("creates a tape from the raw file data with req and res not human readable", async () => {
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

      const tape = await TapeRenderer.fromStore(newRaw, opts)

      expect(tape.req.url).to.eq("/foo/bar/1?real=3")
      expect(tape.req.headers["accept"]).to.eq("text/unknown")
      expect(tape.req.headers["x-ignored"]).to.be.undefined
      expect(tape.req.body.equals(Buffer.from("Hello"))).to.be.true

      expect(tape.res.headers["content-type"]).to.eql(["text/unknown"])
      expect(tape.res.headers["x-ignored"]).to.eql(["2"])
      expect(tape.res.body.equals(Buffer.from("ABC"))).to.be.true
    })

    it("can read pretty JSON", async () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          reqHumanReadable: true,
          resHumanReadable: true
        },
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers,
            "content-type": "application/json",
            "content-length": 20
          },
          body: {
            param: "value",
            nested: {
              param2: 3
            }
          }
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            "content-type": ["application/json"],
            "content-length": [20]
          },
          body: {
            foo: "bar",
            utf8: "🔤",
            nested: {
              fuu: 3
            }
          }
        }
      }

      let tape = await TapeRenderer.fromStore(newRaw, opts)
      expect(tape.req.body).to.eql(Buffer.from(JSON.stringify(newRaw.req.body, null, 2)))

      expect(tape.res.body).to.eql(Buffer.from(JSON.stringify(newRaw.res.body, null, 2)))
      expect(tape.res.headers["content-length"]).to.eql(["68"])

      delete newRaw.res.headers["content-length"]
      tape = await TapeRenderer.fromStore(newRaw, opts)
      expect(tape.res.headers["content-length"]).to.eql(undefined)
    })
  })

  describe("#render", () => {
    it("renders a tape", async () => {
      const rawDup = {
        ...raw,
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers
          }
        }
      }
      delete rawDup.req.headers["x-ignored"]
      const tapeRenderer = await new TapeRenderer(tape)
      expect(await tapeRenderer.render()).to.eql(rawDup)
    })

    it("renders json response as an object", async () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          resHumanReadable: true
        },
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers
          }
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            "content-type": ["application/json"],
            "content-length": [20]
          },
          body: {
            foo: "bar",
            nested: {
              fuu: 3
            }
          }
        }
      }
      const newTape = await TapeRenderer.fromStore(newRaw, opts)

      delete newRaw.req.headers["x-ignored"]
      const tapeRenderer = new TapeRenderer(newTape)
      expect(await tapeRenderer.render()).to.eql(newRaw)
    })

    it("renders tapes with empty bodies", async () => {
      const newRaw = {
        ...raw,
        req: {
          ...raw.req,
          body: "",
          method: "HEAD",
          headers: {
            ...raw.req.headers,
            "content-type": ["application/json"]
          }
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            "content-type": ["application/json"]
          },
          body: ""
        }
      }
      const newTape = await TapeRenderer.fromStore(newRaw, opts)

      delete newRaw.req.headers["x-ignored"]
      const tapeRenderer = new TapeRenderer(newTape)
      expect(await tapeRenderer.render()).to.eql(newRaw)
    })

    it("renders pretty prints tapes with JSON gzip compressed bodies", async () => {
      const newRaw = {
        ...raw,
        meta: {
          ...raw.meta,
          resHumanReadable: true,
          resUncompressed: true
        },
        req: {
          ...raw.req,
          headers: {
            ...raw.req.headers
          }
        },
        res: {
          ...raw.res,
          headers: {
            ...raw.res.headers,
            "content-type": ["application/json"],
            "content-length": [20],
            "content-encoding": ["gzip"]
          },
          body: {
            foo: "bar",
            nested: {
              fuu: 3
            }
          }
        }
      }
      const newTape = await TapeRenderer.fromStore(newRaw, opts)
      const bodyAsJson = JSON.stringify(newRaw.res.body, null, 2)
      const zipped = zlib.gzipSync(Buffer.from(bodyAsJson))
      expect(newTape.res.body).to.eql(zipped)

      delete newRaw.req.headers["x-ignored"]
      const tapeRenderer = new TapeRenderer(newTape)
      expect(await tapeRenderer.render()).to.eql(newRaw)
    })
  })
})
