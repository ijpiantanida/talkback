import TalkbackFactory from "./talkback-factory"
import {DefaultOptions, FallbackMode, RecordMode, Options} from "./options"
import {logger} from "./logger"

const talkback = (options: Partial<Options>) => {
  return TalkbackFactory.server(options)
}

talkback.Options = {
  Default: DefaultOptions,
  FallbackMode,
  RecordMode
}

talkback.requestHandler = (options: Partial<Options>) => TalkbackFactory.requestHandler(options)
talkback._logger = logger

export default talkback
module.exports = talkback
