import Options from "./options"
import TapeStore from "./tape-store"
import TalkbackServer from "./server"
import RequestHandler from "./request-handler"

export default class TalkbackFactory {
  static server(options: Partial<Options>) {
    const fullOptions = Options.prepare(options)
    return new TalkbackServer(fullOptions)
  }

  static async requestHandler(options: Partial<Options>) {
    const fullOptions = Options.prepare(options)
    const tapeStore = new TapeStore(fullOptions)
    await tapeStore.setPath(fullOptions.path)
    return new RequestHandler(tapeStore, fullOptions)
  }
}
