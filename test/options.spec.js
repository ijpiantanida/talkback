import Options from "../src/options"

describe("Options", () => {
  it("merges user options and default options", () => {
    const opts = Options.prepare({silent: true})

    expect(opts.silent).to.be.true
    expect(opts.debug).to.be.false
  })

  it("concats ignoreHeaders to default ones provided", () => {
    let opts = Options.prepare({ignoreHeaders: ['user-agent']})
    console.log("opts.ignoreHeaders", opts.ignoreHeaders)
    expect(opts.ignoreHeaders.length >= 1).to.eql(true)
    expect(opts.ignoreHeaders.includes('user-agent')).to.eql(true)

    // Check that it's there
    opts = Options.prepare()
    expect(opts.ignoreHeaders.length >= 0).to.eql(true)
  })
})
