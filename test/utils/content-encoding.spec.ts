import {Req, ReqRes} from "../../src/types"

const zlib = require("zlib")
import ContentEncoding from "../../src/utils/content-encoding"
import {expect} from "chai"

let reqRes: ReqRes, contentEncoding: ContentEncoding

describe("ContentEncoding", () => {
  beforeEach(() => {
    reqRes = {
      headers: {
        "content-encoding": "gzip"
      },
      body: Buffer.from("FOOBAR")
    }
    contentEncoding = new ContentEncoding(reqRes)
  })

  describe("#isUncompressed", () => {
    it("returns true when there's no content-encoding header", () => {
      reqRes.headers = {}
      expect(contentEncoding.isUncompressed()).to.eql(true)
    })

    it("returns true when content-encoding header is identity", () => {
      setEncoding("identity")
      expect(contentEncoding.isUncompressed()).to.eql(true)
    })

    it("returns false when content-encoding is not identity", () => {
      expect(contentEncoding.isUncompressed()).to.eql(false)

      setEncoding("gzip, identity")
      expect(contentEncoding.isUncompressed()).to.eql(false)
    })
  })

  describe("#supportedAlgorithm", () => {
    it("returns true when content-encoding is a supported algorithm", () => {
      expect(contentEncoding.supportedAlgorithm()).to.eql(true)
      setEncoding("br")
      expect(contentEncoding.supportedAlgorithm()).to.eql(true)
    })

    it("returns false when content-encoding is not a supported algorithm", () => {
      setEncoding("identity")
      expect(contentEncoding.supportedAlgorithm()).to.eql(false)
    })
  })

  describe("#uncompressedBody", () => {
    it("throws an error when the algorithm is not supported", (done) => {
      setEncoding("identity")
      contentEncoding.uncompressedBody(reqRes.body)
      .then(() => done("failed"))
      .catch(() => done())
    })

    it("returns uncompressed when algorithm is gzip", async () => {
      setEncoding("gzip")
      const uncompressedBody = Buffer.from("FOOBAR")
      const body = await zlib.gzipSync(uncompressedBody)

      expect(await contentEncoding.uncompressedBody(body)).to.eql(uncompressedBody)
    })

    it("returns uncompressed when algorithm is deflate", async () => {
      setEncoding("deflate")
      const uncompressedBody = Buffer.from("FOOBAR")
      const body = await zlib.deflateSync(uncompressedBody)

      expect(await contentEncoding.uncompressedBody(body)).to.eql(uncompressedBody)
    })

    it("returns uncompressed when algorithm is br", async () => {
      setEncoding("br")
      const uncompressedBody = Buffer.from("FOOBAR")
      const body = await zlib.brotliCompressSync(uncompressedBody)

      expect(await contentEncoding.uncompressedBody(body)).to.eql(uncompressedBody)
    })
  })

  describe("#compressedBody", () => {
    it("throws an error when the algorithm is not supported", (done) => {
      setEncoding("identity")
      contentEncoding.compressedBody("FOOBAR")
      .then(() => done("failed"))
      .catch(() => done())
    })

    it("returns compressed when algorithm is gzip", async () => {
      setEncoding("gzip")
      const compressed = await zlib.gzipSync("FOOBAR")

      expect(await contentEncoding.compressedBody("FOOBAR")).to.eql(compressed)
    })

    it("returns compressed when algorithm is deflate", async () => {
      setEncoding("deflate")
      const compressed = await zlib.deflateSync("FOOBAR")

      expect(await contentEncoding.compressedBody("FOOBAR")).to.eql(compressed)
    })

    it("returns compressed when algorithm is br", async () => {
      setEncoding("br")
      const compressed = await zlib.brotliCompressSync("FOOBAR")

      expect(await contentEncoding.compressedBody("FOOBAR")).to.eql(compressed)
    })
  })

  function setEncoding(encoding: string) {
    reqRes.headers["content-encoding"] = encoding
  }
})
