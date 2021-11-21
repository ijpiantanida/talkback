import Options from "./options"
import TapeStore from "./tape-store"
import TalkbackServer from "./server"
import RequestHandler from "./request-handler"
import {initializeLogger} from "./logger"

export default class TalkbackFactory {
  static server(options: Partial<Options>) {
    const fullOptions = Options.prepare(options)
    initializeLogger(fullOptions)
    return new TalkbackServer(fullOptions)
  }

  static async requestHandler(options: Partial<Options>) {
    const fullOptions = Options.prepare(options)
    initializeLogger(fullOptions)
    const tapeStore = new TapeStore(fullOptions)
    await tapeStore.load()
    return new RequestHandler(tapeStore, fullOptions)
  }
}
