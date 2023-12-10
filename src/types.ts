import {FallbackMode, Options, RecordMode} from "./options"
import TalkbackServer from "./server"
import RequestHandler from "./request-handler"

export {}

export interface More {
  [key: string]: any
}

export interface MatchingContext extends More {
  id: string;
}

export interface ReqRes {
  headers: any,
  body: Buffer
}

export interface Req extends ReqRes {
  url: string,
  method: string
}

export type HttpRequest = Req

export interface Res extends ReqRes {
  status: number
}

export type HttpResponse = Res

export interface Metadata extends More {
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

type TalkbackBase = (options: Partial<Options>) => TalkbackServer

export interface Talkback extends TalkbackBase {
  Options: {
    Default: Options,
    FallbackMode: typeof FallbackMode,
    RecordMode: typeof RecordMode,
  }

  requestHandler(options: Partial<Options>): RequestHandler

}
