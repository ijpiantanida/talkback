import Server from "./server"
import Options, {RecordMode, FallbackMode} from "./options"

const talkback = usrOpts => {
  const opts = Options.prepare(usrOpts)

  return new Server(opts)
}

talkback.Options = {
  FallbackMode,
  RecordMode
}

export default talkback
