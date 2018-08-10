import Server from "./server"
import Options from "./options"

const talkback = usrOpts => {
  const opts = Options.prepare(usrOpts)

  return new Server(opts)
}

export default talkback