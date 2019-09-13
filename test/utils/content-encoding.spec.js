const zlib = require("zlib")
import ContentEncoding from "../../src/utils/content-encoding";

let req, contentEncoding

describe("ContentEncoding", () => {
  beforeEach(() => {
    req = {
      headers: {
        "content-encoding": "gzip"
      },
      body: Buffer.from("FOOBAR")
    }
    contentEncoding = new ContentEncoding(req)
  })

  describe("#isUncompressed", () => {
    it("returns true when there's no content-encoding header", () => {
      req.headers = {}     
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
    })

    it("returns true when content-encoding is not a supported algorithm", () => {
      setEncoding("br")
      expect(contentEncoding.supportedAlgorithm()).to.eql(false)
      setEncoding("identity")
      expect(contentEncoding.supportedAlgorithm()).to.eql(false)
    })
  })

  describe("#uncompressedBody", () => {
    it("throws an error when the algorithm is not supported", (done) => {
      setEncoding("br")
      contentEncoding.uncompressedBody(req.body)
        .then(() => done('failed'))
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
  })

  describe("#compressedBody", () => {
    it("throws an error when the algorithm is not supported", (done) => {
      setEncoding("br")
      contentEncoding.compressedBody(req.body)
        .then(() => done('failed'))
        .catch(() => done())
    })

    it("returns compressed when algorithm is gzip", async () => {
      setEncoding("gzip")
      const uncompressedBody = Buffer.from("FOOBAR")
      const compressed = await zlib.gzipSync(uncompressedBody)

      expect(await contentEncoding.compressedBody(uncompressedBody)).to.eql(compressed)
    })

    it("returns compressed when algorithm is deflate", async () => {
      setEncoding("deflate")
      const uncompressedBody = Buffer.from("FOOBAR")
      const compressed = await zlib.deflateSync(uncompressedBody)

      expect(await contentEncoding.compressedBody(uncompressedBody)).to.eql(compressed)
    })
  })

  function setEncoding(encoding) {
    req.headers["content-encoding"] = encoding
  }
})