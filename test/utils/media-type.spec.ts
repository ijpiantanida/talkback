import MediaType from "../../src/utils/media-type"
import {expect} from "chai"

describe("MediaType", () => {
  describe("#isHumanReadable", () => {
    it("returns true when the content-type is human readable and there's no content-encoding", () => {
      const res = {
        headers: {
          "content-type": ["application/json"]
        },
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })

    it("returns false when content-type is not present", () => {
      const res = {
        headers: {},
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })

    it("returns false when the content-type is not human readable", () => {
      const res = {
        headers: {
          "content-type": ["img/png"]
        },
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })

    it("returns true when the content-type is human readable and the content-encoding is identity", () => {
      const res = {
        headers: {
          "content-encoding": ["identity"],
          "content-type": ["application/json"]
        },
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })
  })

  describe("#isJSON", () => {
    it("retunrs true when content-type is JSON", () => {
      const res = {
        headers: {
          "content-type": ["application/json"]
        },
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.true
    })

    it("returns false when content-type is not JSON", () => {
      const res = {
        headers: {
          "content-type": ["text/html"]
        },
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.false
    })

    it("returns false when content-type is not set", () => {
      const res = {
        headers: {},
        body: Buffer.from("FOO")
      }

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.false
    })
  })
})
