import Tape from "./tape"
import {Options} from "./options"
import {logger} from "./logger"

export default class Summary {
  private tapes: Tape[]
  private opts: Options

  constructor(tapes: Tape[], opts: Options) {
    this.tapes = tapes
    this.opts = opts
  }

  print() {
    let message = `===== SUMMARY =====\n`
    const newTapes = this.tapes.filter(t => t.new)
    if (newTapes.length > 0) {
      message += "New tapes:\n"
      newTapes.forEach(t => message += `- ${t.path}\n`)
    }
    const unusedTapes = this.tapes.filter(t => !t.used)
    if (unusedTapes.length > 0) {
      message += "Unused tapes:\n"
      unusedTapes.forEach(t => message += `- ${t.path}\n`)
    }
    logger.log.info(message)
  }
}
