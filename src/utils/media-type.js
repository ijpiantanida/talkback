const contentTypeParser = require("content-type");
import Headers from "./headers"

export const jsonTypes = [
  "application/json"
]

const humanReadableContentTypes = [
  "application/javascript",
  "text/css",
  "text/html",
  "text/javascript",
  "text/plain",
  ...jsonTypes
]

export default class MediaType {
  constructor(htmlReqRes) {
    this.htmlReqRes = htmlReqRes
  }

  isHumanReadable() {
    const contentType = this.contentType()
    if (!contentType) {
      return false
    }

    return humanReadableContentTypes.indexOf(contentType.type) >= 0
  }

  isJSON() {
    const contentType = this.contentType()
    if (!contentType) {
      return false
    }

    return jsonTypes.indexOf(contentType.type) >= 0
  }

  contentType() {
    let contentType = Headers.read(this.headers(), "content-type")
    if(!contentType) {
      return null
    }
    return contentTypeParser.parse(contentType);
  }

  headers() {
    return this.htmlReqRes.headers
  }
}
