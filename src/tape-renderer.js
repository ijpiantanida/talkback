import Headers from "./utils/headers"
import MediaType from "./utils/media-type"
import Tape from "./tape"

const bufferShim = require("buffer-shims")

export default class TapeRenderer {
  constructor(tape) {
    this.tape = tape
  }

  static fromStore(raw, options) {
    const req = {...raw.req}

    req.body = this.prepareBody(raw, req, "req")

    const tape = new Tape(req, options)
    tape.meta = raw.meta
    tape.res = {...raw.res}

    tape.res.body = this.prepareBody(tape, tape.res, "res")

    return tape
  }

  static prepareBody(tape, reqResObj, metaPrefix) {
    if (tape.meta[metaPrefix + "HumanReadable"]) {
      const mediaType = new MediaType(reqResObj)
      const isResAnObject = typeof(reqResObj.body) === "object"
      if (isResAnObject && mediaType.isJSON()) {
        const json = JSON.stringify(reqResObj.body, null, 2)
        if (Headers.read(reqResObj.headers, "content-length")) {
          Headers.write(reqResObj.headers, "content-length", json.length, metaPrefix)
        }
        return bufferShim.from(json)
      } else {
        return bufferShim.from(reqResObj.body)
      }
    } else {
      return bufferShim.from(reqResObj.body, "base64")
    }
  }

  render() {
    const reqBody = this.bodyFor(this.tape.req, "req")
    const resBody = this.bodyFor(this.tape.res, "res")
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

  bodyFor(reqResObj, metaPrefix) {
    const mediaType = new MediaType(reqResObj)
    const bodyLength = reqResObj.body.length

    if (mediaType.isHumanReadable() && bodyLength > 0) {
      this.tape.meta[metaPrefix + "HumanReadable"] = true
      const rawBody = reqResObj.body.toString("utf8")

      if (mediaType.isJSON()) {
        return JSON.parse(reqResObj.body)
      } else {
        return rawBody
      }
    } else {
      return reqResObj.body.toString("base64")
    }
  }

}
