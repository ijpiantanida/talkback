export default class Sumary {
  constructor(tapes, opts) {
    this.tapes = tapes
    this.opts = opts
  }

  print() {
    console.log(`===== SUMMARY (${this.opts.name}) =====`)
    const newTapes = this.tapes.filter(t => t.new)
    if (newTapes.length > 0) {
      console.log("New tapes:")
      newTapes.forEach(t => console.log(`- ${t.path}`))
    }
    const unusedTapes = this.tapes.filter(t => !t.used)
    if (unusedTapes.length > 0) {
      console.log("Unused tapes:")
      unusedTapes.forEach(t => console.log(`- ${t.path}`))
    }
  }
}
