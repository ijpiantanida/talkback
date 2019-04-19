import ErrorRate from "../../src/features/error-rate"
import Options from "../../src/options"

let errorRate, opts

describe("ErrorRate", () => {
  beforeEach(() => {
    opts = Options.prepare({silent: true, errorRate: 30})
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
  
          expect(errorRate.shouldSimulate({}, undefined)).to.eql(true)
        })

        it("returns false when falling inside errorRate", () => {
          opts.errorRate = 20
  
          expect(errorRate.shouldSimulate({}, undefined)).to.eql(false)
        })
      })

      context("when errorRate is a function", () => {
        it("returns what the function returns", () => {
          opts.errorRate = (req) => req.url.includes("fail") ? 100 : 0

          expect(errorRate.shouldSimulate({url: "http://pass"}, undefined)).to.eql(false)
          expect(errorRate.shouldSimulate({url: "http://fail"}, undefined)).to.eql(true)
        })
      })
    })

    context("when there's a matching tape", () => {
      it("uses the tape's errorRate", () => {
        opts.errorRate = 40
        const tape = {meta: {errorRate: 10}}

        expect(errorRate.shouldSimulate({}, tape)).to.eql(false)
      })
    })
  })

  describe("#simulate", () => {
    it("returns an error response object", () => {
      const resp = errorRate.simulate({})
      expect(resp.status).to.eql(503)
    })
  })
})