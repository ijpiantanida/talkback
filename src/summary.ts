import Tape from "./tape"
import {Options} from "./options"
import {Logger} from "./logger"

export default class Summary {
  private tapes: Tape[]
  private options: Options
  private logger: Logger

  constructor(tapes: Tape[], options: Options) {
    this.tapes = tapes
    this.options = options

    this.logger = Logger.for(this.options)
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
    this.logger.info(message)
  }
}
