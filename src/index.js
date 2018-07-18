import Server from "./server"
import Logger from "./logger"
import Options from "./options"

const talkback = usrOpts => {
  const opts = Options.prepare(usrOpts)
  opts.logger = new Logger(opts)

  return new Server(opts)
}

export default talkback