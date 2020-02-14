import ErrorRate from "../../src/features/error-rate"
import OptionsFactory, {Options} from "../../src/options"
import {expect} from "chai"
import * as td from "testdouble"
import {Req} from "../../src/types"
import Tape from "../../src/tape"

let errorRate: ErrorRate, opts: Options

const emptyReq: Req = {
  url: "http://base.com",
  method: "GET",
  headers: {},
  body: Buffer.from("FOOBAR")
}

describe("ErrorRate", () => {
  beforeEach(() => {
    opts = OptionsFactory.prepare({silent: true, errorRate: 30})
    errorRate = new ErrorRate(opts)

    const randomTd = td.function()
    td.replace(Math, "random", randomTd)
    td.when(randomTd()).thenReturn(0.3)
  })

  describe("#shouldSimulate", () => {
    afterEach(() => td.reset())

    context("when there isn't a matching tape", () => {
      context("when errorRate is a number", () => {
        it("returns true when falling inside errorRate", () => {
          opts.errorRate = 40

          expect(errorRate.shouldSimulate(emptyReq, undefined)).to.eql(true)
        })

        it("returns false when falling inside errorRate", () => {
          opts.errorRate = 20

          expect(errorRate.shouldSimulate(emptyReq, undefined)).to.eql(false)
        })
      })

      context("when errorRate is a function", () => {
        it("returns what the function returns", () => {
          opts.errorRate = (req) => req.url.includes("fail") ? 100 : 0

          expect(errorRate.shouldSimulate({...emptyReq, url: "http://pass"}, undefined)).to.eql(false)
          expect(errorRate.shouldSimulate({...emptyReq, url: "http://fail"}, undefined)).to.eql(true)
        })
      })
    })

    context("when there's a matching tape", () => {
      it("uses the tape's errorRate", () => {
        opts.errorRate = 40
        const tape = new Tape(emptyReq, opts)
        tape.meta.errorRate = 10

        expect(errorRate.shouldSimulate(emptyReq, tape)).to.eql(false)
      })
    })
  })

  describe("#simulate", () => {
    it("returns an error response object", () => {
      const resp = errorRate.simulate(emptyReq)
      expect(resp.status).to.eql(503)
    })
  })
})
