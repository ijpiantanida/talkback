import {FallbackMode, Options, RecordMode} from "./options"
import TalkbackServer from "./server"

export {}

export interface ReqRes {
  headers: any,
  body: Buffer
}

export interface Req extends ReqRes {
  url: string,
  method: string
}

export interface Res extends ReqRes {
  status: number
}

export interface Metadata {
  createdAt: Date,
  host: string,
  tag?: string,
  errorRate?: number
  latency?: number | number[],
  reqUncompressed?: boolean,
  resUncompressed?: boolean,
  reqHumanReadable?: boolean,
  resHumanReadable?: boolean
}

type TalkbackBase = (usrOpts: Partial<Options>) => TalkbackServer
export interface Talkback extends TalkbackBase {
  Options: {
    Default: Options,
    FallbackMode: typeof FallbackMode,
    RecordMode: typeof RecordMode
  }
}
