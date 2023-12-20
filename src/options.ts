import { ControlPlaneRequestHandler } from "./features/types"
import Tape from "./tape"
import {Req, MatchingContext} from "./types"

export const RecordMode = {
  NEW: "NEW", // If no tape matches the request, proxy it and save the response to a tape
  OVERWRITE: "OVERWRITE", // Always proxy the request and save the response to a tape, overwriting any existing ones
  DISABLED: "DISABLED", // If a matching tape exists, return it. Otherwise, don't proxy the request and use `fallbackMode` for the response
  ALL: [] as string[]
}
RecordMode.ALL = [RecordMode.NEW, RecordMode.OVERWRITE, RecordMode.DISABLED]

export const FallbackMode = {
  NOT_FOUND: "NOT_FOUND",
  PROXY: "PROXY",
  ALL: [] as string[]
}
FallbackMode.ALL = [FallbackMode.NOT_FOUND, FallbackMode.PROXY]

export interface ControlPlaneOptions {
  enabled: boolean,
  path: string,
  requestHandler?: ControlPlaneRequestHandler,
}

export interface Options {
  host: string,
  port: number,
  path: string,
  record: string | ((req: Req) => string),
  fallbackMode: string | ((req: Req) => string),
  name: string,
  tapeNameGenerator?: (tapeNumber: number, tape: Tape) => string,
  https: {
    enabled: boolean,
    keyPath?: string,
    certPath?: string
  },
  allowHeaders: string[],
  ignoreHeaders: string[],
  ignoreQueryParams: string[],
  ignoreBody: boolean,

  bodyMatcher?: (tape: Tape, req: Req) => boolean,
  urlMatcher?: (tape: Tape, req: Req) => boolean,

  requestDecorator?: (req: Req, context: MatchingContext) => Req,
  responseDecorator?: (tape: Tape, req: Req, context: MatchingContext) => Tape,
  tapeDecorator?: (tape: Tape, context: MatchingContext) => Tape,

  latency: number | number[] | ((req: Req) => number),
  errorRate: number | ((req: Req) => number),

  silent: boolean,
  summary: boolean,
  debug: boolean,

  controlPlane: ControlPlaneOptions,

  alpha: {
    sequentialMode: boolean | ((req: Req) => boolean)
  }
}

export const DefaultOptions: Options = {
  host: "",
  port: 8080,
  path: "./tapes/",
  record: RecordMode.NEW,
  fallbackMode: FallbackMode.NOT_FOUND,
  name: "unnamed server",
  tapeNameGenerator: undefined,

  https: {
    enabled: false,
    keyPath: undefined,
    certPath: undefined
  },

  controlPlane: {
    enabled: true,
    path: '/__talkback__',
  },

  allowHeaders: undefined,
  ignoreHeaders: ["content-length", "host"],
  ignoreQueryParams: [],
  ignoreBody: false,

  bodyMatcher: undefined,
  urlMatcher: undefined,

  requestDecorator: undefined,
  responseDecorator: undefined,
  tapeDecorator: undefined,

  latency: 0,
  errorRate: 0,

  silent: false,
  summary: true,
  debug: false,

  alpha: {
    sequentialMode: false,
  }
}

export default class OptionsFactory {
  static prepare(usrOpts: Partial<Options> = {}) {
    const opts: typeof DefaultOptions = {
      ...DefaultOptions,
      name: usrOpts.host! || DefaultOptions.name,
      ...usrOpts,
      ignoreHeaders: [
        ...DefaultOptions.ignoreHeaders,
        ...(usrOpts.ignoreHeaders || [])
      ],
      controlPlane: {
        ...DefaultOptions.controlPlane,
        ...(usrOpts.controlPlane || {})
      }
    }

    this.validateOptions(opts)

    return opts
  }

  static validateOptions(opts: Options) {
    this.validateRecord(opts.record)
    this.validateFallbackMode(opts.fallbackMode)
    this.validateLatency(opts.latency)
    this.validateErrorRate(opts.errorRate)
  }

  static validateRecord(record: any) {
    if (typeof (record) === "string" && !RecordMode.ALL.includes(record)) {
      throw `INVALID OPTION: record has an invalid value of '${record}'`
    }
  }

  static validateFallbackMode(fallbackMode: any) {
    if (typeof (fallbackMode) === "string" && !FallbackMode.ALL.includes(fallbackMode)) {
      throw `INVALID OPTION: fallbackMode has an invalid value of '${fallbackMode}'`
    }
  }

  static validateLatency(latency: any) {
    if (Array.isArray(latency) && latency.length !== 2) {
      throw `Invalid LATENCY option. If using a range, the array should only have 2 values [min, max]. Current=[${latency}]`
    }
  }

  static validateErrorRate(errorRate: any) {
    if (typeof (errorRate) !== "function" && (errorRate < 0 || errorRate > 100)) {
      throw `Invalid ERRORRATE option. Value should be between 0 and 100. Current=[${errorRate}]`
    }
  }
}
