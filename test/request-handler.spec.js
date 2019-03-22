import RequestHandler from "../src/request-handler"
import Tape from "../src/tape"
import TapeStore from "../src/tape-store"
import Options, {FallbackMode, RecordMode} from "../src/options"

let tapeStore, reqHandler, opts, savedTape, anotherRes

const rawTape = {
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
    status: 200,
    headers: {
      "accept": ["application/json"],
      "x-ignored": ["2"]
    },
    body: Buffer.from("Hello").toString("base64")
  }
}

function prepareForExternalRequest() {
  const fakeMakeRealRequest = td.function()
  td.when(fakeMakeRealRequest(td.matchers.anything())).thenReturn(anotherRes)
  td.replace(reqHandler, "makeRealRequest", fakeMakeRealRequest)

  td.replace(tapeStore, "save")
}

describe("RequestHandler", () => {
  beforeEach(() => {
    opts = Options.prepare({debug: false, record: RecordMode.NEW})
    tapeStore = new TapeStore(opts)
    reqHandler = new RequestHandler(tapeStore, opts)

    savedTape = Tape.fromStore(rawTape, opts)
    anotherRes = {
      ...savedTape.res,
      body: Buffer.from("Foobar")
    }
  })

  describe("#handle", () => {
    context("when request opt is 'NEW'", () => {
      context("when the request matches a tape", () => {
        beforeEach(() => {
          tapeStore.tapes = [savedTape]
        })

        it("returns the matched tape response", async () => {
          const resObj = await reqHandler.handle(savedTape.req)
          expect(resObj.status).to.eql(200)
          expect(resObj.body).to.eql(Buffer.from("Hello"))
        })

        context("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.responseDecorator = (tape, req) => {
              tape.res.body = req.body
              return tape
            }
          })

          it("returns the decorated response", async () => {
            const resObj = await reqHandler.handle(savedTape.req)

            expect(resObj.status).to.eql(200)
            expect(resObj.body).to.eql(Buffer.from("ABC"))
            expect(savedTape.res.body).to.eql(Buffer.from("Hello"))
          })

          it("doesn't add a content-length header if it isn't present in the original response", async () => {
            const resObj = await reqHandler.handle(savedTape.req)

            expect(resObj.headers["content-length"]).to.be.undefined
          })

          it("updates the content-length header if it is present in the original response", async () => {
            savedTape.res.headers["content-length"] = [999]

            const resObj = await reqHandler.handle(savedTape.req)

            expect(resObj.headers["content-length"]).to.eq(3)
          })
        })
      })

      context("when the request doesn't match a tape", () => {
        beforeEach(() => {
          prepareForExternalRequest()
        })

        afterEach(() => td.reset())

        it("makes the real request and returns the response, saving the tape", async () => {
          const resObj = await reqHandler.handle(savedTape.req)
          expect(resObj.status).to.eql(200)
          expect(resObj.body).to.eql(Buffer.from("Foobar"))

          td.verify(tapeStore.save(td.matchers.anything()))
        })

        context("when there's a responseDecorator", () => {
          beforeEach(() => {
            opts.responseDecorator = (tape, req) => {
              tape.res.body = req.body
              return tape
            }
          })

          it("returns the decorated response", async () => {
            const resObj = await reqHandler.handle(savedTape.req)

            expect(resObj.status).to.eql(200)
            expect(resObj.body).to.eql(Buffer.from("ABC"))
            expect(savedTape.res.body).to.eql(Buffer.from("Hello"))
          })
        })
      })
    })

    context("when request opt is 'OVERWRITE'", () => {
      beforeEach(() => {
        opts.record = RecordMode.OVERWRITE

        prepareForExternalRequest()
      })

      afterEach(() => td.reset())

      context("when the request matches a tape", () => {
        beforeEach(() => {
          tapeStore.tapes = [savedTape]
        })

        it("makes the real request and returns the response, saving the tape", async () => {
          const resObj = await reqHandler.handle(savedTape.req)
          expect(resObj.status).to.eql(200)
          expect(resObj.body).to.eql(Buffer.from("Foobar"))

          td.verify(tapeStore.save(td.matchers.anything()))
        })
      })

      context("when the request doesn't match a tape", () => {
        it("makes the real request and returns the response, saving the tape", async () => {
          const resObj = await reqHandler.handle(savedTape.req)
          expect(resObj.status).to.eql(200)
          expect(resObj.body).to.eql(Buffer.from("Foobar"))

          td.verify(tapeStore.save(td.matchers.anything()))
        })
      })
    })

    context("when request opt is 'DISABLED'", () => {
      beforeEach(() => {
        opts.record = RecordMode.DISABLED
      })

      context("when the request matches a tape", () => {
        beforeEach(() => {
          tapeStore.tapes = [savedTape]
        })

        it("returns the matched tape response", async () => {
          const resObj = await reqHandler.handle(savedTape.req)
          expect(resObj.status).to.eql(200)
          expect(resObj.body).to.eql(Buffer.from("Hello"))
        })
      })

      context("when the request doesn't match a tape", () => {
        context("when fallbackMode is 'NOT_FOUND'", () => {
          beforeEach(() => {
            opts.fallbackMode = FallbackMode.NOT_FOUND
          })

          it("returns a 404", async () => {
            const resObj = await reqHandler.handle(savedTape.req)
            expect(resObj.status).to.eql(404)
          })
        })

        context("when fallbackMode is 'PROXY'", () => {
          beforeEach(() => {
            opts.fallbackMode = FallbackMode.PROXY
            prepareForExternalRequest()
          })

          it("makes real request and returns the response but doesn't save it", async () => {
            const resObj = await reqHandler.handle(savedTape.req)

            expect(resObj.status).to.eql(200)
            expect(resObj.body).to.eql(Buffer.from("Foobar"))

            td.verify(tapeStore.save(td.matchers.anything()), {times: 0})
          })
        })

        context("when fallbackMode is a function", () => {
          let fallbackModeToReturn

          beforeEach(() => {
            opts.fallbackMode = (req) => {
              expect(req).to.eql(savedTape.req)
              return fallbackModeToReturn
            }
          })

          it("raises an error if the returned mode is not valid", async () => {
            fallbackModeToReturn = "INVALID"

            try {
              await reqHandler.handle(savedTape.req)
              throw "Exception expected to be thrown"
            } catch (ex) {
              expect(ex).to.eql("INVALID OPTION: fallbackMode has an invalid value of 'INVALID'")
            }
          })

          it("does what the function returns", async () => {
            fallbackModeToReturn = FallbackMode.NOT_FOUND

            let resObj = await reqHandler.handle(savedTape.req)
            expect(resObj.status).to.eql(404)

            fallbackModeToReturn = FallbackMode.PROXY
            prepareForExternalRequest()

            resObj = await reqHandler.handle(savedTape.req)
            expect(resObj.status).to.eql(200)
          })
        })
      })
    })

    context("when record is a function", () => {
      let modeToReturn

      beforeEach(() => {
        opts.record = (req) => {
          expect(req).to.eql(savedTape.req)
          return modeToReturn
        }
      })

      it("raises an error if the returned mode is not valid", async () => {
        modeToReturn = "INVALID"

        try {
          await reqHandler.handle(savedTape.req)
          throw "Exception expected to be thrown"
        } catch (ex) {
          expect(ex).to.eql("INVALID OPTION: record has an invalid value of 'INVALID'")
        }
      })

      it("does what the function returns", async () => {
        modeToReturn = RecordMode.DISABLED

        let resObj = await reqHandler.handle(savedTape.req)
        expect(resObj.status).to.eql(404)

        modeToReturn = RecordMode.NEW
        prepareForExternalRequest()

        resObj = await reqHandler.handle(savedTape.req)
        expect(resObj.status).to.eql(200)
        expect(resObj.body).to.eql(Buffer.from("Foobar"))

        td.verify(tapeStore.save(td.matchers.anything()))
      })
    })
  })
})
