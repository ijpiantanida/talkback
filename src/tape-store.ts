import {Options} from "./options"

const fs = require("fs")
const path = require("path")
const JSON5 = require("json5")
const mkdirp = require("mkdirp")

import Tape from "./tape"
import TapeMatcher from "./tape-matcher"
import TapeRenderer from "./tape-renderer"
import {Logger} from "./logger"

export default class TapeStore {
  private readonly path: string
  private readonly options: Options
  tapes: Tape[]
  private readonly logger: Logger

  constructor(options: Options) {
    this.path = path.normalize(options.path + "/")
    this.options = options
    this.tapes = []

    this.logger = Logger.for(this.options)
  }

  async load() {
    mkdirp.sync(this.path)

    await this.loadTapesAtDir(this.path)
    this.logger.info(`Loaded ${this.tapes.length} tapes from ${this.path}`)
  }

  async loadTapesAtDir(directory: string) {
    const items = fs.readdirSync(directory) as string[]
    for (let i = 0; i < items.length; i++) {
      const filename = items[i]
      const fullPath = `${directory}${filename}`
      const stat = fs.statSync(fullPath)
      if (!stat.isDirectory()) {
        try {
          const data = fs.readFileSync(fullPath, "utf8")
          const raw = JSON5.parse(data)
          const tape = await Tape.fromStore(raw, this.options)
          tape.path = filename
          this.tapes.push(tape)
        } catch (e) {
          this.logger.error(`Error reading tape ${fullPath}`, e.message)
        }
      } else {
        await this.loadTapesAtDir(fullPath + "/")
      }
    }
  }

  find(newTape: Tape) {
    const foundTape = this.tapes.find(t => {
      this.logger.debug(`Comparing against tape ${t.path}`)
      return new TapeMatcher(t, this.options).sameAs(newTape)
    })

    if (foundTape) {
      foundTape.used = true
      this.logger.info(`Found matching tape for ${newTape.req.url} at ${foundTape.path}`)
      return foundTape
    }
  }

  async save(tape: Tape) {
    tape.new = true
    tape.used = true

    const tapePath = tape.path
    let fullFilename

    if (tapePath) {
      fullFilename = path.join(this.path, tapePath)
    } else {
      // If the tape doesn't have a path then it's new
      this.tapes.push(tape)

      fullFilename = this.createTapePath(tape)
      tape.path = path.relative(this.path, fullFilename)
    }
    this.logger.info(`Saving request ${tape.req.url} at ${tape.path}`)

    const tapeRenderer = new TapeRenderer(tape)
    const toSave = await tapeRenderer.render()
    fs.writeFileSync(fullFilename, JSON5.stringify(toSave, null, 4))
  }

  currentTapeId() {
    return this.tapes.length
  }

  hasTapeBeenUsed(tapeName: string) {
    return this.tapes.some(t => t.used && t.path === tapeName)
  }

  resetTapeUsage() {
    return this.tapes.forEach(t => t.used = false)
  }

  createTapePath(tape: Tape) {
    const currentTapeId = this.currentTapeId()
    let tapePath = `unnamed-${currentTapeId}.json5`
    if (this.options.tapeNameGenerator) {
      tapePath = this.options.tapeNameGenerator(currentTapeId, tape)
    }
    let result = path.normalize(path.join(this.options.path, tapePath))
    if (!result.endsWith(".json5")) {
      result = `${result}.json5`
    }
    const dir = path.dirname(result)
    mkdirp.sync(dir)

    return result
  }
}
