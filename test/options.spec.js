import Options, {RecordMode, FallbackMode} from "../src/options"

describe("Options", () => {
  it("merges user options and default options", () => {
    const opts = Options.prepare({silent: true})
    
    expect(opts.silent).to.eql(true)
    expect(opts.debug).to.eql(false)
  })
  
  it("concats ignoreHeaders to default ones provided", () => {
    let opts = Options.prepare({ignoreHeaders: ['user-agent']})
    expect(opts.ignoreHeaders.length >= 1).to.eql(true)
    expect(opts.ignoreHeaders.includes('user-agent')).to.eql(true)
    
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
        expect(() => Options.prepare({record: 'invalid'}))
        .to.throw("INVALID OPTION: record has an invalid value of 'invalid'")
      })
    })
    
    describe("#fallbackMode", () => {
      it("throws an error when fallbackMode is not a valid value", () => {
        expect(() => Options.prepare({fallbackMode: 'invalid'}))
        .to.throw("INVALID OPTION: fallbackMode has an invalid value of 'invalid'")
      })
    })
    
    describe("#latency", () => {
      it("throws an error when latency is an array with other than 2 values", () => {
        expect(() => Options.prepare({latency: [1]}))
        .to.throw("Invalid LATENCY option. If using a range, the array should only have 2 values [min, max]. Current=[1]") 
        expect(() => Options.prepare({latency: [1,2,3]}))
        .to.throw("Invalid LATENCY option. If using a range, the array should only have 2 values [min, max]. Current=[1,2,3]") 
      })
    })
  })
  
  describe("deprecated options", () => {
    let error
    beforeEach(() => {
      error = td.replace(console, 'error')
    })
    
    afterEach(() => td.reset())
    
    describe("#record", () => {
      it("notifies when record is still being used with a boolean", () => {
        let opts = Options.prepare({record: true})
        expect(opts.record).to.eql(RecordMode.NEW)
        td.verify(error(td.matchers.contains("DEPRECATION NOTICE: record option will no longer accept boolean values")))
        
        opts = Options.prepare({record: false})
        expect(opts.record).to.eql(RecordMode.DISABLED)
      })
      
      it("does not notify when record is a string", () => {
        Options.prepare({record: RecordMode.NEW})
        td.verify(error(td.matchers.anything()), {times: 0})
      })
      
      it("does not notify when record is a function", () => {
        Options.prepare({
          record: () => {
          }
        })
        td.verify(error(td.matchers.anything()), {times: 0})
      })
    })
    
    describe("#fallbackMode", () => {
      it("notifies when fallbackMode is '404'", () => {
        let opts = Options.prepare({fallbackMode: "404"})
        expect(opts.fallbackMode).to.eql(FallbackMode.NOT_FOUND)
        td.verify(error(td.matchers.contains("DEPRECATION NOTICE: fallbackMode option '404' has been replaced by 'NOT_FOUND'")))
      })
      
      it("notifies when fallbackMode is 'proxy'", () => {
        let opts = Options.prepare({fallbackMode: "proxy"})
        expect(opts.fallbackMode).to.eql(FallbackMode.PROXY)
        td.verify(error(td.matchers.contains("DEPRECATION NOTICE: fallbackMode option 'proxy' has been replaced by 'PROXY'")))
      })
    })
  })
})
