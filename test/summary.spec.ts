import Summary from "../src/summary"
import * as td from "testdouble"
import {DefaultOptions} from "../src/options"
import Tape from "../src/tape"

let log: Function;

const opts = {
  ...DefaultOptions,
  name: "My Server"
}

describe("Summary", () => {
  beforeEach(() => {
    log = td.replace(console, "log")
  })

  afterEach(() => {
    td.reset()
  })

  describe("#print", () => {
    it("print the server name", () => {
      const summary = new Summary([], opts)
      summary.print()

      td.verify(log(td.matchers.contains(opts.name)))
    })

    it("prints nothing when there are no new tapes and no unused tapes", () => {
      const summary = new Summary([], opts)

      summary.print()

      td.verify(log(td.matchers.contains("New")), {times: 0})
      td.verify(log(td.matchers.contains("Unused")), {times: 0})
    })

    it("prints the path of new tapes", () => {
      const summary = new Summary([
        {new: true, used: true, path: "path1"} as Tape,
        {used: true, path: "path2"} as Tape,
        {new: true, used: true, path: "path3"} as Tape
      ], opts)

      summary.print()

      td.verify(log(td.matchers.contains("path1")))
      td.verify(log(td.matchers.contains("path2")), {times: 0})
      td.verify(log(td.matchers.contains("path3")))
    })

    it("prints the path of unused tapes", () => {
      const summary = new Summary([
        {path: "path1"} as Tape,
        {used: true, path: "path2"} as Tape,
        {path: "path3"} as Tape
      ], opts)

      summary.print()

      td.verify(log(td.matchers.contains("path1")))
      td.verify(log(td.matchers.contains("path2")), {times: 0})
      td.verify(log(td.matchers.contains("path3")))
    })
  })
})
