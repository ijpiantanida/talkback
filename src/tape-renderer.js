import MediaType from "./media-type"
import Tape from "./tape"

const bufferShim = require("buffer-shims")

export default class TapeRenderer {
  constructor(tape) {
    this.tape = tape
  }

  static fromStore(raw, options) {
    const req = {...raw.req}
    if (raw.meta.reqHumanReadable) {
      req.body = bufferShim.from(raw.req.body)
    } else {
      req.body = bufferShim.from(raw.req.body, "base64")
    }

    const tape = new Tape(req, options)
    tape.meta = raw.meta
    tape.res = {...raw.res}
    if (tape.meta.resHumanReadable) {
      tape.res.body = bufferShim.from(tape.res.body)
    } else {
      tape.res.body = bufferShim.from(raw.res.body, "base64")
    }
    return tape
  }
  
  render() {
    const reqBody = this.bodyFor(this.tape.req, "reqHumanReadable");
    const resBody = this.bodyFor(this.tape.res, "resHumanReadable");
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
    };
  }

  bodyFor(reqResObj, metaProp) {
    const mediaType = new MediaType(reqResObj);

    if (mediaType.isHumanReadable()) {
      this.tape.meta[metaProp] = true;
      return reqResObj.body.toString("utf8");
    } else {
      return reqResObj.body.toString("base64");
    }
  }
}