import Headers from "./utils/headers"
import MediaType from "./utils/media-type"
import Tape from "./tape"
import ContentEncoding from "./utils/content-encoding"
import {Options} from "./options"
import {ReqRes} from "./types"

const bufferShim = require("buffer-shims")

export default class TapeRenderer {
  private tape: Tape

  constructor(tape: Tape) {
    this.tape = tape
  }

  static async fromStore(raw: any, options: Options) {
    const req = {...raw.req}

    req.body = await this.prepareBody(raw, req, req.body, "req")

    const tape = new Tape(req, options)
    tape.meta = {...raw.meta}
    const baseRes = {...raw.res}
    const resBody = await this.prepareBody(tape, baseRes, baseRes.body, "res")

    tape.res = {
      ...baseRes,
      body: resBody
    }

    return tape
  }

  static async prepareBody(tape: Tape, reqResObj: ReqRes, rawBody: string, metaPrefix: "res" | "req") {
    const contentEncoding = new ContentEncoding(reqResObj)
    const isTapeUncompressed = (tape.meta as any)[metaPrefix + "Uncompressed"]
    const isTapeHumanReadable = (tape.meta as any)[metaPrefix + "HumanReadable"]
    const isTapeInPlainText = isTapeUncompressed || contentEncoding.isUncompressed()

    if (isTapeHumanReadable && isTapeInPlainText) {
      const mediaType = new MediaType(reqResObj)
      let bufferContent = rawBody
      const isResAnObject = typeof (bufferContent) === "object"

      if (isResAnObject && mediaType.isJSON()) {
        bufferContent = JSON.stringify(bufferContent, null, 2)
      }

      if (Headers.read(reqResObj.headers, "content-length")) {
        Headers.write(reqResObj.headers, "content-length", Buffer.byteLength(bufferContent).toString(), metaPrefix)
      }

      if (isTapeUncompressed) {
        return await contentEncoding.compressedBody(bufferContent)
      }

      return bufferShim.from(bufferContent)
    } else {
      return bufferShim.from(rawBody, "base64")
    }
  }

  async render() {
    const reqBody = await this.bodyFor(this.tape.req, "req")
    const resBody = await this.bodyFor(this.tape.res!, "res")
    return {
      meta: this.tape.meta,
      req: {
        ...this.tape.req,
        body: reqBody
      },
      res: {
        ...this.tape.res,
        body: resBody
      }
    }
  }

  async bodyFor(reqResObj: ReqRes, metaPrefix: "req" | "res") {
    const mediaType = new MediaType(reqResObj)
    const contentEncoding = new ContentEncoding(reqResObj)
    const bodyLength = reqResObj.body.length

    const isUncompressed = contentEncoding.isUncompressed()
    const contentEncodingSupported = isUncompressed || contentEncoding.supportedAlgorithm()

    if (mediaType.isHumanReadable() && contentEncodingSupported && bodyLength > 0) {
      (this.tape.meta as any)[metaPrefix + "HumanReadable"] = true

      let body = reqResObj.body

      if (!isUncompressed) {
        (this.tape.meta as any)[metaPrefix + "Uncompressed"] = true
        body = await contentEncoding.uncompressedBody(body)
      }

      const rawBody = body.toString("utf8")

      if (mediaType.isJSON()) {
        try {
          return JSON.parse(rawBody);
        } catch {
          return rawBody;
        }
      } else {
        return rawBody
      }
    } else {
      return reqResObj.body.toString("base64")
    }
  }

}
