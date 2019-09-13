import Headers from "./utils/headers"
import MediaType from "./utils/media-type"
import Tape from "./tape"
import ContentEncoding from "./utils/content-encoding";

const bufferShim = require("buffer-shims")

export default class TapeRenderer {
  constructor(tape) {
    this.tape = tape
  }

  static async fromStore(raw, options) {
    const req = {...raw.req}

    req.body = await this.prepareBody(raw, req, "req")

    const tape = new Tape(req, options)
    tape.meta = {...raw.meta}
    tape.res = {...raw.res}

    tape.res.body = await this.prepareBody(tape, tape.res, "res")

    return tape
  }

  static async prepareBody(tape, reqResObj, metaPrefix) {
    const contentEncoding = new ContentEncoding(reqResObj)
    const isTapeUncompressed = tape.meta[metaPrefix + "Uncompressed"]
    const isTapeHumanReadable = tape.meta[metaPrefix + "HumanReadable"]
    const isTapeInPlainText = isTapeUncompressed || contentEncoding.isUncompressed()

    if (isTapeHumanReadable && isTapeInPlainText) {
      const mediaType = new MediaType(reqResObj)
      let bufferContent = reqResObj.body
      const isResAnObject = typeof(bufferContent) === "object"
      
      if (isResAnObject && mediaType.isJSON()) {
        const json = JSON.stringify(bufferContent, null, 2)
        bufferContent = json
      }

      if (Headers.read(reqResObj.headers, "content-length")) {
        Headers.write(reqResObj.headers, "content-length", Buffer.byteLength(bufferContent), metaPrefix)
      }

      if(isTapeUncompressed) {
        return await contentEncoding.compressedBody(bufferContent)
      }

      return bufferShim.from(bufferContent)
    } else {
      return bufferShim.from(reqResObj.body, "base64")
    }
  }

  async render() {
    const reqBody = await this.bodyFor(this.tape.req, "req")
    const resBody = await this.bodyFor(this.tape.res, "res")
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

  async bodyFor(reqResObj, metaPrefix) {
    const mediaType = new MediaType(reqResObj)
    const contentEncoding = new ContentEncoding(reqResObj)
    const bodyLength = reqResObj.body.length

    const isUncompressed = contentEncoding.isUncompressed()
    const contentEncodingSupported = isUncompressed || contentEncoding.supportedAlgorithm()

    if (mediaType.isHumanReadable() && contentEncodingSupported && bodyLength > 0) {
      this.tape.meta[metaPrefix + "HumanReadable"] = true

      let body = reqResObj.body

      if(!isUncompressed) {
        this.tape.meta[metaPrefix + "Uncompressed"] = true
        body = await contentEncoding.uncompressedBody(reqResObj.body)
      }

      const rawBody = body.toString("utf8")

      if (mediaType.isJSON()) {
        return JSON.parse(rawBody)
      } else {
        return rawBody
      }
    } else {
      return reqResObj.body.toString("base64")
    }
  }

}
