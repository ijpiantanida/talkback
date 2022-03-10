import {ReqRes} from "../types"

const zlib = require("zlib")
import Headers from "./headers"

const ALGORITHMS = {
  gzip: {compress: zlib.gzipSync, uncompress: zlib.gunzipSync},
  deflate: {compress: zlib.deflateSync, uncompress: zlib.inflateSync},
  br: {compress: zlib.brotliCompressSync, uncompress: zlib.brotliDecompressSync}
}

type SupportedAlgorithms = keyof typeof ALGORITHMS

export default class ContentEncoding {
  private reqRes: ReqRes

  constructor(reqRes: ReqRes) {
    this.reqRes = reqRes
  }

  isUncompressed() {
    const contentEncoding = this.contentEncoding()
    return !contentEncoding || contentEncoding === "identity"
  }

  supportedAlgorithm() {
    const contentEncoding = this.contentEncoding()
    return Object.keys(ALGORITHMS).includes(contentEncoding)
  }

  contentEncoding() {
    return Headers.read(this.reqRes.headers, "content-encoding")
  }

  async uncompressedBody(body: Buffer) {
    const contentEncoding = this.contentEncoding()

    if (!this.supportedAlgorithm()) {
      throw new Error(`Unsupported content-encoding ${contentEncoding}`)
    }

    return ALGORITHMS[contentEncoding as SupportedAlgorithms].uncompress(body)
  }

  async compressedBody(body: string) {
    const contentEncoding = this.contentEncoding()

    if (!this.supportedAlgorithm()) {
      throw new Error(`Unsupported content-encoding ${contentEncoding}`)
    }

    return ALGORITHMS[contentEncoding as SupportedAlgorithms].compress(body)
  }
}
