import Options from "../src/options"
import {expect} from "chai"

describe("Options", () => {
  it("merges user options and default options", () => {
    const opts = Options.prepare({silent: true})

    expect(opts.silent).to.eql(true)
    expect(opts.debug).to.eql(false)
  })

  it("concats ignoreHeaders to default ones provided", () => {
    let opts = Options.prepare({ignoreHeaders: ["user-agent"]})
    expect(opts.ignoreHeaders.length >= 1).to.eql(true)
    expect(opts.ignoreHeaders.includes("user-agent")).to.eql(true)

    // Check that it's there
    opts = Options.prepare()
    expect(opts.ignoreHeaders.length >= 0).to.eql(true)
  })

  it("defaults name to the host", () => {
    const host = "https://my-api.com"
    let opts = Options.prepare({host})
    expect(opts.name).to.eql(host)

    opts = Options.prepare({host, name: "My Server"})
    expect(opts.name).to.eql("My Server")
  })

  describe("options validation", () => {
    describe("#record", () => {
      it("throws an error when record is not a valid value", () => {
        expect(() => Options.prepare({record: "invalid"}))
          .to.throw("INVALID OPTION: record has an invalid value of 'invalid'")
      })
    })

    describe("#fallbackMode", () => {
      it("throws an error when fallbackMode is not a valid value", () => {
        expect(() => Options.prepare({fallbackMode: "invalid"}))
          .to.throw("INVALID OPTION: fallbackMode has an invalid value of 'invalid'")
      })
    })

    describe("#latency", () => {
      it("throws an error when latency is an array with other than 2 values", () => {
        expect(() => Options.prepare({latency: [1]}))
          .to.throw("Invalid LATENCY option. If using a range, the array should only have 2 values [min, max]. Current=[1]")
        expect(() => Options.prepare({latency: [1, 2, 3]}))
          .to.throw("Invalid LATENCY option. If using a range, the array should only have 2 values [min, max]. Current=[1,2,3]")
      })
    })

    describe("#errorRate", () => {
      it("throws an error when errorRate is a number outside the valid range", () => {
        expect(() => Options.prepare({errorRate: -3}))
          .to.throw("Invalid ERRORRATE option")
        expect(() => Options.prepare({errorRate: 140}))
          .to.throw("Invalid ERRORRATE option")
      })

      it("doesn't throw an error when the value is within range", () => {
        expect(() => Options.prepare({errorRate: 10}))
          .to.not.throw()
      })

      it("doesn't throw an error when the value is a function", () => {
        expect(() => Options.prepare({errorRate: () => 0}))
          .to.not.throw()
      })
    })
  })
})
