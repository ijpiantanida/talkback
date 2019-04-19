import Server from "./server"
import Options, {DefaultOptions, FallbackMode, RecordMode} from "./options"

const talkback = usrOpts => {
  const opts = Options.prepare(usrOpts)

  return new Server(opts)
}

talkback.Options = {
  Default: DefaultOptions,
  FallbackMode,
  RecordMode
}

export default talkback
