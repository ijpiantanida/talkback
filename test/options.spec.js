import Options from "../src/options"

describe("Options", () => {
  it("merges user options and default options", () => {
    const opts = Options.prepare({silent: true})

    expect(opts.silent).to.be.true
    expect(opts.debug).to.be.false
  })

  it("adds content-length to ignoreHeaders if bodyMatcher is provided", () => {
    let opts = Options.prepare({bodyMatcher: () => {}})
    expect(opts.ignoreHeaders).to.eql(["content-length"])

    opts = Options.prepare({ignoreHeaders: ["foo"], bodyMatcher: () => {}})

    expect(opts.ignoreHeaders).to.eql(["foo", "content-length"])
  })
})