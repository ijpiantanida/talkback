import MediaType from "../../src/utils/media-type"
import {expect} from "chai"
import Factories from "../support/factories"

describe("MediaType", () => {
  describe("#isHumanReadable", () => {
    it("returns true when the content-type is human readable and there's no content-encoding", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["application/json"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })

    it("returns false when content-type is not present", () => {
      const res = Factories.reqRes({
        headers: {}
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })

    it("returns false when the content-type is not human readable", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["img/png"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.false
    })

    it("returns true when content-type is JSON Schema", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["application/some-schema+json"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isHumanReadable()).to.be.true
    })
  })

  describe("#isJSON", () => {
    it("returns true when content-type is JSON", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["application/json"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.true
    })

    it("returns true when content-type is JSON Schema", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["application/some-schema+json"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.true
    })

    it("returns false when content-type is not JSON", () => {
      const res = Factories.reqRes({
        headers: {
          "content-type": ["text/html"]
        }
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.false
    })

    it("returns false when content-type is not set", () => {
      const res = Factories.reqRes({
        headers: {}
      })

      const mediaType = new MediaType(res)
      expect(mediaType.isJSON()).to.be.false
    })
  })
})
