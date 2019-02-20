import RequestHandler from "../src/request-handler"
import Tape from "../src/tape"
import TapeStore from "../src/tape-store"
import Options from "../src/options"

let tapeStore, reqHandler, opts, savedTape;

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

describe("RequestHandler", async () => {
  beforeEach(() => {
    opts = Options.prepare({debug: false})
    tapeStore = new TapeStore(opts)
    savedTape = Tape.fromStore(rawTape, opts)
    reqHandler = new RequestHandler(tapeStore, opts)
  })

  describe("#handle", async () => {
    context("when the request matches a tape", async () => {
      beforeEach(() => {
        tapeStore.tapes = [savedTape]
      })

      it("returns the matched tape response", async () => {
        const resObj = await reqHandler.handle(savedTape.req)
        expect(resObj.status).to.eql(200)
        expect(resObj.body).to.eql(Buffer.from("Hello"))
      })

      context("when there's a responseDecorator", async () => {
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

    context("when the request doesn't match a tape", async () => {
      beforeEach(() => {
        const fakeMakeRealRequest = td.function()
        td.when(fakeMakeRealRequest(td.matchers.anything())).thenReturn(savedTape.res)
        td.replace(reqHandler, "makeRealRequest", fakeMakeRealRequest)

        td.replace(tapeStore, "save")
      })

      afterEach(() => td.reset())
      
      it("makes the real request and returns the response", async () => {
        const resObj = await reqHandler.handle(savedTape.req)
        expect(resObj.status).to.eql(200)
        expect(resObj.body).to.eql(Buffer.from("Hello"))
      })

      context("when there's a responseDecorator", async () => {
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
})