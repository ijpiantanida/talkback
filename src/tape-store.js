const fs = require("fs")
const path = require("path")
const JSON5 = require("json5")
const mkdirp = require("mkdirp")

import Tape from "./tape"
import TapeMatcher from "./tape-matcher"
import TapeRenderer from "./tape-renderer"

export default class TapeStore {
  constructor(options) {
    this.path = path.normalize(options.path + "/")
    this.options = options
    this.tapes = []
  }

  load() {
    mkdirp.sync(this.path)

    const items = fs.readdirSync(this.path)
    for (let i = 0; i < items.length; i++) {
      const filename = items[i]
      const fullPath = `${this.path}${filename}`
      const stat = fs.statSync(fullPath)
      if (!stat.isDirectory()) {
        try {
          const data = fs.readFileSync(fullPath, "utf8")
          const raw = JSON5.parse(data)
          const tape = Tape.fromStore(raw, this.options)
          tape.path = filename
          this.tapes.push(tape)
        } catch (e) {
          console.log(`Error reading tape ${fullPath}`, e.message)
        }
      }
    }
    console.log(`Loaded ${this.tapes.length} tapes`)
  }

  find(newTape) {
    const foundTape = this.tapes.find(t => {
      this.options.logger.debug(`Comparing against tape ${t.path}`)
      return new TapeMatcher(t, this.options).sameAs(newTape)
    })

    if (foundTape) {
      foundTape.used = true
      this.options.logger.log(`Serving cached request for ${newTape.req.url} from tape ${foundTape.path}`)
      return foundTape
    }
  }

  save(tape) {
    tape.new = true
    tape.used = true
    this.tapes.push(tape)

    const toSave = new TapeRenderer(tape).render()

    const tapeName = `unnamed-${this.tapes.length}.json5`
    tape.path = tapeName
    const filename = this.path + tapeName
    this.options.logger.log(`Saving request ${tape.req.url} at ${filename}`)
    fs.writeFileSync(filename, JSON5.stringify(toSave, null, 4))
  }

  hasTapeBeenUsed(tapeName) {
    return this.tapes.some(t => t.used && t.path === tapeName)
  }

  resetTapeUsage() {
    return this.tapes.forEach(t => t.used = false)
  }
}
