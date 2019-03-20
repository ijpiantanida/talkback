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

const tape = TapeRenderer.fromStore(raw, opts)

describe("TapeRenderer", () => {
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

      const tape = TapeRenderer.fromStore(newRaw, opts)

      expect(tape.req.url).to.eq("/foo/bar/1?real=3")
      expect(tape.req.headers["accept"]).to.eq("text/unknown")
      expect(tape.req.headers["x-ignored"]).to.be.undefined
      expect(tape.req.body.equals(Buffer.from("Hello"))).to.be.true

      expect(tape.res.headers["content-type"]).to.eql(["text/unknown"])
      expect(tape.res.headers["x-ignored"]).to.eql(["2"])
      expect(tape.res.body.equals(Buffer.from("ABC"))).to.be.true
    })

    it("can read pretty JSON", () => {
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

      let tape = TapeRenderer.fromStore(newRaw, opts)
      expect(tape.req.body).to.eql(Buffer.from(JSON.stringify(newRaw.req.body, null, 2)))

      expect(tape.res.body).to.eql(Buffer.from(JSON.stringify(newRaw.res.body, null, 2)))
      expect(tape.res.headers["content-length"]).to.eql([68])

      delete newRaw.res.headers["content-length"]
      tape = TapeRenderer.fromStore(newRaw, opts)
      expect(tape.res.headers["content-length"]).to.eql(undefined)
    })
  })

  describe("#render", () => {
    it("renders a tape", () => {
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

      expect(new TapeRenderer(tape).render()).to.eql(rawDup)
    })

    it("renders json response as an object", () => {
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
      const newTape = TapeRenderer.fromStore(newRaw, opts)

      delete newRaw.req.headers["x-ignored"]
      expect(new TapeRenderer(newTape).render()).to.eql(newRaw)
    })

    it("renders tapes with empty bodies", () => {
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
      const newTape = TapeRenderer.fromStore(newRaw, opts)

      delete newRaw.req.headers["x-ignored"]
      expect(new TapeRenderer(newTape).render()).to.eql(newRaw)
    })
  })
})
