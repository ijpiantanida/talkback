import {ReqRes} from "../types"
import Headers from "./headers"

const contentTypeParser = require("content-type")

const equals = (to: string) => (contentType: string) => to == contentType

export const jsonTypes = [
  equals("application/json"),
  equals("application/x-amz-json-1.0"),
  equals("application/x-amz-json-1.1"),
  (contentType: string) => contentType.startsWith("application/") && contentType.endsWith("+json")
]

const humanReadableContentTypes = [
  equals("application/javascript"),
  equals("text/css"),
  equals("text/html"),
  equals("text/javascript"),
  equals("text/plain"),
  ...jsonTypes
]

export default class MediaType {
  private htmlReqRes: ReqRes

  constructor(htmlReqRes: ReqRes) {
    this.htmlReqRes = htmlReqRes
  }

  isHumanReadable() {
    const contentType = this.contentType()
    if (!contentType) {
      return false
    }

    return humanReadableContentTypes.some(comparator => comparator(contentType))
  }

  isJSON() {
    const contentType = this.contentType()
    if (!contentType) {
      return false
    }

    return jsonTypes.some(comparator => comparator(contentType))
  }

  contentType() {
    const contentTypeHeader = Headers.read(this.headers(), "content-type")
    if (!contentTypeHeader) {
      return null
    }
    const parsedContentType = contentTypeParser.parse(contentTypeHeader)
    return parsedContentType.type as string
  }

  headers() {
    return this.htmlReqRes.headers
  }
}
